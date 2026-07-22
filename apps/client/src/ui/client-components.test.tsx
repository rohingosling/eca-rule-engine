//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   DOM interaction, controlled-workspace, lazy-panel, and automated accessibility coverage.
//
//---------------------------------------------------------------------------------------------------------------------

import axe from "axe-core";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
    DEFAULT_SIDE_PANEL_VIEWPORT_RATIO, MODEL_TREE_WIDTH_STORAGE_KEY, USER_GUIDE_WIDTH_STORAGE_KEY
} from "../config/editor-layout";
import type { StatelessECAModel } from "../contracts/model.generated";
import { createEmptyModel } from "../document/model-document";
import { App } from "./App";
import { JsonCodeView } from "./JsonCodeView";
import { Simulator } from "./Simulator";
import {
    type EditorCollectionSection, type EditorSelection, ModelTree, StructuredEditor
} from "./StructuredEditor";
import { Workspace, type WorkspaceTab } from "./Workspace";

//*********************************************************************************************************************
// Class: TestWorker
//
// Description:
//
//   Encapsulates test worker state and behavior.
//
//*********************************************************************************************************************
class TestWorker
{
    static instances = 0;
    static workers: TestWorker[] = [];
    onerror: ( () => void ) | null = null;
    onmessage: ( () => void ) | null = null;
    terminated = false;

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor: TestWorker
    //
    // Description:
    //
    //   Creates a new TestWorker instance from the supplied values and establishes its initial invariants.
    //
    //-----------------------------------------------------------------------------------------------------------------

    constructor ()
    {
        TestWorker.instances += 1;
        TestWorker.workers.push ( this );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: postMessage
    //
    // Description:
    //
    //   Posts message using the supplied inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    postMessage (): void
    {
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
// Function: StatefulEditor
//
// Description:
//
//   Renders the stateful editor component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (structured object):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

function StatefulEditor (
    {
        initialModel, initialSelection =
        {
            section: "model", identifier: ""
        } }:
    {
        initialModel: StatelessECAModel; initialSelection?: EditorSelection
    } )
{
    const [ model, setModel ] = useState ( initialModel );
    const [ selection, setSelection ] = useState<EditorSelection> ( initialSelection );
    const [ expandedSections, setExpandedSections ] = useState<EditorCollectionSection[]> ( [] );

    // Return the rendered interface element.

    return <><ModelTree model={ model } selection={ selection } setSelection={ setSelection }
        expandedSections={ expandedSections } toggleSection={ section => setExpandedSections
        (
            current =>
            current.includes ( section ) ? current.filter ( item => item !== section ) : [ ...current, section ]
        ) } />
    <StructuredEditor model={ model } selection={ selection } setSelection={ setSelection } updateModel={ setModel } />
    <output data-testid="model-state">{ JSON.stringify ( model ) }</output></>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: StatefulWorkspace
//
// Description:
//
//   Renders the stateful workspace component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (structured object):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

function StatefulWorkspace (
    {
        exportCollection, importCollection, initialModel }:
        {
            exportCollection?: ( section: EditorCollectionSection ) => void;
            importCollection?: ( section: EditorCollectionSection ) => void;
            initialModel: StatelessECAModel;
        } )
{
    const [ model, setModel ] = useState ( initialModel );
    const [ activeTab, setActiveTab ] = useState<WorkspaceTab> ( "model" );

    // Return the rendered interface element.

    return <Workspace activeTab={ activeTab } setActiveTab={ setActiveTab } documentOpen
        documentRevision={ 1 } model={ model } updateModel={ setModel } openNewModel={ () => undefined }
        importCollection={ importCollection } exportCollection={ exportCollection } />;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: currentModel
//
// Description:
//
//   Performs the current model operation using the supplied inputs and current state.
//
// Returns:
//
//   The current model result.
//
//---------------------------------------------------------------------------------------------------------------------

function currentModel (): StatelessECAModel
{

    // Return the value selected by the evaluated condition.

    return JSON.parse ( screen.getByTestId ( "model-state" ).textContent ?? "{}" ) as StatelessECAModel;
}

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: client workspace components
//
// Description:
//
//   Verifies client workspace components and records the expected externally observable behavior for future changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "client workspace components", () =>
    {
        //-----------------------------------------------------------------------------------------------------------------
        // Test: starts without a document and keeps navigation and academic guidance visible
        //
        // Description:
        //
        //   Verifies starts without a document and keeps navigation and academic guidance visible and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "starts without a document and keeps navigation and academic guidance visible", () =>
            {
                localStorage.removeItem ( MODEL_TREE_WIDTH_STORAGE_KEY );
                localStorage.removeItem ( USER_GUIDE_WIDTH_STORAGE_KEY );
                const
                    {
                        container
                    } = render ( <App /> );

                expect
                (
                    screen.getByRole
                    (
                        "heading",
                        {
                            name: "No document is open"
                        }
                    )
                ).toBeVisible ();
                expect ( screen.queryByText ( /File: No document/ ) ).toBeNull ();
                expect
                (
                    screen.getByRole
                    (
                        "navigation",
                        {
                            name: "ECA model structure"
                        }
                    )
                )
                    .toHaveTextContent ( "No document is open." );
                expect
                (
                    within ( container.querySelector ( ".user-guide-panel" )! )
                        .getByRole
                        (
                            "heading",
                            {
                                name: "Begin with a model document"
                            }
                        )
                ).toBeVisible ();
                expect ( within ( container.querySelector ( ".user-guide-panel" )! ).queryByText ( /Selected:/ ) ).toBeNull ();
                expect
                (
                    screen.getByRole
                    (
                        "separator",
                        {
                            name: "Resize model tree"
                        }
                    )
                ).toHaveAttribute
                (
                    "aria-valuenow",
                    String ( Math.round ( window.innerWidth * DEFAULT_SIDE_PANEL_VIEWPORT_RATIO ) )
                );
                expect
                (
                    screen.getByRole
                    (
                        "separator",
                        {
                            name: "Resize User Guide"
                        }
                    )
                ).toHaveAttribute
                (
                    "aria-valuenow",
                    String ( Math.round ( window.innerWidth * DEFAULT_SIDE_PANEL_VIEWPORT_RATIO ) )
                );
                expect ( container.querySelector ( ".button-bar .toolbar-file" ) ).toBeNull ();
                expect ( container.querySelector ( ".title-bar h1" ) )
                    .toHaveTextContent ( "ECA (Event Condition Action) Rule Engine Laboratory — No document" );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: places model validation last in the File menu and omits it from Edit
        //
        // Description:
        //
        //   Verifies places model validation last in the File menu and omits it from Edit and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "places model validation last in the File menu and omits it from Edit", async () =>
            {
                const user = userEvent.setup ();
                render ( <App /> );

                const fileSummary = screen.getByText
                (
                    "File",
                    {
                        selector: "summary"
                    }
                );
                await user.click ( fileSummary );
                const fileMenu = within ( fileSummary.closest ( "details" )! );
                const fileButtons = fileMenu.getAllByRole ( "button" );
                expect ( fileButtons.at ( -1 ) ).toHaveAccessibleName ( /Validate model/ );
                expect ( fileButtons.at ( -1 ) ).toBeDisabled ();

                await user.click
                (
                    screen.getByText
                    (
                        "Edit",
                        {
                            selector: "summary"
                        }
                    )
                );
                const editSummary = screen.getByText
                (
                    "Edit",
                    {
                        selector: "summary"
                    }
                );
                expect
                (
                    within ( editSummary.closest ( "details" )! ).queryByRole
                    (
                        "button",
                        {
                            name: /Validate model/
                        }
                    )
                ).toBeNull ();
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: mounts the code renderer and worker only when their tabs become active
        //
        // Description:
        //
        //   Verifies mounts the code renderer and worker only when their tabs become active and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "mounts the code renderer and worker only when their tabs become active", async () =>
            {
                vi.stubGlobal ( "Worker", TestWorker );
                TestWorker.instances = 0;
                TestWorker.workers = [];
                const user = userEvent.setup ();
                const
                    {
                        container
                    } = render ( <App /> );

                expect ( container.querySelector ( ".json-code-view" ) ).toBeNull ();
                expect ( TestWorker.instances ).toBe ( 0 );
                await user.click
                (
                    within ( container.querySelector ( ".no-document" )! )
                        .getByRole
                        (
                            "button",
                            {
                                name: "New model"
                            }
                        )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "tab",
                        {
                            name: "Code"
                        }
                    )
                );
                expect
                (
                    await screen.findByRole
                    (
                        "region",
                        {
                            name: "Read-only JSON model source"
                        }
                    )
                ).toBeVisible ();
                expect ( TestWorker.instances ).toBe ( 0 );
                await user.click
                (
                    screen.getByRole
                    (
                        "tab",
                        {
                            name: "Simulator"
                        }
                    )
                );
                await waitFor ( () => expect ( TestWorker.instances ).toBe ( 1 ) );
                vi.unstubAllGlobals ();
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: cancels an active evaluation by terminating and replacing its worker
        //
        // Description:
        //
        //   Verifies cancels an active evaluation by terminating and replacing its worker and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "cancels an active evaluation by terminating and replacing its worker", async () =>
            {
                vi.stubGlobal ( "Worker", TestWorker );
                TestWorker.instances = 0;
                TestWorker.workers = [];
                const user = userEvent.setup ();
                const model: StatelessECAModel =
                {
                    ...createEmptyModel (),
                    events: [
                    {
                        id: "event-one", name: "Event one"
                    } ],
                    conditions: [
                    {
                        id: "condition-one", name: "Condition one", dependencies: [],
                        predicate:
                        {
                            name: "always", arguments:
                            {
                            }
                        }
                    } ],
                    actions: [
                    {
                        id: "action-one", name: "Action one", parameters:
                        {
                        }
                    } ],
                    rules: [
                    {
                        id: "rule-one", name: "Rule one", event: "event-one",
                        condition: "condition-one", action: "action-one"
                    } ]
                };
                render ( <Simulator model={ model } documentRevision={ 1 } /> );

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
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Cancel evaluation"
                        }
                    )
                );
                expect ( TestWorker.workers [ 0 ].terminated ).toBe ( true );
                expect ( screen.getByText ( "Evaluation cancelled." ) ).toBeVisible ();
                await waitFor ( () => expect ( TestWorker.instances ).toBe ( 2 ) );
                vi.unstubAllGlobals ();
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: cancels an active evaluation when the selected event changes
        //
        // Description:
        //
        //   Verifies cancels an active evaluation when the selected event changes and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "cancels an active evaluation when the selected event changes", async () =>
            {
                vi.stubGlobal ( "Worker", TestWorker );
                TestWorker.instances = 0;
                TestWorker.workers = [];
                const user = userEvent.setup ();
                const model: StatelessECAModel =
                {
                    ...createEmptyModel (),
                    events: [
                    {
                        id: "event-one", name: "Event one"
                    },
                    {
                        id: "event-two", name: "Event two"
                    } ],
                    conditions: [
                    {
                        id: "condition-one", name: "Condition one", dependencies: [],
                        predicate:
                        {
                            name: "always", arguments:
                            {
                            }
                        }
                    } ],
                    actions: [
                    {
                        id: "action-one", name: "Action one", parameters:
                        {
                        }
                    } ],
                    rules: [
                        {
                            id: "rule-one", name: "Rule one", event: "event-one",
                            condition: "condition-one", action: "action-one"
                    },
                        {
                            id: "rule-two", name: "Rule two", event: "event-two",
                            condition: "condition-one", action: "action-one"
                    }
                    ]
                };
                render ( <Simulator model={ model } documentRevision={ 1 } /> );

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
                await user.selectOptions ( screen.getByLabelText ( "Event" ), "event-two" );

                expect ( TestWorker.workers [ 0 ].terminated ).toBe ( true );
                expect ( screen.getByText ( "Enter the event payload, then raise the event." ) ).toBeVisible ();
                await waitFor ( () => expect ( TestWorker.instances ).toBe ( 2 ) );
                vi.unstubAllGlobals ();
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: does not inherit payload-field errors for prototype-named parameters
        //
        // Description:
        //
        //   Verifies does not inherit payload-field errors for prototype-named parameters and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "does not inherit payload-field errors for prototype-named parameters", () =>
            {
                vi.stubGlobal ( "Worker", TestWorker );
                const model: StatelessECAModel =
                {
                    ...createEmptyModel (),
                    parameters: [
                    {
                        id: "toString", name: "Text", type: "string"
                    } ],
                    payloads: [
                    {
                        id: "payload", name: "Payload", parameters: [ "toString" ]
                    } ],
                    events: [
                    {
                        id: "event", name: "Event", payload: "payload"
                    } ]
                };

                render ( <Simulator model={ model } documentRevision={ 1 } /> );

                expect ( screen.getByLabelText ( "toString value" ) ).not.toHaveAttribute ( "aria-describedby" );
                vi.unstubAllGlobals ();
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: renames directly, rejects invalid identifiers, and keeps controlled tree selection
        //
        // Description:
        //
        //   Verifies renames directly, rejects invalid identifiers, and keeps controlled tree selection and records the
        //   expected externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "renames directly, rejects invalid identifiers, and keeps controlled tree selection", async () =>
            {
                const user          = userEvent.setup ();
                const confirmDialog = vi.spyOn ( window, "confirm" );
                const model: StatelessECAModel =
                {
                    ...createEmptyModel (), events: [
                    {
                        id: "event-one", name: "Event one"
                    } ]
                };
                render ( <StatefulEditor initialModel={ model } /> );

                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Expand Events"
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Event one"
                        }
                    )
                );
                expect
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Event one"
                        }
                    )
                ).toHaveAttribute ( "aria-current", "true" );
                const identifier = screen.getByLabelText ( "Identifier" );
                await user.clear ( identifier );
                await user.type ( identifier, "invalid identifier" );
                await user.tab ();
                expect ( identifier ).toHaveAttribute ( "aria-invalid", "true" );
                expect ( currentModel ().events [ 0 ].id ).toBe ( "event-one" );

                await user.clear ( identifier );
                await user.type ( identifier, "event-two" );
                await user.tab ();
                expect ( currentModel ().events [ 0 ].id ).toBe ( "event-two" );
                expect
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Event one"
                        }
                    )
                ).toHaveAttribute ( "aria-current", "true" );
                expect ( confirmDialog ).not.toHaveBeenCalled ();
                confirmDialog.mockRestore ();
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: navigates the visible model tree with arrows and selects nodes with Enter
        //
        // Description:
        //
        //   Verifies navigates the visible model tree with arrows and selects nodes with Enter and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "navigates the visible model tree with arrows and selects nodes with Enter", async () =>
            {
                const model: StatelessECAModel =
                {
                    ...createEmptyModel (), events: [
                    {
                        id: "event-one", name: "Event one"
                    } ]
                };
                render ( <StatefulEditor initialModel={ model } /> );

                const modelNode = screen.getByRole
                (
                    "button",
                    {
                        name: "ECA Model"
                    }
                );
                modelNode.focus ();
                fireEvent.keyDown
                (
                    modelNode,
                    {
                        key: "ArrowDown"
                    }
                );
                expect
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: /^Parameters\s*0$/
                        }
                    )
                ).toHaveFocus ();

                const eventsNode = screen.getByRole
                (
                    "button",
                    {
                        name: /^Events\s*1$/
                    }
                );
                eventsNode.focus ();
                fireEvent.keyDown
                (
                    eventsNode,
                    {
                        key: "ArrowRight"
                    }
                );
                expect ( eventsNode ).toHaveAttribute ( "aria-expanded", "true" );
                fireEvent.keyDown
                (
                    eventsNode,
                    {
                        key: "ArrowRight"
                    }
                );
                const eventNode = screen.getByRole
                (
                    "button",
                    {
                        name: "Event one"
                    }
                );
                expect ( eventNode ).toHaveFocus ();
                fireEvent.keyDown
                (
                    eventNode,
                    {
                        key: "Enter"
                    }
                );
                expect ( eventNode ).toHaveAttribute ( "aria-current", "true" );
                expect
                (
                    screen.getByRole
                    (
                        "heading",
                        {
                            name: "Event one"
                        }
                    )
                ).toBeVisible ();

                fireEvent.keyDown
                (
                    eventNode,
                    {
                        key: "ArrowLeft"
                    }
                );
                expect ( eventsNode ).toHaveFocus ();
                fireEvent.keyDown
                (
                    eventsNode,
                    {
                        key: "ArrowLeft"
                    }
                );
                expect ( eventsNode ).toHaveAttribute ( "aria-expanded", "false" );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: moves through form controls with arrows and Enter without taking horizontal text editing
        //
        // Description:
        //
        //   Verifies moves through form controls with arrows and Enter without taking horizontal text editing and records
        //   the expected externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "moves through form controls with arrows and Enter without taking horizontal text editing", () =>
            {
                const model: StatelessECAModel =
                {
                    ...createEmptyModel (), parameters: [
                    {
                        id: "weight", name: "Weight", description: "", type: "number"
                    } ]
                };
                render
                (
                    <StatefulEditor initialModel={ model } initialSelection={
                    {
                        section: "parameters", identifier: "weight"
                    } } />
                );

                const identifier = screen.getByLabelText ( "Identifier" );
                const name       = screen.getByLabelText ( "Name" );
                const description = screen.getByLabelText ( "Description" );
                const type       = screen.getByLabelText ( "JSON type" );
                const remove     = screen.getByRole
                (
                    "button",
                    {
                        name: "Delete item"
                    }
                );

                identifier.focus ();
                fireEvent.keyDown
                (
                    identifier,
                    {
                        key: "ArrowRight"
                    }
                );
                expect ( identifier ).toHaveFocus ();
                fireEvent.keyDown
                (
                    identifier,
                    {
                        key: "ArrowDown"
                    }
                );
                expect ( name ).toHaveFocus ();
                fireEvent.keyDown
                (
                    name,
                    {
                        key: "Enter"
                    }
                );
                expect ( type ).toHaveFocus ();
                fireEvent.keyDown
                (
                    type,
                    {
                        key: "ArrowLeft"
                    }
                );
                expect ( description ).toHaveFocus ();
                fireEvent.keyDown
                (
                    description,
                    {
                        key: "ArrowDown"
                    }
                );
                expect ( type ).toHaveFocus ();
                fireEvent.keyDown
                (
                    type,
                    {
                        key: "ArrowRight"
                    }
                );
                expect ( remove ).toHaveFocus ();
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: provides visible, pointer, and keyboard tree context commands
        //
        // Description:
        //
        //   Verifies provides visible, pointer, and keyboard tree context commands and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "provides visible, pointer, and keyboard tree context commands", async () =>
            {
                const user             = userEvent.setup ();
                const importCollection = vi.fn ();
                const exportCollection = vi.fn ();
                const model: StatelessECAModel =
                {
                    ...createEmptyModel (), events: [
                    {
                        id: "event-one", name: "Event one"
                    },
                    {
                        id: "event-two", name: "Event two"
                    } ]
                };
                render
                (
                    <StatefulWorkspace initialModel={ model } importCollection={ importCollection }
                    exportCollection={ exportCollection } />
                );

                const eventsNode = screen.getByRole
                (
                    "button",
                    {
                        name: /^Events\s*2$/
                    }
                );
                fireEvent.contextMenu
                (
                    eventsNode,
                    {
                        clientX: 20, clientY: 30
                    }
                );
                expect
                (
                    screen.getByRole
                    (
                        "menu",
                        {
                            name: "Events commands"
                        }
                    )
                ).toBeVisible ();
                expect
                (
                    screen.getByRole
                    (
                        "menuitem",
                        {
                            name: "Add"
                        }
                    )
                ).toHaveFocus ();
                fireEvent.keyDown
                (
                    screen.getByRole
                    (
                        "menu",
                        {
                            name: "Events commands"
                        }
                    ),
                        {
                            key: "End"
                        }
                );
                expect
                (
                    screen.getByRole
                    (
                        "menuitem",
                        {
                            name: "Export CSV"
                        }
                    )
                ).toHaveFocus ();
                await user.click
                (
                    screen.getByRole
                    (
                        "menuitem",
                        {
                            name: "Import CSV"
                        }
                    )
                );
                expect ( importCollection ).toHaveBeenCalledWith ( "events" );

                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "More commands for Events"
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "menuitem",
                        {
                            name: "Export CSV"
                        }
                    )
                );
                expect ( exportCollection ).toHaveBeenCalledWith ( "events" );

                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Expand Events"
                        }
                    )
                );
                const eventOne = screen.getByRole
                (
                    "button",
                    {
                        name: "Event one"
                    }
                );
                eventOne.focus ();
                fireEvent.keyDown
                (
                    eventOne,
                    {
                        key: "F10", shiftKey: true
                    }
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "menuitem",
                        {
                            name: "Copy"
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "More commands for Event two"
                        }
                    )
                );
                expect
                (
                    screen.getByRole
                    (
                        "menuitem",
                        {
                            name: "Paste above"
                        }
                    )
                ).toBeEnabled ();
                await user.click
                (
                    screen.getByRole
                    (
                        "menuitem",
                        {
                            name: "Paste above"
                        }
                    )
                );
                expect
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: /^Events\s*3$/
                        }
                    )
                ).toBeVisible ();
                expect ( screen.getByLabelText ( "Identifier" ) ).toHaveValue ( "event-one-copy-3" );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: orders Parameters, Payloads, and Events and presents identifiers before names
        //
        // Description:
        //
        //   Verifies orders Parameters, Payloads, and Events and presents identifiers before names and records the
        //   expected externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "orders Parameters, Payloads, and Events and presents identifiers before names", async () =>
            {
                const user = userEvent.setup ();
                const model: StatelessECAModel =
                {
                    ...createEmptyModel (),
                    parameters: [
                    {
                        id: "amount", name: "Amount", type: "number"
                    } ],
                    payloads: [
                    {
                        id: "order", name: "Order payload", parameters: [ "amount" ]
                    } ],
                    events: [
                    {
                        id: "submitted", name: "Order submitted", payload: "order"
                    } ]
                };
                const
                    {
                        container
                    } = render ( <StatefulEditor initialModel={ model } /> );

                const modelIdentifier = screen.getByLabelText ( "Identifier" );
                const modelName       = screen.getByLabelText ( "Name" );
                expect ( modelIdentifier.compareDocumentPosition ( modelName ) & Node.DOCUMENT_POSITION_FOLLOWING ).not.toBe ( 0 );

                const parametersNode = screen.getByRole
                (
                    "button",
                    {
                        name: /^Parameters\s*1$/
                    }
                );
                const payloadsNode   = screen.getByRole
                (
                    "button",
                    {
                        name: /^Payloads\s*1$/
                    }
                );
                const eventsNode     = screen.getByRole
                (
                    "button",
                    {
                        name: /^Events\s*1$/
                    }
                );
                expect ( parametersNode.compareDocumentPosition ( payloadsNode ) & Node.DOCUMENT_POSITION_FOLLOWING ).not.toBe ( 0 );
                expect ( payloadsNode.compareDocumentPosition ( eventsNode ) & Node.DOCUMENT_POSITION_FOLLOWING ).not.toBe ( 0 );

                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Expand Parameters"
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Amount"
                        }
                    )
                );
                const parameterIdentifier = screen.getByLabelText ( "Identifier" );
                const parameterName       = screen.getByLabelText ( "Name" );
                expect
                (
                    parameterIdentifier.compareDocumentPosition ( parameterName )
                    & Node.DOCUMENT_POSITION_FOLLOWING
                ).not.toBe ( 0 );
                expect ( screen.queryByLabelText ( "Event" ) ).toBeNull ();
                expect ( screen.queryByLabelText ( "Payload" ) ).toBeNull ();
                expect ( ( await axe.run ( container ) ).violations ).toEqual ( [] );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: builds a parameter, payload definition, and single-payload event in sequence
        //
        // Description:
        //
        //   Verifies builds a parameter, payload definition, and single-payload event in sequence and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "builds a parameter, payload definition, and single-payload event in sequence", async () =>
            {
                const user = userEvent.setup ();
                render ( <StatefulEditor initialModel={ createEmptyModel () } /> );

                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: /^Parameters\s*0$/
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Add parameter"
                        }
                    )
                );
                expect ( screen.getByLabelText ( "Identifier" ) ).toHaveValue ( "parameter-1" );
                await user.selectOptions ( screen.getByLabelText ( "JSON type" ), "number" );

                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: /^Payloads\s*0$/
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Add payload"
                        }
                    )
                );
                const parameterToAdd = screen.getByLabelText ( "Parameter to add" );
                expect ( parameterToAdd ).toHaveValue ( "" );
                expect ( parameterToAdd ).toHaveAttribute ( "list" );
                await user.type ( parameterToAdd, "parameter-1" );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Add parameter"
                        }
                    )
                );
                expect
                (
                    screen.getByRole
                    (
                        "cell",
                        {
                            name: "parameter-1"
                        }
                    )
                ).toBeVisible ();

                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: /^Events\s*0$/
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Add event"
                        }
                    )
                );
                await user.selectOptions ( screen.getByLabelText ( "Payload" ), "payload-1" );

                const model = currentModel ();
                expect ( model.parameters ).toEqual
                (
                    [ expect.objectContaining
                    (
                        {
                            id: "parameter-1", type: "number"
                        }
                    ) ]
                );
                expect ( model.payloads ).toEqual
                (
                    [ expect.objectContaining
                    (
                        {
                            id: "payload-1", parameters: [ "parameter-1" ]
                        }
                    ) ]
                );
                expect ( model.events ).toEqual
                (
                    [ expect.objectContaining
                    (
                        {
                            id: "event-1", payload: "payload-1"
                        }
                    ) ]
                );
                expect ( Object.hasOwn ( model.events [ 0 ], "parameters" ) ).toBe ( false );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: lists every available parameter in the searchable payload picker
        //
        // Description:
        //
        //   Verifies lists every available parameter in the searchable payload picker and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "lists every available parameter in the searchable payload picker", async () =>
            {
                const user = userEvent.setup ();
                const model: StatelessECAModel =
                {
                    ...createEmptyModel (),
                    parameters: [
                        {
                            id: "currency", name: "Currency", type: "string"
                    },
                        {
                            id: "amount", name: "Amount", type: "number"
                    },
                        {
                            id: "source", name: "Source", type: "string"
                    }
                    ],
                    payloads: [
                    {
                        id: "order", name: "Order", parameters: [ "currency" ]
                    } ]
                };
                render
                (
                    <StatefulEditor initialModel={ model }
                    initialSelection={
                        {
                            section: "payloads", identifier: "order"
                        } } />
                );

                const parameterToAdd = screen.getByLabelText ( "Parameter to add" );
                const suggestionIdentifier = parameterToAdd.getAttribute ( "list" );
                const suggestions = document.getElementById ( suggestionIdentifier! )!;
                expect ( Array.from ( suggestions.querySelectorAll ( "option" ), option => option.value ) )
                    .toEqual ( [ "amount", "source" ] );
                expect ( parameterToAdd ).toHaveValue ( "" );

                await user.type ( parameterToAdd, "source" );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Add parameter"
                        }
                    )
                );
                expect ( currentModel ().payloads [ 0 ].parameters ).toEqual ( [ "currency", "source" ] );
                expect ( parameterToAdd ).toHaveValue ( "" );
                expect ( Array.from ( suggestions.querySelectorAll ( "option" ), option => option.value ) )
                    .toEqual ( [ "amount" ] );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: requires a declared parameter before one can be added to a payload
        //
        // Description:
        //
        //   Verifies requires a declared parameter before one can be added to a payload and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "requires a declared parameter before one can be added to a payload", async () =>
            {
                const user = userEvent.setup ();
                const model: StatelessECAModel =
                {
                    ...createEmptyModel (), payloads: [
                    {
                        id: "empty", name: "Empty payload", parameters: []
                    } ]
                };
                render
                (
                    <StatefulEditor initialModel={ model }
                    initialSelection={
                        {
                            section: "payloads", identifier: "empty"
                        } } />
                );

                expect
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Add parameter"
                        }
                    )
                ).toBeDisabled ();
                expect ( screen.getByText ( "Add a parameter definition before building this payload." ) ).toBeVisible ();
                await user.type ( screen.getByLabelText ( "Parameter to add" ), "missing" );
                expect
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Add parameter"
                        }
                    )
                ).toBeDisabled ();
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: selects condition parameters from global definitions and keeps both references synchronized
        //
        // Description:
        //
        //   Verifies selects condition parameters from global definitions and keeps both references synchronized and
        //   records the expected externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "selects condition parameters from global definitions and keeps both references synchronized", async () =>
            {
                const user = userEvent.setup ();
                const model: StatelessECAModel =
                {
                    ...createEmptyModel (),
                    parameters: [
                        {
                            id: "currency", name: "Currency", type: "string"
                    },
                        {
                            id: "amount", name: "Amount", type: "number"
                    }
                    ],
                    conditions: [
                    {
                        id: "condition-one", name: "Condition one", dependencies: [],
                        predicate:
                        {
                            name: "always", arguments:
                            {
                            }
                        }
                    } ]
                };
                render ( <StatefulEditor initialModel={ model } /> );

                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Expand Conditions"
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Condition one"
                        }
                    )
                );
                await user.selectOptions ( screen.getByLabelText ( "Predicate" ), "equals" );
                const requiredParameter = screen.getByLabelText ( "Required parameter" );
                expect ( requiredParameter ).toHaveValue ( "amount" );
                await user.selectOptions ( requiredParameter, "currency" );

                expect ( currentModel ().conditions [ 0 ].dependencies ).toEqual ( [ "currency" ] );
                expect ( currentModel ().conditions [ 0 ].predicate ).toMatchObject
                (
                    {
                        name: "equals", arguments:
                        {
                            parameter: "currency"
                        }
                    }
                );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: preserves an unresolved imported parameter reference in the dropdown
        //
        // Description:
        //
        //   Verifies preserves an unresolved imported parameter reference in the dropdown and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "preserves an unresolved imported parameter reference in the dropdown", async () =>
            {
                const user = userEvent.setup ();
                const model: StatelessECAModel =
                {
                    ...createEmptyModel (),
                    parameters: [
                    {
                        id: "amount", name: "Amount", type: "number"
                    } ],
                    conditions: [
                    {
                        id: "condition-one", name: "Condition one", dependencies: [ "missing" ],
                        predicate:
                        {
                            name: "equals", arguments:
                            {
                                parameter: "missing", value: 1
                            }
                        }
                    } ]
                };
                render ( <StatefulEditor initialModel={ model } /> );

                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Expand Conditions"
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Condition one"
                        }
                    )
                );
                const requiredParameter = screen.getByLabelText ( "Required parameter" );
                expect ( requiredParameter ).toHaveValue ( "missing" );
                expect
                (
                    screen.getByRole
                    (
                        "option",
                        {
                            name: "missing (unresolved)"
                        }
                    )
                ).toBeVisible ();
                expect
                (
                    screen.getByRole
                    (
                        "option",
                        {
                            name: "amount"
                        }
                    )
                ).toBeVisible ();
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: uses typeless symbolic action data and no Action type field
        //
        // Description:
        //
        //   Verifies uses typeless symbolic action data and no Action type field and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "uses typeless symbolic action data and no Action type field", async () =>
            {
                const model: StatelessECAModel =
                {
                    ...createEmptyModel (), actions: [
                    {
                        id: "notify", name: "Notify", parameters:
                        {
                            channel: "email"
                        }
                    } ]
                };
                render
                (
                    <StatefulEditor initialModel={ model }
                    initialSelection={
                        {
                            section: "actions", identifier: "notify"
                        } } />
                );

                expect ( screen.queryByLabelText ( "Action type" ) ).toBeNull ();
                expect ( screen.getByLabelText ( "Action data (JSON object)" ) )
                    .toHaveValue
                    (
                        JSON.stringify
                        (
                            {
                                channel: "email"
                            }, null, 2
                        )
                    );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: keeps the tree and contextual User Guide mounted across workspace tabs
        //
        // Description:
        //
        //   Verifies keeps the tree and contextual User Guide mounted across workspace tabs and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "keeps the tree and contextual User Guide mounted across workspace tabs", async () =>
            {
                const user = userEvent.setup ();
                const
                    {
                        container
                    } = render ( <StatefulWorkspace initialModel={ createEmptyModel () } /> );
                const guide = within ( container.querySelector ( ".user-guide-panel" )! );

                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: /^Parameters\s*0$/
                        }
                    )
                );
                expect
                (
                    guide.getByRole
                    (
                        "heading",
                        {
                            name: "Parameters"
                        }
                    )
                ).toBeVisible ();
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: /^Payloads\s*0$/
                        }
                    )
                );
                expect
                (
                    guide.getByRole
                    (
                        "heading",
                        {
                            name: "Payload definitions"
                        }
                    )
                ).toBeVisible ();

                await user.click
                (
                    screen.getByRole
                    (
                        "tab",
                        {
                            name: "Code"
                        }
                    )
                );
                expect
                (
                    await screen.findByRole
                    (
                        "region",
                        {
                            name: "Read-only JSON model source"
                        }
                    )
                ).toBeVisible ();
                expect
                (
                    screen.getByRole
                    (
                        "navigation",
                        {
                            name: "ECA model structure"
                        }
                    )
                ).toBeVisible ();
                expect
                (
                    guide.getByRole
                    (
                        "heading",
                        {
                            name: "Model source"
                        }
                    )
                ).toBeVisible ();
                expect ( guide.queryByText ( /Selected:/ ) ).toBeNull ();

                const userGuideSplitter = screen.getByRole
                (
                    "separator",
                    {
                        name: "Resize User Guide"
                    }
                );
                const startingWidth = Number ( userGuideSplitter.getAttribute ( "aria-valuenow" ) );
                fireEvent.keyDown
                (
                    userGuideSplitter,
                    {
                        key: "ArrowLeft"
                    }
                );
                expect ( Number ( userGuideSplitter.getAttribute ( "aria-valuenow" ) ) ).toBeGreaterThan ( startingWidth );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: reports top-level parameter and payload counts in the status bar
        //
        // Description:
        //
        //   Verifies reports top-level parameter and payload counts in the status bar and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "reports top-level parameter and payload counts in the status bar", async () =>
            {
                const user = userEvent.setup ();
                const
                    {
                        container
                    } = render ( <App /> );

                await user.click
                (
                    within ( container.querySelector ( ".no-document" )! )
                        .getByRole
                        (
                            "button",
                            {
                                name: "New model"
                            }
                        )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: /^Parameters\s*0$/
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Add parameter"
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: /^Payloads\s*0$/
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Add payload"
                        }
                    )
                );

                expect ( screen.getByText ( "Parameters: 1" ) ).toBeVisible ();
                expect ( screen.getByText ( "Payloads: 1" ) ).toBeVisible ();
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: keeps complete source accessible while virtualizing and shrinking large documents
        //
        // Description:
        //
        //   Verifies keeps complete source accessible while virtualizing and shrinking large documents and records the
        //   expected externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "keeps complete source accessible while virtualizing and shrinking large documents", async () =>
            {
                const rules = Array.from
                (
                    {
                        length: 3000
                    }, ( _, index ) => (
                    {
                        id: `rule-${ index }`, name: `Rule ${ index }`, event: "event-one",
                        condition: "condition-one", action: "action-one"
                    } )
                );
                const largeModel =
                {
                    ...createEmptyModel (), rules
                };
                const user = userEvent.setup ();
                const
                    {
                        container, rerender
                    } = render ( <JsonCodeView model={ largeModel } /> );
                expect ( container.querySelectorAll ( ".json-code-line" ).length ).toBeLessThan ( 200 );
                expect ( screen.getByLabelText ( "Complete JSON model source" ) )
                    .toHaveValue ( JSON.stringify ( largeModel, null, 2 ) + "\n" );

                const codeView = screen.getByRole
                (
                    "region",
                    {
                        name: "Read-only JSON model source"
                    }
                );
                Object.defineProperty
                (
                    codeView, "scrollTop",
                    {
                        configurable: true, value: 50_000, writable: true
                    }
                );
                fireEvent.scroll ( codeView );
                rerender ( <JsonCodeView model={ createEmptyModel () } /> );

                expect ( container.querySelectorAll ( ".json-code-line" ).length ).toBeGreaterThan ( 0 );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Copy JSON"
                        }
                    )
                );
                expect ( await navigator.clipboard.readText () ).toBe ( JSON.stringify ( createEmptyModel (), null, 2 ) + "\n" );
                expect ( ( await axe.run ( container ) ).violations ).toEqual ( [] );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: flushes an active identifier draft before replacing model text
        //
        // Description:
        //
        //   Verifies flushes an active identifier draft before replacing model text and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "flushes an active identifier draft before replacing model text", async () =>
            {
                const user = userEvent.setup ();
                const promptDialog = vi.spyOn ( window, "prompt" )
                    .mockReturnValueOnce ( "draft-model" )
                    .mockReturnValueOnce ( "replaced-model" );
                const confirmDialog = vi.spyOn ( window, "confirm" ).mockReturnValue ( true );
                const
                    {
                        container
                    } = render ( <App /> );

                await user.click
                (
                    within ( container.querySelector ( ".no-document" )! )
                        .getByRole
                        (
                            "button",
                            {
                                name: "New model"
                            }
                        )
                );
                const identifier = screen.getByLabelText ( "Identifier" );
                await user.clear ( identifier );
                await user.type ( identifier, "draft-model" );
                await user.keyboard ( "{Control>}h{/Control}" );

                await waitFor ( () => expect ( identifier ).toHaveValue ( "replaced-model" ) );
                expect ( promptDialog ).toHaveBeenCalledTimes ( 2 );
                expect ( confirmDialog ).toHaveBeenCalledTimes ( 1 );
                promptDialog.mockRestore ();
                confirmDialog.mockRestore ();
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: protects a dirty document from browser navigation
        //
        // Description:
        //
        //   Verifies protects a dirty document from browser navigation and records the expected externally observable
        //   behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "protects a dirty document from browser navigation", async () =>
            {
                const user = userEvent.setup ();
                const
                    {
                        container
                    } = render ( <App /> );

                const cleanEvent = new Event
                (
                    "beforeunload",
                    {
                        cancelable: true
                    }
                );
                window.dispatchEvent ( cleanEvent );
                expect ( cleanEvent.defaultPrevented ).toBe ( false );

                await user.click
                (
                    within ( container.querySelector ( ".no-document" )! )
                        .getByRole
                        (
                            "button",
                            {
                                name: "New model"
                            }
                        )
                );
                await user.clear ( screen.getByLabelText ( "Name" ) );
                await user.type ( screen.getByLabelText ( "Name" ), "Dirty model" );

                const dirtyEvent = new Event
                (
                    "beforeunload",
                    {
                        cancelable: true
                    }
                );
                window.dispatchEvent ( dirtyEvent );
                expect ( dirtyEvent.defaultPrevented ).toBe ( true );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: protects an uncommitted identifier draft from browser navigation
        //
        // Description:
        //
        //   Verifies protects an uncommitted identifier draft from browser navigation and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "protects an uncommitted identifier draft from browser navigation", async () =>
            {
                const user = userEvent.setup ();
                const
                    {
                        container
                    } = render ( <App /> );
                await user.click
                (
                    within ( container.querySelector ( ".no-document" )! )
                        .getByRole
                        (
                            "button",
                            {
                                name: "New model"
                            }
                        )
                );
                const identifier = screen.getByLabelText ( "Identifier" );
                await user.clear ( identifier );
                await user.type ( identifier, "pending-identifier" );

                const beforeUnloadEvent = new Event
                (
                    "beforeunload",
                    {
                        cancelable: true
                    }
                );
                window.dispatchEvent ( beforeUnloadEvent );

                expect ( beforeUnloadEvent.defaultPrevented ).toBe ( true );
                expect ( identifier ).toHaveAttribute ( "data-document-draft-dirty", "true" );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: applies Edit-menu clipboard commands to the last focused text field
        //
        // Description:
        //
        //   Verifies applies Edit-menu clipboard commands to the last focused text field and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "applies Edit-menu clipboard commands to the last focused text field", async () =>
            {
                const user = userEvent.setup ();
                const
                    {
                        container
                    } = render ( <App /> );
                await user.click
                (
                    within ( container.querySelector ( ".no-document" )! )
                        .getByRole
                        (
                            "button",
                            {
                                name: "New model"
                            }
                        )
                );
                const name = screen.getByLabelText ( "Name" ) as HTMLInputElement;

                await user.clear ( name );
                await user.type ( name, "alpha beta" );
                name.focus ();
                name.setSelectionRange ( 6, 10 );
                await user.click
                (
                    screen.getByText
                    (
                        "Edit",
                        {
                            selector: "summary"
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Copy"
                        }
                    )
                );
                expect ( await navigator.clipboard.readText () ).toBe ( "beta" );
                expect ( name ).toHaveFocus ();

                await navigator.clipboard.writeText ( "gamma" );
                name.setSelectionRange ( 6, 10 );
                await user.click
                (
                    screen.getByText
                    (
                        "Edit",
                        {
                            selector: "summary"
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Paste"
                        }
                    )
                );
                expect ( name ).toHaveValue ( "alpha gamma" );

                name.setSelectionRange ( 6, 11 );
                await user.click
                (
                    screen.getByText
                    (
                        "Edit",
                        {
                            selector: "summary"
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Cut"
                        }
                    )
                );
                expect ( await navigator.clipboard.readText () ).toBe ( "gamma" );
                expect ( name ).toHaveValue ( "alpha " );

                name.setSelectionRange ( 0, 0 );
                await user.click
                (
                    screen.getByText
                    (
                        "Edit",
                        {
                            selector: "summary"
                        }
                    )
                );
                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Delete"
                        }
                    )
                );
                expect ( name ).toHaveValue ( "lpha " );
            }
        );
    }
);
