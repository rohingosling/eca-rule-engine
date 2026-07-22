//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Applies the contract-wide Unicode code-point bound to diagnostic messages.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import java.util.Objects;

//*********************************************************************************************************************
// Class: DiagnosticMessagePolicy
//
// Description:
//
//   Applies the contract-wide Unicode code-point bound to diagnostic messages.
//
//*********************************************************************************************************************

public final class DiagnosticMessagePolicy
{
    //=================================================================================================================
    // Constants
    //=================================================================================================================

    public static final int MAXIMUM_MESSAGE_CODE_POINTS = 4_096;

    private static final String TRUNCATION_MARKER = "\u2026";

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: DiagnosticMessagePolicy
    //
    // Description:
    //
    //   Creates a new DiagnosticMessagePolicy instance from the supplied values and establishes its initial
    //   invariants.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private DiagnosticMessagePolicy ()
    {
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: limit
    //
    // Description:
    //
    //   Restricts the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   message (String):
    //     The message used by this operation.
    //
    // Returns:
    //
    //   The limit result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static String limit ( String message )
    {
        Objects.requireNonNull ( message, "message" );
        int messageCodePointCount = message.codePointCount ( 0, message.length () );

        if ( messageCodePointCount <= MAXIMUM_MESSAGE_CODE_POINTS )
        {

            // Return the message.

            return message;
        }

        int retainedCodePointCount = MAXIMUM_MESSAGE_CODE_POINTS - TRUNCATION_MARKER.codePointCount
        (
            0,
            TRUNCATION_MARKER.length ()
        );
        int retainedCharacterCount = message.offsetByCodePoints ( 0, retainedCodePointCount );

        // Return the result produced by the delegated operation.

        return message.substring ( 0, retainedCharacterCount ) + TRUNCATION_MARKER;
    }
}
