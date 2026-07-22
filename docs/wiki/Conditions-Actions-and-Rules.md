# Conditions, Actions, and Rules

Let $C$ be a set of conditions and $A$ a set of symbolic actions. A fixed predicate

$$
q : C \times (E \times P) \rightarrow \{\mathrm{false},\mathrm{true}\}
$$

determines whether a condition holds for the current event occurrence.

A rule is a triple $(e,c,a) \in E \times C \times A$. It matches an occurrence $(e',p)$ when $e=e'$ and $q(c,(e',p))$ is true.

Actions are returned as symbolic data. The rule engine does not execute them, interpret their parameter objects as conditions, or cause external side effects.

Several matching rules may identify the same action. That still produces one candidate action. Matching rules that identify distinct actions produce an inadmissible query input.
