//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Stable process exit codes defined by the server command-line contract.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.cli;

//*********************************************************************************************************************
// Class: CliExitCode
//
// Description:
//
//   Stable process exit codes defined by the server command-line contract.
//
//*********************************************************************************************************************

final class CliExitCode
{
    //=================================================================================================================
    // Constants
    //=================================================================================================================

    static final int SUCCESS               = 0;
    static final int INTERNAL_FAILURE      = 1;
    static final int SYNTAX_ERROR          = 2;
    static final int CONFIGURATION_ERROR   = 3;
    static final int INVALID_JSON          = 4;
    static final int INVALID_EVALUATION    = 5;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: CliExitCode
    //
    // Description:
    //
    //   Creates a new CliExitCode instance from the supplied values and establishes its initial invariants.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private CliExitCode ()
    {
    }
}
