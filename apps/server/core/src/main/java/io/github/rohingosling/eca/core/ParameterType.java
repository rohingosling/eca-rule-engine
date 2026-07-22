//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Contract parameter types and their compatibility rules for event-occurrence values.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

//---------------------------------------------------------------------------------------------------------------------
// Enum: ParameterType
//
// Description:
//
//   Contract parameter types and their compatibility rules for event-occurrence values.
//
//---------------------------------------------------------------------------------------------------------------------

public enum ParameterType
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
    // Method: NULL
    //
    // Description:
    //
    //   Represents the null enumeration constant and associates it with its stable contract value.
    //
    // Arguments:
    //
    //   ("null"):
    //     The ("null"): used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    NULL ( "null" ),
    BOOLEAN ( "boolean" ),
    NUMBER ( "number" ),
    INTEGER ( "integer" ),
    STRING ( "string" ),
    ARRAY ( "array" ),
    OBJECT ( "object" );

    private final String contractName;

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: ParameterType
    //
    // Description:
    //
    //   Creates a new ParameterType instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   contractName (String):
    //     The contract name value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    ParameterType ( String contractName )
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
    // Method: accepts
    //
    // Description:
    //
    //   Determines whether accepts holds for the supplied value or application state.
    //
    // Arguments:
    //
    //   value (Value):
    //     The value used by this operation.
    //
    // Returns:
    //
    //   True when the requested condition holds; otherwise false.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public boolean accepts ( Value value )
    {
        switch ( this )
        {
            case NULL:

                // Return the result produced by the delegated operation.

                return value.getType () == Value.Type.NULL;
            case BOOLEAN:

                // Return the result produced by the delegated operation.

                return value.getType () == Value.Type.BOOLEAN;
            case NUMBER:

                // Return the result produced by the delegated operation.

                return value.getType () == Value.Type.NUMBER;
            case INTEGER:

                // Return the result produced by the delegated operation.

                return value.getType () == Value.Type.NUMBER
                    && value.asNumber ().stripTrailingZeros ().scale () <= 0;
            case STRING:

                // Return the result produced by the delegated operation.

                return value.getType () == Value.Type.STRING;
            case ARRAY:

                // Return the result produced by the delegated operation.

                return value.getType () == Value.Type.ARRAY;
            case OBJECT:

                // Return the result produced by the delegated operation.

                return value.getType () == Value.Type.OBJECT;
            default:
                throw new IllegalStateException ( "Unsupported parameter type '" + this + "'." );
        }
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

    public static ParameterType fromContractName ( String contractName )
    {
        for ( ParameterType parameterType : values () )
        {
            if ( parameterType.contractName.equals ( contractName ) )
            {

                // Return the parameter type.

                return parameterType;
            }
        }

        throw new IllegalArgumentException ( "Unknown parameter type '" + contractName + "'." );
    }
}
