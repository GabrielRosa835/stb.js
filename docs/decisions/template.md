# Decision Documentation Guide & Template

## How to Add or Update a Decision
1. **Assign an ID**: Check `docs/decisions/summary.md` for the highest existing `DEC_XXX` number and increment by 1, padded to 3 digits (e.g., `DEC_001`).
2. **Create the File**: Name the file `DEC_XXX-[short-name].md` using `kebab-case` for `[short-name]`.
3. **Fill Out the Template**: Populate all sections below. Use `DD/MM/YYYY HH:mm` (24-hour `23:59` format) for **Last Updated**.
4. **Update `summary.md`**: Add or update the entry in `docs/decisions/summary.md` using `* **[DEC_XXX-short-name.md](./DEC_XXX-short-name.md)**: ...` with a description preferably between 200 and 300 characters (at most 500 characters).
5. **Log in `history/`**: Record the creation or modification in `docs/history/YYYY-MM-DD.md`.

---

## Document Template

# DEC_XXX: [Decision Title]

**Last Updated**: DD/MM/YYYY HH:mm
**Status**: [Active | Superseded by DEC_YYY | Deprecated]
**Related Docs**: [Optional links to SRQ_XXX, URQ_XXX, PEN_XXX, or architecture files]

### Objective
[What problem, requirement, or architectural constraint this decision aims to resolve.]

### Proposal
[The decision itself, how it works, and the technical or domain rationale supporting it.]

### Observations
[Trade-offs, implementation caveats, or additional context that does not fit Objective or Proposal.]
