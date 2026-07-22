//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable, reference-aware model commands used by every editor surface.
//
//---------------------------------------------------------------------------------------------------------------------

import { IDENTIFIER_PATTERN, MAXIMUM_IDENTIFIER_LENGTH, MAXIMUM_PAYLOAD_PARAMETERS }
    from "../contracts/contract-limits";
import type { ComparisonPredicate, StatelessECAModel } from "../contracts/model.generated";

//---------------------------------------------------------------------------------------------------------------------
// Type: DefinitionCollection
//
// Description:
//
//   Defines the valid representation of definition collection.
//
//---------------------------------------------------------------------------------------------------------------------
export type DefinitionCollection = "parameters" | "payloads" | "events" | "conditions" | "actions";
//---------------------------------------------------------------------------------------------------------------------
// Type: ItemCollection
//
// Description:
//
//   Defines the valid representation of item collection.
//
//---------------------------------------------------------------------------------------------------------------------
export type ItemCollection = DefinitionCollection | "rules";

export { IDENTIFIER_PATTERN, MAXIMUM_PAYLOAD_PARAMETERS } from "../contracts/contract-limits";

//---------------------------------------------------------------------------------------------------------------------
// Function: identifierValidationError
//
// Description:
//
//   Performs the identifier validation error operation using the supplied inputs and current state.
//
// Arguments:
//
//   value (string):
//     The value used by this operation.
//
//   identifiers (string[]):
//     The identifiers collection inspected or transformed by this operation.
//
//   currentValue (string):
//     The current value used by this operation.
//
// Returns:
//
//   The identifier validation error result.
//
//---------------------------------------------------------------------------------------------------------------------

export function identifierValidationError ( value: string, identifiers: string[] = [], currentValue?: string ):
    string | undefined
{
    if ( !value )
    {

        // Return the value produced by this code path.

        return "Enter an identifier.";
    }
    if ( value.length > MAXIMUM_IDENTIFIER_LENGTH )
    {

        // Return the value produced by this code path.

        return "Use no more than 128 characters.";
    }
    if ( !IDENTIFIER_PATTERN.test ( value ) )
    {

        // Return the value produced by this code path.

        return "Start with a letter; then use letters, digits, periods, underscores, or hyphens.";
    }
    if ( value !== currentValue && identifiers.includes ( value ) )
    {

        // Return the value produced by this code path.

        return "This identifier is already in use.";
    }

    // Return no value for this code path.

    return undefined;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: referencedDefinitionIdentifiers
//
// Description:
//
//   Performs the referenced definition identifiers operation using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   collection (DefinitionCollection):
//     The collection inspected or transformed by this operation.
//
//   identifier (string):
//     The stable identifier used to locate the corresponding model element.
//
// Returns:
//
//   The referenced definition identifiers result.
//
//---------------------------------------------------------------------------------------------------------------------

export function referencedDefinitionIdentifiers (
    model: StatelessECAModel, collection: DefinitionCollection, identifier: string ): string[]
{
    if ( collection === "parameters" )
    {
        const payloadReferences = model.payloads.filter ( payload => payload.parameters.includes ( identifier ) )
            .map ( payload => `payload ${ payload.id }` );
        const conditionReferences = model.conditions.filter
        (
            condition => condition.dependencies.includes ( identifier )
            || ( condition.predicate.name !== "always"
                && condition.predicate.arguments.parameter === identifier )
        )
            .map ( condition => `condition ${ condition.id }` );

        // Return the assembled array value.

        return [ ...payloadReferences, ...conditionReferences ];
    }
    if ( collection === "payloads" )
    {

        // Return the result produced by the delegated operation.

        return model.events.filter ( eventType => eventType.payload === identifier )
            .map ( eventType => `event ${ eventType.id }` );
    }

    const referenceField = collection === "events" ? "event"
        : collection === "conditions" ? "condition" : "action";

    // Return the result produced by the delegated operation.

    return model.rules.filter ( rule => rule [ referenceField ] === identifier )
        .map ( rule => `rule ${ rule.id }` );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: renameDefinition
//
// Description:
//
//   Performs the rename definition operation using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   collection (DefinitionCollection):
//     The collection inspected or transformed by this operation.
//
//   oldIdentifier (string):
//     The stable old identifier used to locate the corresponding model element.
//
//   newIdentifier (string):
//     The stable new identifier used to locate the corresponding model element.
//
// Returns:
//
//   The rename definition result.
//
//---------------------------------------------------------------------------------------------------------------------

export function renameDefinition (
    model: StatelessECAModel, collection: DefinitionCollection, oldIdentifier: string, newIdentifier: string ):
    StatelessECAModel
{
    if ( collection === "parameters" )
    {

        // Return the value selected by the evaluated condition.

        return (
            {
                ...model,
                parameters: model.parameters.map
                (
                    parameter => parameter.id === oldIdentifier
                    ?
                    {
                        ...parameter, id: newIdentifier
                    } : parameter
                ),
                payloads: model.payloads.map
                (
                    payload => (
                    {
                        ...payload,
                        parameters: payload.parameters.map
                        (
                            identifier => identifier === oldIdentifier
                            ? newIdentifier : identifier
                        )
                    } )
                ),
                conditions: model.conditions.map
                (
                    condition => condition.predicate.name === "always"
                    ?
                    {
                        ...condition, dependencies: condition.dependencies.map
                        (
                            identifier => identifier === oldIdentifier
                            ? newIdentifier : identifier
                        )
                    }
                    : renameConditionParameter ( condition, oldIdentifier, newIdentifier )
                )
            }
        );
    }
    if ( collection === "payloads" )
    {

        // Return the value selected by the evaluated condition.

        return (
            {
                ...model,
                payloads: model.payloads.map
                (
                    payload => payload.id === oldIdentifier
                    ?
                    {
                        ...payload, id: newIdentifier
                    } : payload
                ),
                events: model.events.map
                (
                    eventType => eventType.payload === oldIdentifier
                    ?
                    {
                        ...eventType, payload: newIdentifier
                    } : eventType
                )
            }
        );
    }

    const referenceField = collection === "events" ? "event"
        : collection === "conditions" ? "condition" : "action";

    // Return the value selected by the evaluated condition.

    return (
        {
            ...model,
            [ collection ]: model [ collection ].map
            (
                definition => definition.id === oldIdentifier
                ?
                {
                    ...definition, id: newIdentifier
                } : definition
            ),
            rules: model.rules.map
            (
                rule => rule [ referenceField ] === oldIdentifier
                ?
                {
                    ...rule, [ referenceField ]: newIdentifier
                } : rule
            )
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: renameItem
//
// Description:
//
//   Performs the rename item operation using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   collection (ItemCollection):
//     The collection inspected or transformed by this operation.
//
//   oldIdentifier (string):
//     The stable old identifier used to locate the corresponding model element.
//
//   newIdentifier (string):
//     The stable new identifier used to locate the corresponding model element.
//
// Returns:
//
//   The rename item result.
//
//---------------------------------------------------------------------------------------------------------------------

export function renameItem (
    model: StatelessECAModel, collection: ItemCollection, oldIdentifier: string, newIdentifier: string ):
    StatelessECAModel
{
    if ( collection !== "rules" )
    {

        // Return the result produced by the delegated operation.

        return renameDefinition ( model, collection, oldIdentifier, newIdentifier );
    }

    // Return the value selected by the evaluated condition.

    return (
        {
            ...model,
            rules: model.rules.map
            (
                rule => rule.id === oldIdentifier ?
                {
                    ...rule, id: newIdentifier
                } : rule
            )
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: removeDefinition
//
// Description:
//
//   Removes definition using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   collection (DefinitionCollection):
//     The collection inspected or transformed by this operation.
//
//   identifier (string):
//     The stable identifier used to locate the corresponding model element.
//
// Returns:
//
//   The remove definition result.
//
//---------------------------------------------------------------------------------------------------------------------

export function removeDefinition (
    model: StatelessECAModel, collection: DefinitionCollection, identifier: string ): StatelessECAModel
{

    // Return the value produced by this code path.

    return (
        {
            ...model,
            [ collection ]: model [ collection ].filter ( definition => definition.id !== identifier )
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: addPayloadParameter
//
// Description:
//
//   Adds payload parameter using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   payloadIdentifier (string):
//     The stable payload identifier used to locate the corresponding model element.
//
//   parameterIdentifier (string):
//     The stable parameter identifier used to locate the corresponding model element.
//
// Returns:
//
//   The add payload parameter result.
//
//---------------------------------------------------------------------------------------------------------------------

export function addPayloadParameter (
    model: StatelessECAModel, payloadIdentifier: string, parameterIdentifier: string ): StatelessECAModel
{
    const payloadIndex = model.payloads.findIndex ( payload => payload.id === payloadIdentifier );
    const payload      = model.payloads [ payloadIndex ];
    if ( !payload || !model.parameters.some ( parameter => parameter.id === parameterIdentifier )
        || payload.parameters.length >= MAXIMUM_PAYLOAD_PARAMETERS
        || payload.parameters.includes ( parameterIdentifier ) )
    {

        // Return the model.

        return model;
    }

    // Return the result produced by the delegated operation.

    return replacePayload
    (
        model, payloadIndex, (
            {
                ...payload,
                parameters: [ ...payload.parameters, parameterIdentifier ]
            }
        )
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: removePayloadParameter
//
// Description:
//
//   Removes payload parameter using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   payloadIdentifier (string):
//     The stable payload identifier used to locate the corresponding model element.
//
//   parameterIdentifier (string):
//     The stable parameter identifier used to locate the corresponding model element.
//
// Returns:
//
//   The remove payload parameter result.
//
//---------------------------------------------------------------------------------------------------------------------

export function removePayloadParameter (
    model: StatelessECAModel, payloadIdentifier: string, parameterIdentifier: string ): StatelessECAModel
{
    const payloadIndex = model.payloads.findIndex ( payload => payload.id === payloadIdentifier );
    const payload      = model.payloads [ payloadIndex ];
    if ( !payload || !payload.parameters.includes ( parameterIdentifier ) )
    {

        // Return the model.

        return model;
    }

    // Return the result produced by the delegated operation.

    return replacePayload
    (
        model, payloadIndex, (
            {
                ...payload,
                parameters: payload.parameters.filter ( identifier => identifier !== parameterIdentifier )
            }
        )
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: renameConditionParameter
//
// Description:
//
//   Performs the rename condition parameter operation using the supplied inputs and current state.
//
// Arguments:
//
//   condition (StatelessECAModel["conditions"][number]):
//     The condition used by this operation.
//
//   oldIdentifier (string):
//     The stable old identifier used to locate the corresponding model element.
//
//   newIdentifier (string):
//     The stable new identifier used to locate the corresponding model element.
//
// Returns:
//
//   The rename condition parameter result.
//
//---------------------------------------------------------------------------------------------------------------------

function renameConditionParameter (
    condition: StatelessECAModel["conditions"][number], oldIdentifier: string, newIdentifier: string ):
    StatelessECAModel["conditions"][number]
{
    const predicate = condition.predicate as ComparisonPredicate;

    // Return the value selected by the evaluated condition.

    return (
        {
            ...condition,
            dependencies: condition.dependencies.map
            (
                identifier => identifier === oldIdentifier
                ? newIdentifier : identifier
            ),
            predicate: predicate.arguments.parameter === oldIdentifier
                ?
                {
                    ...predicate, arguments:
                    {
                        ...predicate.arguments, parameter: newIdentifier
                    }
                }
                : predicate
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: replacePayload
//
// Description:
//
//   Replaces payload using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   payloadIndex (number):
//     The payload index inspected while evaluating or validating the current event occurrence.
//
//   payload (StatelessECAModel["payloads"][number]):
//     The payload inspected while evaluating or validating the current event occurrence.
//
// Returns:
//
//   The replace payload result.
//
//---------------------------------------------------------------------------------------------------------------------

function replacePayload ( model: StatelessECAModel, payloadIndex: number,
    payload: StatelessECAModel["payloads"][number] ): StatelessECAModel
{

    // Return the value selected by the evaluated condition.

    return (
        {
            ...model,
            payloads: model.payloads.map
            (
                ( currentPayload, index ) => index === payloadIndex
                ? payload : currentPayload
            )
        }
    );
}
