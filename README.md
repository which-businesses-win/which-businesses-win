# which-businesses-win

## Vercel (fixes `NOT_FOUND` on `/`)

The Next.js app is in **`frontend/`**, not the repo root. In [Vercel](https://vercel.com) → your project → **Settings** → **General** → **Root Directory** → enter **`frontend`** → **Save**, then trigger a new deployment (**Deployments** → **Redeploy** the latest commit, or push to `main`).

Without this, Vercel does not run `next build` for the app, so production can show **404 NOT_FOUND** even when the deployment status is Ready.
