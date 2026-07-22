//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable current event occurrence supplied to one stateless evaluation.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

//*********************************************************************************************************************
// Class: EventOccurrence
//
// Description:
//
//   Immutable current event occurrence supplied to one stateless evaluation.
//
//*********************************************************************************************************************

public final class EventOccurrence
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final String type;
    private final Map<String, Value> payload;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: EventOccurrence
    //
    // Description:
    //
    //   Creates a new EventOccurrence instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   type (String):
    //     The type value supplied to this operation.
    //
    //   payload (Map<String, Value>):
    //     The payload value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public EventOccurrence ( String type, Map<String, Value> payload )
    {
        this.type    = Objects.requireNonNull ( type, "type" );
        this.payload = Collections.unmodifiableMap ( new LinkedHashMap<> ( payload ) );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: withoutPayload
    //
    // Description:
    //
    //   Performs the without payload operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   type (String):
    //     The type used by this operation.
    //
    // Returns:
    //
    //   The without payload result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static EventOccurrence withoutPayload ( String type )
    {

        // Return the newly constructed EventOccurrence instance.

        return new EventOccurrence ( type, Collections.emptyMap () );
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getType
    //
    // Description:
    //
    //   Returns type from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested type value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String getType ()
    {

        // Return the type.

        return this.type;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getPayload
    //
    // Description:
    //
    //   Returns payload from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested payload value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Map<String, Value> getPayload ()
    {

        // Return the payload.

        return this.payload;
    }
}
