//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Writes shared contract-version 1 response trees as deterministic, human-readable command-line JSON.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.cli;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.rohingosling.eca.core.CompiledModel;
import io.github.rohingosling.eca.core.EvaluationResult;
import io.github.rohingosling.eca.core.EventOccurrence;
import io.github.rohingosling.eca.model.ContractJsonCodec;
import io.github.rohingosling.eca.model.ModelValidationResult;

import java.io.PrintWriter;

//*********************************************************************************************************************
// Class: CliJsonWriter
//
// Description:
//
//   Writes shared contract-version 1 response trees as deterministic, human-readable command-line JSON.
//
//*********************************************************************************************************************

final class CliJsonWriter
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final ObjectMapper objectMapper = new ObjectMapper ();
    private final ContractJsonCodec contractJsonCodec = new ContractJsonCodec ();

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: writeValidationResult
    //
    // Description:
    //
    //   Writes validation result using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   result (ModelValidationResult):
    //     The result used by this operation.
    //
    //   output (PrintWriter):
    //     The output used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    void writeValidationResult ( ModelValidationResult result, PrintWriter output ) throws JsonProcessingException
    {
        this.write ( this.contractJsonCodec.createValidationResult ( result ), output );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: writeEvaluationResult
    //
    // Description:
    //
    //   Writes evaluation result using the supplied inputs and current state.
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
    //   output (PrintWriter):
    //     The output used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    void writeEvaluationResult (
        CompiledModel model, EventOccurrence eventOccurrence, EvaluationResult result, PrintWriter output )
        throws JsonProcessingException
    {
        this.write ( this.contractJsonCodec.createEvaluationResult ( model, eventOccurrence, result ), output );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: write
    //
    // Description:
    //
    //   Writes the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   node (JsonNode):
    //     The node used by this operation.
    //
    //   output (PrintWriter):
    //     The output used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void write ( JsonNode node, PrintWriter output ) throws JsonProcessingException
    {
        output.println ( this.objectMapper.writerWithDefaultPrettyPrinter ().writeValueAsString ( node ) );
        output.flush ();
    }
}
