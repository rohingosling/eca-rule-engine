//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Deterministic event-occurrence validation result containing a value or ordered diagnostics.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.model;

import io.github.rohingosling.eca.core.EventOccurrence;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

//*********************************************************************************************************************
// Class: EventOccurrenceValidationResult
//
// Description:
//
//   Deterministic event-occurrence validation result containing a value or ordered diagnostics.
//
//*********************************************************************************************************************

public final class EventOccurrenceValidationResult
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final List<Diagnostic> diagnostics;
    private final EventOccurrence eventOccurrence;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: EventOccurrenceValidationResult
    //
    // Description:
    //
    //   Creates a new EventOccurrenceValidationResult instance from the supplied values and establishes its initial
    //   invariants.
    //
    // Arguments:
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    //   eventOccurrence (EventOccurrence):
    //     The event occurrence value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private EventOccurrenceValidationResult ( List<Diagnostic> diagnostics, EventOccurrence eventOccurrence )
    {
        List<Diagnostic> sortedDiagnostics = diagnostics.stream ().distinct ().sorted ().toList ();

        this.diagnostics     = sortedDiagnostics;
        this.eventOccurrence = eventOccurrence;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: valid
    //
    // Description:
    //
    //   Verifies that valid and fails the test when the observed behavior differs.
    //
    // Arguments:
    //
    //   eventOccurrence (EventOccurrence):
    //     The current event occurrence containing the event type and optional payload values.
    //
    // Returns:
    //
    //   The valid result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static EventOccurrenceValidationResult valid ( EventOccurrence eventOccurrence )
    {

        // Return the newly constructed EventOccurrenceValidationResult instance.

        return new EventOccurrenceValidationResult ( Collections.emptyList (), eventOccurrence );
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

    public static EventOccurrenceValidationResult invalid ( List<Diagnostic> diagnostics )
    {

        // Return the newly constructed EventOccurrenceValidationResult instance.

        return new EventOccurrenceValidationResult ( diagnostics, null );
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

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

    public boolean isValid ()
    {

        // Return the result produced by the delegated operation.

        return this.diagnostics.isEmpty () && this.eventOccurrence != null;
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

    public List<Diagnostic> getDiagnostics ()
    {

        // Return the diagnostics.

        return this.diagnostics;
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

    public Optional<EventOccurrence> getEventOccurrence ()
    {

        // Return the result produced by the delegated operation.

        return Optional.ofNullable ( this.eventOccurrence );
    }
}
