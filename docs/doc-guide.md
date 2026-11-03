# Project Documentation Guide

**Last Updated**: 03/11/2026 19:25

This guide defines the structure, conventions, and workflows for creating and maintaining documentation inside `/docs`.

---

## 1. Documentation Topics

Each top-level subfolder inside `/docs` is called a **topic** and classifies a specific kind of knowledge:

- **`architecture/`**: Contextual, high-level specifications of the codebase—module responsibilities ("who does what"), relationships, boundaries, and dependencies. Because architectural specifications vary by context, `architecture/` does **not** use a fixed `template.md`, though it maintains a `summary.md` indexer.
- **`decisions/` (`DEC_XXX`)**: Architectural and technical decisions taken during development.
- **`pending/` (`PEN_XXX`)**: Open architectural questions, deferred decisions, or unresolved technical investigations. When a pending item is resolved, its status is updated to `Resolved` and the file is moved into `pending/resolved/`.
- **`requisites/` (`SRQ_XXX` & `URQ_XXX`)**: Divided into `requisites/system/` for System Requirements (`SRQ_XXX`) and `requisites/user/` for User Requirements (`URQ_XXX`). Both share `requisites/template.md` at the topic root, maintain independent numbering sequences, and keep separate `summary.md` files inside `system/` and `user/`.
- **`history/` (`YYYY-MM-DD.md`)**: Chronological daily log of meaningful documentation updates, decisions, and session outcomes.

---

## 2. Mutability & History Tracking

- **Mutable Living Documents**: Files inside `architecture/`, `decisions/`, `pending/`, and `requisites/` are **mutable**. They represent the **current state** of the project and must be updated in-place as the system evolves.
- **Last Updated Timestamp**: Every mutable document must display when it was last modified using the `03/11/2026 19:25` (24-hour `23:59`) format.
- **Audit Trail in `history/`**: Whenever any meaningful change is made to project documentation (creating a document, updating a decision/requisite/architecture spec, or resolving a pending item), it must be recorded in `docs/history/YYYY-MM-DD.md` under a proximity subsection.

---

## 3. Naming & Date/Time Conventions

1. **Numbered Topic Files**:
   - Format: `<PREFIX>_<XXX>-[short-name].md`
   - `<PREFIX>`: `DEC` (Decisions), `PEN` (Pending), `SRQ` (System Requisites), `URQ` (User Requisites).
   - `<XXX>`: Unique positive integer padded with leading zeros to 3 digits (`001`, `002`, ..., `999`). Each prefix maintains its own independent sequence.
   - `[short-name]`: Lowercase `kebab-case` descriptive slug (e.g., `DEC_001-crdt-local-first-replication.md`).
2. **Date & Time Formats**:
   - **Inside Document Content**: Always use `DD/MM/YYYY` for dates and 24-hour `HH:mm` (`23:59`) for times (e.g., `31/10/2026 21:51`).
   - **File & Directory Names**: Invert dates to `YYYY-MM-DD` (e.g., `docs/history/2026-10-31.md`) to preserve natural lexicographical sorting in the filesystem.

---

## 4. The `summary.md` Indexer Rule

- **Purpose**: `summary.md` acts as a fast lookup index so readers and agents can identify the right document or directory without inspecting every item individually.
- **When Required**: A `summary.md` file **must** be present in any documentation directory that contains **5 or more files/directories** (as well as in the core topic folders `decisions/`, `pending/`, `pending/resolved/`, `requisites/system/`, `requisites/user/`, `architecture/`, and `history/`).
- **Exclusions**: `summary.md` lists every document and directory in its directory **except** `template.md` and `summary.md` itself.
- **Character Limits**: Each entry's summary description must be **preferably between 200 and 300 characters**, and **at most 500 characters**.
- **Entry Format**: Use a markdown link with the filename (or directory name) as the display string and the relative path as the target:
  ```markdown
  * **[filename.md](./filename.md)**: [200–300 character summary (max 500 chars) explaining what the document or directory covers.]
  ```
