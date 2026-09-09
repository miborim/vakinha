#Requires -Version 7.0
<#
    Cria (ou recria) o atalho "Atualizar arrecadacao" na area de trabalho,
    apontando para o script de autoservico.

    Uso:  pwsh -File scripts/criar-atalho.ps1
#>

param(
    [string]$Nome = "Atualizar arrecadacao"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$RepoPath   = Split-Path -Parent $PSScriptRoot
$ScriptPath = Join-Path $RepoPath "scripts\atualizar-arrecadacao.ps1"
$FaviconPng = Join-Path $RepoPath "public\favicon.png"
$IconPath   = Join-Path $RepoPath "scripts\atalho.ico"
$Desktop    = [Environment]::GetFolderPath("Desktop")
$LnkPath    = Join-Path $Desktop "$Nome.lnk"

if (-not (Test-Path $ScriptPath)) {
    throw "Nao encontrei o script em '$ScriptPath'."
}

# Caminho estavel do PowerShell 7: o executavel real fica numa pasta que muda a
# cada atualizacao, entao usamos o "alias" do Windows, que sempre aponta para a
# versao instalada. Se nao existir, caimos no caminho real.
$Pwsh = Join-Path $env:LOCALAPPDATA "Microsoft\WindowsApps\pwsh.exe"
if (-not (Test-Path $Pwsh)) {
    $cmd = Get-Command pwsh -ErrorAction SilentlyContinue
    if (-not $cmd) { throw "Nao encontrei o PowerShell 7 (pwsh). Instale em https://aka.ms/powershell" }
    $Pwsh = $cmd.Source
}

# --- Icone -------------------------------------------------------------------
# Monta um .ico a partir do favicon do site. Formato ICO com PNG embutido
# (suportado do Windows Vista em diante), que evita perda de qualidade.
if (Test-Path $FaviconPng) {
    Add-Type -AssemblyName System.Drawing

    $origem = [System.Drawing.Image]::FromFile($FaviconPng)
    try {
        $bmp = New-Object System.Drawing.Bitmap 256, 256
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.DrawImage($origem, 0, 0, 256, 256)
        $g.Dispose()

        $ms = New-Object System.IO.MemoryStream
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $pngBytes = $ms.ToArray()
        $ms.Dispose()
        $bmp.Dispose()
    }
    finally { $origem.Dispose() }

    $fs = [System.IO.File]::Create($IconPath)
    $bw = New-Object System.IO.BinaryWriter($fs)
    try {
        $bw.Write([uint16]0)   # reservado
        $bw.Write([uint16]1)   # tipo: 1 = icone
        $bw.Write([uint16]1)   # quantidade de imagens
        $bw.Write([byte]0)     # largura 0 = 256
        $bw.Write([byte]0)     # altura  0 = 256
        $bw.Write([byte]0)     # cores da paleta
        $bw.Write([byte]0)     # reservado
        $bw.Write([uint16]1)   # planos
        $bw.Write([uint16]32)  # bits por pixel
        $bw.Write([uint32]$pngBytes.Length)
        $bw.Write([uint32]22)  # offset dos dados
        $bw.Write($pngBytes)
    }
    finally { $bw.Dispose(); $fs.Dispose() }
}

# --- Atalho ------------------------------------------------------------------
$shell = New-Object -ComObject WScript.Shell
$lnk = $shell.CreateShortcut($LnkPath)
$lnk.TargetPath       = $Pwsh
$lnk.Arguments        = '-NoLogo -ExecutionPolicy Bypass -File "' + $ScriptPath + '"'
$lnk.WorkingDirectory = $RepoPath
$lnk.Description      = "Atualiza o valor arrecadado do site da campanha"
if (Test-Path $IconPath) { $lnk.IconLocation = "$IconPath,0" }
$lnk.WindowStyle      = 1
$lnk.Save()
[void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($shell)

Write-Host ""
Write-Host "Atalho criado na area de trabalho:" -ForegroundColor Green
Write-Host "  $LnkPath" -ForegroundColor Green
Write-Host ""
Write-Host "  Aponta para: $ScriptPath" -ForegroundColor DarkGray
Write-Host "  Basta dar dois cliques para atualizar a arrecadacao." -ForegroundColor DarkGray
Write-Host ""
