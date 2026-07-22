//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Process-local handoff of the validated optional startup model into the Quarkus application lifecycle.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.service;

import java.util.Optional;

//*********************************************************************************************************************
// Class: StartupModelConfiguration
//
// Description:
//
//   Process-local handoff of the validated optional startup model into the Quarkus application lifecycle.
//
//*********************************************************************************************************************

public final class StartupModelConfiguration
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private static Optional<String> configuredModelJson = Optional.empty ();

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: StartupModelConfiguration
    //
    // Description:
    //
    //   Creates a new StartupModelConfiguration instance from the supplied values and establishes its initial
    //   invariants.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private StartupModelConfiguration ()
    {
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: configure
    //
    // Description:
    //
    //   Performs the configure operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   modelJson (Optional<String>):
    //     The model JSON used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static synchronized void configure ( Optional<String> modelJson )
    {
        configuredModelJson = modelJson;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getConfiguredModelJson
    //
    // Description:
    //
    //   Returns configured model JSON from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested configured model JSON value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    static synchronized Optional<String> getConfiguredModelJson ()
    {

        // Return the configured model json.

        return configuredModelJson;
    }
}
