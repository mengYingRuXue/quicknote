-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Notes table
create table notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null default '无标题',
  content text not null default '',
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table notes enable row level security;

-- Notes policies
create policy "Users can view their own notes"
  on notes for select
  using (auth.uid() = user_id);

create policy "Anyone can view public notes"
  on notes for select
  using (is_public = true);

create policy "Users can insert their own notes"
  on notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on notes for delete
  using (auth.uid() = user_id);

-- Share links table
create table share_links (
  id uuid primary key default uuid_generate_v4(),
  note_id uuid references notes(id) on delete cascade not null,
  slug text unique not null,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS
alter table share_links enable row level security;

-- Share links policies
create policy "Users can view share links for their notes"
  on share_links for select
  using (
    exists (
      select 1 from notes
      where notes.id = share_links.note_id
      and notes.user_id = auth.uid()
    )
  );

create policy "Anyone can view share links by slug"
  on share_links for select
  using (true);

create policy "Users can create share links for their notes"
  on share_links for insert
  with check (
    exists (
      select 1 from notes
      where notes.id = share_links.note_id
      and notes.user_id = auth.uid()
    )
  );

create policy "Users can delete share links for their notes"
  on share_links for delete
  using (
    exists (
      select 1 from notes
      where notes.id = share_links.note_id
      and notes.user_id = auth.uid()
    )
  );

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
