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
2. In Supabase, open **SQL Editor** and run the full contents of `supabase-schema.sql`.
3. In **Authentication > Providers**, enable Email.
4. In **Project Settings > API**, copy:
   - Project URL
   - anon public key
   - service_role key
5. Write the site config:

```bash
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co" \
SUPABASE_ANON_KEY="YOUR_ANON_KEY" \
npm run supabase:config
```

6. Create the first approved admin account:

```bash
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" \
SUPABASE_ANON_KEY="YOUR_ANON_KEY" \
ADMIN_EMAIL="your-email@example.com" \
ADMIN_NAME="Your Name" \
npm run supabase:create-admin
```

7. Create Nicolas Hachey's approved steward account:

```bash
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" \
SUPABASE_ANON_KEY="YOUR_ANON_KEY" \
npm run supabase:create-nicolas
```

New users can request steward/admin access from the sign-in screen. Their account stays inactive until an active admin approves it in the portal.

Public admin and steward listings are account-backed. A person only appears on the public board when they have an approved Auth/profile account and a row in `public_directory_entries`.

The script creates or updates `hacheyn@me.com`, approves the profile as a steward, lists Nicolas publicly as `Shop Steward`, `Moncton VCC`, `Contract 1`, and does not publish an email or phone number by default. It requests a Supabase password reset email when `SUPABASE_ANON_KEY` is provided. The sign-in screen also has an `Email password reset` button.

For Cloudflare Pages, make sure the deployed `config.js` has the same Supabase Project URL and anon key. Do not put the service-role key in `config.js` or any browser file.

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

## Grievance form status

The public grievance form is not linked from the live member board right now. The form files remain in the repo so they can be re-enabled later.

When re-enabled, `grievance.html` works without server email by downloading a completed copy and opening the member's email client. To enable direct server-side email through Cloudflare Pages Functions, add these environment variables:

```text
RESEND_API_KEY=your_resend_api_key
GRIEVANCE_FROM_EMAIL=verified-sender@your-domain.ca
```

The form can send a copy to the selected shop steward, a regional representative email entered by the member, or a custom email.

Public agreement links are sourced from Unifor National Council 4000:

- VIA Rail Agreement No. 1 and No. 2: https://www.unifor4000.com/collective-agreements
- Bylaws and constitution: https://www.unifor4000.com/bylaws-constitution
- Local 4005 grievance resources: https://www.unifor4000.com/grievance-forms
