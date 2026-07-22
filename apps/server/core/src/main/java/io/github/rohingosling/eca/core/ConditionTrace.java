//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable trace entry for one distinct condition evaluated during the current request.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

//*********************************************************************************************************************
// Class: ConditionTrace
//
// Description:
//
//   Immutable trace entry for one distinct condition evaluated during the current request.
//
//*********************************************************************************************************************

public final class ConditionTrace
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final String conditionId;
    private final boolean result;
    private final TraceReason reason;
    private final List<String> missingDependencies;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: ConditionTrace
    //
    // Description:
    //
    //   Creates a new ConditionTrace instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   conditionId (String):
    //     The stable condition ID used to locate the corresponding model element.
    //
    //   result (boolean):
    //     The result value supplied to this operation.
    //
    //   reason (TraceReason):
    //     The reason value supplied to this operation.
    //
    //   missingDependencies (List<String>):
    //     The missing dependencies collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ConditionTrace (
        String conditionId, boolean result, TraceReason reason, List<String> missingDependencies )
    {
        this.conditionId        = Objects.requireNonNull ( conditionId, "conditionId" );
        this.result             = result;
        this.reason             = Objects.requireNonNull ( reason, "reason" );
        this.missingDependencies = Collections.unmodifiableList ( new ArrayList<> ( missingDependencies ) );
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getConditionId
    //
    // Description:
    //
    //   Returns condition ID from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested condition ID value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String getConditionId ()
    {

        // Return the condition id.

        return this.conditionId;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getResult
    //
    // Description:
    //
    //   Returns result from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested result value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public boolean getResult ()
    {

        // Return the result.

        return this.result;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getReason
    //
    // Description:
    //
    //   Returns reason from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested reason value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public TraceReason getReason ()
    {

        // Return the reason.

        return this.reason;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getMissingDependencies
    //
    // Description:
    //
    //   Returns missing dependencies from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested missing dependencies value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public List<String> getMissingDependencies ()
    {

        // Return the missing dependencies.

        return this.missingDependencies;
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

        if ( !( otherObject instanceof ConditionTrace ) )
        {

            // Return false for this code path.

            return false;
        }

        ConditionTrace otherTrace = ( ConditionTrace ) otherObject;

        // Return the value produced by this code path.

        return this.result == otherTrace.result
            && this.conditionId.equals ( otherTrace.conditionId )
            && this.reason == otherTrace.reason
            && this.missingDependencies.equals ( otherTrace.missingDependencies );
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

        return Objects.hash ( this.conditionId, this.result, this.reason, this.missingDependencies );
    }
}
