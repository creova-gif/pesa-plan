# Pesa Plan

**A personal finance and budgeting app — wallet, savings, investing, and an AI assistant to help track spending and reach goals.**

![Status](https://img.shields.io/badge/status-active_development-yellow)
![License](https://img.shields.io/badge/license-proprietary-red)
![Stack](https://img.shields.io/badge/stack-React_%2F_Vite%2C_mobile_companion-blue)

![Pesa Plan dashboard](docs/screenshots/dashboard.png)

## Overview
Pesa Plan ("pesa" — Swahili for money) is a personal-finance app with wallet, budgeting, savings, and light investing views.

## Solution
An AI assistant for transaction tracking and financial guidance, goal-setting, transaction history, notifications, and an app-lock security feature, across both web and a separate mobile app.

## Architecture
Uses a clean environment-variable-based Supabase configuration with an explicit, well-documented offline-only fallback — the app runs fully offline when `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are unset, rather than crashing. This is good practice, preserved intentionally (see `CLAUDE.md`). Whether the two codebases (web, mobile) share one data model has not been confirmed.

## Key Capabilities
- Wallet, budgeting, savings, light investing views
- AI assistant, goal-setting, transaction history, notifications, app-lock

## Getting Started
```bash
npm i
npm run dev
```

## Project Status
Core screens exist across both web and mobile codebases; not yet confirmed whether they share a data model, and no backend persistence is wired up beyond the optional Supabase connection.

## Roadmap
- [ ] Reconcile the web and mobile codebases into one data model
- [ ] Backend/persistence layer
- [ ] Security review of the app-lock feature before handling real financial data

## Contributing
See the [org-wide CONTRIBUTING.md](https://github.com/creova-gif/.github/blob/main/CONTRIBUTING.md).

## License
Proprietary — © CREOVA. All rights reserved.

## Author / Organization
Built by [Justin Mafie](https://github.com/creova-gif) under CREOVA.

## Documentation
See `CLAUDE.md`.
