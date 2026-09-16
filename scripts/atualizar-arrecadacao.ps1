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
      6. Pergunta se voce quer publicar agora: se sim, aprova o Pull Request,
         acompanha a publicacao e confirma que o site ja mostra o valor novo.

    Se qualquer passo do git/gh falhar, o script AVISA e desfaz o que fez,
    em vez de dizer que deu certo sem ter publicado nada.

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
$SiteUrl       = "https://miborim.github.io/vakinha/"
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

function Format-Percent([double]$percent) {
    # Mesma formatacao que o site usa (pt-BR, ate 1 casa decimal): 38,1%
    $s = $percent.ToString("0.#", [System.Globalization.CultureInfo]::InvariantCulture)
    return $s.Replace(".", ",")
}

# ----------------------------------------------------------------------------
# Execucao segura de comandos externos
# ----------------------------------------------------------------------------
function Invoke-Git {
    <#
        Roda o git e ABORTA se ele falhar. Sem isso, uma falha de push ou de pull
        passaria despercebida e o script anunciaria sucesso sem ter publicado nada.
    #>
    param(
        [Parameter(Mandatory)][string[]]$GitArgs,
        [string]$Explicacao
    )
    $saida = & git @GitArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
        $detalhe = ($saida | Out-String).Trim()
        $msg = if ($Explicacao) { $Explicacao } else { "Falha ao executar: git $($GitArgs -join ' ')" }
        if ($detalhe) { $msg += "`n`n  O git respondeu:`n    " + ($detalhe -replace "`r?`n", "`n    ") }
        throw $msg
    }
    return $saida
}

function Test-Prerequisitos {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "O 'git' nao foi encontrado. Instale o Git para Windows e tente de novo."
    }
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        throw "O 'gh' (GitHub CLI) nao foi encontrado. Instale em https://cli.github.com e tente de novo."
    }
    gh auth status --hostname github.com 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Voce nao esta autenticada no GitHub CLI. Rode 'gh auth login' e tente de novo."
    }

    # A identidade do git nao vem junto no clone (fica no .git/config, que e local).
    # Sem ela, o commit falharia so la na frente, no meio da atualizacao.
    $gitNome  = (& git config user.name)
    $gitEmail = (& git config user.email)
    if ([string]::IsNullOrWhiteSpace($gitNome) -or [string]::IsNullOrWhiteSpace($gitEmail)) {
        throw ("O git ainda nao sabe quem e voce (isso acontece em computador novo).`n" +
               "  Nada foi alterado. Abra o terminal e rode uma vez:`n" +
               "    git config --global user.name `"Mirella Borim`"`n" +
               "    git config --global user.email `"miborim@users.noreply.github.com`"`n" +
               "  Depois e so abrir o atalho de novo.")
    }
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
    Write-Host ((Format-Percent $percent) + "%") -ForegroundColor $color
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
        $line = [Console]::In.ReadLine()
        if ($null -eq $line) { throw [System.Exception]::new("CANCELLED") }
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
    if ($DryRun) {
        # No modo teste nada e publicado, entao uma pendencia de configuracao nao
        # impede o preview. Ainda assim avisamos, porque o modo teste tambem serve
        # para conferir se o computador esta pronto (ex.: maquina nova).
        try {
            Test-Prerequisitos
            Write-Host ""
            Write-Host "   Configuracao do computador: tudo certo." -ForegroundColor DarkGray
        }
        catch {
            Write-Host ""
            Write-Host "   Atencao: falta configurar algo neste computador." -ForegroundColor Yellow
            Write-Host "   O modo teste continua, mas a atualizacao de verdade nao funcionaria ainda:" -ForegroundColor Yellow
            $_.Exception.Message -split "`n" | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
        }
    }

    if (-not $DryRun) {
        Test-Prerequisitos

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
        Invoke-Git @("fetch", "origin", "--quiet") -Explicacao "Nao consegui buscar as novidades do GitHub. Verifique sua conexao com a internet."

        $existeRemota = (& git ls-remote --heads origin $WorkBranch) -ne $null -and $LASTEXITCODE -eq 0
        if (-not $existeRemota) {
            throw "A branch '$WorkBranch' nao existe no GitHub. Avise quem cuida do repositorio."
        }

        Invoke-Git @("checkout", $WorkBranch, "--quiet") -Explicacao "Nao consegui mudar para a branch '$WorkBranch'."

        # Compara o historico local com o do GitHub antes de mexer em qualquer coisa.
        $contagem = (& git rev-list --left-right --count "$WorkBranch...origin/$WorkBranch") -split '\s+'
        $aFrente = [int]$contagem[0]
        $atras   = [int]$contagem[1]

        if ($aFrente -gt 0 -and $atras -gt 0) {
            throw ("A branch '$WorkBranch' do seu computador e a do GitHub seguiram caminhos diferentes " +
                   "($aFrente commit(s) so aqui, $atras so no GitHub).`n" +
                   "  Nada foi alterado. Para resolver, abra o terminal nesta pasta e rode:`n" +
                   "    git checkout $WorkBranch`n" +
                   "    git reset --hard origin/$WorkBranch`n" +
                   "  (isso descarta alteracoes locais nao publicadas desta branch)")
        }
        if ($atras -gt 0) {
            Invoke-Git @("merge", "--ff-only", "origin/$WorkBranch", "--quiet") -Explicacao "Nao consegui atualizar a branch '$WorkBranch' com o que esta no GitHub."
            Write-Host "  Branch atualizada com o GitHub ($atras commit(s) novo(s))." -ForegroundColor DarkGray
        }
        if ($aFrente -gt 0) {
            Write-Host "  Aviso: existe(m) $aFrente commit(s) aqui que ainda nao foram enviados ao GitHub. Serao enviados junto." -ForegroundColor Yellow
        }

        # --- Atualizacao registrada mas nao publicada ----------------------------
        # Se a '$WorkBranch' ja tem um valor diferente da '$BaseBranch', existe uma
        # atualizacao que foi registrada mas nunca foi ao ar (ex.: queda de rede no
        # meio do processo). Sem este aviso, a proxima doacao seria somada em cima
        # de um valor que o site ainda nao mostra, e ninguem perceberia.
        $valorNaBase     = $null
        $valorPendente   = $null
        try {
            Invoke-Git @("fetch", "origin", $BaseBranch, "--quiet") -Explicacao "Falha ao consultar a branch publicada."
            $conteudoBase     = (& git show "origin/${BaseBranch}:src/data/campaign.js") -join "`n"
            $conteudoTrabalho = (& git show "origin/${WorkBranch}:src/data/campaign.js") -join "`n"
            $mBase = [regex]::Match($conteudoBase, "arrecadado:\s*([0-9]+(?:\.[0-9]+)?)")
            $mTrab = [regex]::Match($conteudoTrabalho, "arrecadado:\s*([0-9]+(?:\.[0-9]+)?)")
            if ($mBase.Success -and $mTrab.Success) {
                $valorNaBase   = [double]$mBase.Groups[1].Value
                $valorPendente = [double]$mTrab.Groups[1].Value
            }
        } catch { }

        if ($null -ne $valorPendente -and $valorPendente -ne $valorNaBase) {
            Write-Host ""
            Write-Rule "Yellow"
            Write-Host "  ATENCAO: existe uma atualizacao que ainda NAO esta no site." -ForegroundColor Yellow
            Write-Rule "Yellow"
            Write-Host ("  Ja registrado (mas fora do ar): " + (Format-BRL $valorPendente)) -ForegroundColor Yellow
            Write-Host ("  O site ainda mostra:             " + (Format-BRL $valorNaBase)) -ForegroundColor Yellow
            Write-Host ""
            Write-Host "  Isso costuma acontecer quando a internet cai no meio de uma atualizacao." -ForegroundColor DarkGray
            Write-Host "  Se voce ja tinha lancado essa doacao, NAO lance de novo: e so publicar." -ForegroundColor DarkGray
            Write-Host ""

            if (Read-YesNo "Deseja publicar essa atualizacao agora?" $true) {
                $prPendente = gh pr list --base $BaseBranch --head $WorkBranch --state open --json url --jq ".[0].url" 2>$null
                if (-not $prPendente -or "$prPendente".Trim() -eq "") {
                    $prPendente = gh pr create --base $BaseBranch --head $WorkBranch `
                        --title ("Atualiza arrecadacao: " + (Format-BRL $valorPendente)) `
                        --body "Publicacao de uma atualizacao que ficou registrada sem ir ao ar." 2>&1 | Select-Object -Last 1
                }
                if ("$prPendente" -match "^https://") {
                    $prPendente = "$prPendente".Trim()
                    gh pr merge $prPendente --merge 2>&1 | Out-Null
                    if ($LASTEXITCODE -ne 0) { gh pr merge $prPendente --merge --admin 2>&1 | Out-Null }
                }
                if ($LASTEXITCODE -eq 0) {
                    Write-Host ""
                    Write-Host "  Publicado. O site atualiza em cerca de um minuto." -ForegroundColor Green
                } else {
                    Write-Host ""
                    Write-Host "  Nao consegui publicar automaticamente. Abra:" -ForegroundColor Red
                    Write-Host "  https://github.com/miborim/vakinha/compare/$BaseBranch...$WorkBranch" -ForegroundColor Red
                }
                Write-Host ""
                if (-not (Read-YesNo "Quer continuar e registrar uma NOVA doacao agora?" $false)) {
                    throw [System.Exception]::new("CANCELLED")
                }
            }
        }
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

        # Guarda o conteudo original para poder desfazer se o git/gh falhar.
        $conteudoOriginal = $freshData.Content
        $arquivoAlterado = $false

        $novoContent = Get-UpdatedCampaignContent $freshData.Content $valorNovo $novaData
        Set-Content -Path $CampaignFile -Value $novoContent -NoNewline -Encoding UTF8
        $arquivoAlterado = $true

        # Confere que o arquivo gravado realmente contem o valor esperado,
        # antes de commitar qualquer coisa.
        $conferencia = Get-CampaignData $CampaignFile
        if ($conferencia.Arrecadado -ne $valorNovo -or $conferencia.AtualizadoEm -ne $novaData) {
            Set-Content -Path $CampaignFile -Value $conteudoOriginal -NoNewline -Encoding UTF8
            throw ("A gravacao do arquivo nao ficou como esperado (li de volta " +
                   (Format-BRL $conferencia.Arrecadado) + "). O arquivo foi restaurado e nada foi publicado.")
        }

        try {
            Invoke-Git @("add", "--", $CampaignFile) -Explicacao "Nao consegui preparar o arquivo para o commit."

            $temAlgoParaCommitar = $true
            & git diff --cached --quiet -- $CampaignFile
            if ($LASTEXITCODE -eq 0) { $temAlgoParaCommitar = $false }

            if ($temAlgoParaCommitar) {
                $commitMsg = "Atualiza arrecadacao: " + (Format-BRL $valorAntigo) + " -> " + (Format-BRL $valorNovo) + " (" + $novaData + ")"
                Invoke-Git @("commit", "-m", $commitMsg, "--quiet") -Explicacao "Nao consegui registrar o commit."
            } else {
                Write-Host "Nada mudou no arquivo (o valor ja estava atualizado); seguindo para o envio." -ForegroundColor DarkGray
            }

            Invoke-Git @("push", "origin", $WorkBranch, "--quiet") -Explicacao ("Nao consegui enviar as alteracoes para o GitHub. " +
                "Nada foi publicado. Verifique sua conexao e tente de novo.")
        }
        catch {
            # Desfaz o commit local (se houver) e restaura o arquivo, para nao deixar
            # o repositorio em um estado que atrapalhe a proxima execucao.
            & git reset --hard "origin/$WorkBranch" --quiet 2>&1 | Out-Null
            if ($arquivoAlterado) {
                Set-Content -Path $CampaignFile -Value $conteudoOriginal -NoNewline -Encoding UTF8
            }
            throw
        }

        # Confirma que o commit realmente chegou ao GitHub. Como o push ja deu
        # certo, uma falha aqui costuma ser instabilidade de rede, e nao perda de
        # dados: tentamos algumas vezes e, se ainda assim nao der, seguimos em
        # frente avisando -- abortar aqui deixaria a doacao publicada pela metade
        # (enviada, mas sem Pull Request), que foi exatamente o que ja aconteceu.
        $envioConfirmado = $false
        $ultimoErroFetch = $null
        foreach ($tentativa in 1..3) {
            try {
                Invoke-Git @("fetch", "origin", $WorkBranch, "--quiet") -Explicacao "Falha ao consultar o GitHub."
                $localSha  = (& git rev-parse $WorkBranch).Trim()
                $remotoSha = (& git rev-parse "origin/$WorkBranch").Trim()
                if ($localSha -eq $remotoSha) { $envioConfirmado = $true }
                break
            }
            catch {
                $ultimoErroFetch = $_.Exception.Message
                if ($tentativa -lt 3) {
                    Write-Host ("  Instabilidade de rede ao conferir o envio; tentando de novo ($tentativa/3)...") -ForegroundColor DarkGray
                    Start-Sleep -Seconds (3 * $tentativa)
                }
            }
        }

        Write-Host ""
        if ($envioConfirmado) {
            Write-Host "Alteracoes enviadas e confirmadas na branch '$WorkBranch'." -ForegroundColor Green
        } elseif ($ultimoErroFetch) {
            Write-Host "Alteracoes enviadas ao GitHub, mas nao consegui CONFERIR por instabilidade de rede." -ForegroundColor Yellow
            Write-Host "O envio provavelmente deu certo. Vou seguir e abrir o Pull Request." -ForegroundColor Yellow
        } else {
            throw ("O GitHub respondeu, mas a branch '$WorkBranch' de la nao tem o seu commit.`n" +
                   "  Rode o atalho de novo para reenviar.")
        }

        Write-Host "Verificando Pull Request existente..." -ForegroundColor Cyan
        $existingPr = gh pr list --base $BaseBranch --head $WorkBranch --state open --json url --jq ".[0].url" 2>$null
        if ($existingPr -and $existingPr.Trim() -ne "") {
            $prUrl = $existingPr.Trim()
            Write-Host "Pull Request existente foi atualizado automaticamente com este commit." -ForegroundColor Green
        } else {
            $percentAntigo = Format-Percent (Get-Percent $valorAntigo $freshData.Meta)
            $percentNovo = Format-Percent (Get-Percent $valorNovo $freshData.Meta)
            $prTitle = "Atualiza arrecadacao: " + (Format-BRL $valorNovo) + " (" + $percentNovo + "%)"
            $prBody = "Atualizacao automatica via script de autoservico.`n`n" +
                      "- Antes: " + (Format-BRL $valorAntigo) + " (" + $percentAntigo + "%)`n" +
                      "- Depois: " + (Format-BRL $valorNovo) + " (" + $percentNovo + "%)`n" +
                      "- Data: " + $novaData
            $prUrl = gh pr create --base $BaseBranch --head $WorkBranch --title $prTitle --body $prBody 2>&1 | Select-Object -Last 1
            if ($LASTEXITCODE -ne 0 -or "$prUrl" -notmatch "^https://") {
                throw ("O commit foi enviado com sucesso, mas nao consegui abrir o Pull Request automaticamente.`n" +
                       "  Abra manualmente em: https://github.com/miborim/vakinha/compare/$BaseBranch...$WorkBranch")
            }
            $prUrl = "$prUrl".Trim()
            Write-Host "Pull Request criado." -ForegroundColor Green
        }

        Write-Host ""
        Write-Rule "Magenta"
        Write-Host "  Pull Request: $prUrl" -ForegroundColor Magenta
        Write-Rule "Magenta"
        try { Set-Clipboard -Value $prUrl; Write-Host "  (link copiado para a area de transferencia)" -ForegroundColor DarkGray } catch {}

        # --- Publicar no site -----------------------------------------------------
        # O Pull Request sozinho NAO atualiza o site: ele so vai ao ar quando for
        # aprovado (merge) na branch "main", que e a que o GitHub Pages publica.
        Write-Host ""
        Write-Host "  O site so muda depois que este Pull Request for aprovado." -ForegroundColor DarkGray
        $publicarAgora = Read-YesNo "Deseja publicar no site agora?" $true

        if (-not $publicarAgora) {
            Write-Host ""
            Write-Host "Tudo certo. Quando quiser publicar, abra o link acima e clique em 'Merge pull request'." -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "Publicando..." -ForegroundColor Cyan
            gh pr merge $prUrl --merge 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                gh pr merge $prUrl --merge --admin 2>&1 | Out-Null
            }
            if ($LASTEXITCODE -ne 0) {
                Write-Host ""
                Write-Host "Nao consegui aprovar o Pull Request automaticamente." -ForegroundColor Red
                Write-Host "Nada foi perdido: abra o link acima e clique em 'Merge pull request'." -ForegroundColor Yellow
            } else {
                Write-Host "Pull Request aprovado. Publicando o site (leva cerca de 1 minuto)..." -ForegroundColor Green

                Start-Sleep -Seconds 8
                $runId = gh run list --branch $BaseBranch --limit 1 --json databaseId --jq ".[0].databaseId" 2>$null
                if ($runId) {
                    gh run watch $runId.Trim() --exit-status 2>&1 | Out-Null
                    $publicacaoOk = ($LASTEXITCODE -eq 0)
                } else {
                    $publicacaoOk = $false
                }

                # Confere no ar: o site agora entrega o HTML ja pronto, entao da
                # para procurar o valor diretamente na pagina publicada.
                # O site formata a moeda com espaco nao separavel (U+00A0) entre
                # "R$" e o numero, entao normalizamos os espacos antes de comparar.
                $valorNoSite = Format-BRL $valorNovo
                $alvo = ($valorNoSite -replace '\s+', ' ')
                $confirmado = $false
                foreach ($tentativa in 1..6) {
                    Start-Sleep -Seconds 10
                    try {
                        $html = (Invoke-WebRequest "$SiteUrl`?cb=$(Get-Random)" -UseBasicParsing -TimeoutSec 20).Content
                        $htmlNorm = ($html -replace '[\s\u00A0\u202F]+', ' ')
                        if ($htmlNorm.Contains($alvo)) { $confirmado = $true; break }
                    } catch {}
                }

                Write-Host ""
                if ($confirmado) {
                    Write-Rule "Green"
                    Write-Host ("  PUBLICADO! O site ja mostra " + $valorNoSite + ".") -ForegroundColor Green
                    Write-Host "  $SiteUrl" -ForegroundColor Green
                    Write-Rule "Green"
                } elseif ($publicacaoOk) {
                    Write-Host "A publicacao terminou, mas o site ainda esta mostrando o valor antigo." -ForegroundColor Yellow
                    Write-Host "Isso costuma ser o cache do navegador. Abra $SiteUrl e atualize com Ctrl+F5." -ForegroundColor Yellow
                } else {
                    Write-Host "A aprovacao deu certo, mas nao consegui confirmar a publicacao." -ForegroundColor Yellow
                    Write-Host "Verifique em https://github.com/miborim/vakinha/actions" -ForegroundColor Yellow
                }
            }
        }
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
    if (-not [Console]::IsInputRedirected) {
        Read-Host "Pressione Enter para fechar"
    }
}
