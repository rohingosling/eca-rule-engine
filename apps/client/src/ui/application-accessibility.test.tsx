//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Accessibility regressions for application menus, status announcements, and native dialogs.
//
//---------------------------------------------------------------------------------------------------------------------

import axe from "axe-core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { THEME_PREFERENCE_STORAGE_KEY } from "../config/theme-preference";
import { App } from "./App";

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: application chrome accessibility
//
// Description:
//
//   Verifies application chrome accessibility and records the expected externally observable behavior for future
//   changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "application chrome accessibility", () =>
    {
        //-----------------------------------------------------------------------------------------------------------------
        // Test: uses native pressed-button semantics for theme choices without ARIA violations
        //
        // Description:
        //
        //   Verifies uses native pressed-button semantics for theme choices without ARIA violations and records the
        //   expected externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "uses native pressed-button semantics for theme choices without ARIA violations", async () =>
            {
                localStorage.setItem ( THEME_PREFERENCE_STORAGE_KEY, "system" );
                const user = userEvent.setup ();
                const
                    {
                        container
                    } = render ( <App /> );

                await user.click
                (
                    screen.getByText
                    (
                        "Preferences",
                        {
                            selector: "summary"
                        }
                    )
                );

                expect
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "System"
                        }
                    )
                ).toHaveAttribute ( "aria-pressed", "true" );
                expect
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Dark"
                        }
                    )
                ).toHaveAttribute ( "aria-pressed", "false" );
                expect ( ( await axe.run ( container ) ).violations ).toEqual ( [] );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: gives every open native dialog an accessible name
        //
        // Description:
        //
        //   Verifies gives every open native dialog an accessible name and records the expected externally observable
        //   behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "gives every open native dialog an accessible name", async () =>
            {
                const
                    {
                        container
                    } = render ( <App /> );
                const dialogs = [
                    {
                        selector: ".validation-dialog", name: "Diagnostics"
                    },
                    {
                        selector: ".settings-dialog", name: "Settings"
                    },
                    {
                        selector: "dialog[aria-labelledby='page-setup-dialog-heading']", name: "Page setup"
                    },
                    {
                        selector: ".about-dialog", name: "ECA (Event Condition Action) Rule Engine Laboratory"
                    }
                ];

                for ( const expectedDialog of dialogs )
                {
                    const dialog = container.querySelector<HTMLDialogElement> ( expectedDialog.selector )!;
                    dialog.setAttribute ( "open", "" );
                    expect ( dialog ).toHaveAccessibleName ( expectedDialog.name );
                    expect ( ( await axe.run ( dialog ) ).violations ).toEqual ( [] );
                    dialog.removeAttribute ( "open" );
                }
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: scopes live announcements to the operation message
        //
        // Description:
        //
        //   Verifies scopes live announcements to the operation message and records the expected externally observable
        //   behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "scopes live announcements to the operation message", () =>
            {
                const
                    {
                        container
                    } = render ( <App /> );
                const statusBar = container.querySelector ( ".status-bar" )!;
                const statusMessage = container.querySelector ( ".status-message" )!;

                expect ( statusBar ).not.toHaveAttribute ( "aria-live" );
                expect ( statusMessage ).toHaveAttribute ( "role", "status" );
            }
        );
    }
);
