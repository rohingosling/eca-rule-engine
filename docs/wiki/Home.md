# Stateless ECA Rule Engine

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=openjdk&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![PDF](https://img.shields.io/badge/PDF-B30B00?style=flat&logo=adobeacrobatreader&logoColor=white)

[![ECA Rule Engine Model Laboratory](https://raw.githubusercontent.com/rohingosling/eca-rule-engine/main/assets/images/screenshots/conditions.png)](https://rohingosling.github.io/eca-rule-engine/)

The Stateless ECA Rule Engine is an implementation of the minimal event-condition-action model defined in the [technical note](https://github.com/rohingosling/eca-rule-engine/blob/main/docs/technical-note/stateless-eca-rule-engine.pdf). It includes a browser-local model laboratory and a Java reference implementation.

An event occurrence contains an event and an optional payload. Conditions examine that occurrence through a fixed predicate. Rules connect events and conditions to symbolic actions. Evaluation returns the unique action identified by the matching rules, or no action when no rule matches.

The model has no priority system. When matching rules identify distinct actions, the current occurrence and rule set lie outside the query domain. This makes ambiguity explicit rather than resolving it through declaration order.

## Implementations

- The [Model Laboratory](Browser-Laboratory) creates, validates, visualizes, and evaluates models entirely in the browser.
- The [Java Reference](Java-Reference) supplies a pure evaluator, model compiler, command-line interface, and optional HTTP adapter.
- The [JSON Contracts](JSON-Contracts) define the shared serialized model and conformance cases.

## Mathematical foundation

- [Technical Note](Technical-Note)
- [Events and Payloads](Events-and-Payloads)
- [Conditions, Actions, and Rules](Conditions-Actions-and-Rules)
- [Evaluation Semantics](Evaluation-Semantics)
- [Statelessness](Statelessness)
- [Glossary](Glossary)
