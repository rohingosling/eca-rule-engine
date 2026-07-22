//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Exercises model formats behavior and verifies its observable contract across representative inputs and
//   interactions.
//
//---------------------------------------------------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import type { StatelessECAModel } from "../contracts/model.generated";
import { createEmptyModel } from "./model-document";
import {
    importCollectionCSV, parseCSVRows, parseYAMLModel, serializeCollectionCSV, serializeYAMLModel
} from "./model-formats";

const model: StatelessECAModel =
{
    ...createEmptyModel (),
    name: "Interchange model",
    parameters: [
    {
        id: "amount", name: "Amount", type: "number", description: "Invoice total"
    } ],
    payloads: [
    {
        id: "invoice-payload", name: "Invoice payload", parameters: [ "amount" ]
    } ],
    events: [
    {
        id: "arrival", name: "Arrival, event", description: "Received", payload: "invoice-payload"
    } ],
    actions: [
    {
        id: "record", name: "Record", parameters:
        {
            destination: "ledger"
        }
    } ]
};

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: model interchange formats
//
// Description:
//
//   Verifies model interchange formats and records the expected externally observable behavior for future changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "model interchange formats", () =>
    {
        //-----------------------------------------------------------------------------------------------------------------
        // Test: round trips a complete model through YAML
        //
        // Description:
        //
        //   Verifies round trips a complete model through YAML and records the expected externally observable behavior for
        //   future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "round trips a complete model through YAML", () =>
            {
                expect ( parseYAMLModel ( serializeYAMLModel ( model ) ) ).toEqual ( model );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: parses quoted CSV fields containing commas and newlines
        //
        // Description:
        //
        //   Verifies parses quoted CSV fields containing commas and newlines and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "parses quoted CSV fields containing commas and newlines", () =>
            {
                expect ( parseCSVRows ( 'id,name,description\r\nevent-one,"Arrival, event","Line 1\nLine 2"\r\n' ) )
                    .toEqual ( [ [ "id", "name", "description" ], [ "event-one", "Arrival, event", "Line 1\nLine 2" ] ] );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: round trips global parameters and reusable payload membership through CSV
        //
        // Description:
        //
        //   Verifies round trips global parameters and reusable payload membership through CSV and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "round trips global parameters and reusable payload membership through CSV", () =>
            {
                const parametersImported = importCollectionCSV (
                    createEmptyModel (), "parameters", serializeCollectionCSV ( model, "parameters" ) );
                const payloadsImported = importCollectionCSV (
                    createEmptyModel (), "payloads", serializeCollectionCSV ( model, "payloads" ) );

                expect ( parametersImported.parameters ).toEqual ( model.parameters );
                expect ( payloadsImported.payloads ).toEqual ( model.payloads );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: round trips an event payload reference through CSV
        //
        // Description:
        //
        //   Verifies round trips an event payload reference through CSV and records the expected externally observable
        //   behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "round trips an event payload reference through CSV", () =>
            {
                const imported = importCollectionCSV (
                    createEmptyModel (), "events", serializeCollectionCSV ( model, "events" ) );

                expect ( imported.events ).toEqual ( model.events );
                expect ( Object.hasOwn ( imported.events [ 0 ], "parameters" ) ).toBe ( false );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: round trips action parameters without an action type column
        //
        // Description:
        //
        //   Verifies round trips action parameters without an action type column and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "round trips action parameters without an action type column", () =>
            {
                const content = serializeCollectionCSV ( model, "actions" );
                const imported = importCollectionCSV ( createEmptyModel (), "actions", content );

                expect ( parseCSVRows ( content ) [ 0 ] ).toEqual ( [ "id", "name", "description", "parameters" ] );
                expect ( imported.actions ).toEqual ( model.actions );
                expect ( Object.hasOwn ( imported.actions [ 0 ], "type" ) ).toBe ( false );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: rejects unterminated CSV quotes
        //
        // Description:
        //
        //   Verifies rejects unterminated CSV quotes and records the expected externally observable behavior for future
        //   changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "rejects unterminated CSV quotes", () =>
            {
                expect ( () => parseCSVRows ( 'id,name\nevent,"broken' ) ).toThrow ( "unterminated" );
            }
        );
    }
);
