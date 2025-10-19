# Current Conditions Golf

Terminal-style, iPhone-first viewer for on-course weather: wind (phone-relative, approximate), temp/feels, humidity, UV+cloud, precip (24h/1h/3h). Auto-refresh, minimal UI.

## Database Phase — Supabase SQL setup

### Program behavior (DB-06)
- When Supabase envs are present and logged in, Program loads via `rpc_get_program` and saves via `rpc_set_program`.
- When envs are missing, Program falls back to `localStorage` under `ie:program-notes`.
- Shows last updated timestamp when available.
