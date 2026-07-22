//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Exercises conformance behavior and verifies its observable contract across representative inputs and interactions.
//
//---------------------------------------------------------------------------------------------------------------------

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { StatelessECAModel } from "../contracts/model.generated";
import { evaluate } from "./evaluator";
import { validateModel } from "./model-validation";
import type { EventOccurrence } from "./types";
import { validateStructure } from "./validator";

//---------------------------------------------------------------------------------------------------------------------
// Interface: ExpectedEvaluationDiagnostic
//
// Description:
//
//   Defines the named fields and callable operations that make up expected evaluation diagnostic.
//
//---------------------------------------------------------------------------------------------------------------------
interface ExpectedEvaluationDiagnostic
{
    code: string;
    message: string;
    pointer: string;
}

//---------------------------------------------------------------------------------------------------------------------
// Type: EvaluationCase
//
// Description:
//
//   Defines the valid representation of evaluation case.
//
//---------------------------------------------------------------------------------------------------------------------
type EvaluationCase =
{
    modelPath: string;
    event: EventOccurrence;
} & (
{
    expectedActionId: string | null; expectedDiagnostic?: never; expectedTrace: unknown
}
    |
    {
        expectedActionId?: never; expectedDiagnostic: ExpectedEvaluationDiagnostic; expectedTrace?: never
    } );

//---------------------------------------------------------------------------------------------------------------------
// Interface: Manifest
//
// Description:
//
//   Defines the named fields and callable operations that make up manifest.
//
//---------------------------------------------------------------------------------------------------------------------
interface Manifest
{
    schemaCases: Array<
        {
            schemaPath: string;
            documentPath: string;
            expectedValid: boolean;
        }>;
    evaluationCases: Array<
        {
            id: string; casePath: string
        }>;
    modelValidationCases: Array<
        {
            id: string;
            modelPath: string;
            expectedDiagnostics: Array<
                {
                    code: string; pointer: string
                }>;
        }>;
}

const contractsDirectory = resolve ( dirname ( fileURLToPath ( import.meta.url ) ), "../../../../contracts" );

//---------------------------------------------------------------------------------------------------------------------
// Function: readJson
//
// Description:
//
//   Reads the supplied representation and returns its normalized in-memory form.
//
// Arguments:
//
//   path (string):
//     The path used by this operation.
//
// Returns:
//
//   The read JSON result.
//
//---------------------------------------------------------------------------------------------------------------------

async function readJson<T> ( path: string ): Promise<T>
{

    // Return the result produced by the delegated operation.

    return JSON.parse ( await readFile ( path, "utf8" ) ) as T;
}

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: shared contract conformance
//
// Description:
//
//   Verifies shared contract conformance and records the expected externally observable behavior for future changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "shared contract conformance", () =>
    {
        let manifest: Manifest;

        beforeAll
        (
            async () =>
            {
                manifest = await readJson<Manifest> ( resolve ( contractsDirectory, "conformance/manifest.json" ) );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: model schema cases match the language-neutral manifest
        //
        // Description:
        //
        //   Verifies model schema cases match the language-neutral manifest and records the expected externally observable
        //   behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        test
        (
            "model schema cases match the language-neutral manifest", async () =>
            {
                const modelCases = manifest.schemaCases.filter ( entry => entry.schemaPath === "schemas/model.schema.json" );

                for ( const entry of modelCases )
                {
                    const document = await readJson<unknown> ( resolve ( contractsDirectory, entry.documentPath ) );
                    expect ( validateStructure ( document ).length === 0 ).toBe ( entry.expectedValid );
                }
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: evaluation cases return the expected optional action or ambiguity and canonical trace
        //
        // Description:
        //
        //   Verifies evaluation cases return the expected optional action or ambiguity and canonical trace and records the
        //   expected externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        test
        (
            "evaluation cases return the expected optional action or ambiguity and canonical trace", async () =>
            {
                for ( const entry of manifest.evaluationCases )
                {
                    const casePath = resolve ( contractsDirectory, entry.casePath );
                    const evaluationCase = await readJson<EvaluationCase> ( casePath );
                    const model = await readJson<StatelessECAModel> ( resolve ( dirname ( casePath ), evaluationCase.modelPath ) );
                    const result = evaluate
                    (
                        {
                            model,
                            event: evaluationCase.event,
                            includeTrace: true
                        }
                    );

                    if ( evaluationCase.expectedDiagnostic )
                    {
                        expect ( result.outcome, entry.id ).toBe ( "ambiguous" );
                        expect
                        (
                            result.outcome === "ambiguous" ?
                            {
                                code: result.diagnostic.code,
                                message: result.diagnostic.message,
                                pointer: result.diagnostic.pointer
                            } : undefined, entry.id
                        ).toEqual ( evaluationCase.expectedDiagnostic );
                    }
                    else
                    {
                        const expectedAction = evaluationCase.expectedActionId === null
                            ? null
                            : model.actions.find ( action => action.id === evaluationCase.expectedActionId ) ?? null;

                        expect ( expectedAction?.id ?? null, entry.id ).toBe ( evaluationCase.expectedActionId );
                        expect ( result.selectedAction, entry.id ).toEqual ( expectedAction );
                        expect ( result.outcome, entry.id ).toBe
                        (
                            evaluationCase.expectedActionId
                            ? "action-selected" : "no-action"
                        );
                        expect ( result.trace, entry.id ).toEqual ( evaluationCase.expectedTrace );
                    }
                }
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: browser model validation diagnostics match every language-neutral semantic case
        //
        // Description:
        //
        //   Verifies browser model validation diagnostics match every language-neutral semantic case and records the
        //   expected externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        test
        (
            "browser model validation diagnostics match every language-neutral semantic case", async () =>
            {
                for ( const entry of manifest.modelValidationCases )
                {
                    const document = await readJson<unknown> ( resolve ( contractsDirectory, entry.modelPath ) );
                    const result = validateModel ( document );
                    const diagnosticIdentities = result.diagnostics.map
                    (
                        diagnostic => (
                        {
                            code: diagnostic.code, pointer: diagnostic.pointer
                        } )
                    );

                    expect ( diagnosticIdentities, entry.id ).toEqual ( entry.expectedDiagnostics );
                    expect ( result.model !== undefined, entry.id ).toBe ( entry.expectedDiagnostics.length === 0 );
                }
            }
        );
    }
);
