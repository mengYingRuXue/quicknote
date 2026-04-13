# Supabase Setup

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click "New Project", choose an organization, and fill in the project name and database password.
3. Wait for the project to finish provisioning.

## 2. Run the SQL Schema

1. In your Supabase dashboard, navigate to **SQL Editor**.
2. Click "New query".
3. Copy the entire contents of `supabase/schema.sql` and paste it into the editor.
4. Click "Run" to execute the schema.

This creates three tables with Row Level Security (RLS) enabled:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles, auto-created on signup via trigger |
| `notes` | User notes with public/private visibility |
| `share_links` | Shareable links for individual notes |

## 3. Configure Environment Variables

Get your project URL and anon key from **Settings > API** in the Supabase dashboard.

### apps/web (Next.js)

Copy the example file and fill in your values:

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### apps/reader (Vite)

Copy the example file and fill in your values:

```bash
cp apps/reader/.env.example apps/reader/.env
```

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

## 4. Test Authentication

1. In the Supabase dashboard, go to **Authentication > Providers** and enable Email provider (enabled by default).
2. Sign up a test user via your app or the Supabase dashboard (**Authentication > Users > Add user**).
3. Verify that a corresponding row is automatically created in the `profiles` table (via the `on_auth_user_created` trigger).
4. Confirm RLS is working by checking that the user can only see their own data.
