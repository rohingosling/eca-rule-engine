//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Fixed-seed generative tests for determinism, replay, payload locality, admissible extension, and concurrency.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;

//*********************************************************************************************************************
// Class: EvaluatorPropertyTest
//
// Description:
//
//   Fixed-seed generative tests for determinism, replay, payload locality, admissible extension, and concurrency.
//
//*********************************************************************************************************************

class EvaluatorPropertyTest
{
    //=================================================================================================================
    // Constants
    //=================================================================================================================

    private static final long PROPERTY_SEED = 0x0ECA2026L;

    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final Evaluator evaluator = new Evaluator ();

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: repeatedEvaluationIsDeterministicAcrossGeneratedInputs
    //
    // Description:
    //
    //   Performs the repeated evaluation is deterministic across generated inputs operation using the supplied inputs
    //   and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void repeatedEvaluationIsDeterministicAcrossGeneratedInputs ()
    {
        CompiledModel model = CoreFixtures.referenceModel ();
        Random random = new Random ( PROPERTY_SEED );

        for ( int caseIndex = 0; caseIndex < 500; caseIndex++ )
        {
            EventOccurrence event = CoreFixtures.signal ( ( long ) random.nextInt ( 41 ) - 20L );
            EvaluationResult expectedResult = this.evaluator.evaluate ( model, event, true );

            for ( int repetition = 0; repetition < 10; repetition++ )
            {
                assertThat ( this.evaluator.evaluate ( model, event, true ) ).isEqualTo ( expectedResult );
            }
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: interveningEvaluationsDoNotAffectReplay
    //
    // Description:
    //
    //   Performs the intervening evaluations do not affect replay operation using the supplied inputs and current
    //   state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void interveningEvaluationsDoNotAffectReplay ()
    {
        CompiledModel model = CoreFixtures.referenceModel ();
        EventOccurrence replayedEvent = CoreFixtures.signal ( 12L );
        EvaluationResult expectedResult = this.evaluator.evaluate ( model, replayedEvent, true );
        Random random = new Random ( PROPERTY_SEED );

        for ( int caseIndex = 0; caseIndex < 500; caseIndex++ )
        {
            this.evaluator.evaluate ( model, CoreFixtures.signal ( ( long ) random.nextInt ( 101 ) - 50L ), true );
            assertThat ( this.evaluator.evaluate ( model, replayedEvent, true ) ).isEqualTo ( expectedResult );
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: unusedPayloadPropertiesDoNotChangeResults
    //
    // Description:
    //
    //   Performs the unused payload properties do not change results operation using the supplied inputs and current
    //   state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void unusedPayloadPropertiesDoNotChangeResults ()
    {
        CompiledModel model = CoreFixtures.referenceModel ();
        EvaluationResult firstResult = this.evaluator.evaluate
        (
            model, CoreFixtures.signal ( 12L, "sensor-alpha" ), true
        );
        EvaluationResult secondResult = this.evaluator.evaluate
        (
            model, CoreFixtures.signal ( 12L, "sensor-beta" ), true
        );

        assertThat ( secondResult ).isEqualTo ( firstResult );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: anAdmissibleRuleSetExtensionPreservesTheSelectedAction
    //
    // Description:
    //
    //   Performs the an admissible rule set extension preserves the selected action operation using the supplied
    //   inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void anAdmissibleRuleSetExtensionPreservesTheSelectedAction ()
    {
        EventOccurrence event = EventOccurrence.withoutPayload ( "signal.received" );
        EvaluationResult baselineResult = this.evaluator.evaluate ( CoreFixtures.referenceModel (), event, false );
        EvaluationResult extendedResult = this.evaluator.evaluate
        (
            CoreFixtures.referenceModelWithAdmissibleRule (), event, false
        );

        assertThat ( extendedResult.getSelectedActionId () ).isEqualTo ( baselineResult.getSelectedActionId () );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: oneCompiledModelIsSafeForConcurrentEvaluation
    //
    // Description:
    //
    //   Performs the one compiled model is safe for concurrent evaluation operation using the supplied inputs and
    //   current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void oneCompiledModelIsSafeForConcurrentEvaluation () throws Exception
    {
        CompiledModel model = CoreFixtures.referenceModel ();
        EventOccurrence event = CoreFixtures.signal ( 12L );
        EvaluationResult expectedResult = this.evaluator.evaluate ( model, event, true );
        ExecutorService executor = Executors.newFixedThreadPool ( 8 );

        try
        {
            List<Callable<EvaluationResult>> evaluations = new ArrayList<> ();

            for ( int evaluationIndex = 0; evaluationIndex < 1_000; evaluationIndex++ )
            {
                evaluations.add ( () -> this.evaluator.evaluate ( model, event, true ) );
            }

            List<Future<EvaluationResult>> results = executor.invokeAll ( evaluations );

            for ( Future<EvaluationResult> result : results )
            {
                assertThat ( result.get () ).isEqualTo ( expectedResult );
            }
        }
        finally
        {
            executor.shutdownNow ();
        }
    }
}
