//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Regression coverage for immutable, reference-aware model editing commands.
//
//---------------------------------------------------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import type { ParameterDefinition, StatelessECAModel } from "../contracts/model.generated";
import { createEmptyModel } from "./model-document";
import {
    addPayloadParameter, MAXIMUM_PAYLOAD_PARAMETERS, referencedDefinitionIdentifiers, removeDefinition,
    removePayloadParameter, renameDefinition, renameItem
} from "./model-commands";

const model: StatelessECAModel =
{
    ...createEmptyModel (),
    parameters: [
        {
            id: "parameter-old", name: "Parameter", type: "number"
    },
        {
            id: "parameter-new", name: "New parameter", type: "string"
    }
    ],
    payloads: [
    {
        id: "payload-old", name: "Payload", parameters: [ "parameter-old" ]
    } ],
    events: [
    {
        id: "event-old", name: "Event", payload: "payload-old"
    } ],
    conditions: [
    {
        id: "condition-old", name: "Condition", dependencies: [ "parameter-old" ],
        predicate:
        {
            name: "greaterThan", arguments:
            {
                parameter: "parameter-old", value: 1
            }
        }
    } ],
    actions: [
    {
        id: "action-old", name: "Action", parameters:
        {
        }
    } ],
    rules: [
    {
        id: "rule-old", name: "Rule", event: "event-old",
        condition: "condition-old", action: "action-old"
    } ]
};

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: reference-aware model commands
//
// Description:
//
//   Verifies reference-aware model commands and records the expected externally observable behavior for future
//   changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "reference-aware model commands", () =>
    {
        //-----------------------------------------------------------------------------------------------------------------
        // Test: reports references for every definition collection
        //
        // Description:
        //
        //   Verifies reports references for every definition collection and records the expected externally observable
        //   behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "reports references for every definition collection", () =>
            {
                expect ( referencedDefinitionIdentifiers ( model, "parameters", "parameter-old" ) )
                    .toEqual ( [ "payload payload-old", "condition condition-old" ] );
                expect ( referencedDefinitionIdentifiers ( model, "payloads", "payload-old" ) )
                    .toEqual ( [ "event event-old" ] );
                expect ( referencedDefinitionIdentifiers ( model, "events", "event-old" ) ).toEqual ( [ "rule rule-old" ] );
                expect ( referencedDefinitionIdentifiers ( model, "conditions", "condition-old" ) )
                    .toEqual ( [ "rule rule-old" ] );
                expect ( referencedDefinitionIdentifiers ( model, "actions", "action-old" ) ).toEqual ( [ "rule rule-old" ] );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: renames parameter and payload identifiers through every dependent reference
        //
        // Description:
        //
        //   Verifies renames parameter and payload identifiers through every dependent reference and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "renames parameter and payload identifiers through every dependent reference", () =>
            {
                const parameterRenamed = renameDefinition ( model, "parameters", "parameter-old", "parameter-renamed" );
                const payloadRenamed = renameDefinition ( parameterRenamed, "payloads", "payload-old", "payload-renamed" );

                expect ( parameterRenamed.parameters [ 0 ].id ).toBe ( "parameter-renamed" );
                expect ( parameterRenamed.payloads [ 0 ].parameters ).toEqual ( [ "parameter-renamed" ] );
                expect ( parameterRenamed.conditions [ 0 ].dependencies ).toEqual ( [ "parameter-renamed" ] );
                expect ( parameterRenamed.conditions [ 0 ].predicate ).toMatchObject
                (
                    {
                        arguments:
                        {
                            parameter: "parameter-renamed", value: 1
                        }
                    }
                );
                expect ( payloadRenamed.payloads [ 0 ].id ).toBe ( "payload-renamed" );
                expect ( payloadRenamed.events [ 0 ].payload ).toBe ( "payload-renamed" );
                expect ( model.parameters [ 0 ].id ).toBe ( "parameter-old" );
                expect ( model.events [ 0 ].payload ).toBe ( "payload-old" );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: renames event, condition, action, and rule identifiers through rule references
        //
        // Description:
        //
        //   Verifies renames event, condition, action, and rule identifiers through rule references and records the
        //   expected externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "renames event, condition, action, and rule identifiers through rule references", () =>
            {
                const eventRenamed     = renameDefinition ( model, "events", "event-old", "event-new" );
                const conditionRenamed = renameDefinition ( eventRenamed, "conditions", "condition-old", "condition-new" );
                const actionRenamed    = renameDefinition ( conditionRenamed, "actions", "action-old", "action-new" );
                const ruleRenamed      = renameItem ( actionRenamed, "rules", "rule-old", "rule-new" );

                expect ( ruleRenamed.events [ 0 ].id ).toBe ( "event-new" );
                expect ( ruleRenamed.conditions [ 0 ].id ).toBe ( "condition-new" );
                expect ( ruleRenamed.actions [ 0 ].id ).toBe ( "action-new" );
                expect ( ruleRenamed.rules [ 0 ] ).toMatchObject
                (
                    {
                        id: "rule-new", event: "event-new", condition: "condition-new", action: "action-new"
                    }
                );
                expect ( Object.hasOwn ( ruleRenamed.actions [ 0 ], "type" ) ).toBe ( false );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: adds and removes global parameter references on a reusable payload
        //
        // Description:
        //
        //   Verifies adds and removes global parameter references on a reusable payload and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "adds and removes global parameter references on a reusable payload", () =>
            {
                const addedModel = addPayloadParameter ( model, "payload-old", "parameter-new" );
                const removedModel = removePayloadParameter ( addedModel, "payload-old", "parameter-old" );

                expect ( addedModel.payloads [ 0 ].parameters ).toEqual ( [ "parameter-old", "parameter-new" ] );
                expect ( removedModel.payloads [ 0 ].parameters ).toEqual ( [ "parameter-new" ] );
                expect ( model.payloads [ 0 ].parameters ).toEqual ( [ "parameter-old" ] );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: rejects missing, duplicate, and overflowing payload-membership mutations
        //
        // Description:
        //
        //   Verifies rejects missing, duplicate, and overflowing payload-membership mutations and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "rejects missing, duplicate, and overflowing payload-membership mutations", () =>
            {
                const fullParameters: ParameterDefinition[] = Array.from
                (
                    {
                        length: MAXIMUM_PAYLOAD_PARAMETERS
                    }, ( _, index ) => (
                        {
                            id: `parameter-${ index }`, name: `Parameter ${ index }`, type: "string"
                        } )
                );
                const overflowParameter: ParameterDefinition =
                {
                    id: "overflow-parameter", name: "Overflow parameter", type: "string"
                };
                const fullModel: StatelessECAModel =
                {
                    ...model,
                    parameters: [ ...fullParameters, overflowParameter ],
                    payloads: [
                    {
                        id: "payload-full", name: "Full payload",
                        parameters: fullParameters.map ( parameter => parameter.id )
                    } ]
                };

                expect ( addPayloadParameter ( model, "payload-old", "parameter-old" ) ).toBe ( model );
                expect ( addPayloadParameter ( model, "payload-old", "missing" ) ).toBe ( model );
                expect ( addPayloadParameter ( model, "missing", "parameter-new" ) ).toBe ( model );
                expect ( removePayloadParameter ( model, "payload-old", "missing" ) ).toBe ( model );
                expect ( addPayloadParameter ( fullModel, "payload-full", overflowParameter.id ) ).toBe ( fullModel );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: does not silently cascade deletion to dependent definitions
        //
        // Description:
        //
        //   Verifies does not silently cascade deletion to dependent definitions and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "does not silently cascade deletion to dependent definitions", () =>
            {
                const parameterRemoved = removeDefinition ( model, "parameters", "parameter-old" );
                const payloadRemoved = removeDefinition ( model, "payloads", "payload-old" );
                const actionRemoved = removeDefinition ( model, "actions", "action-old" );

                expect ( parameterRemoved.payloads [ 0 ].parameters ).toEqual ( [ "parameter-old" ] );
                expect ( payloadRemoved.events [ 0 ].payload ).toBe ( "payload-old" );
                expect ( actionRemoved.rules [ 0 ].action ).toBe ( "action-old" );
            }
        );
    }
);
