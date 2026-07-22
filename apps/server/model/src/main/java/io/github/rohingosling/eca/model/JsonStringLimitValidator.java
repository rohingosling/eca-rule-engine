//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Enforces the contract string limit in Unicode code points after Jackson's bounded UTF-16 parsing guard.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.model;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

//*********************************************************************************************************************
// Class: JsonStringLimitValidator
//
// Description:
//
//   Enforces the contract string limit in Unicode code points after Jackson's bounded UTF-16 parsing guard.
//
//*********************************************************************************************************************

final class JsonStringLimitValidator
{
    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: JsonStringLimitValidator
    //
    // Description:
    //
    //   Creates a new JsonStringLimitValidator instance from the supplied values and establishes its initial
    //   invariants.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private JsonStringLimitValidator ()
    {
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: validate
    //
    // Description:
    //
    //   Validates and reports deterministic diagnostics for every detected contract violation.
    //
    // Arguments:
    //
    //   document (JsonNode):
    //     The document used by this operation.
    //
    //   maximumStringLength (int):
    //     The maximum string length used by this operation.
    //
    // Returns:
    //
    //   The deterministic diagnostics produced by validation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    static List<Diagnostic> validate ( JsonNode document, int maximumStringLength )
    {
        List<Diagnostic> diagnostics = new ArrayList<> ();
        validateNode ( document, "", maximumStringLength, diagnostics );

        // Return the diagnostics.

        return diagnostics;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: validateNode
    //
    // Description:
    //
    //   Validates node and reports deterministic diagnostics for every detected contract violation.
    //
    // Arguments:
    //
    //   node (JsonNode):
    //     The node used by this operation.
    //
    //   pointer (String):
    //     The pointer used by this operation.
    //
    //   maximumStringLength (int):
    //     The maximum string length used by this operation.
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static void validateNode (
        JsonNode node, String pointer, int maximumStringLength, List<Diagnostic> diagnostics )
    {
        if ( node.isTextual () )
        {
            if ( node.textValue ().codePointCount ( 0, node.textValue ().length () ) > maximumStringLength )
            {
                diagnostics.add
                (
                    new Diagnostic
                    (
                        "string-limit-exceeded",
                        "The JSON string exceeds the configured code-point limit of " + maximumStringLength + ".",
                        pointer
                    )
                );
            }

            // Return without a value after completing this code path.

            return;
        }

        if ( node.isArray () )
        {
            for ( int itemIndex = 0; itemIndex < node.size (); itemIndex++ )
            {
                validateNode
                (
                    node.get ( itemIndex ),
                    pointer + "/" + itemIndex,
                    maximumStringLength,
                    diagnostics
                );
            }

            // Return without a value after completing this code path.

            return;
        }

        if ( node.isObject () )
        {
            for ( Map.Entry<String, JsonNode> field : node.properties () )
            {
                String fieldPointer = pointer + "/" + escapeJsonPointerSegment ( field.getKey () );

                if ( field.getKey ().codePointCount ( 0, field.getKey ().length () ) > maximumStringLength )
                {
                    diagnostics.add
                    (
                        new Diagnostic
                        (
                            "string-limit-exceeded",
                            "The JSON string exceeds the configured code-point limit of "
                                + maximumStringLength + ".",
                            fieldPointer
                        )
                    );
                }

                validateNode
                (
                    field.getValue (),
                    fieldPointer,
                    maximumStringLength,
                    diagnostics
                );
            }
        }
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
