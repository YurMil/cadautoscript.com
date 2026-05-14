create table public.user_settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  smart_sorting boolean default false,
  default_theme text default 'auto', -- 'light', 'dark', 'auto'
  utility_display_mode text default 'compact', -- 'compact', 'detailed'
  auto_translation_language text default 'en',
  fullscreen_utilities boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.user_settings enable row level security;

create policy "Users can view their own settings"
  on public.user_settings for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own settings"
  on public.user_settings for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own settings"
  on public.user_settings for update
  using ( auth.uid() = user_id );
