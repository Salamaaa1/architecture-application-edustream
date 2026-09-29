# 🎓 EduStream - Plateforme e-Learning Moderne

[![Java 21](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.5-green.svg)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.3-black.svg)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**EduStream** est une application full-stack moderne de formation en ligne, combinant un backend haute performance sous **Java 21 / Spring Boot 3** et un frontend dynamique sous **Next.js 16 / React 19**.

---

## ✨ Fonctionnalités Principales

- 🇲🇦 **Devise Locale (Dirham Marocain - DH / MAD)** : Tous les cours et paiements sont tarifiés et traités en Dirhams (1 490 DH, 990 DH, 1 190 DH).
- 📝 **Parcours d'Inscription en 2 Étapes** :
  - **Étape 1** : Pré-inscription et validation des informations de l'étudiant sans coordonnées bancaires.
  - **Étape 2** : Traitement atomique du paiement bancaire et confirmation de l'inscription.
- 🛡️ **Espace Administrateur (`/admin`)** :
  - Authentification sécurisée par mot de passe configurable (sans valeur écrite en dur).
  - Tableau de bord statistique (Revenus totaux en **DH**, nombre d'étudiants, d'inscriptions et de cours).
  - **Gestion des Rôles (User ↔ Admin)** : Promotion et rétgradation instantanée des utilisateurs en Administrateurs.
  - Registre et suivi de l'ensemble des inscriptions et paiements.
- 🧪 **Suite de Tests Élevée (100% Validée)** :
  - 48 tests unitaires & d'intégration avec **JUnit 5**, **Mockito** et analyse de couverture **JaCoCo** (> 80%).
  - Test de charge multithreadé simulant 50 inscriptions simultanées sur des places limitées.
  - Script de vérification automatisé E2E (10/10 tests validés).
- 🐳 **Conteneurisation Docker complète** : Déploiement en 1 commande via `docker compose up --build`.

---

## 🛠️ Stack Technique

### Backend (`/backend`)
- **Langage & Framework** : Java 21, Spring Boot 3.2.5
- **Base de Données** : H2 Database (In-Memory JPA / Hibernate)
- **Tests** : JUnit 5, Mockito, Spring Boot Test, JaCoCo Maven Plugin
- **Architecture** : Rest Controllers, DTO Layer, Business Services, Exception Handlers

### Frontend (`/app`)
- **Framework** : Next.js 16 (App Router & Turbopack), React 19
- **Style** : Tailwind CSS, Lucide Icons, Shadcn UI Components
- **Visualisation 3D** : Three.js, React Three Fiber, Drei

---

## 🚀 Démarrage Rapide

### Option 1 : Avec Docker Compose (Recommandé) 🐳

Démarrez l'ensemble des services (Backend + Frontend) en une seule commande :

```bash
docker compose up --build
```

- **Frontend Next.js** : [http://localhost:3000](http://localhost:3000)
- **Espace Administrateur** : [http://localhost:3000/admin](http://localhost:3000/admin)
- **Backend API Spring Boot** : [http://localhost:8080/api/courses](http://localhost:8080/api/courses)

---

### Option 2 : Lancement Manuel en Mode Développement 💻

#### 1. Backend Spring Boot
```bash
cd backend
mvn spring-boot:run
```
*Le backend sera accessible sur `http://localhost:8080`.*

#### 2. Frontend Next.js
À la racine du projet :
```bash
npm install
npm run dev
```
*Le frontend sera accessible sur `http://localhost:3000`.*

---

## 🔑 Accès Administrateur

Le mot de passe administrateur par défaut est configuré via la variable d'environnement `ADMIN_PASSWORD` (valeur par défaut : `mysuperdupercoopersecret`).

Pour vous connecter au panneau admin :
1. Accédez à [http://localhost:3000/admin](http://localhost:3000/admin).
2. Entrez le mot de passe : `mysuperdupercoopersecret`.

---

## 🧪 Exécution des Tests

### Tests Unitaires & Couverture JaCoCo (Backend)
```bash
cd backend
mvn test
```
*Rapport JaCoCo généré dans `backend/target/site/jacoco/index.html`.*

### Script de Vérification Automatisé E2E (10 Tests)
```powershell
powershell -ExecutionPolicy Bypass -File "scripts/verify-all-features.ps1"
```

---

## 📄 Licence
Ce projet est sous licence MIT.
