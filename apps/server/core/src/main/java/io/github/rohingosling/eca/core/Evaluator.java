//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Pure, thread-safe implementation of the stateless event-condition-action evaluation function.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

//*********************************************************************************************************************
// Class: Evaluator
//
// Description:
//
//   Pure, thread-safe implementation of the stateless event-condition-action evaluation function.
//
//*********************************************************************************************************************

public final class Evaluator
{
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
    //   model (CompiledModel):
    //     The compiled or contract model inspected by this operation.
    //
    //   eventOccurrence (EventOccurrence):
    //     The current event occurrence containing the event type and optional payload values.
    //
    //   includeTrace (boolean):
    //     Whether the result should include the deterministic condition and rule traces.
    //
    // Returns:
    //
    //   The evaluation result, selected action, condition trace, or predicate outcome produced for the current input.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public EvaluationResult evaluate ( CompiledModel model, EventOccurrence eventOccurrence, boolean includeTrace )
    {
        this.validateEventOccurrence ( model, eventOccurrence );

        List<Rule> matchingRules = model.getRulesForEvent ( eventOccurrence.getType () );

        if ( matchingRules.isEmpty () )
        {
            EvaluationTrace trace = includeTrace
                ? new EvaluationTrace ( Collections.emptyList (), Collections.emptyList () )
                : null;

            // Return the newly constructed EvaluationResult instance.

            return new EvaluationResult ( null, trace );
        }

        Map<String, Boolean> conditionResults = new LinkedHashMap<> ();
        List<ConditionTrace> conditionTraces  = new ArrayList<> ();
        Set<String> conditionIds              = new TreeSet<> ();

        for ( Rule rule : matchingRules )
        {
            conditionIds.add ( rule.getConditionId () );
        }

        for ( String conditionId : conditionIds )
        {
            Condition condition = model.getCondition ( conditionId );
            ConditionTrace conditionTrace = this.evaluateCondition ( condition, eventOccurrence.getPayload () );
            conditionResults.put ( conditionId, conditionTrace.getResult () );

            if ( includeTrace )
            {
                conditionTraces.add ( conditionTrace );
            }
        }

        Map<String, Action> matchedActions = new TreeMap<> ();
        List<RuleTrace> ruleTraces         = new ArrayList<> ();
        Set<String> matchedRuleIds         = new TreeSet<> ();

        for ( Rule rule : matchingRules )
        {
            boolean conditionResult = conditionResults.get ( rule.getConditionId () );

            if ( conditionResult )
            {
                matchedActions.put ( rule.getActionId (), model.getAction ( rule.getActionId () ) );
                matchedRuleIds.add ( rule.getId () );
            }

            if ( includeTrace )
            {
                ruleTraces.add
                (
                    new RuleTrace
                    (
                        rule.getId (), rule.getConditionId (), conditionResult, rule.getActionId (), conditionResult
                    )
                );
            }
        }

        this.rejectAmbiguousActionSelection ( eventOccurrence, matchedActions, matchedRuleIds );

        Action selectedAction = matchedActions.isEmpty ()
            ? null
            : matchedActions.values ().iterator ().next ();
        EvaluationTrace trace = includeTrace ? new EvaluationTrace ( conditionTraces, ruleTraces ) : null;

        // Return the newly constructed EvaluationResult instance.

        return new EvaluationResult ( selectedAction, trace );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: rejectAmbiguousActionSelection
    //
    // Description:
    //
    //   Rejects ambiguous action selection using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   eventOccurrence (EventOccurrence):
    //     The current event occurrence containing the event type and optional payload values.
    //
    //   matchedActions (Map<String, Action>):
    //     The matched actions collection inspected or transformed by this operation.
    //
    //   matchedRuleIds (Set<String>):
    //     The matched rule ids collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void rejectAmbiguousActionSelection (
        EventOccurrence eventOccurrence, Map<String, Action> matchedActions, Set<String> matchedRuleIds )
    {
        if ( matchedActions.size () <= 1 )
        {

            // Return without a value after completing this code path.

            return;
        }

        String actionIdentifiers = String.join ( ", ", matchedActions.keySet () );
        String ruleIdentifiers   = String.join ( ", ", matchedRuleIds );
        throw new EvaluationInputException
        (
            "ambiguous-action-selection",
            "Event '" + eventOccurrence.getType () + "' matched distinct actions [" + actionIdentifiers
                + "] through rules [" + ruleIdentifiers + "].",
            "/type"
        );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: evaluateCondition
    //
    // Description:
    //
    //   Evaluates condition using the current event occurrence and rule data, without retaining prior-event state.
    //
    // Arguments:
    //
    //   condition (Condition):
    //     The condition used by this operation.
    //
    //   payload (Map<String, Value>):
    //     The payload inspected while evaluating or validating the current event occurrence.
    //
    // Returns:
    //
    //   The evaluation result, selected action, condition trace, or predicate outcome produced for the current input.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private ConditionTrace evaluateCondition ( Condition condition, Map<String, Value> payload )
    {
        List<String> missingDependencies = new ArrayList<> ();

        for ( String dependency : condition.getDependencies () )
        {
            if ( !payload.containsKey ( dependency ) )
            {
                missingDependencies.add ( dependency );
            }
        }

        Collections.sort ( missingDependencies );

        if ( !missingDependencies.isEmpty () )
        {

            // Return the newly constructed ConditionTrace instance.

            return new ConditionTrace
            (
                condition.getId (), false, TraceReason.MISSING_DEPENDENCY, missingDependencies
            );
        }

        PredicateDefinition predicate = condition.getPredicate ();
        Value payloadValue = predicate.getPredicate () == BuiltInPredicate.ALWAYS
            ? Value.nullValue ()
            : payload.get ( predicate.getParameterName () );
        boolean result = predicate.evaluate ( payloadValue );
        TraceReason reason = result ? TraceReason.PREDICATE_TRUE : TraceReason.PREDICATE_FALSE;

        // Return the newly constructed ConditionTrace instance.

        return new ConditionTrace ( condition.getId (), result, reason, Collections.emptyList () );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: validateEventOccurrence
    //
    // Description:
    //
    //   Validates event occurrence and reports deterministic diagnostics for every detected contract violation.
    //
    // Arguments:
    //
    //   model (CompiledModel):
    //     The compiled or contract model inspected by this operation.
    //
    //   eventOccurrence (EventOccurrence):
    //     The current event occurrence containing the event type and optional payload values.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void validateEventOccurrence ( CompiledModel model, EventOccurrence eventOccurrence )
    {
        EventType eventType = model.getEvents ().get ( eventOccurrence.getType () );

        if ( eventType == null )
        {

            // Return without a value after completing this code path.

            return;
        }

        for ( Map.Entry<String, Value> payloadEntry : eventOccurrence.getPayload ().entrySet () )
        {
            String parameterIdentifier = payloadEntry.getKey ();
            ParameterDefinition parameter = eventType.getParameters ().get ( parameterIdentifier );
            String pointer = "/payload/" + escapeJsonPointerSegment ( parameterIdentifier );

            if ( parameter == null )
            {
                throw new EvaluationInputException
                (
                    "undeclared-event-parameter",
                    "Event '" + eventOccurrence.getType () + "' does not declare parameter '"
                        + parameterIdentifier + "'.",
                    pointer
                );
            }

            if ( !parameter.getType ().accepts ( payloadEntry.getValue () ) )
            {
                throw new EvaluationInputException
                (
                    "incompatible-event-parameter",
                    "Event parameter '" + parameterIdentifier + "' does not match type '"
                        + parameter.getType ().getContractName () + "'.",
                    pointer
                );
            }
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: escapeJsonPointerSegment
    //
    // Description:
    //
    //   Escapes JSON pointer segment using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   segment (String):
    //     The segment used by this operation.
    //
    // Returns:
    //
    //   The escape JSON pointer segment result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static String escapeJsonPointerSegment ( String segment )
    {

        // Return the result produced by the delegated operation.

        return segment.replace ( "~", "~0" ).replace ( "/", "~1" );
    }
}
