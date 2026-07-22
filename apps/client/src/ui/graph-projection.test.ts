//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Tests for deterministic graph projection and document-history synchronization.
//
//---------------------------------------------------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import type { StatelessECAModel } from "../contracts/model.generated";
import { createDocumentState, documentReducer } from "../document/model-document";
import { graphNodeSelection, projectModelGraph } from "./graph-projection";

//---------------------------------------------------------------------------------------------------------------------
// Function: createGraphModel
//
// Description:
//
//   Constructs graph model from the supplied inputs without mutating the caller's source values.
//
// Returns:
//
//   The newly constructed value, model element, or immutable state projection.
//
//---------------------------------------------------------------------------------------------------------------------

function createGraphModel (): StatelessECAModel
{

    // Return the value produced by this code path.

    return (
        {
            schemaVersion: "1.0",
            id: "graph-model",
            name: "Graph model",
            description: "",
            parameters: [],
            payloads: [],
            events: [
                {
                    id: "order-created", name: "Order created", description: ""
                }
            ],
            conditions: [
                {
                    id: "always", name: "Always", description: "", dependencies: [], predicate:
                    {
                        name: "always", arguments:
                        {
                        }
                    }
                }
            ],
            actions: [
                {
                    id: "notify", name: "Notify", description: "", parameters:
                    {
                    }
                }
            ],
            rules: [
                {
                    id: "notify-rule", name: "Notify rule", description: "", event: "order-created",
                    condition: "always", action: "notify"
                }
            ]
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: model graph projection
//
// Description:
//
//   Verifies model graph projection and records the expected externally observable behavior for future changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "model graph projection", () =>
    {
        //-----------------------------------------------------------------------------------------------------------------
        // Test: projects typed definition nodes and two connections for each rule
        //
        // Description:
        //
        //   Verifies projects typed definition nodes and two connections for each rule and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "projects typed definition nodes and two connections for each rule", () =>
            {
                const projection = projectModelGraph ( createGraphModel () );

                expect ( projection.nodes.map ( node => node.data.kind ) ).toEqual ( [ "event", "condition", "action" ] );
                expect ( projection.nodes.map ( node => node.position.x ) ).toEqual ( [ 0, 320, 640 ] );
                expect ( projection.edges ).toHaveLength ( 2 );
                expect ( projection.edges.every ( edge => edge.data?.ruleIdentifier === "notify-rule" ) ).toBe ( true );
                expect ( projection.edges.every ( edge => edge.data?.diagnostic === false ) ).toBe ( true );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: keeps incomplete rules visible through diagnostic nodes and edges
        //
        // Description:
        //
        //   Verifies keeps incomplete rules visible through diagnostic nodes and edges and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "keeps incomplete rules visible through diagnostic nodes and edges", () =>
            {
                const model = createGraphModel ();
                model.rules [ 0 ] =
                {
                    ...model.rules [ 0 ], condition: "missing-condition", action: ""
                };

                const projection = projectModelGraph ( model );
                const diagnosticNodes = projection.nodes.filter ( node => node.data.diagnostic );

                expect ( diagnosticNodes.map ( node => node.data.label ) ).toEqual (
                    [ "Missing condition: missing-condition", "Missing action: empty reference" ] );
                expect ( projection.edges ).toHaveLength ( 2 );
                expect ( projection.edges.every ( edge => edge.data?.diagnostic ) ).toBe ( true );
                expect ( graphNodeSelection ( diagnosticNodes [ 0 ] ) ).toEqual
                (
                    {
                        identifier: "", section: "conditions"
                    }
                );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: reprojects the current immutable model through undo and redo
        //
        // Description:
        //
        //   Verifies reprojects the current immutable model through undo and redo and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "reprojects the current immutable model through undo and redo", () =>
            {
                const initialModel = createGraphModel ();
                const editedModel: StatelessECAModel =
                {
                    ...initialModel, actions: []
                };
                const initialState = createDocumentState ( initialModel );
                const editedState  = documentReducer
                (
                    initialState,
                    {
                        type: "edit", model: editedModel
                    }
                );
                const undoneState  = documentReducer
                (
                    editedState,
                    {
                        type: "undo"
                    }
                );
                const redoneState  = documentReducer
                (
                    undoneState,
                    {
                        type: "redo"
                    }
                );

                expect ( projectModelGraph ( editedState.present ).nodes.some ( node => node.data.diagnostic ) ).toBe ( true );
                expect ( projectModelGraph ( undoneState.present ).nodes.some ( node => node.data.diagnostic ) ).toBe ( false );
                expect ( projectModelGraph ( redoneState.present ).nodes.some ( node => node.data.diagnostic ) ).toBe ( true );
            }
        );
    }
);
