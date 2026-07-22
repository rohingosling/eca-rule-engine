//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable symbolic action selected, but never executed, by the evaluator.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

//*********************************************************************************************************************
// Class: Action
//
// Description:
//
//   Immutable symbolic action selected, but never executed, by the evaluator.
//
//*********************************************************************************************************************

public final class Action
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final String id;
    private final String name;
    private final String description;
    private final Map<String, Value> parameters;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/2: Action
    //
    // Description:
    //
    //   Creates a new Action instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   id (String):
    //     The stable ID used to locate the corresponding model element.
    //
    //   name (String):
    //     The name value supplied to this operation.
    //
    //   parameters (Map<String, Value>):
    //     The parameters collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Action ( String id, String name, Map<String, Value> parameters )
    {
        this ( id, name, null, parameters );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 2/2: Action
    //
    // Description:
    //
    //   Creates a new Action instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   id (String):
    //     The stable ID used to locate the corresponding model element.
    //
    //   name (String):
    //     The name value supplied to this operation.
    //
    //   description (String):
    //     The description value supplied to this operation.
    //
    //   parameters (Map<String, Value>):
    //     The parameters collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Action ( String id, String name, String description, Map<String, Value> parameters )
    {
        this.id          = Objects.requireNonNull ( id, "id" );
        this.name        = Objects.requireNonNull ( name, "name" );
        this.description = description;
        this.parameters  = Collections.unmodifiableMap ( new LinkedHashMap<> ( parameters ) );
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
    // Method: getDescription
    //
    // Description:
    //
    //   Returns description from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested description value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Optional<String> getDescription ()
    {

        // Return the result produced by the delegated operation.

        return Optional.ofNullable ( this.description );
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

    public Map<String, Value> getParameters ()
    {

        // Return the parameters.

        return this.parameters;
    }
}
