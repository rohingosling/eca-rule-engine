# JSON Schemas

The schemas use JSON Schema Draft 2020-12. The model schema owns top-level parameter definitions, reusable payload definitions containing parameter-identifier references, and event types that optionally reference one payload definition. Structural validation is necessary but not sufficient: uniqueness by object identifier, reference resolution, predicate argument validation, dependency compatibility, canonical ordering, and resource limits are semantic checks defined by the product and server specifications.

| Schema | Root value |
|--------|------------|
| `model.schema.json` | ECA model |
| `evaluate-request.schema.json` | Evaluation request |
| `evaluate-response.schema.json` | Evaluation response with required nullable `selectedAction` and optional trace |
| `diagnostic.schema.json` | Ordered model-validation or evaluation-error diagnostic |
| `validation-result.schema.json` | Model validation result |
| `problem.schema.json` | HTTP Problem Details extension |
| `health.schema.json` | Liveness and readiness summary |
| `service-info.schema.json` | Service and contract capabilities |

Every schema is checked against its Draft 2020-12 meta-schema by `../verify.py`. The conformance manifest pairs each root schema with at least one accepted and one rejected fixture where rejection is meaningful. Semantic constraints that JSON Schema cannot express are covered separately by ordered diagnostic cases.

The evaluation response is a successful query result only. `selectedAction` is a complete action object or `null`; it is never an array. Rule traces use `matched` to record whether each rule's event and condition matched. If matching rules name distinct actions, no successful response exists. Implementations emit diagnostic code `ambiguous-action-selection`; an HTTP adapter wraps that diagnostic in a `422` `invalid-evaluation` problem.

`diagnostic.schema.json` defines a 4,096-Unicode-code-point message maximum. Runtime-generated messages are ordered into their canonical form before bounding; an overlong message retains its first 4,095 code points and ends with one U+2026 ellipsis. This produces the same deterministic diagnostic in the contract oracle, Java reference engine, and browser engine without splitting a supplementary Unicode character.

The `$id` values use the reserved `.example` namespace until a permanent public project URL is selected.

Reference: [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12)
