//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable editor metadata and reference resolvers shared by forms, simulation, and tests.
//
//---------------------------------------------------------------------------------------------------------------------

import type {
    Condition, EventType, ParameterDefinition, PayloadDefinition, StatelessECAModel
} from "../contracts/model.generated";

export const PARAMETER_TYPES: ParameterDefinition["type"][] = [
    "null", "boolean", "number", "integer", "string", "array", "object"
];

export const PREDICATE_NAMES: Condition["predicate"]["name"][] = [
    "always", "equals", "notEquals", "greaterThan", "greaterThanOrEqual", "lessThan", "lessThanOrEqual", "contains"
];

//---------------------------------------------------------------------------------------------------------------------
// Function: selectModelParameterNames
//
// Description:
//
//   Selects model parameter names using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
// Returns:
//
//   The select model parameter names result.
//
//---------------------------------------------------------------------------------------------------------------------

export function selectModelParameterNames ( model: StatelessECAModel ): string[]
{

    // Return the value selected by the evaluated condition.

    return model.parameters.map ( parameter => parameter.id )
        .sort ( ( left, right ) => left < right ? -1 : left > right ? 1 : 0 );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: resolvePayloadParameters
//
// Description:
//
//   Resolves payload parameters using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   payload (PayloadDefinition | undefined):
//     The payload inspected while evaluating or validating the current event occurrence.
//
// Returns:
//
//   The resolve payload parameters result.
//
//---------------------------------------------------------------------------------------------------------------------

export function resolvePayloadParameters (
    model: StatelessECAModel, payload: PayloadDefinition | undefined ): ParameterDefinition[]
{
    if ( !payload )
    {

        // Return the assembled array value.

        return [];
    }

    const parameters = new Map ( model.parameters.map ( parameter => [ parameter.id, parameter ] ) );

    // Return the value selected by the evaluated condition.

    return payload.parameters.flatMap
    (
        identifier =>
        {
            const parameter = parameters.get ( identifier );

            // Return the value selected by the evaluated condition.

            return parameter ? [ parameter ] : [];
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: resolveEventParameters
//
// Description:
//
//   Resolves event parameters using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   eventType (EventType | undefined):
//     The event type used by this operation.
//
// Returns:
//
//   The resolve event parameters result.
//
//---------------------------------------------------------------------------------------------------------------------

export function resolveEventParameters (
    model: StatelessECAModel, eventType: EventType | undefined ): ParameterDefinition[]
{
    if ( !eventType?.payload )
    {

        // Return the assembled array value.

        return [];
    }

    // Return the result produced by the delegated operation.

    return resolvePayloadParameters ( model, model.payloads.find ( payload => payload.id === eventType.payload ) );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: definitionName
//
// Description:
//
//   Performs the definition name operation using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   collection ("parameters" | "payloads" | "events" | "conditions" | "actions"):
//     The collection inspected or transformed by this operation.
//
//   identifier (string):
//     The stable identifier used to locate the corresponding model element.
//
// Returns:
//
//   The definition name result.
//
//---------------------------------------------------------------------------------------------------------------------

export function definitionName (
    model: StatelessECAModel, collection: "parameters" | "payloads" | "events" | "conditions" | "actions",
    identifier: string ): string
{

    // Return the value selected by the evaluated condition.

    return model [ collection ].find ( definition => definition.id === identifier )?.name ?? identifier;
}
