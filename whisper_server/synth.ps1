param(
    [string]$text,
    [string]$outPath
)
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SetOutputToWaveFile($outPath)
$s.Speak($text)
$s.Dispose()
Write-Host "Generated: $outPath"
