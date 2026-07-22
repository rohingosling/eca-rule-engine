//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Regression coverage for model metadata and parameter-reference resolution.
//
//---------------------------------------------------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import type { PayloadDefinition, StatelessECAModel } from "../contracts/model.generated";
import { createEmptyModel } from "../document/model-document";
import {
    definitionName, resolveEventParameters, resolvePayloadParameters, selectModelParameterNames
} from "./model-metadata";

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: model metadata
//
// Description:
//
//   Verifies model metadata and records the expected externally observable behavior for future changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "model metadata", () =>
    {
        const model: StatelessECAModel =
        {
            ...createEmptyModel (),
            parameters: [
                {
                    id: "value", name: "Value", type: "object"
            },
                {
                    id: "source", name: "Source", type: "string"
            },
                {
                    id: "amount", name: "Amount", type: "number"
            }
            ],
            payloads: [
                {
                    id: "shared-payload", name: "Shared payload", parameters: [ "source", "value" ]
            },
                {
                    id: "amount-payload", name: "Amount payload", parameters: [ "amount" ]
            }
            ],
            events: [
                {
                    id: "event-one", name: "Event one", payload: "shared-payload"
            },
                {
                    id: "event-two", name: "Event two", payload: "shared-payload"
            },
                {
                    id: "event-three", name: "Event three"
            }
            ]
        };

        //-----------------------------------------------------------------------------------------------------------------
        // Test: returns deterministically ordered global parameter identifiers
        //
        // Description:
        //
        //   Verifies returns deterministically ordered global parameter identifiers and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "returns deterministically ordered global parameter identifiers", () =>
            {
                expect ( selectModelParameterNames ( model ) ).toEqual ( [ "amount", "source", "value" ] );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: resolves payload membership in declaration order
        //
        // Description:
        //
        //   Verifies resolves payload membership in declaration order and records the expected externally observable
        //   behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "resolves payload membership in declaration order", () =>
            {
                const resolvedParameters = resolvePayloadParameters ( model, model.payloads [ 0 ] );

                expect ( resolvedParameters.map ( parameter => parameter.id ) ).toEqual ( [ "source", "value" ] );
                expect ( resolvedParameters [ 0 ] ).toBe ( model.parameters [ 1 ] );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: resolves one reusable payload for every event that references it
        //
        // Description:
        //
        //   Verifies resolves one reusable payload for every event that references it and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "resolves one reusable payload for every event that references it", () =>
            {
                expect ( resolveEventParameters ( model, model.events [ 0 ] ) )
                    .toEqual ( resolveEventParameters ( model, model.events [ 1 ] ) );
                expect ( resolveEventParameters ( model, model.events [ 2 ] ) ).toEqual ( [] );
                expect
                (
                    resolveEventParameters
                    (
                        model,
                        {
                            id: "missing", name: "Missing", payload: "missing"
                        }
                    )
                )
                    .toEqual ( [] );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: skips unresolved parameter references without changing the payload definition
        //
        // Description:
        //
        //   Verifies skips unresolved parameter references without changing the payload definition and records the
        //   expected externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "skips unresolved parameter references without changing the payload definition", () =>
            {
                const unresolvedPayload: PayloadDefinition =
                {
                    id: "unresolved", name: "Unresolved", parameters: [ "source", "missing" ]
                };

                expect ( resolvePayloadParameters ( model, unresolvedPayload ).map ( parameter => parameter.id ) )
                    .toEqual ( [ "source" ] );
                expect ( unresolvedPayload.parameters ).toEqual ( [ "source", "missing" ] );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: finds display names across the new definition collections
        //
        // Description:
        //
        //   Verifies finds display names across the new definition collections and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "finds display names across the new definition collections", () =>
            {
                expect ( definitionName ( model, "parameters", "amount" ) ).toBe ( "Amount" );
                expect ( definitionName ( model, "payloads", "shared-payload" ) ).toBe ( "Shared payload" );
                expect ( definitionName ( model, "events", "missing" ) ).toBe ( "missing" );
            }
        );
    }
);
