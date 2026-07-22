//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Stable model-validation diagnostic ordered by JSON Pointer and then code.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.model;

import io.github.rohingosling.eca.core.DiagnosticMessagePolicy;

import java.util.Objects;

//*********************************************************************************************************************
// Class: Diagnostic
//
// Description:
//
//   Stable model-validation diagnostic ordered by JSON Pointer and then code.
//
//*********************************************************************************************************************

public final class Diagnostic implements Comparable<Diagnostic>
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final String code;
    private final String message;
    private final String pointer;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: Diagnostic
    //
    // Description:
    //
    //   Creates a new Diagnostic instance from the supplied values and establishes its initial invariants.
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

    public Diagnostic ( String code, String message, String pointer )
    {
        this.code    = Objects.requireNonNull ( code, "code" );
        this.message = DiagnosticMessagePolicy.limit ( message );
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
    // Method: getMessage
    //
    // Description:
    //
    //   Returns message from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested message value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String getMessage ()
    {

        // Return the message.

        return this.message;
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

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: compareTo
    //
    // Description:
    //
    //   Compares to using the deterministic ordering required by serialized diagnostics and traces.
    //
    // Arguments:
    //
    //   otherDiagnostic (Diagnostic):
    //     The other diagnostic used by this operation.
    //
    // Returns:
    //
    //   A negative, zero, or positive value representing the deterministic ordering, or no value when operands cannot
    //   be ordered.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Override
    public int compareTo ( Diagnostic otherDiagnostic )
    {
        int pointerComparison = this.pointer.compareTo ( otherDiagnostic.pointer );

        // Return the value selected by the evaluated condition.

        return pointerComparison != 0 ? pointerComparison : this.code.compareTo ( otherDiagnostic.code );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: equals
    //
    // Description:
    //
    //   Determines whether equals holds for the supplied value or application state.
    //
    // Arguments:
    //
    //   otherObject (Object):
    //     The other object used by this operation.
    //
    // Returns:
    //
    //   True when the requested condition holds; otherwise false.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Override
    public boolean equals ( Object otherObject )
    {
        if ( this == otherObject )
        {

            // Return true for this code path.

            return true;
        }

        if ( !( otherObject instanceof Diagnostic ) )
        {

            // Return false for this code path.

            return false;
        }

        Diagnostic otherDiagnostic = ( Diagnostic ) otherObject;

        // Return the result produced by the delegated operation.

        return this.code.equals ( otherDiagnostic.code )
            && this.message.equals ( otherDiagnostic.message )
            && this.pointer.equals ( otherDiagnostic.pointer );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: hashCode
    //
    // Description:
    //
    //   Determines whether hash code holds for the supplied value or application state.
    //
    // Returns:
    //
    //   True when the requested condition holds; otherwise false.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Override
    public int hashCode ()
    {

        // Return the result produced by the delegated operation.

        return Objects.hash ( this.code, this.message, this.pointer );
    }

}
