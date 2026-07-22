//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Event-payload form state and typed value parsing for the browser simulator.
//
//---------------------------------------------------------------------------------------------------------------------

import type { EventType, ParameterDefinition, StatelessECAModel } from "../contracts/model.generated";
import type { JsonValue } from "../engine/types";
import { resolveEventParameters } from "./model-metadata";

//---------------------------------------------------------------------------------------------------------------------
// Interface: ParsedPayload
//
// Description:
//
//   Defines the named fields and callable operations that make up parsed payload.
//
//---------------------------------------------------------------------------------------------------------------------
export interface ParsedPayload
{
    errors: Record<string, string>;
    payload: Record<string, JsonValue>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: createPayloadDraft
//
// Description:
//
//   Constructs payload draft from the supplied inputs without mutating the caller's source values.
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
//   The newly constructed value, model element, or immutable state projection.
//
//---------------------------------------------------------------------------------------------------------------------

export function createPayloadDraft (
    model: StatelessECAModel, eventType: EventType | undefined ): Record<string, string>
{

    // Return the value selected by the evaluated condition.

    return Object.fromEntries
    (
        resolveEventParameters ( model, eventType ).map
        (
            parameter => [ parameter.id,
            parameter.type === "null" ? "null"
                : parameter.type === "boolean" ? "false"
                    : parameter.type === "number" || parameter.type === "integer" ? "0"
                        : parameter.type === "array" ? "[]"
                            : parameter.type === "object" ? "{}" : "" ]
        )
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: parseParameterValue
//
// Description:
//
//   Parses the supplied representation and returns its normalized in-memory form.
//
// Arguments:
//
//   parameter (ParameterDefinition):
//     The parameter used by this operation.
//
//   source (string):
//     The source used by this operation.
//
// Returns:
//
//   The parse parameter value result.
//
//---------------------------------------------------------------------------------------------------------------------

function parseParameterValue ( parameter: ParameterDefinition, source: string ): JsonValue
{
    if ( parameter.type === "string" )
    {
        // Return the source.

        return source;
    }
    if ( parameter.type === "null" )
    {
        if ( source.trim () !== "null" ) throw new Error ( "Enter null." );

        // Return no value for this code path.

        return null;
    }
    if ( parameter.type === "boolean" )
    {
        if ( source === "true" )
        {
            // Return true for this code path.

            return true;
        }
        if ( source === "false" )
        {
            // Return false for this code path.

            return false;
        }
        throw new Error ( "Choose true or false." );
    }
    if ( parameter.type === "number" || parameter.type === "integer" )
    {
        const value = Number ( source );
        if ( source.trim () === "" || !Number.isFinite ( value ) ) throw new Error ( "Enter a finite number." );
        if ( parameter.type === "integer" && !Number.isInteger ( value ) ) throw new Error ( "Enter an integer." );

        // Return the value.

        return value;
    }

    let value: unknown;
    try
    {
        value = JSON.parse ( source );
    }
    catch
    {
        throw new Error ( `Enter a valid JSON ${ parameter.type }.` );
    }
    if ( parameter.type === "array" && !Array.isArray ( value ) ) throw new Error ( "Enter a JSON array." );
    if ( parameter.type === "object" && ( !value || typeof value !== "object" || Array.isArray ( value ) ) )
        throw new Error ( "Enter a JSON object." );

    // Return the value produced by this code path.

    return value as JsonValue;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: parsePayload
//
// Description:
//
//   Parses the supplied representation and returns its normalized in-memory form.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   eventType (EventType):
//     The event type used by this operation.
//
//   draft (Record<string, string>):
//     The draft used by this operation.
//
//   includedParameterNames (string[]):
//     The included parameter names collection inspected or transformed by this operation.
//
// Returns:
//
//   The parse payload result.
//
//---------------------------------------------------------------------------------------------------------------------

export function parsePayload ( model: StatelessECAModel, eventType: EventType, draft: Record<string, string>,
    includedParameterNames: string[] ): ParsedPayload
{
    const includedParameters = new Set ( includedParameterNames );
    const errors: Record<string, string> =
    {
    };
    const payload: Record<string, JsonValue> =
    {
    };

    resolveEventParameters ( model, eventType ).forEach
    (
        parameter =>
        {
            if ( !includedParameters.has ( parameter.id ) )
            {
                // Return without a value after completing this code path.

                return;
            }
            try
            {
                payload [ parameter.id ] = parseParameterValue ( parameter, draft [ parameter.id ] ?? "" );
            }
            catch ( error )
            {
                errors [ parameter.id ] = error instanceof Error ? error.message : "Enter a valid value.";
            }
        }
    );

    // Return the value produced by this code path.

    return (
        {
            errors, payload
        }
    );
}
