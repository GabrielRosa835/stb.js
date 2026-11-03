# Pending Documentation Guide & Template

## Purpose
The `pending` topic tracks unresolved architectural questions, deferred decisions, and planned technical investigations.

## Lifecycle & How to Manage Pending Items
1. **Create**: Assign the next 3-digit padded `PEN_XXX` ID (checking both `docs/pending/` and `docs/pending/resolved/` so IDs are never reused) and create `PEN_XXX-[short-name].md` in `docs/pending/`.
2. **Maintain**: Update the document in-place as new findings emerge, updating **Last Updated** (`DD/MM/YYYY HH:mm`).
3. **Resolve**: When a pending item is resolved:
   - Change **Status** to `Resolved` and fill in the **Resolution** section (linking to any resulting `DEC_XXX`, `SRQ_XXX`, `URQ_XXX`, or `architecture/` doc).
   - Move the file from `docs/pending/` into `docs/pending/resolved/`.
   - Remove its entry from `docs/pending/summary.md` and add it to `docs/pending/resolved/summary.md` using `* **[PEN_XXX-short-name.md](./PEN_XXX-short-name.md)**: ...` (keeping the summary between 200 and 300 characters, max 500).
4. **Log in `history/`**: Record creations, significant updates, and resolutions in `docs/history/YYYY-MM-DD.md`.

---

## Document Template

# PEN_XXX: [Pending Topic Title]

**Last Updated**: DD/MM/YYYY HH:mm
**Status**: [Open | Under Investigation | Blocked | Resolved]
**Impacted Areas**: [Modules, architecture specs, or requisites affected]

### Context & Problem Statement
[Why this issue is currently open or deferred, and what architectural or domain gap it represents.]

### Open Questions
- [Question 1 that needs to be answered]
- [Question 2 that needs to be answered]

### Candidate Approaches
- **[Option A]**: [Description, pros, and cons]
- **[Option B]**: [Description, pros, and cons]

### Resolution
[Leave as "Pending resolution." while open. When resolved, document the final outcome and link to the resulting DEC_XXX or architecture documents before moving this file to `docs/pending/resolved/`.]
