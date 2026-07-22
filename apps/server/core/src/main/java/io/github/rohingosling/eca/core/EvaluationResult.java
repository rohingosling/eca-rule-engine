//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Optional selected symbolic action and optional evaluation trace.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import java.util.Objects;
import java.util.Optional;

//*********************************************************************************************************************
// Class: EvaluationResult
//
// Description:
//
//   Optional selected symbolic action and optional evaluation trace.
//
//*********************************************************************************************************************

public final class EvaluationResult
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final Action selectedAction;
    private final EvaluationTrace trace;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: EvaluationResult
    //
    // Description:
    //
    //   Creates a new EvaluationResult instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   selectedAction (Action):
    //     The selected action value supplied to this operation.
    //
    //   trace (EvaluationTrace):
    //     The trace value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public EvaluationResult ( Action selectedAction, EvaluationTrace trace )
    {
        this.selectedAction = selectedAction;
        this.trace          = trace;
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getSelectedAction
    //
    // Description:
    //
    //   Returns selected action from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested selected action value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Optional<Action> getSelectedAction ()
    {

        // Return the result produced by the delegated operation.

        return Optional.ofNullable ( this.selectedAction );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getSelectedActionId
    //
    // Description:
    //
    //   Returns selected action ID from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested selected action ID value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Optional<String> getSelectedActionId ()
    {

        // Return the result produced by the delegated operation.

        return this.getSelectedAction ().map ( Action::getId );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getTrace
    //
    // Description:
    //
    //   Returns trace from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested trace value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Optional<EvaluationTrace> getTrace ()
    {

        // Return the result produced by the delegated operation.

        return Optional.ofNullable ( this.trace );
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

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

        if ( !( otherObject instanceof EvaluationResult ) )
        {

            // Return false for this code path.

            return false;
        }

        EvaluationResult otherResult = ( EvaluationResult ) otherObject;

        // Return the result produced by the delegated operation.

        return this.getSelectedActionId ().equals ( otherResult.getSelectedActionId () )
            && Objects.equals ( this.trace, otherResult.trace );
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

        return Objects.hash ( this.getSelectedActionId (), this.trace );
    }
}
