//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable model indexes consumed by concurrent evaluations.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

//*********************************************************************************************************************
// Class: CompiledModel
//
// Description:
//
//   Immutable model indexes consumed by concurrent evaluations.
//
//*********************************************************************************************************************

public final class CompiledModel
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final String schemaVersion;
    private final String id;
    private final Map<String, EventType> events;
    private final Map<String, Condition> conditions;
    private final Map<String, Action> actions;
    private final Map<String, List<Rule>> rulesByEvent;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: CompiledModel
    //
    // Description:
    //
    //   Creates a new CompiledModel instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   schemaVersion (String):
    //     The schema version value supplied to this operation.
    //
    //   id (String):
    //     The stable ID used to locate the corresponding model element.
    //
    //   events (List<EventType>):
    //     The events collection inspected or transformed by this operation.
    //
    //   conditions (List<Condition>):
    //     The conditions collection inspected or transformed by this operation.
    //
    //   actions (List<Action>):
    //     The actions collection inspected or transformed by this operation.
    //
    //   rules (List<Rule>):
    //     The rules collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public CompiledModel (
        String schemaVersion, String id, List<EventType> events, List<Condition> conditions,
        List<Action> actions, List<Rule> rules )
    {
        this.schemaVersion = Objects.requireNonNull ( schemaVersion, "schemaVersion" );
        this.id            = Objects.requireNonNull ( id, "id" );
        this.events        = indexEvents ( events );
        this.conditions    = indexConditions ( conditions );
        this.actions       = indexActions ( actions );
        this.rulesByEvent  = indexRulesByEvent ( rules );
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: indexEvents
    //
    // Description:
    //
    //   Indexes events using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   events (List<EventType>):
    //     The events collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The index events result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static Map<String, EventType> indexEvents ( List<EventType> events )
    {
        Map<String, EventType> eventsByIdentifier = new LinkedHashMap<> ();

        for ( EventType eventType : events )
        {
            eventsByIdentifier.put ( eventType.getId (), eventType );
        }

        // Return the result produced by the delegated operation.

        return Collections.unmodifiableMap ( eventsByIdentifier );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: indexConditions
    //
    // Description:
    //
    //   Indexes conditions using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   conditions (List<Condition>):
    //     The conditions collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The index conditions result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static Map<String, Condition> indexConditions ( List<Condition> conditions )
    {
        Map<String, Condition> conditionsByIdentifier = new LinkedHashMap<> ();

        for ( Condition condition : conditions )
        {
            conditionsByIdentifier.put ( condition.getId (), condition );
        }

        // Return the result produced by the delegated operation.

        return Collections.unmodifiableMap ( conditionsByIdentifier );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: indexActions
    //
    // Description:
    //
    //   Indexes actions using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   actions (List<Action>):
    //     The actions collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The index actions result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static Map<String, Action> indexActions ( List<Action> actions )
    {
        Map<String, Action> actionsByIdentifier = new LinkedHashMap<> ();

        for ( Action action : actions )
        {
            actionsByIdentifier.put ( action.getId (), action );
        }

        // Return the result produced by the delegated operation.

        return Collections.unmodifiableMap ( actionsByIdentifier );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: indexRulesByEvent
    //
    // Description:
    //
    //   Indexes rules by event using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   rules (List<Rule>):
    //     The rules collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The index rules by event result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static Map<String, List<Rule>> indexRulesByEvent ( List<Rule> rules )
    {
        Map<String, List<Rule>> mutableRulesByEvent = new LinkedHashMap<> ();

        for ( Rule rule : rules )
        {
            List<Rule> eventRules = mutableRulesByEvent.computeIfAbsent
            (
                rule.getEventId (), ignoredIdentifier -> new ArrayList<> ()
            );
            eventRules.add ( rule );
        }

        Map<String, List<Rule>> immutableRulesByEvent = new LinkedHashMap<> ();

        for ( Map.Entry<String, List<Rule>> entry : mutableRulesByEvent.entrySet () )
        {
            List<Rule> sortedRules = new ArrayList<> ( entry.getValue () );
            sortedRules.sort ( Comparator.comparing ( Rule::getId ) );
            immutableRulesByEvent.put ( entry.getKey (), Collections.unmodifiableList ( sortedRules ) );
        }

        // Return the result produced by the delegated operation.

        return Collections.unmodifiableMap ( immutableRulesByEvent );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getSchemaVersion
    //
    // Description:
    //
    //   Returns schema version from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested schema version value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String getSchemaVersion ()
    {

        // Return the schema version.

        return this.schemaVersion;
    }

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
    // Method: getEvents
    //
    // Description:
    //
    //   Returns events from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested events value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Map<String, EventType> getEvents ()
    {

        // Return the events.

        return this.events;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getCondition
    //
    // Description:
    //
    //   Returns condition from the current model, configuration, or application state.
    //
    // Arguments:
    //
    //   conditionId (String):
    //     The stable condition ID used to locate the corresponding model element.
    //
    // Returns:
    //
    //   The requested condition value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Condition getCondition ( String conditionId )
    {

        // Return the result produced by the delegated operation.

        return this.conditions.get ( conditionId );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getAction
    //
    // Description:
    //
    //   Returns action from the current model, configuration, or application state.
    //
    // Arguments:
    //
    //   actionId (String):
    //     The stable action ID used to locate the corresponding model element.
    //
    // Returns:
    //
    //   The requested action value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Action getAction ( String actionId )
    {

        // Return the result produced by the delegated operation.

        return this.actions.get ( actionId );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getRulesForEvent
    //
    // Description:
    //
    //   Returns rules for event from the current model, configuration, or application state.
    //
    // Arguments:
    //
    //   eventId (String):
    //     The stable event ID used to locate the corresponding model element.
    //
    // Returns:
    //
    //   The requested rules for event value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public List<Rule> getRulesForEvent ( String eventId )
    {

        // Return the result produced by the delegated operation.

        return this.rulesByEvent.getOrDefault ( eventId, Collections.emptyList () );
    }
}
