//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Fixed, pure predicate registry for contract version 1.0.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

//---------------------------------------------------------------------------------------------------------------------
// Enum: BuiltInPredicate
//
// Description:
//
//   Fixed, pure predicate registry for contract version 1.0.
//
//---------------------------------------------------------------------------------------------------------------------

public enum BuiltInPredicate
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: ALWAYS
    //
    // Description:
    //
    //   Represents the always enumeration constant and associates it with its stable contract value.
    //
    // Arguments:
    //
    //   ("always"):
    //     The ("always"): used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    ALWAYS ( "always" ),
    EQUALS ( "equals" ),
    NOT_EQUALS ( "notEquals" ),
    GREATER_THAN ( "greaterThan" ),
    GREATER_THAN_OR_EQUAL ( "greaterThanOrEqual" ),
    LESS_THAN ( "lessThan" ),
    LESS_THAN_OR_EQUAL ( "lessThanOrEqual" ),
    CONTAINS ( "contains" );

    private final String contractName;

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: BuiltInPredicate
    //
    // Description:
    //
    //   Creates a new BuiltInPredicate instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   contractName (String):
    //     The contract name value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    BuiltInPredicate ( String contractName )
    {
        this.contractName = contractName;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getContractName
    //
    // Description:
    //
    //   Returns contract name from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested contract name value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String getContractName ()
    {

        // Return the contract name.

        return this.contractName;
    }

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
    //   comparisonValue (Value):
    //     The comparison value used by this operation.
    //
    // Returns:
    //
    //   The evaluation result, selected action, condition trace, or predicate outcome produced for the current input.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public boolean evaluate ( Value payloadValue, Value comparisonValue )
    {
        if ( this == ALWAYS )
        {

            // Return true for this code path.

            return true;
        }

        if ( this == EQUALS )
        {

            // Return the result produced by the delegated operation.

            return payloadValue.equals ( comparisonValue );
        }

        if ( this == NOT_EQUALS )
        {

            // Return the value produced by this code path.

            return !payloadValue.equals ( comparisonValue );
        }

        if ( this == CONTAINS )
        {

            // Return the result produced by the delegated operation.

            return this.evaluateContains ( payloadValue, comparisonValue );
        }

        Integer comparisonResult = compareValues ( payloadValue, comparisonValue );

        if ( comparisonResult == null )
        {

            // Return false for this code path.

            return false;
        }

        switch ( this )
        {
            case GREATER_THAN:

                // Return the value produced by this code path.

                return comparisonResult > 0;
            case GREATER_THAN_OR_EQUAL:

                // Return the value produced by this code path.

                return comparisonResult >= 0;
            case LESS_THAN:

                // Return the value produced by this code path.

                return comparisonResult < 0;
            case LESS_THAN_OR_EQUAL:

                // Return the value produced by this code path.

                return comparisonResult <= 0;
            default:
                throw new IllegalStateException ( "Unsupported predicate '" + this.contractName + "'." );
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: evaluateContains
    //
    // Description:
    //
    //   Evaluates contains using the current event occurrence and rule data, without retaining prior-event state.
    //
    // Arguments:
    //
    //   payloadValue (Value):
    //     The payload value inspected while evaluating or validating the current event occurrence.
    //
    //   comparisonValue (Value):
    //     The comparison value used by this operation.
    //
    // Returns:
    //
    //   The evaluation result, selected action, condition trace, or predicate outcome produced for the current input.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private boolean evaluateContains ( Value payloadValue, Value comparisonValue )
    {
        if ( payloadValue.getType () == Value.Type.STRING && comparisonValue.getType () == Value.Type.STRING )
        {

            // Return the result produced by the delegated operation.

            return payloadValue.asString ().contains ( comparisonValue.asString () );
        }

        if ( payloadValue.getType () == Value.Type.ARRAY )
        {

            // Return the result produced by the delegated operation.

            return payloadValue.asArray ().contains ( comparisonValue );
        }

        // Return false for this code path.

        return false;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: compareValues
    //
    // Description:
    //
    //   Compares values using the deterministic ordering required by serialized diagnostics and traces.
    //
    // Arguments:
    //
    //   payloadValue (Value):
    //     The payload value inspected while evaluating or validating the current event occurrence.
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

    private static Integer compareValues ( Value payloadValue, Value comparisonValue )
    {
        if ( payloadValue.getType () == Value.Type.NUMBER && comparisonValue.getType () == Value.Type.NUMBER )
        {

            // Return the result produced by the delegated operation.

            return payloadValue.asNumber ().compareTo ( comparisonValue.asNumber () );
        }

        if ( payloadValue.getType () == Value.Type.STRING && comparisonValue.getType () == Value.Type.STRING )
        {

            // Return the result produced by the delegated operation.

            return compareUnicodeCodePoints ( payloadValue.asString (), comparisonValue.asString () );
        }

        // Return no value for this code path.

        return null;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: compareUnicodeCodePoints
    //
    // Description:
    //
    //   Compares unicode code points using the deterministic ordering required by serialized diagnostics and traces.
    //
    // Arguments:
    //
    //   firstValue (String):
    //     The first value used by this operation.
    //
    //   secondValue (String):
    //     The second value used by this operation.
    //
    // Returns:
    //
    //   A negative, zero, or positive value representing the deterministic ordering, or no value when operands cannot
    //   be ordered.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static int compareUnicodeCodePoints ( String firstValue, String secondValue )
    {
        int firstOffset  = 0;
        int secondOffset = 0;

        while ( firstOffset < firstValue.length () && secondOffset < secondValue.length () )
        {
            int firstCodePoint  = firstValue.codePointAt ( firstOffset );
            int secondCodePoint = secondValue.codePointAt ( secondOffset );

            if ( firstCodePoint != secondCodePoint )
            {

                // Return the result produced by the delegated operation.

                return Integer.compare ( firstCodePoint, secondCodePoint );
            }

            firstOffset  += Character.charCount ( firstCodePoint );
            secondOffset += Character.charCount ( secondCodePoint );
        }

        // Return the result produced by the delegated operation.

        return Integer.compare
        (
            firstValue.codePointCount ( 0, firstValue.length () ),
            secondValue.codePointCount ( 0, secondValue.length () )
        );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: fromContractName
    //
    // Description:
    //
    //   Performs the from contract name operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   contractName (String):
    //     The contract name used by this operation.
    //
    // Returns:
    //
    //   The from contract name result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static BuiltInPredicate fromContractName ( String contractName )
    {
        for ( BuiltInPredicate predicate : values () )
        {
            if ( predicate.contractName.equals ( contractName ) )
            {

                // Return the predicate.

                return predicate;
            }
        }

        throw new IllegalArgumentException ( "Unknown predicate '" + contractName + "'." );
    }
}
