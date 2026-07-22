//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Implements document validation worker behavior for browser-local model validation, evaluation, diagnostics, or
//   worker coordination.
//
//---------------------------------------------------------------------------------------------------------------------

import type { StatelessECAModel } from "../contracts/model.generated";
import type { ModelDiagnostic } from "./model-validation";
import type { WorkerRequestMessage, WorkerResponseMessage } from "./worker-protocol";

//---------------------------------------------------------------------------------------------------------------------
// Interface: WorkerValidationResult
//
// Description:
//
//   Defines the named fields and callable operations that make up worker validation result.
//
//---------------------------------------------------------------------------------------------------------------------
export interface WorkerValidationResult
{
    diagnostics: ModelDiagnostic[];
    documentRevision: number;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: validateDocumentInWorker
//
// Description:
//
//   Validates document in worker and reports deterministic diagnostics for every detected contract violation.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   documentRevision (number):
//     The document revision used by this operation.
//
// Returns:
//
//   The deterministic diagnostics produced by validation.
//
//---------------------------------------------------------------------------------------------------------------------

export function validateDocumentInWorker ( model: StatelessECAModel, documentRevision: number ):
    Promise<WorkerValidationResult>
{

    // Return the newly constructed Promise instance.

    return new Promise
    (
        ( resolve, reject ) =>
        {
            const worker = new Worker
            (
                new URL ( "./engine.worker.ts", import.meta.url ),
                {
                    type: "module"
                }
            );
            const requestIdentifier = crypto.randomUUID ();
            worker.onmessage = ( event: MessageEvent<WorkerResponseMessage> ) =>
            {
                const response = event.data;
                if ( response.kind !== "validation" || response.requestIdentifier !== requestIdentifier )
                {
                    // Return without a value after completing this code path.

                    return;
                }
                worker.terminate ();
                resolve
                (
                    {
                        diagnostics: response.diagnostics, documentRevision: response.documentRevision
                    }
                );
            };
            worker.onerror = () =>
            {
                worker.terminate ();
                reject ( new Error ( "The local validation worker failed." ) );
            };
            const request: WorkerRequestMessage =
            {
                kind: "validate", model, documentRevision, requestIdentifier
            };
            worker.postMessage ( request );
        }
    );
}
