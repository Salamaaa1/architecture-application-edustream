# Deploiement de test (gratuit)

L'application a deux parties : le backend Spring Boot (Render) et le frontend Next.js (Vercel).
Le frontend appelle le backend depuis le serveur, donc aucun reglage CORS n'est necessaire.

## 1. Backend sur Render

1. Sur render.com, creer un compte puis **New > Blueprint** et choisir ce depot (branche `master`).
2. Render lit `render.yaml`. Renseigner la variable `ADMIN_PASSWORD` (mot de passe de l'espace admin).
3. Attendre la fin du build (5 a 10 minutes). Noter l'URL, par exemple `https://edustream-backend.onrender.com`.
4. Verifier : `https://<url-render>/api/courses` doit renvoyer la liste des cours.

## 2. Frontend sur Vercel

1. Sur vercel.com, **Add New > Project** et choisir ce depot (branche `master`).
2. Dans **Environment Variables**, ajouter :
   - `BACKEND_URL` = l'URL Render (sans `/` final) ;
   - `ADMIN_PASSWORD` = le meme mot de passe que sur Render.
3. Lancer le deploiement. L'application est disponible sur l'URL Vercel.

## Limites du service gratuit

- Render endort le backend apres 15 minutes sans visite. La premiere requete suivante prend environ 50 secondes ; le frontend peut alors afficher une erreur. Recharger la page apres une minute.
- La base H2 est en memoire : etudiants et inscriptions disparaissent a chaque redemarrage. Les cours sont recrees au demarrage.
- Mot de passe admin par defaut : `mysuperdupercoopersecret`. Le changer pour tout test partage.

## Lancement local

Copier `.env.example` en `.env.local`, puis :

    cd backend && mvn -DskipTests package && java -jar target/edustream-backend-1.0.0.jar
    pnpm install && pnpm build && pnpm start
