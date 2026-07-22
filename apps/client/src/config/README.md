# Client compile-time configuration

This directory is the human-facing index for application-wide defaults and adjustable compile-time properties. Change a value here when a setting should be easy to locate and consistent across every client surface.

| Module | Owns |
|--------|------|
| `application-metadata.ts` | Product title, author, description, release label, caption punctuation |
| `theme-preference.ts` | Theme choices, default theme, storage key, system-theme query |
| `editor-layout.ts` | Panel sizes, splitter dimensions, form spacing, collection/result paging, bounded previews and history, JSON virtualization |
| `model-editor.ts` | New-model defaults, undo history limits, and untrusted-document depth limit |
| `page-setup.ts` | Paper sizes, orientations, and print margin |
| `file-policy.ts` | Default filenames, import limit, accepted file types, media types |

These modules contain client policy, not model-contract truth. JSON Schema constraints and predicate semantics remain in `contracts/` so the browser and Java implementations continue to share the same authoritative contract. Executable mirrors of schema limits are indexed separately in `src/contracts/contract-limits.ts`.
