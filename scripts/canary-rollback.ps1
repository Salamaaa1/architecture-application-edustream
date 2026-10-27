param(
    [string]$Url = "https://architecture-application-edustream.vercel.app/api/version",
    [int]$StableNeeded = 30,
    [int]$MaxSeconds = 300
)

# Mesure le delai d'un rollback : lancez ce script juste AVANT de couper le flag
# (ou de remettre le pourcentage a 0), puis coupez-le pendant qu'il tourne.
# Le script envoie une requete par seconde (sans cookie : nouveau visiteur a chaque fois)
# et s'arrete quand il a vu $StableNeeded reponses stables d'affilee.
$start = Get-Date
$streak = 0
$lastBad = $null
$first = $true

Write-Host "Surveillance de $Url (Ctrl+C pour arreter)"
while ($true) {
    $t = [math]::Round(((Get-Date) - $start).TotalSeconds, 1)
    if ($t -gt $MaxSeconds) { Write-Host "Delai maximal atteint."; break }

    $state = "erreur"
    try {
        $r = Invoke-RestMethod -Uri $Url -TimeoutSec 30
        if (-not $r.backendVersion) { $state = "panne" }
        elseif ($r.target -eq "canary") { $state = "canary" }
        else { $state = "stable" }
    } catch { }

    Write-Host ("t = {0,6} s   {1,-7}  (streak stable : {2})" -f $t, $state, $streak)

    if ($state -eq "stable") { $streak++ } else { $streak = 0; $lastBad = $t }
    if ($streak -ge $StableNeeded) { break }
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "=========== RESULTAT ROLLBACK ==========="
if ($null -eq $lastBad) {
    Write-Host "Aucune reponse canary ou en panne observee pendant la surveillance."
} else {
    Write-Host ("Derniere reponse canary / panne vue a t = {0} s" -f $lastBad)
    Write-Host ("Trafic 100 % stable ensuite ({0} reponses stables d'affilee)" -f $StableNeeded)
}
