//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Deterministic semantic validation that follows successful Draft 2020-12 structural validation.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.model;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

//*********************************************************************************************************************
// Class: SemanticModelValidator
//
// Description:
//
//   Deterministic semantic validation that follows successful Draft 2020-12 structural validation.
//
//*********************************************************************************************************************

final class SemanticModelValidator
{
    private static final Set<String> ORDERING_PREDICATES = Collections.unmodifiableSet
    (
        new HashSet<>
        (
            Arrays.asList
            (
                "greaterThan",
                "greaterThanOrEqual",
                "lessThan",
                "lessThanOrEqual"
            )
        )
    );

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: validate
    //
    // Description:
    //
    //   Validates and reports deterministic diagnostics for every detected contract violation.
    //
    // Arguments:
    //
    //   model (JsonNode):
    //     The compiled or contract model inspected by this operation.
    //
    // Returns:
    //
    //   The deterministic diagnostics produced by validation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    List<Diagnostic> validate ( JsonNode model )
    {
        List<Diagnostic> diagnostics = new ArrayList<> ();

        this.addDuplicateIdentifierDiagnostics
        (
            diagnostics, model.get ( "parameters" ), "parameters", "parameter", "duplicate-parameter-identifier"
        );
        this.addDuplicateIdentifierDiagnostics
        (
            diagnostics, model.get ( "payloads" ), "payloads", "payload", "duplicate-payload-identifier"
        );
        this.addDuplicateIdentifierDiagnostics
        (
            diagnostics, model.get ( "events" ), "events", "event", "duplicate-event-identifier"
        );
        this.addDuplicateIdentifierDiagnostics
        (
            diagnostics, model.get ( "conditions" ), "conditions", "condition", "duplicate-condition-identifier"
        );
        this.addDuplicateIdentifierDiagnostics
        (
            diagnostics, model.get ( "actions" ), "actions", "action", "duplicate-action-identifier"
        );
        this.addDuplicateIdentifierDiagnostics
        (
            diagnostics, model.get ( "rules" ), "rules", "rule", "duplicate-rule-identifier"
        );
        this.addPayloadParameterReferenceDiagnostics ( diagnostics, model );
        this.addEventPayloadReferenceDiagnostics ( diagnostics, model );
        this.addPredicateConfigurationDiagnostics ( diagnostics, model.get ( "conditions" ) );
        this.addRuleDiagnostics ( diagnostics, model );

        diagnostics.sort ( Diagnostic::compareTo );

        // Return the diagnostics.

        return diagnostics;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: addDuplicateIdentifierDiagnostics
    //
    // Description:
    //
    //   Adds duplicate identifier diagnostics using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    //   collection (JsonNode):
    //     The collection inspected or transformed by this operation.
    //
    //   collectionName (String):
    //     The collection name collection inspected or transformed by this operation.
    //
    //   itemName (String):
    //     The item name used by this operation.
    //
    //   code (String):
    //     The code used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void addDuplicateIdentifierDiagnostics (
        List<Diagnostic> diagnostics, JsonNode collection, String collectionName, String itemName, String code )
    {
        Set<String> identifiers = new HashSet<> ();

        for ( int itemIndex = 0; itemIndex < collection.size (); itemIndex++ )
        {
            String identifier = collection.get ( itemIndex ).get ( "id" ).textValue ();

            if ( !identifiers.add ( identifier ) )
            {
                diagnostics.add
                (
                    new Diagnostic
                    (
                        code,
                        "Duplicate " + itemName + " identifier '" + identifier + "'.",
                        "/" + collectionName + "/" + itemIndex + "/id"
                    )
                );
            }
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: addPayloadParameterReferenceDiagnostics
    //
    // Description:
    //
    //   Adds payload parameter reference diagnostics using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    //   model (JsonNode):
    //     The compiled or contract model inspected by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void addPayloadParameterReferenceDiagnostics ( List<Diagnostic> diagnostics, JsonNode model )
    {
        Map<String, IndexedNode> parameters = this.indexByIdentifier ( model.get ( "parameters" ) );
        JsonNode payloads = model.get ( "payloads" );

        for ( int payloadIndex = 0; payloadIndex < payloads.size (); payloadIndex++ )
        {
            JsonNode payload = payloads.get ( payloadIndex );
            JsonNode parameterReferences = payload.get ( "parameters" );

            for ( int parameterIndex = 0; parameterIndex < parameterReferences.size (); parameterIndex++ )
            {
                String parameterIdentifier = parameterReferences.get ( parameterIndex ).textValue ();

                if ( !parameters.containsKey ( parameterIdentifier ) )
                {
                    diagnostics.add
                    (
                        new Diagnostic
                        (
                            "unresolved-parameter-reference",
                            "Payload '" + payload.get ( "id" ).textValue () + "' references unknown parameter '"
                                + parameterIdentifier + "'.",
                            "/payloads/" + payloadIndex + "/parameters/" + parameterIndex
                        )
                    );
                }
            }
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: addEventPayloadReferenceDiagnostics
    //
    // Description:
    //
    //   Adds event payload reference diagnostics using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    //   model (JsonNode):
    //     The compiled or contract model inspected by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void addEventPayloadReferenceDiagnostics ( List<Diagnostic> diagnostics, JsonNode model )
    {
        Map<String, IndexedNode> payloads = this.indexByIdentifier ( model.get ( "payloads" ) );
        JsonNode events = model.get ( "events" );

        for ( int eventIndex = 0; eventIndex < events.size (); eventIndex++ )
        {
            JsonNode event = events.get ( eventIndex );
            JsonNode payloadReference = event.get ( "payload" );

            if ( payloadReference != null && !payloads.containsKey ( payloadReference.textValue () ) )
            {
                diagnostics.add
                (
                    new Diagnostic
                    (
                        "unresolved-payload-reference",
                        "Event '" + event.get ( "id" ).textValue () + "' references unknown payload '"
                            + payloadReference.textValue () + "'.",
                        "/events/" + eventIndex + "/payload"
                    )
                );
            }
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: addPredicateConfigurationDiagnostics
    //
    // Description:
    //
    //   Adds predicate configuration diagnostics using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    //   conditions (JsonNode):
    //     The conditions collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void addPredicateConfigurationDiagnostics ( List<Diagnostic> diagnostics, JsonNode conditions )
    {
        for ( int conditionIndex = 0; conditionIndex < conditions.size (); conditionIndex++ )
        {
            JsonNode condition = conditions.get ( conditionIndex );
            JsonNode predicate = condition.get ( "predicate" );

            if ( "always".equals ( predicate.get ( "name" ).textValue () ) )
            {
                continue;
            }

            String dependency = condition.get ( "dependencies" ).get ( 0 ).textValue ();
            String parameterIdentifier = predicate.get ( "arguments" ).get ( "parameter" ).textValue ();

            if ( !dependency.equals ( parameterIdentifier ) )
            {
                diagnostics.add
                (
                    new Diagnostic
                    (
                        "predicate-dependency-mismatch",
                        "Condition '" + condition.get ( "id" ).textValue ()
                            + "' must depend only on predicate parameter '" + parameterIdentifier + "'.",
                        "/conditions/" + conditionIndex + "/predicate/arguments/parameter"
                    )
                );
            }
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: addRuleDiagnostics
    //
    // Description:
    //
    //   Adds rule diagnostics using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    //   model (JsonNode):
    //     The compiled or contract model inspected by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void addRuleDiagnostics ( List<Diagnostic> diagnostics, JsonNode model )
    {
        Map<String, IndexedNode> events = this.indexByIdentifier ( model.get ( "events" ) );
        Map<String, IndexedNode> conditions = this.indexByIdentifier ( model.get ( "conditions" ) );
        Map<String, IndexedNode> actions = this.indexByIdentifier ( model.get ( "actions" ) );
        Map<String, EventParameterResolution> eventParameters = this.indexEventParameters ( model );
        Set<String> checkedRelations = new HashSet<> ();
        JsonNode rules = model.get ( "rules" );

        for ( int ruleIndex = 0; ruleIndex < rules.size (); ruleIndex++ )
        {
            JsonNode rule = rules.get ( ruleIndex );
            String ruleIdentifier = rule.get ( "id" ).textValue ();
            String eventIdentifier = rule.get ( "event" ).textValue ();
            String conditionIdentifier = rule.get ( "condition" ).textValue ();
            String actionIdentifier = rule.get ( "action" ).textValue ();

            if ( !actions.containsKey ( actionIdentifier ) )
            {
                diagnostics.add
                (
                    new Diagnostic
                    (
                        "unresolved-action-reference",
                        "Rule '" + ruleIdentifier + "' references unknown action '" + actionIdentifier + "'.",
                        "/rules/" + ruleIndex + "/action"
                    )
                );
            }

            if ( !conditions.containsKey ( conditionIdentifier ) )
            {
                diagnostics.add
                (
                    new Diagnostic
                    (
                        "unresolved-condition-reference",
                        "Rule '" + ruleIdentifier + "' references unknown condition '" + conditionIdentifier + "'.",
                        "/rules/" + ruleIndex + "/condition"
                    )
                );
            }

            if ( !events.containsKey ( eventIdentifier ) )
            {
                diagnostics.add
                (
                    new Diagnostic
                    (
                        "unresolved-event-reference",
                        "Rule '" + ruleIdentifier + "' references unknown event '" + eventIdentifier + "'.",
                        "/rules/" + ruleIndex + "/event"
                    )
                );
            }

            String relation = eventIdentifier + "\u0000" + conditionIdentifier;

            if ( events.containsKey ( eventIdentifier ) && conditions.containsKey ( conditionIdentifier )
                && checkedRelations.add ( relation ) )
            {
                this.addEventConditionDiagnostics
                (
                    diagnostics,
                    events.get ( eventIdentifier ).getNode (),
                    conditions.get ( conditionIdentifier ).getNode (),
                    conditions.get ( conditionIdentifier ).getIndex (),
                    eventParameters.get ( eventIdentifier ),
                    ruleIndex
                );
            }
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: addEventConditionDiagnostics
    //
    // Description:
    //
    //   Adds event condition diagnostics using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    //   event (JsonNode):
    //     The event used by this operation.
    //
    //   condition (JsonNode):
    //     The condition used by this operation.
    //
    //   conditionIndex (int):
    //     The condition index used by this operation.
    //
    //   parameters (EventParameterResolution):
    //     The parameters collection inspected or transformed by this operation.
    //
    //   ruleIndex (int):
    //     The rule index used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void addEventConditionDiagnostics (
        List<Diagnostic> diagnostics, JsonNode event, JsonNode condition, int conditionIndex,
        EventParameterResolution parameters, int ruleIndex )
    {
        JsonNode predicate = condition.get ( "predicate" );
        String predicateName = predicate.get ( "name" ).textValue ();

        if ( "always".equals ( predicateName ) )
        {

            // Return without a value after completing this code path.

            return;
        }

        String parameterIdentifier = condition.get ( "dependencies" ).get ( 0 ).textValue ();

        if ( !parameters.isPayloadResolved () )
        {

            // Return without a value after completing this code path.

            return;
        }

        if ( !parameters.declaresParameter ( parameterIdentifier ) )
        {
            diagnostics.add
            (
                new Diagnostic
                (
                    "undeclared-condition-dependency",
                    "Event '" + event.get ( "id" ).textValue () + "' does not declare condition dependency '"
                        + parameterIdentifier + "'.",
                    "/rules/" + ruleIndex + "/condition"
                )
            );

            // Return without a value after completing this code path.

            return;
        }

        JsonNode parameter = parameters.getParameter ( parameterIdentifier );

        if ( parameter == null )
        {

            // Return without a value after completing this code path.

            return;
        }

        String parameterType = parameter.get ( "type" ).textValue ();

        if ( ORDERING_PREDICATES.contains ( predicateName ) && !this.isOrderableType ( parameterType ) )
        {
            diagnostics.add
            (
                new Diagnostic
                (
                    "incompatible-predicate-operand",
                    "Predicate '" + predicateName + "' cannot compare parameter type '" + parameterType + "'.",
                    "/conditions/" + conditionIndex + "/predicate/name"
                )
            );

            // Return without a value after completing this code path.

            return;
        }

        if ( "contains".equals ( predicateName ) && !"array".equals ( parameterType )
            && !"string".equals ( parameterType ) )
        {
            diagnostics.add
            (
                new Diagnostic
                (
                    "incompatible-predicate-operand",
                    "Predicate 'contains' cannot inspect parameter type '" + parameterType + "'.",
                    "/conditions/" + conditionIndex + "/predicate/name"
                )
            );

            // Return without a value after completing this code path.

            return;
        }

        JsonNode comparisonValue = predicate.get ( "arguments" ).get ( "value" );

        if ( !( "contains".equals ( predicateName ) && "array".equals ( parameterType ) )
            && !this.valueMatchesType ( comparisonValue, parameterType ) )
        {
            diagnostics.add
            (
                new Diagnostic
                (
                    "incompatible-comparison-value",
                    "Predicate value is incompatible with parameter type '" + parameterType + "'.",
                    "/conditions/" + conditionIndex + "/predicate/arguments/value"
                )
            );
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: indexByIdentifier
    //
    // Description:
    //
    //   Builds a lookup that retains the first item associated with each identifier.
    //
    // Arguments:
    //
    //   collection (JsonNode):
    //     The collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The index by identifier result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private Map<String, IndexedNode> indexByIdentifier ( JsonNode collection )
    {
        Map<String, IndexedNode> indexedCollection = new HashMap<> ();

        for ( int itemIndex = 0; itemIndex < collection.size (); itemIndex++ )
        {
            JsonNode item = collection.get ( itemIndex );
            indexedCollection.putIfAbsent
            (
                item.get ( "id" ).textValue (),
                new IndexedNode ( item, itemIndex )
            );
        }

        // Return the indexed collection.

        return indexedCollection;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: indexEventParameters
    //
    // Description:
    //
    //   Indexes event parameters using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   model (JsonNode):
    //     The compiled or contract model inspected by this operation.
    //
    // Returns:
    //
    //   The index event parameters result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private Map<String, EventParameterResolution> indexEventParameters ( JsonNode model )
    {
        Map<String, IndexedNode> parameters = this.indexByIdentifier ( model.get ( "parameters" ) );
        Map<String, EventParameterResolution> payloadParameters = this.indexPayloadParameters
        (
            model.get ( "payloads" ),
            parameters
        );
        Map<String, EventParameterResolution> eventParameters = new HashMap<> ();
        JsonNode events = model.get ( "events" );

        for ( JsonNode event : events )
        {
            String eventIdentifier = event.get ( "id" ).textValue ();

            if ( eventParameters.containsKey ( eventIdentifier ) )
            {
                continue;
            }

            JsonNode payloadReference = event.get ( "payload" );
            EventParameterResolution resolvedParameters = payloadReference == null
                ? EventParameterResolution.resolved ( Collections.emptySet (), Collections.emptyMap () )
                : payloadParameters.getOrDefault
                (
                    payloadReference.textValue (),
                    EventParameterResolution.unresolvedPayload ()
                );
            eventParameters.put ( eventIdentifier, resolvedParameters );
        }

        // Return the event parameters.

        return eventParameters;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: indexPayloadParameters
    //
    // Description:
    //
    //   Indexes payload parameters using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   payloads (JsonNode):
    //     The payloads collection inspected or transformed by this operation.
    //
    //   parameters (Map<String, IndexedNode>):
    //     The parameters collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The index payload parameters result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private Map<String, EventParameterResolution> indexPayloadParameters (
        JsonNode payloads, Map<String, IndexedNode> parameters )
    {
        Map<String, EventParameterResolution> payloadParameters = new HashMap<> ();

        for ( JsonNode payload : payloads )
        {
            String payloadIdentifier = payload.get ( "id" ).textValue ();

            if ( payloadParameters.containsKey ( payloadIdentifier ) )
            {
                continue;
            }

            Set<String> declaredParameters = new HashSet<> ();
            Map<String, JsonNode> resolvedParameters = new HashMap<> ();

            for ( JsonNode parameterReference : payload.get ( "parameters" ) )
            {
                String parameterIdentifier = parameterReference.textValue ();
                IndexedNode parameter = parameters.get ( parameterIdentifier );
                declaredParameters.add ( parameterIdentifier );

                if ( parameter != null )
                {
                    resolvedParameters.putIfAbsent ( parameterIdentifier, parameter.getNode () );
                }
            }

            payloadParameters.put
            (
                payloadIdentifier,
                EventParameterResolution.resolved ( declaredParameters, resolvedParameters )
            );
        }

        // Return the payload parameters.

        return payloadParameters;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: isOrderableType
    //
    // Description:
    //
    //   Determines whether is orderable type holds for the supplied value or application state.
    //
    // Arguments:
    //
    //   parameterType (String):
    //     The parameter type used by this operation.
    //
    // Returns:
    //
    //   True when the requested condition holds; otherwise false.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private boolean isOrderableType ( String parameterType )
    {

        // Return the value produced by this code path.

        return "number".equals ( parameterType )
            || "integer".equals ( parameterType )
            || "string".equals ( parameterType );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: valueMatchesType
    //
    // Description:
    //
    //   Performs the value matches type operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   value (JsonNode):
    //     The value used by this operation.
    //
    //   parameterType (String):
    //     The parameter type used by this operation.
    //
    // Returns:
    //
    //   The value matches type result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private boolean valueMatchesType ( JsonNode value, String parameterType )
    {
        if ( "null".equals ( parameterType ) )
        {

            // Return the result produced by the delegated operation.

            return value.isNull ();
        }

        if ( "boolean".equals ( parameterType ) )
        {

            // Return the result produced by the delegated operation.

            return value.isBoolean ();
        }

        if ( "number".equals ( parameterType ) )
        {

            // Return the result produced by the delegated operation.

            return value.isNumber ();
        }

        if ( "integer".equals ( parameterType ) )
        {

            // Return the result produced by the delegated operation.

            return value.isNumber () && value.decimalValue ().stripTrailingZeros ().scale () <= 0;
        }

        if ( "string".equals ( parameterType ) )
        {

            // Return the result produced by the delegated operation.

            return value.isTextual ();
        }

        if ( "array".equals ( parameterType ) )
        {

            // Return the result produced by the delegated operation.

            return value.isArray ();
        }

        if ( "object".equals ( parameterType ) )
        {

            // Return the result produced by the delegated operation.

            return value.isObject ();
        }

        // Return false for this code path.

        return false;
    }

    //*****************************************************************************************************************
    // Class: EventParameterResolution
    //
    // Description:
    //
    //   Encapsulates event parameter resolution state and behavior.
    //
    //*****************************************************************************************************************

    private static final class EventParameterResolution
    {
        //=============================================================================================================
        // Fields
        //=============================================================================================================

        private final boolean payloadResolved;
        private final Set<String> declaredParameters;
        private final Map<String, JsonNode> parameters;

        //=============================================================================================================
        // Constructors
        //=============================================================================================================

        //-------------------------------------------------------------------------------------------------------------
        // Constructor 1/2: EventParameterResolution
        //
        // Description:
        //
        //   Creates a new EventParameterResolution instance from the supplied values and establishes its initial
        //   invariants.
        //
        // Arguments:
        //
        //   payloadResolved (boolean):
        //     The payload resolved value supplied to this operation.
        //
        //   declaredParameters (Set<String>):
        //     The declared parameters collection inspected or transformed by this operation.
        //
        //   parameters (Map<String, JsonNode>):
        //     The parameters collection inspected or transformed by this operation.
        //
        //-------------------------------------------------------------------------------------------------------------

        private EventParameterResolution (
            boolean payloadResolved, Set<String> declaredParameters, Map<String, JsonNode> parameters )
        {
            this.payloadResolved    = payloadResolved;
            this.declaredParameters = Collections.unmodifiableSet ( new HashSet<> ( declaredParameters ) );
            this.parameters         = Collections.unmodifiableMap ( new HashMap<> ( parameters ) );
        }

        //-------------------------------------------------------------------------------------------------------------
        // Method: resolved
        //
        // Description:
        //
        //   Performs the resolved operation using the supplied inputs and current state.
        //
        // Arguments:
        //
        //   declaredParameters (Set<String>):
        //     The declared parameters collection inspected or transformed by this operation.
        //
        //   parameters (Map<String, JsonNode>):
        //     The parameters collection inspected or transformed by this operation.
        //
        // Returns:
        //
        //   The resolved result.
        //
        //-------------------------------------------------------------------------------------------------------------

        private static EventParameterResolution resolved (
            Set<String> declaredParameters, Map<String, JsonNode> parameters )
        {

            // Return the newly constructed EventParameterResolution instance.

            return new EventParameterResolution ( true, declaredParameters, parameters );
        }

        //-------------------------------------------------------------------------------------------------------------
        // Method: unresolvedPayload
        //
        // Description:
        //
        //   Performs the unresolved payload operation using the supplied inputs and current state.
        //
        // Returns:
        //
        //   The unresolved payload result.
        //
        //-------------------------------------------------------------------------------------------------------------

        private static EventParameterResolution unresolvedPayload ()
        {

            // Return the newly constructed EventParameterResolution instance.

            return new EventParameterResolution ( false, Collections.emptySet (), Collections.emptyMap () );
        }

        //=============================================================================================================
        // Accessors
        //=============================================================================================================

        //-------------------------------------------------------------------------------------------------------------
        // Method: isPayloadResolved
        //
        // Description:
        //
        //   Determines whether is payload resolved holds for the supplied value or application state.
        //
        // Returns:
        //
        //   True when the requested condition holds; otherwise false.
        //
        //-------------------------------------------------------------------------------------------------------------

        private boolean isPayloadResolved ()
        {

            // Return the payload resolved.

            return this.payloadResolved;
        }

        //=============================================================================================================
        // Methods
        //=============================================================================================================

        //-------------------------------------------------------------------------------------------------------------
        // Method: declaresParameter
        //
        // Description:
        //
        //   Performs the declares parameter operation using the supplied inputs and current state.
        //
        // Arguments:
        //
        //   parameterIdentifier (String):
        //     The stable parameter identifier used to locate the corresponding model element.
        //
        // Returns:
        //
        //   The declares parameter result.
        //
        //-------------------------------------------------------------------------------------------------------------

        private boolean declaresParameter ( String parameterIdentifier )
        {

            // Return the result produced by the delegated operation.

            return this.declaredParameters.contains ( parameterIdentifier );
        }

        //-------------------------------------------------------------------------------------------------------------
        // Method: getParameter
        //
        // Description:
        //
        //   Returns parameter from the current model, configuration, or application state.
        //
        // Arguments:
        //
        //   parameterIdentifier (String):
        //     The stable parameter identifier used to locate the corresponding model element.
        //
        // Returns:
        //
        //   The requested parameter value.
        //
        //-------------------------------------------------------------------------------------------------------------

        private JsonNode getParameter ( String parameterIdentifier )
        {

            // Return the result produced by the delegated operation.

            return this.parameters.get ( parameterIdentifier );
        }
    }

    //*****************************************************************************************************************
    // Class: IndexedNode
    //
    // Description:
    //
    //   Encapsulates indexed node state and behavior.
    //
    //*****************************************************************************************************************

    private static final class IndexedNode
    {
        //=============================================================================================================
        // Fields
        //=============================================================================================================

        private final JsonNode node;
        private final int index;

        //=============================================================================================================
        // Constructors
        //=============================================================================================================

        //-------------------------------------------------------------------------------------------------------------
        // Constructor 2/2: IndexedNode
        //
        // Description:
        //
        //   Creates a new IndexedNode instance from the supplied values and establishes its initial invariants.
        //
        // Arguments:
        //
        //   node (JsonNode):
        //     The node value supplied to this operation.
        //
        //   index (int):
        //     The index value supplied to this operation.
        //
        //-------------------------------------------------------------------------------------------------------------

        private IndexedNode ( JsonNode node, int index )
        {
            this.node  = node;
            this.index = index;
        }

        //=============================================================================================================
        // Accessors
        //=============================================================================================================

        //-------------------------------------------------------------------------------------------------------------
        // Method: getNode
        //
        // Description:
        //
        //   Returns node from the current model, configuration, or application state.
        //
        // Returns:
        //
        //   The requested node value.
        //
        //-------------------------------------------------------------------------------------------------------------

        private JsonNode getNode ()
        {

            // Return the node.

            return this.node;
        }

        //-------------------------------------------------------------------------------------------------------------
        // Method: getIndex
        //
        // Description:
        //
        //   Returns index from the current model, configuration, or application state.
        //
        // Returns:
        //
        //   The requested index value.
        //
        //-------------------------------------------------------------------------------------------------------------

        private int getIndex ()
        {

            // Return the index.

            return this.index;
        }
    }
}
