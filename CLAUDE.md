# CLAUDE.md — pesa-plan

## Project Overview
Fintech planning product.

## Architecture — Backend Configuration
Explicitly designed to run in full offline-only mode when `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are unset — `supabase` client is `null` and `isSupabaseEnabled` is checked before any backend call. This is a deliberate, well-documented fallback (see the comment block at the top of the Supabase client file) — preserve this pattern in any new backend-dependent code; don't assume the client is always present.

## Technology Stack
React, Vite/Expo (verify which), TypeScript, Supabase (optional, env-var configured).

## CI
This repo has its own `eas-build.yml` — do not add a duplicate/competing CI workflow.

## AI Agent Rules
- Any new feature that touches `supabase` must handle the `null` case (offline mode) explicitly, not assume it's always configured.

## Definition of Done
New Supabase-dependent code checks `isSupabaseEnabled` first and degrades gracefully when false.
