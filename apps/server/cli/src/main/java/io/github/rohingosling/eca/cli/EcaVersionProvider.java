//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Stable implementation and supported-contract version text for command-line version output.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.cli;

import io.github.rohingosling.eca.model.ImplementationMetadata;
import picocli.CommandLine;

//*********************************************************************************************************************
// Class: EcaVersionProvider
//
// Description:
//
//   Stable implementation and supported-contract version text for command-line version output.
//
//*********************************************************************************************************************

final class EcaVersionProvider implements CommandLine.IVersionProvider
{
    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getVersion
    //
    // Description:
    //
    //   Returns version from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested version value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Override
    public String[] getVersion ()
    {

        // Return the newly constructed String instance.

        return new String[]
        {
            "eca " + ImplementationMetadata.getImplementationVersion (),
            "contract " + ImplementationMetadata.getContractVersion ()
        };
    }
}
