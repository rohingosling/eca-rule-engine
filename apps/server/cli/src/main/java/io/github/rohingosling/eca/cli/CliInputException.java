//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Expected file, stream, encoding, or startup failure with an explicit contract exit code.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.cli;

//*********************************************************************************************************************
// Class: CliInputException
//
// Description:
//
//   Expected file, stream, encoding, or startup failure with an explicit contract exit code.
//
//*********************************************************************************************************************

final class CliInputException extends Exception
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final int exitCode;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: CliInputException
    //
    // Description:
    //
    //   Creates a new CliInputException instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   exitCode (int):
    //     The exit code value supplied to this operation.
    //
    //   message (String):
    //     The message value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    CliInputException ( int exitCode, String message )
    {
        super ( message );
        this.exitCode = exitCode;
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getExitCode
    //
    // Description:
    //
    //   Returns exit code from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested exit code value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    int getExitCode ()
    {

        // Return the exit code.

        return this.exitCode;
    }
}
