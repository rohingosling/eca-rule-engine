# Java Reference

The Java 21 application is a reference implementation of the query defined in the [technical note](https://github.com/rohingosling/eca-rule-engine/blob/main/docs/technical-note/stateless-eca-rule-engine.pdf).

It contains four modules:

| Module | Responsibility |
|--------|----------------|
| `core` | Immutable domain values, predicate evaluation, rule matching, and optional-action results |
| `model` | JSON parsing, structural validation, semantic validation, and immutable model compilation |
| `cli` | `validate`, `evaluate`, and `start` commands plus executable packaging |
| `service` | Optional versioned HTTP resources backed by one immutable active model |

The core module has no dependency on the command-line or HTTP adapters. Evaluation receives a compiled model and one event occurrence and returns a result without modifying either input.

## Commands

```text
java -jar cli/target/quarkus-app/quarkus-run.jar validate <model-file>
java -jar cli/target/quarkus-app/quarkus-run.jar evaluate <model-file> <event-file> [--trace]
java -jar cli/target/quarkus-app/quarkus-run.jar start [<model-file>]
```
