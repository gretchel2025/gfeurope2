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
cp example.env .env
```

3. run the development server
```bash
make run
```


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

