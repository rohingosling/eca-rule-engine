//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Focused version 1 predicate edge cases beyond the shared conformance corpus.
//
//---------------------------------------------------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { MAXIMUM_DIAGNOSTIC_MESSAGE_CODE_POINTS } from "../contracts/contract-limits";
import type { StatelessECAModel } from "../contracts/model.generated";
import { comparePredicate, evaluate, jsonValuesEqual, limitDiagnosticMessage } from "./evaluator";

//---------------------------------------------------------------------------------------------------------------------
// Function: createLongIdentifier
//
// Description:
//
//   Constructs long identifier from the supplied inputs without mutating the caller's source values.
//
// Arguments:
//
//   prefix (string):
//     The prefix used by this operation.
//
//   index (number):
//     The index used by this operation.
//
//   filler (string):
//     The filler used by this operation.
//
// Returns:
//
//   The newly constructed value, model element, or immutable state projection.
//
//---------------------------------------------------------------------------------------------------------------------

function createLongIdentifier ( prefix: string, index: number, filler: string ): string
{
    const identifierPrefix = `${ prefix }.${ index.toString ().padStart ( 3, "0" ) }.`;

    // Return the value produced by this code path.

    return identifierPrefix + filler.repeat ( 128 - identifierPrefix.length );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: createLargeAmbiguousModel
//
// Description:
//
//   Constructs large ambiguous model from the supplied inputs without mutating the caller's source values.
//
// Arguments:
//
//   reverseDeclarationOrder (boolean):
//     The reverse declaration order used by this operation.
//
// Returns:
//
//   The newly constructed value, model element, or immutable state projection.
//
//---------------------------------------------------------------------------------------------------------------------

function createLargeAmbiguousModel ( reverseDeclarationOrder: boolean ): StatelessECAModel
{
    const indexes = Array.from
    (
        {
            length: 17
        }, ( _, index ) => index
    );
    const actions = indexes.map
    (
        index => (
        {
            id: createLongIdentifier ( "action", index, "a" ),
            name: `Action ${ index }`,
            parameters:
                {
                }
        } )
    );
    const rules = indexes.map
    (
        index => (
        {
            id: createLongIdentifier ( "rule", index, "r" ),
            name: `Rule ${ index }`,
            event: "signal.received",
            condition: "always",
            action: actions [ index ].id
        } )
    );

    // Return the value selected by the evaluated condition.

    return (
        {
            schemaVersion: "1.0",
            id: "large-ambiguity",
            name: "Large ambiguity",
            parameters: [],
            payloads: [],
            events: [
                {
                    id: "signal.received", name: "Signal received"
                } ],
            conditions: [
                {
                    id: "always", name: "Always", dependencies: [], predicate:
                    {
                        name: "always", arguments:
                        {
                        }
                    }
                } ],
            actions: reverseDeclarationOrder ? actions.reverse () : actions,
            rules: reverseDeclarationOrder ? rules.reverse () : rules
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: version 1 predicate semantics
//
// Description:
//
//   Verifies version 1 predicate semantics and records the expected externally observable behavior for future changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "version 1 predicate semantics", () =>
    {
        //-----------------------------------------------------------------------------------------------------------------
        // Test: compares JSON objects structurally and treats negative zero as zero
        //
        // Description:
        //
        //   Verifies compares JSON objects structurally and treats negative zero as zero and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "compares JSON objects structurally and treats negative zero as zero", () =>
            {
                expect
                (
                    jsonValuesEqual
                    (
                        {
                            first: 1, second: [ true ]
                        },
                        {
                            second: [ true ], first: 1
                        }
                    )
                ).toBe ( true );
                expect ( jsonValuesEqual ( -0, 0 ) ).toBe ( true );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: uses Unicode code-point ordering for strings
        //
        // Description:
        //
        //   Verifies uses Unicode code-point ordering for strings and records the expected externally observable behavior
        //   for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "uses Unicode code-point ordering for strings", () =>
            {
                expect ( comparePredicate ( "greaterThan", "😀", "\uE000" ) ).toBe ( true );
                expect ( comparePredicate ( "lessThan", "\uE000", "😀" ) ).toBe ( true );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: supports structural array membership and string substrings
        //
        // Description:
        //
        //   Verifies supports structural array membership and string substrings and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "supports structural array membership and string substrings", () =>
            {
                expect
                (
                    comparePredicate
                    (
                        "contains", [
                        {
                            value: 7
                        } ],
                        {
                            value: 7
                        }
                    )
                ).toBe ( true );
                expect ( comparePredicate ( "contains", "stateless engine", "engine" ) ).toBe ( true );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: treats an omitted prototype-named dependency as missing
        //
        // Description:
        //
        //   Verifies treats an omitted prototype-named dependency as missing and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "treats an omitted prototype-named dependency as missing", () =>
            {
                const model: StatelessECAModel =
                {
                    schemaVersion: "1.0",
                    id: "prototype-dependency-model",
                    name: "Prototype dependency model",
                    parameters: [
                    {
                        id: "toString", name: "Text", type: "string"
                    } ],
                    payloads: [
                    {
                        id: "event-payload", name: "Event payload", parameters: [ "toString" ]
                    } ],
                    events: [
                    {
                        id: "event", name: "Event", payload: "event-payload"
                    } ],
                    conditions: [
                    {
                        id: "condition", name: "Condition", dependencies: [ "toString" ],
                        predicate:
                        {
                            name: "notEquals", arguments:
                            {
                                parameter: "toString", value: "present"
                            }
                        }
                    } ],
                    actions: [
                    {
                        id: "action", name: "Action", parameters:
                        {
                        }
                    } ],
                    rules: [
                    {
                        id: "rule", name: "Rule", event: "event", condition: "condition", action: "action"
                    } ]
                };

                const result = evaluate
                (
                    {
                        model, event:
                        {
                            type: "event", payload:
                            {
                            }
                        }, includeTrace: true
                    }
                );

                expect ( result ).toMatchObject
                (
                    {
                        outcome: "no-action", selectedAction: null
                    }
                );
                expect ( result.trace?.conditions ).toEqual
                (
                    [
                    {
                        condition: "condition", result: false, reason: "missing-dependency", missingDependencies: [ "toString" ]
                    } ]
                );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: returns one action when several matching rules agree on that action
        //
        // Description:
        //
        //   Verifies returns one action when several matching rules agree on that action and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "returns one action when several matching rules agree on that action", () =>
            {
                const model: StatelessECAModel =
                {
                    schemaVersion: "1.0",
                    id: "agreeing-rules-model",
                    name: "Agreeing rules model",
                    parameters: [],
                    payloads: [],
                    events: [
                    {
                        id: "event", name: "Event"
                    } ],
                    conditions: [
                    {
                        id: "always", name: "Always", dependencies: [],
                        predicate:
                        {
                            name: "always", arguments:
                            {
                            }
                        }
                    } ],
                    actions: [
                    {
                        id: "action", name: "Action", parameters:
                        {
                            result: "accepted"
                        }
                    } ],
                    rules: [
                        {
                            id: "rule-z", name: "Rule Z", event: "event", condition: "always", action: "action"
                    },
                        {
                            id: "rule-a", name: "Rule A", event: "event", condition: "always", action: "action"
                    }
                    ]
                };

                const result = evaluate
                (
                    {
                        model, event:
                        {
                            type: "event"
                        }, includeTrace: true
                    }
                );
                const permutedResult = evaluate
                (
                    {
                        model:
                        {
                            ...model, rules: [ ...model.rules ].reverse ()
                        },
                        event:
                            {
                                type: "event"
                            },
                        includeTrace: true
                    }
                );
                const untracedResult = evaluate
                (
                    {
                        model, event:
                        {
                            type: "event"
                        }, includeTrace: false
                    }
                );

                expect ( result ).toMatchObject
                (
                    {
                        outcome: "action-selected",
                        selectedAction:
                            {
                                id: "action", parameters:
                                {
                                    result: "accepted"
                                }
                            }
                    }
                );
                expect ( result.trace?.rules ).toEqual
                (
                    [
                        {
                            rule: "rule-a", condition: "always", conditionResult: true, action: "action", matched: true
                        },
                        {
                            rule: "rule-z", condition: "always", conditionResult: true, action: "action", matched: true
                        }
                    ]
                );
                expect ( permutedResult ).toEqual ( result );
                expect ( untracedResult ).toEqual
                (
                    {
                        outcome: "action-selected",
                        selectedAction: model.actions [ 0 ]
                    }
                );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: reports deterministic ambiguity when matching rules identify distinct actions
        //
        // Description:
        //
        //   Verifies reports deterministic ambiguity when matching rules identify distinct actions and records the
        //   expected externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "reports deterministic ambiguity when matching rules identify distinct actions", () =>
            {
                const model: StatelessECAModel =
                {
                    schemaVersion: "1.0",
                    id: "ambiguous-action-selection-model",
                    name: "Ambiguous action selection model",
                    parameters: [],
                    payloads: [],
                    events: [
                    {
                        id: "signal.received", name: "Signal received"
                    } ],
                    conditions: [
                    {
                        id: "always", name: "Always", dependencies: [],
                        predicate:
                        {
                            name: "always", arguments:
                            {
                            }
                        }
                    } ],
                    actions: [
                        {
                            id: "record", name: "Record", parameters:
                        {
                        }
                    },
                        {
                            id: "alert", name: "Alert", parameters:
                        {
                        }
                    }
                    ],
                    rules: [
                        {
                            id: "record.signal", name: "Record", event: "signal.received",
                            condition: "always", action: "record"
                    },
                        {
                            id: "alert.high.2", name: "Alert two", event: "signal.received",
                            condition: "always", action: "alert"
                    },
                        {
                            id: "alert.high.1", name: "Alert one", event: "signal.received",
                            condition: "always", action: "alert"
                    }
                    ]
                };

                const result = evaluate
                (
                    {
                        model, event:
                        {
                            type: "signal.received"
                        }, includeTrace: false
                    }
                );
                const permutedResult = evaluate
                (
                    {
                        model:
                        {
                            ...model, rules: [ ...model.rules ].reverse ()
                        },
                        event:
                            {
                                type: "signal.received"
                            },
                        includeTrace: false
                    }
                );

                expect ( result ).toEqual
                (
                    {
                        outcome: "ambiguous",
                        selectedAction: null,
                        diagnostic:
                            {
                                code: "ambiguous-action-selection",
                                actionIds: [ "alert", "record" ],
                                ruleIds: [ "alert.high.1", "alert.high.2", "record.signal" ],
                                message: "Event 'signal.received' matched distinct actions [alert, record] through rules "
                                    + "[alert.high.1, alert.high.2, record.signal].",
                                pointer: "/type"
                            }
                    }
                );
                expect ( permutedResult ).toEqual ( result );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: keeps a null selected action when a no-action result omits its trace
        //
        // Description:
        //
        //   Verifies keeps a null selected action when a no-action result omits its trace and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "keeps a null selected action when a no-action result omits its trace", () =>
            {
                const model: StatelessECAModel =
                {
                    schemaVersion: "1.0",
                    id: "no-action-model",
                    name: "No action model",
                    parameters: [],
                    payloads: [],
                    events: [],
                    conditions: [],
                    actions: [],
                    rules: []
                };

                expect
                (
                    evaluate
                    (
                        {
                            model, event:
                            {
                                type: "unknown"
                            }, includeTrace: false
                        }
                    )
                ).toEqual
                (
                    {
                        outcome: "no-action",
                        selectedAction: null
                    }
                );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: bounds large ambiguity messages deterministically and independently of declaration order
        //
        // Description:
        //
        //   Verifies bounds large ambiguity messages deterministically and independently of declaration order and records
        //   the expected externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "bounds large ambiguity messages deterministically and independently of declaration order", () =>
            {
                const request =
                {
                    model: createLargeAmbiguousModel ( false ),
                    event:
                    {
                        type: "signal.received"
                    },
                    includeTrace: false
                } as const;
                const originalResult = evaluate ( request );
                const repeatedResult = evaluate ( request );
                const permutedResult = evaluate
                (
                    {
                        ...request, model: createLargeAmbiguousModel ( true )
                    }
                );

                expect ( MAXIMUM_DIAGNOSTIC_MESSAGE_CODE_POINTS ).toBe ( 4096 );
                expect ( originalResult.outcome ).toBe ( "ambiguous" );

                if ( originalResult.outcome !== "ambiguous" )
                {
                    throw new Error ( "The generated evaluation must be ambiguous." );
                }

                expect ( Array.from ( originalResult.diagnostic.message ) )
                    .toHaveLength ( MAXIMUM_DIAGNOSTIC_MESSAGE_CODE_POINTS );
                expect ( originalResult.diagnostic.message.endsWith ( "\u2026" ) ).toBe ( true );
                expect ( repeatedResult ).toEqual ( originalResult );
                expect ( permutedResult ).toEqual ( originalResult );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: truncates supplementary Unicode characters at code-point boundaries
        //
        // Description:
        //
        //   Verifies truncates supplementary Unicode characters at code-point boundaries and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "truncates supplementary Unicode characters at code-point boundaries", () =>
            {
                const sourceMessage = "\uD83D\uDE00".repeat ( MAXIMUM_DIAGNOSTIC_MESSAGE_CODE_POINTS ) + "tail";
                const limitedMessage = limitDiagnosticMessage ( sourceMessage );

                expect ( Array.from ( limitedMessage ) ).toHaveLength ( MAXIMUM_DIAGNOSTIC_MESSAGE_CODE_POINTS );
                expect ( limitedMessage.endsWith ( "\u2026" ) ).toBe ( true );
            }
        );
    }
);
