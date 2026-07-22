//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Implements types behavior for browser-local model validation, evaluation, diagnostics, or worker coordination.
//
//---------------------------------------------------------------------------------------------------------------------

import type { Action, StatelessECAModel } from "../contracts/model.generated";

//---------------------------------------------------------------------------------------------------------------------
// Type: JsonValue
//
// Description:
//
//   Defines the valid representation of JSON value.
//
//---------------------------------------------------------------------------------------------------------------------
export type JsonValue = null | boolean | number | string | JsonValue[] |
{
    [ key: string ]: JsonValue
};

//---------------------------------------------------------------------------------------------------------------------
// Interface: EventOccurrence
//
// Description:
//
//   Defines the named fields and callable operations that make up event occurrence.
//
//---------------------------------------------------------------------------------------------------------------------
export interface EventOccurrence
{
    type: string;
    payload?: Record<string, JsonValue>;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: ConditionTrace
//
// Description:
//
//   Defines the named fields and callable operations that make up condition trace.
//
//---------------------------------------------------------------------------------------------------------------------
export interface ConditionTrace
{
    condition: string;
    result: boolean;
    reason: "predicate-true" | "predicate-false" | "missing-dependency";
    missingDependencies: string[];
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: RuleTrace
//
// Description:
//
//   Defines the named fields and callable operations that make up rule trace.
//
//---------------------------------------------------------------------------------------------------------------------
export interface RuleTrace
{
    rule: string;
    condition: string;
    conditionResult: boolean;
    action: string;
    matched: boolean;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: AmbiguousActionSelectionDiagnostic
//
// Description:
//
//   Defines the named fields and callable operations that make up ambiguous action selection diagnostic.
//
//---------------------------------------------------------------------------------------------------------------------
export interface AmbiguousActionSelectionDiagnostic
{
    actionIds: string[];
    code: "ambiguous-action-selection";
    message: string;
    pointer: "/type";
    ruleIds: string[];
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: EvaluationResultBase
//
// Description:
//
//   Defines the named fields and callable operations that make up evaluation result base.
//
//---------------------------------------------------------------------------------------------------------------------
interface EvaluationResultBase
{
    trace?:
    {
        conditions: ConditionTrace[]; rules: RuleTrace[]
    };
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: ActionSelectedEvaluationResult
//
// Description:
//
//   Defines the named fields and callable operations that make up action selected evaluation result.
//
//---------------------------------------------------------------------------------------------------------------------
export interface ActionSelectedEvaluationResult extends EvaluationResultBase
{
    outcome: "action-selected";
    selectedAction: Action;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: NoActionEvaluationResult
//
// Description:
//
//   Defines the named fields and callable operations that make up no action evaluation result.
//
//---------------------------------------------------------------------------------------------------------------------
export interface NoActionEvaluationResult extends EvaluationResultBase
{
    outcome: "no-action";
    selectedAction: null;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: AmbiguousEvaluationResult
//
// Description:
//
//   Defines the named fields and callable operations that make up ambiguous evaluation result.
//
//---------------------------------------------------------------------------------------------------------------------
export interface AmbiguousEvaluationResult extends EvaluationResultBase
{
    diagnostic: AmbiguousActionSelectionDiagnostic;
    outcome: "ambiguous";
    selectedAction: null;
}

//---------------------------------------------------------------------------------------------------------------------
// Type: EvaluationResult
//
// Description:
//
//   Defines the valid representation of evaluation result.
//
//---------------------------------------------------------------------------------------------------------------------
export type EvaluationResult =
    ActionSelectedEvaluationResult | NoActionEvaluationResult | AmbiguousEvaluationResult;

//---------------------------------------------------------------------------------------------------------------------
// Interface: EvaluationRequest
//
// Description:
//
//   Defines the named fields and callable operations that make up evaluation request.
//
//---------------------------------------------------------------------------------------------------------------------
export interface EvaluationRequest
{
    model: StatelessECAModel;
    event: EventOccurrence;
    includeTrace: boolean;
}
