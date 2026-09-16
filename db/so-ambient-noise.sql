-- Shared/CP (and Equipo, same shape). Visual prefs only — not an admin grant.
-- Adding a custom field: upsert a row. No app deploy.
--
--   insert into so_ambient_noise (email, props)
--   values ('someone@cemex.com', '{ ... }'::jsonb)
--   on conflict (email) do update
--     set props = excluded.props, updated_at = now();

create table if not exists so_ambient_noise (
  email text primary key,
  props jsonb not null,
  updated_at timestamptz not null default now()
);

alter table so_ambient_noise enable row level security;

drop policy if exists so_ambient_noise_read on so_ambient_noise;
create policy so_ambient_noise_read
  on so_ambient_noise
  for select
  to anon, authenticated
  using (true);

revoke insert, update, delete on so_ambient_noise from anon, authenticated;
grant select on so_ambient_noise to anon, authenticated;

insert into so_ambient_noise (email, props)
values (
  'alejandra.rangel@ext.cemex.com',
  '{
    "color": [0, 66, 170],
    "waveStrength": 0,
    "waveSeconds": 8,
    "waveLength": 1530,
    "waveDirection": 1,
    "driftX": 20,
    "gustAmplitude": 20,
    "gustSeconds": 1,
    "evolve": 0.26,
    "driftY": -9,
    "featureWidth": 300,
    "featureHeight": 150,
    "contrast": 3,
    "baseLevel": 0.4,
    "texture": 0.5,
    "octaveAmplitude": 0,
    "octaveFrequency": 2.8,
    "maxOpacity": 1,
    "cellWidth": 15,
    "cellHeight": 15,
    "gap": 0,
    "radius": 20
  }'::jsonb
)
on conflict (email) do update
  set props = excluded.props,
      updated_at = now();
