//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Parser-limit and structural-validation tests for event-occurrence JSON documents.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.model;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

//*********************************************************************************************************************
// Class: EventOccurrenceCompilerTest
//
// Description:
//
//   Parser-limit and structural-validation tests for event-occurrence JSON documents.
//
//*********************************************************************************************************************

class EventOccurrenceCompilerTest
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final EventOccurrenceCompiler compiler = new EventOccurrenceCompiler ();

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: validOccurrenceCompilesPayloadValues
    //
    // Description:
    //
    //   Verifies that valid occurrence compiles payload values and fails the test when the observed behavior differs.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void validOccurrenceCompilesPayloadValues ()
    {
        EventOccurrenceValidationResult result = this.compiler.compile
        (
            "{\"type\":\"signal.received\",\"payload\":{\"level\":12}}"
        );

        assertThat ( result.isValid () ).isTrue ();
        assertThat ( result.getEventOccurrence ().orElseThrow ().getType () ).isEqualTo ( "signal.received" );
        assertThat ( result.getEventOccurrence ().orElseThrow ().getPayload () ).containsKey ( "level" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: payloadPropertyNamesMustBeParameterIdentifiers
    //
    // Description:
    //
    //   Performs the payload property names must be parameter identifiers operation using the supplied inputs and
    //   current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void payloadPropertyNamesMustBeParameterIdentifiers ()
    {
        EventOccurrenceValidationResult result = this.compiler.compile
        (
            "{\"type\":\"signal.received\",\"payload\":{\"bad/parameter\":12}}"
        );

        assertThat ( result.isValid () ).isFalse ();
        assertThat ( result.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "invalid-event-payload-parameter-identifier" );
        assertThat ( result.getDiagnostics () ).extracting ( Diagnostic::getPointer )
            .containsExactly ( "/payload/bad~1parameter" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: largeExponentNumberCompilesExactly
    //
    // Description:
    //
    //   Verifies that large exponent number compiles exactly and fails the test when the observed behavior differs.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void largeExponentNumberCompilesExactly ()
    {
        EventOccurrenceValidationResult exponentResult = this.compiler.compile
        (
            "{\"type\":\"signal.received\",\"payload\":{\"level\":1e400}}"
        );
        String largeInteger = "9".repeat ( 1_200 );
        EventOccurrenceValidationResult largeIntegerResult = this.compiler.compile
        (
            "{\"type\":\"signal.received\",\"payload\":{\"level\":" + largeInteger + "}}"
        );

        assertThat ( exponentResult.isValid () ).isTrue ();
        assertThat ( exponentResult.getEventOccurrence ().orElseThrow ().getPayload ().get ( "level" ).asNumber () )
            .isEqualByComparingTo ( new BigDecimal ( "1e400" ) );
        assertThat ( largeIntegerResult.isValid () ).isTrue ();
        assertThat ( largeIntegerResult.getEventOccurrence ().orElseThrow ().getPayload ().get ( "level" ).asNumber () )
            .isEqualByComparingTo ( new BigDecimal ( largeInteger ) );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: malformedAndDuplicateJsonAreParserFailures
    //
    // Description:
    //
    //   Performs the malformed and duplicate JSON are parser failures operation using the supplied inputs and current
    //   state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void malformedAndDuplicateJsonAreParserFailures ()
    {
        EventOccurrenceValidationResult malformedResult = this.compiler.compile ( "{" );
        EventOccurrenceValidationResult duplicateResult = this.compiler.compile
        (
            "{\"type\":\"first\",\"type\":\"second\"}"
        );
        EventOccurrenceValidationResult trailingTokenResult = this.compiler.compile
        (
            "{\"type\":\"first\"} {\"type\":\"second\"}"
        );
        EventOccurrenceValidationResult trailingWhitespaceResult = this.compiler.compile
        (
            "{\"type\":\"first\"}\n\t"
        );

        assertThat ( malformedResult.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "invalid-json" );
        assertThat ( malformedResult.getDiagnostics () ).extracting ( Diagnostic::getMessage )
            .containsExactly ( "The event document is not valid JSON." );
        assertThat ( duplicateResult.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "invalid-json" );
        assertThat ( trailingTokenResult.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "invalid-json" );
        assertThat ( trailingWhitespaceResult.isValid () ).isTrue ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: stringLimitCountsUnicodeCodePoints
    //
    // Description:
    //
    //   Verifies that string limit counts unicode code points and fails the test when the observed behavior differs.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void stringLimitCountsUnicodeCodePoints ()
    {
        ModelLimits limits = new ModelLimits
        (
            ModelLimits.DEFAULT_MAXIMUM_REQUEST_BYTES,
            ModelLimits.DEFAULT_MAXIMUM_JSON_DEPTH,
            100
        );
        EventOccurrenceCompiler limitedCompiler = new EventOccurrenceCompiler ( limits );
        String supplementaryCharacters = "\uD83D\uDE00".repeat ( 80 );
        String excessiveCharacters = "x".repeat ( 101 );

        EventOccurrenceValidationResult supplementaryResult = limitedCompiler.compile
        (
            "{\"type\":\"signal.received\",\"payload\":{\"label\":\"" + supplementaryCharacters + "\"}}"
        );
        EventOccurrenceValidationResult excessiveResult = limitedCompiler.compile
        (
            "{\"type\":\"signal.received\",\"payload\":{\"label\":\"" + excessiveCharacters + "\"}}"
        );

        assertThat ( supplementaryResult.isValid () ).isTrue ();
        assertThat ( excessiveResult.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "string-limit-exceeded" );
        assertThat ( excessiveResult.getDiagnostics () ).extracting ( Diagnostic::getPointer )
            .containsExactly ( "/payload/label" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: jsonDepthAcceptsTheExactLimitAndRejectsTheNextLevel
    //
    // Description:
    //
    //   Performs the JSON depth accepts the exact limit and rejects the next level operation using the supplied inputs
    //   and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void jsonDepthAcceptsTheExactLimitAndRejectsTheNextLevel ()
    {
        ModelLimits limits = new ModelLimits
        (
            ModelLimits.DEFAULT_MAXIMUM_REQUEST_BYTES,
            3,
            ModelLimits.DEFAULT_MAXIMUM_STRING_LENGTH
        );
        EventOccurrenceCompiler limitedCompiler = new EventOccurrenceCompiler ( limits );
        EventOccurrenceValidationResult exactLimitResult = limitedCompiler.compile
        (
            "{\"type\":\"event.one\",\"payload\":{\"value\":{}}}"
        );
        EventOccurrenceValidationResult excessiveDepthResult = limitedCompiler.compile
        (
            "{\"type\":\"event.one\",\"payload\":{\"value\":{\"nested\":{}}}}"
        );

        assertThat ( exactLimitResult.isValid () ).isTrue ();
        assertThat ( excessiveDepthResult.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "invalid-json" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: eventByteLimitAcceptsTheExactBoundaryAndRejectsOneByteLess
    //
    // Description:
    //
    //   Performs the event byte limit accepts the exact boundary and rejects one byte less operation using the
    //   supplied inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void eventByteLimitAcceptsTheExactBoundaryAndRejectsOneByteLess ()
    {
        String eventJson = "{\"type\":\"event.one\"}";
        int eventBytes = eventJson.getBytes ( java.nio.charset.StandardCharsets.UTF_8 ).length;
        EventOccurrenceCompiler exactLimitCompiler = new EventOccurrenceCompiler
        (
            new ModelLimits ( eventBytes, 32, 16_384 )
        );
        EventOccurrenceCompiler smallerLimitCompiler = new EventOccurrenceCompiler
        (
            new ModelLimits ( eventBytes - 1, 32, 16_384 )
        );

        assertThat ( exactLimitCompiler.compile ( eventJson ).isValid () ).isTrue ();
        assertThat ( smallerLimitCompiler.compile ( eventJson ).getDiagnostics () )
            .extracting ( Diagnostic::getCode )
            .containsExactly ( "event-byte-limit-exceeded" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: structuralFailuresAreOrderedByPointer
    //
    // Description:
    //
    //   Performs the structural failures are ordered by pointer operation using the supplied inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void structuralFailuresAreOrderedByPointer ()
    {
        EventOccurrenceValidationResult result = this.compiler.compile
        (
            "{\"payload\":[],\"unsupported\":true}"
        );

        assertThat ( result.isValid () ).isFalse ();
        assertThat ( result.getDiagnostics () ).extracting ( Diagnostic::getPointer )
            .containsExactly ( "/payload", "/type", "/unsupported" );
        assertThat ( result.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "invalid-event-payload", "event-type-required", "unknown-event-property" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: configurablePayloadLimitRejectsOversizedOccurrences
    //
    // Description:
    //
    //   Performs the configurable payload limit rejects oversized occurrences operation using the supplied inputs and
    //   current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void configurablePayloadLimitRejectsOversizedOccurrences ()
    {
        ModelLimits limits = new ModelLimits
        (
            ModelLimits.DEFAULT_MAXIMUM_REQUEST_BYTES,
            ModelLimits.DEFAULT_MAXIMUM_JSON_DEPTH,
            ModelLimits.DEFAULT_MAXIMUM_STRING_LENGTH,
            ModelLimits.DEFAULT_MAXIMUM_EVENTS,
            ModelLimits.DEFAULT_MAXIMUM_CONDITIONS,
            ModelLimits.DEFAULT_MAXIMUM_ACTIONS,
            ModelLimits.DEFAULT_MAXIMUM_RULES,
            1
        );
        EventOccurrenceCompiler limitedCompiler = new EventOccurrenceCompiler ( limits );
        EventOccurrenceValidationResult result = limitedCompiler.compile
        (
            "{\"type\":\"signal.received\",\"payload\":{\"level\":12,\"source\":\"sensor\"}}"
        );

        assertThat ( result.isValid () ).isFalse ();
        assertThat ( result.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "event-payload-limit-exceeded" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: payloadConfigurationCannotExceedThePublishedContract
    //
    // Description:
    //
    //   Performs the payload configuration cannot exceed the published contract operation using the supplied inputs
    //   and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void payloadConfigurationCannotExceedThePublishedContract ()
    {
        assertThatThrownBy
        (
            () -> new ModelLimits
            (
                ModelLimits.DEFAULT_MAXIMUM_REQUEST_BYTES,
                ModelLimits.DEFAULT_MAXIMUM_JSON_DEPTH,
                ModelLimits.DEFAULT_MAXIMUM_STRING_LENGTH,
                ModelLimits.DEFAULT_MAXIMUM_EVENTS,
                ModelLimits.DEFAULT_MAXIMUM_CONDITIONS,
                ModelLimits.DEFAULT_MAXIMUM_ACTIONS,
                ModelLimits.DEFAULT_MAXIMUM_RULES,
                ModelLimits.DEFAULT_MAXIMUM_PAYLOAD_VALUES + 1
            )
        )
            .isInstanceOf ( IllegalArgumentException.class )
            .hasMessageContaining ( "version 1 contract limit" );
    }
}
