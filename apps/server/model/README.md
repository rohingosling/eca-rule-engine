# Server Model Module

Java model boundary for parsing contract documents, applying Draft 2020-12 JSON Schema and semantic validation, resolving reusable parameter and payload definitions, enforcing input limits, and compiling immutable models and event occurrences consumed by the core evaluator. Event payload references compile into the core's identifier-keyed parameter maps, keeping event-occurrence evaluation independent of the authoring representation.

All adapters share duplicate-detecting JSON configuration, exact decimal parsing, strict UTF-8 file handling, Unicode code-point string limits, deterministic diagnostic deduplication, and the framework-neutral contract JSON codec. Implementation and contract versions are read from a Maven-filtered resource so CLI and HTTP metadata share the parent POM values without hand-maintained Java constants. The documented container build evaluates the same Maven project version for its OCI label.

The shared schemas are embedded in the module artifact, while the tests consume the repository's language-neutral positive, negative, semantic, evaluation, and trace fixtures. Diagnostics are emitted in stable canonical order.

The module depends on `core` and JSON tooling but contains no HTTP resource or command-line presentation logic. Run its tests from `apps/server/` with `.\mvnw.cmd -pl model -am test` on Windows or `./mvnw -pl model -am test` on Linux and macOS.
