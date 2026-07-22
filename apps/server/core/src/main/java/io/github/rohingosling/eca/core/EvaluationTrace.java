//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable canonical trace for the current evaluation only.
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
// Class: EvaluationTrace
//
// Description:
//
//   Immutable canonical trace for the current evaluation only.
//
//*********************************************************************************************************************

public final class EvaluationTrace
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final List<ConditionTrace> conditions;
    private final List<RuleTrace> rules;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: EvaluationTrace
    //
    // Description:
    //
    //   Creates a new EvaluationTrace instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   conditions (List<ConditionTrace>):
    //     The conditions collection inspected or transformed by this operation.
    //
    //   rules (List<RuleTrace>):
    //     The rules collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public EvaluationTrace ( List<ConditionTrace> conditions, List<RuleTrace> rules )
    {
        this.conditions = Collections.unmodifiableList ( new ArrayList<> ( conditions ) );
        this.rules      = Collections.unmodifiableList ( new ArrayList<> ( rules ) );
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getConditions
    //
    // Description:
    //
    //   Returns conditions from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested conditions value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public List<ConditionTrace> getConditions ()
    {

        // Return the conditions.

        return this.conditions;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getRules
    //
    // Description:
    //
    //   Returns rules from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested rules value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public List<RuleTrace> getRules ()
    {

        // Return the rules.

        return this.rules;
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

        if ( !( otherObject instanceof EvaluationTrace ) )
        {

            // Return false for this code path.

            return false;
        }

        EvaluationTrace otherTrace = ( EvaluationTrace ) otherObject;

        // Return the result produced by the delegated operation.

        return this.conditions.equals ( otherTrace.conditions ) && this.rules.equals ( otherTrace.rules );
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

        return Objects.hash ( this.conditions, this.rules );
    }
}
