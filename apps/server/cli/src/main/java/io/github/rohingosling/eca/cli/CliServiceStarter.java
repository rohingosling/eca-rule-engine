//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Adapter through which the start command hands validated startup configuration to the HTTP service.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.cli;

import java.util.Optional;

//---------------------------------------------------------------------------------------------------------------------
// Interface: CliServiceStarter
//
// Description:
//
//   Adapter through which the start command hands validated startup configuration to the HTTP service.
//
//---------------------------------------------------------------------------------------------------------------------

@FunctionalInterface
interface CliServiceStarter
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

    int start ( Optional<String> modelJson ) throws CliInputException;
}
