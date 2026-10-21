# Security policy

## Reporting a vulnerability

Please report security problems privately through GitHub's private vulnerability reporting:

1. Go to the repository's **Security** tab.
2. Choose **Report a vulnerability**.

Or open the form directly: [Report a vulnerability](https://github.com/AzwadBhuiyan/eight-to-essentials/security/advisories/new).

Please do not open a public issue for a security problem, and please do not include real organisations' assessment data in a report.

Helpful details:

- what the problem is and where (page, file or function)
- steps to reproduce it, or a small example file
- the impact you expect
- the browser and version, if relevant

## What happens next

This is a personal open-source project maintained in spare time. I aim to acknowledge reports within 7 days and to fix confirmed problems as quickly as I can, crediting the reporter if they wish. There is no bug bounty.

## Supported versions

Only the latest version on the `main` branch, which is the version published on GitHub Pages, receives security fixes.

## Scope

Eight to Essentials runs entirely in the browser. It has no server, accounts, analytics or API keys, and answers stay on the user's device unless they export them.

In scope, for example:

- cross-site scripting or any way to run code in the app
- bypassing the Content Security Policy
- problems in how imported answer files or saved data are checked
- spreadsheet formula injection in CSV exports
- vulnerable dependencies that affect the published app

Out of scope:

- the accuracy of the Essential Eight or ASD Essentials content (please open a normal issue)
- reports that need a compromised device or browser
- missing security headers that GitHub Pages does not allow a site to set

## Security measures in this project

- Strict Content Security Policy: scripts, styles and data only from the site itself, with no exceptions.
- No raw HTML: React escapes all text, and a lint rule forbids writing raw HTML.
- Imported files are checked against a strict schema (unknown fields, wrong types and files over 1 MB are rejected).
- CSV exports neutralise cells that spreadsheet apps would treat as formulas.
- Saving answers in the browser is opt-in, and every storage call handles failure safely.
- CodeQL analysis, Dependabot updates, locked dependency versions and GitHub Actions pinned to full commit SHAs with minimum permissions.
