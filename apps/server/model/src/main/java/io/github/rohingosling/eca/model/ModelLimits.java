//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable parser and model limits for the version 1 demonstration profile.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.model;

//*********************************************************************************************************************
// Class: ModelLimits
//
// Description:
//
//   Immutable parser and model limits for the version 1 demonstration profile.
//
//*********************************************************************************************************************

public final class ModelLimits
{
    //=================================================================================================================
    // Constants
    //=================================================================================================================

    public static final int DEFAULT_MAXIMUM_REQUEST_BYTES  = 1_048_576;
    public static final int DEFAULT_MAXIMUM_JSON_DEPTH     = 32;
    public static final int DEFAULT_MAXIMUM_STRING_LENGTH  = 16_384;
    public static final int DEFAULT_MAXIMUM_PARAMETERS     = 10_000;
    public static final int DEFAULT_MAXIMUM_PAYLOADS       = 10_000;
    public static final int DEFAULT_MAXIMUM_EVENTS         = 10_000;
    public static final int DEFAULT_MAXIMUM_CONDITIONS     = 100_000;
    public static final int DEFAULT_MAXIMUM_ACTIONS        = 10_000;
    public static final int DEFAULT_MAXIMUM_RULES          = 100_000;
    public static final int DEFAULT_MAXIMUM_PAYLOAD_VALUES = 256;

    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final int maximumRequestBytes;
    private final int maximumJsonDepth;
    private final int maximumStringLength;
    private final int maximumParameters;
    private final int maximumPayloads;
    private final int maximumEvents;
    private final int maximumConditions;
    private final int maximumActions;
    private final int maximumRules;
    private final int maximumPayloadValues;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/3: ModelLimits
    //
    // Description:
    //
    //   Creates a new ModelLimits instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   maximumRequestBytes (int):
    //     The maximum request bytes collection inspected or transformed by this operation.
    //
    //   maximumJsonDepth (int):
    //     The maximum JSON depth value supplied to this operation.
    //
    //   maximumStringLength (int):
    //     The maximum string length value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ModelLimits ( int maximumRequestBytes, int maximumJsonDepth, int maximumStringLength )
    {
        this
        (
            maximumRequestBytes,
            maximumJsonDepth,
            maximumStringLength,
            DEFAULT_MAXIMUM_PARAMETERS,
            DEFAULT_MAXIMUM_PAYLOADS,
            DEFAULT_MAXIMUM_EVENTS,
            DEFAULT_MAXIMUM_CONDITIONS,
            DEFAULT_MAXIMUM_ACTIONS,
            DEFAULT_MAXIMUM_RULES,
            DEFAULT_MAXIMUM_PAYLOAD_VALUES
        );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 2/3: ModelLimits
    //
    // Description:
    //
    //   Creates a new ModelLimits instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   maximumRequestBytes (int):
    //     The maximum request bytes collection inspected or transformed by this operation.
    //
    //   maximumJsonDepth (int):
    //     The maximum JSON depth value supplied to this operation.
    //
    //   maximumStringLength (int):
    //     The maximum string length value supplied to this operation.
    //
    //   maximumEvents (int):
    //     The maximum events collection inspected or transformed by this operation.
    //
    //   maximumConditions (int):
    //     The maximum conditions collection inspected or transformed by this operation.
    //
    //   maximumActions (int):
    //     The maximum actions collection inspected or transformed by this operation.
    //
    //   maximumRules (int):
    //     The maximum rules collection inspected or transformed by this operation.
    //
    //   maximumPayloadValues (int):
    //     The maximum payload values collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ModelLimits (
        int maximumRequestBytes, int maximumJsonDepth, int maximumStringLength, int maximumEvents,
        int maximumConditions, int maximumActions, int maximumRules, int maximumPayloadValues )
    {
        this
        (
            maximumRequestBytes,
            maximumJsonDepth,
            maximumStringLength,
            DEFAULT_MAXIMUM_PARAMETERS,
            DEFAULT_MAXIMUM_PAYLOADS,
            maximumEvents,
            maximumConditions,
            maximumActions,
            maximumRules,
            maximumPayloadValues
        );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 3/3: ModelLimits
    //
    // Description:
    //
    //   Creates a new ModelLimits instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   maximumRequestBytes (int):
    //     The maximum request bytes collection inspected or transformed by this operation.
    //
    //   maximumJsonDepth (int):
    //     The maximum JSON depth value supplied to this operation.
    //
    //   maximumStringLength (int):
    //     The maximum string length value supplied to this operation.
    //
    //   maximumParameters (int):
    //     The maximum parameters collection inspected or transformed by this operation.
    //
    //   maximumPayloads (int):
    //     The maximum payloads collection inspected or transformed by this operation.
    //
    //   maximumEvents (int):
    //     The maximum events collection inspected or transformed by this operation.
    //
    //   maximumConditions (int):
    //     The maximum conditions collection inspected or transformed by this operation.
    //
    //   maximumActions (int):
    //     The maximum actions collection inspected or transformed by this operation.
    //
    //   maximumRules (int):
    //     The maximum rules collection inspected or transformed by this operation.
    //
    //   maximumPayloadValues (int):
    //     The maximum payload values collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ModelLimits (
        int maximumRequestBytes, int maximumJsonDepth, int maximumStringLength, int maximumParameters,
        int maximumPayloads, int maximumEvents, int maximumConditions, int maximumActions, int maximumRules,
        int maximumPayloadValues )
    {
        if ( maximumRequestBytes < 1 || maximumJsonDepth < 1 || maximumStringLength < 1
            || maximumParameters < 1 || maximumPayloads < 1 || maximumEvents < 1 || maximumConditions < 1
            || maximumActions < 1 || maximumRules < 1 || maximumPayloadValues < 1 )
        {
            throw new IllegalArgumentException ( "Every model limit must be positive." );
        }
        if ( maximumPayloadValues > DEFAULT_MAXIMUM_PAYLOAD_VALUES )
        {
            throw new IllegalArgumentException
            (
                "The maximum payload property count cannot exceed the version 1 contract limit of "
                    + DEFAULT_MAXIMUM_PAYLOAD_VALUES + "."
            );
        }

        this.maximumRequestBytes  = maximumRequestBytes;
        this.maximumJsonDepth     = maximumJsonDepth;
        this.maximumStringLength  = maximumStringLength;
        this.maximumParameters    = maximumParameters;
        this.maximumPayloads      = maximumPayloads;
        this.maximumEvents        = maximumEvents;
        this.maximumConditions    = maximumConditions;
        this.maximumActions       = maximumActions;
        this.maximumRules         = maximumRules;
        this.maximumPayloadValues = maximumPayloadValues;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: defaults
    //
    // Description:
    //
    //   Performs the defaults operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The defaults result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static ModelLimits defaults ()
    {

        // Return the newly constructed ModelLimits instance.

        return new ModelLimits
        (
            DEFAULT_MAXIMUM_REQUEST_BYTES,
            DEFAULT_MAXIMUM_JSON_DEPTH,
            DEFAULT_MAXIMUM_STRING_LENGTH,
            DEFAULT_MAXIMUM_PARAMETERS,
            DEFAULT_MAXIMUM_PAYLOADS,
            DEFAULT_MAXIMUM_EVENTS,
            DEFAULT_MAXIMUM_CONDITIONS,
            DEFAULT_MAXIMUM_ACTIONS,
            DEFAULT_MAXIMUM_RULES,
            DEFAULT_MAXIMUM_PAYLOAD_VALUES
        );
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getMaximumRequestBytes
    //
    // Description:
    //
    //   Returns maximum request bytes from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested maximum request bytes value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public int getMaximumRequestBytes ()
    {

        // Return the maximum request bytes.

        return this.maximumRequestBytes;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getMaximumJsonDepth
    //
    // Description:
    //
    //   Returns maximum JSON depth from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested maximum JSON depth value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public int getMaximumJsonDepth ()
    {

        // Return the maximum json depth.

        return this.maximumJsonDepth;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getMaximumStringLength
    //
    // Description:
    //
    //   Returns maximum string length from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested maximum string length value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public int getMaximumStringLength ()
    {

        // Return the maximum string length.

        return this.maximumStringLength;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getMaximumParameters
    //
    // Description:
    //
    //   Returns maximum parameters from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested maximum parameters value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public int getMaximumParameters ()
    {

        // Return the maximum parameters.

        return this.maximumParameters;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getMaximumPayloads
    //
    // Description:
    //
    //   Returns maximum payloads from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested maximum payloads value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public int getMaximumPayloads ()
    {

        // Return the maximum payloads.

        return this.maximumPayloads;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getMaximumEvents
    //
    // Description:
    //
    //   Returns maximum events from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested maximum events value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public int getMaximumEvents ()
    {

        // Return the maximum events.

        return this.maximumEvents;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getMaximumConditions
    //
    // Description:
    //
    //   Returns maximum conditions from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested maximum conditions value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public int getMaximumConditions ()
    {

        // Return the maximum conditions.

        return this.maximumConditions;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getMaximumActions
    //
    // Description:
    //
    //   Returns maximum actions from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested maximum actions value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public int getMaximumActions ()
    {

        // Return the maximum actions.

        return this.maximumActions;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getMaximumRules
    //
    // Description:
    //
    //   Returns maximum rules from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested maximum rules value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public int getMaximumRules ()
    {

        // Return the maximum rules.

        return this.maximumRules;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getMaximumPayloadValues
    //
    // Description:
    //
    //   Returns maximum payload values from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested maximum payload values value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public int getMaximumPayloadValues ()
    {

        // Return the maximum payload values.

        return this.maximumPayloadValues;
    }
}
