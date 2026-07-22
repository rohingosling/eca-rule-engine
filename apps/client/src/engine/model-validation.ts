//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Safe boundary for converting untrusted JSON or YAML values into a model.
//
//---------------------------------------------------------------------------------------------------------------------

import { MAXIMUM_JSON_DOCUMENT_DEPTH } from "../config/model-editor";
import type { StatelessECAModel } from "../contracts/model.generated";
import { validateSemantics, type SemanticDiagnostic } from "./semantic-validator";
import { validateStructure, type StructuralDiagnostic } from "./validator";

//---------------------------------------------------------------------------------------------------------------------
// Interface: ModelBoundaryDiagnostic
//
// Description:
//
//   Defines the named fields and callable operations that make up model boundary diagnostic.
//
//---------------------------------------------------------------------------------------------------------------------
interface ModelBoundaryDiagnostic
{
    code: string;
    message: string;
    pointer: string;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: PendingJsonValue
//
// Description:
//
//   Defines the named fields and callable operations that make up pending JSON value.
//
//---------------------------------------------------------------------------------------------------------------------
interface PendingJsonValue
{
    depth: number;
    pointer: string;
    value: unknown;
}

//---------------------------------------------------------------------------------------------------------------------
// Type: ModelDiagnostic
//
// Description:
//
//   Defines the valid representation of model diagnostic.
//
//---------------------------------------------------------------------------------------------------------------------
export type ModelDiagnostic = ModelBoundaryDiagnostic | StructuralDiagnostic | SemanticDiagnostic;

//---------------------------------------------------------------------------------------------------------------------
// Interface: ModelValidationResult
//
// Description:
//
//   Defines the named fields and callable operations that make up model validation result.
//
//---------------------------------------------------------------------------------------------------------------------
export interface ModelValidationResult
{
    diagnostics: ModelDiagnostic[];
    model?: StatelessECAModel;
    recoverableModel?: StatelessECAModel;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: escapeJsonPointerSegment
//
// Description:
//
//   Escapes JSON pointer segment using the supplied inputs and current state.
//
// Arguments:
//
//   segment (string):
//     The segment used by this operation.
//
// Returns:
//
//   The escape JSON pointer segment result.
//
//---------------------------------------------------------------------------------------------------------------------

function escapeJsonPointerSegment ( segment: string ): string
{

    // Return the result produced by the delegated operation.

    return segment.replaceAll ( "~", "~0" ).replaceAll ( "/", "~1" );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: boundaryDiagnostic
//
// Description:
//
//   Performs the boundary diagnostic operation using the supplied inputs and current state.
//
// Arguments:
//
//   code (string):
//     The code used by this operation.
//
//   message (string):
//     The message used by this operation.
//
//   pointer (string):
//     The pointer used by this operation.
//
// Returns:
//
//   The boundary diagnostic result.
//
//---------------------------------------------------------------------------------------------------------------------

function boundaryDiagnostic ( code: string, message: string, pointer: string ): ModelBoundaryDiagnostic
{

    // Return the value produced by this code path.

    return (
        {
            code, message, pointer
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: validateJsonTree
//
// Description:
//
//   Validates JSON tree and reports deterministic diagnostics for every detected contract violation.
//
// Arguments:
//
//   root (unknown):
//     The root used by this operation.
//
// Returns:
//
//   The deterministic diagnostics produced by validation.
//
//---------------------------------------------------------------------------------------------------------------------

function validateJsonTree ( root: unknown ): ModelBoundaryDiagnostic | undefined
{
    const visitedObjects = new WeakSet<object> ();
    const pendingValues: PendingJsonValue[] = [
        {
            depth: 0, pointer: "", value: root
        } ];

    while ( pendingValues.length > 0 )
    {
        const pendingValue = pendingValues.pop ()!;
        const value = pendingValue.value;

        if ( value === null || typeof value === "string" || typeof value === "boolean" )
        {
            continue;
        }
        if ( typeof value === "number" )
        {
            if ( !Number.isFinite ( value ) )
            {

                // Return the result produced by the delegated operation.

                return boundaryDiagnostic (
                    "non-finite-json-number", "JSON numbers must be finite.", pendingValue.pointer );
            }
            continue;
        }
        if ( typeof value !== "object" )
        {

            // Return the result produced by the delegated operation.

            return boundaryDiagnostic (
                "invalid-json-value", "The document contains a value that JSON cannot represent.", pendingValue.pointer );
        }
        if ( visitedObjects.has ( value ) )
        {

            // Return the result produced by the delegated operation.

            return boundaryDiagnostic
            (
                "non-tree-json-value", "JSON documents cannot contain aliases or cyclic references.",
                pendingValue.pointer
            );
        }

        const depth = pendingValue.depth + 1;
        if ( depth > MAXIMUM_JSON_DOCUMENT_DEPTH )
        {

            // Return the result produced by the delegated operation.

            return boundaryDiagnostic
            (
                "json-depth-limit-exceeded",
                `JSON nesting exceeds the ${ MAXIMUM_JSON_DOCUMENT_DEPTH }-level limit.`,
                pendingValue.pointer
            );
        }
        visitedObjects.add ( value );

        if ( Array.isArray ( value ) )
        {
            for ( let index = value.length - 1; index >= 0; index-- )
            {
                if ( !( index in value ) )
                {

                    // Return the result produced by the delegated operation.

                    return boundaryDiagnostic
                    (
                        "invalid-json-value", "JSON arrays cannot contain empty slots.",
                        `${ pendingValue.pointer }/${ index }`
                    );
                }
                pendingValues.push
                (
                    {
                        depth, pointer: `${ pendingValue.pointer }/${ index }`, value: value [ index ]
                    }
                );
            }
            continue;
        }

        const prototype = Object.getPrototypeOf ( value );
        if ( prototype !== Object.prototype && prototype !== null )
        {

            // Return the result produced by the delegated operation.

            return boundaryDiagnostic (
                "invalid-json-value", "The document contains a non-JSON object.", pendingValue.pointer );
        }

        const entries = Object.entries ( value );
        for ( let index = entries.length - 1; index >= 0; index-- )
        {
            const [ key, childValue ] = entries [ index ];
            pendingValues.push
            (
                {
                    depth,
                    pointer: `${ pendingValue.pointer }/${ escapeJsonPointerSegment ( key ) }`,
                    value: childValue
                }
            );
        }
    }

    // Return no value for this code path.

    return undefined;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: validateModel
//
// Description:
//
//   Validates model and reports deterministic diagnostics for every detected contract violation.
//
// Arguments:
//
//   value (unknown):
//     The value used by this operation.
//
// Returns:
//
//   The deterministic diagnostics produced by validation.
//
//---------------------------------------------------------------------------------------------------------------------

export function validateModel ( value: unknown ): ModelValidationResult
{
    const invalidJsonTree = validateJsonTree ( value );
    if ( invalidJsonTree )
    {

        // Return the value produced by this code path.

        return (
            {
                diagnostics: [ invalidJsonTree ]
            }
        );
    }

    const structuralDiagnostics = validateStructure ( value );
    if ( structuralDiagnostics.length > 0 )
    {

        // Return the value produced by this code path.

        return (
            {
                diagnostics: structuralDiagnostics
            }
        );
    }

    const model       = value as StatelessECAModel;
    const diagnostics = validateSemantics ( model );

    // Return the value selected by the evaluated condition.

    return diagnostics.length > 0 ? (
        {
            diagnostics, recoverableModel: model
        }
    ) : (
        {
            diagnostics: [], model
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: describeModelValidationFailure
//
// Description:
//
//   Performs the describe model validation failure operation using the supplied inputs and current state.
//
// Arguments:
//
//   result (ModelValidationResult):
//     The result used by this operation.
//
// Returns:
//
//   The describe model validation failure result.
//
//---------------------------------------------------------------------------------------------------------------------

export function describeModelValidationFailure ( result: ModelValidationResult ): string
{
    const firstDiagnostic = result.diagnostics [ 0 ];
    if ( !firstDiagnostic )
    {

        // Return the value produced by this code path.

        return "The document is not a valid version 1.0 ECA model.";
    }
    const detail = "message" in firstDiagnostic ? firstDiagnostic.message : firstDiagnostic.code;
    const remaining = result.diagnostics.length - 1;

    // Return the value selected by the evaluated condition.

    return `${ detail } at ${ firstDiagnostic.pointer }${ remaining ? ` (${ remaining } more)` : "" }.`;
}
