//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Exercises simulator model behavior and verifies its observable contract across representative inputs and
//   interactions.
//
//---------------------------------------------------------------------------------------------------------------------

import type { StatelessECAModel } from "../contracts/model.generated";
import { createPayloadDraft, parsePayload } from "./simulator-model";

const model: StatelessECAModel =
{
    schemaVersion: "1.0",
    id: "simulator-test",
    name: "Simulator test",
    parameters: [
        {
            id: "level", name: "Level", type: "number"
    },
        {
            id: "count", name: "Count", type: "integer"
    },
        {
            id: "source", name: "Source", type: "string"
    },
        {
            id: "metadata", name: "Metadata", type: "object"
    }
    ],
    payloads: [
    {
        id: "signal-payload", name: "Signal payload",
        parameters: [ "level", "count", "source", "metadata" ]
    } ],
    events: [
        {
            id: "signal", name: "Signal", payload: "signal-payload"
    },
        {
            id: "signal-copy", name: "Signal copy", payload: "signal-payload"
    },
        {
            id: "timer", name: "Timer"
    }
    ],
    conditions: [
        {
            id: "always", name: "Always", dependencies: [], predicate:
        {
            name: "always", arguments:
            {
            }
        }
    },
        {
            id: "high", name: "High", dependencies: [ "level" ],
            predicate:
        {
            name: "greaterThan", arguments:
            {
                parameter: "level", value: 10
            }
        }
    },
        {
            id: "scheduled", name: "Scheduled", dependencies: [], predicate:
        {
            name: "always", arguments:
            {
            }
        }
    }
    ],
    actions: [
    {
        id: "record", name: "Record", parameters:
        {
        }
    } ],
    rules: [
        {
            id: "signal-always", name: "Signal always", event: "signal", condition: "always", action: "record"
    },
        {
            id: "signal-high", name: "Signal high", event: "signal", condition: "high", action: "record"
    },
        {
            id: "timer-scheduled", name: "Timer scheduled", event: "timer", condition: "scheduled", action: "record"
    },
        {
            id: "invalid", name: "Invalid", event: "signal", condition: "missing", action: "record"
    }
    ]
};

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: simulator model helpers
//
// Description:
//
//   Verifies simulator model helpers and records the expected externally observable behavior for future changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "simulator model helpers", () =>
    {
        //-----------------------------------------------------------------------------------------------------------------
        // Test: creates type-appropriate drafts through an event payload reference
        //
        // Description:
        //
        //   Verifies creates type-appropriate drafts through an event payload reference and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        test
        (
            "creates type-appropriate drafts through an event payload reference", () =>
            {
                expect ( createPayloadDraft ( model, model.events [ 0 ] ) ).toEqual
                (
                    {
                        level: "0", count: "0", source: "", metadata: "{}"
                    }
                );
                expect ( createPayloadDraft ( model, model.events [ 1 ] ) )
                    .toEqual ( createPayloadDraft ( model, model.events [ 0 ] ) );
                expect ( createPayloadDraft ( model, model.events [ 2 ] ) ).toEqual
                (
                    {
                    }
                );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: parses included payload values and omits unchecked parameters
        //
        // Description:
        //
        //   Verifies parses included payload values and omits unchecked parameters and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        test
        (
            "parses included payload values and omits unchecked parameters", () =>
            {
                const result = parsePayload
                (
                    model, model.events [ 0 ],
                    {
                        level: "12.5", count: "3", source: "", metadata: "{\"origin\":\"lab\"}"
                    }, [ "level", "source", "metadata" ]
                );

                expect ( result.errors ).toEqual
                (
                    {
                    }
                );
                expect ( result.payload ).toEqual
                (
                    {
                        level: 12.5, source: "", metadata:
                        {
                            origin: "lab"
                        }
                    }
                );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: reports invalid typed payload values
        //
        // Description:
        //
        //   Verifies reports invalid typed payload values and records the expected externally observable behavior for
        //   future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        test
        (
            "reports invalid typed payload values", () =>
            {
                const result = parsePayload
                (
                    model, model.events [ 0 ],
                        {
                            count: "2.5", metadata: "[]"
                        }, [ "count", "metadata" ]
                );

                expect ( result.errors ).toEqual
                (
                    {
                        count: "Enter an integer.", metadata: "Enter a JSON object."
                    }
                );
                expect ( result.payload ).toEqual
                (
                    {
                    }
                );
            }
        );
    }
);
