//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Deterministic in-memory models and event occurrences shared by core unit and property tests.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

//*********************************************************************************************************************
// Class: CoreFixtures
//
// Description:
//
//   Deterministic in-memory models and event occurrences shared by core unit and property tests.
//
//*********************************************************************************************************************

final class CoreFixtures
{
    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: CoreFixtures
    //
    // Description:
    //
    //   Creates a new CoreFixtures instance from the supplied values and establishes its initial invariants.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private CoreFixtures ()
    {
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: referenceModel
    //
    // Description:
    //
    //   Performs the reference model operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The reference model result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    static CompiledModel referenceModel ()
    {

        // Return the result produced by the delegated operation.

        return referenceModel ( null );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: referenceModelWithAdmissibleRule
    //
    // Description:
    //
    //   Performs the reference model with admissible rule operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The reference model with admissible rule result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    static CompiledModel referenceModelWithAdmissibleRule ()
    {

        // Return the result produced by the delegated operation.

        return referenceModel ( "record" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: referenceModelWithAmbiguousRule
    //
    // Description:
    //
    //   Performs the reference model with ambiguous rule operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The reference model with ambiguous rule result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    static CompiledModel referenceModelWithAmbiguousRule ()
    {

        // Return the result produced by the delegated operation.

        return referenceModel ( "alert" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: referenceModelWithReversedRules
    //
    // Description:
    //
    //   Performs the reference model with reversed rules operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The reference model with reversed rules result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    static CompiledModel referenceModelWithReversedRules ()
    {

        // Return the result produced by the delegated operation.

        return referenceModel ( null, true );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: referenceModelWithAmbiguousRuleAndReversedRules
    //
    // Description:
    //
    //   Performs the reference model with ambiguous rule and reversed rules operation using the supplied inputs and
    //   current state.
    //
    // Returns:
    //
    //   The reference model with ambiguous rule and reversed rules result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    static CompiledModel referenceModelWithAmbiguousRuleAndReversedRules ()
    {

        // Return the result produced by the delegated operation.

        return referenceModel ( "alert", true );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: referenceModel
    //
    // Description:
    //
    //   Performs the reference model operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   additionalActionIdentifier (String):
    //     The stable additional action identifier used to locate the corresponding model element.
    //
    // Returns:
    //
    //   The reference model result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static CompiledModel referenceModel ( String additionalActionIdentifier )
    {

        // Return the result produced by the delegated operation.

        return referenceModel ( additionalActionIdentifier, false );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: referenceModel
    //
    // Description:
    //
    //   Performs the reference model operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   additionalActionIdentifier (String):
    //     The stable additional action identifier used to locate the corresponding model element.
    //
    //   reverseRuleOrder (boolean):
    //     The reverse rule order used by this operation.
    //
    // Returns:
    //
    //   The reference model result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static CompiledModel referenceModel ( String additionalActionIdentifier, boolean reverseRuleOrder )
    {
        EventType eventType = new EventType
        (
            "signal.received",
            "Signal received",
            Arrays.asList
            (
                new ParameterDefinition ( "level", ParameterType.NUMBER ),
                new ParameterDefinition ( "source", ParameterType.STRING )
            )
        );
        Condition alwaysCondition = new Condition
        (
            "always", "Always", Collections.emptyList (), PredicateDefinition.always ()
        );
        Condition highCondition = new Condition
        (
            "level.high",
            "Level is high",
            Collections.singletonList ( "level" ),
            PredicateDefinition.comparison
            (
                BuiltInPredicate.GREATER_THAN, "level", Value.numberValue ( 10 )
            )
        );
        Action alertAction = new Action ( "alert", "Alert", Collections.emptyMap () );
        Action recordAction = new Action ( "record", "Record", Collections.emptyMap () );
        List<Rule> rules = new ArrayList<>
        (
            Arrays.asList
            (
                new Rule ( "record.signal", "Record every signal", "signal.received", "always", "record" ),
                new Rule ( "record.high.1", "Record high one", "signal.received", "level.high", "record" ),
                new Rule ( "record.high.2", "Record high two", "signal.received", "level.high", "record" )
            )
        );

        if ( additionalActionIdentifier != null )
        {
            rules.add
            (
                new Rule
                (
                    "property." + additionalActionIdentifier,
                    "Property " + additionalActionIdentifier,
                    "signal.received",
                    "always",
                    additionalActionIdentifier
                )
            );
        }

        if ( reverseRuleOrder )
        {
            Collections.reverse ( rules );
        }

        // Return the newly constructed CompiledModel instance.

        return new CompiledModel
        (
            "1.0",
            "reference",
            Collections.singletonList ( eventType ),
            Arrays.asList ( alwaysCondition, highCondition ),
            Arrays.asList ( alertAction, recordAction ),
            rules
        );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: signal
    //
    // Description:
    //
    //   Performs the signal operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   level (Long):
    //     The level used by this operation.
    //
    // Returns:
    //
    //   The signal result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    static EventOccurrence signal ( Long level )
    {
        Map<String, Value> payload = new LinkedHashMap<> ();

        if ( level != null )
        {
            payload.put ( "level", Value.numberValue ( level ) );
        }

        // Return the newly constructed EventOccurrence instance.

        return new EventOccurrence ( "signal.received", payload );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: signal
    //
    // Description:
    //
    //   Performs the signal operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   level (long):
    //     The level used by this operation.
    //
    //   source (String):
    //     The source used by this operation.
    //
    // Returns:
    //
    //   The signal result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    static EventOccurrence signal ( long level, String source )
    {
        Map<String, Value> payload = new LinkedHashMap<> ();
        payload.put ( "level", Value.numberValue ( level ) );
        payload.put ( "source", Value.stringValue ( source ) );

        // Return the newly constructed EventOccurrence instance.

        return new EventOccurrence ( "signal.received", payload );
    }
}
