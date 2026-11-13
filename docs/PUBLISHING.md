# Publish the prepared project to GitHub

The workspace has a local Git repository on the `main` branch. The application, tests, documentation, screenshot evidence, and captioned video are intended repository contents. Dependencies, build output, logs, temporary files, and browser test traces are ignored.

A destination URL is still needed. The connected GitHub tools can update an accessible repository but do not provide repository creation. No remote repository or reviewer access has been claimed as complete.

## Empty destination repository

Create an empty repository under your intended GitHub account. Private is suitable for the assessment if you give the reviewer access. Leave the generated README, license, and `.gitignore` options unselected so the initial histories do not conflict.

After replacing the example URL below with the actual repository URL:

```powershell
cd C:\Users\Lenovo\Desktop\Fragranti
git remote add origin https://github.com/YOUR_ACCOUNT/oud-and-aura.git
git push -u origin main
```

If `origin` is already configured, inspect `git remote -v` before changing it. For an existing repository containing commits, inspect its history first; do not force-push or overwrite existing work.

## Reviewer handoff

- Put the actual GitHub URL in the README's submission section.
- For a private repository, give the assessment reviewer access and verify the link works for them.
- Include setup instructions, demo admin credentials, `docs/TEST-LOG.md`, `docs/screenshots/`, and `docs/demo/oud-aura-walkthrough.webm`.
- A local demo plus video is acceptable under the assessment when hosting is unavailable. If hosting is added, keep customer/admin on the same origin and configure the SPA fallback.

The project contains demonstration credentials and fictional catalog/customer data. It has no production payment service or backend. No assessment email or access invitation is sent automatically.
