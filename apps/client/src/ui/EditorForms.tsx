//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Focused detail forms and reusable validated draft fields for the structured editor.
//
//---------------------------------------------------------------------------------------------------------------------

import { useEffect, useId, useState } from "react";
import type {
    Action, ComparisonPredicate, Condition, EventType, ParameterDefinition, PayloadDefinition, Rule,
    StatelessECAModel
} from "../contracts/model.generated";
import { MAXIMUM_DESCRIPTION_LENGTH, MAXIMUM_DISPLAY_NAME_LENGTH } from "../contracts/contract-limits";
import {
    identifierValidationError, MAXIMUM_PAYLOAD_PARAMETERS
} from "../document/model-commands";
import { PARAMETER_TYPES, PREDICATE_NAMES } from "./model-metadata";

//---------------------------------------------------------------------------------------------------------------------
// Type: CollectionItem
//
// Description:
//
//   Defines the valid representation of collection item.
//
//---------------------------------------------------------------------------------------------------------------------
type CollectionItem = ParameterDefinition | PayloadDefinition | EventType | Condition | Action | Rule;

//---------------------------------------------------------------------------------------------------------------------
// Interface: CommonFormProperties
//
// Description:
//
//   Defines the named fields and callable operations that make up common form properties.
//
//---------------------------------------------------------------------------------------------------------------------
interface CommonFormProperties<Item>
{
    edit: ( changes: Partial<Item> ) => void;
    identifiers: string[];
    remove: () => void;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: ValidatedIdentifierInputProperties
//
// Description:
//
//   Defines the named fields and callable operations that make up validated identifier input properties.
//
//---------------------------------------------------------------------------------------------------------------------
interface ValidatedIdentifierInputProperties
{
    ariaLabel?: string;
    identifiers?: string[];
    suggestions?: string[];
    update: ( value: string ) => void;
    value: string;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: ValidatedIdentifierInput
//
// Description:
//
//   Renders the validated identifier input component from its supplied state and callbacks, producing the
//   corresponding user-interface element.
//
// Arguments:
//
//   properties (ValidatedIdentifierInputProperties):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function ValidatedIdentifierInput ( properties: ValidatedIdentifierInputProperties )
{
    const [ draft, setDraft ] = useState ( properties.value );
    const [ error, setError ] = useState ( "" );
    const fieldIdentifier      = useId ();
    const errorIdentifier      = `${ fieldIdentifier }-error`;
    const suggestionIdentifier = `${ fieldIdentifier }-suggestions`;
    const suggestions          = [ ...new Set ( properties.suggestions ?? [] ) ];

    useEffect
    (
        () =>
        {
            setDraft ( properties.value );
            setError ( "" );
        }, [ properties.value ]
    );

    //-----------------------------------------------------------------------------------------------------------------
    // Function: commit
    //
    // Description:
    //
    //   Performs the commit operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The commit result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const commit = () =>
    {
        const validationError = identifierValidationError (
            draft, properties.identifiers ?? [], properties.value );
        setError ( validationError ?? "" );
        if ( !validationError && draft !== properties.value )
        {
            properties.update ( draft );
        }
    };

    // Return the rendered interface element.

    return <><input value={ draft } aria-label={ properties.ariaLabel }
        data-document-draft-dirty={ draft !== properties.value ? "true" : undefined }
        aria-invalid={ error ? "true" : undefined }
        aria-describedby={ error ? errorIdentifier : undefined }
        list={ suggestions.length > 0 ? suggestionIdentifier : undefined }
        onChange={ event =>
        {
        setDraft ( event.target.value );
            setError
            (
                identifierValidationError (
                event.target.value, properties.identifiers ?? [], properties.value ) ?? ""
            );
    } }
        onBlur={ commit } />
        { suggestions.length > 0 && <datalist id={ suggestionIdentifier }>
            { suggestions.map ( suggestion => <option key={ suggestion } value={ suggestion } /> ) }
        </datalist> }
        { error && <span id={ errorIdentifier } className="field-error" role="alert">{ error }</span> }
    </>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: IdentifierField
//
// Description:
//
//   Renders the identifier field component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties ({ identifiers?: string[]; suggestions?: string[]; value: string; update: ( value: string ) => void }):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function IdentifierField ( properties:
{
    identifiers?: string[]; suggestions?: string[]; value: string;
    update: ( value: string ) => void
} )
{

    // Return the rendered interface element.

    return <label data-model-field="id">Identifier<ValidatedIdentifierInput { ...properties } /></label>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: JsonField
//
// Description:
//
//   Renders the JSON field component from its supplied state and callbacks, producing the corresponding user-interface
//   element.
//
// Arguments:
//
//   properties (declared structured type):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

function JsonField ( properties:
{
    field: string; label: string; ownerKey: string; value: unknown;
    update: ( value: unknown ) => string | undefined | void
} )
{
    const [ text, setText ] = useState ( () => JSON.stringify ( properties.value, null, 2 ) );
    const [ error, setError ] = useState ( "" );
    const serializedValue = JSON.stringify ( properties.value, null, 2 );

    useEffect
    (
        () =>
        {
            setText ( serializedValue );
            setError ( "" );
        }, [ properties.ownerKey, serializedValue ]
    );

    //-----------------------------------------------------------------------------------------------------------------
    // Function: commit
    //
    // Description:
    //
    //   Performs the commit operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The commit result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const commit = () =>
    {
        try
        {
            const validationError = properties.update ( JSON.parse ( text ) );
            setError ( validationError ?? "" );
        }
        catch
        {
            setError ( "Enter valid JSON." );
        }
    };

    // Return the rendered interface element.

    return <label className="wide" data-model-field={ properties.field }>{ properties.label }
        <textarea value={ text } data-document-draft-dirty={ text !== serializedValue ? "true" : undefined }
            onChange={ event => setText ( event.target.value ) } onBlur={ commit } />
        { error && <span className="field-error" role="alert">{ error }</span> }
    </label>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: CommonFields
//
// Description:
//
//   Renders the common fields component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (declared structured type):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

function CommonFields<Item extends CollectionItem> ( properties:
{
    item: Item;
    edit: ( changes: Partial<Item> ) => void; identifiers: string[]; rename: ( value: string ) => void
} )
{

    // Return the rendered interface element.

    return <>
        <IdentifierField value={ properties.item.id } identifiers={ properties.identifiers }
            update={ properties.rename } />
        <label data-model-field="name">Name<input value={ properties.item.name } required maxLength={ MAXIMUM_DISPLAY_NAME_LENGTH }
            onChange={ event => properties.edit
            (
                (
                    {
                        name: event.target.value
                    }
                ) as Partial<Item>
            ) } /></label>
        <label className="wide" data-model-field="description">Description<textarea value={ properties.item.description ?? "" }
            maxLength={ MAXIMUM_DESCRIPTION_LENGTH }
            onChange={ event => properties.edit
            (
                (
                    {
                        description: event.target.value
                    }
                ) as Partial<Item>
            ) } /></label>
    </>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: ParameterForm
//
// Description:
//
//   Renders the parameter form component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (declared structured type):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function ParameterForm ( properties: CommonFormProperties<ParameterDefinition> &
{
    parameter: ParameterDefinition; rename: ( value: string ) => void
} )
{

    // Return the rendered interface element.

    return <div className="form-grid item-form">
        <CommonFields item={ properties.parameter } edit={ properties.edit }
            identifiers={ properties.identifiers } rename={ properties.rename } />
        <label data-model-field="type">JSON type<select value={ properties.parameter.type }
            onChange={ event => properties.edit
            (
                (
                    {
                        type: event.target.value as ParameterDefinition["type"]
                    }
                )
            ) }>
            { PARAMETER_TYPES.map ( type => <option key={ type }>{ type }</option> ) }
        </select></label>
        <DeleteButton remove={ properties.remove } />
    </div>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: PayloadForm
//
// Description:
//
//   Renders the payload form component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (declared structured type):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function PayloadForm ( properties: CommonFormProperties<PayloadDefinition> &
{
    model: StatelessECAModel; payload: PayloadDefinition; rename: ( value: string ) => void
} )
{
    const availableParameters = properties.model.parameters.filter
    (
        parameter =>
        !properties.payload.parameters.includes ( parameter.id )
    );
    const [ parameterIdentifier, setParameterIdentifier ] = useState ( "" );
    const suggestionIdentifier = useId ();
    const atParameterLimit = properties.payload.parameters.length >= MAXIMUM_PAYLOAD_PARAMETERS;

    useEffect
    (
        () =>
        {
            setParameterIdentifier
            (
                current => availableParameters.some ( parameter => parameter.id === current )
                ? current : ""
            );
        }, [ properties.model.parameters, properties.payload.parameters ]
    );

    const selectedParameterAvailable = availableParameters.some (
        parameter => parameter.id === parameterIdentifier );

    // Return the rendered interface element.

    return <div className="form-grid item-form">
        <CommonFields item={ properties.payload } edit={ properties.edit }
            identifiers={ properties.identifiers } rename={ properties.rename } />
        <section className="wide subsection payload-parameters" data-model-field="parameters"
            aria-labelledby="payload-parameters-heading">
            <h3 id="payload-parameters-heading">Parameters</h3>
            <p>Add reusable parameter definitions to this payload. Each parameter can appear only once.</p>
            <div className="payload-parameter-actions">
                <label>Parameter<input aria-label="Parameter to add" value={ parameterIdentifier }
                    list={ suggestionIdentifier } disabled={ availableParameters.length === 0 || atParameterLimit }
                    placeholder="Select or search parameters"
                    onClick={ event => event.currentTarget.showPicker?.() }
                    onChange={ event => setParameterIdentifier ( event.target.value ) } /></label>
                <datalist id={ suggestionIdentifier }>
                    { availableParameters.map
                    (
                        parameter => <option key={ parameter.id }
                        value={ parameter.id } label={ parameter.name } />
                    ) }
                </datalist>
                <button type="button" disabled={ !selectedParameterAvailable || atParameterLimit }
                    onClick={ () => properties.edit
                    (
                        (
                            {
                                parameters: [ ...properties.payload.parameters, parameterIdentifier ]
                            }
                        )
                    ) }>Add parameter</button>
            </div>
            { properties.model.parameters.length === 0
                && <p className="empty-state">Add a parameter definition before building this payload.</p> }
            { atParameterLimit
                && <p className="field-error" role="status">This payload already has 256 parameters.</p> }
            <table><thead><tr><th>Identifier</th><th>Name</th><th>JSON type</th><th>
                <span className="visually-hidden">Actions</span></th></tr></thead><tbody>
                { properties.payload.parameters.map
                (
                    parameterIdentifierValue =>
                                {
                        const parameter = properties.model.parameters.find (
                                        item => item.id === parameterIdentifierValue );

                                    // Return the rendered interface element.

                                    return <tr key={ parameterIdentifierValue }>
                                        <td>{ parameterIdentifierValue }</td>
                                        <td>{ parameter?.name ?? "Unresolved" }</td>
                                        <td>{ parameter?.type ?? "—" }</td>
                                        <td><button type="button" className="danger"
                                            aria-label={ `Remove ${ parameterIdentifierValue } from payload` }
                                            onClick={ () => properties.edit
                                            (
                                                (
                                                    {
                                                        parameters: properties.payload.parameters.filter (
                                                    identifier => identifier !== parameterIdentifierValue )
                                                    }
                                                )
                                            ) }>Remove</button></td>
                                    </tr>;
                    }
                ) }
            </tbody></table>
        </section>
        <DeleteButton remove={ properties.remove } />
    </div>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: EventForm
//
// Description:
//
//   Renders the event form component from its supplied state and callbacks, producing the corresponding user-interface
//   element.
//
// Arguments:
//
//   properties (declared structured type):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function EventForm ( properties: CommonFormProperties<EventType> &
{
    event: EventType;
    payloads: PayloadDefinition[]; rename: ( value: string ) => void
} )
{

    // Return the rendered interface element.

    return <div className="form-grid item-form">
        <CommonFields item={ properties.event } edit={ properties.edit }
            identifiers={ properties.identifiers } rename={ properties.rename } />
        <label data-model-field="payload">Payload<select value={ properties.event.payload ?? "" }
            onChange={ event => properties.edit
            (
                event.target.value
                ? (
                    {
                        payload: event.target.value
                    }
                ) : (
                    {
                        payload: undefined
                    }
                )
            ) }>
            <option value="">No payload</option>
            { properties.event.payload && !properties.payloads.some ( payload => payload.id === properties.event.payload )
                && <option value={ properties.event.payload }>{ properties.event.payload } (unresolved)</option> }
            { properties.payloads.map
            (
                payload => <option key={ payload.id } value={ payload.id }>
                { payload.name } ({ payload.id })</option>
            ) }
        </select></label>
        <DeleteButton remove={ properties.remove } />
    </div>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: ConditionForm
//
// Description:
//
//   Renders the condition form component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (declared structured type):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function ConditionForm ( properties: CommonFormProperties<Condition> &
{
    condition: Condition;
    parameterIdentifiers: string[]; rename: ( value: string ) => void
} )
{
    const comparison = properties.condition.predicate.name === "always" ? undefined
        : properties.condition.predicate as ComparisonPredicate;
    const parameterIdentifiers = [ ...new Set ( properties.parameterIdentifiers ) ];
    //-----------------------------------------------------------------------------------------------------------------
    // Function: setPredicate
    //
    // Description:
    //
    //   Updates predicate while preserving the surrounding state invariants.
    //
    // Arguments:
    //
    //   name (Condition["predicate"]["name"]):
    //     The name used by this operation.
    //
    // Returns:
    //
    //   The set predicate result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const setPredicate = ( name: Condition["predicate"]["name"] ) =>
    {
        if ( name === "always" )
        {
            properties.edit
            (
                {
                    dependencies: [], predicate:
                    {
                        name: "always", arguments:
                        {
                        }
                    }
                }
            );

            // Return without a value after completing this code path.

            return;
        }
        if ( comparison )
        {
            properties.edit
            (
                {
                    predicate:
                    {
                        ...comparison, name
                    }
                }
            );

            // Return without a value after completing this code path.

            return;
        }
        const parameter = parameterIdentifiers [ 0 ] ?? properties.condition.dependencies [ 0 ] ?? "parameter";
        properties.edit
        (
            {
                dependencies: [ parameter ], predicate:
                {
                    name, arguments:
                    {
                        parameter, value: ""
                    }
                }
            }
        );
    };

    // Return the rendered interface element.

    return <div className="form-grid item-form">
        <CommonFields item={ properties.condition } edit={ properties.edit }
            identifiers={ properties.identifiers } rename={ properties.rename } />
        <label data-model-field="predicate/name">Predicate<select value={ properties.condition.predicate.name }
            onChange={ event => setPredicate ( event.target.value as Condition["predicate"]["name"] ) }>
            { PREDICATE_NAMES.map ( name => <option key={ name }>{ name }</option> ) }
        </select></label>
        { comparison && <>
            <label data-model-field="dependencies/0">Required parameter<select value={ comparison.arguments.parameter }
                onChange={ event => properties.edit
                (
                    (
                        {
                            dependencies: [ event.target.value ],
                            predicate:
                                {
                                    ...comparison, arguments:
                                    {
                                        ...comparison.arguments, parameter: event.target.value
                                    }
                                }
                        }
                    )
                ) }>
                { !parameterIdentifiers.includes ( comparison.arguments.parameter )
                    && <option value={ comparison.arguments.parameter }>
                        { comparison.arguments.parameter } (unresolved)</option> }
                { parameterIdentifiers.map
                (
                    parameterIdentifier => <option key={ parameterIdentifier }
                    value={ parameterIdentifier }>{ parameterIdentifier }</option>
                ) }
            </select></label>
            <JsonField field="predicate/arguments/value" label="Comparison value (JSON)" ownerKey={ properties.condition.id }
                value={ comparison.arguments.value } update={ value => properties.edit
                (
                    (
                        {
                            predicate:
                            {
                                ...comparison, arguments:
                                {
                                    ...comparison.arguments, value
                                }
                            }
                        }
                    )
                ) } />
        </> }
        <DeleteButton remove={ properties.remove } />
    </div>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: ActionForm
//
// Description:
//
//   Renders the action form component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (CommonFormProperties<Action> & { action: Action; rename: ( value: string ) => void }):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function ActionForm ( properties: CommonFormProperties<Action> &
{
    action: Action;
    rename: ( value: string ) => void
} )
{

    // Return the rendered interface element.

    return <div className="form-grid item-form">
        <CommonFields item={ properties.action } edit={ properties.edit }
            identifiers={ properties.identifiers } rename={ properties.rename } />
        <JsonField field="parameters" label="Action data (JSON object)" ownerKey={ properties.action.id }
            value={ properties.action.parameters }
            update={ value => !Array.isArray ( value ) && value !== null && typeof value === "object"
                ? properties.edit
                (
                    (
                        {
                            parameters: value as Record<string, unknown>
                        }
                    )
                )
                : "Enter a JSON object." } />
        <DeleteButton remove={ properties.remove } />
    </div>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: RuleForm
//
// Description:
//
//   Renders the rule form component from its supplied state and callbacks, producing the corresponding user-interface
//   element.
//
// Arguments:
//
//   properties (declared structured type):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function RuleForm ( properties: CommonFormProperties<Rule> &
{
    rule: Rule; model: StatelessECAModel;
    rename: ( value: string ) => void
} )
{

    // Return the rendered interface element.

    return <div className="form-grid item-form">
        <CommonFields item={ properties.rule } edit={ properties.edit }
            identifiers={ properties.identifiers } rename={ properties.rename } />
        <ReferenceSelect label="Event" value={ properties.rule.event } options={ properties.model.events }
            update={ event => properties.edit
            (
                (
                    {
                        event
                    }
                )
            ) } />
        <ReferenceSelect label="Condition" value={ properties.rule.condition } options={ properties.model.conditions }
            update={ condition => properties.edit
            (
                (
                    {
                        condition
                    }
                )
            ) } />
        <ReferenceSelect label="Action" value={ properties.rule.action } options={ properties.model.actions }
            update={ action => properties.edit
            (
                (
                    {
                        action
                    }
                )
            ) } />
        <DeleteButton remove={ properties.remove } />
    </div>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: ReferenceSelect
//
// Description:
//
//   Renders the reference select component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (declared structured type):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

function ReferenceSelect ( properties:
{
    label: string; value: string; options: Array<
    {
        id: string; name: string
    }>;
    update: ( value: string ) => void
} )
{

    // Return the rendered interface element.

    return <label data-model-field={ properties.label.toLowerCase () }>{ properties.label }<select value={ properties.value }
        onChange={ event => properties.update ( event.target.value ) }>
        { !properties.options.some ( option => option.id === properties.value ) && <option value={ properties.value }>
            { properties.value } (unresolved)</option> }
        { properties.options.map
        (
            option => <option key={ option.id } value={ option.id }>
            { option.name } ({ option.id })</option>
        ) }
    </select></label>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: DeleteButton
//
// Description:
//
//   Renders the delete button component from its supplied state and callbacks, producing the corresponding
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

function DeleteButton (
    {
        remove }:
        {
            remove: () => void
        } )
{

    // Return the rendered interface element.

    return <div className="wide delete-row"><button type="button" className="danger"
        onClick={ remove }>Delete item</button></div>;
}
