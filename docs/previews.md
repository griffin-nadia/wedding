# Cloudflare previews

Two optional Cloudflare Pages projects, deployed by `docs/ci/previews.yml` once it's moved to
`.github/workflows/previews.yml` and the two secrets exist. Until then the workflow passes without doing anything.

- **gn-lab**: the lab, on every merge to main. `https://gn-lab.pages.dev/` goes to the lab.
- **gn-preview**: the guest site for each pull request. The address is posted as a comment on the PR
  (`https://pr-<number>.gn-preview.pages.dev/wedding/?h=sample`).

Both are built with no back end, so they show the sample household and nothing they do can reach the real sheet.
Every response carries `X-Robots-Tag: noindex, nofollow`, and `scripts/preview-check.mjs` stops the deploy if the
output holds a file from `private/`, a back-end address or anything that looks like a guest list.

The lab on GitHub Pages (`/wedding/lab-x2tyua87sy/`) works without any of this; Cloudflare adds per-PR previews and
an optional sign-in.

## 1. Move the workflow (once, from an account with the workflow scope)

```sh
git mv docs/ci/previews.yml .github/workflows/previews.yml && git commit -m "ci: turn on Cloudflare previews"
```

## 2. The account ID (CLOUDFLARE_ACCOUNT_ID)

1. Sign in at https://dash.cloudflare.com (a free account is fine).
2. Left menu → **Workers & Pages**.
3. On the right, under **Account details**, click **Copy** next to **Account ID**.

## 3. The API token (CLOUDFLARE_API_TOKEN)

1. Top right, the person icon → **My Profile** → **API Tokens** → **Create Token**.
2. Next to **Edit Cloudflare Workers**, **Use template**. Or, for the narrowest token, **Create Custom Token** with
   one permission: **Account → Cloudflare Pages → Edit**.
3. **Account Resources**: Include → your account. **Zone Resources**: leave as is (the previews use pages.dev, no
   domain).
4. **Continue to summary** → **Create Token** → **Copy**. It's only shown once.

## 4. Put both into GitHub

1. https://github.com/griffin-nadia/wedding/settings/secrets/actions
2. **New repository secret**: name `CLOUDFLARE_API_TOKEN`, paste the token, **Add secret**.
3. **New repository secret**: name `CLOUDFLARE_ACCOUNT_ID`, paste the account ID, **Add secret**.

## 5. The projects

Nothing to do: the first deploy makes `gn-lab` and `gn-preview` (wrangler creates a missing project). If it asks
for one to exist first, Workers & Pages → **Create** → **Pages** → **Upload assets**, name it `gn-lab` (then
`gn-preview`), and skip the upload.

## 6. Optional: only you can open them (Cloudflare Access)

1. Workers & Pages → **gn-preview** → **Settings** → **General** → **Access policy** → **Enable**.
2. It opens Zero Trust with an application for the previews. Under **Policies**, edit the policy: **Include** →
   **Emails** → `jehan.baguley@gmail.com` (add Nadia's and Griffin's here if they should see them too). **Save**.
3. Do the same for **gn-lab**.
4. Opening a preview now asks for that email and sends a one-time code. Free for up to 50 people.

Access covers the preview addresses (`*.gn-preview.pages.dev`); to cover `gn-lab.pages.dev` itself as well, in
Zero Trust → **Access** → **Applications**, edit the application and add `gn-lab.pages.dev` as a second domain.

## To turn it off

Delete `.github/workflows/previews.yml`, or delete either secret (the workflow then skips again).
