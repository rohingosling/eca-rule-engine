//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable application-service outcome for a successful, invalid, or model-unavailable HTTP evaluation.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.service;

import io.github.rohingosling.eca.core.CompiledModel;
import io.github.rohingosling.eca.core.EvaluationResult;
import io.github.rohingosling.eca.core.EventOccurrence;
import io.github.rohingosling.eca.model.Diagnostic;

import java.util.List;

//*********************************************************************************************************************
// Class: EvaluationOperation
//
// Description:
//
//   Immutable application-service outcome for a successful, invalid, or model-unavailable HTTP evaluation.
//
//*********************************************************************************************************************

final class EvaluationOperation
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final boolean modelUnavailable;
    private final List<Diagnostic> diagnostics;
    private final CompiledModel model;
    private final EventOccurrence eventOccurrence;
    private final EvaluationResult evaluationResult;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: EvaluationOperation
    //
    // Description:
    //
    //   Creates a new EvaluationOperation instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   modelUnavailable (boolean):
    //     The model unavailable value supplied to this operation.
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    //   model (CompiledModel):
    //     The model value supplied to this operation.
    //
    //   eventOccurrence (EventOccurrence):
    //     The event occurrence value supplied to this operation.
    //
    //   evaluationResult (EvaluationResult):
    //     The evaluation result value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private EvaluationOperation (
        boolean modelUnavailable, List<Diagnostic> diagnostics, CompiledModel model,
        EventOccurrence eventOccurrence, EvaluationResult evaluationResult )
    {
        this.modelUnavailable = modelUnavailable;
        this.diagnostics      = diagnostics;
        this.model            = model;
        this.eventOccurrence  = eventOccurrence;
        this.evaluationResult = evaluationResult;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: successful
    //
    // Description:
    //
    //   Performs the successful operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   model (CompiledModel):
    //     The compiled or contract model inspected by this operation.
    //
    //   eventOccurrence (EventOccurrence):
    //     The current event occurrence containing the event type and optional payload values.
    //
    //   evaluationResult (EvaluationResult):
    //     The evaluation result used by this operation.
    //
    // Returns:
    //
    //   The successful result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    static EvaluationOperation successful (
        CompiledModel model, EventOccurrence eventOccurrence, EvaluationResult evaluationResult )
    {

        // Return the newly constructed EvaluationOperation instance.

        return new EvaluationOperation
        (
            false,
            List.of (),
            model,
            eventOccurrence,
            evaluationResult
        );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: invalid
    //
    // Description:
    //
    //   Verifies that invalid and fails the test when the observed behavior differs.
    //
    // Arguments:
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The invalid result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    static EvaluationOperation invalid ( List<Diagnostic> diagnostics )
    {

        // Return the newly constructed EvaluationOperation instance.

        return new EvaluationOperation ( false, List.copyOf ( diagnostics ), null, null, null );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: modelUnavailable
    //
    // Description:
    //
    //   Performs the model unavailable operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The model unavailable result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    static EvaluationOperation modelUnavailable ()
    {

        // Return the newly constructed EvaluationOperation instance.

        return new EvaluationOperation ( true, List.of (), null, null, null );
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: isModelUnavailable
    //
    // Description:
    //
    //   Determines whether is model unavailable holds for the supplied value or application state.
    //
    // Returns:
    //
    //   True when the requested condition holds; otherwise false.
    //
    //-----------------------------------------------------------------------------------------------------------------

    boolean isModelUnavailable ()
    {

        // Return the model unavailable.

        return this.modelUnavailable;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: isValid
    //
    // Description:
    //
    //   Determines whether is valid holds for the supplied value or application state.
    //
    // Returns:
    //
    //   True when the requested condition holds; otherwise false.
    //
    //-----------------------------------------------------------------------------------------------------------------

    boolean isValid ()
    {

        // Return the value produced by this code path.

        return !this.modelUnavailable && this.diagnostics.isEmpty ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getDiagnostics
    //
    // Description:
    //
    //   Returns diagnostics from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested diagnostics value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    List<Diagnostic> getDiagnostics ()
    {

        // Return the diagnostics.

        return this.diagnostics;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getModel
    //
    // Description:
    //
    //   Returns model from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested model value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    CompiledModel getModel ()
    {

        // Return the model.

        return this.model;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getEventOccurrence
    //
    // Description:
    //
    //   Returns event occurrence from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested event occurrence value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    EventOccurrence getEventOccurrence ()
    {

        // Return the event occurrence.

        return this.eventOccurrence;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getEvaluationResult
    //
    // Description:
    //
    //   Returns evaluation result from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested evaluation result value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    EvaluationResult getEvaluationResult ()
    {

        // Return the evaluation result.

        return this.evaluationResult;
    }
}
