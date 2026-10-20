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

## Canary deployment avec Unleash

Le frontend envoie chaque visiteur vers l'un de deux backends :
- **stable** (`BACKEND_URL`), version actuelle ;
- **canary** (`BACKEND_CANARY_URL`), nouvelle version.

Le choix est fait par le flag Unleash `backend-canary` (fichier `lib/backend.ts`).
`proxy.ts` donne a chaque visiteur un cookie `edustream_sid`. Grace a ce cookie, un meme visiteur reste toujours sur la meme version.
Si Unleash ne repond pas, ou si le flag est desactive, tout le trafic va au backend stable.

### 1. Serveur Unleash

Deux possibilites :
- Unleash Cloud (getunleash.io), en periode d'essai ;
- auto-heberge : service Docker avec l'image `unleashorg/unleash-server`, une base PostgreSQL et la variable `DATABASE_URL`.

Se connecter (compte par defaut `admin` / `unleash4all`, a changer tout de suite), puis :
1. **Admin > API access** : creer un jeton de type **Backend** pour l'environnement `production`.
2. Creer le flag `backend-canary`, puis dans l'environnement `production` :
   - ajouter la strategie **Gradual rollout**, a 10 %, stickiness `sessionId` ;
   - activer le flag.

### 2. Deux backends

Sur Railway, creer deux services a partir du meme depot (dossier `backend`, memes commandes qu'a l'etape 1) :
- `edustream-stable` : branche `master`, variable `APP_VERSION` = `v1` ;
- `edustream-canary` : branche `canary`, qui contient la nouvelle version du code, variable `APP_VERSION` = `v2`.

Verifier : `https://<backend>/api/version` renvoie `{"version":"v1"}` ou `{"version":"v2"}`.

### 3. Variables Vercel

| Variable | Valeur |
|---|---|
| `BACKEND_URL` | URL du backend stable |
| `BACKEND_CANARY_URL` | URL du backend canary |
| `UNLEASH_URL` | URL du serveur Unleash suivie de `/api` |
| `UNLEASH_API_TOKEN` | jeton Backend cree a l'etape 1 |
| `ADMIN_PASSWORD` | mot de passe admin |

Redeployer le frontend apres avoir ajoute ces variables.

### 4. Test

`https://<site-vercel>/api/version` renvoie `{"target":"stable"|"canary","backendVersion":"v1"|"v2"}`.
Il renvoie aussi l'en-tete `X-Backend`.

Mesurer la repartition avec 100 visiteurs differents (chaque appel sans cookie est un nouveau visiteur) :

    for i in $(seq 100); do curl -s https://<site-vercel>/api/version; echo; done | grep -o '"target":"[a-z]*"' | sort | uniq -c

Deroulement du test :
1. Flag a 10 % : environ 10 reponses `canary` sur 100.
2. Passer a 50 %, puis a 100 %, dans Unleash. Le changement est pris en compte en environ 5 secondes, sans redeploiement.
3. **Rollback** : desactiver le flag (ou le mettre a 0 %). Tout le trafic revient sur `stable`.
4. Dans un navigateur, recharger plusieurs fois `/api/version` : la reponse reste la meme, car le cookie garde le visiteur sur sa version.

Limite : chaque backend a sa propre base H2 en memoire. Un compte cree sur le stable n'existe pas sur le canary.
Pour une demonstration complete, brancher les deux backends sur une meme base PostgreSQL.
