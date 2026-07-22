//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Quarkus application lifecycle used only by the command-line start operation.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.cli;

import io.quarkus.runtime.Quarkus;
import io.quarkus.runtime.QuarkusApplication;

//*********************************************************************************************************************
// Class: EcaHttpApplication
//
// Description:
//
//   Quarkus application lifecycle used only by the command-line start operation.
//
//*********************************************************************************************************************

public final class EcaHttpApplication implements QuarkusApplication
{
    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: run
    //
    // Description:
    //
    //   Runs the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   arguments (String...):
    //     The arguments collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The run result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Override
    public int run ( String... arguments )
    {
        Quarkus.waitForExit ();

        // Return the success.

        return CliExitCode.SUCCESS;
    }
}
