//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Application-scoped model validation and stateless evaluation orchestration behind the HTTP resource boundary.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.service;

import com.fasterxml.jackson.databind.JsonNode;
import io.github.rohingosling.eca.core.CompiledModel;
import io.github.rohingosling.eca.core.EvaluationInputException;
import io.github.rohingosling.eca.core.EvaluationResult;
import io.github.rohingosling.eca.core.Evaluator;
import io.github.rohingosling.eca.core.EventOccurrence;
import io.github.rohingosling.eca.model.Diagnostic;
import io.github.rohingosling.eca.model.EventOccurrenceCompiler;
import io.github.rohingosling.eca.model.EventOccurrenceValidationResult;
import io.github.rohingosling.eca.model.ModelCompiler;
import io.github.rohingosling.eca.model.ModelValidationResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

//*********************************************************************************************************************
// Class: RuleEngineService
//
// Description:
//
//   Application-scoped model validation and stateless evaluation orchestration behind the HTTP resource boundary.
//
//*********************************************************************************************************************

@ApplicationScoped
final class RuleEngineService
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final ServiceConfiguration configuration;
    private final ModelCompiler modelCompiler;
    private final EventOccurrenceCompiler eventCompiler;
    private final Evaluator evaluator;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: RuleEngineService
    //
    // Description:
    //
    //   Creates a new RuleEngineService instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   configuration (ServiceConfiguration):
    //     The configuration value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Inject
    RuleEngineService ( ServiceConfiguration configuration )
    {
        this.configuration = configuration;
        this.modelCompiler = new ModelCompiler ( configuration.getModelLimits () );
        this.eventCompiler = new EventOccurrenceCompiler ( configuration.getModelLimits () );
        this.evaluator     = new Evaluator ();
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: validateModel
    //
    // Description:
    //
    //   Validates model and reports deterministic diagnostics for every detected contract violation.
    //
    // Arguments:
    //
    //   model (JsonNode):
    //     The compiled or contract model inspected by this operation.
    //
    // Returns:
    //
    //   The deterministic diagnostics produced by validation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    ModelValidationResult validateModel ( JsonNode model )
    {

        // Return the result produced by the delegated operation.

        return this.modelCompiler.compile ( model );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: evaluate
    //
    // Description:
    //
    //   Evaluates using the current event occurrence and rule data, without retaining prior-event state.
    //
    // Arguments:
    //
    //   request (JsonNode):
    //     The request used by this operation.
    //
    //   activeModel (Optional<CompiledModel>):
    //     The active model used by this operation.
    //
    // Returns:
    //
    //   The evaluation result, selected action, condition trace, or predicate outcome produced for the current input.
    //
    //-----------------------------------------------------------------------------------------------------------------

    EvaluationOperation evaluate ( JsonNode request, Optional<CompiledModel> activeModel )
    {
        CompiledModel model;
        JsonNode suppliedModel = request.get ( "model" );

        if ( suppliedModel != null && !suppliedModel.isNull () )
        {
            ModelValidationResult modelResult = this.modelCompiler.compile ( suppliedModel );

            if ( !modelResult.isValid () )
            {

                // Return the result produced by the delegated operation.

                return EvaluationOperation.invalid ( prefixDiagnostics ( "/model", modelResult.getDiagnostics () ) );
            }

            model = modelResult.getCompiledModel ().orElseThrow ();
        }
        else if ( activeModel.isPresent () )
        {
            model = activeModel.orElseThrow ();
        }
        else
        {

            // Return the result produced by the delegated operation.

            return EvaluationOperation.modelUnavailable ();
        }

        EventOccurrenceValidationResult eventResult = this.eventCompiler.compile ( request.get ( "event" ) );

        if ( !eventResult.isValid () )
        {

            // Return the result produced by the delegated operation.

            return EvaluationOperation.invalid ( prefixDiagnostics ( "/event", eventResult.getDiagnostics () ) );
        }

        EventOccurrence eventOccurrence = eventResult.getEventOccurrence ().orElseThrow ();
        boolean includeTrace = request.path ( "trace" ).asBoolean ( false ) && this.configuration.isTraceEnabled ();

        try
        {
            EvaluationResult evaluationResult = this.evaluator.evaluate ( model, eventOccurrence, includeTrace );

            // Return the result produced by the delegated operation.

            return EvaluationOperation.successful ( model, eventOccurrence, evaluationResult );
        }
        catch ( EvaluationInputException exception )
        {

            // Return the result produced by the delegated operation.

            return EvaluationOperation.invalid
            (
                List.of
                (
                    new Diagnostic
                    (
                        exception.getCode (),
                        exception.getMessage (),
                        "/event" + exception.getPointer ()
                    )
                )
            );
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: prefixDiagnostics
    //
    // Description:
    //
    //   Performs the prefix diagnostics operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   prefix (String):
    //     The prefix used by this operation.
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The prefix diagnostics result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static List<Diagnostic> prefixDiagnostics ( String prefix, List<Diagnostic> diagnostics )
    {
        List<Diagnostic> prefixedDiagnostics = new ArrayList<> ();

        for ( Diagnostic diagnostic : diagnostics )
        {
            prefixedDiagnostics.add
            (
                new Diagnostic
                (
                    diagnostic.getCode (),
                    diagnostic.getMessage (),
                    prefix + diagnostic.getPointer ()
                )
            );
        }

        Collections.sort ( prefixedDiagnostics );

        // Return the prefixed diagnostics.

        return prefixedDiagnostics;
    }
}
