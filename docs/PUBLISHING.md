# GitHub repository

The workspace has a local Git repository on the `main` branch. The application, tests, documentation, screenshot evidence, and captioned video are intended repository contents. Dependencies, build output, logs, temporary files, and browser test traces are ignored.

Repository: [Bryllando/Fraganti](https://github.com/Bryllando/Fraganti). The repository is public and uses the `main` branch.

## Push later changes

From the project folder:

```powershell
cd C:\Users\Lenovo\Desktop\Fragranti
git add .
git commit -m "Describe your changes"
git push origin main
```

The `origin` remote points to `https://github.com/Bryllando/Fraganti.git`. If someone else has pushed changes, fetch and review them before pushing. Do not force-push over existing work.

## Reviewer handoff

- Share the repository link with the assessment reviewer.
- If you make the repository private, give the reviewer access and verify the link works for them.
- Include setup instructions, demo admin credentials, `docs/TEST-LOG.md`, `docs/screenshots/`, and `docs/demo/oud-aura-walkthrough.webm`.
- A local demo plus video is acceptable under the assessment when hosting is unavailable. If hosting is added, keep customer/admin on the same origin and configure the SPA fallback.

The project contains demonstration credentials and fictional catalog/customer data. It has no production payment service or backend. No assessment email or access invitation is sent automatically.
