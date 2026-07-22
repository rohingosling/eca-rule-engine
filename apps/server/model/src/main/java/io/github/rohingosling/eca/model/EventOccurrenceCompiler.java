//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Bounded JSON parsing and structural validation for one event occurrence.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.model;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.rohingosling.eca.core.EventOccurrence;
import io.github.rohingosling.eca.core.Value;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;

//*********************************************************************************************************************
// Class: EventOccurrenceCompiler
//
// Description:
//
//   Bounded JSON parsing and structural validation for one event occurrence.
//
//*********************************************************************************************************************

public final class EventOccurrenceCompiler
{
    //=================================================================================================================
    // Constants
    //=================================================================================================================

    private static final Pattern IDENTIFIER_PATTERN = Pattern.compile ( "[A-Za-z][A-Za-z0-9._-]{0,127}" );
    private static final Set<String> FIELD_NAMES     = Set.of ( "type", "payload" );

    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final ModelLimits limits;
    private final ObjectMapper objectMapper;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/2: EventOccurrenceCompiler
    //
    // Description:
    //
    //   Creates a new EventOccurrenceCompiler instance from the supplied values and establishes its initial
    //   invariants.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public EventOccurrenceCompiler ()
    {
        this ( ModelLimits.defaults () );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 2/2: EventOccurrenceCompiler
    //
    // Description:
    //
    //   Creates a new EventOccurrenceCompiler instance from the supplied values and establishes its initial
    //   invariants.
    //
    // Arguments:
    //
    //   limits (ModelLimits):
    //     The limits collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public EventOccurrenceCompiler ( ModelLimits limits )
    {
        this.limits       = Objects.requireNonNull ( limits, "limits" );
        this.objectMapper = JsonParserFactory.create ( limits );
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: compile
    //
    // Description:
    //
    //   Compiles the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   eventJson (String):
    //     The event JSON used by this operation.
    //
    // Returns:
    //
    //   The compile result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public EventOccurrenceValidationResult compile ( String eventJson )
    {
        Objects.requireNonNull ( eventJson, "eventJson" );

        if ( eventJson.getBytes ( StandardCharsets.UTF_8 ).length > this.limits.getMaximumRequestBytes () )
        {

            // Return the result produced by the delegated operation.

            return invalid ( "event-byte-limit-exceeded", "The event exceeds the configured byte limit.", "" );
        }

        JsonNode event;

        try
        {
            event = this.objectMapper.readTree ( eventJson );
        }
        catch ( JsonProcessingException exception )
        {

            // Return the result produced by the delegated operation.

            return invalid ( "invalid-json", "The event document is not valid JSON.", "" );
        }

        if ( event == null )
        {

            // Return the result produced by the delegated operation.

            return invalid ( "invalid-json", "The event document is empty.", "" );
        }

        // Return the result produced by the delegated operation.

        return this.compile ( event );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: compile
    //
    // Description:
    //
    //   Compiles the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   event (JsonNode):
    //     The event used by this operation.
    //
    // Returns:
    //
    //   The compile result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public EventOccurrenceValidationResult compile ( JsonNode event )
    {
        Objects.requireNonNull ( event, "event" );

        List<Diagnostic> diagnostics = JsonStringLimitValidator.validate
        (
            event,
            this.limits.getMaximumStringLength ()
        );
        diagnostics.addAll ( this.validate ( event ) );

        if ( !diagnostics.isEmpty () )
        {

            // Return the result produced by the delegated operation.

            return EventOccurrenceValidationResult.invalid ( diagnostics );
        }

        // Return the result produced by the delegated operation.

        return EventOccurrenceValidationResult.valid ( this.compileEventOccurrence ( event ) );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: validate
    //
    // Description:
    //
    //   Validates and reports deterministic diagnostics for every detected contract violation.
    //
    // Arguments:
    //
    //   event (JsonNode):
    //     The event used by this operation.
    //
    // Returns:
    //
    //   The deterministic diagnostics produced by validation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private List<Diagnostic> validate ( JsonNode event )
    {
        List<Diagnostic> diagnostics = new ArrayList<> ();

        if ( !event.isObject () )
        {
            diagnostics.add ( new Diagnostic ( "event-object-required", "The event must be a JSON object.", "" ) );

            // Return the diagnostics.

            return diagnostics;
        }

        event.fieldNames ().forEachRemaining
        (
            fieldName ->
            {
                if ( !FIELD_NAMES.contains ( fieldName ) )
                {
                    diagnostics.add
                    (
                        new Diagnostic
                        (
                            "unknown-event-property",
                            "The event property '" + fieldName + "' is not supported.",
                            "/" + escapeJsonPointerSegment ( fieldName )
                        )
                    );
                }
            }
        );

        JsonNode type = event.get ( "type" );

        if ( type == null )
        {
            diagnostics.add ( new Diagnostic ( "event-type-required", "The event type is required.", "/type" ) );
        }
        else if ( !type.isTextual () || !IDENTIFIER_PATTERN.matcher ( type.textValue () ).matches () )
        {
            diagnostics.add
            (
                new Diagnostic ( "invalid-event-type", "The event type must be a version 1 identifier.", "/type" )
            );
        }

        JsonNode payload = event.get ( "payload" );

        if ( payload != null && !payload.isObject () )
        {
            diagnostics.add
            (
                new Diagnostic ( "invalid-event-payload", "The event payload must be a JSON object.", "/payload" )
            );
        }
        else if ( payload != null )
        {
            if ( payload.size () > this.limits.getMaximumPayloadValues () )
            {
                diagnostics.add
                (
                    new Diagnostic
                    (
                        "event-payload-limit-exceeded",
                        "The event payload exceeds the maximum property count.",
                        "/payload"
                    )
                );
            }

            payload.fieldNames ().forEachRemaining
            (
                parameterIdentifier ->
                {
                    if ( !IDENTIFIER_PATTERN.matcher ( parameterIdentifier ).matches () )
                    {
                        diagnostics.add
                        (
                            new Diagnostic
                            (
                                "invalid-event-payload-parameter-identifier",
                                "The event payload property '" + parameterIdentifier
                                    + "' must be a version 1 identifier.",
                                "/payload/" + escapeJsonPointerSegment ( parameterIdentifier )
                            )
                        );
                    }
                }
            );
        }

        // Return the diagnostics.

        return diagnostics;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: compileEventOccurrence
    //
    // Description:
    //
    //   Compiles event occurrence using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   event (JsonNode):
    //     The event used by this operation.
    //
    // Returns:
    //
    //   The compile event occurrence result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private EventOccurrence compileEventOccurrence ( JsonNode event )
    {
        Map<String, Value> payload = new LinkedHashMap<> ();
        JsonNode payloadNode = event.get ( "payload" );

        if ( payloadNode != null )
        {
            for ( Map.Entry<String, JsonNode> field : payloadNode.properties () )
            {
                payload.put ( field.getKey (), JsonValueConverter.convert ( field.getValue () ) );
            }
        }

        // Return the newly constructed EventOccurrence instance.

        return new EventOccurrence ( event.get ( "type" ).textValue (), payload );
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
    //   code (String):
    //     The code used by this operation.
    //
    //   message (String):
    //     The message used by this operation.
    //
    //   pointer (String):
    //     The pointer used by this operation.
    //
    // Returns:
    //
    //   The invalid result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static EventOccurrenceValidationResult invalid ( String code, String message, String pointer )
    {

        // Return the result produced by the delegated operation.

        return EventOccurrenceValidationResult.invalid ( List.of ( new Diagnostic ( code, message, pointer ) ) );
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
