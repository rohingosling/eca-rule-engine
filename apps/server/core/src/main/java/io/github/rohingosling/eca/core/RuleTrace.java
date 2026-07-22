//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable trace entry for one rule matching the current event type.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import java.util.Objects;

//*********************************************************************************************************************
// Class: RuleTrace
//
// Description:
//
//   Immutable trace entry for one rule matching the current event type.
//
//*********************************************************************************************************************

public final class RuleTrace
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final String ruleId;
    private final String conditionId;
    private final boolean conditionResult;
    private final String actionId;
    private final boolean matched;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: RuleTrace
    //
    // Description:
    //
    //   Creates a new RuleTrace instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   ruleId (String):
    //     The stable rule ID used to locate the corresponding model element.
    //
    //   conditionId (String):
    //     The stable condition ID used to locate the corresponding model element.
    //
    //   conditionResult (boolean):
    //     The condition result value supplied to this operation.
    //
    //   actionId (String):
    //     The stable action ID used to locate the corresponding model element.
    //
    //   matched (boolean):
    //     The matched value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public RuleTrace (
        String ruleId, String conditionId, boolean conditionResult, String actionId, boolean matched )
    {
        this.ruleId          = Objects.requireNonNull ( ruleId, "ruleId" );
        this.conditionId     = Objects.requireNonNull ( conditionId, "conditionId" );
        this.conditionResult = conditionResult;
        this.actionId        = Objects.requireNonNull ( actionId, "actionId" );
        this.matched         = matched;
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getRuleId
    //
    // Description:
    //
    //   Returns rule ID from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested rule ID value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String getRuleId ()
    {

        // Return the rule id.

        return this.ruleId;
    }

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
    // Method: getConditionResult
    //
    // Description:
    //
    //   Returns condition result from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested condition result value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public boolean getConditionResult ()
    {

        // Return the condition result.

        return this.conditionResult;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getActionId
    //
    // Description:
    //
    //   Returns action ID from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested action ID value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String getActionId ()
    {

        // Return the action id.

        return this.actionId;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getMatched
    //
    // Description:
    //
    //   Returns matched from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested matched value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public boolean getMatched ()
    {

        // Return the matched.

        return this.matched;
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

        if ( !( otherObject instanceof RuleTrace ) )
        {

            // Return false for this code path.

            return false;
        }

        RuleTrace otherTrace = ( RuleTrace ) otherObject;

        // Return the value produced by this code path.

        return this.conditionResult == otherTrace.conditionResult
            && this.matched == otherTrace.matched
            && this.ruleId.equals ( otherTrace.ruleId )
            && this.conditionId.equals ( otherTrace.conditionId )
            && this.actionId.equals ( otherTrace.actionId );
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

        return Objects.hash
        (
            this.ruleId, this.conditionId, this.conditionResult, this.actionId, this.matched
        );
    }
}
