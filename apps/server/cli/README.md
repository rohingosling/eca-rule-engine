# Server CLI Module

Command-line adapter for model validation, single-event evaluation, and HTTP service startup.

Status: milestone M3 complete. `validate`, `evaluate`, help, version output, bounded UTF-8 streams, canonical JSON, documented exit codes, fast-jar packaging, and Quarkus startup are implemented. The `start` command validates an optional immutable model before listening, then blocks until shutdown while the HTTP service handles requests. The M3 acceptance suite passes on Windows and Ubuntu 24.04 LTS with OpenJDK 21.

This module delegates model and event parsing to `model` and evaluation semantics to `core`. It owns only arguments, files, streams, output serialization, executable packaging, and process exit codes.

## Build and test

From `apps/server/` on Windows:

```powershell
.\mvnw.cmd -pl cli -am clean package
```

On Linux or macOS:

```sh
./mvnw -pl cli -am clean package
```

The acceptance suite executes every shared evaluation fixture through the CLI boundary and also covers validation, standard input, syntax errors, malformed JSON, unreadable files, trace selection, and version output. The `verify` phase starts the packaged fast-jar on available ports and exercises the complete HTTP service boundary.

## Commands

```text
java -jar cli/target/quarkus-app/quarkus-run.jar --help
java -jar cli/target/quarkus-app/quarkus-run.jar --version
java -jar cli/target/quarkus-app/quarkus-run.jar validate <model-file>
java -jar cli/target/quarkus-app/quarkus-run.jar evaluate <model-file> <event-file> [--trace]
java -jar cli/target/quarkus-app/quarkus-run.jar start [<model-file>]
```

Use `-` instead of a path to read UTF-8 JSON from standard input. The `evaluate` command accepts one standard-input source, never two. Successful machine-readable output is emitted only on standard output; diagnostics use standard error.

The `start` command reads `PORT`, defaulting to `8080`, and listens on `0.0.0.0`. With a startup model:

```powershell
$env:PORT = "8080"
java -jar cli\target\quarkus-app\quarkus-run.jar start ..\..\contracts\conformance\models\reference-model.json
```

In another PowerShell terminal:

```powershell
Invoke-RestMethod http://localhost:8080/api/v1/health
Invoke-RestMethod http://localhost:8080/api/v1/info
Invoke-RestMethod http://localhost:8080/api/v1/model
```

Press Ctrl+C in the first terminal to shut down cleanly.

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Successful operation, including a well-formed invalid validation result |
| `1` | Unexpected internal failure |
| `2` | Command syntax or option error |
| `3` | File, environment, or startup configuration error |
| `4` | Malformed JSON, invalid UTF-8, or input byte-limit failure |
| `5` | Invalid evaluation model or event occurrence |
