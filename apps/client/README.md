# ECA (Event Condition Action) Rule Engine Laboratory

![React](https://img.shields.io/badge/React-TypeScript-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Fluent UI](https://img.shields.io/badge/UI-Fluent_UI_v9-0078D4?style=flat&logo=microsoft&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-222222?style=flat&logo=github&logoColor=white)

The ECA Model Laboratory is a browser application for creating rule models, viewing their canonical JSON, raising event occurrences in a local Web Worker, and inspecting an optional symbolic action, ambiguity diagnostics, and evaluation traces.

Status: M6 is complete and M7 is in progress. The document store, global parameter and reusable payload authoring, local file interchange, four-tab workspace with contextual guidance, cancellable/recovering worker simulator, accessible tree context commands, revision-aware navigable diagnostics, bounded experiment replay history, local-engine status, component/axe checks, and initial Playwright smoke coverage are available. Broader accessibility coverage and the complete browser journey remain planned.

The client package version is `0.1.0`; the model contract it edits and evaluates is version `1.0`.

Consumer documentation is published in the generated [project Wiki](https://github.com/rohingosling/eca-rule-engine/wiki). The Help menu opens that Wiki directly; its URL is covered by the compile-time configuration tests.

## Product experience

- The application starts with no document open. Its empty page provides New model, while local Open remains available in the surrounding menu and button bars.
- Structured forms for global parameter definitions, reusable payload definitions, events, conditions, actions, and rules.
- Parameters and Payloads are the first collections under ECA Model. A payload definition selects zero or more global parameters, and an event selects at most one reusable payload definition.
- Searchable parameter selection in payload forms, parameter-reference dropdowns in condition forms, and payload dropdowns in event forms are populated from definitions already entered in the model.
- A resizable Tree | Model/Graph/Simulator/Code | User Guide workspace. The read-only guide follows the selected tree item or active tab and connects each editing task to the mathematical technical note. Its manually editable articles live in `apps/client/src/ui/user-guide/user-guide-content.ts`. Article `formula` values are display-mode LaTeX rendered by KaTeX; definitions and guidance remain ordinary TypeScript strings rather than Markdown.
- The active filename appears in the title after an em dash; the button bar and status bar do not repeat it or expose a local filesystem path.
- A read-only, syntax-highlighted canonical JSON view with line numbers.
- Browser-local JSON, YAML, and collection CSV file operations.
- Collection and item commands are available from visible tree buttons, pointer context menus, `Shift+F10`, and the Context Menu key, with standard menu keyboard navigation.
- Direct identifier changes without confirmation prompts; forms that contain both an identifier and a display name present the identifier first, while inline contract and uniqueness checks prevent invalid commits and successful definition renames update affected references.
- Browser-local evaluation with typed payload entry, a complete rule-set query, one optional action, explicit ambiguity diagnostics, and traces.
- Reusable payload definitions describe permitted parameter shapes; an event occurrence payload is the distinct map of values entered for one simulation. Every declared occurrence value remains optional.
- Actions have no `type` property. Their `parameters` objects are inert action data returned with the selected action; the rule engine never interprets or executes them.
- Structural validation guards replacement boundaries; structurally recoverable drafts open with deterministic semantic diagnostics, revision/staleness presentation, and navigation to the affected structured-editor field.
- The Simulator retains up to 20 completed immutable experiments in memory for inspection and explicit replay.
- Immediate evaluation cancellation terminates the active worker and replaces it; worker failures preserve the document and recover with a fresh worker.
- Shared conformance with the Java reference implementation.
- Light, dark, and system theme modes.
- Fluent System Icons for compact desktop-style commands, menus, and model-tree nodes.
- An interactive React Flow projection with typed event, condition, and action nodes; rule connections; diagnostic placeholders; automatic layout; pan, zoom, fit, minimap, and synchronized form navigation.
- A complete structured editing path that does not depend on the graph.
- Coordinated arrow-key and Enter navigation for visible tree nodes and structured form controls, without overriding horizontal text caret movement, multiline editing, or vertical choice selection.
- Centralized compile-time client policy under `apps/client/src/config/`, indexed by `apps/client/src/config/README.md`; executable mirrors of schema limits are isolated in `apps/client/src/contracts/contract-limits.ts`, while contract limits and predicate semantics remain in the shared `contracts/` source of truth.

## Technology

| Concern | Choice |
|---------|--------|
| Language | TypeScript with strict compiler settings |
| UI framework | React |
| Build and development | Vite |
| Components and themes | Fluent UI React v9 |
| Icons | Fluent System Icons for React |
| Graph | React Flow projection, dynamically loaded on demand |
| Engine | Pure TypeScript validator boundary plus a cancellable/recovering evaluator Web Worker |
| Contracts | Types and a CSP-safe validator generated from shared JSON Schemas; shared conformance fixtures |
| Tests | Vitest unit/component/shared-conformance tests, scoped axe checks, and an initial Playwright smoke test |
| Hosting | GitHub Pages; static assets only |

## Documentation

- [Project overview](../../README.md)
- [Technical note](../../docs/technical-note/stateless-eca-rule-engine.pdf)
- [JSON Schemas](../../contracts/schemas/README.md)
- [Conformance fixtures](../../contracts/conformance/README.md)
- [Project Wiki](https://github.com/rohingosling/eca-rule-engine/wiki)

## Development

Run these commands from `apps/client`:

```powershell
npm ci
npm run contracts:check
npm test
npm run build
npm run build:pages
npm run dev
```

Use `npm run preview` after `npm run build` to serve the production bundle locally. `npm run contracts:check` fails when the committed TypeScript contract types, limit mirrors, or precompiled validator drift from the shared schemas.

`npm run build:pages` produces the GitHub Pages artifact with the `/eca-rule-engine/` project base path and production HTML security metadata. The repository workflow publishes that artifact; `dist` is never committed.

For the optional browser smoke test, install its browser once with `npx playwright install chromium`, then run `npm run test:browser`. The command rebuilds and serves the production bundle on a dedicated local preview server; it does not reuse an unrelated development server already listening on that port.

## Test model

Use `../../contracts/conformance/models/reference-model.json` for a valid, populated model that exercises global parameters, reusable payload definitions, events, conditions, actions, and rules. Deliberately invalid models are available under `../../contracts/conformance/models/semantic-invalid/` for future validation-interface testing.

Use `../../contracts/examples/computer-parts-courier-routing.json` for a larger demonstration containing 12 product events, raw order inputs, product restrictions, three courier actions, and local, international, and same-day routing.
