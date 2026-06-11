# VIA Rail Local 4005 Steward Portal

Secure steward/admin portal prototype for Moncton shop steward case tracking.

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
3. Create auth users in Supabase.
4. Add or approve matching rows in `public.profiles` for each authorized user.
5. Copy `config.example.js` to `config.js`.
6. Replace the placeholder Supabase URL and anon key in `config.js`.

New users can request steward/admin access from the sign-in screen. Their account stays inactive until an active admin approves it in the portal.

Example first admin profile after creating your first Auth user:

```sql
update public.profiles
set role = 'admin', active = true, access_status = 'approved'
where id = 'AUTH_USER_UUID_HERE';
```

Public admin and steward listings are account-backed. A person only appears on the public board when they have an approved Auth/profile account and a row in `public_directory_entries`.

To create the initial Nicolas Hachey steward account with a Supabase service-role key:

```bash
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" \
SUPABASE_ANON_KEY="YOUR_ANON_KEY" \
node scripts/create-nicolas-steward.mjs
```

The script creates or updates `hacheyn@me.com`, approves the profile as a steward, lists Nicolas publicly as `Shop Steward`, `Moncton VCC`, `Contract 1`, and requests a Supabase password reset email when `SUPABASE_ANON_KEY` is provided. The sign-in screen also has an `Email password reset` button.

## Security notes

- All portal pages require login once Supabase is configured.
- Row-level security limits case access to admins and assigned/creating stewards.
- Case documents are stored in the private `steward-documents` bucket.
- Do not put private meeting links or sensitive documents in the static files.

## Deploy to Cloudflare Pages

This app is static and can move to any host later. For Cloudflare Pages:

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
