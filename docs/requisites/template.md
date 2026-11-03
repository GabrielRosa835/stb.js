# Requisites Documentation Guide & Template

## Purpose
The `requisites` topic captures the current requirements of the project, divided into two subdirectories with independent ID sequences:
- **System Requirements (`docs/requisites/system/SRQ_XXX-[short-name].md`)**: Technical, non-functional, infrastructure, and domain-engine specifications.
- **User Requirements (`docs/requisites/user/URQ_XXX-[short-name].md`)**: User-facing workflows, capabilities, and domain expectations for end users.

## How to Add or Update a Requisite
1. **Select Subdirectory & Prefix**: Use `SRQ_XXX` inside `requisites/system/` or `URQ_XXX` inside `requisites/user/`.
2. **Assign an ID**: Increment the highest existing number in that specific sequence, zero-padded to 3 digits (`001`–`999`), and name the file `<PREFIX>_XXX-[short-name].md` in `kebab-case`.
3. **Fill Out the Template**: Populate all sections and set **Last Updated** in `DD/MM/YYYY HH:mm` (24-hour `23:59` format).
4. **Update Subfolder `summary.md`**: Add or update the entry in `requisites/system/summary.md` or `requisites/user/summary.md` using `* **[PREFIX_XXX-short-name.md](./PREFIX_XXX-short-name.md)**: ...` (preferably 200–300 characters, max 500 characters).
5. **Log in `history/`**: Register the creation or modification in `docs/history/YYYY-MM-DD.md`.

---

## Document Template

# [SRQ_XXX | URQ_XXX]: [Requisite Title]

**Last Updated**: DD/MM/YYYY HH:mm
**Category**: [System Requirement | User Requirement]
**Priority**: [Required | Desirable | Optional]
**Related Docs**: [Links to DEC_XXX, PEN_XXX, SRQ_XXX, URQ_XXX, or architecture files]

### Objective & Statement
[Clear, unambiguous statement of what the system or user workflow requires and why.]

### Acceptance Criteria
- [Criterion 1: Observable, verifiable condition]
- [Criterion 2: Observable, verifiable condition]

### Observations & Constraints
[Technical boundaries, dependencies, or domain nuances relevant to fulfilling this requirement.]
