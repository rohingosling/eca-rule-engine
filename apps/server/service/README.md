# Server Service Module

Quarkus REST adapter and runtime state launched by `eca start`. The M4 service provides:

- Startup only after an optional model has passed structural and semantic validation.
- An immutable active model for the lifetime of the process.
- `GET /api/v1/health` for liveness, readiness, and implementation version.
- `GET /api/v1/info` for API, schema, predicate, and active-model metadata.
- `GET /api/v1/model` for the immutable active model or a structured `404` problem.
- `POST /api/v1/models/validate` for normal valid or invalid validation results.
- `POST /api/v1/evaluations` for request-scoped or active-model evaluation.
- Bounded UTF-8 request reading, configurable model limits, and optional trace suppression.
- Problem Details responses and `X-Correlation-ID` propagation across early and application errors.
- Exact HTTPS-origin CORS (with explicit loopback HTTP development origins), credentials disabled, and structured, payload-free completion logs.
- `PORT` configuration with an `8080` default and binding on `0.0.0.0`.

The packaged-process acceptance suite starts the exact fast-jar twice and verifies configured and unconfigured model modes, validation, evaluation, trace ordering and suppression, errors, correlation, request size, and CORS. The server Dockerfile defines a pinned multi-stage build for the complete Quarkus fast-jar directory and non-root user `185`. The current image passes local build, non-root metadata, startup, health, information, active-model, and evaluation smoke checks. Packaged process tests continue to cover request limits, CORS, identity, architecture, and logging behavior.

The service owns no evaluation semantics. Its application-scoped orchestration service delegates model processing and evaluation to the shared Java modules, while request reading and contract serialization stay in focused boundary components.
