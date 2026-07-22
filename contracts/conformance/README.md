# Conformance Fixtures

Conformance cases are language-neutral semantic tests. Every execution path must load the referenced model and evaluate the event occurrence. A successful case contains nullable singular `expectedActionId` and `expectedTrace`. An invalid query instead contains one exact `expectedDiagnostic` and no success trace.

## Evaluation cases

| Case | Property |
|------|----------|
| `unknown-event.json` | No matching rule returns `null` |
| `absent-payload.json` | Exactly one matching action is returned without a payload |
| `same-action-multiple-rules.json` | Multiple matching rules naming the same action return that one action |
| `ambiguous-action-selection.json` | Matching rules naming distinct actions produce `ambiguous-action-selection` |
| `missing-dependency.json` | A missing condition dependency makes that condition false |
| `prototype-named-missing-dependency.json` | Prototype-named identifiers are absent unless supplied as own payload properties |
| `predicate-equals-object-order.json` | Object equality ignores property order and numeric spelling |
| `predicate-not-equals-number.json` | Numeric inequality selects the expected action |
| `predicate-greater-than-string.json` | String ordering uses Unicode code points rather than UTF-16 units or locale |
| `predicate-greater-than-or-equal-string.json` | Equal strings satisfy inclusive upper ordering |
| `predicate-less-than-number.json` | Strict numeric lower ordering selects the expected action |
| `predicate-less-than-or-equal-number.json` | Mathematical numeric equality satisfies inclusive lower ordering |
| `predicate-contains-array-structural.json` | Array membership uses JSON structural equality |
| `predicate-contains-string.json` | String membership uses substring containment |

Case files use `modelPath` relative to the case file. The milestone M1 corpus includes negative structural and semantic validation fixtures, trace expectations, mathematical property generators, and a manifest with stable case identifiers:

| Path | Purpose |
|------|---------|
| `manifest.json` | Stable identifiers and expected outcomes for every contract case |
| `schema/valid/` | Accepted examples for every root message schema |
| `schema/invalid/` | Rejected message examples paired by the manifest |
| `models/structural-invalid/` | Documents rejected by the model JSON Schema |
| `models/semantic-invalid/` | Schema-valid models that produce ordered domain diagnostics |
| `cases/` | Evaluation inputs with nullable action identifiers and traces, or exact diagnostics |

The semantic fixtures cover duplicate identifiers in every model-level collection, primary unresolved payload and parameter references without derivative diagnostics, condition-to-payload compatibility, predicate configuration, and comparison-type compatibility.

The four property entries in the manifest deterministically generate checks for repeated evaluation, replay after an intervening event, changes to an unused payload parameter, and preservation of a selected action under an admissible rule extension. The Python verifier is an independent executable contract oracle for the fixtures; the completed Java reference implementation runs the same corpus.

The ambiguity diagnostic code is `ambiguous-action-selection`. Its action and matching-rule identifiers are sorted in the message, and its direct event-document pointer is `/type`. An HTTP adapter prefixes that pointer to `/event/type` because the request envelope stores the occurrence under `event`. The verifier also generates an overlong ambiguity at runtime to confirm the schema-defined 4,096-code-point bound, final U+2026 truncation marker, determinism, and declaration-order invariance without storing an oversized static fixture.
