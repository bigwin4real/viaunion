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
4. Add matching rows to `public.profiles` for each authorized user.
5. Copy `config.example.js` to `config.js`.
6. Replace the placeholder Supabase URL and anon key in `config.js`.

Example first admin profile:

```sql
insert into public.profiles (id, full_name, role, active)
values ('AUTH_USER_UUID_HERE', 'Admin Name', 'admin', true);
```

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
