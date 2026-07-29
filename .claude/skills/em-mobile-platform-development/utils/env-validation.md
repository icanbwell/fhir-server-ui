# Environment & Client Key Validation

**Always do this before starting any local dev work.**

## Steps

1. Read **both** env files:
   - `em-mobile-platform/.env` → `CLIENT_KEY`
   - `ui-platform/.env` (sibling repo) → `NX_CLIENT_KEY`
2. **Decode both keys** (base64 JSON) and extract `env` + `kid` from each:
   ```shell
   echo "$KEY_VALUE" | base64 -d
   # → {"r":"...","env":"dev","kid":"bwell_demo-dev"}
   ```
3. **Compare:** `CLIENT_KEY` and `NX_CLIENT_KEY` must be identical. If they differ, **warn immediately** — mismatched keys cause silent runtime issues.
4. **Report to dev:**
   > Your keys point to **bwell_demo** on **dev** (or whatever was detected). Are we good with this?
5. **If dev wants to change environment:**
   - First scan both `.env` files for commented-out keys (e.g. `# NX_CLIENT_KEY="..."`). Decode them and list available options:
     > Found these keys in your .env files:
     >
     > - `bwell_demo-dev` (active)
     > - `bwell_demo-staging` (commented out)
   - If the desired key is there, uncomment/swap it in both `.env` files (keep the old one as a comment).
   - If not found, point the dev to the admin tools to grab a new key:
     - **Dev:** https://big.dev.bwell.zone/admin-tools/client-key-list
     - **Staging:** https://big.staging.bwell.zone/admin-tools/client-key-list
