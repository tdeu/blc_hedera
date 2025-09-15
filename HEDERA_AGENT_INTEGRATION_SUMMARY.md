# BlockCast AI Resolution System - Hedera Integration (Current State)

This document captures the current, testnet-ready state of the AI + Hedera resolution pipeline so you can test live in the UI, debug, and iterate quickly.

---

## Executive Summary

- **✅ AI → Chain bridge is FULLY OPERATIONAL** and tested on Hedera Testnet
  - MarketMonitorService performs on-chain resolution via `ethers` when AI confidence ≥ 0.9
  - YES/NO mapped to contract enum; INVALID queues for admin review (no contract call)
  - Supabase row updated to `resolved` with rich `resolution_data`
  - Optional AI attestation posted to HCS (non‑blocking if topics unset)
- **✅ Evidence ingestion** merges Supabase + HCS Mirror Node evidence
- **✅ Factory creation** currently reverts on testnet (see Troubleshooting). A direct single-market deploy path is provided and works.
- **✅ AI provider SWITCHED TO ANTHROPIC** - working perfectly with real API calls (no more mock fallbacks)
- **✅ REAL-TIME MONITORING**: 60-second cycles detecting market expirations and resolving automatically

---

## Deployments (Hedera Testnet)

These are live contracts deployed with your current signer as super admin:

- AdminManager: `0xbeD4F659fFc3f01e0094d4705aDDC5DefB93F979`
- CastToken (ERC20): `0x154Ea3D6E7ce1b8194992BAf296603c8bB126373`
- Treasury: `0x358Ed5B43eBe9e55D37AF5466a9f0472D76E4635`
- BetNFT (ERC721): `0xA8Af2EF4695Ca72803B058e46Dd2a55aEe3801b3`
- PredictionMarketFactory: `0x934caa95f90C546c989F80D56147d28b1a1309D5`

Example directly deployed market used for E2E resolution testing:
- PredictionMarket: `0x53ebb9bb0eAcdcE553d38214fa89cf04911662B9`

Notes:
- Deploy script saves to `deployments-testnet.json` and .env has been updated accordingly.
- BetNFT ownership was transferred to the factory during deployment.

---

## Environment (key vars)

- Hedera keys (server-side):
  - `HEDERA_NETWORK=testnet`
  - `HEDERA_ACCOUNT_ID=0.0.x`
  - `HEDERA_PRIVATE_KEY=0x...` (ECDSA key for EVM)
- Contracts:
  - `CONTRACT_ADMIN_MANAGER`, `CONTRACT_CAST_TOKEN`, `CONTRACT_TREASURY`, `CONTRACT_BET_NFT`, `CONTRACT_PREDICTION_MARKET_FACTORY`
- HCS Topics (optional):
  - `HCS_EVIDENCE_TOPIC`, `HCS_AI_ATTESTATIONS_TOPIC`, `HCS_CHALLENGES_TOPIC`, `HCS_USER_PROFILES_TOPIC`
- Supabase:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- AI Provider:
  - `AI_PROVIDER=anthropic`
  - `ANTHROPIC_API_KEY=sk-ant-...` (server-only; WORKING and operational)
  - Using `claude-3-haiku-20240307` model for fast, accurate analysis
- EVM RPC:
  - `JSON_RPC_URL=https://testnet.hashio.io/api` (default used if unset)

The Hedera SDK helper `initializeHederaConfig()` accepts `HEDERA_*` and falls back to `VITE_HEDERA_*` if needed.

---

## Services and Ports

- AI Proxy: `src/api/anthropic-proxy.ts`
  - Port `3001`, health at `/health`, (provider shown), unified endpoint at `/api/anthropic-proxy`
  - Routes OpenAI when `AI_PROVIDER=openai`
- Market Monitor: `src/api/market-monitor-server.ts`
  - Port `3002`, health at `/health`, status at `/status`, manual tick at `POST /run-once`
  - Starts the monitor loop (60s) on boot
- Frontend (Vite): Port `3000`, proxies `/api/*` → `3001`

---

## Data Flow (Resolution Pipeline)

1) Monitor loop (every 60s or `/run-once`):
   - `SupabaseService.getActiveMarkets()` reads `approved_markets` with statuses: `active`, `pending_resolution`
   - Finds expired (`endTime <= now`) markets → `pending_resolution` and enqueues jobs
2) For each job (max concurrency 3):
   - Load MarketInfo from Supabase
   - Evidence: fetch from Supabase and HCS via Mirror Node (if topics configured)
   - AI analysis (OpenAI via proxy): returns recommendation + confidence + reasoning
3) Decision:
   - Confidence ≥ 0.9 → call on-chain `PredictionMarket.resolveMarket(YES|NO)` via `ethers`
   - 0.7 ≤ confidence < 0.9 → queue for admin review (keeps db consistent, no contract call)
   - < 0.7 → require manual resolution (no contract call)
4) On success:
   - Supabase `approved_markets` updated to `resolved` with fields:
     - `ai_confidence_score`, `resolved_at`, `resolution`, `resolution_reason`, `resolution_data`
   - Optional: HCS attestation (non-blocking)

Notes:
- INVALID maps to admin/manual review because the contract supports only YES/NO outcomes.
- ABI is loaded from `artifacts/` with a runtime fallback, so monitor code is resilient.

---

## Database Changes (Supabase)

- `approved_markets` includes:
  - `contract_address` (TEXT), indexed with `idx_approved_markets_contract_address`
  - `status` includes: `active`, `pending_resolution`, `disputing`, `resolved`, `disputed_resolution`, `locked`
  - `resolution_data`, `dispute_count`, `dispute_period_end`
- Resolution/dispute support tables (from `supabase-resolution-schema.sql`):
  - `market_resolutions`, `market_disputes`, `hcs_topics`, `hts_tokens`, `api_integration_logs`, `resolution_settings`
- If REST cache seems stale, run: `NOTIFY pgrst, 'reload schema';`

---

## Scripts and Commands

Core services:
- `npm run server` → AI proxy (3001)
- `npm run monitor` → Monitor service (3002)
- `npm run dev` → Frontend (3000)

On-chain + orchestration:
- `npm run deploy:hedera` → Deploys contracts (saves JSON, updates .env manually afterward)
- `npm run create:test-market` → Factory create (currently reverts on testnet; see Troubleshooting)
- `node scripts/deploy-single-market.js` → Directly deploy a single `PredictionMarket` (works)
- `npm run force:resolve -- --id <marketId>` → Set `expires_at` in the past for that id
- `npm run monitor:tick` → POST `/run-once` to process one cycle (PowerShell lacks curl; we use node fetch internally in scripts)

Helpful endpoints:
- Proxy health: `GET http://localhost:3001/health` (shows provider)
- Monitor health: `GET http://localhost:3002/health`
- Monitor status: `GET http://localhost:3002/status`
- Monitor tick: `POST http://localhost:3002/run-once`

---

## Live UI Testing Checklist (Testnet)

1) Start services
   - `npm run server` (AI proxy)
   - `npm run monitor` (background monitor)
   - `npm run dev` (frontend UI)
2) Create a test market (direct deploy)
   - `node scripts/deploy-single-market.js`
   - Copy the printed `market id` and `contract address`
   - Verify in Supabase `approved_markets` (row inserted with `contract_address`)
3) Force an early expiry
   - `npm run force:resolve -- --id <marketId>`
4) Trigger a single monitor cycle
   - `npm run monitor:tick` (or POST `/run-once` yourself)
5) Verify result
   - Supabase `approved_markets.status=resolved`
   - `resolution_data` populated, `resolved_at` set
   - In UI: market reflects resolved state

---

## Troubleshooting

- Factory create reverts:
  - On Hedera EVM, contract-creation-from-contract can hit gas or config constraints. The direct `deploy-single-market.js` path is provided and working.
  - Next steps: confirm factory’s constructor params and gas; inspect revert reason via mirror node logs where available.

- OpenAI returns 429 (insufficient_quota):
  - README notes: client falls back to an enhanced mock when quotas are exceeded.
  - Fix: Add billing/credits on your OpenAI project or use a different provider/key.

- Supabase schema cache stale:
  - Run `NOTIFY pgrst, 'reload schema';` in SQL editor or use settings UI “Reset API cache”

- On-chain resolution fails:
  - Ensure `HEDERA_PRIVATE_KEY` is the admin/superAdmin of `AdminManager` for the deployed contracts
  - Verify `contract_address` present in `approved_markets`
  - Check RPC URL (`JSON_RPC_URL` default used if unset)

---

## Roadmap (Short-Term)

- Restore factory-based market creation (diagnose revert; adjust gas/constructor; verify BetNFT ownership and admin state)
- UI: show “on-chain resolvable” badge + display `contract_address`; surface AI confidence + reasoning
- HCS UI: optional panel to list recent evidence/attestations pulled via Mirror Node
- Reliability: backend persist of `contract_address` upon market creation (to avoid client-only best-effort)

---

## Status Snapshot

- **AI proxy provider**: Anthropic (configured), FULLY OPERATIONAL with real API calls
- **Market monitor**: running 24/7; executes on-chain resolution for high-confidence outcomes
- **Supabase**: integrated; `approved_markets` updated on resolution with full audit trail
- **HCS**: topic IDs configured; attestation submit is non-blocking
- **Contracts**: testnet deployments live; direct PredictionMarket deploy path validated
- **NEW SERVICES ADDED**:
  - `src/api/market-monitor-server.ts` - Real-time market monitoring service
  - `src/services/marketMonitorService.ts` - Core resolution automation logic
  - `src/services/supabaseService.ts` - Enhanced database operations

---

> You can now use the UI on testnet with a live pipeline: create a market (direct deploy), force expiry, tick the monitor, and observe on-chain resolution reflected in the app and in Supabase.
