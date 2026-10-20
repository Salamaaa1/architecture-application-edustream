# Script PowerShell pour exécuter facilement les tests Selenium
param(
    [ValidateSet("e2e", "negative", "failing", "all")]
    [string]$Mode = "e2e",

    [ValidateSet("chrome", "edge")]
    [string]$Browser = "chrome",

    [switch]$Headed,
    [string]$Url = "http://localhost:3000"
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "EXECUTION DES TESTS SELENIUM (EDUSTREAM)" -ForegroundColor Cyan
Write-Host "   Mode        : $Mode" -ForegroundColor Cyan
Write-Host "   Navigateur  : $Browser" -ForegroundColor Cyan
Write-Host "   Mode Visible: $Headed" -ForegroundColor Cyan
Write-Host "   URL Cible   : $Url" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$argsList = @("scripts/run-selenium-tests.py", "--mode", $Mode, "--browser", $Browser, "--url", $Url)
if ($Headed) {
    $argsList += "--headed"
}

python @argsList
$code = $LASTEXITCODE

if ($code -eq 0) {
    Write-Host "`n[SUCCES] Tous les tests exécutés se sont terminés conformément aux attentes !" -ForegroundColor Green
} else {
    if ($Mode -eq "failing") {
        Write-Host "`n[NOTE] L'échec ci-dessus est NORMAL et ATTENDU (mode failing : démonstration d'échecs Selenium)." -ForegroundColor Yellow
    } else {
        Write-Host "`n[ECHEC] Certains tests ont échoué." -ForegroundColor Red
    }
}
exit $code
