//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Reads one bounded HTTP request body and rejects malformed UTF-8 before JSON parsing.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;

//*********************************************************************************************************************
// Class: RequestDocumentReader
//
// Description:
//
//   Reads one bounded HTTP request body and rejects malformed UTF-8 before JSON parsing.
//
//*********************************************************************************************************************

@ApplicationScoped
final class RequestDocumentReader
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final ServiceConfiguration configuration;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/2: RequestDocumentReader
    //
    // Description:
    //
    //   Creates a new RequestDocumentReader instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   configuration (ServiceConfiguration):
    //     The configuration value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Inject
    RequestDocumentReader ( ServiceConfiguration configuration )
    {
        this.configuration = configuration;
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: read
    //
    // Description:
    //
    //   Reads the supplied representation and returns its normalized in-memory form.
    //
    // Arguments:
    //
    //   requestBody (InputStream):
    //     The request body used by this operation.
    //
    // Returns:
    //
    //   The read result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    RequestDocument read ( InputStream requestBody )
    {
        if ( requestBody == null )
        {

            // Return the result produced by the delegated operation.

            return RequestDocument.malformedDocument ();
        }

        int maximumRequestBytes = this.configuration.getModelLimits ().getMaximumRequestBytes ();
        int boundedReadLength = maximumRequestBytes == Integer.MAX_VALUE
            ? Integer.MAX_VALUE
            : maximumRequestBytes + 1;

        try
        {
            byte[] documentBytes = requestBody.readNBytes ( boundedReadLength );

            if ( documentBytes.length > maximumRequestBytes )
            {

                // Return the result produced by the delegated operation.

                return RequestDocument.oversizedDocument ();
            }

            String json = StandardCharsets.UTF_8.newDecoder ()
                .onMalformedInput ( CodingErrorAction.REPORT )
                .onUnmappableCharacter ( CodingErrorAction.REPORT )
                .decode ( ByteBuffer.wrap ( documentBytes ) )
                .toString ();

            // Return the result produced by the delegated operation.

            return RequestDocument.validDocument ( json );
        }
        catch ( IOException exception )
        {

            // Return the result produced by the delegated operation.

            return RequestDocument.malformedDocument ();
        }
    }
}

//*********************************************************************************************************************
// Class: RequestDocument
//
// Description:
//
//   Encapsulates request document state and behavior.
//
//*********************************************************************************************************************

final class RequestDocument
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final String json;
    private final boolean tooLarge;
    private final boolean malformed;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 2/2: RequestDocument
    //
    // Description:
    //
    //   Creates a new RequestDocument instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   json (String):
    //     The JSON value supplied to this operation.
    //
    //   tooLarge (boolean):
    //     The too large value supplied to this operation.
    //
    //   malformed (boolean):
    //     The malformed value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private RequestDocument ( String json, boolean tooLarge, boolean malformed )
    {
        this.json      = json;
        this.tooLarge  = tooLarge;
        this.malformed = malformed;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: validDocument
    //
    // Description:
    //
    //   Verifies that valid document and fails the test when the observed behavior differs.
    //
    // Arguments:
    //
    //   json (String):
    //     The JSON used by this operation.
    //
    // Returns:
    //
    //   The valid document result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    static RequestDocument validDocument ( String json )
    {

        // Return the newly constructed RequestDocument instance.

        return new RequestDocument ( json, false, false );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: oversizedDocument
    //
    // Description:
    //
    //   Performs the oversized document operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The oversized document result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    static RequestDocument oversizedDocument ()
    {

        // Return the newly constructed RequestDocument instance.

        return new RequestDocument ( "", true, false );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: malformedDocument
    //
    // Description:
    //
    //   Performs the malformed document operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The malformed document result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    static RequestDocument malformedDocument ()
    {

        // Return the newly constructed RequestDocument instance.

        return new RequestDocument ( "", false, true );
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: json
    //
    // Description:
    //
    //   Performs the JSON operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The JSON result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    String json ()
    {

        // Return the json.

        return this.json;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: tooLarge
    //
    // Description:
    //
    //   Performs the too large operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The too large result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    boolean tooLarge ()
    {

        // Return the too large.

        return this.tooLarge;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: malformed
    //
    // Description:
    //
    //   Performs the malformed operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The malformed result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    boolean malformed ()
    {

        // Return the malformed.

        return this.malformed;
    }
}
