# 📝 Pull Request Template

## Description
<!-- Provide a clear, concise summary of the changes, the problem being solved, and how this fits into our system. -->

---

## 🚀 Type of Change
- [ ] 🐛 Bug Fix
- [ ] ✨ New Feature
- [ ] 🔒 Security / Vulnerability Patch
- [ ] 💄 Redesign / Polish / Brand Alignment
- [ ] 🧹 Chore / Environment Scaffold

---

## 🛡️ CREOVA Quality Assurance Checklist
*Before requesting a review or merging, verify all applicable checks are completed. Branch, PR, and merge every single time — even for solo fixes.*

### 1. Integrity & Real-World Truth (Anti-Fabrication Standards)
*We enforce a strict policy against misleading mock states, fake labels, or unpersisted UI changes.*
- [ ] **No "Live"/"Active" claims on static or simulated features:** any status label implying a real-time or fully-wired system is only used when that system is actually live.
- [ ] **Real backend persistence:** user-facing "Save" actions actually persist to the database, not just local/session state.
- [ ] **Actual pipelines (no fakes):** AI/voice/processing features use real backend pipelines rather than simulated or hardcoded frontends.
- [ ] **Transparent demo-mode labels:** any feature running on sample/seed data is honestly labeled as such — no fabricated "live" framing.
- [ ] **Authorized admin access:** sensitive consoles and developer views have RBAC gates and are removed from general user navigation.

### 2. Security & Database Integrity
- [ ] **Supabase JWT & Edge Functions:** edge-function authorization has been validated (`verify_jwt = true` enforced unless explicitly audited for public use).
- [ ] **Row-Level Security (RLS):** all new or modified Supabase tables have active RLS policies, especially for financial or personal data.
- [ ] **Migrations actually applied:** any new migration file has been run against the target environment, not just committed to git.
- [ ] **Clean upgrade/payment paths:** payment screens and upgrade options are fully validated; paid tiers cannot be granted for free.

### 3. Performance, Layout & Localization
- [ ] **Robust offline handling (where applicable):** features preserve offline-created or offline-completed actions and do not silently discard them.
- [ ] **Copy & truncation quality:** UI strings are checked for localization accuracy and don't truncate awkwardly on small displays.
- [ ] **Visual constraints:** charts, SVGs, and layout components handle negative/zero-width constraints without rendering crashes.

---

## 🎯 Target Branch
- [ ] **`dev`** (Active Development: where all features integrate first)
- [ ] **`staging`** (Dress Rehearsal: mirrors production to catch issues before launch)
- [ ] **`main`** (Sacred Production Branch: protected, user-facing live environment)

---

## 🧪 Testing & Verification
<!-- Describe the tests run to verify these changes. Provide steps to reproduce the verification. -->

---

## 📸 Screenshots / Recordings
<!-- If modifying UI or layout, attach visual proof here. -->
