//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable event-condition-action reference triple.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import java.util.Objects;

//*********************************************************************************************************************
// Class: Rule
//
// Description:
//
//   Immutable event-condition-action reference triple.
//
//*********************************************************************************************************************

public final class Rule
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final String id;
    private final String name;
    private final String eventId;
    private final String conditionId;
    private final String actionId;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: Rule
    //
    // Description:
    //
    //   Creates a new Rule instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   id (String):
    //     The stable ID used to locate the corresponding model element.
    //
    //   name (String):
    //     The name value supplied to this operation.
    //
    //   eventId (String):
    //     The stable event ID used to locate the corresponding model element.
    //
    //   conditionId (String):
    //     The stable condition ID used to locate the corresponding model element.
    //
    //   actionId (String):
    //     The stable action ID used to locate the corresponding model element.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Rule ( String id, String name, String eventId, String conditionId, String actionId )
    {
        this.id          = Objects.requireNonNull ( id, "id" );
        this.name        = Objects.requireNonNull ( name, "name" );
        this.eventId     = Objects.requireNonNull ( eventId, "eventId" );
        this.conditionId = Objects.requireNonNull ( conditionId, "conditionId" );
        this.actionId    = Objects.requireNonNull ( actionId, "actionId" );
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
    // Method: getEventId
    //
    // Description:
    //
    //   Returns event ID from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested event ID value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String getEventId ()
    {

        // Return the event id.

        return this.eventId;
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
}
