//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Exercises user guide behavior and verifies its observable contract across representative inputs and interactions.
//
//---------------------------------------------------------------------------------------------------------------------

import axe from "axe-core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MathFormula } from "./MathFormula";
import { UserGuide } from "./UserGuide";

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: contextual user guide
//
// Description:
//
//   Verifies contextual user guide and records the expected externally observable behavior for future changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "contextual user guide", () =>
    {
        //-----------------------------------------------------------------------------------------------------------------
        // Test: distinguishes a reusable payload definition from an occurrence payload
        //
        // Description:
        //
        //   Verifies distinguishes a reusable payload definition from an occurrence payload and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "distinguishes a reusable payload definition from an occurrence payload", async () =>
            {
                const
                    {
                        container
                    } = render ( <UserGuide topic="payloads" contextLabel="Order payload" /> );

                expect
                (
                    screen.getByRole
                    (
                        "heading",
                        {
                            name: "Payload definitions"
                        }
                    )
                ).toBeVisible ();
                expect ( screen.getByText ( /actual finite partial map/ ) ).toBeVisible ();
                expect ( screen.getByText ( /not itself an occurrence payload/ ) ).toBeVisible ();
                expect ( screen.getByText ( "Selected: Order payload" ) ).toBeVisible ();
                expect ( container.querySelector ( ".katex" ) ).not.toBeNull ();
                expect ( container.querySelector ( ".katex-mathml math" ) ).not.toBeNull ();
                expect ( ( await axe.run ( container ) ).violations ).toEqual ( [] );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: explains that always is payload-independent but still event-scoped
        //
        // Description:
        //
        //   Verifies explains that always is payload-independent but still event-scoped and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "explains that always is payload-independent but still event-scoped", () =>
            {
                render ( <UserGuide topic="conditions" /> );

                expect ( screen.getByText ( /always predicate has no dependencies/ ) ).toBeVisible ();
                expect ( screen.getByText ( /must still match its event/ ) ).toBeVisible ();
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: expresses simulator evaluation as a single-action rule-set query
        //
        // Description:
        //
        //   Verifies expresses simulator evaluation as a single-action rule-set query and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "expresses simulator evaluation as a single-action rule-set query", () =>
            {
                const
                    {
                        container
                    } = render ( <UserGuide topic="simulator" /> );

                expect ( screen.getByText ( /returns one action, no action, or an ambiguity diagnostic/ ) ).toBeVisible ();
                expect ( container.querySelector ( ".katex-mathml annotation" ) )
                    .toHaveTextContent ( "Q((e,p),R)" );
                expect ( container.querySelector ( ".katex-mathml annotation" ) )
                    .toHaveTextContent ( "C_R(e,p)=\\{a\\}" );
                expect ( container.querySelector ( ".katex-mathml annotation" ) )
                    .toHaveTextContent ( "C_R(e,p)=\\varnothing" );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: renders invalid manually edited LaTeX as visible source without breaking the guide
        //
        // Description:
        //
        //   Verifies renders invalid manually edited LaTeX as visible source without breaking the guide and records the
        //   expected externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "renders invalid manually edited LaTeX as visible source without breaking the guide", () =>
            {
                const
                    {
                        container
                    } = render ( <MathFormula source="\\frac{" /> );

                expect ( container.querySelector ( ".katex-error" ) ).toHaveTextContent ( "\\frac{" );
            }
        );
    }
);
