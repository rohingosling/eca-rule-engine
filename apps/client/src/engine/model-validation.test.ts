//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Tests for the untrusted-data validation boundary.
//
//---------------------------------------------------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { createEmptyModel } from "../document/model-document";
import { validateModel } from "./model-validation";

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: model validation boundary
//
// Description:
//
//   Verifies model validation boundary and records the expected externally observable behavior for future changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "model validation boundary", () =>
    {
        //-----------------------------------------------------------------------------------------------------------------
        // Test: rejects malformed nested collection entries before typed rendering
        //
        // Description:
        //
        //   Verifies rejects malformed nested collection entries before typed rendering and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "rejects malformed nested collection entries before typed rendering", () =>
            {
                const result = validateModel
                (
                    {
                        ...createEmptyModel (), events: [ null ]
                    }
                );
                expect ( result.model ).toBeUndefined ();
                expect ( result.recoverableModel ).toBeUndefined ();
                expect ( result.diagnostics.length ).toBeGreaterThan ( 0 );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: rejects semantic reference failures
        //
        // Description:
        //
        //   Verifies rejects semantic reference failures and records the expected externally observable behavior for
        //   future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "rejects semantic reference failures", () =>
            {
                const result = validateModel
                (
                    {
                        ...createEmptyModel (), rules: [
                        {
                            id: "rule-one", name: "Rule one", event: "missing", condition: "missing", action: "missing"
                        } ]
                    }
                );
                expect ( result.model ).toBeUndefined ();
                expect ( result.recoverableModel ).toBeDefined ();
                expect ( result.diagnostics.map ( diagnostic => diagnostic.code ) ).toContain ( "unresolved-event-reference" );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: rejects cyclic aliases before schema validation or serialization
        //
        // Description:
        //
        //   Verifies rejects cyclic aliases before schema validation or serialization and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "rejects cyclic aliases before schema validation or serialization", () =>
            {
                const cyclicParameters: Record<string, unknown> =
                {
                };
                cyclicParameters.self = cyclicParameters;
                const result = validateModel
                (
                    {
                        ...createEmptyModel (), actions: [
                        {
                            id: "action-one", name: "Action one", parameters: cyclicParameters
                        } ]
                    }
                );

                expect ( result.model ).toBeUndefined ();
                expect ( result.diagnostics ).toEqual
                (
                    [ expect.objectContaining
                    (
                        {
                            code: "non-tree-json-value"
                        }
                    ) ]
                );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: rejects non-finite numbers and JSON nesting beyond the shared limit
        //
        // Description:
        //
        //   Verifies rejects non-finite numbers and JSON nesting beyond the shared limit and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "rejects non-finite numbers and JSON nesting beyond the shared limit", () =>
            {
                let nestedValue: unknown = "value";
                for ( let depth = 0; depth < 33; depth++ )
                {
                    nestedValue =
                    {
                        nested: nestedValue
                    };
                }

                const nonFiniteResult = validateModel
                (
                    {
                        ...createEmptyModel (), actions: [
                        {
                            id: "action-one", name: "Action one", parameters:
                            {
                                value: Number.POSITIVE_INFINITY
                            }
                        } ]
                    }
                );
                const nestedResult = validateModel ( nestedValue );

                expect ( nonFiniteResult.diagnostics [ 0 ].code ).toBe ( "non-finite-json-number" );
                expect ( nestedResult.diagnostics [ 0 ].code ).toBe ( "json-depth-limit-exceeded" );
            }
        );
    }
);
