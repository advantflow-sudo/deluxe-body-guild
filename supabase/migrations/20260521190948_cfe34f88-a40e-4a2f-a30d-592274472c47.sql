-- Community posts
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  body text not null check (char_length(body) between 1 and 2000),
  image_url text,
  workout_session_id uuid references public.workout_sessions(id) on delete set null,
  visibility text not null default 'public' check (visibility in ('public','premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_posts_created on public.community_posts(created_at desc);
create index idx_posts_user on public.community_posts(user_id);

alter table public.community_posts enable row level security;

-- helper: check if current user is premium/deluxe
create or replace function public.is_premium_member(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_profiles_ext
    where user_id = _user_id and subscription_tier in ('premium','deluxe')
  )
$$;

create policy "posts read public or premium-by-premium" on public.community_posts
  for select to authenticated using (
    visibility = 'public' or public.is_premium_member(auth.uid())
  );
create policy "posts own insert" on public.community_posts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "posts own update" on public.community_posts
  for update to authenticated using (auth.uid() = user_id);
create policy "posts own delete" on public.community_posts
  for delete to authenticated using (auth.uid() = user_id);

create trigger trg_posts_updated before update on public.community_posts
  for each row execute function public.set_updated_at();

-- Likes
create table public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);
create index idx_likes_post on public.post_likes(post_id);

alter table public.post_likes enable row level security;
create policy "likes read all authed" on public.post_likes for select to authenticated using (true);
create policy "likes own insert" on public.post_likes for insert to authenticated with check (auth.uid() = user_id);
create policy "likes own delete" on public.post_likes for delete to authenticated using (auth.uid() = user_id);

-- Comments
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index idx_comments_post on public.post_comments(post_id, created_at);

alter table public.post_comments enable row level security;
create policy "comments read all authed" on public.post_comments for select to authenticated using (true);
create policy "comments own insert" on public.post_comments for insert to authenticated with check (auth.uid() = user_id);
create policy "comments own delete" on public.post_comments for delete to authenticated using (auth.uid() = user_id);

-- Followers
create table public.user_followers (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null,
  followed_id uuid not null,
  created_at timestamptz not null default now(),
  unique(follower_id, followed_id),
  check (follower_id <> followed_id)
);
create index idx_followers_followed on public.user_followers(followed_id);
create index idx_followers_follower on public.user_followers(follower_id);

alter table public.user_followers enable row level security;
create policy "followers read all authed" on public.user_followers for select to authenticated using (true);
create policy "followers own insert" on public.user_followers for insert to authenticated with check (auth.uid() = follower_id);
create policy "followers own delete" on public.user_followers for delete to authenticated using (auth.uid() = follower_id);

-- Avatars bucket
insert into storage.buckets (id, name, public) values ('avatars','avatars', true)
on conflict (id) do nothing;

create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars own insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars own update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars own delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);