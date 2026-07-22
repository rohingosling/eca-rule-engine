//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Creates consistently bounded and duplicate-detecting JSON parsers for model-boundary documents.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.model;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.StreamReadConstraints;
import com.fasterxml.jackson.core.StreamReadFeature;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

//*********************************************************************************************************************
// Class: JsonParserFactory
//
// Description:
//
//   Creates consistently bounded and duplicate-detecting JSON parsers for model-boundary documents.
//
//*********************************************************************************************************************

public final class JsonParserFactory
{
    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: JsonParserFactory
    //
    // Description:
    //
    //   Creates a new JsonParserFactory instance from the supplied values and establishes its initial invariants.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private JsonParserFactory ()
    {
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: create
    //
    // Description:
    //
    //   Constructs create from the supplied inputs without mutating the caller's source values.
    //
    // Arguments:
    //
    //   limits (ModelLimits):
    //     The limits collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static ObjectMapper create ( ModelLimits limits )
    {
        int doubledMaximumStringLength = limits.getMaximumStringLength () > Integer.MAX_VALUE / 2
            ? Integer.MAX_VALUE
            : limits.getMaximumStringLength () * 2;
        int maximumParserStringLength = Math.max
        (
            doubledMaximumStringLength,
            limits.getMaximumRequestBytes ()
        );
        StreamReadConstraints constraints = StreamReadConstraints.builder ()
            .maxNestingDepth ( limits.getMaximumJsonDepth () )
            .maxNumberLength ( limits.getMaximumRequestBytes () )
            .maxStringLength ( maximumParserStringLength )
            .maxNameLength ( maximumParserStringLength )
            .build ();
        JsonFactory jsonFactory = JsonFactory.builder ()
            .streamReadConstraints ( constraints )
            .enable ( StreamReadFeature.STRICT_DUPLICATE_DETECTION )
            .build ();
        ObjectMapper objectMapper = new ObjectMapper ( jsonFactory );
        objectMapper.enable ( DeserializationFeature.FAIL_ON_TRAILING_TOKENS );
        objectMapper.enable ( DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS );

        // Return the object mapper.

        return objectMapper;
    }
}
