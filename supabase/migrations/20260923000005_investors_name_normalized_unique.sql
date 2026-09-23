-- ETL upserts (scripts/import-ksei.ts, scripts/seed-sample-data.ts) dedupe
-- investors by name_normalized via `on conflict`, which requires a unique
-- constraint, not just an index.
drop index if exists investors_name_normalized_idx;
alter table investors add constraint investors_name_normalized_key unique (name_normalized);
