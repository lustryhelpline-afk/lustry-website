-- Private callback leads. Existing enquiry/pricing/media tables are untouched.
create table public.callback_requests (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null default gen_random_uuid(),
  name text not null,
  phone text not null,
  quantity integer,
  consent boolean not null,
  note text,
  source text not null default 'popup',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  constraint callback_requests_request_id_key unique (request_id),
  constraint callback_requests_name_check check (name = btrim(name) and char_length(name) between 1 and 100),
  constraint callback_requests_phone_check check (phone ~ '^\+91[6-9][0-9]{9}$'),
  constraint callback_requests_quantity_check check (quantity is null or quantity between 1 and 100000),
  constraint callback_requests_consent_check check (consent is true),
  constraint callback_requests_note_check check (note is null or char_length(note) <= 300),
  constraint callback_requests_source_check check (source = btrim(source) and char_length(source) between 1 and 40),
  constraint callback_requests_status_check check (status in ('new', 'contacted', 'closed'))
);

alter table public.callback_requests enable row level security;
revoke all privileges on table public.callback_requests from public, anon, authenticated, service_role;
grant select, insert on table public.callback_requests to service_role;

comment on table public.callback_requests is 'Private callback requests saved only through the callback-request Edge Function. No public read/write policies.';
