//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Exercises diagnostic navigation behavior and verifies its observable contract across representative inputs and
//   interactions.
//
//---------------------------------------------------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { createEmptyModel } from "../document/model-document";
import { diagnosticMessage, diagnosticNavigationTarget } from "./diagnostic-navigation";

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: diagnostic navigation
//
// Description:
//
//   Verifies diagnostic navigation and records the expected externally observable behavior for future changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "diagnostic navigation", () =>
    {
        //-----------------------------------------------------------------------------------------------------------------
        // Test: maps collection pointers to the affected item and field
        //
        // Description:
        //
        //   Verifies maps collection pointers to the affected item and field and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "maps collection pointers to the affected item and field", () =>
            {
                const model =
                {
                    ...createEmptyModel (), rules: [
                        {
                            id: "route", name: "Route", event: "arrival", condition: "eligible", action: "dispatch"
                        } ]
                };

                expect ( diagnosticNavigationTarget ( model, "/rules/0/action", 7 ) ).toEqual
                (
                    {
                        field: "action", navigation:
                        {
                            section: "rules", identifier: "route", sequence: 7
                        }
                    }
                );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: maps model pointers and creates readable fallback messages
        //
        // Description:
        //
        //   Verifies maps model pointers and creates readable fallback messages and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "maps model pointers and creates readable fallback messages", () =>
            {
                expect ( diagnosticNavigationTarget ( createEmptyModel (), "/name", 3 ) ).toEqual
                (
                    {
                        field: "name", navigation:
                        {
                            section: "model", sequence: 3
                        }
                    }
                );
                expect ( diagnosticMessage ( "unresolved-action-reference" ) ).toBe ( "Unresolved Action Reference" );
            }
        );
    }
);
