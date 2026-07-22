//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Exercises simulator single action behavior and verifies its observable contract across representative inputs and
//   interactions.
//
//---------------------------------------------------------------------------------------------------------------------

import axe from "axe-core";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SIMULATOR_CONDITION_TRACE_PAGE_SIZE, SIMULATOR_RULE_TRACE_PAGE_SIZE } from "../config/editor-layout";
import type { StatelessECAModel } from "../contracts/model.generated";
import { evaluate } from "../engine/evaluator";
import type { WorkerRequestMessage, WorkerResponseMessage } from "../engine/worker-protocol";
import { Simulator } from "./Simulator";

//*********************************************************************************************************************
// Class: EvaluatingTestWorker
//
// Description:
//
//   Encapsulates evaluating test worker state and behavior.
//
//*********************************************************************************************************************
class EvaluatingTestWorker
{
    static instances: EvaluatingTestWorker[] = [];

    onerror: ( () => void ) | null = null;
    onmessage: ( ( event: MessageEvent<WorkerResponseMessage> ) => void ) | null = null;
    terminated = false;

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor: EvaluatingTestWorker
    //
    // Description:
    //
    //   Creates a new EvaluatingTestWorker instance from the supplied values and establishes its initial invariants.
    //
    //-----------------------------------------------------------------------------------------------------------------

    constructor ()
    {
        EvaluatingTestWorker.instances.push ( this );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: postMessage
    //
    // Description:
    //
    //   Posts message using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   message (WorkerRequestMessage):
    //     The message used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    postMessage ( message: WorkerRequestMessage ): void
    {
        if ( message.kind !== "evaluate" )
        {

            // Return without a value after completing this code path.

            return;
        }

        const response: WorkerResponseMessage =
        {
            kind: "result",
            requestIdentifier: message.requestIdentifier,
            documentRevision: message.documentRevision,
            result: evaluate ( message.request )
        };
        queueMicrotask
        (
            () => this.onmessage?.
            (
                {
                    data: response
                } as MessageEvent<WorkerResponseMessage>
            )
        );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: terminate
    //
    // Description:
    //
    //   Performs the terminate operation using the supplied inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    terminate (): void
    {
        this.terminated = true;
    }
}

//---------------------------------------------------------------------------------------------------------------------
// Function: createModel
//
// Description:
//
//   Constructs model from the supplied inputs without mutating the caller's source values.
//
// Arguments:
//
//   actionIdentifiers (string[]):
//     The action identifiers collection inspected or transformed by this operation.
//
// Returns:
//
//   The newly constructed value, model element, or immutable state projection.
//
//---------------------------------------------------------------------------------------------------------------------

function createModel ( actionIdentifiers: string[] ): StatelessECAModel
{

    // Return the value selected by the evaluated condition.

    return (
        {
            schemaVersion: "1.0",
            id: "simulator-query-model",
            name: "Simulator query model",
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
            actions: [ ...new Set ( actionIdentifiers ) ].map
            (
                identifier => (
                {
                    id: identifier,
                    name: identifier === "alert" ? "Alert" : "Record",
                    parameters:
                        {
                            destination: identifier
                        }
                } )
            ),
            rules: actionIdentifiers.map
            (
                ( identifier, index ) => (
                {
                    id: `rule-${ actionIdentifiers.length - index }`,
                    name: `Rule ${ index + 1 }`,
                    event: "event",
                    condition: "always",
                    action: identifier
                } )
            )
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: createLargeTraceModel
//
// Description:
//
//   Constructs large trace model from the supplied inputs without mutating the caller's source values.
//
// Returns:
//
//   The newly constructed value, model element, or immutable state projection.
//
//---------------------------------------------------------------------------------------------------------------------

function createLargeTraceModel (): StatelessECAModel
{
    const conditionCount = SIMULATOR_CONDITION_TRACE_PAGE_SIZE + 1;
    const ruleCount = SIMULATOR_RULE_TRACE_PAGE_SIZE + 1;
    const conditions = Array.from
    (
        {
            length: conditionCount
        }, ( _, index ) => (
        {
            id: `condition-${ index.toString ().padStart ( 3, "0" ) }`, name: `Condition ${ index }`,
            dependencies: [] as string[], predicate:
            {
                name: "always" as const, arguments:
                {
                }
            }
        } )
    );
    const rules = Array.from
    (
        {
            length: ruleCount
        }, ( _, index ) => (
        {
            id: `rule-${ index.toString ().padStart ( 3, "0" ) }`, name: `Rule ${ index }`, event: "event",
            condition: conditions [ index % conditionCount ].id, action: "record"
        } )
    );

    // Return the value produced by this code path.

    return (
        {
            ...createModel ( [] ), conditions, actions: [
            {
                id: "record", name: "Record", parameters:
                {
                }
            } ], rules
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: raiseEvent
//
// Description:
//
//   Performs the raise event operation using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
// Returns:
//
//   The raise event result.
//
//---------------------------------------------------------------------------------------------------------------------

async function raiseEvent ( model: StatelessECAModel )
{
    const user = userEvent.setup ();
    const rendered = render ( <Simulator model={ model } documentRevision={ 7 } /> );
    await waitFor ( () => expect ( EvaluatingTestWorker.instances.length ).toBeGreaterThan ( 0 ) );
    await user.click
    (
        screen.getByRole
        (
            "button",
            {
                name: "Raise Event"
            }
        )
    );

    // Return the rendered.

    return rendered;
}

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: single-action simulator outcomes
//
// Description:
//
//   Verifies single-action simulator outcomes and records the expected externally observable behavior for future
//   changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "single-action simulator outcomes", () =>
    {
        afterEach
        (
            () =>
            {
                EvaluatingTestWorker.instances = [];
                vi.unstubAllGlobals ();
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: queries the complete rule set and renders one selected action
        //
        // Description:
        //
        //   Verifies queries the complete rule set and renders one selected action and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "queries the complete rule set and renders one selected action", async () =>
            {
                vi.stubGlobal ( "Worker", EvaluatingTestWorker );
                const
                    {
                        container
                    } = await raiseEvent ( createModel ( [ "record", "record" ] ) );

                expect ( screen.getByText ( "action = Q(event(payload), rules)" ) ).toBeVisible ();
                expect
                (
                    screen.queryByRole
                    (
                        "group",
                        {
                            name: "Conditions"
                        }
                    )
                ).toBeNull ();
                expect
                (
                    await screen.findByRole
                    (
                        "heading",
                        {
                            name: "Action selected"
                        }
                    )
                ).toBeVisible ();
                expect ( screen.getByText ( "Action selected." ) ).toBeVisible ();
                expect
                (
                    screen.getByRole
                    (
                        "columnheader",
                        {
                            name: "Matched"
                        }
                    )
                ).toBeVisible ();
                expect
                (
                    screen.getAllByRole
                    (
                        "cell",
                        {
                            name: "Yes"
                        }
                    )
                ).toHaveLength ( 2 );
                expect ( ( await axe.run ( container ) ).violations ).toEqual ( [] );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: renders the no-action query state
        //
        // Description:
        //
        //   Verifies renders the no-action query state and records the expected externally observable behavior for future
        //   changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "renders the no-action query state", async () =>
            {
                vi.stubGlobal ( "Worker", EvaluatingTestWorker );
                await raiseEvent ( createModel ( [] ) );

                expect
                (
                    await screen.findByRole
                    (
                        "heading",
                        {
                            name: "No action matched"
                        }
                    )
                ).toBeVisible ();
                expect ( screen.getByText ( "No action matched." ) ).toBeVisible ();
                expect ( screen.getByText ( /query returned no action/ ) ).toBeVisible ();
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: retains completed experiments for inspection and explicit replay
        //
        // Description:
        //
        //   Verifies retains completed experiments for inspection and explicit replay and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "retains completed experiments for inspection and explicit replay", async () =>
            {
                vi.stubGlobal ( "Worker", EvaluatingTestWorker );
                const user = userEvent.setup ();
                await raiseEvent ( createModel ( [ "record" ] ) );
                await screen.findByRole
                (
                    "heading",
                    {
                        name: "Action selected"
                    }
                );

                expect
                (
                    screen.getByRole
                    (
                        "heading",
                        {
                            name: "Experiment history"
                        }
                    )
                ).toBeVisible ();
                expect ( screen.getByText ( "1 / 20" ) ).toBeVisible ();
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Replay"
                        }
                    )
                );
                await waitFor ( () => expect ( screen.getByText ( "2 / 20" ) ).toBeVisible () );
                expect
                (
                    screen.getAllByRole
                    (
                        "button",
                        {
                            name: "Inspect"
                        }
                    )
                ).toHaveLength ( 2 );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: renders sorted ambiguity details without choosing an action
        //
        // Description:
        //
        //   Verifies renders sorted ambiguity details without choosing an action and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "renders sorted ambiguity details without choosing an action", async () =>
            {
                vi.stubGlobal ( "Worker", EvaluatingTestWorker );
                await raiseEvent ( createModel ( [ "record", "alert" ] ) );

                expect
                (
                    await screen.findByRole
                    (
                        "heading",
                        {
                            name: "Ambiguous action selection"
                        }
                    )
                ).toBeVisible ();
                expect ( screen.getByText ( "ambiguous-action-selection" ) ).toBeVisible ();
                expect ( screen.getByText ( "Alert, Record" ) ).toBeVisible ();
                expect ( screen.getByText ( "rule-1, rule-2" ) ).toBeVisible ();
                expect
                (
                    screen.getByText
                    (
                        "Event 'event' matched distinct actions [alert, record] through rules "
                        + "[rule-1, rule-2]."
                    )
                ).toBeVisible ();
                expect
                (
                    screen.queryByRole
                    (
                        "heading",
                        {
                            name: "Action selected"
                        }
                    )
                ).toBeNull ();
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: blocks evaluation while the model contains an unresolved action reference
        //
        // Description:
        //
        //   Verifies blocks evaluation while the model contains an unresolved action reference and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "blocks evaluation while the model contains an unresolved action reference", async () =>
            {
                vi.stubGlobal ( "Worker", EvaluatingTestWorker );
                const invalidModel =
                {
                    ...createModel ( [ "record" ] ), actions: []
                };
                await raiseEvent ( invalidModel );

                expect ( screen.getByRole ( "status" ) ).toHaveTextContent ( /unresolved-action-reference.*\/rules\/0\/action/ );
                expect
                (
                    screen.queryByRole
                    (
                        "heading",
                        {
                            name: "Action selected"
                        }
                    )
                ).toBeNull ();
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: paginates large condition and rule traces and keeps only the concise status live
        //
        // Description:
        //
        //   Verifies paginates large condition and rule traces and keeps only the concise status live and records the
        //   expected externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "paginates large condition and rule traces and keeps only the concise status live", async () =>
            {
                vi.stubGlobal ( "Worker", EvaluatingTestWorker );
                const user = userEvent.setup ();
                const
                    {
                        container
                    } = await raiseEvent ( createLargeTraceModel () );
                await screen.findByRole
                (
                    "heading",
                    {
                        name: "Action selected"
                    }
                );
                const conditionSection = screen.getByRole
                (
                    "heading",
                    {
                        name: "Condition outcomes"
                    }
                ).closest ( "section" )!;
                const ruleSection = screen.getByRole
                (
                    "heading",
                    {
                        name: "Rule trace"
                    }
                ).closest ( "section" )!;

                expect ( conditionSection.querySelectorAll ( ".trace-card" ) ).toHaveLength (
                    SIMULATOR_CONDITION_TRACE_PAGE_SIZE );
                expect ( within ( ruleSection ).getAllByRole ( "row" ) ).toHaveLength ( SIMULATOR_RULE_TRACE_PAGE_SIZE + 1 );
                expect ( container.querySelector ( ".simulator-result-panel" ) ).not.toHaveAttribute ( "aria-live" );

                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Next Condition trace page"
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Next Rule trace page"
                        }
                    )
                );
                expect ( conditionSection.querySelectorAll ( ".trace-card" ) ).toHaveLength ( 1 );
                expect ( within ( ruleSection ).getAllByRole ( "row" ) ).toHaveLength ( 2 );
            }
        );
    }
);
