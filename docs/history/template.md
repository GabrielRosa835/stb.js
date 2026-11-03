# History Documentation Guide & Template

## Purpose
The `history` topic records the chronological evolution of the project's documentation and architectural decisions. It replaces session folders with one consolidated log per calendar day.

## How to Record History
1. **File Naming**: Use one file per calendar day named `YYYY-MM-DD.md` inside `docs/history/` (inverted date format for natural filesystem sorting).
2. **Header Date & Proximity Subsections**:
   - Inside the file, format dates as `DD/MM/YYYY` and times in 24-hour `HH:mm` (`23:59`) format.
   - Group changes that happened in proximity (e.g., within the same work session or topic focus) under a subsection header: `## [HH:mm] - [Group / Session Title]`.
3. **Content**: List the actions taken, documentation files created/updated/moved (`DEC_XXX`, `PEN_XXX`, `SRQ_XXX`, `URQ_XXX`, `architecture/...`), and decisions reached.
4. **Update `summary.md`**: Add or update the day's entry in `docs/history/summary.md` using `* **[YYYY-MM-DD.md](./YYYY-MM-DD.md)**: ...` with a description preferably between 200 and 300 characters (at most 500 characters).

---

## Document Template (`YYYY-MM-DD.md`)

# History: DD/MM/YYYY

## [HH:mm] - [Proximity Group / Session Title]

### Actions & Documentation Updates
- **[Action or Doc Reference]**: [Concise description of code/documentation changes performed in this block.]

### Decisions & Outcomes
- **[DEC_XXX / PEN_XXX / Outcome]**: [Summary of what was decided, updated, or deferred during this block.]
