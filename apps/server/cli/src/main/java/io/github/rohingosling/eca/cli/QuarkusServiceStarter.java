//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Boots the Quarkus HTTP runtime after command-line startup configuration has been validated.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.cli;

import io.github.rohingosling.eca.service.StartupModelConfiguration;
import io.quarkus.runtime.Quarkus;

import java.util.Optional;

//*********************************************************************************************************************
// Class: QuarkusServiceStarter
//
// Description:
//
//   Boots the Quarkus HTTP runtime after command-line startup configuration has been validated.
//
//*********************************************************************************************************************

final class QuarkusServiceStarter implements CliServiceStarter
{
    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: start
    //
    // Description:
    //
    //   Starts the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   modelJson (Optional<String>):
    //     The model JSON used by this operation.
    //
    // Returns:
    //
    //   The start result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Override
    public int start ( Optional<String> modelJson ) throws CliInputException
    {
        StartupModelConfiguration.configure ( modelJson );

        try
        {
            Quarkus.run ( EcaHttpApplication.class );

            // Return the success.

            return CliExitCode.SUCCESS;
        }
        catch ( RuntimeException exception )
        {
            throw new CliInputException
            (
                CliExitCode.CONFIGURATION_ERROR,
                "The HTTP service failed to start."
            );
        }
    }
}
