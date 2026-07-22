//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Example and trace tests for the pure stateless evaluator.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

//*********************************************************************************************************************
// Class: EvaluatorTest
//
// Description:
//
//   Example and trace tests for the pure stateless evaluator.
//
//*********************************************************************************************************************

class EvaluatorTest
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final Evaluator evaluator = new Evaluator ();
    private final CompiledModel model = CoreFixtures.referenceModel ();

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: absentAndEmptyPayloadsHaveIdenticalSemantics
    //
    // Description:
    //
    //   Performs the absent and empty payloads have identical semantics operation using the supplied inputs and
    //   current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void absentAndEmptyPayloadsHaveIdenticalSemantics ()
    {
        EvaluationResult absentResult = this.evaluator.evaluate
        (
            this.model, EventOccurrence.withoutPayload ( "signal.received" ), true
        );
        EvaluationResult emptyResult = this.evaluator.evaluate
        (
            this.model, new EventOccurrence ( "signal.received", Collections.emptyMap () ), true
        );

        assertThat ( absentResult ).isEqualTo ( emptyResult );
        assertThat ( absentResult.getSelectedActionId () ).contains ( "record" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: multipleMatchingRulesForTheSameActionReturnThatAction
    //
    // Description:
    //
    //   Performs the multiple matching rules for the same action return that action operation using the supplied
    //   inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void multipleMatchingRulesForTheSameActionReturnThatAction ()
    {
        EvaluationResult result = this.evaluator.evaluate ( this.model, CoreFixtures.signal ( 12L ), true );

        assertThat ( result.getSelectedActionId () ).contains ( "record" );
        assertThat ( result.getTrace ().orElseThrow ().getRules () )
            .extracting ( RuleTrace::getMatched )
            .containsOnly ( true );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: multipleMatchingDistinctActionsProduceAnExplicitAmbiguityFailure
    //
    // Description:
    //
    //   Performs the multiple matching distinct actions produce an explicit ambiguity failure operation using the
    //   supplied inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void multipleMatchingDistinctActionsProduceAnExplicitAmbiguityFailure ()
    {
        assertThatThrownBy
        (
            () -> this.evaluator.evaluate
            (
                CoreFixtures.referenceModelWithAmbiguousRule (), CoreFixtures.signal ( 12L ), true
            )
        ).isInstanceOf ( EvaluationInputException.class )
            .hasMessage
            (
                "Event 'signal.received' matched distinct actions [alert, record] through rules "
                    + "[property.alert, record.high.1, record.high.2, record.signal]."
            )
            .hasFieldOrPropertyWithValue ( "code", "ambiguous-action-selection" )
            .hasFieldOrPropertyWithValue ( "pointer", "/type" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: missingDependenciesAreFalseAndAppearInCanonicalTrace
    //
    // Description:
    //
    //   Verifies that missing dependencies are false and appear in canonical trace and fails the test when the
    //   observed behavior differs.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void missingDependenciesAreFalseAndAppearInCanonicalTrace ()
    {
        EvaluationResult result = this.evaluator.evaluate ( this.model, CoreFixtures.signal ( null ), true );
        EvaluationTrace trace = result.getTrace ().orElseThrow ();

        assertThat ( trace.getConditions () ).extracting ( ConditionTrace::getConditionId )
            .containsExactly ( "always", "level.high" );
        assertThat ( trace.getConditions ().get ( 1 ).getResult () ).isFalse ();
        assertThat ( trace.getConditions ().get ( 1 ).getReason () ).isEqualTo ( TraceReason.MISSING_DEPENDENCY );
        assertThat ( trace.getConditions ().get ( 1 ).getMissingDependencies () ).containsExactly ( "level" );
        assertThat ( trace.getRules () ).extracting ( RuleTrace::getRuleId )
            .containsExactly ( "record.high.1", "record.high.2", "record.signal" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: unknownEventSelectsNothingWithoutFailure
    //
    // Description:
    //
    //   Performs the unknown event selects nothing without failure operation using the supplied inputs and current
    //   state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void unknownEventSelectsNothingWithoutFailure ()
    {
        EvaluationResult result = this.evaluator.evaluate
        (
            this.model, EventOccurrence.withoutPayload ( "signal.unknown" ), true
        );

        assertThat ( result.getSelectedAction () ).isEmpty ();
        assertThat ( result.getTrace ().orElseThrow ().getConditions () ).isEmpty ();
        assertThat ( result.getTrace ().orElseThrow ().getRules () ).isEmpty ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: knownEventRejectsUndeclaredOrIncompatiblePayloadValues
    //
    // Description:
    //
    //   Performs the known event rejects undeclared or incompatible payload values operation using the supplied inputs
    //   and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void knownEventRejectsUndeclaredOrIncompatiblePayloadValues ()
    {
        assertThatThrownBy
        (
            () -> this.evaluator.evaluate
            (
                this.model,
                new EventOccurrence
                (
                    "signal.received", Collections.singletonMap ( "unexpected", Value.booleanValue ( true ) )
                ),
                false
            )
        ).isInstanceOf ( EvaluationInputException.class )
            .hasFieldOrPropertyWithValue ( "code", "undeclared-event-parameter" )
            .hasFieldOrPropertyWithValue ( "pointer", "/payload/unexpected" );

        assertThatThrownBy
        (
            () -> this.evaluator.evaluate
            (
                this.model,
                new EventOccurrence
                (
                    "signal.received", Collections.singletonMap ( "level", Value.stringValue ( "high" ) )
                ),
                false
            )
        ).isInstanceOf ( EvaluationInputException.class )
            .hasFieldOrPropertyWithValue ( "code", "incompatible-event-parameter" )
            .hasFieldOrPropertyWithValue ( "pointer", "/payload/level" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: traceGenerationDoesNotChangeTheSelectedAction
    //
    // Description:
    //
    //   Performs the trace generation does not change the selected action operation using the supplied inputs and
    //   current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void traceGenerationDoesNotChangeTheSelectedAction ()
    {
        EvaluationResult tracedResult = this.evaluator.evaluate ( this.model, CoreFixtures.signal ( 12L ), true );
        EvaluationResult untracedResult = this.evaluator.evaluate ( this.model, CoreFixtures.signal ( 12L ), false );

        assertThat ( tracedResult.getSelectedActionId () ).isEqualTo ( untracedResult.getSelectedActionId () );
        assertThat ( untracedResult.getTrace () ).isEmpty ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: ruleOrderPermutationPreservesTheSuccessfulEvaluation
    //
    // Description:
    //
    //   Performs the rule order permutation preserves the successful evaluation operation using the supplied inputs
    //   and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void ruleOrderPermutationPreservesTheSuccessfulEvaluation ()
    {
        EventOccurrence eventOccurrence = CoreFixtures.signal ( 12L );
        EvaluationResult originalResult = this.evaluator.evaluate
        (
            CoreFixtures.referenceModel (), eventOccurrence, true
        );
        EvaluationResult permutedResult = this.evaluator.evaluate
        (
            CoreFixtures.referenceModelWithReversedRules (), eventOccurrence, true
        );

        assertThat ( permutedResult ).isEqualTo ( originalResult );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: ruleOrderPermutationPreservesTheAmbiguityDiagnostic
    //
    // Description:
    //
    //   Performs the rule order permutation preserves the ambiguity diagnostic operation using the supplied inputs and
    //   current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void ruleOrderPermutationPreservesTheAmbiguityDiagnostic ()
    {
        EventOccurrence eventOccurrence = CoreFixtures.signal ( 12L );
        EvaluationInputException originalException = catchThrowableOfType
        (
            EvaluationInputException.class,
            () -> this.evaluator.evaluate
            (
                CoreFixtures.referenceModelWithAmbiguousRule (), eventOccurrence, false
            )
        );
        EvaluationInputException permutedException = catchThrowableOfType
        (
            EvaluationInputException.class,
            () -> this.evaluator.evaluate
            (
                CoreFixtures.referenceModelWithAmbiguousRuleAndReversedRules (), eventOccurrence, false
            )
        );

        assertThat ( permutedException.getCode () ).isEqualTo ( originalException.getCode () );
        assertThat ( permutedException.getMessage () ).isEqualTo ( originalException.getMessage () );
        assertThat ( permutedException.getPointer () ).isEqualTo ( originalException.getPointer () );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: largeAmbiguityMessagesAreBoundedDeterministicAndOrderInvariant
    //
    // Description:
    //
    //   Verifies that large ambiguity messages are bounded deterministic and order invariant and fails the test when
    //   the observed behavior differs.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void largeAmbiguityMessagesAreBoundedDeterministicAndOrderInvariant ()
    {
        EventOccurrence eventOccurrence = EventOccurrence.withoutPayload ( "signal.received" );
        CompiledModel originalModel = this.createLargeAmbiguousModel ( false );
        CompiledModel permutedModel = this.createLargeAmbiguousModel ( true );
        EvaluationInputException originalException = catchThrowableOfType
        (
            EvaluationInputException.class,
            () -> this.evaluator.evaluate ( originalModel, eventOccurrence, false )
        );
        EvaluationInputException repeatedException = catchThrowableOfType
        (
            EvaluationInputException.class,
            () -> this.evaluator.evaluate ( originalModel, eventOccurrence, false )
        );
        EvaluationInputException permutedException = catchThrowableOfType
        (
            EvaluationInputException.class,
            () -> this.evaluator.evaluate ( permutedModel, eventOccurrence, false )
        );
        String message = originalException.getMessage ();

        assertThat ( message.codePointCount ( 0, message.length () ) )
            .isEqualTo ( DiagnosticMessagePolicy.MAXIMUM_MESSAGE_CODE_POINTS );
        assertThat ( message ).endsWith ( "\u2026" );
        assertThat ( repeatedException.getMessage () ).isEqualTo ( message );
        assertThat ( permutedException.getMessage () ).isEqualTo ( message );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: createLargeAmbiguousModel
    //
    // Description:
    //
    //   Constructs large ambiguous model from the supplied inputs without mutating the caller's source values.
    //
    // Arguments:
    //
    //   reverseDeclarationOrder (boolean):
    //     The reverse declaration order used by this operation.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private CompiledModel createLargeAmbiguousModel ( boolean reverseDeclarationOrder )
    {
        EventType eventType = new EventType
        (
            "signal.received", "Signal received", Collections.emptyList ()
        );
        Condition condition = new Condition
        (
            "always", "Always", Collections.emptyList (), PredicateDefinition.always ()
        );
        List<Action> actions = new ArrayList<> ();
        List<Rule> rules     = new ArrayList<> ();

        for ( int index = 0; index < 17; index++ )
        {
            String indexText        = Integer.toString ( index );
            String indexSegment     = "0".repeat ( 3 - indexText.length () ) + indexText;
            String actionPrefix     = "action." + indexSegment + ".";
            String rulePrefix       = "rule." + indexSegment + ".";
            String actionIdentifier = actionPrefix + "a".repeat ( 128 - actionPrefix.length () );
            String ruleIdentifier   = rulePrefix + "r".repeat ( 128 - rulePrefix.length () );

            actions.add ( new Action ( actionIdentifier, "Action " + indexText, Collections.emptyMap () ) );
            rules.add
            (
                new Rule
                (
                    ruleIdentifier,
                    "Rule " + indexText,
                    eventType.getId (),
                    condition.getId (),
                    actionIdentifier
                )
            );
        }

        if ( reverseDeclarationOrder )
        {
            Collections.reverse ( actions );
            Collections.reverse ( rules );
        }

        // Return the newly constructed CompiledModel instance.

        return new CompiledModel
        (
            "1.0",
            "large-ambiguity",
            Collections.singletonList ( eventType ),
            Collections.singletonList ( condition ),
            actions,
            rules
        );
    }
}
