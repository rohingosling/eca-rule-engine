//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Exercises example models behavior and verifies its observable contract across representative inputs and
//   interactions.
//
//---------------------------------------------------------------------------------------------------------------------

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { StatelessECAModel } from "../contracts/model.generated";
import { evaluate } from "./evaluator";
import { validateSemantics } from "./semantic-validator";
import { validateStructure } from "./validator";

const exampleModelPath = resolve
(
    dirname ( fileURLToPath ( import.meta.url ) ),
    "../../../../contracts/examples/computer-parts-courier-routing.json"
);

//---------------------------------------------------------------------------------------------------------------------
// Function: readExampleModel
//
// Description:
//
//   Reads the supplied representation and returns its normalized in-memory form.
//
// Returns:
//
//   The read example model result.
//
//---------------------------------------------------------------------------------------------------------------------

async function readExampleModel (): Promise<StatelessECAModel>
{

    // Return the result produced by the delegated operation.

    return JSON.parse ( await readFile ( exampleModelPath, "utf8" ) ) as StatelessECAModel;
}

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: computer-parts courier-routing example
//
// Description:
//
//   Verifies computer-parts courier-routing example and records the expected externally observable behavior for future
//   changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "computer-parts courier-routing example", () =>
    {
        //-----------------------------------------------------------------------------------------------------------------
        // Test: is a valid populated version 1 model
        //
        // Description:
        //
        //   Verifies is a valid populated version 1 model and records the expected externally observable behavior for
        //   future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        test
        (
            "is a valid populated version 1 model", async () =>
            {
                const model = await readExampleModel ();

                expect ( validateStructure ( model ) ).toEqual ( [] );
                expect ( validateSemantics ( model ) ).toEqual ( [] );
                expect ( model.parameters ).toHaveLength ( 6 );
                expect ( model.payloads ).toHaveLength ( 1 );
                expect ( model.events ).toHaveLength ( 12 );
                expect ( model.conditions ).toHaveLength ( 13 );
                expect ( model.actions ).toHaveLength ( 3 );
                expect ( model.rules ).toHaveLength ( 27 );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: declares each order input once and reuses one payload across every product event
        //
        // Description:
        //
        //   Verifies declares each order input once and reuses one payload across every product event and records the
        //   expected externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        test
        (
            "declares each order input once and reuses one payload across every product event", async () =>
            {
                const model = await readExampleModel ();
                const requiredParameters = [
                    "addressScope", "areaType", "itemSize", "fragile", "sameDayFeePaid", "courierRoutingProfile"
                ];

                expect ( model.parameters.map ( parameter => parameter.id ) ).toEqual ( requiredParameters );
                expect ( model.payloads [ 0 ] ).toMatchObject
                (
                    {
                        id: "order-routing-payload", parameters: requiredParameters
                    }
                );
                model.events.forEach ( eventType => expect ( eventType.payload ).toBe ( "order-routing-payload" ) );
                model.actions.forEach ( action => expect ( Object.hasOwn ( action, "type" ) ).toBe ( false ) );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: selects one eligible courier and rejects unavailable routes
        //
        // Description:
        //
        //   Verifies selects one eligible courier and rejects unavailable routes and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        test
        (
            "selects one eligible courier and rejects unavailable routes", async () =>
            {
                const model = await readExampleModel ();
                const scenarios = [
                    {
                        event: "product.cpu", profile: "local-standard", expected: "courier.local"
                    },
                    {
                        event: "product.cpu", profile: "local-same-day", expected: "courier.same-day"
                    },
                    {
                        event: "product.cpu", profile: "international", expected: "courier.international"
                    },
                    {
                        event: "product.graphics-card", profile: "local-same-day", expected: null
                    },
                    {
                        event: "product.gaming-monitor", profile: "international", expected: "courier.international"
                    },
                    {
                        event: "product.liquid-cooling-kit", profile: "international", expected: null
                    },
                    {
                        event: "product.ups-battery-backup", profile: "local-standard", expected: "courier.local"
                    }
                ];

                scenarios.forEach
                (
                    scenario =>
                    {
                        const result = evaluate
                        (
                            {
                                model,
                                event:
                                    {
                                        type: scenario.event,
                                        payload:
                                            {
                                                addressScope: scenario.profile === "international" ? "international" : "local",
                                                areaType: scenario.profile === "local-same-day" ? "urban" : "rural",
                                                itemSize: "small",
                                                fragile: false,
                                                sameDayFeePaid: scenario.profile === "local-same-day",
                                                courierRoutingProfile: scenario.profile
                                            }
                                    },
                                includeTrace: true
                            }
                        );

                        expect ( result.selectedAction?.id ?? null, `${ scenario.event } / ${ scenario.profile }` )
                            .toBe ( scenario.expected );
                        expect ( result.outcome, `${ scenario.event } / ${ scenario.profile }` )
                            .toBe ( scenario.expected ? "action-selected" : "no-action" );
                    }
                );
            }
        );
    }
);
