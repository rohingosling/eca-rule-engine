//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable document history and persistence state.
//
//---------------------------------------------------------------------------------------------------------------------

import {
    DEFAULT_MODEL_IDENTIFIER, DEFAULT_MODEL_NAME, MAXIMUM_DOCUMENT_HISTORY_BYTES, MAXIMUM_DOCUMENT_HISTORY_LENGTH
} from "../config/model-editor";
import type { StatelessECAModel } from "../contracts/model.generated";

const modelSerializations = new WeakMap<StatelessECAModel, string> ();

//---------------------------------------------------------------------------------------------------------------------
// Interface: DocumentState
//
// Description:
//
//   Defines the named fields and callable operations that make up document state.
//
//---------------------------------------------------------------------------------------------------------------------
export interface DocumentState
{
    past: StatelessECAModel[];
    pastCosts: number[];
    present: StatelessECAModel;
    future: StatelessECAModel[];
    futureCosts: number[];
    savedModel: string;
    revision: number;
}

//---------------------------------------------------------------------------------------------------------------------
// Type: DocumentAction
//
// Description:
//
//   Defines the valid representation of document action.
//
//---------------------------------------------------------------------------------------------------------------------
export type DocumentAction =
    |
    {
        type: "replace"; model: StatelessECAModel; markSaved?: boolean
    }
    |
    {
        type: "edit"; model: StatelessECAModel
    }
    |
    {
        type: "undo"
    }
    |
    {
        type: "redo"
    }
    |
    {
        type: "markSaved"; model?: StatelessECAModel
    };

//---------------------------------------------------------------------------------------------------------------------
// Function: createEmptyModel
//
// Description:
//
//   Constructs empty model from the supplied inputs without mutating the caller's source values.
//
// Returns:
//
//   The newly constructed value, model element, or immutable state projection.
//
//---------------------------------------------------------------------------------------------------------------------

export function createEmptyModel (): StatelessECAModel
{

    // Return the value produced by this code path.

    return (
        {
            schemaVersion: "1.0",
            id: DEFAULT_MODEL_IDENTIFIER,
            name: DEFAULT_MODEL_NAME,
            description: "",
            parameters: [],
            payloads: [],
            events: [],
            conditions: [],
            actions: [],
            rules: []
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: serializeModel
//
// Description:
//
//   Serializes model using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
// Returns:
//
//   The serialize model result.
//
//---------------------------------------------------------------------------------------------------------------------

export function serializeModel ( model: StatelessECAModel ): string
{
    const cachedSerialization = modelSerializations.get ( model );
    if ( cachedSerialization !== undefined )
    {

        // Return the cached serialization.

        return cachedSerialization;
    }

    const serialization = `${ JSON.stringify ( model, null, 2 ) }\n`;
    modelSerializations.set ( model, serialization );

    // Return the serialization.

    return serialization;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: createDocumentState
//
// Description:
//
//   Constructs document state from the supplied inputs without mutating the caller's source values.
//
// Arguments:
//
//   model (inferred):
//     The compiled or contract model inspected by this operation.
//
// Returns:
//
//   The newly constructed value, model element, or immutable state projection.
//
//---------------------------------------------------------------------------------------------------------------------

export function createDocumentState ( model = createEmptyModel () ): DocumentState
{

    // Return the value produced by this code path.

    return (
        {
            past: [], pastCosts: [], present: model, future: [], futureCosts: [],
            savedModel: serializeModel ( model ), revision: 0
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: approximateSnapshotBytes
//
// Description:
//
//   Performs the approximate snapshot bytes operation using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
// Returns:
//
//   The approximate snapshot bytes result.
//
//---------------------------------------------------------------------------------------------------------------------

function approximateSnapshotBytes ( model: StatelessECAModel ): number
{
    // A serialized UTF-16 length is a deliberately conservative, deterministic upper-bound proxy for retained data.

    // Return the result produced by the delegated operation.

    return serializeModel ( model ).length * 2;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: appendHistory
//
// Description:
//
//   Performs the append history operation using the supplied inputs and current state.
//
// Arguments:
//
//   models (StatelessECAModel[]):
//     The models collection inspected or transformed by this operation.
//
//   costs (number[]):
//     The costs collection inspected or transformed by this operation.
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
// Returns:
//
//   The append history result.
//
//---------------------------------------------------------------------------------------------------------------------

function appendHistory ( models: StatelessECAModel[], costs: number[], model: StatelessECAModel ):
    {
        models: StatelessECAModel[]; costs: number[]
    }
{
    const nextModels = [ ...models, model ].slice ( -MAXIMUM_DOCUMENT_HISTORY_LENGTH );
    const nextCosts  = [ ...costs, approximateSnapshotBytes ( model ) ].slice ( -MAXIMUM_DOCUMENT_HISTORY_LENGTH );
    let totalBytes   = nextCosts.reduce ( ( total, cost ) => total + cost, 0 );

    while ( nextModels.length > 1 && totalBytes > MAXIMUM_DOCUMENT_HISTORY_BYTES )
    {
        nextModels.shift ();
        totalBytes -= nextCosts.shift ()!;
    }

    // Return the value produced by this code path.

    return (
        {
            models: nextModels, costs: nextCosts
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: documentReducer
//
// Description:
//
//   Performs the document reducer operation using the supplied inputs and current state.
//
// Arguments:
//
//   state (DocumentState):
//     The state used by this operation.
//
//   action (DocumentAction):
//     The action used by this operation.
//
// Returns:
//
//   The document reducer result.
//
//---------------------------------------------------------------------------------------------------------------------

export function documentReducer ( state: DocumentState, action: DocumentAction ): DocumentState
{
    switch ( action.type )
    {
        case "edit":
            if ( serializeModel ( action.model ) === serializeModel ( state.present ) )
            {

        // Return the state.

        return state;
    }
            const editedHistory = appendHistory ( state.past, state.pastCosts, state.present );

            // Return the value produced by this code path.

            return (
                {
                    ...state,
                    past: editedHistory.models,
                    pastCosts: editedHistory.costs,
                    present: action.model,
                    future: [],
                    futureCosts: [],
                    revision: state.revision + 1
                }
            );
        case "replace":

            // Return the value selected by the evaluated condition.

            return (
                {
                    past: [],
                    pastCosts: [],
                    present: action.model,
                    future: [],
                    futureCosts: [],
                    savedModel: action.markSaved === false ? state.savedModel : serializeModel ( action.model ),
                    revision: state.revision + 1
                }
            );
        case "undo":
            if ( state.past.length === 0 )
            {

        // Return the state.

        return state;
    }

            // Return the value produced by this code path.

            return (
                {
                    ...state,
                    past: state.past.slice ( 0, -1 ),
                    pastCosts: state.pastCosts.slice ( 0, -1 ),
                    present: state.past [ state.past.length - 1 ],
                    future: [ state.present, ...state.future ],
                    futureCosts: [ approximateSnapshotBytes ( state.present ), ...state.futureCosts ],
                    revision: state.revision + 1
                }
            );
        case "redo":
            if ( state.future.length === 0 )
            {

        // Return the state.

        return state;
    }
            const redoneHistory = appendHistory ( state.past, state.pastCosts, state.present );

            // Return the value produced by this code path.

            return (
                {
                    ...state,
                    past: redoneHistory.models,
                    pastCosts: redoneHistory.costs,
                    present: state.future [ 0 ],
                    future: state.future.slice ( 1 ),
                    futureCosts: state.futureCosts.slice ( 1 ),
                    revision: state.revision + 1
                }
            );
        case "markSaved":

            // Return the value selected by the evaluated condition.

            return (
                {
                    ...state, savedModel: serializeModel ( action.model ?? state.present )
                }
            );
    }
}

//---------------------------------------------------------------------------------------------------------------------
// Function: isDocumentDirty
//
// Description:
//
//   Determines whether is document dirty holds for the supplied value or application state.
//
// Arguments:
//
//   state (DocumentState):
//     The state used by this operation.
//
// Returns:
//
//   True when the requested condition holds; otherwise false.
//
//---------------------------------------------------------------------------------------------------------------------

export function isDocumentDirty ( state: DocumentState ): boolean
{

    // Return the result produced by the delegated operation.

    return serializeModel ( state.present ) !== state.savedModel;
}
