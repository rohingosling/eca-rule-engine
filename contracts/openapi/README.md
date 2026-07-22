# OpenAPI Contract

`eca-service.yaml` describes the version 1 HTTP interface. JSON payload schemas are referenced from `../schemas` so the API and standalone model contract use the same definitions.

The contract targets OpenAPI 3.1.0. Current Quarkus SmallRye OpenAPI uses 3.1.0 by default, so the static contract and the planned server-generated document share one baseline. The schemas remain the authority for shared Java and TypeScript data types: current OpenAPI Generator documentation still describes OpenAPI 3.1 support as beta, and individual generator feature matrices do not support every JSON Schema composition keyword used by this contract.

`verify.py` validates this document with `openapi-spec-validator` 0.9.0 and resolves every external schema reference. The model-validation request is intentionally unconstrained at the OpenAPI schema boundary so a well-formed but structurally invalid JSON value reaches the validation operation and receives normal diagnostics.

A successful evaluation returns one required nullable `selectedAction`. If matching rules identify distinct actions, the query is undefined and `/api/v1/evaluations` returns HTTP `422` with top-level problem code `invalid-evaluation` and an `ambiguous-action-selection` diagnostic. The OpenAPI response example prefixes the direct event-document pointer `/type` to `/event/type` because the HTTP request wraps the occurrence in an `event` member.

Reference: [OpenAPI Specification](https://spec.openapis.org/oas/)
