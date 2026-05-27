# Download Protection

This app treats owned resource downloads as the first cost-sensitive surface.
List/detail/search routes stay cacheable and cheap; download decision and file
gateway routes are protected before they can create avoidable R2 reads.

## Controls

Wrangler is the source of truth for deployment-time protection settings. Keep
binding names, limits, and non-secret budget switches in `wrangler.jsonc`, then
run `npm run cf-typegen` after configuration changes.

For first-time Cloudflare setup, run:

```bash
npm run cloudflare:bootstrap -- --dry-run
npm run cloudflare:login
npm run cloudflare:bootstrap
```

This reads `wrangler.jsonc`, creates missing R2 buckets with Wrangler unless
`--dry-run` is set, generates binding types, and runs a deploy dry-run. Rate
Limiting bindings are declared in `wrangler.jsonc`; Wrangler validates them
during the dry-run/deploy step.

The bootstrap script requires Wrangler `4.36.0` or newer because that is the
minimum version for Rate Limiting bindings. For real resource creation, it first
checks authentication with `wrangler whoami`, then checks each configured R2
bucket with `wrangler r2 bucket info --json` before creating anything.

`--dry-run` does not contact Cloudflare to list or create buckets; it previews
the bucket names from `wrangler.jsonc` and still validates the Worker bundle.
The real bootstrap requires an authenticated Wrangler session or
`CLOUDFLARE_API_TOKEN`. If OAuth login is awkward in a container or remote
shell, try forwarding Wrangler's callback port:

```bash
npm run cloudflare:login -- --callback-host=0.0.0.0
```

Or create an API token and run:

```bash
CLOUDFLARE_API_TOKEN=<token> npm run cloudflare:bootstrap
```

The token needs account-level access for the resources Wrangler manages here:
`Workers R2 Storage Edit` for bucket list/create, and `Workers Scripts Edit`
for later Worker deploys. Keep the token out of source control and prefer a
short TTL when possible.

Production notes from comparable Cloudflare projects:

- Keep non-secret bindings and deployment shape in Wrangler config.
- Keep secrets in Wrangler secrets or CI secrets, never in `vars`.
- Prefer explicit resource checks before creation; for larger infrastructure,
  move resource ownership to Terraform or another IaC layer.
- Keep preview/staging bindings separate from production because Wrangler
  bindings and vars are not inherited across environments.

- `DOWNLOAD_RATE_LIMITER`: Cloudflare Rate Limiting binding for anonymous
  download traffic. The default Wrangler config allows 20 download-gate calls per
  minute per Cloudflare actor key. Its `namespace_id` is project-scoped; changing
  it resets and separates the counter namespace.
- `DOWNLOAD_RATE_LIMIT_ENABLED`: set to `false` only for local debugging. When
  enabled, a missing or failing limiter fails closed with `503`.
- `DOWNLOAD_RATE_LIMIT_RETRY_AFTER_SECONDS`: value used for `Retry-After` on
  limiter and protection failures.
- `DOWNLOAD_BUDGET_MODE`:
  - `open`: normal behavior.
  - `decision-only`: return public R2/CDN URLs when `R2_PUBLIC_BASE_URL` is set,
    but keep the Worker file gateway closed.
  - `closed`: close owned downloads before repository or R2 work.

## Request Path

1. `/api/resources/:id/download` reads a bounded JSON body, validates the owned
   file, applies budget mode, applies the Cloudflare limiter, then returns a URL.
2. `/api/resources/:id/file` validates the owned file, applies gateway budget
   mode, applies the Cloudflare limiter, then reads from R2.
3. Invalid, restricted, oversized, over-limit, and closed-budget requests return
   normalized JSON errors with `cache-control: no-store`.

## Verification

```bash
npm test
npm run typecheck
npm run build
npm run check
```

Deployment still needs one real-environment smoke with an actual R2 object:

```bash
curl -I "https://<deployment>/api/resources/cet4-paper-2024-12-a/file?path=papers%2Fcet4-paper-2024-12-a.pdf"
```
