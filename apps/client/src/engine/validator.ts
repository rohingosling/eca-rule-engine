//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Implements validator behavior for browser-local model validation, evaluation, diagnostics, or worker coordination.
//
//---------------------------------------------------------------------------------------------------------------------

import type { ErrorObject, ValidateFunction } from "ajv";
import generatedValidator from "../contracts/model.validator.generated";

//---------------------------------------------------------------------------------------------------------------------
// Interface: StructuralDiagnostic
//
// Description:
//
//   Defines the named fields and callable operations that make up structural diagnostic.
//
//---------------------------------------------------------------------------------------------------------------------
export interface StructuralDiagnostic
{
    code: "structural-validation-error";
    message: string;
    pointer: string;
}

const validator = generatedValidator as ValidateFunction;

//---------------------------------------------------------------------------------------------------------------------
// Function: toDiagnostic
//
// Description:
//
//   Performs the to diagnostic operation using the supplied inputs and current state.
//
// Arguments:
//
//   error (ErrorObject):
//     The error used by this operation.
//
// Returns:
//
//   The to diagnostic result.
//
//---------------------------------------------------------------------------------------------------------------------

function toDiagnostic ( error: ErrorObject ): StructuralDiagnostic
{

    // Return the value selected by the evaluated condition.

    return (
        {
            code: "structural-validation-error",
            message: error.message ?? "The model does not match the contract schema.",
            pointer: error.instancePath || "/"
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: validateStructure
//
// Description:
//
//   Validates structure and reports deterministic diagnostics for every detected contract violation.
//
// Arguments:
//
//   model (unknown):
//     The compiled or contract model inspected by this operation.
//
// Returns:
//
//   The deterministic diagnostics produced by validation.
//
//---------------------------------------------------------------------------------------------------------------------

export function validateStructure ( model: unknown ): StructuralDiagnostic[]
{

    // Return the value selected by the evaluated condition.

    return validator ( model ) ? [] : ( validator.errors ?? [] ).map ( toDiagnostic );
}
