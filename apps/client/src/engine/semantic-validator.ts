//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Semantic checks that complement the generated structural JSON Schema validator.
//
//---------------------------------------------------------------------------------------------------------------------

import type { Condition, ParameterDefinition, StatelessECAModel } from "../contracts/model.generated";

//---------------------------------------------------------------------------------------------------------------------
// Interface: SemanticDiagnostic
//
// Description:
//
//   Defines the named fields and callable operations that make up semantic diagnostic.
//
//---------------------------------------------------------------------------------------------------------------------
export interface SemanticDiagnostic
{
    code: string;
    pointer: string;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: IndexedItem
//
// Description:
//
//   Defines the named fields and callable operations that make up indexed item.
//
//---------------------------------------------------------------------------------------------------------------------
interface IndexedItem<Item>
{
    index: number;
    item: Item;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: compareText
//
// Description:
//
//   Compares text using the deterministic ordering required by serialized diagnostics and traces.
//
// Arguments:
//
//   left (string):
//     The left used by this operation.
//
//   right (string):
//     The right used by this operation.
//
// Returns:
//
//   A negative, zero, or positive value representing the deterministic ordering, or no value when operands cannot be
//   ordered.
//
//---------------------------------------------------------------------------------------------------------------------

function compareText ( left: string, right: string ): number
{

    // Return the value selected by the evaluated condition.

    return left < right ? -1 : left > right ? 1 : 0;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: addDuplicates
//
// Description:
//
//   Detects repeated identifiers and appends a diagnostic for each duplicate.
//
// Arguments:
//
//   diagnostics (SemanticDiagnostic[]):
//     The diagnostics collection inspected or transformed by this operation.
//
//   values (Array<{ id: string }>):
//     The values collection inspected or transformed by this operation.
//
//   code (string):
//     The code used by this operation.
//
//   collection (string):
//     The collection inspected or transformed by this operation.
//
// Returns:
//
//   The add duplicates result.
//
//---------------------------------------------------------------------------------------------------------------------

function addDuplicates (
    diagnostics: SemanticDiagnostic[], values: Array<
        {
            id: string
        }>, code: string, collection: string )
{
    const identifiers = new Set<string> ();

    values.forEach
    (
        ( value, index ) =>
        {
            if ( identifiers.has ( value.id ) )
            {
                diagnostics.push
                (
                    {
                        code, pointer: `/${ collection }/${ index }/id`
                    }
                );
            }
            identifiers.add ( value.id );
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: indexByIdentifier
//
// Description:
//
//   Builds a lookup that retains the first item associated with each identifier.
//
// Arguments:
//
//   values (Item[]):
//     The values collection inspected or transformed by this operation.
//
// Returns:
//
//   The index by identifier result.
//
//---------------------------------------------------------------------------------------------------------------------

function indexByIdentifier<Item extends
    {
        id: string
    }> ( values: Item[] ): Map<string, IndexedItem<Item>>
{
    const indexedItems = new Map<string, IndexedItem<Item>> ();
    values.forEach
    (
        ( item, index ) =>
        {
            if ( !indexedItems.has ( item.id ) )
            {
                indexedItems.set
                (
                    item.id,
                    {
                        index, item
                    }
                );
            }
        }
    );

    // Return the indexed items.

    return indexedItems;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: jsonType
//
// Description:
//
//   Identifies the contract parameter type represented by a JSON value.
//
// Arguments:
//
//   value (unknown):
//     The value used by this operation.
//
// Returns:
//
//   The JSON type result.
//
//---------------------------------------------------------------------------------------------------------------------

function jsonType ( value: unknown ): ParameterDefinition["type"]
{
    if ( value === null )
    {
        // Return the value produced by this code path.

        return "null";
    }
    if ( Array.isArray ( value ) )
    {
        // Return the value produced by this code path.

        return "array";
    }
    if ( typeof value === "number" )
    {
        // Return the value selected by the evaluated condition.

        return Number.isInteger ( value ) ? "integer" : "number";
    }

    // Return the value produced by this code path.

    return typeof value as ParameterDefinition["type"];
}

//---------------------------------------------------------------------------------------------------------------------
// Function: acceptsValue
//
// Description:
//
//   Determines whether accepts value holds for the supplied value or application state.
//
// Arguments:
//
//   parameterType (ParameterDefinition["type"]):
//     The parameter type used by this operation.
//
//   value (unknown):
//     The value used by this operation.
//
// Returns:
//
//   True when the requested condition holds; otherwise false.
//
//---------------------------------------------------------------------------------------------------------------------

function acceptsValue ( parameterType: ParameterDefinition["type"], value: unknown ): boolean
{
    const valueType = jsonType ( value );

    // Return the value produced by this code path.

    return parameterType === valueType || ( parameterType === "number" && valueType === "integer" );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: acceptsPredicate
//
// Description:
//
//   Determines whether accepts predicate holds for the supplied value or application state.
//
// Arguments:
//
//   parameterType (ParameterDefinition["type"]):
//     The parameter type used by this operation.
//
//   predicateName (string):
//     The predicate name used by this operation.
//
// Returns:
//
//   True when the requested condition holds; otherwise false.
//
//---------------------------------------------------------------------------------------------------------------------

function acceptsPredicate ( parameterType: ParameterDefinition["type"], predicateName: string ): boolean
{
    if ( predicateName === "equals" || predicateName === "notEquals" )
    {
        // Return true for this code path.

        return true;
    }
    if ( predicateName === "contains" )
    {
        // Return the value produced by this code path.

        return parameterType === "string" || parameterType === "array";
    }

    // Return the value produced by this code path.

    return parameterType === "number" || parameterType === "integer" || parameterType === "string";
}

//---------------------------------------------------------------------------------------------------------------------
// Function: validateSemantics
//
// Description:
//
//   Validates semantics and reports deterministic diagnostics for every detected contract violation.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
// Returns:
//
//   The deterministic diagnostics produced by validation.
//
//---------------------------------------------------------------------------------------------------------------------

export function validateSemantics ( model: StatelessECAModel ): SemanticDiagnostic[]
{
    const diagnostics: SemanticDiagnostic[] = [];
    addDuplicates ( diagnostics, model.parameters, "duplicate-parameter-identifier", "parameters" );
    addDuplicates ( diagnostics, model.payloads, "duplicate-payload-identifier", "payloads" );
    addDuplicates ( diagnostics, model.events, "duplicate-event-identifier", "events" );
    addDuplicates ( diagnostics, model.conditions, "duplicate-condition-identifier", "conditions" );
    addDuplicates ( diagnostics, model.actions, "duplicate-action-identifier", "actions" );
    addDuplicates ( diagnostics, model.rules, "duplicate-rule-identifier", "rules" );

    const parameters = indexByIdentifier ( model.parameters );
    const payloads   = indexByIdentifier ( model.payloads );
    const events     = indexByIdentifier ( model.events );
    const conditions = indexByIdentifier ( model.conditions );
    const actions    = indexByIdentifier ( model.actions );

    model.payloads.forEach
    (
        ( payload, payloadIndex ) => payload.parameters.forEach
        (
            ( parameterIdentifier, parameterIndex ) =>
                {
                if ( !parameters.has ( parameterIdentifier ) )
                    {
                    diagnostics.push
                    (
                        {
                            code: "unresolved-parameter-reference",
                            pointer: `/payloads/${ payloadIndex }/parameters/${ parameterIndex }`
                        }
                    );
                }
            }
        )
    );

    model.events.forEach
    (
        ( eventType, eventIndex ) =>
        {
            if ( eventType.payload && !payloads.has ( eventType.payload ) )
            {
                diagnostics.push
                (
                    {
                        code: "unresolved-payload-reference", pointer: `/events/${ eventIndex }/payload`
                    }
                );
            }
        }
    );

    model.conditions.forEach
    (
        ( condition, conditionIndex ) =>
        {
            if ( condition.predicate.name === "always" )
            {

                // Return without a value after completing this code path.

                return;
            }
            const parameterIdentifier = condition.predicate.arguments.parameter;
            if ( condition.dependencies.length !== 1 || condition.dependencies [ 0 ] !== parameterIdentifier )
            {
                diagnostics.push
                (
                    {
                        code: "predicate-dependency-mismatch",
                        pointer: `/conditions/${ conditionIndex }/predicate/arguments/parameter`
                    }
                );
            }
        }
    );

    const checkedRelations = new Set<string> ();
    model.rules.forEach
    (
        ( rule, ruleIndex ) =>
        {
            if ( !actions.has ( rule.action ) )
            {
                diagnostics.push
                (
                    {
                        code: "unresolved-action-reference", pointer: `/rules/${ ruleIndex }/action`
                    }
                );
            }
            if ( !conditions.has ( rule.condition ) )
            {
                diagnostics.push
                (
                    {
                        code: "unresolved-condition-reference", pointer: `/rules/${ ruleIndex }/condition`
                    }
                );
            }
            if ( !events.has ( rule.event ) )
            {
                diagnostics.push
                (
                    {
                        code: "unresolved-event-reference", pointer: `/rules/${ ruleIndex }/event`
                    }
                );
            }

            const indexedEvent     = events.get ( rule.event );
            const indexedCondition = conditions.get ( rule.condition );
            if ( !indexedEvent || !indexedCondition )
            {
                // Return without a value after completing this code path.

                return;
            }

            const relation = `${ rule.event }\u0000${ rule.condition }`;
            if ( checkedRelations.has ( relation ) )
            {
                // Return without a value after completing this code path.

                return;
            }
            checkedRelations.add ( relation );

            if ( indexedCondition.item.predicate.name === "always" )
            {
                // Return without a value after completing this code path.

                return;
            }

            const payload = indexedEvent.item.payload ? payloads.get ( indexedEvent.item.payload )?.item : undefined;
            if ( indexedEvent.item.payload && !payload )
            {

                // Return without a value after completing this code path.

                return;
            }

            const parameterIdentifier = indexedCondition.item.dependencies [ 0 ];
            if ( !( payload?.parameters ?? [] ).includes ( parameterIdentifier ) )
            {
                diagnostics.push
                (
                    {
                        code: "undeclared-condition-dependency", pointer: `/rules/${ ruleIndex }/condition`
                    }
                );

                // Return without a value after completing this code path.

                return;
            }

            const parameter = parameters.get ( parameterIdentifier )?.item;
            if ( !parameter )
            {

                // Return without a value after completing this code path.

                return;
            }
            validatePredicateCompatibility (
                diagnostics, indexedCondition.item, indexedCondition.index, parameter );
        }
    );

    const uniqueDiagnostics = new Map<string, SemanticDiagnostic> ();
    diagnostics.forEach
    (
        diagnostic => uniqueDiagnostics.set (
        `${ diagnostic.pointer }\u0000${ diagnostic.code }`, diagnostic )
    );

    // Return the assembled array value.

    return [ ...uniqueDiagnostics.values () ].sort
    (
        ( left, right ) =>
        left.pointer === right.pointer ? compareText ( left.code, right.code )
            : compareText ( left.pointer, right.pointer )
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: validatePredicateCompatibility
//
// Description:
//
//   Validates predicate compatibility and reports deterministic diagnostics for every detected contract violation.
//
// Arguments:
//
//   diagnostics (SemanticDiagnostic[]):
//     The diagnostics collection inspected or transformed by this operation.
//
//   condition (Condition):
//     The condition used by this operation.
//
//   conditionIndex (number):
//     The condition index used by this operation.
//
//   parameter (ParameterDefinition):
//     The parameter used by this operation.
//
// Returns:
//
//   The deterministic diagnostics produced by validation.
//
//---------------------------------------------------------------------------------------------------------------------

function validatePredicateCompatibility (
    diagnostics: SemanticDiagnostic[], condition: Condition, conditionIndex: number, parameter: ParameterDefinition )
{
    if ( condition.predicate.name === "always" )
    {
        // Return without a value after completing this code path.

        return;
    }

    const arrayMembership = parameter.type === "array" && condition.predicate.name === "contains";
    if ( !acceptsPredicate ( parameter.type, condition.predicate.name ) )
    {
        diagnostics.push
        (
            {
                code: "incompatible-predicate-operand", pointer: `/conditions/${ conditionIndex }/predicate/name`
            }
        );
    }
    else if ( !arrayMembership && !acceptsValue ( parameter.type, condition.predicate.arguments.value ) )
    {
        diagnostics.push
        (
            {
                code: "incompatible-comparison-value",
                pointer: `/conditions/${ conditionIndex }/predicate/arguments/value`
            }
        );
    }
}
