# V1 Release Checklist

Date: 2026-06-01
Status: Checklist for the first private production smoke

## Goal

Confirm the first real v1 loop in the target Cloudflare environment:

```text
Resource detail -> download decision -> Worker file gateway -> R2 object
```

This checklist assumes the resource is an owned, controlled file. Do not use it
to upload restricted platform materials or copied exam-paper mirrors.

## Prerequisites

- Cloudflare authentication works locally or `CLOUDFLARE_API_TOKEN` is set.
- The target Worker has been deployed from `main`.
- `wrangler.jsonc` points at the target R2 bucket.
- The local file is controlled by this project and safe to host.
- The authored content record uses:
  - `hostMode: "owned"`
  - `downloadPolicy: "signed"`
  - a stable `files[].id`
  - a deterministic `files[].path`

Recommended first target:

```text
resource: cet4-exam-day-checklist
file: study-card-html
object key: owned/cet4-exam-day-checklist.html
```

## Verification Commands

Run the normal gates first:

```bash
npm run typecheck
npm test
npm run build
npm run check
```

Ensure Cloudflare resources exist:

```bash
npm run cloudflare:bootstrap -- --dry-run
npm run cloudflare:bootstrap
```

Upload and smoke one real owned file:

```bash
npm run smoke:download -- \
  --resource cet4-exam-day-checklist \
  --file study-card-html \
  --deployment-url https://<deployment-host> \
  --local-file content/owned/cet4-exam-day-checklist.html \
  --account-id <cloudflare-account-id>
```

You can also set `CLOUDFLARE_ACCOUNT_ID` in the shell instead of passing
`--account-id`. Supplying the account id keeps Wrangler from falling back to
`/memberships` account discovery during R2 uploads. The active Cloudflare token
still needs R2 object write access for the target bucket.

If the object is already uploaded and you only want to smoke the Worker path:

```bash
npm run smoke:download -- \
  --resource cet4-exam-day-checklist \
  --file study-card-html \
  --deployment-url https://<deployment-host> \
  --skip-upload
```

The smoke script validates the authored content mapping, optionally uploads the
file to R2, calls `/api/resources/:id/download`, then follows the returned file
URL and expects a successful response.

## Manual Browser Smoke

After the command-line smoke passes, open the deployed app and check:

- `/`
- `/cet4/papers`
- `/resources/cet4-exam-day-checklist`
- `/import`

Confirm:

- no console errors,
- navigation uses links,
- favorite toggle updates local state,
- theme toggle updates local state,
- search still submits accessibly,
- owned download button returns a file response,
- restricted resources still show external/source-only boundaries,
- no text overlap at desktop and narrow widths.

## Known Limitations

- `/import` creates a reviewable draft only; it does not persist to Neon or R2.
- JSON content remains the source of truth until Phase 4.
- There are no user accounts or cross-device study sync.
- Download decision logging is intentionally deferred.
- Real source/provenance quality still depends on the authored content records.
