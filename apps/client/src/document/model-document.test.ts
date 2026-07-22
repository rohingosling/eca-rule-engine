//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Regression coverage for immutable document history, persistence, and serialization.
//
//---------------------------------------------------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { createDocumentState, documentReducer, isDocumentDirty, serializeModel } from "./model-document";

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: documentReducer
//
// Description:
//
//   Verifies documentReducer and records the expected externally observable behavior for future changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "documentReducer", () =>
    {
        //-----------------------------------------------------------------------------------------------------------------
        // Test: tracks edits, undo, redo, and saved state
        //
        // Description:
        //
        //   Verifies tracks edits, undo, redo, and saved state and records the expected externally observable behavior for
        //   future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "tracks edits, undo, redo, and saved state", () =>
            {
                const initialState = createDocumentState ();
                const editedModel =
                {
                    ...initialState.present, name: "Edited model"
                };
                const editedState = documentReducer
                (
                    initialState,
                    {
                        type: "edit", model: editedModel
                    }
                );

                expect ( editedState.revision ).toBe ( 1 );
                expect ( isDocumentDirty ( editedState ) ).toBe ( true );

                const undoneState = documentReducer
                (
                    editedState,
                    {
                        type: "undo"
                    }
                );
                expect ( undoneState.present.name ).toBe ( "New model" );

                const redoneState = documentReducer
                (
                    undoneState,
                    {
                        type: "redo"
                    }
                );
                expect ( redoneState.present.name ).toBe ( "Edited model" );
                expect
                (
                    isDocumentDirty
                    (
                        documentReducer
                        (
                            redoneState,
                            {
                                type: "markSaved"
                            }
                        )
                    )
                ).toBe ( false );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: exports stable pretty JSON with a trailing newline
        //
        // Description:
        //
        //   Verifies exports stable pretty JSON with a trailing newline and records the expected externally observable
        //   behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "exports stable pretty JSON with a trailing newline", () =>
            {
                const state = createDocumentState ();
                expect ( serializeModel ( state.present ) ).toBe ( `${ JSON.stringify ( state.present, null, 2 ) }\n` );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: returns to a clean state when an edit restores the saved content
        //
        // Description:
        //
        //   Verifies returns to a clean state when an edit restores the saved content and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "returns to a clean state when an edit restores the saved content", () =>
            {
                const initialState = createDocumentState ();
                const editedState = documentReducer
                (
                    initialState,
                    {
                        type: "edit", model:
                        {
                            ...initialState.present, name: "Temporary name"
                        }
                    }
                );
                const restoredState = documentReducer
                (
                    editedState,
                    {
                        type: "edit", model:
                        {
                            ...editedState.present, name: initialState.present.name
                        }
                    }
                );

                expect ( isDocumentDirty ( restoredState ) ).toBe ( false );
            }
        );
    }
);
