//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Exercises diagnostics panel behavior and verifies its observable contract across representative inputs and
//   interactions.
//
//---------------------------------------------------------------------------------------------------------------------

import axe from "axe-core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DiagnosticsPanel } from "./DiagnosticsPanel";

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: document diagnostics
//
// Description:
//
//   Verifies document diagnostics and records the expected externally observable behavior for future changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "document diagnostics", () =>
    {
        //-----------------------------------------------------------------------------------------------------------------
        // Test: shows revision staleness and exposes diagnostic navigation
        //
        // Description:
        //
        //   Verifies shows revision staleness and exposes diagnostic navigation and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "shows revision staleness and exposes diagnostic navigation", async () =>
            {
                const navigate = vi.fn ();
                const user = userEvent.setup ();
                const diagnostic =
                {
                    code: "unresolved-action-reference", pointer: "/rules/0/action"
                };
                const
                    {
                        container
                    } = render
                    (
                        <DiagnosticsPanel currentRevision={ 8 } navigate={ navigate }
                        snapshot={
                            {
                                diagnostics: [ diagnostic ], revision: 7
                            } } />
                    );

                expect ( screen.getByText ( /Stale.*revision 8/ ) ).toBeVisible ();
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: /unresolved-action-reference/
                        }
                    )
                );
                expect ( navigate ).toHaveBeenCalledWith ( diagnostic );
                expect
                (
                    screen.queryByRole
                    (
                        "button",
                        {
                            name: "Validate model"
                        }
                    )
                ).toBeNull ();
                expect ( ( await axe.run ( container ) ).violations ).toEqual ( [] );
            }
        );
    }
);
