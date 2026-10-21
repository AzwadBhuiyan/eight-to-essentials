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

- Users choose a target level (D29). Only requirements up to the target are asked, and no result is ever above it.
- Each requirement is answered once. **Yes** counts as met. **Partly**, **No** and **Not sure** never count as met; **Not sure** also adds an item to the evidence request list. **Skip for now** leaves a question unanswered (D32).
- **Does not apply** (only where allowed, with a reason, individually or through a product group) and **Exception with compensating control** (reason, compensating control, approver and review date) count as met, and are listed under "Exceptions to review" (D6, D21, D22, D31).
- A strategy is at Maturity Level L when every requirement at levels 1 to L is met. Once a requirement fails, questions above it are not needed for the current level (D30). A strategy shows as incomplete, with no level, until every required question is answered.
- A shared control's answer counts for every strategy it belongs to (D5).
- The headline is the lowest strategy level, because ASD recommends reaching each maturity level across all eight strategies before moving to the next. It is final only when all eight strategies are complete, and it is not an official "overall maturity".

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

### D29. Target level

- **Decision:** Before the questions, users choose a target: Maturity Level One (default), Two or Three. Only requirements whose lowest level is at or below the target are asked: 46 questions for Maturity Level One, 87 for Two and 126 for Three. A strategy's level, and the headline, are never reported above the target. Results always state the target.
- **Hint:** "Commonwealth entities have been required to reach Maturity Level Two. If a contract, customer or insurer asks for a level, choose that one." The first sentence is sourced to Transitioning from the Essential Eight, page 9, which says Maturity Level Two was the required baseline for Commonwealth entities and many Australian critical infrastructure operators. The second sentence is the author's guidance: an obligation that names a level is the best guide to the target.
- **Changing the target:** answers above the target are kept but not used. Raising the target makes strategies incomplete again until the new questions are answered.
- **Older files:** answer files from before this change (version 1) are imported with target Maturity Level Three, because every question was asked when they were made.
- **Demo company:** its target is Maturity Level Two, so that Patch operating systems can show Maturity Level Two.

### D30. Adaptive skipping

- **Rule (per strategy):** let F be the lowest level of any in-scope requirement answered "Partly", "No" or "Not sure". The strategy cannot reach level F, so:
  - **required:** every in-scope requirement below F (everything in scope if nothing has failed)
  - **not needed:** everything else, including other unanswered requirements at level F itself, shown as "Not needed for your current level" and optional
- **Complete** as soon as every required question has a valid answer. The level is then F − 1, or the target if nothing failed. Every requirement at or below that level has a valid answer that is met, so no level is ever claimed without the required answers.
- **Shared questions** are needed if any of their strategies needs them.
- **Action list:** still lists only answered, unmet requirements. A note says how many questions were not needed (and skipped), so the list may not show all the work for the next level.
- **Transition view:** unchanged. A strategy capped at F − 1 cannot reach F, so rows that need F or higher are gaps whether or not the higher questions were answered.
- **Tested:** besides fixed examples, a randomised test (400 assessments, fixed seed, including product-group answers with and without reasons, and skipped questions) checks that a level is never above the target, that every requirement at or below a claimed level has a valid met answer, that a level below the target is explained by an unmet requirement at the next level, and that whenever every question is validly answered the result is exactly the same as the original algorithm.

### D31. Product-group answers (author's grouping)

- **Decision:** six "we don't use X" answers each cover every "Does not apply" requirement naming that product or service, with one shared reason: Microsoft Office (15 requirements), Windows devices or servers (8), online customer services (5), the organisation's own internet-facing online services (5, including ISM-1504), internet-facing servers or network devices (5) and internal servers (2). ISM-1679, ISM-1680 and ISM-1872 (third-party online services) stay as single questions, because almost every organisation uses such services.
- **Rules:** the user's own answer always wins over a group answer. A group answer counts only with a reason, like any "Does not apply". Groups can only cover requirements that allow "Does not apply" (checked by `npm run validate-data`). Each covered requirement is listed under "Exceptions to review", tagged with its group.
- **Label:** a strategy that reaches its level only through "Does not apply" answers (for example, macros when Microsoft Office is not used) is shown as "(all requirements marked 'Does not apply')", so it is not mistaken for implemented controls.
- **Helper text:** the internet-facing servers group shows "Your office router or firewall usually counts as an internet-facing network device." under its checkbox, so people do not tick it wrongly.

### D32. Skip for now, and results at any time

- **Skip for now:** any question can be skipped. A skipped question counts as unanswered. It is never counted as "not met" (that is what "Not sure" is for).
- **See results so far:** available on every wizard step. Complete strategies show their level. Incomplete strategies show how many required questions are left and, if a requirement has failed, an upper bound ("Cannot be higher than Maturity Level One so far"), which is never a claimed level.
- **Headline:** final only when all eight strategies are complete. Otherwise it says "Not final", how many strategies are complete, and that it is based on incomplete answers.

### D33. Essential Eight first; the transition view is optional

- **Decision:** The home page and results lead with the Essential Eight self-check. The ASD Essentials transition view is an optional next step ("See how this carries into ASD Essentials"), never required.
- **Rows above the target:** if a strategy reached the target and a mapping row needs a higher Essential Eight level, the row shows "Not assessed (above your target)", not a gap, because those questions were not asked. In the roll-up (D25) it ranks like "unknown": it neither makes a principle "not addressed" nor lets it read as fully addressed. If the strategy is below the target, the row is a gap as before.
- **Later (version 1.1):** the ASD Essentials phase 1 check can be offered as a separate "ASD Essentials only" path from the home page. It uses only the Essentials structure data, with its own state and results, and never takes Essential Eight answers as input, so it cannot convert levels into ratings. It needs paraphrased Indicators of Good Practice for each action and answers to the questions deferred in D19 first. Version 1.0 mentions it only on the roadmap.

### D34. Results page

- **Order:** headline (with the target, and "Not final" while any strategy is incomplete), the disclaimer, a radar chart with a levels table, the prioritised action list, evidence to find, exceptions to review, then the CSV export. The optional ASD Essentials transition view is linked from here once it exists (D33).
- **Chart:** a radar chart of each strategy's level against the target. The target is a dashed line and the levels a solid filled shape, so they differ by more than colour. Incomplete strategies are left as a gap rather than drawn at zero. The chart has a text alternative listing every strategy's result, and the table below it shows the same information. It is loaded only when the results page opens.
- **Action list:** the top five actions are shown, with a button to show the rest. Each action shows what is missing, why it matters, a next step, the effort estimate (labelled as the author's estimate) and the related ASD Essentials principles.
- **Exceptions:** "Does not apply" answers from a product group are shown once for the group (with its reason and the requirement IDs), not once per requirement. Exceptions past their review date are marked "Review overdue".
- **Results CSV:** one file laid out for spreadsheets. Columns: Section, Strategy, Requirement ID, Item, Strategy level, Requirement level, Status, Details.
  - **Section** holds one word (Note, Headline, Strategy, Action, Evidence, Exception), so the first column stays narrow and can be filtered. Long text goes in **Item**: the first row is a Note with the disclaimer, and a Note row just above the actions gives the list's framing ("Actions to lift your Essential Eight maturity" or "Risk-reduction actions"), with ASD's advice and the coverage note in Details.
  - **Headline row:** the level is the headline's own level (final, or the lowest completed strategy while not final), never the target. Status is "Final" or "Not final", and the target goes in Details ("Target: Maturity Level One").
  - **Strategy level** is filled only for the headline and strategy rows; **Requirement level** only for action and evidence rows.
  - The headline and strategy wording come from the same functions as the page, and every cell is protected against formula injection (D28).

### D35. Transition page

- **Optional:** reached from the "Next step (optional)" card on the results page, never forced (D33).
- **Order:** the "Indicative only" banner and disclaimer, a short "How to read this" guide with the roll-up note, then domains grouped under "Priority phase 1", "All phases: capability domains", "Priority phase 2" and "Priority phase 3" (D26), then "Not covered by the Essential Eight", ASD's strengthening points for each strategy (with D13's "no action-level mapping" lines and the event logging section), and ASD's recommended next steps, paraphrased.
- **Each principle:** ASD's gap term as the finding, worded with "may" ("May already be effectively addressed", "May be partially addressed", "Not addressed by your Essential Eight results"), plus "x of y actions mapped; assess the rest separately" where some actions are unmapped (D25). Priority phase 1 domains are open by default; the others are collapsed to keep the page manageable.
- **Each strategy's contribution to an action:** the status label always comes first; then a sentence explaining it; then, for "May contribute", the reminder that evidence must be current, show effectiveness and cover the domain; then ASD's note, marked "paraphrased"; then any caution (D14) and the table and page it comes from. A partial row is always labelled "Partial coverage in [domain]" before the note (D20). Tests check this in the rendered page for every partial row, including the nine with "strong" notes.
- **Statuses** are always shown as text. Colour and border style are extra cues only.
- **Always labelled as ASD Essentials:** the page is titled "ASD Essentials transition view", carries an "ASD Essentials" tag, and opens with a box saying "You are looking at ASD Essentials for enterprise IT, not your Essential Eight result", with a link back to the Essential Eight results. Every section and phase heading names ASD Essentials, and so does every domain ("ASD Essentials domain: …"), principle and action. Wherever the page refers to the user's own answers it says "Essential Eight" ("From your Essential Eight strategy …", "Your Essential Eight answer"). Tests check every heading, domain, principle, action and contribution for these labels.

### D36. Home page

- **Headline:** "Find your Essential Eight level, and see what it means for ASD Essentials."
- **Order:** headline and a one-line summary; "Start my assessment" and "See an example result" buttons; an example preview (a clearly marked placeholder until the fictional demo company is added); "How it works" in three steps; a short explainer; "What to expect"; the disclaimer; and the trust line.
- **Explainer:** each factual sentence links to its source:
  - "ASD describes the Essential Eight as the most effective of its strategies to mitigate cyber security incidents." (Essential Eight maturity model, page 1)
  - "Maturity Level Two has been the required baseline for Commonwealth entities." (Transitioning from the Essential Eight, page 9)
  - "ASD Essentials is its successor." (ASD Essentials FAQ, page 2: "Why is ASD replacing the Essential Eight?")
  - "ASD published it on 15 October 2026 and describes it as an evolution of the Essential Eight. Both are maintained during the transition." (ASD news release, 15 October 2026)
  - "This tool checks your Essential Eight level and helps you plan for ASD Essentials." (about the tool; no source needed)
  - The phrase "Australia's current cyber baseline" was considered and not used, because no source document says it.
- **What to expect:** the question count for the default target is read from the data (46 at Maturity Level One), "about 20 to 30 minutes (our estimate)" (the author's estimate, to be revised after user testing), saving and exporting, and "Nothing you enter leaves your browser."
- **Trust line:** "Built on ASD's publicly available guidance", linking the Essential Eight maturity model, ASD Essentials for enterprise IT and Transitioning from the Essential Eight, with the CC BY 4.0 credit and always paired with "Not affiliated with or endorsed by ASD or the ACSC". No crest, logos or government styling.
- **Example result:** "See an example result" goes to `#/example`, which says the example company is being added, until the demo is built.

### D37. Strategy introductions (author's wording)

Each wizard step opens with one short statement, written as a statement rather than a question so it cannot be mistaken for something to answer:

| Strategy                           | Introduction                                                             |
| ---------------------------------- | ------------------------------------------------------------------------ |
| Patch applications                 | Known security flaws in your software are fixed quickly.                 |
| Patch operating systems            | Servers, computers and network devices are kept up to date.              |
| Multi-factor authentication        | A stolen password alone isn't enough to get in.                          |
| Restrict administrative privileges | Powerful admin accounts are limited and kept separate from everyday use. |
| Application control                | Only approved programs can run.                                          |
| Restrict Microsoft Office macros   | Risky macros in documents are blocked.                                   |
| User application hardening         | Web browsers, Office and PDF software are locked down.                   |
| Regular backups                    | You can recover if ransomware hits.                                      |

### D38. Journey and framework labels

- **Journey indicator** on every journey page: "Step 1 of 3: Essential Eight questions" (context questions and wizard), "Step 2 of 3: Your Essential Eight result", "Step 3 of 3: ASD Essentials (optional)". Inside the wizard: "Strategy n of 8".
- **Parts box** at the top of the results and transition pages: "Part 1: your Essential Eight result. Part 2 (optional): how this carries into ASD Essentials", with the current part marked "(you are here)".
- **Framework tags:** every results section carries an "Essential Eight" tag (filled), and the transition page and the results page's next-step card carry an "ASD Essentials" tag (outlined). Results headings that did not already say so were renamed ("Essential Eight maturity by strategy", "Essential Eight: evidence to find", "Essential Eight: exceptions to review"); the two action list titles are unchanged. The transition page's own labelling is described in D35.

### D39. Look and feel

- One card style for every boxed element; more white space; paragraphs limited to about 65 characters wide; readable from 360px; light and dark themes.
- One accent colour (blue) for buttons, links, tags, notes and focus. The disclaimer is a neutral card with a bold label. Green, amber and red are kept only where they carry meaning (status labels, "still needed" messages, the destructive "Clear my data" button), always alongside text.
- Every colour pair meets WCAG 2.2 AA; ratios are recorded in the stylesheet. The light-theme border colour was darkened (to 3.3:1 on the card background) so form control borders still meet the 3:1 requirement on cards.

### D40. Fictional demo company: Swan River Analytics

- **Profile and context:** a fictional Perth SaaS company (about 85 staff, AWS and Microsoft 365, a part-time IT manager owning security). Context answers: still required to report the Essential Eight (customer contracts), systems on own servers, hybrid or IaaS. **Target: Maturity Level Two**, so Patch operating systems can show Maturity Level Two.
- **Answers:** all 87 questions asked at Maturity Level Two are answered, chosen from the real requirements so the levels come out naturally: Patch applications ML1 (other applications are not scanned fortnightly), Patch operating systems ML2, Multi-factor authentication ML1 (MFA everywhere, but app-based push rather than phishing-resistant), Restrict administrative privileges ML0 (developers have local admin on their everyday laptops), Application control ML0 (not implemented), Restrict Microsoft Office macros ML1 (Win32 API calls not blocked), User application hardening ML0 (users can change browser settings), Regular backups ML1. The headline is Maturity Level Zero, final. Every results section has content: three "Not sure" answers, one justified "Does not apply" (ISM-1893, no third-party online customer services) and one exception (ISM-1501, two Windows 10 field laptops, isolated, approved by the Managing Director, review 31 March 2027).
- **Change from the original plan:** the demo was first planned with Regular backups at ML1 because "restores are not tested regularly". Restore testing (ISM-1515) is a Maturity Level One requirement, so that would give ML0. To keep ML1, the demo tests restores in DR exercises and fails Maturity Level Two because AWS administrator accounts can delete backups (E8MM-2023-06), with "Not sure" whether they can read other accounts' backups (E8MM-2023-05).
- **Separate from the user's data:** the demo lives on its own routes (`#/example`, `#/example/transition`, `#/example/assessment/1` to `8`) and is supplied by its own provider. It is read-only (inputs disabled, changes ignored), never saved, and has no save, import or clear controls. The user's own answers keep running unchanged outside it. "Exit demo" returns to the user's own results (or the home page if they have no answers).
- **Always labelled:** every demo screen shows "Fictional demo company: Swan River Analytics. These are example answers, not yours." Demo page titles start with "Demo:", and the demo's results CSV starts with "FICTIONAL DEMO COMPANY" and is named `eight-to-essentials-demo-results-….csv`. The home page preview shows the demo's real radar chart and headline under "Example result: Fictional demo company".
- **Checked:** the demo is loaded through the same strict check as an imported file. Tests check the exact levels, that every question at the target is answered, the answer mix, a meaningful transition view, the labels, and that visiting every demo screen leaves saved answers byte-for-byte unchanged and in-memory answers untouched.

### D41. Saving writes only when answers change

- **Decision:** with saving on, the app writes to storage only when the answers change, not when it opens.
- **Reason:** opening the app used to rewrite unchanged saved data with a new timestamp. That was harmless but unnecessary, and it made it impossible to prove that visiting the demo leaves saved data untouched.

### D42. Report, About, and Method and sources pages

- **Report** (`#/report`, and `#/example/report` for the demo): printed from the browser (Print, or Save as PDF).
  - **Cover:** organisation name, date, target, "Self-assessment, not an official assessment.", the disclaimer and the headline. The demo report's cover says "Fictional demo company".
  - **Part 1: your Essential Eight result:** radar chart (in a fixed light palette, so it prints well in any theme), the levels table, every action (no "show all" button on paper), evidence to find and exceptions to review.
  - **Part 2 (optional): how this carries into ASD Essentials:** each domain's principles with their indicative finding, and the actions not covered by the Essential Eight, all labelled ASD Essentials. A screen-only checkbox leaves Part 2 out.
  - **Method and sources:** the scoring rules in short, the data-checked date, every source document, framework versions, the CC BY 4.0 attribution and "Not affiliated with or endorsed by ASD or the ACSC".
  - **Footer on every printed page:** "Created with Eight to Essentials by [author] · Self-assessment, not an official assessment", prefixed "Fictional demo company ·" on the demo report. The print stylesheet repeats it on each page, hides the site navigation and screen-only controls, prints in the light palette, starts each part on a new page, and prints the web address after each external link.
  - **Same wording everywhere:** the report uses the same components and wording functions as the results page, the transition page and the CSV.
- **About** (`#/about`): who built it and why, in the author's words; the skills involved (GRC, assessment design, risk-based prioritisation, secure web development); LinkedIn as the only contact. No email address or phone number.
- **Method and sources** (`#/method`): plain-English scoring rules, every design decision in summary, each of the author's own rules marked "Our rule", how ASD's documents disagree (PRO-09.2, DET-04, Essential Eight versions) and how each case was handled, limitations, every source, the CC BY 4.0 attribution, non-affiliation, and a footer with framework versions and the data-checked date. It notes that ASD writes the Essentials series mainly for Commonwealth entities, critical infrastructure and large organisations (FAQ, page 3) and links to ASD's small business guidance on cyber.gov.au.
- **Site footer:** now carries the CC BY 4.0 attribution on every page, alongside the author credit and non-affiliation. "Method" and "About" are added to the top navigation.

### D43. Security and accessibility hardening

- **Content Security Policy** (meta tag in the built site): `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`. There are no exceptions: no `unsafe-inline`, no `unsafe-eval` and no other websites. The app has no inline scripts or style attributes; Chart.js sizes its canvas through the CSS object model, which the policy allows; downloads use blob: links, which are navigations rather than fetches. Zod is set to "jitless", so it never tries to run generated code (by default it tests whether it can, and a strict policy reports that test as a violation even though it fails safely).
  - The policy is added to the built page only, because the development server needs an inline script for hot reloading.
  - **Limit:** clickjacking protection (`frame-ancestors`) only works as an HTTP header, which GitHub Pages does not let a site set.
- **Smaller first download:** the results, transition, report and method pages, the chart, and the ASD Essentials structure and mapping now load only when needed. The main script fell from about 680 kB to 337 kB (102 kB compressed).
- **Checks kept in the test suite:** strict import validation, CSV formula protection and storage failure handling (existing tests); no raw HTML, no generated code, no inline styles, no network requests, and browser storage only in one module inside try/catch (source scan); the policy itself; workflows pinned to full commit SHAs with no default permissions; and axe-core accessibility checks, heading order and labels on every page.
- **Repository security:** CodeQL analysis (security-extended queries) on every push, pull request and weekly; Dependabot weekly for npm and GitHub Actions; `SECURITY.md` pointing to GitHub's private vulnerability reporting (no email).
- **Accessibility, checked in Chrome on every page in light and dark mode:** no axe-core violations (including colour contrast), a visible focus ring on every element reached with the Tab key, and no sideways scrolling at 360 pixels wide. Two problems found and fixed: chart labels were cut off on phones (long strategy names now wrap), and question text sat on the card's border (now inside the card).

### D44. Release files and branding

- **Logo:** an "8 → E" mark (an 8, an arrow and an E in white on blue), drawn as a simple SVG. It is the favicon and appears, decorative and hidden from screen readers, next to the site name. No crest, government colour scheme, or ASD or ACSC logo is used.
- **Social preview:** `public/og-image.png` (1200 × 630) with the name, tagline, author and "Not affiliated with ASD". Open Graph tags use absolute URLs because LinkedIn and other sites require them.
- **Deployment:** GitHub Pages through GitHub Actions. The deploy workflow runs the same checks as CI before publishing. Hash-based routing means refreshing any page never shows a 404.
- **README:** the "one of the first" comparison is left out until similar tools have been checked again.

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
