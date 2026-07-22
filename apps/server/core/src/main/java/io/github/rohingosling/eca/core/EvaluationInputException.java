//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Typed domain failure raised when an evaluation input is incompatible or produces an ambiguous action outcome.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import java.util.Objects;

//*********************************************************************************************************************
// Class: EvaluationInputException
//
// Description:
//
//   Typed domain failure raised when an evaluation input is incompatible or produces an ambiguous action outcome.
//
//*********************************************************************************************************************

public final class EvaluationInputException extends RuntimeException
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final String code;
    private final String pointer;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: EvaluationInputException
    //
    // Description:
    //
    //   Creates a new EvaluationInputException instance from the supplied values and establishes its initial
    //   invariants.
    //
    // Arguments:
    //
    //   code (String):
    //     The code value supplied to this operation.
    //
    //   message (String):
    //     The message value supplied to this operation.
    //
    //   pointer (String):
    //     The pointer value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public EvaluationInputException ( String code, String message, String pointer )
    {
        super ( DiagnosticMessagePolicy.limit ( message ) );
        this.code    = Objects.requireNonNull ( code, "code" );
        this.pointer = Objects.requireNonNull ( pointer, "pointer" );
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getCode
    //
    // Description:
    //
    //   Returns code from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested code value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String getCode ()
    {

        // Return the code.

        return this.code;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getPointer
    //
    // Description:
    //
    //   Returns pointer from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested pointer value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String getPointer ()
    {

        // Return the pointer.

        return this.pointer;
    }
}
