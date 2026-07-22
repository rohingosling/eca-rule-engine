# Statelessness

A behavior is stateless when its result for the current input does not depend on prior inputs. If $H$ is the set of event histories and $X$ is the set of current occurrences, a behavior $G$ is stateless when

$$
G(h_1,x)=G(h_2,x)
$$

for every $h_1,h_2 \in H$ and every $x \in X$ for which the expressions are defined.

For a fixed rule set, the ECA query depends only on the current occurrence. Replaying the same occurrence against the same rule set produces the same result. Evaluation does not mutate the rule set, consume the event, or retain the payload.

Systems may keep logs, histories, or application state around the query. Those surrounding facilities do not become arguments of the rule engine defined by the technical note.
