# VIA Rail Local 4005 Steward Portal

Secure public union board plus steward/admin portal for Moncton shop steward case tracking.

## Run locally

```bash
python3 -m http.server 4005
```

Open `http://localhost:4005`.

For layout review before Supabase is configured, open:

```text
http://localhost:4005/?preview=1
```

Preview mode only works on localhost and is not a security model.

## Configure Supabase

1. Create a Supabase project.
2. Run `supabase-schema.sql` in the Supabase SQL editor.
3. Create your first auth user.
4. Approve that user as the first admin.
5. Copy `config.example.js` to `config.js`.
6. Replace the placeholder Supabase URL and anon key in `config.js`.

Example first admin profile after creating your first Auth user:

```sql
update public.profiles
set role = 'admin', active = true, access_status = 'approved'
where id = 'AUTH_USER_UUID_HERE';
```

New users can request steward/admin access from the sign-in screen. Their account stays inactive until an active admin approves it in the portal.

## Security notes

- Public board pages do not require sign-in.
- Steward/admin tools require Supabase login and profile approval.
- Row-level security limits case access to admins and assigned/creating stewards.
- Case documents are stored in the private `steward-documents` bucket.
- Internal files are stored in the private `internal-files` bucket.
- The locked Excel grievance tracker area is restricted to stewards.
- Do not put private meeting links or sensitive documents in static files.

## Deploy to Cloudflare Pages

This app is static with Pages Functions and can move to another host later with equivalent serverless support.

```bash
npx --yes wrangler pages deploy . --project-name viarail4005moncton
```

Cloudflare will serve `_headers` with basic browser security headers.

The agreement assistant uses Cloudflare Workers AI through the `AI` binding in `wrangler.toml`; no OpenAI key is required. In Cloudflare Pages, make sure Workers AI is enabled for the project/account.

Private steward/admin tools include:

- approved-user registration workflow
- admin approval/rejection list
- grievance and case tracking
- secure case documents
- internal file storage
- steward-only locked Excel grievance tracker area

Public agreement links are sourced from Unifor National Council 4000:

- VIA Rail Agreement No. 1 and No. 2: https://www.unifor4000.com/collective-agreements
- Bylaws and constitution: https://www.unifor4000.com/bylaws-constitution
- Local 4005 grievance resources: https://www.unifor4000.com/grievance-forms
