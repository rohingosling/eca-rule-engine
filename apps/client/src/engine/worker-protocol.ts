//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Worker messages for cancellable single-action queries, including explicit ambiguity outcomes.
//
//---------------------------------------------------------------------------------------------------------------------

import type { EvaluationRequest, EvaluationResult } from "./types";
import type { StatelessECAModel } from "../contracts/model.generated";
import type { ModelDiagnostic } from "./model-validation";

//---------------------------------------------------------------------------------------------------------------------
// Interface: WorkerEvaluateMessage
//
// Description:
//
//   Defines the named fields and callable operations that make up worker evaluate message.
//
//---------------------------------------------------------------------------------------------------------------------
export interface WorkerEvaluateMessage
{
    kind: "evaluate";
    requestIdentifier: string;
    documentRevision: number;
    request: EvaluationRequest;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: WorkerCancelMessage
//
// Description:
//
//   Defines the named fields and callable operations that make up worker cancel message.
//
//---------------------------------------------------------------------------------------------------------------------
export interface WorkerCancelMessage
{
    kind: "cancel";
    requestIdentifier: string;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: WorkerValidateMessage
//
// Description:
//
//   Defines the named fields and callable operations that make up worker validate message.
//
//---------------------------------------------------------------------------------------------------------------------
export interface WorkerValidateMessage
{
    kind: "validate";
    model: StatelessECAModel;
    requestIdentifier: string;
    documentRevision: number;
}

//---------------------------------------------------------------------------------------------------------------------
// Type: WorkerRequestMessage
//
// Description:
//
//   Defines the valid representation of worker request message.
//
//---------------------------------------------------------------------------------------------------------------------
export type WorkerRequestMessage = WorkerEvaluateMessage | WorkerCancelMessage | WorkerValidateMessage;

//---------------------------------------------------------------------------------------------------------------------
// Interface: WorkerResultMessage
//
// Description:
//
//   Defines the named fields and callable operations that make up worker result message.
//
//---------------------------------------------------------------------------------------------------------------------
export interface WorkerResultMessage
{
    kind: "result";
    requestIdentifier: string;
    documentRevision: number;
    result: EvaluationResult;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: WorkerCancelledMessage
//
// Description:
//
//   Defines the named fields and callable operations that make up worker cancelled message.
//
//---------------------------------------------------------------------------------------------------------------------
export interface WorkerCancelledMessage
{
    kind: "cancelled";
    requestIdentifier: string;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: WorkerValidationMessage
//
// Description:
//
//   Defines the named fields and callable operations that make up worker validation message.
//
//---------------------------------------------------------------------------------------------------------------------
export interface WorkerValidationMessage
{
    diagnostics: ModelDiagnostic[];
    documentRevision: number;
    kind: "validation";
    requestIdentifier: string;
}

//---------------------------------------------------------------------------------------------------------------------
// Type: WorkerResponseMessage
//
// Description:
//
//   Defines the valid representation of worker response message.
//
//---------------------------------------------------------------------------------------------------------------------
export type WorkerResponseMessage = WorkerResultMessage | WorkerCancelledMessage | WorkerValidationMessage;
