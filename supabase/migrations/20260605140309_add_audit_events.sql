create extension if not exists pgcrypto with schema extensions;

create table if not exists grandfeasteu.audit_events (
	audit_event_id uuid primary key default extensions.gen_random_uuid(),
	event_id text
		references grandfeasteu.events (event_id)
		on update cascade
		on delete restrict,
	action text not null,
	actor_type text not null,
	actor_id text,
	actor_email text,
	entity_type text not null,
	entity_id text not null,
	occurred_at timestamptz not null default now(),
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	constraint audit_events_actor_type_check check (
		actor_type in ('public', 'admin', 'system')
	),
	constraint audit_events_action_nonempty check (length(btrim(action)) > 0),
	constraint audit_events_entity_type_nonempty check (length(btrim(entity_type)) > 0),
	constraint audit_events_entity_id_nonempty check (length(btrim(entity_id)) > 0),
	constraint audit_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

alter table grandfeasteu.audit_events enable row level security;

revoke all on grandfeasteu.audit_events from anon, authenticated;
grant all on grandfeasteu.audit_events to service_role;

create index if not exists audit_events_event_occurred_at_idx
	on grandfeasteu.audit_events (event_id, occurred_at desc);

create index if not exists audit_events_entity_occurred_at_idx
	on grandfeasteu.audit_events (entity_type, entity_id, occurred_at desc);

create index if not exists audit_events_action_occurred_at_idx
	on grandfeasteu.audit_events (action, occurred_at desc);

create index if not exists audit_events_actor_email_occurred_at_idx
	on grandfeasteu.audit_events (actor_email, occurred_at desc)
	where actor_email is not null;
