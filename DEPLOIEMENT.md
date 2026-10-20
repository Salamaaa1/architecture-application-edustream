# Deploiement de test (sans Docker)

L'application a deux parties :
- le backend Spring Boot (Java 21, Maven), a heberger sur un service qui compile le code lui-meme ;
- le frontend Next.js, a heberger sur Vercel.

Le frontend appelle le backend depuis le serveur, donc aucun reglage CORS n'est necessaire.
Le backend (dossier `backend`, non modifie) ecoute sur le port 8080, ou sur la valeur de la variable `SERVER_PORT`.

## 1. Backend (service qui compile Maven, par exemple Railway)

1. Creer un compte, puis **New Project > Deploy from GitHub repo** et choisir ce depot.
2. Dans les reglages du service :
   - **Root Directory** : `backend`
   - **Build Command** : `mvn -DskipTests package`
   - **Start Command** : `java -Xmx350m -XX:+UseSerialGC -jar target/edustream-backend-1.0.0.jar`
3. Dans **Variables**, ajouter `ADMIN_PASSWORD` (mot de passe de l'espace admin), `SERVER_PORT` = `8080` et `PORT` = `8080` (pour que le service sache quel port exposer).
4. Dans **Networking**, generer un domaine public. Noter l'URL.
5. Verifier : `https://<url-backend>/api/courses` renvoie la liste des cours.

Les conditions de l'offre gratuite changent : verifier les limites sur le site du service avant de s'inscrire.
Le dossier `backend` contient aussi `Dockerfile`, utilisable seulement si un service accepte Docker (voir `render.yaml`).

## 2. Frontend sur Vercel

1. Sur vercel.com, **Add New > Project** et choisir ce depot (branche `master`).
2. Dans **Environment Variables**, ajouter :
   - `BACKEND_URL` = l'URL du backend (sans `/` final) ;
   - `ADMIN_PASSWORD` = le meme mot de passe que pour le backend.
3. Lancer le deploiement.

## Alternative sans hebergeur de backend

Pour un test court, le backend peut tourner sur le PC et etre expose par un tunnel (par exemple `cloudflared tunnel --url http://localhost:8080`).
L'adresse du tunnel est alors la valeur de `BACKEND_URL` sur Vercel. Le test ne marche que tant que le PC et le tunnel restent allumes.

## Limites du service gratuit

- Un backend gratuit peut s'endormir apres un moment sans visite ; le premier appel suivant est lent (30 a 60 secondes pour Java). Recharger la page apres une minute.
- La base H2 est en memoire : etudiants et inscriptions disparaissent a chaque redemarrage. Les cours sont recrees au demarrage.
- Mot de passe admin par defaut : `mysuperdupercoopersecret`. Le changer pour tout test partage.

## Lancement local

Copier `.env.example` en `.env.local`, puis :

    cd backend && mvn -DskipTests package && java -jar target/edustream-backend-1.0.0.jar
    pnpm install && pnpm build && pnpm start
