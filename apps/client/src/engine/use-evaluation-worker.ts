//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   React adapter that owns the evaluator worker and provides immediate cancellation by restart.
//
//---------------------------------------------------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import type { WorkerEvaluateMessage, WorkerResponseMessage } from "./worker-protocol";

//---------------------------------------------------------------------------------------------------------------------
// Interface: EvaluationWorkerController
//
// Description:
//
//   Defines the named fields and callable operations that make up evaluation worker controller.
//
//---------------------------------------------------------------------------------------------------------------------
export interface EvaluationWorkerController
{
    cancel: () => void;
    evaluate: ( request: WorkerEvaluateMessage ) => boolean;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: useEvaluationWorker
//
// Description:
//
//   Creates and maintains evaluation worker state for the lifetime of the calling React component.
//
// Arguments:
//
//   receive (( response: WorkerResponseMessage ) => void):
//     The receive used by this operation.
//
//   fail (() => void):
//     The fail used by this operation.
//
// Returns:
//
//   The use evaluation worker result.
//
//---------------------------------------------------------------------------------------------------------------------

export function useEvaluationWorker (
    receive: ( response: WorkerResponseMessage ) => void, fail: () => void ): EvaluationWorkerController
{
    const [ generation, setGeneration ] = useState ( 0 );
    const workerReference = useRef<Worker | undefined> ( undefined );
    const receiveReference = useRef ( receive );
    const failReference = useRef ( fail );
    receiveReference.current = receive;
    failReference.current = fail;

    useEffect
    (
        () =>
        {
            const worker = new Worker
            (
                new URL ( "./engine.worker.ts", import.meta.url ),
                {
                    type: "module"
                }
            );
            workerReference.current = worker;
            worker.onmessage = ( event: MessageEvent<WorkerResponseMessage> ) => receiveReference.current ( event.data );
            worker.onerror = () =>
            {
                worker.terminate ();
                if ( workerReference.current === worker )
                {
                    workerReference.current = undefined;
                }
                failReference.current ();
                setGeneration ( currentGeneration => currentGeneration + 1 );
            };

            // Return the value produced by this code path.

            return () => worker.terminate ();
        }, [ generation ]
    );

    //-----------------------------------------------------------------------------------------------------------------
    // Function: cancel
    //
    // Description:
    //
    //   Performs the cancel operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The cancel result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const cancel = () =>
    {
        workerReference.current?.terminate ();
        workerReference.current = undefined;
        setGeneration ( currentGeneration => currentGeneration + 1 );
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: evaluate
    //
    // Description:
    //
    //   Evaluates using the current event occurrence and rule data, without retaining prior-event state.
    //
    // Arguments:
    //
    //   request (WorkerEvaluateMessage):
    //     The request used by this operation.
    //
    // Returns:
    //
    //   The evaluation result, selected action, condition trace, or predicate outcome produced for the current input.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const evaluate = ( request: WorkerEvaluateMessage ): boolean =>
    {
        if ( !workerReference.current )
        {

            // Return false for this code path.

            return false;
        }
        workerReference.current.postMessage ( request );

        // Return true for this code path.

        return true;
    };

    // Return the value produced by this code path.

    return (
        {
            cancel, evaluate
        }
    );
}
