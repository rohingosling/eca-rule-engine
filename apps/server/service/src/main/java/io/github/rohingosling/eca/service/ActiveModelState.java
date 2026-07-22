//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable active-model state initialized before the HTTP application begins serving requests.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import io.github.rohingosling.eca.core.CompiledModel;
import io.github.rohingosling.eca.model.ModelValidationResult;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;

import java.util.Optional;

//*********************************************************************************************************************
// Class: ActiveModelState
//
// Description:
//
//   Immutable active-model state initialized before the HTTP application begins serving requests.
//
//*********************************************************************************************************************

@ApplicationScoped
public final class ActiveModelState
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final ServiceConfiguration configuration;
    private final ServiceJsonCodec jsonCodec;
    private final RuleEngineService ruleEngineService;

    private Optional<CompiledModel> activeModel = Optional.empty ();
    private Optional<JsonNode> activeModelDocument = Optional.empty ();
    private boolean ready;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/2: ActiveModelState
    //
    // Description:
    //
    //   Creates a new ActiveModelState instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   configuration (ServiceConfiguration):
    //     The configuration value supplied to this operation.
    //
    //   jsonCodec (ServiceJsonCodec):
    //     The JSON codec value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ActiveModelState ( ServiceConfiguration configuration, ServiceJsonCodec jsonCodec )
    {
        this ( configuration, jsonCodec, new RuleEngineService ( configuration ) );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 2/2: ActiveModelState
    //
    // Description:
    //
    //   Creates a new ActiveModelState instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   configuration (ServiceConfiguration):
    //     The configuration value supplied to this operation.
    //
    //   jsonCodec (ServiceJsonCodec):
    //     The JSON codec value supplied to this operation.
    //
    //   ruleEngineService (RuleEngineService):
    //     The rule engine service value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Inject
    public ActiveModelState (
        ServiceConfiguration configuration, ServiceJsonCodec jsonCodec, RuleEngineService ruleEngineService )
    {
        this.configuration     = configuration;
        this.jsonCodec         = jsonCodec;
        this.ruleEngineService = ruleEngineService;
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: initialize
    //
    // Description:
    //
    //   Performs the initialize operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   startupEvent (StartupEvent):
    //     The startup event used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    void initialize ( @Observes StartupEvent startupEvent )
    {
        this.configuration.warnAboutUnknownEnvironmentVariables ();
        Optional<String> configuredModelJson = StartupModelConfiguration.getConfiguredModelJson ();

        if ( configuredModelJson.isPresent () )
        {
            JsonNode activeModelJson;

            try
            {
                activeModelJson = this.jsonCodec.readTree ( configuredModelJson.orElseThrow () );
            }
            catch ( JsonProcessingException exception )
            {
                throw new IllegalStateException ( "The validated startup model could not be parsed during startup." );
            }

            ModelValidationResult validationResult = this.ruleEngineService.validateModel ( activeModelJson );

            if ( !validationResult.isValid () )
            {
                throw new IllegalStateException ( "The validated startup model could not be compiled during startup." );
            }

            this.activeModel         = validationResult.getCompiledModel ();
            this.activeModelDocument = Optional.of ( activeModelJson );
        }

        this.ready = true;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getActiveModel
    //
    // Description:
    //
    //   Returns active model from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested active model value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Optional<CompiledModel> getActiveModel ()
    {

        // Return the active model.

        return this.activeModel;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getActiveModelDocument
    //
    // Description:
    //
    //   Returns active model document from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested active model document value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Optional<JsonNode> getActiveModelDocument ()
    {

        // Return the result produced by the delegated operation.

        return this.activeModelDocument.map ( JsonNode::deepCopy );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: isReady
    //
    // Description:
    //
    //   Determines whether is ready holds for the supplied value or application state.
    //
    // Returns:
    //
    //   True when the requested condition holds; otherwise false.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public boolean isReady ()
    {

        // Return the ready.

        return this.ready;
    }
}
