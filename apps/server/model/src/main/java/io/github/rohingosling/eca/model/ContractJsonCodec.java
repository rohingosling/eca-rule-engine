//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Builds framework-neutral JSON trees for contract-version 1 validation and evaluation responses.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.github.rohingosling.eca.core.Action;
import io.github.rohingosling.eca.core.CompiledModel;
import io.github.rohingosling.eca.core.ConditionTrace;
import io.github.rohingosling.eca.core.EvaluationResult;
import io.github.rohingosling.eca.core.EvaluationTrace;
import io.github.rohingosling.eca.core.EventOccurrence;
import io.github.rohingosling.eca.core.RuleTrace;
import io.github.rohingosling.eca.core.Value;

import java.util.Map;

//*********************************************************************************************************************
// Class: ContractJsonCodec
//
// Description:
//
//   Builds framework-neutral JSON trees for contract-version 1 validation and evaluation responses.
//
//*********************************************************************************************************************

public final class ContractJsonCodec
{
    //=================================================================================================================
    // Constants
    //=================================================================================================================

    private static final String API_VERSION = "1";

    //=================================================================================================================
    // Methods
    //=================================================================================================================

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
        ObjectNode root = JsonNodeFactory.instance.objectNode ();
        root.put ( "valid", result.isValid () );
        result.getSchemaVersion ().ifPresent ( schemaVersion -> root.put ( "schemaVersion", schemaVersion ) );
        result.getModelId ().ifPresent ( modelId -> root.put ( "modelId", modelId ) );
        ArrayNode diagnostics = root.putArray ( "diagnostics" );

        for ( Diagnostic diagnostic : result.getDiagnostics () )
        {
            diagnostics.add ( this.createDiagnostic ( diagnostic ) );
        }

        // Return the root.

        return root;
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
        ObjectNode root = JsonNodeFactory.instance.objectNode ();
        root.put ( "apiVersion", API_VERSION );
        root.put ( "schemaVersion", model.getSchemaVersion () );
        root.put ( "modelId", model.getId () );
        root.put ( "eventType", eventOccurrence.getType () );
        result.getSelectedAction ().ifPresentOrElse
        (
            action -> root.set ( "selectedAction", this.createAction ( action ) ),
            () -> root.putNull ( "selectedAction" )
        );

        result.getTrace ().ifPresent ( trace -> root.set ( "trace", this.createTrace ( trace ) ) );

        // Return the root.

        return root;
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
        ObjectNode node = JsonNodeFactory.instance.objectNode ();
        node.put ( "code", diagnostic.getCode () );
        node.put ( "message", diagnostic.getMessage () );
        node.put ( "pointer", diagnostic.getPointer () );

        // Return the node.

        return node;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: createAction
    //
    // Description:
    //
    //   Constructs action from the supplied inputs without mutating the caller's source values.
    //
    // Arguments:
    //
    //   action (Action):
    //     The action used by this operation.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private ObjectNode createAction ( Action action )
    {
        ObjectNode node = JsonNodeFactory.instance.objectNode ();
        node.put ( "id", action.getId () );
        node.put ( "name", action.getName () );
        action.getDescription ().ifPresent ( description -> node.put ( "description", description ) );
        ObjectNode parameters = node.putObject ( "parameters" );

        for ( Map.Entry<String, Value> parameter : action.getParameters ().entrySet () )
        {
            parameters.set ( parameter.getKey (), this.createValue ( parameter.getValue () ) );
        }

        // Return the node.

        return node;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: createTrace
    //
    // Description:
    //
    //   Constructs trace from the supplied inputs without mutating the caller's source values.
    //
    // Arguments:
    //
    //   trace (EvaluationTrace):
    //     The trace used by this operation.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private ObjectNode createTrace ( EvaluationTrace trace )
    {
        ObjectNode node      = JsonNodeFactory.instance.objectNode ();
        ArrayNode conditions = node.putArray ( "conditions" );
        ArrayNode rules      = node.putArray ( "rules" );

        for ( ConditionTrace conditionTrace : trace.getConditions () )
        {
            ObjectNode condition = conditions.addObject ();
            condition.put ( "condition", conditionTrace.getConditionId () );
            condition.put ( "result", conditionTrace.getResult () );
            condition.put ( "reason", conditionTrace.getReason ().getContractName () );
            ArrayNode missingDependencies = condition.putArray ( "missingDependencies" );

            for ( String dependency : conditionTrace.getMissingDependencies () )
            {
                missingDependencies.add ( dependency );
            }
        }

        for ( RuleTrace ruleTrace : trace.getRules () )
        {
            ObjectNode rule = rules.addObject ();
            rule.put ( "rule", ruleTrace.getRuleId () );
            rule.put ( "condition", ruleTrace.getConditionId () );
            rule.put ( "conditionResult", ruleTrace.getConditionResult () );
            rule.put ( "action", ruleTrace.getActionId () );
            rule.put ( "matched", ruleTrace.getMatched () );
        }

        // Return the node.

        return node;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: createValue
    //
    // Description:
    //
    //   Constructs value from the supplied inputs without mutating the caller's source values.
    //
    // Arguments:
    //
    //   value (Value):
    //     The value used by this operation.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private JsonNode createValue ( Value value )
    {

        // Return the result produced by the delegated operation.

        return switch ( value.getType () )
        {
            case NULL -> JsonNodeFactory.instance.nullNode ();
            case BOOLEAN -> JsonNodeFactory.instance.booleanNode ( value.asBoolean () );
            case NUMBER -> JsonNodeFactory.instance.numberNode ( value.asNumber () );
            case STRING -> JsonNodeFactory.instance.textNode ( value.asString () );
            case ARRAY -> this.createArray ( value );
            case OBJECT -> this.createObject ( value );
        };
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: createArray
    //
    // Description:
    //
    //   Constructs array from the supplied inputs without mutating the caller's source values.
    //
    // Arguments:
    //
    //   value (Value):
    //     The value used by this operation.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private ArrayNode createArray ( Value value )
    {
        ArrayNode node = JsonNodeFactory.instance.arrayNode ();

        for ( Value item : value.asArray () )
        {
            node.add ( this.createValue ( item ) );
        }

        // Return the node.

        return node;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: createObject
    //
    // Description:
    //
    //   Constructs object from the supplied inputs without mutating the caller's source values.
    //
    // Arguments:
    //
    //   value (Value):
    //     The value used by this operation.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private ObjectNode createObject ( Value value )
    {
        ObjectNode node = JsonNodeFactory.instance.objectNode ();

        for ( Map.Entry<String, Value> property : value.asObject ().entrySet () )
        {
            node.set ( property.getKey (), this.createValue ( property.getValue () ) );
        }

        // Return the node.

        return node;
    }
}
