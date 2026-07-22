# Browser Model Laboratory

The [Model Laboratory](https://rohingosling.github.io/eca-rule-engine/) is an interactive implementation of the stateless ECA query.

It provides:

- structured forms for parameters, payload definitions, events, conditions, actions, and rules;
- JSON, YAML, and collection CSV import and export;
- a model tree and contextual guide;
- a rule graph connecting events, conditions, and actions;
- explicit model validation with navigable diagnostics;
- browser-local event simulation with rule and condition traces; and
- canonical read-only JSON source.

Evaluation runs in a Web Worker. Models and event payloads remain in browser memory unless the user explicitly opens, saves, imports, or exports a local file. The GitHub Pages application has no project API or server-side evaluator.

The simulator returns one selected action, no selected action, or an ambiguity diagnostic. It never executes the symbolic action.
