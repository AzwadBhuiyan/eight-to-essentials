# Methodology

This document explains where the app's data comes from, how it is scored, and the design decisions made along the way. Scoring rules, the action list and the transition view will be documented here in more detail as they are built. For per-file sources and known inconsistencies between ASD documents, see [data-sources.md](data-sources.md).

## Sources

| Document                                                                                       | Official page                                                                                         |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Essential Eight maturity model (first published June 2017, last updated November 2023)         | https://www.cyber.gov.au/publication/essential-eight-maturity-model                                   |
| ASD Essentials for enterprise IT                                                               | https://www.cyber.gov.au/publication/essentials-for-enterprise-it                                     |
| Essentials for enterprise IT Assessment Workbook                                               | https://www.cyber.gov.au/publication/essentials-for-enterprise-it                                     |
| Transitioning from the Essential Eight                                                         | https://www.cyber.gov.au/publication/transitioning-from-the-essential-eight                           |
| Assessment process guide                                                                       | https://www.cyber.gov.au/publication/assessment-process-guide                                         |
| Assessment evidence guide for enterprise IT                                                    | https://www.cyber.gov.au/publication/assessment-evidence-guide-for-enterprise-it                      |
| ASD Essentials overview: Frequently asked questions                                            | https://www.cyber.gov.au/publication/frequently-asked-questions                                       |
| ASD Essentials overview: Which chapter should I start with?                                    | https://www.cyber.gov.au/publication/which-chapter-should-i-start-with                                |
| ASD news: ASD Essentials: evolving our approach to cyber security resilience (15 October 2026) | https://www.asd.gov.au/news/2026-10-15-asd-essentials-evolving-our-approach-cyber-security-resilience |

The cyber.gov.au publications are © Commonwealth of Australia and are used under the [Creative Commons Attribution 4.0 International licence](https://creativecommons.org/licenses/by/4.0/). The app paraphrases them in plain English and links back to the original. The ASD news page is cited for facts only.

## How it is scored

### Essential Eight self-check

- Each requirement is answered once. **Yes** counts as met. **Partly**, **No** and **Not sure** never count as met; **Not sure** also adds an item to the evidence request list.
- **Does not apply** (only where allowed, with a reason) and **Exception with compensating control** (reason, compensating control, approver and review date) count as met, and are listed under "Exceptions to review" (D6, D21, D22).
- A strategy is at Maturity Level L when every requirement at levels 1 to L is met. If any Maturity Level One requirement is not met, it is at Maturity Level Zero. If any of its questions is unanswered, it shows as incomplete instead of a level.
- A shared control's answer counts for every strategy it belongs to (D5).
- The headline is the lowest strategy level, because ASD recommends reaching each maturity level across all eight strategies before moving to the next. It is not an official "overall maturity".

### Prioritised action list

Unmet requirements, ordered by level, then exposure, then effort (D7, D8, D23). The title and order depend on whether the organisation is still required to report Essential Eight maturity.

### Transition view

An indicative gap analysis built on ASD's mapping tables (D9 to D15, D20, D24 to D26). It never converts Essential Eight levels into ASD Essentials effectiveness ratings.

## Design decisions

Decisions marked **(author's rule)** are the author's own and are not taken from ASD. They are labelled the same way in the app.

### D1. Which Essential Eight version is the authority

- **Decision:** The Essential Eight maturity model (November 2023) is the authority for requirement wording and maturity levels.
- **How the other version is used:** The Assessment evidence guide for enterprise IT lists "ASD's Essential Eight 02 Oct 2024" as its E8 source, and the Assessment Workbook's "Existing E8 Controls" sheet uses matching wording. These are used **only as a mapping source**: to attach ISM IDs to maturity model requirements, and to link E8 controls to ASD Essentials actions.
- **Reason:** The maturity model is the document organisations are assessed against and that contracts and insurers refer to. The October 2024 E8 publication itself was not reviewed directly; only its references in the evidence guide and workbook were.
- **Differences found:** See [Differences between the E8 sources](#differences-between-the-e8-sources).

### D2. Requirement IDs

- **Decision:** A requirement's ID is its ISM control ID (for example `ISM-0843`) wherever the Assessment Workbook gives one for that requirement. ISM IDs are never guessed or inferred from other sources.
- **Requirements without an ISM ID in the workbook:** they get a local ID in the format `E8MM-2023-NN`, numbered in the order the requirement first appears in the maturity model (Appendix A, then B, then C, and in strategy order within each appendix). Each record carries `idSource: "ism"` or `idSource: "local"`, so local IDs are labelled as such in the app. The 13 local IDs are listed under [Differences between the E8 sources](#requirements-in-the-maturity-model-with-no-ism-id-in-the-workbook).
- **Reason:** The format cannot be confused with an ISM ID, points to the document the requirement comes from, and can be swapped for an official ID later without breaking other references.

### D3. Licence and attribution placement

- **Decision:** `LICENSE` contains the plain MIT licence only. The CC BY 4.0 attribution for ASD content appears in the README and on the app's Method and sources page.
- **Reason:** Keeps the licence file in standard MIT form so tools detect it correctly, while keeping the attribution where readers will see it.

### D4. One question per requirement

- **Decision:** Each requirement is asked as one question. Where a requirement has several conditions (for example, a list of file types or account types), they are shown as short bullet points under the question, and the answer covers all of them. Requirements are not split into sub-questions or sub-IDs.
- **Reason:** Keeps a one-to-one link between questions and ASD's requirements, which keeps scoring and traceability simple.

### D5. Shared controls and multi-level controls

- **Decision:** A requirement listed under several strategies (for example, protecting event logs) is asked once, and its answer counts for every strategy it belongs to. A requirement listed at several maturity levels is asked once, at its lowest level, and counts at every level it is listed at. A requirement only counts at the levels the maturity model lists (for example, ISM-1691 applies at Maturity Levels One and Two only).
- **Reason:** Follows the maturity model, where the same requirement text appears under several strategies and levels.

### D6. When "Does not apply" is allowed (author's rule)

- **Decision:** "Does not apply" is offered only where a requirement names a specific product, platform or service that an organisation may genuinely not use, for example Microsoft Office, PowerShell, Windows-only security features, internet-facing servers, internal servers, the organisation's own online services, third-party online services or online customer services. Each such requirement carries `naGuidance` explaining when the answer is appropriate, and the answer always needs a written reason. Every other requirement uses the "Exception with compensating control" route instead.
- **Requirements that ask for something to be "disabled or removed"** (Internet Explorer 11, .NET Framework 3.5, Windows PowerShell 2.0) do not allow "Does not apply": if the software is not present, the requirement is met and the answer is "Yes".
- **Not allowed for data repositories, office productivity suites or PDF software** (ISM-1505, ISM-1894, ISM-1859, ISM-1823, ISM-1670, ISM-1860 and ISM-1824). Almost every organisation has data repositories, an office suite and PDF software, so a genuine exception should use the exception route instead.
- **Status:** reviewed and approved by the author. 43 requirements allow "Does not apply".

### D7. Exposure tags (author's rule)

Used only to order the prioritised action list, matching ASD's priority phase 1 focus on boundary and identity services. The first rule that matches applies:

1. **identity:** requirements about multi-factor authentication, privileged access or credentials (most of Multi-factor authentication and Restrict administrative privileges, plus the Windows credential-protection features).
2. **boundary:** requirements about internet-facing servers, internet-facing network devices or online services.
3. **other:** everything else.

### D8. Effort tags (author's rule)

Each requirement is tagged `quick-win`, `moderate` or `project` as the author's rough estimate of the work typically needed. These are not from ASD, and actual effort depends on the organisation.

### D9. Patching mappings apply to both patching strategies (author's rule)

- **Context:** In Transitioning from the Essential Eight, Patch applications and Patch operating systems share one action mapping table (Table 4).
- **Decision:** Each Table 4 row is checked separately against the organisation's level for Patch applications and for Patch operating systems. The weaker result wins.
- **Reason:** Consistent with the weakest-link approach used elsewhere, and avoids crediting application patching for operating system work (or the reverse).

### D10. Visibility and response shows "E8 evidence to check"

- **Context:** Transitioning from the Essential Eight has a section on event logging, detection and response but no action mapping table for it.
- **Decision:** For Visibility and response actions, the transition view lists the E8 controls the evidence guide cites as "E8 evidence to check", with no status and no gap.
- **Reason:** ASD gives no contributing maturity level or full/partial contribution here, so any status would be invented.
- **Clarification (IT.IDE-01.1):** Transitioning from the Essential Eight, Table 4 (page 12), gives one Visibility and response action an explicit mapping row: IT.IDE-01.1 (approved asset inventory with automated discovery), contributing in full at Maturity Level One for both patching strategies. That action uses ASD's Table 4 row like any other mapped action. "E8 evidence to check" applies only to the Visibility and response actions without a mapping row.

### D11. Known inconsistencies between ASD documents

- **Decision:** Where ASD documents disagree about whether an action applies in a domain, the enterprise IT chapter, Assessment Workbook and evidence guide win over the transition guide. The Table 8 row mapping PRO-09.2 to User devices is dropped.
- **Record:** Each inconsistency is listed in [data-sources.md](data-sources.md#known-inconsistencies-between-asd-documents) with the tables and pages involved.

### D12. "Not covered by the Essential Eight" (22 actions)

- **Decision:** An action is listed as "Not covered by the Essential Eight" only when the evidence guide gives "E8: N/A" for it **and** no valid transition-table row maps any strategy to it. This gives 22 actions. IT.IDE-01.2 is excluded because Transitioning from the Essential Eight, Table 4, maps it; IT.PRO-09.2 is included because its only transition row is dropped under D11.
- **Reason:** Avoids telling users there is no overlap where ASD's transition guide says there is some.

### D13. Principles with no action-level mapping

- **Decision:** Where Transitioning from the Essential Eight lists a mapped principle (in Table 2 or a strategy section) but gives no action rows for it, the app shows: "ASD lists this principle but gives no action-level mapping." No status is given. This applies to Legacy system management (patching), Least privilege access (Regular backups) and Content filtering (User application hardening, which appears in the section but not in Table 2).

### D14. Multi-factor authentication mapping (Table 5)

- **Decision:** Table 5 is followed as written. It lists Maturity Level One as contributing in full to the phishing-resistant MFA action in Boundary services and Critical processes and services. The app shows a visible note that the Essential Eight only requires phishing-resistant MFA from Maturity Level Two, so users should check their evidence shows phishing-resistant MFA.

### D15. Several mapping rows for one action and domain

- **Decision:** An action and domain can have more than one mapping row (Table 7 lists User devices as partial at Maturity Level One and full at Maturity Level Three). The app uses the highest row the organisation's strategy level reaches.

### D16. Cloud chapter advice and launch date

- **Decision:** The notice for organisations that run mostly on SaaS and PaaS cites "ASD Essentials overview: Which chapter should I start with?" (page 4), which says the cloud chapter is the appropriate starting point for organisations operating predominantly on PaaS or SaaS. The 15 October 2026 launch date and the statement that ASD will maintain both frameworks during the transition cite the ASD news release of 15 October 2026.

### D17. Helper text under some questions

- **Decision:** A few questions carry a one-line `helpText` to clarify terms, without changing ASD's meaning in the question itself:
  - ISM-1701, ISM-1877 and ISM-1694: "Your office router or firewall usually counts as an internet-facing network device."
  - E8MM-2023-03: "If you don't have a CISO, this means the person responsible for cyber security." The question keeps ASD's wording ("chief information security officer, or their delegate").
- **Reason:** Smaller organisations may not recognise their router or firewall as an internet-facing network device, or may not have a CISO.

### D18. "Vendor mitigations" wording

- **Decision:** Where the maturity model says "patches, updates or other vendor mitigations", the plain-English question begins "Patches, updates or other vendor fixes (such as workarounds) for…". This applies to all 15 such requirements:
  - Patch applications (6): ISM-1876, ISM-1690, ISM-1691, ISM-1693, ISM-1692 and ISM-1901.
  - Patch operating systems (9): ISM-1877, ISM-1694, ISM-1695, ISM-1696, ISM-1902, ISM-1879, ISM-1697, ISM-1903 and ISM-1904. These read "…for the operating systems of your…", "…for drivers…" or "…for firmware…".
- **Reason:** Keeps ASD's meaning (any fix the vendor provides, not only workarounds) in plain English, and words every patching timeframe question the same way. A test checks all 15.

### D19. Deferred to the ASD Essentials phase 1 check (version 1.1)

Two scoring questions are deferred until the phase 1 check is built: how a principle is rated when one action is not effective and another is not assessed (the Assessment Workbook and the Assessment process guide differ), and whether not-assessed principles stay in the domain percentage denominator.

### D20. Partial rows always read as partial

- **Context:** In Transitioning from the Essential Eight, each action has one "Existing E8 contribution" note, shared by every domain in that row, even where ASD marks some domains as partial. So a note can say "strong evidence" or "strong starting point" on a row that ASD marks as partial for that domain. This affects 9 rows:
  - T5-05 and T5-06: IT.PRO-13.4 in Identity services and User devices (note: "strong evidence")
  - T6-02, T6-03 and T6-04: IT.PRO-05.1 in Boundary services, Identity services and Critical processes and services ("strong evidence")
  - T6-12: IT.PRO-12.3 in Identity services ("strong starting point")
  - T9-03, T9-04 and T9-05: IT.PRO-10.1 in Boundary services, Identity services and Privileged environments ("strong starting point")
- **Decision (rule for the transition view, built in Phase 6):** For any row ASD marks as partial, the transition view always shows a clear "Partial coverage in [domain]" label as the row's status, placed before the note and not only conveyed by colour. The note is never shown on its own and never replaces the status. The note's wording is kept as written; the status comes only from ASD's full/partial marking.
- **Reason:** Stops a positive-sounding note from making partial coverage read as full, consistent with the rule that a partial contribution never shows as "may contribute" in full.

### D21. Invalid answers count as unanswered

- **Decision:** An answer that breaks the answer rules (for example "Does not apply" without a reason, or an exception missing its compensating control, approver or a real review date) is treated as unanswered. The strategy shows as incomplete until it is fixed.
- **Reason:** An incomplete answer should never produce a maturity level or count as met.

### D22. Overdue exception reviews are flagged (author's rule)

- **Decision:** In "Exceptions to review", an exception whose review date is before today is flagged as overdue. This does not change scoring: a valid exception still counts as met.
- **Reason:** The maturity model expects exceptions to be reviewed regularly, and Transitioning from the Essential Eight (page 21) warns against relying on expired exceptions without review.

### D23. Action list details (author's rules)

- **Exposure ranking:** `boundary` and `identity` rank equally, ahead of `other` (D7).
- **"Linked to priority phase 1":** a requirement is linked when at least one of its Essentials actions applies in a priority phase 1 technical domain (Boundary services or Identity services). The capability domains are not counted, because they apply in every phase and would not distinguish anything.
- **Risk-reduction order:** when Essential Eight reporting is not required (or the answer is "not sure"), linked items come first; within each group the usual order applies (level, exposure, effort).
- **Ties:** items that tie keep the order of the data file (strategy, then level).
- **Unanswered questions** are not actions; they make the strategy incomplete instead.
- **Next step:** a short generic step based on the answer ("Not sure": find out and collect evidence; "Partly": extend coverage; "No": plan and put in place), with the requirement's first evidence example.

### D24. Actions with no mapping row in a domain

- **Context:** D10 covers Visibility and response. Five other actions also have E8 controls cited in the evidence guide but no row in any transition table: IT.DET-01.1, IT.DET-01.2, IT.DET-04.1 and IT.PRO-01.1 (technical domains) and IT.GOV-14.1 (Governance and culture).
- **Decision (approved):**
  - An action with **no mapping row anywhere** but with E8 controls cited shows "E8 evidence to check" in every domain where it applies, with the controls and the organisation's answers, and no status. This extends D10 to these five actions (23 action and domain pairs).
  - An action that ASD **maps in some domains but not this one** shows "no E8 mapping" in this domain, because ASD's table defines which domains the E8 contributes to.
  - An action with **no mapping row and no E8 controls** shows "no E8 mapping". These are the actions in "Not covered by the Essential Eight".

### D25. Transition roll-up (author's rule)

- **Across strategies:** where several strategies map the same action and domain (for example macros and user application hardening for IT.PRO-04.1 in User devices), the weakest strategy sets the action's status. Within one strategy, the highest row reached is used (D15).
- **Mapped actions set the finding:** within each domain, the weakest **mapped** action (one with a row in ASD's transition tables) sets the principle's finding, using ASD's gap terms: "may contribute" → already effectively addressed; "may partly contribute" → partially addressed; "gap" → not addressed; an incomplete strategy → unknown.
- **Unmapped actions are not "not addressed":** an action with no E8 mapping (including "E8 evidence to check" actions, which also have no mapping row) does **not** count as "not addressed". Treating "E8 evidence to check" actions as unmapped, both for the cap and for the count of mapped actions, is an approved interpretation: otherwise a principle could read as fully addressed while one of its actions only has evidence to check. "Not addressed" is a statement about the organisation; "no E8 mapping" is only a statement about the framework.
- **Cap:** if any applicable action in the domain is unmapped, the principle's finding is capped at **partially addressed**, so it can never read as fully addressed when part of it has no E8 mapping. The app shows how many actions are mapped, for example "1 of 5 actions mapped; assess the rest separately."
- **No mapped actions:** the finding is "E8 evidence to check" if ASD cites E8 controls for any of the actions, otherwise "no E8 mapping". Neither is a statement about the organisation.
- **Reason:** a principle should not look worse because the Essential Eight never covered part of it, and should not look better than the evidence supports. The cap keeps the second promise; leaving unmapped actions out of the weakest-link calculation keeps the first.
- **Shown as indicative:** findings are labelled as the author's roll-up, not ASD ratings. Tests check, for every combination of statuses and across the real data, that an unmapped action can never make a principle read as fully addressed.

### D26. Transition grouping order

- **Decision:** Domains are shown with priority phase 1 (Boundary services, Identity services) first, then the capability domains (Governance and culture, Visibility and response), then phase 2 and phase 3.
- **Reason:** ASD recommends addressing priority phase 1 first. The capability domains apply in every phase and are part of the phase 1 scoping step in Transitioning from the Essential Eight (page 22), so they follow straight after.

### D27. Where shared controls are asked

- **Decision:** A requirement shared by several strategies is asked once, in the step for the first of its strategies in ASD's order. For example, the event logging and incident response controls shared by four strategies are asked under Multi-factor authentication, and asset discovery and the vulnerability scanner database under Patch applications. The other strategies' steps show a short note with the answer and a link back to where it is asked.
- **Reason:** One answer per requirement (D5), while still showing every strategy what it depends on.

### D28. Saving, importing and exporting

- **Saving is opt-in.** Nothing is written to the browser's storage until the user ticks "Save my progress on this device". Turning saving off, or "Clear my data", removes what was saved. Every storage call is wrapped in try/catch, and the page says if the browser blocks saving.
- **Imported files and saved data are untrusted.** They are checked against a strict schema before use: files over 1 MB are rejected before they are read; unknown fields, wrong types, unknown requirement IDs and over-long text are rejected.
- **Work in progress is allowed.** An imported answer that is well-formed but incomplete (for example an exception without an approver) is accepted, because it may be unfinished. The wizard shows what is still needed, and the answer does not count until it is complete (D21).
- **CSV export** protects against spreadsheet formula injection: any cell starting with `=`, `+`, `-` or `@` (and, following OWASP guidance, a tab or carriage return) is prefixed with a single quote, and every cell is quoted.

## Differences between the E8 sources

Results of comparing the maturity model (November 2023) with the workbook's "Existing E8 Controls" sheet (113 controls) and the E8 references in the Assessment evidence guide.

- The maturity model contains **126** distinct requirements. **113** match a workbook control, and for all 113 the workbook's levels and strategies agree with the maturity model.
- **13** have no ISM ID in the workbook (below).

### Requirements in the maturity model with no ISM ID in the workbook

| Local ID     | Strategy                                                                                                         | Requirement (maturity model wording, shortened)                                                                                                                           | Levels        |
| ------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| E8MM-2023-01 | Patch applications                                                                                               | Online services no longer supported by vendors are removed                                                                                                                | ML1, ML2, ML3 |
| E8MM-2023-02 | Patch applications                                                                                               | Office productivity suites, web browsers and extensions, email clients, PDF software, Adobe Flash Player and security products no longer supported by vendors are removed | ML1, ML2, ML3 |
| E8MM-2023-03 | Multi-factor authentication, Restrict administrative privileges, Application control, User application hardening | Cyber security incidents are reported to the chief information security officer, or a delegate, as soon as possible                                                       | ML2, ML3      |
| E8MM-2023-04 | Restrict administrative privileges                                                                               | Privileged operating environments are not virtualised within unprivileged operating environments                                                                          | ML2, ML3      |
| E8MM-2023-05 | Regular backups                                                                                                  | Privileged user accounts (excluding backup administrator accounts) cannot access backups belonging to other user accounts                                                 | ML2, ML3      |
| E8MM-2023-06 | Regular backups                                                                                                  | Privileged user accounts (excluding backup administrator accounts) are prevented from modifying and deleting backups                                                      | ML2, ML3      |
| E8MM-2023-07 | Patch applications                                                                                               | Other applications no longer supported by vendors are removed                                                                                                             | ML3           |
| E8MM-2023-08 | Patch operating systems                                                                                          | The latest release, or the previous release, of operating systems are used                                                                                                | ML3           |
| E8MM-2023-09 | Restrict administrative privileges                                                                               | Memory integrity functionality is enabled                                                                                                                                 | ML3           |
| E8MM-2023-10 | Restrict administrative privileges                                                                               | Local Security Authority protection functionality is enabled                                                                                                              | ML3           |
| E8MM-2023-11 | Restrict administrative privileges                                                                               | Credential Guard functionality is enabled                                                                                                                                 | ML3           |
| E8MM-2023-12 | Restrict administrative privileges                                                                               | Remote Credential Guard functionality is enabled                                                                                                                          | ML3           |
| E8MM-2023-13 | Restrict Microsoft Office macros                                                                                 | Microsoft Office's list of trusted publishers is validated annually or more often                                                                                         | ML3           |

These 13 have no Essentials action links, because the evidence guide cites E8 controls by ISM ID only.

### ISM IDs cited in the evidence guide but not in the workbook

The evidence guide lists ISM-0304, ISM-1686, ISM-1861, ISM-1896 and ISM-1897 as E8 references for action IT.PRO-04.1. They are not in the workbook's E8 controls list, and neither document gives their wording. They are **not** matched to any requirement, because that would mean guessing.

### Wording differences (meaning unchanged at the level the app uses)

| ISM ID                                                                        | Maturity model (November 2023)                                                                | Workbook / October 2024 wording             |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------- |
| ISM-1507, ISM-1508, ISM-1647                                                  | "systems, applications and data repositories"                                                 | "systems and their resources"               |
| ISM-1648, ISM-1649                                                            | "systems and applications"                                                                    | "systems and their resources"               |
| ISM-1670, ISM-1824, ISM-1860 and the patching controls that list PDF software | "PDF software"                                                                                | "PDF applications"                          |
| Logging and incident controls                                                 | "cyber security"                                                                              | "cybersecurity"                             |
| ISM-1814                                                                      | ML3 text: "Unprivileged accounts are prevented…" (ML1 and ML2: "Unprivileged user accounts…") | "Unprivileged user accounts are prevented…" |

The workbook also names the macros strategy "Microsoft Office Macro Settings" in one column. The app uses ASD's strategy name, "Restrict Microsoft Office macros".

### Level-limited controls

Some controls apply only at certain levels because a stricter control replaces them at a higher level: ISM-1691 and ISM-1695 (ML1 and ML2 only) and ISM-1873 (ML2 only). The app follows the levels listed in the maturity model.
