//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Exact byte-boundary and strict UTF-8 tests for HTTP request document ingestion.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.service;

import io.github.rohingosling.eca.model.ModelLimits;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

//*********************************************************************************************************************
// Class: RequestDocumentReaderTest
//
// Description:
//
//   Exact byte-boundary and strict UTF-8 tests for HTTP request document ingestion.
//
//*********************************************************************************************************************

class RequestDocumentReaderTest
{
    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: exactByteLimitIsAcceptedAndTheNextByteIsRejected
    //
    // Description:
    //
    //   Performs the exact byte limit is accepted and the next byte is rejected operation using the supplied inputs
    //   and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void exactByteLimitIsAcceptedAndTheNextByteIsRejected ()
    {
        RequestDocumentReader reader = new RequestDocumentReader ( createConfiguration ( 4 ) );
        RequestDocument exactResult = reader.read ( stream ( "1234".getBytes ( StandardCharsets.UTF_8 ) ) );
        RequestDocument excessiveResult = reader.read ( stream ( "12345".getBytes ( StandardCharsets.UTF_8 ) ) );

        assertThat ( exactResult.tooLarge () ).isFalse ();
        assertThat ( exactResult.malformed () ).isFalse ();
        assertThat ( exactResult.json () ).isEqualTo ( "1234" );
        assertThat ( excessiveResult.tooLarge () ).isTrue ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: malformedUtf8IsRejectedBeforeJsonParsing
    //
    // Description:
    //
    //   Performs the malformed utf8 is rejected before JSON parsing operation using the supplied inputs and current
    //   state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void malformedUtf8IsRejectedBeforeJsonParsing ()
    {
        RequestDocumentReader reader = new RequestDocumentReader ( createConfiguration ( 4 ) );
        RequestDocument result = reader.read
        (
            stream
            (
                new byte[]
                {
                    (byte) 0xC3, (byte) 0x28
                }
            )
        );

        assertThat ( result.malformed () ).isTrue ();
        assertThat ( result.tooLarge () ).isFalse ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: stream
    //
    // Description:
    //
    //   Performs the stream operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   bytes (byte[]):
    //     The bytes collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The stream result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static ByteArrayInputStream stream ( byte[] bytes )
    {

        // Return the newly constructed ByteArrayInputStream instance.

        return new ByteArrayInputStream ( bytes );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: createConfiguration
    //
    // Description:
    //
    //   Constructs configuration from the supplied inputs without mutating the caller's source values.
    //
    // Arguments:
    //
    //   maximumRequestBytes (int):
    //     The maximum request bytes collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static ServiceConfiguration createConfiguration ( int maximumRequestBytes )
    {

        // Return the newly constructed ServiceConfiguration instance.

        return new ServiceConfiguration
        (
            maximumRequestBytes,
            ModelLimits.DEFAULT_MAXIMUM_JSON_DEPTH,
            ModelLimits.DEFAULT_MAXIMUM_STRING_LENGTH,
            ModelLimits.DEFAULT_MAXIMUM_EVENTS,
            ModelLimits.DEFAULT_MAXIMUM_CONDITIONS,
            ModelLimits.DEFAULT_MAXIMUM_ACTIONS,
            ModelLimits.DEFAULT_MAXIMUM_RULES,
            ModelLimits.DEFAULT_MAXIMUM_PAYLOAD_VALUES,
            true,
            "https://client.example"
        );
    }
}
