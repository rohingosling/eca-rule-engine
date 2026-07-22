# Glossary

| Term | Meaning |
|------|---------|
| Action | Symbolic value identified by a matching rule; the engine returns but does not execute it |
| Admissible input | Occurrence and rule set whose candidate-action set contains at most one distinct action |
| Candidate-action set | Distinct actions identified by rules matching the current occurrence |
| Condition | Value interpreted by the fixed Boolean predicate for an occurrence |
| Event | Identifier forming the first part of an occurrence |
| Event occurrence | One event paired with an optional payload |
| Globally admissible rule set | Rule set admissible for every occurrence |
| Payload | Finite partial map from parameter names to values for the current occurrence |
| Rule | Triple relating one event and one condition to one action |
| Stateless | Independent of event history and mutable engine state |
| $\bot$ | No selected action |
