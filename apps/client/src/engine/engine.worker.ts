//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Implements engine worker behavior for browser-local model validation, evaluation, diagnostics, or worker
//   coordination.
//
//---------------------------------------------------------------------------------------------------------------------

/// <reference lib="webworker" />

import { evaluate } from "./evaluator";
import { validateModel } from "./model-validation";
import type { WorkerRequestMessage, WorkerResponseMessage } from "./worker-protocol";

const cancelledRequests = new Set<string> ();

self.addEventListener
(
    "message", ( event: MessageEvent<WorkerRequestMessage> ) =>
    {
        const message = event.data;

        if ( message.kind === "cancel" )
        {
            cancelledRequests.add ( message.requestIdentifier );

            // Return without a value after completing this code path.

            return;
        }

        if ( message.kind === "validate" )
        {
            const response: WorkerResponseMessage =
            {
                diagnostics: validateModel ( message.model ).diagnostics,
                documentRevision: message.documentRevision,
                kind: "validation",
                requestIdentifier: message.requestIdentifier
            };
            self.postMessage ( response );

            // Return without a value after completing this code path.

            return;
        }

        if ( cancelledRequests.delete ( message.requestIdentifier ) )
        {
            const response: WorkerResponseMessage =
            {
                kind: "cancelled", requestIdentifier: message.requestIdentifier
            };
            self.postMessage ( response );

            // Return without a value after completing this code path.

            return;
        }

        const response: WorkerResponseMessage =
        {
            kind: "result",
            requestIdentifier: message.requestIdentifier,
            documentRevision: message.documentRevision,
            result: evaluate ( message.request )
        };
        self.postMessage ( response );
    }
);
