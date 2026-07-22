//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Save-boundary regressions for structurally invalid editor drafts.
//
//---------------------------------------------------------------------------------------------------------------------

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

//---------------------------------------------------------------------------------------------------------------------
// Function: openNewModel
//
// Description:
//
//   Opens new model using the supplied inputs and current state.
//
// Returns:
//
//   The open new model result.
//
//---------------------------------------------------------------------------------------------------------------------

async function openNewModel (): Promise<void>
{
    const user = userEvent.setup ();
    await user.click
    (
        within ( document.querySelector ( ".no-document" )! )
            .getByRole
            (
                "button",
                {
                    name: "New model"
                }
            )
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: application save boundary
//
// Description:
//
//   Verifies application save boundary and records the expected externally observable behavior for future changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "application save boundary", () =>
    {
        //-----------------------------------------------------------------------------------------------------------------
        // Test: does not save or mark a model with an empty required name
        //
        // Description:
        //
        //   Verifies does not save or mark a model with an empty required name and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "does not save or mark a model with an empty required name", async () =>
            {
                const user = userEvent.setup ();
                render ( <App /> );
                await openNewModel ();
                await user.clear ( screen.getByLabelText ( "Name" ) );

                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Save model"
                        }
                    )
                );

                await waitFor ( () => expect ( screen.getByRole ( "status" ) ).toHaveTextContent ( "Save failed:" ) );
                expect ( document.querySelector ( ".title-bar h1" ) ).toHaveTextContent ( "•" );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: rejects excessive JSON nesting before Save As can serialize it
        //
        // Description:
        //
        //   Verifies rejects excessive JSON nesting before Save As can serialize it and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "rejects excessive JSON nesting before Save As can serialize it", async () =>
            {
                const user = userEvent.setup ();
                render ( <App /> );
                await openNewModel ();
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: /^Actions\s*0$/
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Add action"
                        }
                    )
                );

                let nestedValue: unknown = "value";
                for ( let depth = 0; depth < 33; depth++ )
                {
                    nestedValue =
                    {
                        nested: nestedValue
                    };
                }
                const actionData = screen.getByLabelText ( "Action data (JSON object)" );
                fireEvent.change
                (
                    actionData,
                    {
                        target:
                        {
                            value: JSON.stringify ( nestedValue )
                        }
                    }
                );
                fireEvent.blur ( actionData );

                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Save model"
                        }
                    )
                );

                await waitFor
                (
                    () => expect ( screen.getByRole ( "status" ) )
                    .toHaveTextContent ( "JSON nesting exceeds" )
                );
            }
        );
    }
);
