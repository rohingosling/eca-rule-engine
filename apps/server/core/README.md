# Server Core Module

Pure Java implementation of the mathematical evaluator. The module contains immutable domain types, the fixed predicate registry, rule matching, optional-action selection, ambiguity detection, and optional trace creation.

The evaluator is stateless and thread-safe. Several matching rules may identify the same action, but matching distinct actions produce the deterministic `ambiguous-action-selection` failure. Its tests cover predicate boundaries, action selection, ambiguity, trace reasons, determinism, replay, locality, admissible rule-set extension, and concurrent use with a recorded fixed seed.

The module remains free of Quarkus, HTTP, JSON, file-system, environment, and persistence dependencies. Run its tests from `apps/server/` with `.\mvnw.cmd -pl core test` on Windows or `./mvnw -pl core test` on Linux and macOS.
