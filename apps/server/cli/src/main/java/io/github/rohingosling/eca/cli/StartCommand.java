//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Validates optional startup-model configuration and delegates process startup to the HTTP service adapter.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.cli;

import io.github.rohingosling.eca.model.ModelValidationResult;
import picocli.CommandLine;

import java.util.Optional;
import java.util.concurrent.Callable;

@CommandLine.Command (
    name = "start",
    description = "Start the HTTP service with an optional immutable model.",
    mixinStandardHelpOptions = true
)

//*********************************************************************************************************************
// Class: StartCommand
//
// Description:
//
//   Validates optional startup-model configuration and delegates process startup to the HTTP service adapter.
//
//*********************************************************************************************************************

final class StartCommand implements Callable<Integer>
{
    //=================================================================================================================
    // Constants
    //=================================================================================================================

    private static final String MODEL_PATH_ENVIRONMENT_VARIABLE = "ECA_MODEL_PATH";

    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final CliContext context;

    @CommandLine.Parameters (
        index = "0",
        arity = "0..1",
        paramLabel = "<model-file>",
        description = "Optional startup model file or '-' for stdin."
    )
    private String modelSource;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: StartCommand
    //
    // Description:
    //
    //   Creates a new StartCommand instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   context (CliContext):
    //     The context value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    StartCommand ( CliContext context )
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
    public Integer call ()
    {
        Optional<String> modelJson = Optional.empty ();
        String effectiveModelSource = this.modelSource;

        if ( effectiveModelSource == null )
        {
            String configuredModelPath = System.getenv ( MODEL_PATH_ENVIRONMENT_VARIABLE );

            if ( configuredModelPath != null && !configuredModelPath.isBlank () )
            {
                effectiveModelSource = configuredModelPath.trim ();
            }
        }

        if ( effectiveModelSource != null )
        {
            String configuredModelJson;

            try
            {
                configuredModelJson = this.context.getDocumentReader ().read ( effectiveModelSource );
            }
            catch ( CliInputException exception )
            {
                this.context.getStandardError ().println ( exception.getMessage () );

                // Return the configuration error.

                return CliExitCode.CONFIGURATION_ERROR;
            }

            ModelValidationResult modelResult = this.context.getModelCompiler ().compile ( configuredModelJson );

            if ( !modelResult.isValid () )
            {
                this.context.printDiagnostics ( "The startup model is invalid.", modelResult.getDiagnostics () );

                // Return the configuration error.

                return CliExitCode.CONFIGURATION_ERROR;
            }

            modelJson = Optional.of ( configuredModelJson );
        }

        try
        {

            // Return the result produced by the delegated operation.

            return this.context.getServiceStarter ().start ( modelJson );
        }
        catch ( CliInputException exception )
        {
            this.context.getStandardError ().println ( exception.getMessage () );

            // Return the result produced by the delegated operation.

            return exception.getExitCode ();
        }
    }
}
