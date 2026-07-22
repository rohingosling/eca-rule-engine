# Events and Payloads

Let $E$ be a nonempty set of events, let $K$ be a set of parameter names, and let $V$ be a set of parameter values. A payload is a finite partial map from names to values:

$$
p : K \rightharpoonup V.
$$

An event occurrence is a pair $(e,p)$ containing an event $e \in E$ and an optional payload $p$. The absent payload and the empty payload have the same meaning.

The payload describes only the current occurrence. It is not retained as engine state and does not represent an event history.

In the serialized model, parameter definitions are reusable named values. Payload definitions select sets of those parameter identifiers, and events may refer to one payload definition. At evaluation time, the occurrence supplies the actual JSON values.
