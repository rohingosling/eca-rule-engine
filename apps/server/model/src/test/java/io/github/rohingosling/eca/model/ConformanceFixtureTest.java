//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   End-to-end model-to-core tests against the language-neutral selected-action and canonical-trace fixtures.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.model;

import com.fasterxml.jackson.databind.JsonNode;
import io.github.rohingosling.eca.core.CompiledModel;
import io.github.rohingosling.eca.core.ConditionTrace;
import io.github.rohingosling.eca.core.EvaluationInputException;
import io.github.rohingosling.eca.core.EvaluationResult;
import io.github.rohingosling.eca.core.EvaluationTrace;
import io.github.rohingosling.eca.core.Evaluator;
import io.github.rohingosling.eca.core.EventOccurrence;
import io.github.rohingosling.eca.core.RuleTrace;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

//*********************************************************************************************************************
// Class: ConformanceFixtureTest
//
// Description:
//
//   End-to-end model-to-core tests against the language-neutral selected-action and canonical-trace fixtures.
//
//*********************************************************************************************************************

class ConformanceFixtureTest
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final ModelCompiler compiler = new ModelCompiler ();
    private final ContractFixtureRepository fixtures = new ContractFixtureRepository
    (
        this.compiler.getObjectMapper ()
    );
    private final EventOccurrenceCompiler eventCompiler = new EventOccurrenceCompiler ();
    private final ContractJsonCodec contractJsonCodec = new ContractJsonCodec ();
    private final Evaluator evaluator = new Evaluator ();

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: everyEvaluationFixtureMatchesTheActionOrAmbiguityDiagnosticAndCompleteTrace
    //
    // Description:
    //
    //   Verifies that every evaluation fixture matches the action or ambiguity diagnostic and complete trace and fails
    //   the test when the observed behavior differs.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void everyEvaluationFixtureMatchesTheActionOrAmbiguityDiagnosticAndCompleteTrace () throws Exception
    {
        JsonNode manifest = this.fixtures.readManifest ();

        for ( JsonNode evaluationCaseEntry : manifest.get ( "evaluationCases" ) )
        {
            String caseIdentifier = evaluationCaseEntry.get ( "id" ).textValue ();
            Path casePath = this.fixtures.resolve ( evaluationCaseEntry.get ( "casePath" ).textValue () );
            JsonNode evaluationCase = this.fixtures.readJson ( casePath );
            Path modelPath = casePath.getParent ()
                .resolve ( evaluationCase.get ( "modelPath" ).textValue () )
                .normalize ();
            JsonNode modelDocument = this.fixtures.readJson ( modelPath );
            ModelValidationResult modelResult = this.compiler.compile ( modelDocument );

            assertThat ( modelResult.isValid () ).as ( caseIdentifier ).isTrue ();

            CompiledModel model = modelResult.getCompiledModel ().orElseThrow ();
            EventOccurrenceValidationResult eventResult = this.eventCompiler.compile ( evaluationCase.get ( "event" ) );

            assertThat ( eventResult.isValid () ).as ( caseIdentifier ).isTrue ();

            EventOccurrence eventOccurrence = eventResult.getEventOccurrence ().orElseThrow ();
            JsonNode expectedDiagnostic = evaluationCase.get ( "expectedDiagnostic" );

            if ( expectedDiagnostic != null )
            {
                EvaluationInputException exception = catchThrowableOfType
                (
                    EvaluationInputException.class,
                    () -> this.evaluator.evaluate ( model, eventOccurrence, true )
                );

                assertThat ( exception ).as ( caseIdentifier ).isNotNull ();

                Diagnostic actualDiagnostic = new Diagnostic
                (
                    exception.getCode (), exception.getMessage (), exception.getPointer ()
                );
                Diagnostic requiredDiagnostic = new Diagnostic
                (
                    expectedDiagnostic.get ( "code" ).textValue (),
                    expectedDiagnostic.get ( "message" ).textValue (),
                    expectedDiagnostic.get ( "pointer" ).textValue ()
                );

                assertThat ( actualDiagnostic ).as ( caseIdentifier ).isEqualTo ( requiredDiagnostic );
                continue;
            }

            EvaluationResult actualResult = this.evaluator.evaluate ( model, eventOccurrence, true );
            JsonNode expectedActionIdentifier = evaluationCase.get ( "expectedActionId" );
            JsonNode actualAction = this.contractJsonCodec.createEvaluationResult
            (
                model, eventOccurrence, actualResult
            ).get ( "selectedAction" );
            JsonNode expectedAction = this.resolveExpectedAction ( modelDocument, expectedActionIdentifier );

            assertThat ( actualAction ).as ( caseIdentifier ).isEqualTo ( expectedAction );

            this.assertTrace
            (
                caseIdentifier,
                actualResult.getTrace ().orElseThrow (),
                evaluationCase.get ( "expectedTrace" )
            );
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: resolveExpectedAction
    //
    // Description:
    //
    //   Resolves expected action using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   model (JsonNode):
    //     The compiled or contract model inspected by this operation.
    //
    //   expectedActionIdentifier (JsonNode):
    //     The stable expected action identifier used to locate the corresponding model element.
    //
    // Returns:
    //
    //   The resolve expected action result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private JsonNode resolveExpectedAction ( JsonNode model, JsonNode expectedActionIdentifier )
    {
        if ( expectedActionIdentifier == null || expectedActionIdentifier.isNull () )
        {

            // Return the result produced by the delegated operation.

            return this.compiler.getObjectMapper ().nullNode ();
        }

        for ( JsonNode action : model.get ( "actions" ) )
        {
            if ( expectedActionIdentifier.textValue ().equals ( action.get ( "id" ).textValue () ) )
            {

                // Return the action.

                return action;
            }
        }

        throw new AssertionError ( "Expected action is not present in the conformance model." );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: assertTrace
    //
    // Description:
    //
    //   Verifies trace using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   caseIdentifier (String):
    //     The stable case identifier used to locate the corresponding model element.
    //
    //   actualTrace (EvaluationTrace):
    //     The actual trace used by this operation.
    //
    //   expectedTrace (JsonNode):
    //     The expected trace used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void assertTrace ( String caseIdentifier, EvaluationTrace actualTrace, JsonNode expectedTrace )
    {
        JsonNode expectedConditions = expectedTrace.get ( "conditions" );
        JsonNode expectedRules = expectedTrace.get ( "rules" );

        assertThat ( actualTrace.getConditions () ).as ( caseIdentifier ).hasSize ( expectedConditions.size () );
        assertThat ( actualTrace.getRules () ).as ( caseIdentifier ).hasSize ( expectedRules.size () );

        for ( int conditionIndex = 0; conditionIndex < expectedConditions.size (); conditionIndex++ )
        {
            ConditionTrace actualCondition = actualTrace.getConditions ().get ( conditionIndex );
            JsonNode expectedCondition = expectedConditions.get ( conditionIndex );
            List<String> expectedMissingDependencies = new ArrayList<> ();

            for ( JsonNode dependency : expectedCondition.get ( "missingDependencies" ) )
            {
                expectedMissingDependencies.add ( dependency.textValue () );
            }

            assertThat ( actualCondition.getConditionId () )
                .as ( caseIdentifier )
                .isEqualTo ( expectedCondition.get ( "condition" ).textValue () );
            assertThat ( actualCondition.getResult () )
                .as ( caseIdentifier )
                .isEqualTo ( expectedCondition.get ( "result" ).booleanValue () );
            assertThat ( actualCondition.getReason ().getContractName () )
                .as ( caseIdentifier )
                .isEqualTo ( expectedCondition.get ( "reason" ).textValue () );
            assertThat ( actualCondition.getMissingDependencies () )
                .as ( caseIdentifier )
                .containsExactlyElementsOf ( expectedMissingDependencies );
        }

        for ( int ruleIndex = 0; ruleIndex < expectedRules.size (); ruleIndex++ )
        {
            RuleTrace actualRule = actualTrace.getRules ().get ( ruleIndex );
            JsonNode expectedRule = expectedRules.get ( ruleIndex );

            assertThat ( actualRule.getRuleId () )
                .as ( caseIdentifier )
                .isEqualTo ( expectedRule.get ( "rule" ).textValue () );
            assertThat ( actualRule.getConditionId () )
                .as ( caseIdentifier )
                .isEqualTo ( expectedRule.get ( "condition" ).textValue () );
            assertThat ( actualRule.getConditionResult () )
                .as ( caseIdentifier )
                .isEqualTo ( expectedRule.get ( "conditionResult" ).booleanValue () );
            assertThat ( actualRule.getActionId () )
                .as ( caseIdentifier )
                .isEqualTo ( expectedRule.get ( "action" ).textValue () );
            assertThat ( actualRule.getMatched () )
                .as ( caseIdentifier )
                .isEqualTo ( expectedRule.get ( "matched" ).booleanValue () );
        }
    }
}
