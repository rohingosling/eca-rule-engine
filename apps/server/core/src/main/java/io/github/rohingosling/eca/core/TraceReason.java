//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Stable condition trace reason codes exposed by contract version 1.0.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

//---------------------------------------------------------------------------------------------------------------------
// Enum: TraceReason
//
// Description:
//
//   Stable condition trace reason codes exposed by contract version 1.0.
//
//---------------------------------------------------------------------------------------------------------------------

public enum TraceReason
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
    // Method: PREDICATE_TRUE
    //
    // Description:
    //
    //   Represents the predicate true enumeration constant and associates it with its stable contract value.
    //
    // Arguments:
    //
    //   ("predicate-true"):
    //     The ("predicate true"): used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    PREDICATE_TRUE ( "predicate-true" ),
    PREDICATE_FALSE ( "predicate-false" ),
    MISSING_DEPENDENCY ( "missing-dependency" );

    private final String contractName;

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: TraceReason
    //
    // Description:
    //
    //   Creates a new TraceReason instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   contractName (String):
    //     The contract name value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    TraceReason ( String contractName )
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
}
