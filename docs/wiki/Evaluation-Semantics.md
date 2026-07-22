# Evaluation Semantics

For an occurrence `x` and rule set `R`, define the candidate-action set as

`Cand(x, R) = {a ∈ A | a rule in R matches x and identifies a}`.

The current query input is admissible exactly when

`|Cand(x, R)| ≤ 1`.

On that domain, the rule engine is the partial option-valued query `Q(x, R)`:

| Candidate-action set | Query result |
|----------------------|--------------|
| `Cand(x, R) = {a}` | `Q(x, R) = a` |
| `Cand(x, R) = ∅` | `Q(x, R) = ⊥` |

The query therefore has three observable cases:

1. No rule matches, so the result is `⊥`.
2. One or more rules match and identify the same action, so that action is returned.
3. Matching rules identify distinct actions, so the input lies outside the query domain.

Rule order is not part of the semantics.
