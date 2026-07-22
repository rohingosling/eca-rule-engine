//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Pure browser evaluator for the version 1 stateless ECA contract.
//
//---------------------------------------------------------------------------------------------------------------------

import type { Condition, StatelessECAModel } from "../contracts/model.generated";
import { MAXIMUM_DIAGNOSTIC_MESSAGE_CODE_POINTS } from "../contracts/contract-limits";
import type { ConditionTrace, EvaluationRequest, EvaluationResult, JsonValue, RuleTrace } from "./types";

const DIAGNOSTIC_MESSAGE_TRUNCATION_MARKER = "\u2026";

//---------------------------------------------------------------------------------------------------------------------
// Function: compareStringsByCodePoint
//
// Description:
//
//   Compares strings by code point using the deterministic ordering required by serialized diagnostics and traces.
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

function compareStringsByCodePoint ( left: string, right: string ): number
{
    const leftCodePoints  = Array.from ( left, character => character.codePointAt ( 0 )! );
    const rightCodePoints = Array.from ( right, character => character.codePointAt ( 0 )! );
    const commonLength    = Math.min ( leftCodePoints.length, rightCodePoints.length );

    for ( let index = 0; index < commonLength; index++ )
    {
        const difference = leftCodePoints [ index ] - rightCodePoints [ index ];
        if ( difference !== 0 )
        {

            // Return the difference.

            return difference;
        }
    }

    // Return the value produced by this code path.

    return leftCodePoints.length - rightCodePoints.length;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: limitDiagnosticMessage
//
// Description:
//
//   Restricts diagnostic message using the supplied inputs and current state.
//
// Arguments:
//
//   message (string):
//     The message used by this operation.
//
// Returns:
//
//   The limit diagnostic message result.
//
//---------------------------------------------------------------------------------------------------------------------

export function limitDiagnosticMessage ( message: string ): string
{
    const codePoints = Array.from ( message );

    if ( codePoints.length <= MAXIMUM_DIAGNOSTIC_MESSAGE_CODE_POINTS )
    {

        // Return the message.

        return message;
    }

    // Return the result produced by the delegated operation.

    return codePoints.slice ( 0, MAXIMUM_DIAGNOSTIC_MESSAGE_CODE_POINTS - 1 ).join ( "" )
        + DIAGNOSTIC_MESSAGE_TRUNCATION_MARKER;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: jsonValuesEqual
//
// Description:
//
//   Determines whether JSON values equal holds for the supplied value or application state.
//
// Arguments:
//
//   left (JsonValue):
//     The left used by this operation.
//
//   right (JsonValue):
//     The right used by this operation.
//
// Returns:
//
//   True when the requested condition holds; otherwise false.
//
//---------------------------------------------------------------------------------------------------------------------

export function jsonValuesEqual ( left: JsonValue, right: JsonValue ): boolean
{
    if ( left === right )
    {

        // Return true for this code path.

        return true;
    }
    if ( Array.isArray ( left ) || Array.isArray ( right ) )
    {

        // Return the result produced by the delegated operation.

        return Array.isArray ( left ) && Array.isArray ( right ) && left.length === right.length
            && left.every ( ( value, index ) => jsonValuesEqual ( value, right [ index ] ) );
    }
    if ( left === null || right === null || typeof left !== "object" || typeof right !== "object" )
    {

        // Return false for this code path.

        return false;
    }

    const leftKeys  = Object.keys ( left ).sort ( compareStringsByCodePoint );
    const rightKeys = Object.keys ( right ).sort ( compareStringsByCodePoint );

    // Return the value produced by this code path.

    return leftKeys.length === rightKeys.length
        && leftKeys.every
        (
            ( key, index ) => key === rightKeys [ index ]
            && jsonValuesEqual ( left [ key ], right [ key ] )
        );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: orderedComparison
//
// Description:
//
//   Performs the ordered comparison operation using the supplied inputs and current state.
//
// Arguments:
//
//   actual (JsonValue):
//     The actual used by this operation.
//
//   expected (JsonValue):
//     The expected used by this operation.
//
// Returns:
//
//   A negative, zero, or positive value representing the deterministic ordering, or no value when operands cannot be
//   ordered.
//
//---------------------------------------------------------------------------------------------------------------------

function orderedComparison ( actual: JsonValue, expected: JsonValue ): number | undefined
{
    if ( typeof actual === "number" && typeof expected === "number" )
    {

        // Return the value produced by this code path.

        return actual - expected;
    }
    if ( typeof actual === "string" && typeof expected === "string" )
    {

        // Return the result produced by the delegated operation.

        return compareStringsByCodePoint ( actual, expected );
    }

    // Return no value for this code path.

    return undefined;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: comparePredicate
//
// Description:
//
//   Compares predicate using the deterministic ordering required by serialized diagnostics and traces.
//
// Arguments:
//
//   name (string):
//     The name used by this operation.
//
//   actual (JsonValue):
//     The actual used by this operation.
//
//   expected (JsonValue):
//     The expected used by this operation.
//
// Returns:
//
//   A negative, zero, or positive value representing the deterministic ordering, or no value when operands cannot be
//   ordered.
//
//---------------------------------------------------------------------------------------------------------------------

export function comparePredicate ( name: string, actual: JsonValue, expected: JsonValue ): boolean
{
    const ordering = orderedComparison ( actual, expected );

    switch ( name )
    {
        case "equals":

            // Return the result produced by the delegated operation.

            return jsonValuesEqual ( actual, expected );
        case "notEquals":

            // Return the value produced by this code path.

            return !jsonValuesEqual ( actual, expected );
        case "greaterThan":

            // Return the value produced by this code path.

            return ordering !== undefined && ordering > 0;
        case "greaterThanOrEqual":

            // Return the value produced by this code path.

            return ordering !== undefined && ordering >= 0;
        case "lessThan":

            // Return the value produced by this code path.

            return ordering !== undefined && ordering < 0;
        case "lessThanOrEqual":

            // Return the value produced by this code path.

            return ordering !== undefined && ordering <= 0;
        case "contains":
            if ( typeof actual === "string" && typeof expected === "string" )
            {

        // Return the result produced by the delegated operation.

        return actual.includes ( expected );
    }

            // Return the result produced by the delegated operation.

            return Array.isArray ( actual ) && actual.some ( value => jsonValuesEqual ( value, expected ) );
        default:

            // Return false for this code path.

            return false;
    }
}

//---------------------------------------------------------------------------------------------------------------------
// Function: evaluateCondition
//
// Description:
//
//   Evaluates condition using the current event occurrence and rule data, without retaining prior-event state.
//
// Arguments:
//
//   condition (Condition):
//     The condition used by this operation.
//
//   payload (Record<string, JsonValue>):
//     The payload inspected while evaluating or validating the current event occurrence.
//
// Returns:
//
//   The evaluation result, selected action, condition trace, or predicate outcome produced for the current input.
//
//---------------------------------------------------------------------------------------------------------------------

function evaluateCondition ( condition: Condition, payload: Record<string, JsonValue> ): ConditionTrace
{
    const missingDependencies = condition.dependencies.filter ( dependency => !Object.hasOwn ( payload, dependency ) );

    if ( missingDependencies.length > 0 )
    {

        // Return the value produced by this code path.

        return (
            {
                condition: condition.id, result: false, reason: "missing-dependency", missingDependencies
            }
        );
    }

    const predicate = condition.predicate;
    const result = predicate.name === "always"
        ? true
        : comparePredicate
        (
            predicate.name, payload [ predicate.arguments.parameter ],
            predicate.arguments.value as JsonValue
        );

    // Return the value selected by the evaluated condition.

    return (
        {
            condition: condition.id,
            result,
            reason: result ? "predicate-true" : "predicate-false",
            missingDependencies: []
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: evaluate
//
// Description:
//
//   Evaluates using the current event occurrence and rule data, without retaining prior-event state.
//
// Arguments:
//
//   request (EvaluationRequest):
//     The request used by this operation.
//
// Returns:
//
//   The evaluation result, selected action, condition trace, or predicate outcome produced for the current input.
//
//---------------------------------------------------------------------------------------------------------------------

export function evaluate ( request: EvaluationRequest ): EvaluationResult
{
    const payload = request.event.payload ??
        {
        };
    const matchingRules = request.model.rules
        .filter ( rule => rule.event === request.event.type )
        .sort ( ( left, right ) => compareStringsByCodePoint ( left.id, right.id ) );
    const conditionIdentifiers = [ ...new Set ( matchingRules.map ( rule => rule.condition ) ) ]
        .sort ( compareStringsByCodePoint );
    const conditionsByIdentifier = new Map ( request.model.conditions.map ( condition => [ condition.id, condition ] ) );
    const conditionTraces = conditionIdentifiers.map
    (
        identifier =>
        evaluateCondition ( conditionsByIdentifier.get ( identifier )!, payload )
    );
    const conditionResults = new Map ( conditionTraces.map ( trace => [ trace.condition, trace.result ] ) );
    const ruleTraces: RuleTrace[] = matchingRules.map
    (
        rule => (
        {
            rule: rule.id,
            condition: rule.condition,
            conditionResult: conditionResults.get ( rule.condition ) ?? false,
            action: rule.action,
            matched: conditionResults.get ( rule.condition ) ?? false
        })
    );
    const matchingRuleTraces = ruleTraces.filter ( rule => rule.matched );
    const actionIds = [ ...new Set ( matchingRuleTraces.map ( rule => rule.action ) ) ]
        .sort ( compareStringsByCodePoint );
    const trace = request.includeTrace ?
        {
            conditions: conditionTraces, rules: ruleTraces
        } : undefined;

    if ( actionIds.length > 1 )
    {
        const ruleIds = matchingRuleTraces.map ( rule => rule.rule ).sort ( compareStringsByCodePoint );
        const message = limitDiagnosticMessage
        (
            `Event '${ request.event.type }' matched distinct actions [${ actionIds.join ( ", " ) }] `
                + `through rules [${ ruleIds.join ( ", " ) }].`
        );

        // Return the value selected by the evaluated condition.

        return (
            {
                outcome: "ambiguous",
                selectedAction: null,
                diagnostic:
                    {
                        code: "ambiguous-action-selection",
                        actionIds,
                        ruleIds,
                        message,
                        pointer: "/type"
                    },
                ...( trace ?
                    {
                        trace
                    } :
                    {
                    } )
            }
        );
    }

    if ( actionIds.length === 1 )
    {
        const selectedAction = request.model.actions.find ( action => action.id === actionIds [ 0 ] );
        if ( !selectedAction )
        {
            throw new Error ( `Rule references unresolved action '${ actionIds [ 0 ] }'. Validate the model before evaluation.` );
        }

        // Return the value selected by the evaluated condition.

        return (
            {
                outcome: "action-selected", selectedAction, ...( trace ?
                {
                    trace
                } :
                {
                } )
            }
        );
    }

    // Return the value selected by the evaluated condition.

    return (
        {
            outcome: "no-action", selectedAction: null, ...( trace ?
            {
                trace
            } :
            {
            } )
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: isSupportedModel
//
// Description:
//
//   Determines whether is supported model holds for the supplied value or application state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
// Returns:
//
//   True when the requested condition holds; otherwise false.
//
//---------------------------------------------------------------------------------------------------------------------

export function isSupportedModel ( model: StatelessECAModel ): boolean
{

    // Return the value produced by this code path.

    return model.schemaVersion === "1.0";
}
