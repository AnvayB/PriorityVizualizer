-- Tracks daily per-user usage of the AI-powered Talk/Type task-parsing features,
-- so the guest account can be rate-limited and every account's LLM usage can be audited.
create table public.ai_feature_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('talk', 'type')),
  usage_date date not null default (now() at time zone 'utc')::date,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, feature, usage_date)
);

alter table public.ai_feature_usage enable row level security;

-- Users can see their own usage (used by the client to show "N left today").
-- Writes are performed only by the parse-voice edge function via the service role key,
-- which bypasses RLS, so there are no insert/update policies for regular clients.
create policy "Users can view their own AI feature usage"
  on public.ai_feature_usage for select
  using (auth.uid() = user_id);
