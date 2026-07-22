//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Tests exact-origin CORS validation independently of the packaged-process acceptance gate.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.service;

import io.github.rohingosling.eca.model.ModelLimits;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

//*********************************************************************************************************************
// Class: ServiceConfigurationTest
//
// Description:
//
//   Tests exact-origin CORS validation independently of the packaged-process acceptance gate.
//
//*********************************************************************************************************************

class ServiceConfigurationTest
{
    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: exactHttpsAndLoopbackHttpOriginsAreAccepted
    //
    // Description:
    //
    //   Performs the exact https and loopback HTTP origins are accepted operation using the supplied inputs and
    //   current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void exactHttpsAndLoopbackHttpOriginsAreAccepted ()
    {
        assertThatNoException ().isThrownBy
        (
            () -> createConfiguration
            (
                "https://client.example,http://localhost:5173,http://127.0.0.1:4173,http://[::1]:4173"
            )
        );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: wildcardNonLoopbackHttpAndNonOriginUrisAreRejected
    //
    // Description:
    //
    //   Verifies that wildcard non loopback HTTP and non origin uris are rejected and fails the test when the observed
    //   behavior differs.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void wildcardNonLoopbackHttpAndNonOriginUrisAreRejected ()
    {
        assertThatThrownBy ( () -> createConfiguration ( "*" ) )
            .isInstanceOf ( IllegalArgumentException.class );
        assertThatThrownBy ( () -> createConfiguration ( "http://client.example" ) )
            .isInstanceOf ( IllegalArgumentException.class );
        assertThatThrownBy ( () -> createConfiguration ( "https://client.example/path" ) )
            .isInstanceOf ( IllegalArgumentException.class );
        assertThatThrownBy ( () -> createConfiguration ( "https://user@client.example" ) )
            .isInstanceOf ( IllegalArgumentException.class );
        assertThatThrownBy ( () -> createConfiguration ( "http://127.example" ) )
            .isInstanceOf ( IllegalArgumentException.class );
        assertThatThrownBy ( () -> createConfiguration ( "https://client.example," ) )
            .isInstanceOf ( IllegalArgumentException.class );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: reusableDefinitionLimitsAreMappedToModelLimits
    //
    // Description:
    //
    //   Performs the reusable definition limits are mapped to model limits operation using the supplied inputs and
    //   current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void reusableDefinitionLimitsAreMappedToModelLimits ()
    {
        ServiceConfiguration configuration = new ServiceConfiguration
        (
            ModelLimits.DEFAULT_MAXIMUM_REQUEST_BYTES,
            ModelLimits.DEFAULT_MAXIMUM_JSON_DEPTH,
            ModelLimits.DEFAULT_MAXIMUM_STRING_LENGTH,
            7,
            8,
            ModelLimits.DEFAULT_MAXIMUM_EVENTS,
            ModelLimits.DEFAULT_MAXIMUM_CONDITIONS,
            ModelLimits.DEFAULT_MAXIMUM_ACTIONS,
            ModelLimits.DEFAULT_MAXIMUM_RULES,
            ModelLimits.DEFAULT_MAXIMUM_PAYLOAD_VALUES,
            true,
            "https://client.example"
        );

        assertThat ( configuration.getModelLimits ().getMaximumParameters () ).isEqualTo ( 7 );
        assertThat ( configuration.getModelLimits ().getMaximumPayloads () ).isEqualTo ( 8 );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: createConfiguration
    //
    // Description:
    //
    //   Constructs configuration from the supplied inputs without mutating the caller's source values.
    //
    // Arguments:
    //
    //   allowedOrigins (String):
    //     The allowed origins collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static ServiceConfiguration createConfiguration ( String allowedOrigins )
    {

        // Return the newly constructed ServiceConfiguration instance.

        return new ServiceConfiguration
        (
            ModelLimits.DEFAULT_MAXIMUM_REQUEST_BYTES,
            ModelLimits.DEFAULT_MAXIMUM_JSON_DEPTH,
            ModelLimits.DEFAULT_MAXIMUM_STRING_LENGTH,
            ModelLimits.DEFAULT_MAXIMUM_EVENTS,
            ModelLimits.DEFAULT_MAXIMUM_CONDITIONS,
            ModelLimits.DEFAULT_MAXIMUM_ACTIONS,
            ModelLimits.DEFAULT_MAXIMUM_RULES,
            ModelLimits.DEFAULT_MAXIMUM_PAYLOAD_VALUES,
            true,
            allowedOrigins
        );
    }
}
