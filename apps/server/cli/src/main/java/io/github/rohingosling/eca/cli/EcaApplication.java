//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Process entry point and Picocli execution boundary for the stateless ECA command-line application.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.cli;

import picocli.CommandLine;

import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;

//*********************************************************************************************************************
// Class: EcaApplication
//
// Description:
//
//   Process entry point and Picocli execution boundary for the stateless ECA command-line application.
//
//*********************************************************************************************************************

public final class EcaApplication
{
    static
    {
        System.setProperty ( "java.util.logging.manager", "org.jboss.logmanager.LogManager" );
    }

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: EcaApplication
    //
    // Description:
    //
    //   Creates a new EcaApplication instance from the supplied values and establishes its initial invariants.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private EcaApplication ()
    {
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: main
    //
    // Description:
    //
    //   Performs the main operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   arguments (String[]):
    //     The arguments collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static void main ( String[] arguments )
    {
        PrintWriter standardOutput = new PrintWriter
        (
            new OutputStreamWriter ( System.out, StandardCharsets.UTF_8 ),
            true
        );
        PrintWriter standardError = new PrintWriter
        (
            new OutputStreamWriter ( System.err, StandardCharsets.UTF_8 ),
            true
        );
        int exitCode = execute
        (
            arguments,
            System.in,
            standardOutput,
            standardError,
            new QuarkusServiceStarter ()
        );
        System.exit ( exitCode );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: execute
    //
    // Description:
    //
    //   Executes the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   arguments (String[]):
    //     The arguments collection inspected or transformed by this operation.
    //
    //   standardInput (InputStream):
    //     The standard input used by this operation.
    //
    //   standardOutput (PrintWriter):
    //     The standard output used by this operation.
    //
    //   standardError (PrintWriter):
    //     The standard error used by this operation.
    //
    //   serviceStarter (CliServiceStarter):
    //     The service starter used by this operation.
    //
    // Returns:
    //
    //   The execute result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    static int execute (
        String[] arguments, InputStream standardInput, PrintWriter standardOutput, PrintWriter standardError,
        CliServiceStarter serviceStarter )
    {
        CliContext context = new CliContext ( standardInput, standardOutput, standardError, serviceStarter );
        CommandLine commandLine = new CommandLine ( new EcaCommand () );
        commandLine.addSubcommand ( "validate", new ValidateCommand ( context ) );
        commandLine.addSubcommand ( "evaluate", new EvaluateCommand ( context ) );
        commandLine.addSubcommand ( "start", new StartCommand ( context ) );
        commandLine.setOut ( standardOutput );
        commandLine.setErr ( standardError );
        commandLine.setParameterExceptionHandler
        (
            ( exception, commandLineArguments ) ->
            {
                standardError.println ( exception.getMessage () );
                exception.getCommandLine ().usage ( standardError );

                // Return the syntax error.

                return CliExitCode.SYNTAX_ERROR;
            }
        );
        commandLine.setExecutionExceptionHandler
        (
            ( exception, activeCommandLine, parseResult ) ->
            {
                standardError.println ( "The command failed because of an unexpected internal error." );

                // Return the internal failure.

                return CliExitCode.INTERNAL_FAILURE;
            }
        );

        if ( arguments.length == 0 )
        {
            commandLine.usage ( standardOutput );

            // Return the syntax error.

            return CliExitCode.SYNTAX_ERROR;
        }

        // Return the result produced by the delegated operation.

        return commandLine.execute ( arguments );
    }
}
