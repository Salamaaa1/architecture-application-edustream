# 🐳 Guide de déploiement Docker - EduStream

Ce guide explique comment lancer l'ensemble de la plateforme EduStream (**Backend Spring Boot** + **Frontend Next.js**) avec Docker et Docker Compose.

---

## 🚀 Lancement Rapide (Commandes en 1 étape)

Assurez-vous que **Docker Desktop** est lancé, puis exécutez la commande suivante à la racine du projet :

```bash
docker compose up --build
```

Ou en arrière-plan (mode détaché) :

```bash
docker compose up -d --build
```

---

## 📍 Accès aux Services

Une fois les conteneurs démarrés :

- **Frontend Next.js** : [http://localhost:3000](http://localhost:3000)
- **Dashboard Administrateur** : [http://localhost:3000/admin](http://localhost:3000/admin)
- **Backend API Spring Boot** : [http://localhost:8080/api/courses](http://localhost:8080/api/courses)
- **Console H2 Database** : [http://localhost:8080/h2-console](http://localhost:8080/h2-console) (JDBC URL: `jdbc:h2:mem:edustreamdb`, user: `sa`, password: *(vide)*)

---

## 🔑 Mot de Passe Administrateur

Le mot de passe administrateur par défaut est configurable via la variable d'environnement `ADMIN_PASSWORD` (valeur par défaut : `mysuperdupercoopersecret`).

Pour personnaliser le mot de passe admin :

```bash
ADMIN_PASSWORD="votre_mot_de_passe_secret" docker compose up --build
```

---

## 🛑 Arrêter les conteneurs

Pour arrêter et supprimer les conteneurs :

```bash
docker compose down
```

---

## 🏗️ Structure Docker

- **`backend/Dockerfile`** : Build multi-stage Maven 3.9 (Temurin OpenJDK 21) -> JRE 21.
- **`Dockerfile`** (Racine) : Build multi-stage Node 20 / Next.js production.
- **`docker-compose.yml`** : Orchestration des 2 conteneurs avec Healthcheck réseau.
