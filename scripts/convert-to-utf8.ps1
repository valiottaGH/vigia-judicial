# Convierte archivos UTF-16 (LE/BE, con o sin BOM) a UTF-8 sin BOM
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$fixed = 0

Get-ChildItem -Path $root -Recurse -File | Where-Object {
  $_.FullName -notmatch '\\node_modules\\|\\.next\\|\\.git\\'
} | ForEach-Object {
  $path = $_.FullName
  $bytes = [System.IO.File]::ReadAllBytes($path)
  if ($bytes.Length -lt 4) { return }

  $nullCount = ($bytes | Where-Object { $_ -eq 0 }).Count
  if ($nullCount -lt 10) { return }

  $content = $null

  if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) {
    $content = [System.Text.Encoding]::Unicode.GetString($bytes, 2, $bytes.Length - 2)
  }
  elseif ($bytes[0] -eq 0xFE -and $bytes[1] -eq 0xFF) {
    $content = [System.Text.Encoding]::BigEndianUnicode.GetString($bytes, 2, $bytes.Length - 2)
  }
  elseif ($bytes[0] -eq 0 -and $bytes[1] -ne 0) {
    # UTF-16 BE sin BOM (Windows Notepad a veces guarda asi)
    $content = [System.Text.Encoding]::BigEndianUnicode.GetString($bytes)
  }
  elseif ($bytes[0] -ne 0 -and $bytes[1] -eq 0) {
    # UTF-16 LE sin BOM
    $content = [System.Text.Encoding]::Unicode.GetString($bytes)
  }
  else { return }

  [System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
  Write-Host "Fixed: $path"
  $script:fixed++
}

Write-Host "Total convertidos: $fixed"
