# grandfeast-1a

Web app project for Grand Feast UK x Europe 2024

Live demo (beta): [link](https://main--grand-feast-uk-x-europe.netlify.app/)

## To deploy to production

1. Checkout `prod` branch
```bash
git checkout prod
```

2. Merge `dev` to `prod`, and push
```bash
make pull-dev
git push
```

## To run

1. install dependencies
```bash
make install
```

2. setup a .env file to store config/secrets for the app, then enter the real values
```bash
cp .env.example .env
```

3. run the development server
```bash
make run
```

## Running Locally With A Local MongoDB

If the shared remote MongoDB is unavailable, you can run the app against a local MongoDB instance instead.

1. Copy the example env file
```bash
cp .env.example .env
```

2. Review `.env` and set any values you need
```bash
MONGO_URI=mongodb://127.0.0.1:27017/grandfeast
APP_BASE_URL=http://localhost:5173
LOCAL_ADMIN_EMAILS=alice@example.com,bob@example.com,charlie@example.com
```

Notes:
- `LOCAL_ADMIN_EMAILS` is optional and supports a comma-separated list, so you can seed the whole team at once.
- Example: `LOCAL_ADMIN_EMAILS=alice@example.com,bob@example.com,charlie@example.com`
- Postmark and Cloudinary keys are optional for local booting. Leave them empty unless you want those integrations to work locally.
- Google auth values are only needed if you want to use the admin sign-in flow locally.
- `AUTH_SECRET` still needs a value. For local development, any long random string is fine.
- Local dev is pinned to `http://localhost:5173` so OAuth callback URLs stay stable.

Google OAuth setup for local admin sign-in:
- Authorized JavaScript origin: `http://localhost:5173`
- Authorized redirect URI: `http://localhost:5173/auth/callback/google`

Local admin access in development:
- If Google OAuth is not configured locally, the `/signin` page will offer a local admin sign-in form.
- Enter any email from `LOCAL_ADMIN_EMAILS` to create a local session and access `/api`.

3. Start MongoDB locally with Docker
```bash
make db-up
```

4. Start the app
```bash
make run-local
```

Useful commands:
```bash
make db-logs
make db-down
```

What happens on startup:
- the app connects to the MongoDB defined in `MONGO_URI`
- if the database is empty, it automatically creates the required ticket counter records
- if `LOCAL_ADMIN_EMAILS` is set, those users are also inserted into the local `users` collection if missing

This makes a brand-new local database usable immediately instead of failing because required records do not exist yet.


## Notes to self
Below were the steps I've taken to get fresh SvelteKit skeleton project up and running:
```
npm create svelte@latest
brew update node
npm install
npm run dev -- --open
```

After this, I've copied the files from the original test project.

On google auth setup:
* followed this guide: https://www.youtube.com/watch?v=X3Apuu_aezI&ab_channel=Rifik:

Setting up custom domain from squarespace to netlify
* https://connkat.medium.com/using-squarespace-domains-with-netlify-to-host-react-apps-with-custom-url-4f891ce754c6

Fixing "UntrustedHost" error in AuthJS 
* TL;DR: set {trustHost: true}
* https://github.com/nextauthjs/next-auth/issues/6113#issuecomment-1883231690
* https://authjs.dev/reference/sveltekit#lazy-initialization

Fixing .idea/workspace.xml in .gitignore NOT being ignored
* https://stackoverflow.com/questions/19973506/cannot-ignore-idea-workspace-xml-keeps-popping-up
