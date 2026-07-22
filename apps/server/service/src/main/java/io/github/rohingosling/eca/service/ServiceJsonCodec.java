//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Strict request-envelope parsing and HTTP access to shared contract-version 1 response serialization.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.github.rohingosling.eca.core.CompiledModel;
import io.github.rohingosling.eca.core.EvaluationResult;
import io.github.rohingosling.eca.core.EventOccurrence;
import io.github.rohingosling.eca.model.ContractJsonCodec;
import io.github.rohingosling.eca.model.Diagnostic;
import io.github.rohingosling.eca.model.JsonParserFactory;
import io.github.rohingosling.eca.model.ModelValidationResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

//*********************************************************************************************************************
// Class: ServiceJsonCodec
//
// Description:
//
//   Strict request-envelope parsing and HTTP access to shared contract-version 1 response serialization.
//
//*********************************************************************************************************************

@ApplicationScoped
public final class ServiceJsonCodec
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final ObjectMapper objectMapper;
    private final ContractJsonCodec contractJsonCodec;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: ServiceJsonCodec
    //
    // Description:
    //
    //   Creates a new ServiceJsonCodec instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   configuration (ServiceConfiguration):
    //     The configuration value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Inject
    public ServiceJsonCodec ( ServiceConfiguration configuration )
    {
        this.objectMapper     = JsonParserFactory.create ( configuration.getModelLimits () );
        this.contractJsonCodec = new ContractJsonCodec ();
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: readTree
    //
    // Description:
    //
    //   Reads the supplied representation and returns its normalized in-memory form.
    //
    // Arguments:
    //
    //   json (String):
    //     The JSON used by this operation.
    //
    // Returns:
    //
    //   The read tree result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public JsonNode readTree ( String json ) throws JsonProcessingException
    {

        // Return the result produced by the delegated operation.

        return this.objectMapper.readTree ( json );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: createValidationResult
    //
    // Description:
    //
    //   Constructs validation result from the supplied inputs without mutating the caller's source values.
    //
    // Arguments:
    //
    //   result (ModelValidationResult):
    //     The result used by this operation.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ObjectNode createValidationResult ( ModelValidationResult result )
    {

        // Return the result produced by the delegated operation.

        return this.contractJsonCodec.createValidationResult ( result );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: createEvaluationResult
    //
    // Description:
    //
    //   Constructs evaluation result from the supplied inputs without mutating the caller's source values.
    //
    // Arguments:
    //
    //   model (CompiledModel):
    //     The compiled or contract model inspected by this operation.
    //
    //   eventOccurrence (EventOccurrence):
    //     The current event occurrence containing the event type and optional payload values.
    //
    //   result (EvaluationResult):
    //     The result used by this operation.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ObjectNode createEvaluationResult (
        CompiledModel model, EventOccurrence eventOccurrence, EvaluationResult result )
    {

        // Return the result produced by the delegated operation.

        return this.contractJsonCodec.createEvaluationResult ( model, eventOccurrence, result );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: createDiagnostic
    //
    // Description:
    //
    //   Constructs diagnostic from the supplied inputs without mutating the caller's source values.
    //
    // Arguments:
    //
    //   diagnostic (Diagnostic):
    //     The diagnostic used by this operation.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ObjectNode createDiagnostic ( Diagnostic diagnostic )
    {

        // Return the result produced by the delegated operation.

        return this.contractJsonCodec.createDiagnostic ( diagnostic );
    }
}
