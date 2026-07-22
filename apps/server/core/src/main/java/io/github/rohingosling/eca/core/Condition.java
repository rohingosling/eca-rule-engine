//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable condition definition with declared payload dependencies and a fixed predicate.
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
// Class: Condition
//
// Description:
//
//   Immutable condition definition with declared payload dependencies and a fixed predicate.
//
//*********************************************************************************************************************

public final class Condition
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final String id;
    private final String name;
    private final List<String> dependencies;
    private final PredicateDefinition predicate;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: Condition
    //
    // Description:
    //
    //   Creates a new Condition instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   id (String):
    //     The stable ID used to locate the corresponding model element.
    //
    //   name (String):
    //     The name value supplied to this operation.
    //
    //   dependencies (List<String>):
    //     The dependencies collection inspected or transformed by this operation.
    //
    //   predicate (PredicateDefinition):
    //     The predicate value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Condition ( String id, String name, List<String> dependencies, PredicateDefinition predicate )
    {
        this.id           = Objects.requireNonNull ( id, "id" );
        this.name         = Objects.requireNonNull ( name, "name" );
        this.dependencies = Collections.unmodifiableList ( new ArrayList<> ( dependencies ) );
        this.predicate    = Objects.requireNonNull ( predicate, "predicate" );
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
    // Method: getDependencies
    //
    // Description:
    //
    //   Returns dependencies from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested dependencies value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public List<String> getDependencies ()
    {

        // Return the dependencies.

        return this.dependencies;
    }

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

    public PredicateDefinition getPredicate ()
    {

        // Return the predicate.

        return this.predicate;
    }
}
