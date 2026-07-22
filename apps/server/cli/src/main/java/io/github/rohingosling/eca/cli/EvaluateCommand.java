//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Compiles one model, validates one event occurrence, and emits the deterministic evaluation result.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.cli;

import io.github.rohingosling.eca.core.CompiledModel;
import io.github.rohingosling.eca.core.EvaluationInputException;
import io.github.rohingosling.eca.core.EvaluationResult;
import io.github.rohingosling.eca.core.EventOccurrence;
import io.github.rohingosling.eca.model.Diagnostic;
import io.github.rohingosling.eca.model.EventOccurrenceValidationResult;
import io.github.rohingosling.eca.model.ModelValidationResult;
import picocli.CommandLine;

import java.util.List;
import java.util.concurrent.Callable;

@CommandLine.Command (
    name = "evaluate",
    description = "Evaluate one event occurrence against one model.",
    mixinStandardHelpOptions = true
)

//*********************************************************************************************************************
// Class: EvaluateCommand
//
// Description:
//
//   Compiles one model, validates one event occurrence, and emits the deterministic evaluation result.
//
//*********************************************************************************************************************

final class EvaluateCommand implements Callable<Integer>
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final CliContext context;

    @CommandLine.Parameters ( index = "0", paramLabel = "<model-file>", description = "Model file or '-' for stdin." )
    private String modelSource;

    @CommandLine.Parameters ( index = "1", paramLabel = "<event-file>", description = "Event file or '-' for stdin." )
    private String eventSource;

    @CommandLine.Option ( names = "--trace", description = "Include the canonical evaluation trace." )
    private boolean includeTrace;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: EvaluateCommand
    //
    // Description:
    //
    //   Creates a new EvaluateCommand instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   context (CliContext):
    //     The context value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    EvaluateCommand ( CliContext context )
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
        if ( "-".equals ( this.modelSource ) && "-".equals ( this.eventSource ) )
        {
            this.context.getStandardError ().println ( "The model and event cannot both read from standard input." );

            // Return the syntax error.

            return CliExitCode.SYNTAX_ERROR;
        }

        String modelJson;
        String eventJson;

        try
        {
            modelJson = this.context.getDocumentReader ().read ( this.modelSource );
            eventJson = this.context.getDocumentReader ().read ( this.eventSource );
        }
        catch ( CliInputException exception )
        {
            this.context.getStandardError ().println ( exception.getMessage () );

            // Return the result produced by the delegated operation.

            return exception.getExitCode ();
        }

        ModelValidationResult modelResult = this.context.getModelCompiler ().compile ( modelJson );

        if ( !modelResult.isValid () )
        {
            this.context.printDiagnostics ( "The evaluation model is invalid.", modelResult.getDiagnostics () );

            // Return the value selected by the evaluated condition.

            return isJsonFailure ( modelResult.getDiagnostics () )
                ? CliExitCode.INVALID_JSON
                : CliExitCode.INVALID_EVALUATION;
        }

        EventOccurrenceValidationResult eventResult = this.context.getEventCompiler ().compile ( eventJson );

        if ( !eventResult.isValid () )
        {
            this.context.printDiagnostics ( "The event occurrence is invalid.", eventResult.getDiagnostics () );

            // Return the value selected by the evaluated condition.

            return isJsonFailure ( eventResult.getDiagnostics () )
                ? CliExitCode.INVALID_JSON
                : CliExitCode.INVALID_EVALUATION;
        }

        CompiledModel model = modelResult.getCompiledModel ().orElseThrow ();
        EventOccurrence eventOccurrence = eventResult.getEventOccurrence ().orElseThrow ();
        EvaluationResult evaluationResult;

        try
        {
            evaluationResult = this.context.getEvaluator ().evaluate ( model, eventOccurrence, this.includeTrace );
        }
        catch ( EvaluationInputException exception )
        {
            this.context.printDiagnostics
            (
                "The evaluation input does not identify a unique valid action outcome.",
                List.of ( new Diagnostic ( exception.getCode (), exception.getMessage (), exception.getPointer () ) )
            );

            // Return the invalid evaluation.

            return CliExitCode.INVALID_EVALUATION;
        }

        this.context.getJsonWriter ().writeEvaluationResult
        (
            model,
            eventOccurrence,
            evaluationResult,
            this.context.getStandardOutput ()
        );

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
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   True when the requested condition holds; otherwise false.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static boolean isJsonFailure ( List<Diagnostic> diagnostics )
    {

        // Return the result produced by the delegated operation.

        return diagnostics.stream ().anyMatch
        (
            diagnostic -> "invalid-json".equals ( diagnostic.getCode () )
                || diagnostic.getCode ().endsWith ( "byte-limit-exceeded" )
        );
    }
}
