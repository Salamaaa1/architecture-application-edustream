param(
    [string]$Url = "https://architecture-application-edustream.vercel.app/api/version",
    [int]$Count = 50
)

# Chaque appel est fait sans cookie : c'est un nouveau visiteur, donc un nouveau tirage.
$stable = 0
$canary = 0
$errors = 0
$start = Get-Date

Write-Host "Test canary : $Count requetes sur $Url"
for ($i = 1; $i -le $Count; $i++) {
    try {
        $r = Invoke-RestMethod -Uri $Url -TimeoutSec 60
        if (-not $r.backendVersion) {
            # le frontend a choisi un backend mais celui-ci n'a pas repondu
            $errors++
            Write-Host ("{0,3}/{1}  PANNE   (backend {2} injoignable)" -f $i, $Count, $r.target)
            continue
        }
        if ($r.target -eq "canary") { $canary++ } else { $stable++ }
        Write-Host ("{0,3}/{1}  {2,-7} (backend {3})" -f $i, $Count, $r.target, $r.backendVersion)
    } catch {
        $errors++
        Write-Host ("{0,3}/{1}  erreur : {2}" -f $i, $Count, $_.Exception.Message)
    }
}

$ok = $stable + $canary
$duration = [math]::Round(((Get-Date) - $start).TotalSeconds)
Write-Host ""
Write-Host "=========== RESULTAT ==========="
Write-Host ("stable : {0,3}  ({1} %)" -f $stable, $(if ($ok) { [math]::Round(100 * $stable / $ok, 1) } else { 0 }))
Write-Host ("canary : {0,3}  ({1} %)" -f $canary, $(if ($ok) { [math]::Round(100 * $canary / $ok, 1) } else { 0 }))
Write-Host ("erreurs: {0,3}" -f $errors)
Write-Host ("total  : {0} requetes en {1} s" -f $Count, $duration)
