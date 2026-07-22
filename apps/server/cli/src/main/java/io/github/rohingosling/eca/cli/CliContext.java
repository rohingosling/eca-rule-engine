//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Shared command-line dependencies and process streams used by thin adapter commands.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.cli;

import io.github.rohingosling.eca.core.Evaluator;
import io.github.rohingosling.eca.model.Diagnostic;
import io.github.rohingosling.eca.model.EventOccurrenceCompiler;
import io.github.rohingosling.eca.model.ModelCompiler;
import io.github.rohingosling.eca.model.ModelLimits;

import java.io.InputStream;
import java.io.PrintWriter;
import java.util.List;
import java.util.Objects;

//*********************************************************************************************************************
// Class: CliContext
//
// Description:
//
//   Shared command-line dependencies and process streams used by thin adapter commands.
//
//*********************************************************************************************************************

final class CliContext
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final PrintWriter standardOutput;
    private final PrintWriter standardError;
    private final CliDocumentReader documentReader;
    private final ModelCompiler modelCompiler;
    private final EventOccurrenceCompiler eventCompiler;
    private final Evaluator evaluator;
    private final CliJsonWriter jsonWriter;
    private final CliServiceStarter serviceStarter;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: CliContext
    //
    // Description:
    //
    //   Creates a new CliContext instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   standardInput (InputStream):
    //     The standard input value supplied to this operation.
    //
    //   standardOutput (PrintWriter):
    //     The standard output value supplied to this operation.
    //
    //   standardError (PrintWriter):
    //     The standard error value supplied to this operation.
    //
    //   serviceStarter (CliServiceStarter):
    //     The service starter value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    CliContext (
        InputStream standardInput, PrintWriter standardOutput, PrintWriter standardError,
        CliServiceStarter serviceStarter )
    {
        this.standardOutput  = Objects.requireNonNull ( standardOutput, "standardOutput" );
        this.standardError   = Objects.requireNonNull ( standardError, "standardError" );
        this.documentReader  = new CliDocumentReader
        (
            standardInput,
            ModelLimits.DEFAULT_MAXIMUM_REQUEST_BYTES
        );
        this.modelCompiler   = new ModelCompiler ();
        this.eventCompiler   = new EventOccurrenceCompiler ();
        this.evaluator       = new Evaluator ();
        this.jsonWriter      = new CliJsonWriter ();
        this.serviceStarter  = Objects.requireNonNull ( serviceStarter, "serviceStarter" );
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getStandardOutput
    //
    // Description:
    //
    //   Returns standard output from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested standard output value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    PrintWriter getStandardOutput ()
    {

        // Return the standard output.

        return this.standardOutput;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getStandardError
    //
    // Description:
    //
    //   Returns standard error from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested standard error value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    PrintWriter getStandardError ()
    {

        // Return the standard error.

        return this.standardError;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getDocumentReader
    //
    // Description:
    //
    //   Returns document reader from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested document reader value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    CliDocumentReader getDocumentReader ()
    {

        // Return the document reader.

        return this.documentReader;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getModelCompiler
    //
    // Description:
    //
    //   Returns model compiler from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested model compiler value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    ModelCompiler getModelCompiler ()
    {

        // Return the model compiler.

        return this.modelCompiler;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getEventCompiler
    //
    // Description:
    //
    //   Returns event compiler from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested event compiler value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    EventOccurrenceCompiler getEventCompiler ()
    {

        // Return the event compiler.

        return this.eventCompiler;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getEvaluator
    //
    // Description:
    //
    //   Returns evaluator from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested evaluator value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    Evaluator getEvaluator ()
    {

        // Return the evaluator.

        return this.evaluator;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getJsonWriter
    //
    // Description:
    //
    //   Returns JSON writer from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested JSON writer value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    CliJsonWriter getJsonWriter ()
    {

        // Return the json writer.

        return this.jsonWriter;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getServiceStarter
    //
    // Description:
    //
    //   Returns service starter from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested service starter value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    CliServiceStarter getServiceStarter ()
    {

        // Return the service starter.

        return this.serviceStarter;
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: printDiagnostics
    //
    // Description:
    //
    //   Performs the print diagnostics operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   heading (String):
    //     The heading used by this operation.
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    void printDiagnostics ( String heading, List<Diagnostic> diagnostics )
    {
        this.standardError.println ( heading );

        for ( Diagnostic diagnostic : diagnostics )
        {
            String pointer = diagnostic.getPointer ().isEmpty () ? "" : " at " + diagnostic.getPointer ();
            this.standardError.println
            (
                "  " + diagnostic.getCode () + pointer + ": " + diagnostic.getMessage ()
            );
        }

        this.standardError.flush ();
    }
}
