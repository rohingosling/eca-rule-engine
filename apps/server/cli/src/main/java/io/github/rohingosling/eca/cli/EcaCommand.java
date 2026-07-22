//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Root command metadata for the stateless ECA rule-engine command-line application.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.cli;

import picocli.CommandLine;

@CommandLine.Command (
    name = "eca",
    description = "Validate models, evaluate events, and start the ECA HTTP service.",
    mixinStandardHelpOptions = true,
    versionProvider = EcaVersionProvider.class
)

//*********************************************************************************************************************
// Class: EcaCommand
//
// Description:
//
//   Root command metadata for the stateless ECA rule-engine command-line application.
//
//*********************************************************************************************************************

final class EcaCommand implements Runnable
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
    //-----------------------------------------------------------------------------------------------------------------

    @Override
    public void run ()
    {
    }
}
