
-- ============ USER PROFILES EXTENSION ============
create table public.user_profiles_ext (
  user_id uuid primary key references auth.users(id) on delete cascade,
  fitness_goal text,
  weight_kg numeric,
  height_cm numeric,
  age int,
  training_level text check (training_level in ('beginner','intermediate','advanced')),
  preferred_type text,
  units text not null default 'metric' check (units in ('metric','imperial')),
  subscription_tier text not null default 'free' check (subscription_tier in ('free','premium','deluxe')),
  notifications_enabled boolean not null default true,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_profiles_ext enable row level security;
create policy "own ext profile read" on public.user_profiles_ext for select using (auth.uid() = user_id);
create policy "own ext profile insert" on public.user_profiles_ext for insert with check (auth.uid() = user_id);
create policy "own ext profile update" on public.user_profiles_ext for update using (auth.uid() = user_id);
create trigger trg_user_profiles_ext_updated before update on public.user_profiles_ext for each row execute function public.set_updated_at();

-- ============ WORKOUTS CATALOG ============
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  level text not null check (level in ('beginner','intermediate','advanced')),
  type text not null,
  duration_min int not null,
  calories int,
  description text,
  video_url text,
  image_url text,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.workouts enable row level security;
create policy "workouts read all authed" on public.workouts for select to authenticated using (true);
create policy "workouts admin write" on public.workouts for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ WORKOUT SESSIONS ============
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete set null,
  duration_min int not null,
  calories int,
  notes text,
  completed_at timestamptz not null default now()
);
alter table public.workout_sessions enable row level security;
create policy "sessions own read" on public.workout_sessions for select using (auth.uid()=user_id);
create policy "sessions own insert" on public.workout_sessions for insert with check (auth.uid()=user_id);
create policy "sessions own delete" on public.workout_sessions for delete using (auth.uid()=user_id);
create index on public.workout_sessions(user_id, completed_at desc);

-- ============ DAILY STATS ============
create table public.daily_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stat_date date not null default current_date,
  steps int not null default 0,
  calories int not null default 0,
  water_ml int not null default 0,
  streak int not null default 0,
  unique (user_id, stat_date)
);
alter table public.daily_stats enable row level security;
create policy "daily own all" on public.daily_stats for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

-- ============ BODY MEASUREMENTS ============
create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_on date not null default current_date,
  weight_kg numeric,
  chest_cm numeric,
  waist_cm numeric,
  hips_cm numeric,
  arms_cm numeric,
  thighs_cm numeric,
  body_fat_pct numeric,
  created_at timestamptz not null default now()
);
alter table public.body_measurements enable row level security;
create policy "measurements own all" on public.body_measurements for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create index on public.body_measurements(user_id, measured_on desc);

-- ============ PROGRESS PHOTOS ============
create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  taken_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
alter table public.progress_photos enable row level security;
create policy "photos own all" on public.progress_photos for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

-- ============ REWARD POINTS LEDGER ============
create table public.reward_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta int not null,
  balance_after int not null,
  reason text not null,
  created_at timestamptz not null default now()
);
alter table public.reward_points enable row level security;
create policy "points own read" on public.reward_points for select using (auth.uid()=user_id);
create policy "points own insert" on public.reward_points for insert with check (auth.uid()=user_id);
create index on public.reward_points(user_id, created_at desc);

-- ============ REWARDS CATALOG ============
create table public.rewards_catalog (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cost_points int not null,
  type text not null,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.rewards_catalog enable row level security;
create policy "rewards read all authed" on public.rewards_catalog for select to authenticated using (true);
create policy "rewards admin write" on public.rewards_catalog for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ REWARD CLAIMS ============
create table public.reward_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id uuid not null references public.rewards_catalog(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','fulfilled','rejected')),
  claimed_at timestamptz not null default now()
);
alter table public.reward_claims enable row level security;
create policy "claims own read" on public.reward_claims for select using (auth.uid()=user_id or public.has_role(auth.uid(),'admin'));
create policy "claims own insert" on public.reward_claims for insert with check (auth.uid()=user_id);
create policy "claims admin update" on public.reward_claims for update using (public.has_role(auth.uid(),'admin'));

-- ============ CHALLENGES ============
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  goal_metric text not null,
  goal_target int not null,
  points_reward int not null default 0,
  starts_on date,
  ends_on date,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.challenges enable row level security;
create policy "challenges read all authed" on public.challenges for select to authenticated using (true);
create policy "challenges admin write" on public.challenges for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  progress int not null default 0,
  joined_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, challenge_id)
);
alter table public.challenge_participants enable row level security;
create policy "cp own all" on public.challenge_participants for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

-- ============ STORAGE: progress-photos ============
insert into storage.buckets (id, name, public) values ('progress-photos','progress-photos', false) on conflict (id) do nothing;
create policy "progress photos own read" on storage.objects for select to authenticated
  using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "progress photos own write" on storage.objects for insert to authenticated
  with check (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "progress photos own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============ SEED DATA ============
insert into public.workouts (title, category, level, type, duration_min, calories, description) values
('Royal Push Day','Strength','intermediate','gym',55,420,'Chest, shoulders, triceps. Heavy compound focus.'),
('Pull Day Power','Strength','intermediate','gym',55,400,'Back and biceps with finisher.'),
('Leg Day Legacy','Strength','advanced','gym',65,580,'Squat, RDL, lunges, calves.'),
('Sunrise HIIT','Cardio','beginner','home',20,220,'20-min full-body HIIT, no equipment.'),
('Fat Burn Inferno','Cardio','intermediate','home',30,360,'High-intensity intervals.'),
('Core Carve','Core','beginner','home',15,140,'Ab-focused circuit.'),
('Mobility Reset','Recovery','beginner','home',20,80,'Active recovery and stretching.'),
('Upper Body Glow','Strength','beginner','gym',40,300,'Beginner upper-body intro.'),
('Glute Goddess','Strength','intermediate','gym',45,360,'Hip thrust, RDL, abductors.'),
('Treadmill Tempo','Cardio','intermediate','gym',35,400,'Tempo run protocol.'),
('Spin Sculpt','Cardio','beginner','gym',45,450,'Indoor cycling intervals.'),
('Yoga Flow','Wellbeing','beginner','home',30,150,'Vinyasa flow for flexibility.'),
('Full Body Burn','Fat Loss','beginner','home',25,260,'Bodyweight full-body circuit.'),
('Athlete Conditioning','Conditioning','advanced','gym',50,560,'Sled, sprints, KB complex.'),
('Push-Pull-Legs A','Strength','advanced','gym',70,640,'Volume-heavy upper push.'),
('Push-Pull-Legs B','Strength','advanced','gym',70,620,'Volume-heavy upper pull.'),
('5x5 Foundations','Strength','beginner','gym',50,380,'Squat, bench, row 5x5.'),
('Cardio Express','Cardio','beginner','home',12,130,'Quick lunch-break burner.'),
('Deluxe Total Body','Hybrid','intermediate','gym',60,520,'Strength + cardio hybrid.'),
('Stretch & Restore','Recovery','beginner','home',25,90,'Deep stretch sequence.');

insert into public.rewards_catalog (title, description, cost_points, type) values
('£10 Pro Shop Credit','Use against any in-house merch.',500,'credit'),
('Free Personal Training Session','60-min 1:1 with a coach.',1500,'service'),
('Branded Shaker Bottle','Premium stainless steel shaker.',300,'merch'),
('Deluxe Hoodie','Limited drop hoodie.',2000,'merch'),
('Smoothie of the Month','Free smoothie every week, 4 weeks.',800,'service'),
('Spa Day Pass','Full access to recovery spa.',2500,'service'),
('Massage Voucher','30-min sports massage.',1800,'service'),
('Free Guest Pass','Bring a friend for a day.',400,'service'),
('Premium Upgrade — 1 Month','One month of Premium on us.',3000,'subscription'),
('Gold Member Lapel Pin','Collectible enamel pin.',200,'merch');

insert into public.challenges (title, description, goal_metric, goal_target, points_reward, starts_on, ends_on) values
('30-Day Streak','Train every day for 30 days.','workouts',30,1000, current_date, current_date + 30),
('10k Steps Daily','Hit 10,000 steps for 14 days.','steps_days',14,500, current_date, current_date + 14),
('Strength Surge','Complete 12 strength workouts in a month.','strength_workouts',12,600, current_date, current_date + 30),
('Hydration Hero','Drink 2.5L water for 21 days.','water_days',21,400, current_date, current_date + 21),
('Mobility Mastery','10 recovery sessions in 30 days.','recovery_workouts',10,350, current_date, current_date + 30);
