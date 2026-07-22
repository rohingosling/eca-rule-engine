//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable reusable parameter declaration resolved into an event payload definition.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import java.util.Objects;

//*********************************************************************************************************************
// Class: ParameterDefinition
//
// Description:
//
//   Immutable reusable parameter declaration resolved into an event payload definition.
//
//*********************************************************************************************************************

public final class ParameterDefinition
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final String id;
    private final String name;
    private final ParameterType type;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/2: ParameterDefinition
    //
    // Description:
    //
    //   Creates a new ParameterDefinition instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   name (String):
    //     The name value supplied to this operation.
    //
    //   type (ParameterType):
    //     The type value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ParameterDefinition ( String name, ParameterType type )
    {
        this ( name, name, type );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 2/2: ParameterDefinition
    //
    // Description:
    //
    //   Creates a new ParameterDefinition instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   id (String):
    //     The stable ID used to locate the corresponding model element.
    //
    //   name (String):
    //     The name value supplied to this operation.
    //
    //   type (ParameterType):
    //     The type value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ParameterDefinition ( String id, String name, ParameterType type )
    {
        this.id   = Objects.requireNonNull ( id, "id" );
        this.name = Objects.requireNonNull ( name, "name" );
        this.type = Objects.requireNonNull ( type, "type" );
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getId
    //
    // Description:
    //
    //   Returns ID from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested ID value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String getId ()
    {

        // Return the id.

        return this.id;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getName
    //
    // Description:
    //
    //   Returns name from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested name value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String getName ()
    {

        // Return the name.

        return this.name;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getType
    //
    // Description:
    //
    //   Returns type from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested type value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ParameterType getType ()
    {

        // Return the type.

        return this.type;
    }
}
