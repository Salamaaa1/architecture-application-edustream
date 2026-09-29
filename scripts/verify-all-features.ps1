# Script de vérification automatisé de toutes les fonctionnalités d'EduStream
$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🚀 DEBUT DE LA SUITE DE VERIFICATION AUTOMATISEE EDUSTREAM" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$script:passed = 0
$script:failed = 0

function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$Script
    )
    Write-Host "`n------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host "TEST: $Name" -ForegroundColor Yellow
    try {
        & $Script
        Write-Host "SUCCESS: $Name" -ForegroundColor Green
        $script:passed++
    } catch {
        Write-Host "FAILURE: $Name - Error: $_" -ForegroundColor Red
        $script:failed++
    }
}

# Unique email address per test run for clean repeatability
$uniqueSuffix = [guid]::NewGuid().ToString().Substring(0,6)
$script:testStudentEmail = "nabil.tazi-$uniqueSuffix@example.ma"
$script:testStudentId = ""

# 1. CATALOGUE COURS ET PRIX DH
Test-Step "1. Catalogue des cours et Prix DH" {
    $backendCourses = Invoke-RestMethod -Uri "http://localhost:8080/api/courses" -Method Get -MaximumRedirection 5
    if ($backendCourses.Count -ne 3) { throw "Nombre de cours incorrect" }
    
    $reactCourse = $backendCourses | Where-Object { $_.id -eq "react" }
    if ($reactCourse.price -ne 1490.0) { throw "Prix du cours React incorrect (attendu 1490 DH)" }
    
    Write-Host "  -> Backend 8080 OK: 3 cours trouves (React: $($reactCourse.price) DH)" -ForegroundColor Gray

    $frontendCourses = Invoke-RestMethod -Uri "http://localhost:3000/api/courses" -Method Get -MaximumRedirection 5
    if ($frontendCourses.Count -ne 3) { throw "Frontend Proxy /api/courses a echoue" }
    Write-Host "  -> Frontend Proxy 3000 OK: 3 cours trouves" -ForegroundColor Gray
}

# 2. INSCRIPTION ET CREATION COMPTE ETUDIANT
Test-Step "2. Creation de compte etudiant (Sign-up)" {
    $body = @{
        email = $script:testStudentEmail;
        firstName = "Nabil";
        lastName = "Tazi";
        password = "Password123!"
    } | ConvertTo-Json

    $student = Invoke-RestMethod -Uri "http://localhost:3000/api/students" -Method Post -Body $body -ContentType "application/json" -MaximumRedirection 5
    if (-not $student.id) { throw "ID etudiant non genere" }
    if ($student.email -ne $script:testStudentEmail) { throw "Email non correspondant" }

    $script:testStudentId = $student.id
    Write-Host "  -> Compte cree avec succes ID: $($student.id), Email: $($student.email), Role: $($student.role)" -ForegroundColor Gray
}

# 3. AUTHENTIFICATION / CONNEXION COMPTE ETUDIANT
Test-Step "3. Connexion etudiant (Login)" {
    $loginBody = @{
        email = $script:testStudentEmail;
        password = "Password123!"
    } | ConvertTo-Json

    $loginRes = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -MaximumRedirection 5
    if (-not $loginRes.id) { throw "Connexion echouee" }
    Write-Host "  -> Connexion reussie pour $($loginRes.firstName) $($loginRes.lastName) (ID: $($loginRes.id))" -ForegroundColor Gray
}

# 4. PRE-INSCRIPTION ETAPE 1 (SANS CARTE BANCAIRE)
Test-Step "4. Pre-inscription Etape 1 (Sans paiement)" {
    $step1Body = @{
        courseId = "react";
        studentEmail = $script:testStudentEmail;
        firstName = "Nabil";
        lastName = "Tazi";
        phone = "0612345678"
    } | ConvertTo-Json

    $step1Res = Invoke-RestMethod -Uri "http://localhost:3000/api/enrollments" -Method Post -Body $step1Body -ContentType "application/json" -MaximumRedirection 5
    if (-not $step1Res.success) { throw "Pre-inscription Etape 1 a echoue" }
    Write-Host "  -> Message pre-inscription: $($step1Res.message)" -ForegroundColor Gray
}

# 5. INSCRIPTION COMPLETE ETAPE 2 (AVEC CARTE BANCAIRE & PAIEMENT DH)
Test-Step "5. Inscription complete Etape 2 (Paiement valide)" {
    $step2Body = @{
        courseId = "react";
        studentEmail = $script:testStudentEmail;
        firstName = "Nabil";
        lastName = "Tazi";
        cardData = @{
            cardNumber = "4532012345678901";
            expiryMonth = 12;
            expiryYear = 2028;
            cvv = "123";
            cardholderName = "Nabil Tazi"
        }
    } | ConvertTo-Json

    $step2Res = Invoke-RestMethod -Uri "http://localhost:3000/api/enrollments" -Method Post -Body $step2Body -ContentType "application/json" -MaximumRedirection 5
    if (-not $step2Res.success) { throw "Inscription Etape 2 a echoue" }
    if (-not $step2Res.enrollmentId) { throw "Enrollment ID manquant" }
    Write-Host "  -> Inscription et Paiement valides! ID Inscription: $($step2Res.enrollmentId), ID Paiement: $($step2Res.paymentId)" -ForegroundColor Gray
}

# 6. PROFIL ETUDIANT ET COURS ENROLES
Test-Step "6. Profil etudiant et cours inscrits" {
    $profile = Invoke-RestMethod -Uri "http://localhost:3000/api/students/$($script:testStudentId)" -Method Get -MaximumRedirection 5
    if ($profile.enrolledCourses -notcontains "react") { throw "Le cours react n'apparait pas dans la liste des cours inscrits" }
    if ($profile.totalSpent -ne 1490.0) { throw "Le montant total depense est incorrect" }
    $coursesJoined = $profile.enrolledCourses -join ', '
    Write-Host "  -> Profil verifie OK! Cours inscrits: $coursesJoined, Total depense: $($profile.totalSpent) DH" -ForegroundColor Gray
}

# 7. AUTHENTIFICATION ADMIN (Mot de passe secret)
Test-Step "7. Connexion Espace Administrateur" {
    $adminBody = @{
        email = "admin@edustream.ma";
        password = "mysuperdupercoopersecret"
    } | ConvertTo-Json

    $adminRes = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/login" -Method Post -Body $adminBody -ContentType "application/json" -MaximumRedirection 5
    if (-not $adminRes.success -or $adminRes.role -ne "ADMIN") { throw "Authentification Admin echouee" }
    Write-Host "  -> Authentification Admin reussie (Role: $($adminRes.role))" -ForegroundColor Gray
}

# 8. STATISTIQUES ADMIN (Revenus DH, Etudiants, Inscriptions)
Test-Step "8. Statistiques Administrateur (Revenus et Metriques)" {
    $stats = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/stats" -Method Get -MaximumRedirection 5
    if ($stats.totalStudents -lt 1) { throw "Statistiques etudiants incorrectes" }
    if ($stats.totalRevenue -lt 1490.0) { throw "Revenu total calcule incorrect" }
    if ($stats.currency -ne "DH") { throw "Devise incorrecte" }
    Write-Host "  -> Stats Admin OK: $($stats.totalStudents) etudiants, $($stats.totalEnrollments) inscriptions, Revenus: $($stats.totalRevenue) $($stats.currency)" -ForegroundColor Gray
}

# 9. PROMOTION USER -> ADMIN ("plus user to admin")
Test-Step "9. Promotion d'un Utilisateur en Administrateur" {
    $roleBody = @{ role = "ADMIN" } | ConvertTo-Json
    $updatedStudent = Invoke-RestMethod -Uri "http://localhost:3000/api/students/$($script:testStudentId)/role" -Method Put -Body $roleBody -ContentType "application/json" -MaximumRedirection 5
    if ($updatedStudent.role -ne "ADMIN") { throw "La mise a jour du role en ADMIN a echoue" }
    Write-Host "  -> L'utilisateur $($updatedStudent.email) a ete promu au role: $($updatedStudent.role)" -ForegroundColor Gray
}

# 10. REGISTRE ADMIN DES INSCRIPTIONS
Test-Step "10. Registre Admin des Inscriptions" {
    $enrollmentsList = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/enrollments" -Method Get -MaximumRedirection 5
    if ($enrollmentsList.Count -lt 1) { throw "Aucune inscription retournee dans le registre Admin" }
    Write-Host "  -> Registre Inscriptions OK: $($enrollmentsList.Count) inscription(s) trouvee(s)" -ForegroundColor Gray
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "RESULTATS FINAUX DE LA VERIFICATION:" -ForegroundColor Cyan
Write-Host "   Tests Reussis : $script:passed" -ForegroundColor Green
if ($script:failed -gt 0) {
    Write-Host "   Tests Echoues : $script:failed" -ForegroundColor Red
    exit 1
} else {
    Write-Host "   Tests Echoues : $script:failed" -ForegroundColor Green
    exit 0
}
