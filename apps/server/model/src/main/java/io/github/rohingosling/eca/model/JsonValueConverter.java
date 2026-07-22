//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Converts Jackson tree values at the model boundary into technology-neutral immutable core values.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.model;

import com.fasterxml.jackson.databind.JsonNode;
import io.github.rohingosling.eca.core.Value;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

//*********************************************************************************************************************
// Class: JsonValueConverter
//
// Description:
//
//   Converts Jackson tree values at the model boundary into technology-neutral immutable core values.
//
//*********************************************************************************************************************

final class JsonValueConverter
{
    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: JsonValueConverter
    //
    // Description:
    //
    //   Creates a new JsonValueConverter instance from the supplied values and establishes its initial invariants.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private JsonValueConverter ()
    {
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: convert
    //
    // Description:
    //
    //   Converts the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   node (JsonNode):
    //     The node used by this operation.
    //
    // Returns:
    //
    //   The convert result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    static Value convert ( JsonNode node )
    {
        if ( node.isNull () )
        {

            // Return the result produced by the delegated operation.

            return Value.nullValue ();
        }

        if ( node.isBoolean () )
        {

            // Return the result produced by the delegated operation.

            return Value.booleanValue ( node.booleanValue () );
        }

        if ( node.isNumber () )
        {

            // Return the result produced by the delegated operation.

            return Value.numberValue ( node.decimalValue () );
        }

        if ( node.isTextual () )
        {

            // Return the result produced by the delegated operation.

            return Value.stringValue ( node.textValue () );
        }

        if ( node.isArray () )
        {
            List<Value> values = new ArrayList<> ();

            for ( JsonNode item : node )
            {
                values.add ( convert ( item ) );
            }

            // Return the result produced by the delegated operation.

            return Value.arrayValue ( values );
        }

        if ( node.isObject () )
        {
            Map<String, Value> values = new LinkedHashMap<> ();
            for ( Map.Entry<String, JsonNode> field : node.properties () )
            {
                values.put ( field.getKey (), convert ( field.getValue () ) );
            }

            // Return the result produced by the delegated operation.

            return Value.objectValue ( values );
        }

        throw new IllegalArgumentException ( "Unsupported JSON value type '" + node.getNodeType () + "'." );
    }
}
