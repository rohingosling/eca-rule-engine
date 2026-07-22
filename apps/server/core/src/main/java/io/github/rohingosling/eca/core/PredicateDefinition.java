//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable, validated configuration for one built-in predicate.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import java.util.Objects;

//*********************************************************************************************************************
// Class: PredicateDefinition
//
// Description:
//
//   Immutable, validated configuration for one built-in predicate.
//
//*********************************************************************************************************************

public final class PredicateDefinition
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final BuiltInPredicate predicate;
    private final String parameterName;
    private final Value comparisonValue;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: PredicateDefinition
    //
    // Description:
    //
    //   Creates a new PredicateDefinition instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   predicate (BuiltInPredicate):
    //     The predicate value supplied to this operation.
    //
    //   parameterName (String):
    //     The parameter name value supplied to this operation.
    //
    //   comparisonValue (Value):
    //     The comparison value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private PredicateDefinition ( BuiltInPredicate predicate, String parameterName, Value comparisonValue )
    {
        this.predicate       = Objects.requireNonNull ( predicate, "predicate" );
        this.parameterName   = parameterName;
        this.comparisonValue = comparisonValue;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: always
    //
    // Description:
    //
    //   Performs the always operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The always result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static PredicateDefinition always ()
    {

        // Return the newly constructed PredicateDefinition instance.

        return new PredicateDefinition ( BuiltInPredicate.ALWAYS, null, null );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: comparison
    //
    // Description:
    //
    //   Performs the comparison operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   predicate (BuiltInPredicate):
    //     The predicate used by this operation.
    //
    //   parameterName (String):
    //     The parameter name used by this operation.
    //
    //   comparisonValue (Value):
    //     The comparison value used by this operation.
    //
    // Returns:
    //
    //   A negative, zero, or positive value representing the deterministic ordering, or no value when operands cannot
    //   be ordered.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static PredicateDefinition comparison (
        BuiltInPredicate predicate, String parameterName, Value comparisonValue )
    {
        if ( predicate == BuiltInPredicate.ALWAYS )
        {
            throw new IllegalArgumentException ( "The always predicate does not accept comparison arguments." );
        }

        // Return the newly constructed PredicateDefinition instance.

        return new PredicateDefinition
        (
            predicate,
            Objects.requireNonNull ( parameterName, "parameterName" ),
            Objects.requireNonNull ( comparisonValue, "comparisonValue" )
        );
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getPredicate
    //
    // Description:
    //
    //   Returns predicate from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested predicate value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public BuiltInPredicate getPredicate ()
    {

        // Return the predicate.

        return this.predicate;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getParameterName
    //
    // Description:
    //
    //   Returns parameter name from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested parameter name value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String getParameterName ()
    {

        // Return the parameter name.

        return this.parameterName;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getComparisonValue
    //
    // Description:
    //
    //   Returns comparison value from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested comparison value value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Value getComparisonValue ()
    {

        // Return the comparison value.

        return this.comparisonValue;
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: evaluate
    //
    // Description:
    //
    //   Evaluates using the current event occurrence and rule data, without retaining prior-event state.
    //
    // Arguments:
    //
    //   payloadValue (Value):
    //     The payload value inspected while evaluating or validating the current event occurrence.
    //
    // Returns:
    //
    //   The evaluation result, selected action, condition trace, or predicate outcome produced for the current input.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public boolean evaluate ( Value payloadValue )
    {

        // Return the result produced by the delegated operation.

        return this.predicate.evaluate ( payloadValue, this.comparisonValue );
    }
}
