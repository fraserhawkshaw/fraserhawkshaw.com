# fraserhawkshaw.com — free hosting with GitHub Pages

This folder is a complete, tiny website:

- `fraserhawkshaw.com` → a simple holding page (contact details and a link to your terms)
- `fraserhawkshaw.com/terms` → your Terms & Conditions, viewable in the browser with a Download button
- `CNAME` tells GitHub the site belongs to fraserhawkshaw.com

It costs nothing, and **your Google Workspace email is not touched**. Email runs through your MX records (`aspmx.l.google.com` etc.). You only change the records that point the *website* somewhere.

---

## 1. Put the site on GitHub (about 10 minutes)

1. Create a free account at github.com (or sign in).
2. Click **New repository**. Name it `fraserhawkshaw.com`, set it to **Public**, and create it.
3. On the new repository page, click **uploading an existing file**. Drag in **everything inside this folder**, including `CNAME`, `.nojekyll`, `index.html`, `404.html`, `favicon.png` and the `assets` and `terms` folders. Click **Commit changes**.
   - `.nojekyll` is a hidden file. If Finder hides it, press ⌘⇧. to show hidden files. The site still works without it.
4. Go to **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
5. On the same page, check that *Custom domain* shows `fraserhawkshaw.com`. If it doesn't, type it in and save.

## 2. Point the web address at GitHub (Squarespace Domains)

Your domain's DNS is managed by Squarespace (the old Google Domains name servers).

**Before you change anything, take a screenshot of the whole DNS page.**

1. Sign in to Squarespace → **Domains** → `fraserhawkshaw.com` → **DNS** (sometimes called *DNS Settings*).
2. **Leave these alone.** They are your email:
   - every **MX** record (`aspmx.l.google.com`, `alt1…alt4.aspmx.l.google.com`)
   - any **TXT** record containing `v=spf1`, `google-site-verification` or `DKIM`, and any `google._domainkey` record
3. **Remove only the Squarespace website records.** These are usually in a *Squarespace Defaults* group:
   - the four **A** records for `@` pointing at `198.185.159.144`, `198.185.159.145`, `198.49.23.144` and `198.49.23.145`
   - the **CNAME** for `www` pointing at `ext-sq.squarespace.com` (if there is one)
4. **Add these records:**

| Type  | Host | Value |
|-------|------|-------|
| A     | @    | 185.199.108.153 |
| A     | @    | 185.199.109.153 |
| A     | @    | 185.199.110.153 |
| A     | @    | 185.199.111.153 |
| CNAME | www  | `YOUR-GITHUB-USERNAME.github.io` |

5. Wait. DNS changes usually show within an hour but can take up to 24 hours. Back in GitHub **Settings → Pages**, tick **Enforce HTTPS** once it lets you.

## 3. Lock the domain to your GitHub account (recommended)

In GitHub, go to your profile picture → **Settings → Pages → Add a domain**, enter `fraserhawkshaw.com`, and add the **TXT** record it gives you in Squarespace. This stops anyone else attaching your domain to their own GitHub site.

## 4. Check it, then switch on the link in Confirmation Desk

- Open `https://fraserhawkshaw.com/terms`. You should see your Terms with a Download PDF button.
- Send yourself a test email to confirm mail still arrives.
- In Confirmation Desk, open **Payment, rights & sign-off** and turn on **Link to my Terms & Conditions online**. Confirmations and quotes will then link to the page instead of asking you to attach the PDF.

## Updating your Terms later

In the GitHub repository, open `terms/`, click **Add file → Upload files**, and upload the new PDF with **exactly the same file name**:
`fraser-hawkshaw-media-terms-and-conditions.pdf`. It goes live within a minute or two. If the effective date changes, also edit the date line in `terms/index.html` (click the file, then the pencil icon).

## If anything goes wrong

Put back the records from your screenshot. Because the MX records were never touched, email keeps working throughout.
