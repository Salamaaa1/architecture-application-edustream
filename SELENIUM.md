# 🧪 Guide des Tests E2E avec Selenium WebDriver - EduStream

Ce guide explique comment exécuter et étendre les suites de tests automatisés **Selenium WebDriver** pour l'application **EduStream**.

---

## 🎯 Les 3 Catégories de Tests Disponibles

### 1. Tests E2E Nominaux (`--mode e2e` - 100% Validé)
Teste le flux utilisateur complet avec succès de bout en bout :
- Catalogue avec tarification en Dirhams marocains (DH).
- Création de compte et connexion étudiant.
- Parcours d'inscription et paiement bancaire simulé.
- Accès au cours débloqué avec lecteur de leçons et suivi de progression.
- Tableau de bord étudiant (`/dashboard`) affichant les cours acquis.
- Protection anti-doublon bloquant la réinscription.

### 2. Tests Négatifs et Cas Limites (`--mode negative` - 100% Validé)
Teste que l'application détecte et rejette les entrées invalides :
- Connexion avec mauvais mot de passe -> Bloquée avec message d'erreur.
- Pré-inscription sans cocher les CGU -> Bloquée avec alerte requise.
- Formulaire incomplet (champ obligatoire manquant) -> Rejeté avec message explicite.
- Carte bancaire incomplète (< 16 chiffres) -> Paiement bloqué.
- Code CVV incomplet (< 3 chiffres) -> Paiement bloqué.
- Accès à une URL de cours inconnue (`/courses/fantome`) -> Page 404 métier affichée.

### 3. Tests d'Échecs Volontaires (`--mode failing` - Échecs Délibérés)
Permet de voir exactement comment Selenium et unittest affichent les anomalies :
- `AssertionError` : Affirme que le cours est gratuit (0 DH) alors qu'il coûte 1 490 DH.
- `TimeoutException` : Tente de trouver un bouton qui n'existe nulle part sur la page.
- `Content Mismatch` : Attend un texte erroné sur la page.

---

## 🚀 Commandes d'Exécution

Assurez-vous que les conteneurs sont lancés :
```bash
docker compose up -d
```

### 🔹 Exécuter les tests nominaux (E2E)
```powershell
python scripts/run-selenium-tests.py --mode e2e
```
*Pour voir le navigateur s'ouvrir en direct (ralentissement visuel automatique) :*
```powershell
python scripts/run-selenium-tests.py --mode e2e --headed
```
*Pour ralentir encore plus afin de bien suivre chaque action à l'œil nu :*
```powershell
# Ralenti prédéfini (1.5s entre chaque action + frappe progressive au clavier)
python scripts/run-selenium-tests.py --mode e2e --headed --slow

# Ou délai personnalisé en secondes (ex: 2 secondes par étape)
python scripts/run-selenium-tests.py --mode e2e --headed --delay 2
```

---

### 🔹 Exécuter les tests négatifs (Validation des rejets & erreurs)
```powershell
python scripts/run-selenium-tests.py --mode negative
```

---

### 🔹 Exécuter les tests qui ÉCHOUENT volontairement (Pour voir les rapports d'échec)
```powershell
python scripts/run-selenium-tests.py --mode failing --headed --slow
```
```powershell
python scripts/run-selenium-tests.py --mode failing
```
*ou en mode visible :*
```powershell
python scripts/run-selenium-tests.py --mode failing --headed
```

---

### 🔹 Exécuter la totalité des tests (Nominal + Négatif + Échecs)
```powershell
python scripts/run-selenium-tests.py --mode all
```

---

### 🔹 Via le script PowerShell (`scripts/run-selenium-tests.ps1`)
```powershell
# Mode nominal
powershell -ExecutionPolicy Bypass -File "scripts/run-selenium-tests.ps1" -Mode e2e -Headed

# Mode négatif
powershell -ExecutionPolicy Bypass -File "scripts/run-selenium-tests.ps1" -Mode negative

# Mode échecs volontaires
powershell -ExecutionPolicy Bypass -File "scripts/run-selenium-tests.ps1" -Mode failing
```

---

## 📁 Fichiers de Tests

```text
├── tests/
│   └── selenium/
│       ├── test_edustream_e2e.py          # Tests E2E nominaux (Success)
│       ├── test_negative_cases.py         # Tests négatifs (Rejet des erreurs)
│       └── test_intentional_failures.py    # Tests d'échec délibéré (Démonstration)
├── scripts/
│   ├── run-selenium-tests.py              # Lanceur CLI multi-modes et multi-navigateurs
│   └── run-selenium-tests.ps1             # Wrapper PowerShell avec paramètre -Mode
└── backend/
    └── src/test/java/com/edustream/backend/selenium/
        └── EduStreamSeleniumE2ETest.java  # Équivalent Java JUnit 5
```
