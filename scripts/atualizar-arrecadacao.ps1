#Requires -Version 7.0
<#
    Autoservico de atualizacao do progresso de arrecadacao (site "Mirella na Franca").

    O que este script faz:
      1. Garante que a conta do GitHub CLI ativa e "miborim" (troca se necessario e
         volta para a conta original no final).
      2. Garante que estamos na branch "develop", atualizada com o remoto.
      3. Mostra o progresso atual (valor, percentual e barra).
      4. Pergunta quanto voce quer adicionar, permitindo confirmar, editar e
         adicionar varios valores antes de finalizar.
      5. Ao finalizar, mostra um resumo (quanto esta adicionando, quanto era,
         quanto vai ficar - em R$ e em %), atualiza o arquivo da campanha,
         faz commit + push na "develop" e abre (ou reaproveita) um Pull Request
         de "develop" para "main", te enviando o link.

    Uso normal:  duvlo clique no atalho da area de trabalho (ou rode este arquivo).
    Modo teste:  pwsh -File atualizar-arrecadacao.ps1 -DryRun
                 (mostra tudo, mas NAO altera o arquivo nem mexe em git/gh)
#>

param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ----------------------------------------------------------------------------
# Configuracao
# ----------------------------------------------------------------------------
$RepoPath      = Split-Path -Parent $PSScriptRoot
$CampaignFile  = Join-Path $RepoPath "src\data\campaign.js"
$TargetGhUser  = "miborim"
$BaseBranch    = "main"
$WorkBranch    = "develop"
$BarWidth      = 36

# ----------------------------------------------------------------------------
# Utilitarios de exibicao
# ----------------------------------------------------------------------------
function Write-Rule([string]$color = "DarkCyan") {
    Write-Host ("=" * 64) -ForegroundColor $color
}

function Write-Banner([string]$title) {
    Write-Host ""
    Write-Rule
    Write-Host ("  " + $title) -ForegroundColor Cyan
    Write-Rule
}

function Format-BRL([double]$value) {
    $rounded = [math]::Round($value, 2)
    $temCentavos = [math]::Round($rounded - [math]::Truncate($rounded), 2) -ne 0
    $fmt = if ($temCentavos) { "N2" } else { "N0" }
    $s = $rounded.ToString($fmt, [System.Globalization.CultureInfo]::InvariantCulture)
    # InvariantCulture usa "," para milhar e "." para decimal; trocamos para o padrao pt-BR (1.234,56)
    $s = $s.Replace(",", "§").Replace(".", ",").Replace("§", ".")
    return "R`$ $s"
}

function Format-NumeroJs([double]$value) {
    # Escreve o numero no formato aceito por JS (ponto como separador decimal, sem milhar)
    $rounded = [math]::Round($value, 2)
    if ($rounded -eq [math]::Truncate($rounded)) {
        return [string][int64]$rounded
    }
    return $rounded.ToString("0.##", [System.Globalization.CultureInfo]::InvariantCulture)
}

function Get-Percent([double]$value, [double]$meta) {
    if ($meta -le 0) { return 0 }
    return [math]::Round(($value / $meta) * 100, 1)
}

function Write-ProgressBlock([string]$label, [double]$value, [double]$meta, [string]$color) {
    $percent = Get-Percent $value $meta
    $clamped = [math]::Max(0, [math]::Min(100, $percent))
    $filled = [int][math]::Round($BarWidth * $clamped / 100)
    $empty = $BarWidth - $filled
    $bar = ([string][char]0x2588 * $filled) + ([string][char]0x2591 * $empty)

    Write-Host ""
    Write-Host "  $label" -ForegroundColor White
    Write-Host ("    " + (Format-BRL $value) + "  de  " + (Format-BRL $meta)) -ForegroundColor Gray
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host $bar -NoNewline -ForegroundColor $color
    Write-Host "] " -NoNewline -ForegroundColor DarkGray
    Write-Host ("$percent%") -ForegroundColor $color
}

# ----------------------------------------------------------------------------
# Entrada do usuario
# ----------------------------------------------------------------------------
function Test-CancelWord([string]$raw) {
    return $raw.Trim().ToLower() -in @("sair", "cancelar", "exit", "quit")
}

function Read-LineCancelable {
    # Em modo interativo real, permite cancelar a qualquer momento apertando ESC.
    # Quando a entrada vem redirecionada/piped (ex.: testes automatizados), cai
    # no Read-Host normal, onde digitar 'sair'/'cancelar'/'exit'/'quit' cancela.
    if ([Console]::IsInputRedirected) {
        $line = Read-Host
        if (Test-CancelWord $line) { throw [System.Exception]::new("CANCELLED") }
        return $line
    }

    $buffer = New-Object System.Text.StringBuilder
    while ($true) {
        $key = [Console]::ReadKey($true)
        if ($key.Key -eq [ConsoleKey]::Escape) {
            Write-Host ""
            throw [System.Exception]::new("CANCELLED")
        }
        if ($key.Key -eq [ConsoleKey]::Enter) {
            Write-Host ""
            $result = $buffer.ToString()
            if (Test-CancelWord $result) { throw [System.Exception]::new("CANCELLED") }
            return $result
        }
        if ($key.Key -eq [ConsoleKey]::Backspace) {
            if ($buffer.Length -gt 0) {
                $buffer.Length = $buffer.Length - 1
                Write-Host "`b `b" -NoNewline
            }
            continue
        }
        if (-not [char]::IsControl($key.KeyChar)) {
            [void]$buffer.Append($key.KeyChar)
            Write-Host $key.KeyChar -NoNewline
        }
    }
}

function Read-YesNo([string]$question, [bool]$defaultYes = $true) {
    $suffix = if ($defaultYes) { "[S/n]" } else { "[s/N]" }
    while ($true) {
        Write-Host "  $question $suffix " -NoNewline -ForegroundColor Yellow
        $resp = Read-LineCancelable
        if ([string]::IsNullOrWhiteSpace($resp)) { return $defaultYes }
        $r = $resp.Trim().ToLower()
        if ($r -in @("s", "sim", "y", "yes")) { return $true }
        if ($r -in @("n", "nao", "não", "no")) { return $false }
        Write-Host "  Nao entendi. Responda com S ou N (ou ESC/'sair' para cancelar)." -ForegroundColor Red
    }
}

function Convert-ToAmount([string]$raw) {
    $raw = $raw.Trim()
    if ($raw -eq "") { return $null }
    $raw = $raw -replace "[Rr]\$", "" -replace "\s", ""
    if ($raw -eq "") { return $null }

    $hasComma = $raw.Contains(",")
    $hasDot   = $raw.Contains(".")

    if ($hasComma -and $hasDot) {
        # Os dois separadores aparecem: o ultimo a aparecer e o decimal.
        # Ex.: "1.234,56" (decimal = ,) ou "1,234.56" (decimal = .)
        if ($raw.LastIndexOf(",") -gt $raw.LastIndexOf(".")) {
            $raw = $raw.Replace(".", "").Replace(",", ".")
        } else {
            $raw = $raw.Replace(",", "")
        }
    } elseif ($hasComma) {
        $depoisDaVirgula = ($raw -split ",")[-1]
        if ($depoisDaVirgula.Length -eq 3) {
            # Ex.: "1,500" -> separador de milhar -> 1500
            $raw = $raw.Replace(",", "")
        } else {
            # Ex.: "100,50" -> separador decimal -> 100.50
            $raw = $raw.Replace(",", ".")
        }
    } elseif ($hasDot) {
        $depoisDoPonto = ($raw -split "\.")[-1]
        if ($depoisDoPonto.Length -eq 3) {
            # Ex.: "1.500" -> separador de milhar -> 1500
            $raw = $raw.Replace(".", "")
        }
        # Senao (ex.: "100.50"), mantem o ponto como separador decimal.
    }

    $value = 0.0
    $ok = [double]::TryParse(
        $raw,
        [System.Globalization.NumberStyles]::Any,
        [System.Globalization.CultureInfo]::InvariantCulture,
        [ref]$value
    )
    if ($ok) { return [math]::Round($value, 2) }
    return $null
}

function Read-PositiveAmount([string]$question) {
    while ($true) {
        Write-Host "  $question " -NoNewline -ForegroundColor Yellow
        $raw = Read-LineCancelable
        $val = Convert-ToAmount $raw
        if ($null -eq $val -or $val -le 0) {
            Write-Host "  Valor invalido. Digite um numero maior que zero (ex.: 100 ou 100,50) ou ESC/'sair' para cancelar." -ForegroundColor Red
            continue
        }
        return $val
    }
}

function Get-ConfirmedAmount([string]$prompt) {
    $amount = Read-PositiveAmount $prompt
    while ($true) {
        Write-Host ""
        Write-Host "  Voce quer adicionar " -NoNewline
        Write-Host (Format-BRL $amount) -NoNewline -ForegroundColor Green
        Write-Host " ?"
        $ok = Read-YesNo "  Confirma esse valor?" $true
        if ($ok) { return $amount }
        $amount = Read-PositiveAmount "  Ok, digite o valor correto (R`$):"
    }
}

function Show-EntriesSummary($entries) {
    Write-Host ""
    Write-Host "  Valores adicionados nesta sessao:" -ForegroundColor DarkCyan
    for ($i = 0; $i -lt $entries.Count; $i++) {
        $marker = if ($i -eq $entries.Count - 1) { "  (ultimo)" } else { "" }
        Write-Host ("    " + ($i + 1) + ". " + (Format-BRL $entries[$i]) + $marker)
    }
    $soma = ($entries | Measure-Object -Sum).Sum
    Write-Host ("  Subtotal desta sessao: " + (Format-BRL $soma)) -ForegroundColor Green
}

# ----------------------------------------------------------------------------
# Dados da campanha
# ----------------------------------------------------------------------------
function Get-CampaignData([string]$path) {
    if (-not (Test-Path $path)) {
        throw "Arquivo nao encontrado: $path"
    }
    $content = Get-Content -Raw -Path $path -Encoding UTF8
    $arrecadadoMatch = [regex]::Match($content, "arrecadado:\s*([0-9]+(?:\.[0-9]+)?)")
    $metaMatch = [regex]::Match($content, "meta:\s*([0-9]+(?:\.[0-9]+)?)")
    $dataMatch = [regex]::Match($content, 'atualizadoEm:\s*"([^"]*)"')
    if (-not $arrecadadoMatch.Success -or -not $metaMatch.Success) {
        throw "Nao foi possivel localizar 'arrecadado' ou 'meta' em $path"
    }
    [PSCustomObject]@{
        Content      = $content
        Arrecadado   = [double]$arrecadadoMatch.Groups[1].Value
        Meta         = [double]$metaMatch.Groups[1].Value
        AtualizadoEm = $(if ($dataMatch.Success) { $dataMatch.Groups[1].Value } else { "" })
    }
}

function Get-UpdatedCampaignContent([string]$content, [double]$novoValor, [string]$novaData) {
    $novoValorStr = Format-NumeroJs $novoValor
    $result = [regex]::Replace($content, "(?<=arrecadado:\s*)[0-9]+(?:\.[0-9]+)?", { $novoValorStr })
    $result = [regex]::Replace($result, '(?<=atualizadoEm:\s*")[^"]*(?=")', { $novaData })
    return $result
}

function Get-DataDeAgora {
    $agora = Get-Date
    $aChar = [string][char]0x00E0
    return $agora.ToString("dd/MM/yyyy") + ", " + $aChar + "s " + $agora.ToString("HH") + "h" + $agora.ToString("mm")
}

# ==============================================================================
# INICIO
# ==============================================================================
Write-Host ""
Write-Rule "DarkYellow"
Write-Host "   ATUALIZACAO DA ARRECADACAO - Mirella na Franca" -ForegroundColor Yellow
Write-Rule "DarkYellow"
if ($DryRun) {
    Write-Host "   (MODO TESTE: nada sera salvo, commitado ou publicado)" -ForegroundColor DarkGray
}
Write-Host ""
Write-Host "   Dica: aperte ESC (ou digite 'sair') a qualquer momento para cancelar tudo sem salvar nada." -ForegroundColor DarkGray

$originalGhUser  = $null
$switchedAccount = $false
$originalBranch  = $null
$didPushLocation = $false

try {
    if (-not $DryRun) {
        # --- Conta do GitHub CLI -------------------------------------------------
        try { $originalGhUser = (gh api user --jq ".login" 2>$null).Trim() } catch { $originalGhUser = $null }

        if ($originalGhUser -and $originalGhUser -ne $TargetGhUser) {
            Write-Host ""
            Write-Host "Trocando conta do GitHub CLI: '$originalGhUser' -> '$TargetGhUser'..." -ForegroundColor Cyan
            gh auth switch --hostname github.com --user $TargetGhUser | Out-Null
            $switchedAccount = $true
        } elseif ($originalGhUser -eq $TargetGhUser) {
            Write-Host ""
            Write-Host "Conta do GitHub CLI ja e '$TargetGhUser'." -ForegroundColor DarkGray
        } else {
            Write-Host ""
            Write-Host "Aviso: nao foi possivel confirmar a conta ativa do GitHub CLI." -ForegroundColor Red
        }

        gh auth setup-git --hostname github.com 2>$null | Out-Null

        # --- Repositorio / branch -------------------------------------------------
        Push-Location $RepoPath
        $didPushLocation = $true

        try { $originalBranch = (git rev-parse --abbrev-ref HEAD).Trim() } catch { $originalBranch = $null }

        $statusLines = git status --porcelain
        $otherDirty = $statusLines | Where-Object { $_ -notmatch [regex]::Escape("src/data/campaign.js") }
        if ($otherDirty) {
            Write-Host ""
            Write-Host "Atencao: existem outras alteracoes nao commitadas no repositorio:" -ForegroundColor Red
            $otherDirty | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
            $prosseguir = Read-YesNo "Deseja continuar mesmo assim? (so o arquivo da campanha sera commitado)" $false
            if (-not $prosseguir) { throw [System.Exception]::new("CANCELLED") }
        }

        Write-Host ""
        Write-Host "Sincronizando a branch '$WorkBranch'..." -ForegroundColor Cyan
        git fetch origin --quiet
        git checkout $WorkBranch --quiet 2>$null
        git pull origin $WorkBranch --ff-only --quiet
    }

    # --- Le estado atual da campanha --------------------------------------------
    $data = Get-CampaignData $CampaignFile

    Write-Banner "Progresso atual"
    Write-ProgressBlock "Arrecadacao" $data.Arrecadado $data.Meta "Yellow"
    Write-Host ""
    Write-Host ("  Ultima atualizacao: " + $data.AtualizadoEm) -ForegroundColor Gray

    # --- Loop de entrada de valores ----------------------------------------------
    $entries = New-Object System.Collections.Generic.List[double]
    $entries.Add((Get-ConfirmedAmount "`nQuanto voce quer adicionar agora? (R`$)"))

    :reviewLoop while ($true) {
        :menuLoop while ($true) {
            Show-EntriesSummary $entries
            Write-Host ""
            Write-Host "  O que deseja fazer?" -ForegroundColor Cyan
            Write-Host "   [1] Adicionar mais um valor"
            Write-Host ("   [2] Editar o ultimo valor adicionado (" + (Format-BRL $entries[$entries.Count - 1]) + ")")
            Write-Host "   [3] Finalizar e revisar"
            Write-Host "  Escolha (1/2/3): " -NoNewline -ForegroundColor Yellow
            $choice = Read-LineCancelable

            switch ($choice.Trim()) {
                "1" {
                    $entries.Add((Get-ConfirmedAmount "`nQuanto voce quer adicionar agora? (R`$)"))
                }
                "2" {
                    $novoValor = Get-ConfirmedAmount "`nNovo valor para o ultimo item (R`$):"
                    $entries[$entries.Count - 1] = $novoValor
                }
                "3" { break menuLoop }
                default { Write-Host "  Opcao invalida." -ForegroundColor Red }
            }
        }

        $soma = [math]::Round((($entries | Measure-Object -Sum).Sum), 2)
        $valorAntigo = $data.Arrecadado
        $valorNovo = [math]::Round($valorAntigo + $soma, 2)

        Write-Banner "Confirmacao final"
        Write-Host ""
        Write-Host "  Voce esta adicionando: " -NoNewline
        Write-Host (Format-BRL $soma) -ForegroundColor Green
        Write-ProgressBlock "Antes" $valorAntigo $data.Meta "DarkYellow"
        Write-ProgressBlock "Depois" $valorNovo $data.Meta "Green"

        $finalOk = Read-YesNo "`n  Confirma esta atualizacao?" $true
        if ($finalOk) { break reviewLoop }
        Write-Host "  Ok, vamos revisar de novo." -ForegroundColor DarkGray
    }

    $novaData = Get-DataDeAgora

    if ($DryRun) {
        $preview = Get-UpdatedCampaignContent $data.Content $valorNovo $novaData
        $previewArrecadado = [regex]::Match($preview, "arrecadado:\s*[0-9]+(?:\.[0-9]+)?").Value
        $previewData = [regex]::Match($preview, 'atualizadoEm:\s*"[^"]*"').Value

        Write-Banner "Preview (DryRun) - nada foi salvo"
        Write-Host ("  " + $previewArrecadado)
        Write-Host ("  " + $previewData)
        Write-Host ""
        Write-Host "Modo teste concluido. Nenhuma alteracao real, commit ou PR foi feito." -ForegroundColor DarkGray
    } else {
        Write-Banner "Publicando atualizacao"

        $freshData = Get-CampaignData $CampaignFile
        if ($freshData.Arrecadado -ne $valorAntigo) {
            Write-Host ""
            Write-Host ("Aviso: o valor no repositorio mudou para " + (Format-BRL $freshData.Arrecadado) + " desde o inicio desta sessao. Recalculando...") -ForegroundColor Yellow
            $valorAntigo = $freshData.Arrecadado
            $valorNovo = [math]::Round($valorAntigo + $soma, 2)
        }

        $novoContent = Get-UpdatedCampaignContent $freshData.Content $valorNovo $novaData
        Set-Content -Path $CampaignFile -Value $novoContent -NoNewline -Encoding UTF8

        git add -- $CampaignFile
        $commitMsg = "Atualiza arrecadacao: " + (Format-BRL $valorAntigo) + " -> " + (Format-BRL $valorNovo) + " (" + $novaData + ")"
        git commit -m $commitMsg --quiet
        git push origin $WorkBranch --quiet

        Write-Host ""
        Write-Host "Alteracoes publicadas na branch '$WorkBranch'." -ForegroundColor Green

        Write-Host "Verificando Pull Request existente..." -ForegroundColor Cyan
        $existingPr = gh pr list --base $BaseBranch --head $WorkBranch --state open --json url --jq ".[0].url" 2>$null
        if ($existingPr -and $existingPr.Trim() -ne "") {
            $prUrl = $existingPr.Trim()
            Write-Host "Pull Request existente foi atualizado automaticamente com este commit." -ForegroundColor Green
        } else {
            $percentAntigo = Get-Percent $valorAntigo $freshData.Meta
            $percentNovo = Get-Percent $valorNovo $freshData.Meta
            $prTitle = "Atualiza arrecadacao: " + (Format-BRL $valorNovo) + " (" + $percentNovo + "%)"
            $prBody = "Atualizacao automatica via script de autoservico.`n`n" +
                      "- Antes: " + (Format-BRL $valorAntigo) + " (" + $percentAntigo + "%)`n" +
                      "- Depois: " + (Format-BRL $valorNovo) + " (" + $percentNovo + "%)`n" +
                      "- Data: " + $novaData
            $prUrl = gh pr create --base $BaseBranch --head $WorkBranch --title $prTitle --body $prBody 2>$null
            Write-Host "Pull Request criado." -ForegroundColor Green
        }

        Write-Host ""
        Write-Rule "Magenta"
        Write-Host "  Pull Request: $prUrl" -ForegroundColor Magenta
        Write-Rule "Magenta"
        try { Set-Clipboard -Value $prUrl; Write-Host "  (link copiado para a area de transferencia)" -ForegroundColor DarkGray } catch {}
    }
}
catch {
    if ($_.Exception.Message -eq "CANCELLED") {
        Write-Host ""
        Write-Host "Operacao cancelada. Nenhuma alteracao foi feita." -ForegroundColor DarkYellow
    } else {
        Write-Host ""
        Write-Host "Ocorreu um erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}
finally {
    if ($didPushLocation) {
        if ($originalBranch -and $originalBranch -ne $WorkBranch) {
            git checkout $originalBranch --quiet 2>$null
        }
        Pop-Location
    }
    if ($switchedAccount -and $originalGhUser) {
        Write-Host ""
        Write-Host "Restaurando conta original do GitHub CLI ('$originalGhUser')..." -ForegroundColor Cyan
        gh auth switch --hostname github.com --user $originalGhUser | Out-Null
    }
    Write-Host ""
    Read-Host "Pressione Enter para fechar"
}
