# Contract Examples

These browser-loadable models demonstrate realistic uses of the version 1 contract without expanding the normative conformance corpus.

## Computer-parts courier routing

`computer-parts-courier-routing.json` models 12 computer products as events and three couriers as actions. Every event references the same reusable `order-routing-payload` definition, which accepts the following order inputs:

| Parameter | Values or meaning |
|-----------|-------------------|
| `addressScope` | `local` or `international` |
| `areaType` | `urban` or `rural` |
| `itemSize` | `small`, `medium`, or `large` |
| `fragile` | Whether fragile handling is required |
| `sameDayFeePaid` | Whether the optional same-day fee was paid |
| `courierRoutingProfile` | Derived mutually exclusive routing decision |

Version 1 comparison predicates inspect one payload value each and do not provide an AND expression. The example therefore uses `courierRoutingProfile` to carry the decision derived from the other order inputs and the product restrictions:

| Routing profile | Meaning |
|-----------------|---------|
| `local-standard` | A local order that uses standard local delivery |
| `local-same-day` | Local, urban, fee paid, not large, not fragile, and product eligible |
| `international` | International destination and product eligible for export |
| `unavailable` | No courier is eligible; the evaluation selects no action |

The model retains conditions for the raw address, area, size, fragility, and fee dimensions so those concepts are visible when inspecting the document. Courier-selection rules use only the mutually exclusive routing conditions, ensuring each query returns one courier action or no action.
