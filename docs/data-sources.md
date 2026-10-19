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

## Other documents cited

| Document                                                                                                                                                                                                | Used for                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [ASD Essentials overview: Which chapter should I start with?](https://www.cyber.gov.au/publication/which-chapter-should-i-start-with)                                                                   | Advice that organisations operating predominantly on PaaS or SaaS should start with the cloud chapter, and others with the enterprise IT chapter ("Enterprise IT or cloud?", page 4) |
| [ASD Essentials: evolving our approach to cyber security resilience](https://www.asd.gov.au/news/2026-10-15-asd-essentials-evolving-our-approach-cyber-security-resilience) (ASD news, 15 October 2026) | Launch date of ASD Essentials, and that ASD will maintain both the Essential Eight and the Essentials during the transition. Facts only; no text reproduced.                         |
