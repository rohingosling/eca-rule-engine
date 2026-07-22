# Technical Note

The [Stateless ECA Rule Engine](https://github.com/rohingosling/eca-rule-engine/blob/main/docs/technical-note/stateless-eca-rule-engine.pdf) technical note gives a minimal, domain-independent mathematical definition of a stateless event-condition-action rule engine.

The note separates the rule query from the surrounding systems that might observe events or execute actions. Its subject is the deterministic selection of zero or one symbolic action after a single event occurrence has been identified.

The model includes:

- events with optional payloads;
- conditions interpreted by a fixed Boolean predicate;
- symbolic actions;
- rules relating one event and one condition to one action;
- an occurrence-local admissibility condition; and
- a partial option-valued query returning one action or no action.

Composite-event detection, event history, mutable state, priority, conflict resolution, event consumption, and action execution are outside the model.

## Citation status

The paper is an independent, non-peer-reviewed technical note. It states the mathematical model used by the browser and Java implementations in this repository.
