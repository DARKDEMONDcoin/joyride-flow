# Backend Audit — Supabase (ltgampdtawuefwwayncx)
Date: 2026-08-20. NOTHING HAS BEEN DELETED. This is a report only.

## Totals
- Tables (public): 336 — total size 242 MB
- DB functions (public): 411
- Cron jobs: 18 (all active)
- Edge functions in repo: 1 (`anything-api`); cron calls ~12 more that exist only on the remote project

## Table usage
- Referenced anywhere in `src/` or `supabase/`: 241
- Never referenced in code: 95 (list below)

### A. Telegram / mini-app (PROTECTED — will NOT be touched)
telegram_admins, telegram_payments, telegram_task_drafts, telegram_media, telegram_tasks,
telegram_users, telegram_referrals, telegram_task_completions, bot_admins, bot_admin_pending,
bot_pending_actions, all `gram_*` tables (70+), ton_payment_intents, star_payments,
prize_broadcast_log, auto_notification_log, mining_sessions, mining_reminders, ad_watch_progress,
attacks, battle_inventory, characters, servers, user_servers, user_tasks, user_nfts,
game_bets, game_crash_rounds, game_notifications, pvp_* (7), stakes, staking_plans,
referral_rewards, invest/investments.
Cron jobs `telegram-admin-hourly-stats`, `admin-hourly-stats`, `agent-orchestrator-tick`
(telegram-tasks-bot), `auto-notifications-every-4h` (telegram-bot) also stay.

### B. Unused and NOT Telegram-related — candidates for removal (need your OK)
Storefront / affiliate: affiliate_commissions, affiliate_payouts, affiliate_profiles,
affiliate_stores, affiliate_store_products, shop_products, shop_orders, shop_order_items,
customer_addresses, crypto_payments, dodo_catalog.
Courses / books: course_orders, course_students, bundle_books, bundle_orders, library_requests.
Bolt game (separate app, no code refs): bolt_battles, bolt_characters, bolt_payments,
bolt_players, bolt_player_characters, bolt_tasks, bolt_task_completions, bolt_upgrades.
Misc: premium_subscriptions, service_secrets (secrets in DB — security risk),
ai_generations, ai_smart_offers, ai_subscriptions (duplicated by the `gram_*` copies).

### C. Heavy / noisy tables worth trimming instead of dropping
agent_proposals 33k rows / 24 MB, game_notifications 29k / 10 MB (Telegram — keep, trim only),
prize_broadcast_log 25k, edge_audit_log 7.8k, edge_rate_limits 7k, messages 65 MB,
service_status 20 MB with 0 rows (bloat — needs VACUUM FULL), agent_observations 15 MB / 0 rows,
agent_runs 15 MB / 12 rows.

## Recommended plan (awaiting your approval)
1. Drop group B tables only (36 tables, all empty or near-empty, zero code references).
2. Reclaim bloat: VACUUM FULL on service_status, agent_observations, agent_runs, messages.
3. Add retention cron for edge_audit_log / edge_rate_limits / agent_proposals (keep 30 days).
4. Move `service_secrets` contents to Supabase secrets, then drop the table.
5. Audit the remote edge functions that are not in the repo and remove the non-Telegram dead ones.
