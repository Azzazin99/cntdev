# Cloudflare setup for cntdev

This site currently runs on **Vercel** at `cntdev.vercel.app`. Cloudflare is integrated in two layers:

1. **Already in code** — Turnstile on login, app rate limits, cache headers for static assets
2. **When you have a custom domain** — DNS proxy, CDN cache rules, WAF

---

## Phase 2 — Turnstile (works on vercel.app today)

### 1. Create widget

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com) → **Turnstile** → **Add site**
2. **Site name:** cntdev admin login
3. **Hostnames:** `cntdev.vercel.app`, `localhost`
4. **Widget mode:** Managed
5. Copy **Site Key** and **Secret Key**

### 2. Environment variables

Set on **Vercel** (Production + Preview) and in local `.env.local`:

| Variable | Value |
|----------|--------|
| `PUBLIC_TURNSTILE_SITE_KEY` | Site Key from Turnstile |
| `TURNSTILE_SECRET_KEY` | Secret Key from Turnstile |

Redeploy after saving env vars.

### 3. Behaviour

- Both keys set → login form shows Turnstile; server verifies before password check
- Keys missing → Turnstile skipped (useful for local dev without keys)

---

## Phase 2 — Rate limiting (in app)

Implemented in [`src/hooks.server.js`](../src/hooks.server.js):

| Route | Limit |
|-------|--------|
| `POST /login` | 5 requests / 15 min / IP |
| `POST`/`PUT`/`DELETE` `/api/*` | 30 requests / min / IP |

This is a basic serverless in-memory limit. When Cloudflare WAF is enabled (custom domain), add CF rules as well.

---

## Phase 1 — Cache headers (works on Vercel today)

Also in [`src/hooks.server.js`](../src/hooks.server.js):

- `/assets/*` and image extensions → `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`
- `/admin`, `/login`, `/api/*` → `Cache-Control: no-store`

---

## Phase 1 — Full Cloudflare proxy (requires your own domain)

You **cannot** proxy `*.vercel.app` through Cloudflare. When you have a domain (e.g. `www.yourdomain.go.th`):

### 1. Add site to Cloudflare

1. Cloudflare → **Add a site** → enter domain
2. Choose Free plan
3. Update **nameservers** at your domain registrar to Cloudflare’s NS records

### 2. DNS

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `@` or `www` | `cname.vercel-dns.com` | Proxied (orange cloud) |

### 3. Vercel domain

1. Vercel → Project **cntdev** → **Settings** → **Domains**
2. Add the same domain
3. Wait for SSL to become valid

### 4. SSL/TLS

Cloudflare → **SSL/TLS** → **Full (strict)**

### 5. Cache rules (recommended)

Create rules in **Caching** → **Cache Rules**:

1. **Cache static assets** — URI Path contains `/assets/` OR file extension is image/font → Cache eligibility: Eligible
2. **Bypass admin** — URI Path starts with `/admin` or `/login` or `/api` → Bypass cache
3. **Bypass logged-in users** — Cookie contains `cntdev_session` → Bypass cache

### 6. WAF rate limits (optional, after proxy is live)

**Security** → **WAF** → Rate limiting rules:

- `POST` to `/login` — e.g. 10 req / min / IP
- Mutating methods on `/api/*` — e.g. 60 req / min / IP

### 7. Turnstile hostnames

Add the new production domain to your Turnstile widget hostnames in Cloudflare.

---

## Traffic flow (with custom domain)

```
User → Cloudflare (CDN / WAF / Turnstile) → Vercel (SvelteKit) → Firebase
```

---

## Checklist

- [ ] Turnstile widget created
- [ ] `PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` on Vercel
- [ ] Login works on production with Turnstile
- [ ] (Later) Custom domain on Cloudflare + Vercel
- [ ] (Later) Cache rules + WAF on Cloudflare
