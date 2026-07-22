//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable event-type definition and payload parameter index.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

//*********************************************************************************************************************
// Class: EventType
//
// Description:
//
//   Immutable event-type definition and payload parameter index.
//
//*********************************************************************************************************************

public final class EventType
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final String id;
    private final String name;
    private final Map<String, ParameterDefinition> parameters;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: EventType
    //
    // Description:
    //
    //   Creates a new EventType instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   id (String):
    //     The stable ID used to locate the corresponding model element.
    //
    //   name (String):
    //     The name value supplied to this operation.
    //
    //   parameters (List<ParameterDefinition>):
    //     The parameters collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public EventType ( String id, String name, List<ParameterDefinition> parameters )
    {
        this.id   = Objects.requireNonNull ( id, "id" );
        this.name = Objects.requireNonNull ( name, "name" );

        Map<String, ParameterDefinition> parametersByIdentifier = new LinkedHashMap<> ();

        for ( ParameterDefinition parameter : parameters )
        {
            parametersByIdentifier.put ( parameter.getId (), parameter );
        }

        this.parameters = Collections.unmodifiableMap ( parametersByIdentifier );
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
    // Method: getParameters
    //
    // Description:
    //
    //   Returns parameters from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested parameters value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Map<String, ParameterDefinition> getParameters ()
    {

        // Return the parameters.

        return this.parameters;
    }
}
