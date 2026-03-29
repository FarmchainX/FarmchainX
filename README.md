# Farmchainx

Primary guide for this repository. Start here for setup, run, architecture, and documentation links.

## What This Repo Contains

- `FarmchainX/`: React frontend (farmer/customer/admin portals)
- `backend/`: Spring Boot backend API
- `docs/`: canonical implementation, deployment, and operational guides

## Start Here

- New contributor: read this file end-to-end, then `docs/QUICK_START.md`
- Frontend developer: go to `FarmchainX/README.md`
- Backend developer: go to `backend/ENV_SETUP_GUIDE.md` and `backend/SETUP_CHECKLIST.md`
- Deployment: go to `docs/DEPLOYMENT_CHECKLIST.md`

## Quick Run

```powershell
Set-Location "C:\Farmchainx\FarmchainX"
npm install
npm run dev
```

```powershell
Set-Location "C:\Farmchainx\backend"
./mvnw spring-boot:run
```

If your environment differs (ports, DB credentials, Java path), follow:
- `backend/ENV_QUICK_REFERENCE.md`
- `backend/ENV_SETUP_GUIDE.md`

## Documentation Map

### Core Docs (Canonical in `docs/`)

- `docs/QUICK_START.md`: fastest path for feature usage and smoke checks
- `docs/DEVELOPER_GUIDE.md`: translation integration and coding usage
- `docs/LANGUAGE_FEATURE.md`: architecture and language feature deep dive
- `docs/IMPLEMENTATION_SUMMARY.md`: what was changed and why
- `docs/IMPLEMENTATION_CHECKLIST.md`: implementation status checklist
- `docs/DEPLOYMENT_CHECKLIST.md`: pre/post-deploy and rollback steps
- `docs/PROJECT_COMPLETE.md`: high-level completion report
- `docs/FILE_MANIFEST.md`: created/modified file inventory

### Secondary/Legacy Navigation

- `DOCUMENTATION_INDEX.md`: lightweight legacy pointer to this README

### Root Compatibility Stubs

- Root files with the same names are kept for backward compatibility.
- Prefer `docs/*` targets when sharing links.

### Additional Guides Added During Iterations

- `TRANSLATION_GUIDE.md`
- `TRANSLATION_IMPLEMENTATION_SUMMARY.md`
- `DYNAMIC_CONTENT_TRANSLATION_FAQ.md`
- `LANGUAGE_SELECTOR_GUIDE.md`
- `COMPLETION_CHECKLIST.md`

## Multi-Language Feature Snapshot

- Supported codes: `en-IN`, `hi-IN`, `te-IN`, `ta-IN`, `ml-IN`, `kn-IN`
- Frontend i18n entry: `FarmchainX/src/i18n.js`
- Hook: `FarmchainX/src/hooks/useTranslation.js`
- Locale files: `FarmchainX/src/locales/*.json`
- Farmer settings page integration: `FarmchainX/src/farmer/FarmerSettingsPage.jsx`

## Important Clarification: Dynamic Content Translation

- UI text (labels, buttons, headings, system messages): translated via i18n keys
- User-entered content (product names/descriptions): kept as entered unless you add a separate live translation pipeline
- FAQ and design rationale: `DYNAMIC_CONTENT_TRANSLATION_FAQ.md`

## Recommended Maintenance Policy

- Treat this `README.md` as the single entrypoint
- Avoid duplicating setup/run steps across multiple docs
- Put deep details in specialized docs, then link from here
- When changing behavior, update this file first, then targeted docs

## Verification Checklist (High-Level)

- Language selector visible in farmer settings
- Language switch updates UI immediately
- Selection persists across refresh/login
- Frontend build succeeds
- Backend starts with valid env/DB settings

## Known Hotspots

- Backend env placeholders (`MAIL_*`, DB credentials) must be set before startup
- MySQL auth failures surface as Hibernate dialect/connection errors
- Keep secrets in env or `.env`, not hardcoded in properties files

## Contributing Notes

- Prefer adding new guidance to existing docs instead of creating many new top-level markdown files
- If a new doc is needed, add a link under `Documentation Map`
- Keep commands copyable and OS-appropriate (PowerShell for this workspace)

## Local Development Setup

### Frontend
```powershell
Set-Location "C:\Farmchainx\FarmchainX"
Copy-Item ".env.example" ".env"  # Edit .env with your values
npm install
npm run dev
```

### Backend
```powershell
Set-Location "C:\Farmchainx\backend"
Copy-Item ".env.example" ".env"  # Edit .env with your values
./mvnw spring-boot:run
```

### Credentials Needed
1. **MySQL**: Local root password (set in `.env`)
2. **Gmail App Password**: Get from https://myaccount.google.com/apppasswords
3. **Google OAuth ID**: Get from https://console.cloud.google.com/apis/credentials

For detailed setup: See `GITHUB_SETUP.md` before pushing to GitHub

---

## 🔒 Security

- Do not expose sensitive data in your code.
- Use environment variables for configuration.
- Regularly update dependencies to mitigate vulnerabilities.
- Review permissions for cloud resources and APIs.
- Ensure proper network security (e.g., firewalls, VPCs).
- Monitor and audit access logs for suspicious activity.
- Backup data regularly and verify restore procedures.
- Educate your team about security best practices.

---

If you are unsure where to begin: open `docs/QUICK_START.md` next.
