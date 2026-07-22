//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable creation, insertion, and copy commands shared by model-tree and form command surfaces.
//
//---------------------------------------------------------------------------------------------------------------------

import {
    DEFAULT_CONDITION_PREDICATE, DEFAULT_PARAMETER_TYPE, DEFAULT_RULE_ACTION_REFERENCE,
    DEFAULT_RULE_CONDITION_REFERENCE, DEFAULT_RULE_EVENT_REFERENCE, NEW_DEFINITION_DEFAULTS
} from "../config/model-editor";
import { MODEL_COLLECTION_LIMITS } from "../contracts/contract-limits";
import type {
    Action, Condition, EventType, ParameterDefinition, PayloadDefinition, Rule, StatelessECAModel
} from "../contracts/model.generated";
import type { ItemCollection } from "./model-commands";

//---------------------------------------------------------------------------------------------------------------------
// Type: ModelCollectionItem
//
// Description:
//
//   Defines the valid representation of model collection item.
//
//---------------------------------------------------------------------------------------------------------------------
export type ModelCollectionItem = ParameterDefinition | PayloadDefinition | EventType | Condition | Action | Rule;

//---------------------------------------------------------------------------------------------------------------------
// Interface: InsertedModelItem
//
// Description:
//
//   Defines the named fields and callable operations that make up inserted model item.
//
//---------------------------------------------------------------------------------------------------------------------
export interface InsertedModelItem
{
    identifier: string;
    model: StatelessECAModel;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: createIdentifier
//
// Description:
//
//   Constructs identifier from the supplied inputs without mutating the caller's source values.
//
// Arguments:
//
//   prefix (string):
//     The prefix used by this operation.
//
//   identifiers (string[]):
//     The identifiers collection inspected or transformed by this operation.
//
// Returns:
//
//   The newly constructed value, model element, or immutable state projection.
//
//---------------------------------------------------------------------------------------------------------------------

function createIdentifier ( prefix: string, identifiers: string[] ): string
{
    let number = identifiers.length + 1;
    while ( identifiers.includes ( `${ prefix }-${ number }` ) )
    {
        number += 1;
    }

    // Return the value produced by this code path.

    return `${ prefix }-${ number }`;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: insertNewModelItem
//
// Description:
//
//   Performs the insert new model item operation using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   collection (ItemCollection):
//     The collection inspected or transformed by this operation.
//
//   insertionIndex (inferred):
//     The insertion index used by this operation.
//
// Returns:
//
//   The insert new model item result.
//
//---------------------------------------------------------------------------------------------------------------------

export function insertNewModelItem ( model: StatelessECAModel, collection: ItemCollection,
    insertionIndex = model [ collection ].length ): InsertedModelItem | undefined
{
    if ( model [ collection ].length >= MODEL_COLLECTION_LIMITS [ collection ] )
    {

        // Return no value for this code path.

        return undefined;
    }

    const defaults   = NEW_DEFINITION_DEFAULTS [ collection ];
    const identifier = createIdentifier ( defaults.identifierPrefix, model [ collection ].map ( item => item.id ) );
    const item       = createDefaultItem ( model, collection, identifier );

    // Return the result produced by the delegated operation.

    return insertModelItem ( model, collection, item, insertionIndex );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: copyModelItem
//
// Description:
//
//   Copies model item using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   collection (ItemCollection):
//     The collection inspected or transformed by this operation.
//
//   sourceItem (ModelCollectionItem):
//     The source item used by this operation.
//
//   insertionIndex (number):
//     The insertion index used by this operation.
//
// Returns:
//
//   The copy model item result.
//
//---------------------------------------------------------------------------------------------------------------------

export function copyModelItem ( model: StatelessECAModel, collection: ItemCollection,
    sourceItem: ModelCollectionItem, insertionIndex: number ): InsertedModelItem | undefined
{
    if ( model [ collection ].length >= MODEL_COLLECTION_LIMITS [ collection ] )
    {

        // Return no value for this code path.

        return undefined;
    }

    const identifier = createIdentifier ( `${ sourceItem.id }-copy`, model [ collection ].map ( item => item.id ) );
    const item = structuredClone
    (
        (
            {
                ...sourceItem, id: identifier
            }
        )
    );

    // Return the result produced by the delegated operation.

    return insertModelItem ( model, collection, item, insertionIndex );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: createDefaultItem
//
// Description:
//
//   Constructs default item from the supplied inputs without mutating the caller's source values.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   collection (ItemCollection):
//     The collection inspected or transformed by this operation.
//
//   identifier (string):
//     The stable identifier used to locate the corresponding model element.
//
// Returns:
//
//   The newly constructed value, model element, or immutable state projection.
//
//---------------------------------------------------------------------------------------------------------------------

function createDefaultItem ( model: StatelessECAModel, collection: ItemCollection,
    identifier: string ): ModelCollectionItem
{
    const defaults = NEW_DEFINITION_DEFAULTS [ collection ];
    if ( collection === "parameters" )
    {

        // Return the value produced by this code path.

        return (
            {
                id: identifier, name: defaults.name, description: "", type: DEFAULT_PARAMETER_TYPE
            }
        );
    }
    if ( collection === "payloads" )
    {

        // Return the value produced by this code path.

        return (
            {
                id: identifier, name: defaults.name, description: "", parameters: []
            }
        );
    }
    if ( collection === "events" )
    {

        // Return the value produced by this code path.

        return (
            {
                id: identifier, name: defaults.name, description: ""
            }
        );
    }
    if ( collection === "conditions" )
    {

        // Return the value produced by this code path.

        return (
            {
                id: identifier, name: defaults.name, description: "", dependencies: [], predicate:
                {
                    name: DEFAULT_CONDITION_PREDICATE, arguments:
                    {
                    }
                }
            }
        );
    }
    if ( collection === "actions" )
    {

        // Return the value produced by this code path.

        return (
            {
                id: identifier, name: defaults.name, description: "", parameters:
                {
                }
            }
        );
    }

    // Return the value selected by the evaluated condition.

    return (
        {
            id: identifier, name: defaults.name, description: "",
            event: model.events [ 0 ]?.id ?? DEFAULT_RULE_EVENT_REFERENCE,
            condition: model.conditions [ 0 ]?.id ?? DEFAULT_RULE_CONDITION_REFERENCE,
            action: model.actions [ 0 ]?.id ?? DEFAULT_RULE_ACTION_REFERENCE
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: insertModelItem
//
// Description:
//
//   Performs the insert model item operation using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   collection (ItemCollection):
//     The collection inspected or transformed by this operation.
//
//   item (ModelCollectionItem):
//     The item used by this operation.
//
//   insertionIndex (number):
//     The insertion index used by this operation.
//
// Returns:
//
//   The insert model item result.
//
//---------------------------------------------------------------------------------------------------------------------

function insertModelItem ( model: StatelessECAModel, collection: ItemCollection, item: ModelCollectionItem,
    insertionIndex: number ): InsertedModelItem
{
    const items = [ ...model [ collection ] ] as ModelCollectionItem[];
    items.splice ( Math.max ( 0, Math.min ( insertionIndex, items.length ) ), 0, item );

    // Return the value produced by this code path.

    return (
        {
            identifier: item.id,
            model:
            {
                ...model, [ collection ]: items
            } as StatelessECAModel
        }
    );
}
