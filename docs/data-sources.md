# Data sources

This document lists where each data file in `src/data/` comes from, and records places where ASD's own documents disagree with each other. Every record in the data files also carries a `source` field pointing to the exact document, table or page.

All ASD material is © Commonwealth of Australia and is used under the [Creative Commons Attribution 4.0 International licence](https://creativecommons.org/licenses/by/4.0/). The app paraphrases it and links back to the original.

## Data files

### `e8-requirements.json`

| What                                             | Source                                                                                                                                                                       |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requirements, strategies and levels              | [Essential Eight maturity model](https://www.cyber.gov.au/publication/essential-eight-maturity-model) (November 2023), Appendices A to C                                     |
| ISM IDs                                          | [Essentials for enterprise IT Assessment Workbook](https://www.cyber.gov.au/publication/essentials-for-enterprise-it), "Existing E8 Controls" sheet                          |
| Links to ASD Essentials actions                  | [Assessment evidence guide for enterprise IT](https://www.cyber.gov.au/publication/assessment-evidence-guide-for-enterprise-it), "Potential evidence sources", E8 references |
| Plain-English wording, why it matters, evidence  | Written for this project, paraphrasing the maturity model                                                                                                                    |
| Effort and exposure tags, "Does not apply" rules | The author's own judgement (see [methodology](methodology.md))                                                                                                               |

Contents: 126 requirements. 113 use an ISM ID from the workbook; 13 have no ISM ID in the workbook and use a local `E8MM-2023-NN` ID.

How ISM IDs were matched: each maturity model requirement was compared with the workbook's control descriptions by text similarity. Every match that was not an exact text match was checked by hand. For all 113 matched controls, the workbook's levels and strategies agree with the maturity model.

### `essentials-structure.json`

| What                                              | Source                                                                                                                                                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domains, descriptions and priority phases         | [ASD Essentials for enterprise IT](https://www.cyber.gov.au/publication/essentials-for-enterprise-it), Table 1 (pages 5-6) and Priority phases (pages 6-7)                                   |
| Principle IDs and titles                          | Assessment Workbook domain worksheets, cross-checked with the enterprise IT chapter's matrices                                                                                               |
| Action IDs and the domains each action applies to | Assessment Workbook, "Data" sheet (Actions table) and domain worksheets; cross-checked with the evidence guide, which agrees for all 58 actions                                              |
| Each action's place in the chapter                | Enterprise IT chapter, Matrix 1 (page 9), Matrix 2 (page 10) or Matrix 3 (pages 11-18)                                                                                                       |
| E8 controls cited for each action                 | [Assessment evidence guide for enterprise IT](https://www.cyber.gov.au/publication/assessment-evidence-guide-for-enterprise-it), "Potential evidence sources", with the page for each action |
| Plain-English action summaries                    | Written for this project, paraphrasing the workbook wording                                                                                                                                  |
| `hasE8Equivalent`                                 | Derived using the rule in [methodology D12](methodology.md#d12-not-covered-by-the-essential-eight-22-actions)                                                                                |

Contents: 8 domains, 28 principles and 58 actions. Applicable principles per domain match the workbook: Governance and culture 7, Visibility and response 10, Boundary services 16, Identity services 16, Critical processes and services 16, Privileged environments 16, Business systems 13, User devices 10.

The evidence guide also cites ISM-0304, ISM-1686, ISM-1861, ISM-1896 and ISM-1897 for IT.PRO-04.1. They are stored as `unmatchedE8References` because no E8 requirement in the data has those IDs (see [methodology](methodology.md#ism-ids-cited-in-the-evidence-guide-but-not-in-the-workbook)).

### `e8-to-essentials-map.json`

| What                                                                      | Source                                                                                                                                                                                       |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Principles mapped to each strategy                                        | [Transitioning from the Essential Eight](https://www.cyber.gov.au/publication/transitioning-from-the-essential-eight), Table 2 (page 10) and each strategy section's "Key mapped principles" |
| Action mapping rows (action, domain, contributing level, full or partial) | Tables 3 to 9 (pages 11-19)                                                                                                                                                                  |
| `strengthenNote`                                                          | Paraphrase of each table's "Existing E8 contribution" column                                                                                                                                 |
| Points to strengthen for each strategy                                    | Each strategy's "Where investment(s) may need to be strengthened" section (pages 12-20)                                                                                                      |
| Event logging, detection and response principles and points               | "Event logging, detection and response" section (pages 20-21). This section has no action table.                                                                                             |

Contents: 73 mapping rows (one per action, domain and level). Where a table says "All technology domains", a row is created for each of the six technical domains. One row is kept but marked `excluded` (see below).

How the rows were matched to action IDs: the transition tables quote the action wording but give no action IDs, and several rows are worded differently from the enterprise IT chapter and workbook. Each row was matched to an action by meaning. The guide itself says the enterprise IT chapter is the authoritative source for the actions (page 10). Wording differences:

| Action      | Transition guide wording (shortened)                                                                                | Chapter or workbook wording (shortened)                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| IT.IDE-01.2 | "Continuously identify and document … as distinct assets" (Table 4)                                                 | "Maintain current records of … assets"                                                                    |
| IT.PRO-05.1 | "can only be executed from dedicated and hardened environments" (Table 6)                                           | "can only be performed from dedicated and hardened environments"                                          |
| IT.PRO-05.3 | "with the details of the user, timestamp and target" (Table 6)                                                      | "including the details of the (associated) user, timestamp and target"                                    |
| IT.PRO-12.2 | "Restrict permissions to create, modify or delete accounts or roles … to authorised administrative roles" (Table 6) | "Grant only authorised administrative roles permissions to create, modify or delete accounts and roles …" |
| IT.PRO-13.1 | "Identify and disable or remove default and unused accounts on a regular basis" (Table 6)                           | Adds "permitting exceptions only where the account is documented, justified, hardened and monitored"      |
| IT.PRO-10.2 | "to prevent unauthorised modification or deletion" (Table 9)                                                        | "to prevent unauthorised access, modification or deletion"                                                |

### `product-groups.json`

Six "we don't use X" answers (methodology D31). The grouping is the author's: each group collects the requirements whose "Does not apply" guidance names the same product or service, plus ISM-1504 in the own online services group. Each requirement's `naGroup` field points to its group. `npm run validate-data` checks that every group has members and that only requirements allowing "Does not apply" belong to a group.

### `meta.json`

Framework names, versions and publication dates, links to every document cited, the CC BY 4.0 attribution text, and `dataCheckedOn`: the date the data was last checked against the official documents (20 October 2026).

## Validation

`npm run validate-data` checks all four files. It runs in the test suite and will run in CI. It reports:

- missing, misspelt or unknown fields, and values of the wrong type (Zod schemas in `src/data/schemas.ts`, which are strict)
- duplicate IDs in any file
- unknown strategy, domain, principle or action names
- broken references between files, including links that only go one way (an E8 requirement links to an action that does not list it back)
- mapping rows in a domain where the action does not apply (except rows marked `excluded`)
- principle and action counts that no longer match the Assessment Workbook (28 principles, 58 actions, and the per-domain counts above)
- `hasE8Equivalent` and `principlesWithoutActionMapping` values that do not follow the methodology rules

## Known inconsistencies between ASD documents

These are places where two ASD publications disagree. Each entry records what the app does about it.

### PRO-09.2 "Block outbound network connections" in the User devices domain

- **Transitioning from the Essential Eight**, Table 8 (User application hardening action mapping), page 18, maps User application hardening to the Content filtering action "Block outbound network connections to known malicious or untrusted destinations" in **User devices** (partial, Maturity Level One).
- **ASD Essentials for enterprise IT**, Matrix 3 (Technical domains), page 17, the **Assessment Workbook** (the action appears only on the "Boundary services" and "Critical processes and services" sheets) and the **Assessment evidence guide**, action IT.PRO-09.2, page 46, all say this action applies only to **Boundary services** and **Critical processes and services**. The evidence guide also lists its E8 reference as "N/A".
- **What the app does:** drops the Table 8 row for User devices, because the action does not apply in that domain. Without that row, IT.PRO-09.2 has no valid Essential Eight mapping, so it is listed under "Not covered by the Essential Eight".

### IDE-01.2 "Maintain current records of assets"

- **Transitioning from the Essential Eight**, Table 4 (Patching action mapping), page 12, maps patching to an Asset identification action in all six technical domains (partial, Maturity Level One). The table words the action as "Continuously identify and document infrastructure, operating systems, applications, identities, credentials and data as distinct assets".
- **Assessment evidence guide**, action IT.IDE-01.2, page 14, lists the E8 reference as "N/A". The enterprise IT chapter and workbook word the action differently ("Maintain current records of…").
- **What the app does:** treats the Table 4 row as ASD's mapping for IT.IDE-01.2, so the action is **not** listed under "Not covered by the Essential Eight".

### Table 2 compared with the strategy sections

- **Transitioning from the Essential Eight**, Table 2 (page 10), lists Legacy system management for both patching strategies and Least privilege access for Regular backups, but Tables 4 and 9 have no action rows for those principles.
- The User application hardening section (page 18) names Content filtering as a key mapped principle, but Table 2 does not list it for that strategy.
- **What the app does:** keeps both lists (`table2Principles` and `sectionPrinciples`) and shows principles with no action rows as "ASD lists this principle but gives no action-level mapping" ([methodology D13](methodology.md#d13-principles-with-no-action-level-mapping)).

### DET-04 principle title

- **ASD Essentials for enterprise IT**, Matrix 3, page 18, and Transitioning from the Essential Eight, page 20, use "Baselined high-risk access activities".
- The **Assessment Workbook** uses "Baseline high-risk access activities".
- **What the app does:** uses the chapter's title, "Baselined high-risk access activities".

### Number of Identity, credential and access management actions in Identity services

- **Assessment process guide**, page 23, gives an example where this principle "has six applicable actions under the Identity services domain".
- The **enterprise IT chapter**, **workbook** and **evidence guide** list five PRO-13 actions for Identity services (IT.PRO-13.1, 13.2, 13.4, 13.5 and 13.6). The sixth PRO-13 action, IT.PRO-13.3, applies only to Visibility and response.
- **What the app does:** follows the chapter and workbook. The example in the process guide is illustrative and does not affect the data.

## Other documents cited

| Document                                                                                                                                                                                                | Used for                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [ASD Essentials overview: Which chapter should I start with?](https://www.cyber.gov.au/publication/which-chapter-should-i-start-with)                                                                   | Advice that organisations operating predominantly on PaaS or SaaS should start with the cloud chapter, and others with the enterprise IT chapter ("Enterprise IT or cloud?", page 4) |
| [ASD Essentials: evolving our approach to cyber security resilience](https://www.asd.gov.au/news/2026-10-15-asd-essentials-evolving-our-approach-cyber-security-resilience) (ASD news, 15 October 2026) | Launch date of ASD Essentials, and that ASD will maintain both the Essential Eight and the Essentials during the transition. Facts only; no text reproduced.                         |
