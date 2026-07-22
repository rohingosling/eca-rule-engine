//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Browser-local event simulator and cancellable worker lifecycle.
//
//---------------------------------------------------------------------------------------------------------------------

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
    SIMULATOR_AMBIGUITY_IDENTIFIER_PREVIEW_LIMIT, SIMULATOR_CONDITION_TRACE_PAGE_SIZE,
    SIMULATOR_EXPERIMENT_HISTORY_LIMIT, SIMULATOR_RULE_TRACE_PAGE_SIZE
} from "../config/editor-layout";
import type { EventType, ParameterDefinition, StatelessECAModel } from "../contracts/model.generated";
import { describeModelValidationFailure, validateModel } from "../engine/model-validation";
import type { EvaluationResult, JsonValue } from "../engine/types";
import { useEvaluationWorker } from "../engine/use-evaluation-worker";
import type { WorkerEvaluateMessage, WorkerResponseMessage } from "../engine/worker-protocol";
import { summarizeValues } from "./collection-summary";
import { calculateCollectionPage, CollectionPagination } from "./CollectionPagination";
import { createPayloadDraft, parsePayload } from "./simulator-model";
import { definitionName, PREDICATE_NAMES, resolveEventParameters } from "./model-metadata";

//---------------------------------------------------------------------------------------------------------------------
// Interface: SimulatorProperties
//
// Description:
//
//   Defines the named fields and callable operations that make up simulator properties.
//
//---------------------------------------------------------------------------------------------------------------------
interface SimulatorProperties
{
    documentRevision: number;
    experimentHistory?: SimulatorExperiment[];
    model: StatelessECAModel;
    setExperimentHistory?: ( history: SimulatorExperiment[] ) => void;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: SimulatorExperiment
//
// Description:
//
//   Defines the named fields and callable operations that make up simulator experiment.
//
//---------------------------------------------------------------------------------------------------------------------
export interface SimulatorExperiment
{
    documentRevision: number;
    eventIdentifier: string;
    modelSnapshot: StatelessECAModel;
    payload: Record<string, JsonValue>;
    requestIdentifier: string;
    result: EvaluationResult;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: PendingExperiment
//
// Description:
//
//   Defines the named fields and callable operations that make up pending experiment.
//
//---------------------------------------------------------------------------------------------------------------------
interface PendingExperiment extends Omit<SimulatorExperiment, "result">
{
}

//---------------------------------------------------------------------------------------------------------------------
// Function: toggleEntry
//
// Description:
//
//   Performs the toggle entry operation using the supplied inputs and current state.
//
// Arguments:
//
//   entries (string[]):
//     The entries collection inspected or transformed by this operation.
//
//   entry (string):
//     The entry used by this operation.
//
//   included (boolean):
//     The included used by this operation.
//
// Returns:
//
//   The toggle entry result.
//
//---------------------------------------------------------------------------------------------------------------------

function toggleEntry ( entries: string[], entry: string, included: boolean ): string[]
{

    // Return the value selected by the evaluated condition.

    return included ? [ ...new Set ( [ ...entries, entry ] ) ] : entries.filter ( value => value !== entry );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: ParameterInput
//
// Description:
//
//   Renders the parameter input component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (structured object):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

function ParameterInput (
    {
        parameter, value, included, error, setIncluded, setValue }:
    {
        parameter: ParameterDefinition; value: string; included: boolean; error?: string;
        setIncluded: ( included: boolean ) => void; setValue: ( value: string ) => void
    } )
{
    const errorIdentifier = `simulator-${ parameter.id }-error`;
    const commonProperties =
    {
        "aria-describedby": error ? errorIdentifier : undefined,
        disabled: !included,
        value,
        onChange: ( event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> ) =>
            setValue ( event.target.value )
    };
    const valueControl = parameter.type === "boolean"
        ? <select aria-label={ `${ parameter.id } value` } { ...commonProperties }>
            <option value="false">false</option><option value="true">true</option>
        </select>
        : parameter.type === "null"
            ? <input aria-label={ `${ parameter.id } value` } value="null" disabled={ !included } readOnly />
            : parameter.type === "array" || parameter.type === "object"
                ? <textarea aria-label={ `${ parameter.id } value` } rows={ 3 } { ...commonProperties } />
                : <input aria-label={ `${ parameter.id } value` }
                    type={ parameter.type === "number" || parameter.type === "integer" ? "number" : "text" }
                    step={ parameter.type === "integer" ? "1" : parameter.type === "number" ? "any" : undefined }
                    { ...commonProperties } />;

    // Return the rendered interface element.

    return <fieldset className="simulator-parameter">
        <legend>{ parameter.name } <span>{ parameter.id } · { parameter.type }</span></legend>
        <label className="simulator-include"><input type="checkbox" checked={ included }
            onChange={ event => setIncluded ( event.target.checked ) } />Include in payload</label>
        <label>Value{ valueControl }</label>
        { parameter.description && <p>{ parameter.description }</p> }
        { error && <span id={ errorIdentifier } className="field-error">{ error }</span> }
    </fieldset>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: Simulator
//
// Description:
//
//   Renders the simulator component from its supplied state and callbacks, producing the corresponding user-interface
//   element.
//
// Arguments:
//
//   properties (structured object):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function Simulator (
{
    model, documentRevision, experimentHistory: controlledExperimentHistory,
    setExperimentHistory: setControlledExperimentHistory
}: SimulatorProperties )
{
    const initialEventIdentifier = model.events [ 0 ]?.id ?? "";
    const [ eventIdentifier, setEventIdentifier ] = useState ( initialEventIdentifier );
    const [ parameterDraft, setParameterDraft ] = useState ( () => createPayloadDraft ( model, model.events [ 0 ] ) );
    const [ includedParameterNames, setIncludedParameterNames ] = useState<string[]> ( [] );
    const [ parameterErrors, setParameterErrors ] = useState<Record<string, string>>
    (
        {
        }
    );
    const [ experiment, setExperiment ] = useState<SimulatorExperiment>();
    const [ localExperimentHistory, setLocalExperimentHistory ] = useState<SimulatorExperiment[]> ( [] );
    const [ compiledDocumentRevision, setCompiledDocumentRevision ] = useState<number>();
    const [ operationState, setOperationState ] = useState<"idle" | "running" | "failed"> ( "idle" );
    const [ operationMessage, setOperationMessage ] = useState ( "Choose an event and enter its payload." );
    const activeRequestIdentifierReference = useRef<string | undefined> ( undefined );
    const pendingExperimentReference = useRef<PendingExperiment | undefined> ( undefined );
    const experimentHistory = controlledExperimentHistory ?? localExperimentHistory;
    const updateExperimentHistory = setControlledExperimentHistory ?? setLocalExperimentHistory;

    const selectedEvent = model.events.find ( eventType => eventType.id === eventIdentifier );
    const selectedParameters = resolveEventParameters ( model, selectedEvent );

    //-----------------------------------------------------------------------------------------------------------------
    // Function: receiveWorkerResponse
    //
    // Description:
    //
    //   Performs the receive worker response operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   response (WorkerResponseMessage):
    //     The response used by this operation.
    //
    // Returns:
    //
    //   The receive worker response result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const receiveWorkerResponse = ( response: WorkerResponseMessage ) =>
    {
        if ( response.requestIdentifier !== activeRequestIdentifierReference.current )
        {

            // Return without a value after completing this code path.

            return;
        }
        if ( response.kind === "cancelled" )
        {
            setOperationState ( "idle" );
            setOperationMessage ( "Evaluation cancelled." );

            // Return without a value after completing this code path.

            return;
        }
        if ( response.kind !== "result" )
        {
            // Return without a value after completing this code path.

            return;
        }
        const pendingExperiment = pendingExperimentReference.current;
        if ( !pendingExperiment || response.documentRevision !== pendingExperiment.documentRevision )
        {

            // Return without a value after completing this code path.

            return;
        }
        const completedExperiment: SimulatorExperiment =
        {
            ...pendingExperiment, result: response.result
        };
        setExperiment ( completedExperiment );
        setCompiledDocumentRevision ( completedExperiment.documentRevision );
        updateExperimentHistory
        (
            [ completedExperiment, ...experimentHistory ].slice (
            0, SIMULATOR_EXPERIMENT_HISTORY_LIMIT )
        );
        setOperationState ( "idle" );
        setOperationMessage
        (
            response.result.outcome === "action-selected"
            ? "Action selected."
            : response.result.outcome === "no-action"
                ? "No action matched."
                : `Ambiguous action selection: ${ response.result.diagnostic.message }`
        );
    };

    const worker = useEvaluationWorker
    (
        receiveWorkerResponse, () =>
        {
            setOperationState ( "failed" );
            setOperationMessage ( "The local rule-engine worker could not complete the evaluation. A new worker is ready." );
        }
    );

    useEffect
    (
        () =>
        {
            if ( model.events.some ( eventType => eventType.id === eventIdentifier ) )
            {
                // Return without a value after completing this code path.

                return;
            }
            const nextEvent = model.events [ 0 ];
            setEventIdentifier ( nextEvent?.id ?? "" );
            setParameterDraft ( createPayloadDraft ( model, nextEvent ) );
            setIncludedParameterNames ( [] );
            setParameterErrors
            (
                {
                }
            );
        }, [ model, eventIdentifier ]
    );

    //-----------------------------------------------------------------------------------------------------------------
    // Function: invalidateExperiment
    //
    // Description:
    //
    //   Performs the invalidate experiment operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The invalidate experiment result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const invalidateExperiment = () =>
    {
        if ( operationState === "running" )
        {
            worker.cancel ();
        }
        activeRequestIdentifierReference.current = undefined;
        pendingExperimentReference.current = undefined;
        setExperiment ( undefined );
        setOperationState ( "idle" );
        setOperationMessage ( "Inputs changed. Raise the event to evaluate this occurrence." );
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: cancelEvaluation
    //
    // Description:
    //
    //   Performs the cancel evaluation operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The cancel evaluation result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const cancelEvaluation = () =>
    {
        if ( operationState !== "running" )
        {

            // Return without a value after completing this code path.

            return;
        }
        worker.cancel ();
        activeRequestIdentifierReference.current = undefined;
        pendingExperimentReference.current = undefined;
        setOperationState ( "idle" );
        setOperationMessage ( "Evaluation cancelled." );
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: selectEvent
    //
    // Description:
    //
    //   Selects event using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   identifier (string):
    //     The stable identifier used to locate the corresponding model element.
    //
    // Returns:
    //
    //   The select event result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const selectEvent = ( identifier: string ) =>
    {
        invalidateExperiment ();
        const eventType = model.events.find ( candidate => candidate.id === identifier );
        setEventIdentifier ( identifier );
        setParameterDraft ( createPayloadDraft ( model, eventType ) );
        setIncludedParameterNames ( [] );
        setParameterErrors
        (
            {
            }
        );
        setExperiment ( undefined );
        setOperationState ( "idle" );
        setOperationMessage ( "Enter the event payload, then raise the event." );
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: evaluateExperiment
    //
    // Description:
    //
    //   Evaluates experiment using the current event occurrence and rule data, without retaining prior-event state.
    //
    // Arguments:
    //
    //   modelSnapshot (StatelessECAModel):
    //     The model snapshot used by this operation.
    //
    //   revision (number):
    //     The revision used by this operation.
    //
    //   selectedEventIdentifier (string):
    //     The stable selected event identifier used to locate the corresponding model element.
    //
    //   payload (Record<string, JsonValue>):
    //     The payload inspected while evaluating or validating the current event occurrence.
    //
    // Returns:
    //
    //   The evaluation result, selected action, condition trace, or predicate outcome produced for the current input.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const evaluateExperiment = ( modelSnapshot: StatelessECAModel, revision: number,
        selectedEventIdentifier: string, payload: Record<string, JsonValue> ) =>
    {
        const modelValidationResult = validateModel ( modelSnapshot );
        if ( !modelValidationResult.model )
        {
            setOperationState ( "failed" );
            setOperationMessage
            (
                `Resolve model diagnostics before raising the event. ${
                describeModelValidationFailure ( modelValidationResult ) }`
            );

            // Return without a value after completing this code path.

            return;
        }

        const requestIdentifier = crypto.randomUUID ();
        const pendingExperiment: PendingExperiment =
        {
            eventIdentifier: selectedEventIdentifier,
            payload,
            documentRevision: revision,
            modelSnapshot,
            requestIdentifier
        };
        activeRequestIdentifierReference.current = requestIdentifier;
        pendingExperimentReference.current = pendingExperiment;
        setOperationState ( "running" );
        setOperationMessage ( "Evaluating locally..." );
        const request: WorkerEvaluateMessage =
        {
            kind: "evaluate",
            requestIdentifier,
            documentRevision: revision,
            request:
            {
                model: modelSnapshot,
                event:
                {
                    type: selectedEventIdentifier, payload
                },
                includeTrace: true
            }
        };
        if ( !worker.evaluate ( request ) )
        {
            setOperationState ( "failed" );
            setOperationMessage ( "The local rule-engine worker is restarting. Try again." );
        }
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: raiseEvent
    //
    // Description:
    //
    //   Performs the raise event operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The raise event result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const raiseEvent = () =>
    {
        if ( !selectedEvent || operationState === "running" )
        {

            // Return without a value after completing this code path.

            return;
        }
        const modelValidationResult = validateModel ( model );
        if ( !modelValidationResult.model )
        {
            setOperationState ( "failed" );
            setOperationMessage
            (
                `Resolve model diagnostics before raising the event. ${
                describeModelValidationFailure ( modelValidationResult ) }`
            );

            // Return without a value after completing this code path.

            return;
        }
        const parsedPayload = parsePayload ( model, selectedEvent, parameterDraft, includedParameterNames );
        setParameterErrors ( parsedPayload.errors );
        if ( Object.keys ( parsedPayload.errors ).length )
        {
            setOperationState ( "failed" );
            setOperationMessage ( "Correct the payload values before raising the event." );

            // Return without a value after completing this code path.

            return;
        }

        const requestIdentifier = crypto.randomUUID ();
        const pendingExperiment: PendingExperiment =
        {
            eventIdentifier,
            payload: parsedPayload.payload,
            documentRevision,
            modelSnapshot: model,
            requestIdentifier
        };
        activeRequestIdentifierReference.current = requestIdentifier;
        pendingExperimentReference.current = pendingExperiment;
        setOperationState ( "running" );
        setOperationMessage ( "Evaluating locally…" );
        const request: WorkerEvaluateMessage =
        {
            kind: "evaluate",
            requestIdentifier,
            documentRevision,
            request:
            {
                model,
                event:
                {
                    type: eventIdentifier, payload: parsedPayload.payload
                },
                includeTrace: true
            }
        };
        if ( !worker.evaluate ( request ) )
        {
            setOperationState ( "failed" );
            setOperationMessage ( "The local rule-engine worker is restarting. Try again." );
        }
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: submit
    //
    // Description:
    //
    //   Performs the submit operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   event (FormEvent):
    //     The event used by this operation.
    //
    // Returns:
    //
    //   The submit result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const submit = ( event: FormEvent ) =>
    {
        event.preventDefault ();
        raiseEvent ();
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: handleKeyboardCommand
    //
    // Description:
    //
    //   Handles keyboard command and coordinates the associated state transition or user-interface response.
    //
    // Arguments:
    //
    //   event (ReactKeyboardEvent<HTMLFormElement>):
    //     The event used by this operation.
    //
    // Returns:
    //
    //   The handle keyboard command result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const handleKeyboardCommand = ( event: ReactKeyboardEvent<HTMLFormElement> ) =>
    {
        if ( event.ctrlKey && event.key === "Enter" )
        {
            event.preventDefault ();
            raiseEvent ();
        }
    };

    // Return the rendered interface element.

    return <div className="simulator-workspace">
        <section className="simulator-input-panel" aria-labelledby="simulator-input-heading">
            <form className="simulator-form" onSubmit={ submit } onKeyDown={ handleKeyboardCommand }>
                <div><p className="eyebrow">Event occurrence</p><h2 id="simulator-input-heading">Raise an event</h2>
                    <p>Enter a payload. The query evaluates every rule connected to the selected event.</p></div>
                <label>Event<select value={ eventIdentifier } disabled={ model.events.length === 0 }
                    onChange={ event => selectEvent ( event.target.value ) }>
                    { model.events.length === 0 && <option value="">No events in this model</option> }
                    { model.events.map
                    (
                        eventType => <option key={ eventType.id } value={ eventType.id }>
                            { eventType.name } ({ eventType.id })
                        </option>
                    ) }
                </select></label>

                <fieldset className="simulator-group">
                    <legend>Event parameters</legend>
                    { selectedParameters.length ? selectedParameters.map
                    (
                        parameter => <ParameterInput
                                            key={ parameter.id }
                                            parameter={ parameter }
                                            value={ parameterDraft [ parameter.id ] ?? "" }
                                            included={ includedParameterNames.includes ( parameter.id ) }
                                            error={ Object.hasOwn ( parameterErrors, parameter.id )
                                                ? parameterErrors [ parameter.id ] : undefined }
                                            setIncluded={ included =>
                                            {
                            setIncludedParameterNames ( current => toggleEntry ( current, parameter.id, included ) );
                                                invalidateExperiment ();
                        } }
                                            setValue={ value =>
                                            {
                            setParameterDraft
                            (
                                current => ( (
                                    {
                                        ...current, [ parameter.id ]: value
                                    }
                                ) )
                            );
                                                invalidateExperiment ();
                        } } />
                    )
                        : <p className="empty-state">The selected event has no payload parameters.</p> }
                </fieldset>

                <div className="simulator-operation-actions">
                    <button type="submit" className="raise-event-button" disabled={ !selectedEvent || operationState === "running" }
                        title="Raise Event (Ctrl+Enter)">{ operationState === "running" ? "Evaluating…" : "Raise Event" }</button>
                    { operationState === "running" && <button type="button" className="secondary"
                        onClick={ cancelEvaluation }>Cancel evaluation</button> }
                </div>
                <p className={ operationState === "failed" ? "simulator-message field-error" : "simulator-message" }
                    role="status">{ operationMessage }</p>
                <dl className="engine-status"><div><dt>Worker</dt><dd>{ operationState === "running" ? "Busy" : "Ready" }</dd></div>
                    <div><dt>Contract</dt><dd>{ model.schemaVersion }</dd></div>
                    <div><dt>Predicates</dt><dd>{ PREDICATE_NAMES.join ( ", " ) }</dd></div>
                    <div><dt>Compiled revision</dt><dd>{ compiledDocumentRevision ?? "None" }</dd></div></dl>
            </form>
            <section className="experiment-history" aria-labelledby="experiment-history-heading">
                <div className="experiment-history-heading"><h3 id="experiment-history-heading">Experiment history</h3>
                    <span>{ experimentHistory.length } / { SIMULATOR_EXPERIMENT_HISTORY_LIMIT }</span></div>
                { experimentHistory.length === 0 ? <p className="empty-state">Completed experiments appear here in memory.</p>
                    : <ol>{ experimentHistory.map
                    (
                        historicalExperiment => <li key={ historicalExperiment.requestIdentifier }>
                            <div><strong>{ definitionName
                            (
                                historicalExperiment.modelSnapshot, "events",
                                historicalExperiment.eventIdentifier
                            ) }</strong>
                                <span>Revision { historicalExperiment.documentRevision } · {
                                    historicalExperiment.result.outcome }</span></div>
                            <button type="button" className="secondary" onClick={ () => setExperiment ( historicalExperiment ) }>
                                Inspect</button>
                            <button type="button" disabled={ operationState === "running" } onClick={ () => evaluateExperiment
                            (
                                historicalExperiment.modelSnapshot, historicalExperiment.documentRevision,
                                historicalExperiment.eventIdentifier, historicalExperiment.payload
                            ) }>Replay</button>
                        </li>
                    ) }</ol> }
            </section>
        </section>

        <section className="simulator-result-panel" aria-labelledby="simulator-result-heading">
            <div className="simulator-result-header"><p className="eyebrow">Evaluation result</p>
                <h2 id="simulator-result-heading">Rule-set query and trace</h2>
                <code>action = Q(event(payload), rules)</code></div>
            { !experiment ? <div className="simulator-empty-result">
                <h3>No event has been raised</h3>
                <p>The occurrence, condition outcomes, matching rules, and optional action will appear here.</p>
            </div> : <SimulatorResult key={ experiment.requestIdentifier } model={ experiment.modelSnapshot }
                experiment={ experiment } /> }
        </section>
    </div>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: SimulatorResult
//
// Description:
//
//   Renders the simulator result component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (structured object):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

function SimulatorResult (
    {
        model, experiment }:
        {
            model: StatelessECAModel; experiment: SimulatorExperiment
        } )
{
    const [ conditionPageIndex, setConditionPageIndex ] = useState ( 0 );
    const [ rulePageIndex, setRulePageIndex ] = useState ( 0 );
    const conditionTraces = experiment.result.trace?.conditions ?? [];
    const ruleTraces = experiment.result.trace?.rules ?? [];
    const conditionPage = calculateCollectionPage (
        conditionTraces.length, conditionPageIndex, SIMULATOR_CONDITION_TRACE_PAGE_SIZE );
    const rulePage = calculateCollectionPage ( ruleTraces.length, rulePageIndex, SIMULATOR_RULE_TRACE_PAGE_SIZE );
    const visibleConditionTraces = conditionTraces.slice ( conditionPage.startIndex, conditionPage.endIndexExclusive );
    const visibleRuleTraces = ruleTraces.slice ( rulePage.startIndex, rulePage.endIndexExclusive );

    // Return the rendered interface element.

    return <div className="simulator-result-content">
        <section className="simulator-result-section"><h3>Event</h3>
            <dl className="result-properties"><div><dt>Name</dt><dd>{ definitionName ( model, "events", experiment.eventIdentifier ) }</dd></div>
                <div><dt>Identifier</dt><dd>{ experiment.eventIdentifier }</dd></div>
                <div><dt>Document revision</dt><dd>{ experiment.documentRevision }</dd></div></dl>
            <h4>Payload</h4><pre>{ JSON.stringify ( experiment.payload, null, 2 ) }</pre>
        </section>

        <section className="simulator-result-section"><h3>Condition outcomes</h3>
            { conditionTraces.length ? <><CollectionPagination { ...conditionPage }
                itemCount={ conditionTraces.length } label="Condition trace" setPageIndex={ setConditionPageIndex } />
                <div className="trace-list">{ visibleConditionTraces.map
                (
                    trace => <article key={ trace.condition }
                        className={ trace.result ? "trace-card trace-true" : "trace-card trace-false" }>
                        <div><strong>{ definitionName ( model, "conditions", trace.condition ) }</strong><code>{ trace.condition }</code></div>
                        <span>{ trace.result ? "True" : "False" }</span>
                        <p>{ trace.reason }{ trace.missingDependencies.length
                            ? `: ${ trace.missingDependencies.join ( ", " ) }` : "" }</p>
                    </article>
                ) }</div></> : <p className="empty-state">No event-matching rules required condition evaluation.</p> }
        </section>

        <ActionOutcome model={ model } result={ experiment.result } />

        <section className="simulator-result-section"><h3>Rule trace</h3>
            { ruleTraces.length ? <><CollectionPagination { ...rulePage }
                itemCount={ ruleTraces.length } label="Rule trace" setPageIndex={ setRulePageIndex } />
                <div className="collection-overview"><table><thead><tr><th>Rule</th><th>Condition</th>
                <th>Candidate action</th><th>Matched</th></tr></thead><tbody>
                { visibleRuleTraces.map
                (
                    trace => <tr key={ trace.rule }><td>{ trace.rule }</td>
                    <td>{ definitionName ( model, "conditions", trace.condition ) } · { trace.conditionResult ? "True" : "False" }</td>
                    <td>{ definitionName ( model, "actions", trace.action ) }</td><td>{ trace.matched ? "Yes" : "No" }</td></tr>
                ) }
            </tbody></table></div></> : <p className="empty-state">No rules are connected to this event.</p> }
        </section>
    </div>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: ActionOutcome
//
// Description:
//
//   Renders the action outcome component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (structured object):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

function ActionOutcome (
    {
        model, result }:
        {
            model: StatelessECAModel; result: EvaluationResult
        } )
{
    if ( result.outcome === "action-selected" )
    {

        // Return the rendered interface element.

        return <section className="simulator-result-section"><h3>Action selected</h3>
            <article className="selected-action-card"><strong>{ result.selectedAction.name }</strong>
                <code>{ result.selectedAction.id }</code><span>Action data</span>
                <pre>{ JSON.stringify ( result.selectedAction.parameters, null, 2 ) }</pre></article>
        </section>;
    }

    if ( result.outcome === "ambiguous" )
    {

        // Return the rendered interface element.

        return <section className="simulator-result-section ambiguous-action-result"><h3>Ambiguous action selection</h3>
            <p>{ result.diagnostic.message }</p>
            <dl className="ambiguity-properties"><div><dt>Diagnostic</dt><dd><code>{ result.diagnostic.code }</code></dd></div>
                <div><dt>Event pointer</dt><dd><code>{ result.diagnostic.pointer }</code></dd></div>
                <div><dt>Candidate actions</dt><dd>{ summarizeValues
                (
                    result.diagnostic.actionIds.map
                    (
                        identifier =>
                        definitionName ( model, "actions", identifier )
                    ), SIMULATOR_AMBIGUITY_IDENTIFIER_PREVIEW_LIMIT
                ) }</dd></div>
                <div><dt>Matching rules</dt><dd>{ summarizeValues (
                    result.diagnostic.ruleIds, SIMULATOR_AMBIGUITY_IDENTIFIER_PREVIEW_LIMIT ) }</dd></div></dl>
        </section>;
    }

    // Return the rendered interface element.

    return <section className="simulator-result-section"><h3>No action matched</h3>
        <p className="empty-state">The query returned no action because no event-matching rule had a true condition.</p>
    </section>;
}
