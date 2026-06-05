alter table grandfeasteu.events
	add column if not exists theme_main_color text not null default '#005B72',
	add column if not exists theme_sub_color text not null default '#E7F6F9',
	add column if not exists theme_highlight_color text not null default '#D99A32',
	add column if not exists theme_on_main_color text not null default '#FFFFFF';

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'events_theme_main_color_hex'
			and conrelid = 'grandfeasteu.events'::regclass
	) then
		alter table grandfeasteu.events
			add constraint events_theme_main_color_hex
			check (theme_main_color ~ '^#[0-9A-Fa-f]{6}$');
	end if;

	if not exists (
		select 1
		from pg_constraint
		where conname = 'events_theme_sub_color_hex'
			and conrelid = 'grandfeasteu.events'::regclass
	) then
		alter table grandfeasteu.events
			add constraint events_theme_sub_color_hex
			check (theme_sub_color ~ '^#[0-9A-Fa-f]{6}$');
	end if;

	if not exists (
		select 1
		from pg_constraint
		where conname = 'events_theme_highlight_color_hex'
			and conrelid = 'grandfeasteu.events'::regclass
	) then
		alter table grandfeasteu.events
			add constraint events_theme_highlight_color_hex
			check (theme_highlight_color ~ '^#[0-9A-Fa-f]{6}$');
	end if;

	if not exists (
		select 1
		from pg_constraint
		where conname = 'events_theme_on_main_color_hex'
			and conrelid = 'grandfeasteu.events'::regclass
	) then
		alter table grandfeasteu.events
			add constraint events_theme_on_main_color_hex
			check (theme_on_main_color ~ '^#[0-9A-Fa-f]{6}$');
	end if;
end;
$$;

update grandfeasteu.events
set
	theme_main_color = '#005B72',
	theme_sub_color = '#E7F6F9',
	theme_highlight_color = '#D99A32',
	theme_on_main_color = '#FFFFFF'
where event_id = 'gfeu2026';

update grandfeasteu.events
set
	theme_main_color = '#1D4E89',
	theme_sub_color = '#EAF2FF',
	theme_highlight_color = '#C6283D',
	theme_on_main_color = '#FFFFFF'
where event_id = 'gfeu2025';
