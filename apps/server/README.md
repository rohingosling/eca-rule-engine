# ECA Rule Engine Server

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=openjdk&logoColor=white)
![Quarkus](https://img.shields.io/badge/Quarkus-3.x-4695EB?style=flat&logo=quarkus&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-Multi--module-C71A36?style=flat&logo=apachemaven&logoColor=white)
![OCI](https://img.shields.io/badge/Container-OCI-0DB7ED?style=flat&logo=docker&logoColor=white)

The server is the Java reference implementation of the stateless ECA mathematical model. Its pure evaluator, model compiler, command-line adapter, and version 1 Quarkus HTTP API are implemented.

Status: HTTP milestone M4 is implemented. The `core`, `model`, `cli`, and packaged HTTP paths pass their shared conformance, acceptance, request-limit, CORS, and logging checks. The pinned non-root container image also passes its local build, metadata, startup, health, active-model, and evaluation smoke checks.

The Maven application version is `0.1.0-SNAPSHOT`; it implements model contract `1.0`. Application and contract versions are intentionally independent and are generated into the packaged implementation metadata.

The Java application is now the local and reproducible reference implementation. The public GitHub Pages application will evaluate in-browser and will not connect to a hosted Java service.

## Modules

| Module | Responsibility | Framework policy |
|--------|----------------|------------------|
| `core` | Immutable domain types, predicate evaluation, rule matching, optional-action result | Java only |
| `model` | JSON parsing, schema and semantic validation, immutable model compilation | Java and JSON tooling |
| `cli` | `validate`, `evaluate`, `start`, and executable application packaging | Picocli and Quarkus launcher |
| `service` | HTTP runtime state and versioned REST resources | Quarkus only |

Dependencies point inward: `service` depends on `model` and `core`, while `cli` packages all three behind one executable entry point. The core never depends on an adapter.

## Build and test

Prerequisite: JDK 21 or later. The committed Maven Wrapper downloads the checksummed Maven 3.9.16 distribution on its first run.

```powershell
.\mvnw.cmd clean verify
```

On Linux or macOS:

```sh
./mvnw clean verify
```

The verification builds all four modules and runs the core unit, fixed-seed property, model-validation, event-validation, CLI acceptance, shared conformance, and packaged HTTP-process integration tests. No global Maven installation is required.

## Package and run

From `apps/server/`, create the Quarkus fast-jar distribution:

```powershell
.\mvnw.cmd clean package
```

On Linux or macOS:

```sh
./mvnw clean package
```

The same launcher and commands work on every supported platform:

```text
java -jar cli/target/quarkus-app/quarkus-run.jar --help
java -jar cli/target/quarkus-app/quarkus-run.jar --version
java -jar cli/target/quarkus-app/quarkus-run.jar validate <model-file>
java -jar cli/target/quarkus-app/quarkus-run.jar evaluate <model-file> <event-file> [--trace]
java -jar cli/target/quarkus-app/quarkus-run.jar start [<model-file>]
```

Use `-` for standard input when a command has one input source. `evaluate` accepts `-` for either the model or event, but not both. Successful machine-readable output is UTF-8 JSON on standard output; diagnostics use standard error. Exact behaviour and exit codes are covered by the CLI acceptance tests and summarized by the command help.

`start` listens on `0.0.0.0` and uses `PORT`, defaulting to `8080`. For example:

```powershell
$env:PORT = "8080"
java -jar cli\target\quarkus-app\quarkus-run.jar start ..\..\contracts\conformance\models\reference-model.json
```

While it is running, use another terminal to inspect the implemented service endpoints:

```powershell
Invoke-RestMethod http://localhost:8080/api/v1/health
Invoke-RestMethod http://localhost:8080/api/v1/info
Invoke-RestMethod http://localhost:8080/api/v1/model
```

Press Ctrl+C in the server terminal to shut it down.

## Container

Build from the product root so the image build can copy both `apps/server/` and the shared `contracts/` tree:

```powershell
$mavenVersionOutput = & .\apps\server\mvnw.cmd -q -f apps\server\pom.xml -DforceStdout -Dstyle.color=never help:evaluate -Dexpression=project.version
if ( $LASTEXITCODE -ne 0 ) { throw "Maven project.version evaluation failed." }
[string]$implementationVersion = ( $mavenVersionOutput | Select-Object -Last 1 ).Trim()
if ( [string]::IsNullOrWhiteSpace($implementationVersion) ) { throw "Maven did not return project.version." }
docker build --build-arg "IMPLEMENTATION_VERSION=$implementationVersion" --file apps/server/Dockerfile --tag "eca-rule-engine:$implementationVersion" .
docker run --rm --publish 8080:8080 --env PORT=8080 "eca-rule-engine:$implementationVersion"
```

The image contains the reference conformance model as its default immutable startup model, runs as non-root user `185`, listens on the injected `PORT`, and copies the complete fast-jar directory. `IMPLEMENTATION_VERSION` is required so the OCI version label is derived from the Maven project version rather than duplicated in the Dockerfile. Override `ECA_MODEL_PATH` or mount a reviewed model when testing another immutable configuration.

## Documentation

- [Project overview](../../README.md)
- [Technical note](../../docs/technical-note/stateless-eca-rule-engine.pdf)
- [JSON Schemas](../../contracts/schemas/README.md)
- [OpenAPI description](../../contracts/openapi/README.md)
- [Conformance fixtures](../../contracts/conformance/README.md)
- [Project Wiki](https://github.com/rohingosling/eca-rule-engine/wiki)
