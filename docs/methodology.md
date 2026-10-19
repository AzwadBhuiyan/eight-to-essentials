# Methodology

This document explains where the app's data comes from, how it is scored, and the design decisions made along the way. Scoring rules, the action list and the transition view will be documented here as they are built.

## Sources

| Document                                                                               | Official page                                                                    |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Essential Eight maturity model (first published June 2017, last updated November 2023) | https://www.cyber.gov.au/publication/essential-eight-maturity-model              |
| ASD Essentials for enterprise IT                                                       | https://www.cyber.gov.au/publication/essentials-for-enterprise-it                |
| Essentials for enterprise IT Assessment Workbook                                       | https://www.cyber.gov.au/publication/essentials-for-enterprise-it                |
| Transitioning from the Essential Eight                                                 | https://www.cyber.gov.au/publication/transitioning-from-the-essential-eight      |
| Assessment process guide                                                               | https://www.cyber.gov.au/publication/assessment-process-guide                    |
| Assessment evidence guide for enterprise IT                                            | https://www.cyber.gov.au/publication/assessment-evidence-guide-for-enterprise-it |
| ASD Essentials overview: Frequently asked questions                                    | https://www.cyber.gov.au/publication/frequently-asked-questions                  |

All of this material is © Commonwealth of Australia and is used under the [Creative Commons Attribution 4.0 International licence](https://creativecommons.org/licenses/by/4.0/). The app paraphrases it in plain English and links back to the original.

## Design decisions

### D1. Which Essential Eight version is the authority

- **Decision:** The Essential Eight maturity model (November 2023) is the authority for requirement wording and maturity levels.
- **How the other version is used:** The Assessment evidence guide for enterprise IT lists "ASD's Essential Eight 02 Oct 2024" as its E8 source, and the Assessment Workbook's "Existing E8 Controls" sheet uses matching wording. These are used **only as a mapping source**: to attach ISM IDs to maturity model requirements, and to link E8 controls to ASD Essentials actions.
- **Reason:** The maturity model is the document organisations are assessed against and that contracts and insurers refer to. The October 2024 E8 publication itself was not reviewed directly; only its references in the evidence guide and workbook were.
- **Differences found:** See [Differences between the E8 sources](#differences-between-the-e8-sources).

### D2. Requirement IDs

- **Decision:** A requirement's ID is its ISM control ID (for example `ISM-0843`) wherever the Assessment Workbook gives one for that requirement. ISM IDs are never guessed or inferred from other sources.
- **Requirements without an ISM ID in the workbook:** _Proposed, awaiting approval._ They get a local ID in the format `E8MM-2023-NN` (for example `E8MM-2023-01`), numbered in the order the requirement first appears in the maturity model (Appendix A, then B, then C). Each record also carries `idSource: "ism"` or `idSource: "local"`, so local IDs are easy to find and are labelled as such in the app.
- **Reason:** The format cannot be confused with an ISM ID, it points to the document the requirement comes from, and it can be swapped for an official ID later without breaking other references.

### D3. Licence and attribution placement

- **Decision:** `LICENSE` contains the plain MIT licence only. The CC BY 4.0 attribution for ASD content appears in the README and on the app's Method and sources page.
- **Reason:** Keeps the licence file in standard MIT form so tools detect it correctly, while keeping the attribution where readers will see it.

## Differences between the E8 sources

Initial findings from comparing the maturity model (November 2023) with the workbook's "Existing E8 Controls" sheet (113 controls) and the E8 references in the Assessment evidence guide. The comparison will be completed requirement by requirement when the requirement data is added.

### Requirements in the maturity model with no ISM ID in the workbook

These 13 requirements appear in the maturity model but not in the workbook's E8 controls list. Under D2 they receive local IDs.

| Strategy                                                                                                         | Requirement (maturity model wording, shortened)                                                                                                                           | Levels        |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Patch applications                                                                                               | Online services no longer supported by vendors are removed                                                                                                                | ML1, ML2, ML3 |
| Patch applications                                                                                               | Office productivity suites, web browsers and extensions, email clients, PDF software, Adobe Flash Player and security products no longer supported by vendors are removed | ML1, ML2, ML3 |
| Patch applications                                                                                               | Other applications no longer supported by vendors are removed                                                                                                             | ML3           |
| Patch operating systems                                                                                          | The latest release, or the previous release, of operating systems are used                                                                                                | ML3           |
| Multi-factor authentication, Restrict administrative privileges, Application control, User application hardening | Cyber security incidents are reported to the chief information security officer, or a delegate, as soon as possible                                                       | ML2, ML3      |
| Restrict administrative privileges                                                                               | Privileged operating environments are not virtualised within unprivileged operating environments                                                                          | ML2, ML3      |
| Restrict administrative privileges                                                                               | Memory integrity functionality is enabled                                                                                                                                 | ML3           |
| Restrict administrative privileges                                                                               | Local Security Authority protection functionality is enabled                                                                                                              | ML3           |
| Restrict administrative privileges                                                                               | Credential Guard functionality is enabled                                                                                                                                 | ML3           |
| Restrict administrative privileges                                                                               | Remote Credential Guard functionality is enabled                                                                                                                          | ML3           |
| Restrict Microsoft Office macros                                                                                 | Microsoft Office's list of trusted publishers is validated annually or more often                                                                                         | ML3           |
| Regular backups                                                                                                  | Privileged user accounts (excluding backup administrator accounts) cannot access backups belonging to other user accounts                                                 | ML2, ML3      |
| Regular backups                                                                                                  | Privileged user accounts (excluding backup administrator accounts) are prevented from modifying and deleting backups                                                      | ML2, ML3      |

### ISM IDs cited in the evidence guide but not in the workbook

The evidence guide lists ISM-0304, ISM-1686, ISM-1861, ISM-1896 and ISM-1897 as E8 references for action IT.PRO-04.1. They are not in the workbook's E8 controls list, and neither document gives their wording. They are **not** matched to any requirement, because that would mean guessing.

### Wording differences (meaning unchanged at the level the app uses)

| ISM ID                                                                        | Maturity model (November 2023)                | Workbook / October 2024 wording             |
| ----------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| ISM-1507, ISM-1508, ISM-1647                                                  | "systems, applications and data repositories" | "systems and their resources"               |
| ISM-1648, ISM-1649                                                            | "systems and applications"                    | "systems and their resources"               |
| ISM-1670, ISM-1824, ISM-1860 and the patching controls that list PDF software | "PDF software"                                | "PDF applications"                          |
| Logging and incident controls                                                 | "cyber security"                              | "cybersecurity"                             |
| ISM-1814 (ML3 text)                                                           | "Unprivileged accounts are prevented…"        | "Unprivileged user accounts are prevented…" |

The workbook also names the macros strategy "Microsoft Office Macro Settings" in one column. The app uses ASD's strategy name, "Restrict Microsoft Office macros".

### Level-limited controls

Some controls apply only at certain levels because a stricter control replaces them at a higher level: ISM-1691 and ISM-1695 (ML1 and ML2 only) and ISM-1873 (ML2 only). The app follows the levels listed in the maturity model.
