//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Validates one model document and emits a contract-version 1 validation result.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.cli;

import io.github.rohingosling.eca.model.ModelValidationResult;
import picocli.CommandLine;

import java.util.concurrent.Callable;

@CommandLine.Command (
    name = "validate",
    description = "Validate one model JSON document.",
    mixinStandardHelpOptions = true
)

//*********************************************************************************************************************
// Class: ValidateCommand
//
// Description:
//
//   Validates one model document and emits a contract-version 1 validation result.
//
//*********************************************************************************************************************

final class ValidateCommand implements Callable<Integer>
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final CliContext context;

    @CommandLine.Parameters ( index = "0", paramLabel = "<model-file>", description = "Model file or '-' for stdin." )
    private String modelSource;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: ValidateCommand
    //
    // Description:
    //
    //   Creates a new ValidateCommand instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   context (CliContext):
    //     The context value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    ValidateCommand ( CliContext context )
    {
        this.context = context;
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: call
    //
    // Description:
    //
    //   Performs the call operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The call result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Override
    public Integer call () throws Exception
    {
        String modelJson;

        try
        {
            modelJson = this.context.getDocumentReader ().read ( this.modelSource );
        }
        catch ( CliInputException exception )
        {
            this.context.getStandardError ().println ( exception.getMessage () );

            // Return the result produced by the delegated operation.

            return exception.getExitCode ();
        }

        ModelValidationResult result = this.context.getModelCompiler ().compile ( modelJson );

        if ( isJsonFailure ( result ) )
        {
            this.context.printDiagnostics ( "The model JSON could not be parsed.", result.getDiagnostics () );

            // Return the invalid json.

            return CliExitCode.INVALID_JSON;
        }

        this.context.getJsonWriter ().writeValidationResult ( result, this.context.getStandardOutput () );

        // Return the success.

        return CliExitCode.SUCCESS;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: isJsonFailure
    //
    // Description:
    //
    //   Determines whether is JSON failure holds for the supplied value or application state.
    //
    // Arguments:
    //
    //   result (ModelValidationResult):
    //     The result used by this operation.
    //
    // Returns:
    //
    //   True when the requested condition holds; otherwise false.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static boolean isJsonFailure ( ModelValidationResult result )
    {

        // Return the result produced by the delegated operation.

        return result.getDiagnostics ().stream ().anyMatch
        (
            diagnostic -> "invalid-json".equals ( diagnostic.getCode () )
                || "model-byte-limit-exceeded".equals ( diagnostic.getCode () )
        );
    }
}
