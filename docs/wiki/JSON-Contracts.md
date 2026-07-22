# JSON Contracts

The browser and Java implementations share JSON Schema Draft 2020-12 documents for models, evaluation requests, evaluation responses, diagnostics, validation results, and service messages.

The model contract contains top-level collections for parameters, payload definitions, events, conditions, actions, and rules. Identifiers are case-sensitive, unknown properties are rejected, and exported JSON uses a stable two-space format.

A successful evaluation response always contains `selectedAction`:

- one complete symbolic action when the candidate-action set contains one distinct action; or
- `null` when the candidate-action set is empty.

Distinct candidate actions produce `ambiguous-action-selection` rather than a selected action.

Shared conformance cases exercise structural validation, semantic validation, evaluation results, traces, determinism, replay, payload locality, and admissible rule-set extensions.
