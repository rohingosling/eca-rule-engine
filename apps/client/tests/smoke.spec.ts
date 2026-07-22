//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   End-to-end smoke coverage for the authoring, graph-projection, and workspace journey.
//
//---------------------------------------------------------------------------------------------------------------------

import { expect, test } from "@playwright/test";

//---------------------------------------------------------------------------------------------------------------------
// Test: authors a model through Parameters, Payloads, and Events
//
// Description:
//
//   Verifies authors a model through Parameters, Payloads, and Events and records the expected externally observable
//   behavior for future changes.
//
//---------------------------------------------------------------------------------------------------------------------
test
(
    "authors a model through Parameters, Payloads, and Events", async ( { page } ) =>
    {
        await page.goto ( "/" );

        const tabList = page.getByRole ( "tablist", { name: "Workspace views" } );
        const guide   = page.locator ( ".user-guide-panel" );
        await expect ( tabList.getByRole ( "tab" ) ).toHaveCount ( 4 );
        await expect ( page.getByRole ( "heading", { name: "No document is open" } ) ).toBeVisible ();
        await expect ( guide.getByRole ( "heading", { name: "Begin with a model document" } ) ).toBeVisible ();
        await expect ( page.getByText ( "File: No document" ) ).toHaveCount ( 0 );

        await page.locator ( ".no-document" ).getByRole ( "button", { name: "New model" } ).click ();
        const modelIdentifier = page.getByLabel ( "Identifier" );
        await modelIdentifier.fill ( "orders" );
        await modelIdentifier.press ( "Tab" );
        await expect ( modelIdentifier ).toHaveValue ( "orders" );

        const parametersNode = page.getByRole ( "button", { name: /^Parameters\s*0$/ } );
        const payloadsNode   = page.getByRole ( "button", { name: /^Payloads\s*0$/ } );
        const eventsNode     = page.getByRole ( "button", { name: /^Events\s*0$/ } );
        await expect ( parametersNode ).toBeVisible ();
        await expect ( payloadsNode ).toBeVisible ();
        await expect ( eventsNode ).toBeVisible ();

        await parametersNode.click ();
        await expect ( guide.getByRole ( "heading", { name: "Parameters" } ) ).toBeVisible ();
        await page.getByRole ( "button", { name: "Add parameter" } ).click ();
        await expect ( page.getByLabel ( "Identifier" ) ).toHaveValue ( "parameter-1" );
        await page.getByLabel ( "JSON type" ).selectOption ( "number" );
        await expect ( page.getByText ( "Parameters: 1" ) ).toBeVisible ();

        await page.getByRole ( "button", { name: /^Payloads\s*0$/ } ).click ();
        await expect ( guide.getByRole ( "heading", { name: "Payload definitions" } ) ).toBeVisible ();
        await page.getByRole ( "button", { name: "Add payload" } ).click ();
        await expect ( page.getByLabel ( "Parameter to add" ) ).toHaveValue ( "" );
        await page.getByLabel ( "Parameter to add" ).fill ( "parameter-1" );
        await page.getByRole ( "button", { name: "Add parameter" } ).click ();
        await expect ( page.getByRole ( "cell", { name: "parameter-1", exact: true } ) ).toBeVisible ();
        await expect ( page.getByText ( "Payloads: 1" ) ).toBeVisible ();

        await page.getByRole ( "button", { name: /^Events\s*0$/ } ).click ();
        await expect ( guide.getByRole ( "heading", { name: "Events" } ) ).toBeVisible ();
        await page.getByRole ( "button", { name: "Add event" } ).click ();
        const eventPayload = page.getByRole ( "combobox", { name: "Payload", exact: true } );
        await eventPayload.selectOption ( "payload-1" );
        await expect ( eventPayload ).toHaveValue ( "payload-1" );

        await page.getByRole ( "button", { name: /^Conditions\s*0$/ } ).click ();
        await page.getByRole ( "button", { name: "Add condition" } ).click ();
        await page.getByRole ( "combobox", { name: "Predicate", exact: true } ).selectOption ( "equals" );
        await expect ( page.getByRole ( "combobox", { name: "Required parameter", exact: true } ) )
            .toHaveValue ( "parameter-1" );

        await page.getByRole ( "button", { name: /^Actions\s*0$/ } ).click ();
        await page.getByRole ( "button", { name: "Add action" } ).click ();
        await expect ( page.getByLabel ( "Action data (JSON object)" ) ).toBeVisible ();
        await expect ( page.getByLabel ( "Action type" ) ).toHaveCount ( 0 );

        await page.getByRole ( "button", { name: /^Rules\s*0$/ } ).click ();
        await page.getByRole ( "button", { name: "Add rule" } ).click ();

        await page.getByText ( "File", { exact: true } ).click ();
        await page.getByRole ( "button", { name: /Validate model/ } ).click ();
        const validationDialog = page.getByRole ( "dialog", { name: "Diagnostics" } );
        await expect ( validationDialog ).toBeVisible ();
        await expect ( validationDialog.locator ( ".diagnostics-summary" ) ).toContainText ( "1 error" );
        await validationDialog.getByRole ( "button", { name: /incompatible-comparison-value/ } ).click ();
        await expect ( validationDialog ).not.toBeVisible ();
        const comparisonValue = page.getByLabel ( "Comparison value (JSON)" );
        await expect ( comparisonValue ).toBeFocused ();
        await comparisonValue.fill ( "0" );
        await comparisonValue.press ( "Tab" );
        await page.getByText ( "File", { exact: true } ).click ();
        await page.getByRole ( "button", { name: /Validate model/ } ).click ();
        await expect ( validationDialog.locator ( ".diagnostics-summary" ) )
            .toContainText ( "no diagnostics. Current." );
        await validationDialog.getByRole ( "button", { name: "Close" } ).click ();

        await tabList.getByRole ( "tab", { name: "Graph" } ).click ();
        await expect ( page.getByLabel ( "ECA rule graph" ) ).toBeVisible ();
        await expect ( page.locator ( ".react-flow__node" ) ).toHaveCount ( 3 );
        await expect ( page.locator ( ".react-flow__edge" ) ).toHaveCount ( 2 );
        await expect ( guide.getByRole ( "heading", { name: "Rule graph" } ) ).toBeVisible ();

        await page.locator ( ".react-flow__node-event" ).click ();
        await page.getByRole ( "button", { name: "Open selection in Model" } ).click ();
        await expect ( tabList.getByRole ( "tab", { name: "Model" } ) ).toHaveAttribute ( "aria-selected", "true" );
        await expect ( page.getByLabel ( "Identifier" ) ).toHaveValue ( "event-1" );

        await tabList.getByRole ( "tab", { name: "Code" } ).click ();
        await expect ( page.getByRole ( "region", { name: "Read-only JSON model source" } ) ).toBeVisible ();
        await expect ( page.getByRole ( "navigation", { name: "ECA model structure" } ) ).toBeVisible ();
        await expect ( guide.getByRole ( "heading", { name: "Model source" } ) ).toBeVisible ();

        const source = JSON.parse ( await page.getByLabel ( "Complete JSON model source" ).inputValue () );
        expect ( source.parameters ).toEqual ( [ expect.objectContaining ( { id: "parameter-1", type: "number" } ) ] );
        expect ( source.payloads ).toEqual
        (
            [ expect.objectContaining
            (
                {
                    id: "payload-1", parameters: [ "parameter-1" ]
                }
            ) ]
        );
        expect ( source.events ).toEqual ( [ expect.objectContaining ( { id: "event-1", payload: "payload-1" } ) ] );
        expect ( source.events [ 0 ] ).not.toHaveProperty ( "parameters" );
        expect ( source.actions [ 0 ] ).not.toHaveProperty ( "type" );
    }
);

//---------------------------------------------------------------------------------------------------------------------
// Test: keeps populated Model, Simulator, and Code tabs vertically scrollable
//
// Description:
//
//   Verifies keeps populated Model, Simulator, and Code tabs vertically scrollable and records the expected externally
//   observable behavior for future changes.
//
//---------------------------------------------------------------------------------------------------------------------
test
(
    "keeps populated Model, Simulator, and Code tabs vertically scrollable", async ( { page } ) =>
    {
        await page.goto ( "/" );

        const parameters = Array.from
        (
            { length: 16 }, ( _, index ) =>
            {
                const number = String ( index + 1 ).padStart ( 2, "0" );

                // Return the assembled object value.

                return {
                    id:   `parameter-${number}`,
                    name: `Parameter ${number}`,
                    type: "string"
                };
            }
        );
        const parameterIdentifiers = parameters.map ( ( parameter ) => parameter.id );
        const model                = {
            schemaVersion: "1.0",
            id:            "scrollbar-test",
            name:          "Scrollbar test",
            parameters,
            payloads: [
                {
                    id:         "large-payload",
                    name:       "Large payload",
                    parameters: parameterIdentifiers
                }
            ],
            events: [
                {
                    id:      "large-event",
                    name:    "Large event",
                    payload: "large-payload"
                }
            ],
            conditions: [],
            actions:    [],
            rules:      []
        };

        await page.locator ( 'input[type="file"][accept="application/json,.json"]' ).setInputFiles
        (
            {
                name:     "scrollbar-test.json",
                mimeType: "application/json",
                buffer:   Buffer.from ( JSON.stringify ( model ) )
            }
        );

        const tabList = page.getByRole ( "tablist", { name: "Workspace views" } );

        await tabList.getByRole ( "tab", { name: "Simulator" } ).click ();
        const simulatorInputPanel = page.locator ( ".simulator-input-panel" );
        const simulatorDimensions = await simulatorInputPanel.evaluate
        (
            ( element ) => ( {
                clientHeight: element.clientHeight,
                scrollHeight: element.scrollHeight
            } )
        );
        expect ( simulatorDimensions.scrollHeight ).toBeGreaterThan ( simulatorDimensions.clientHeight );

        await page.getByRole ( "checkbox", { name: "Include in payload" } ).last ().click ();
        expect ( await simulatorInputPanel.evaluate ( ( element ) => element.scrollTop ) ).toBeGreaterThan ( 0 );

        await tabList.getByRole ( "tab", { name: "Code" } ).click ();
        const codeDimensions = await page.locator ( ".json-code-view" ).evaluate
        (
            ( element ) => ( {
                clientHeight: element.clientHeight,
                scrollHeight: element.scrollHeight
            } )
        );
        expect ( codeDimensions.scrollHeight ).toBeGreaterThan ( codeDimensions.clientHeight );

        await tabList.getByRole ( "tab", { name: "Model" } ).click ();
        await page.getByRole ( "button", { name: "Expand Payloads" } ).click ();
        await page.getByRole ( "button", { name: "Large payload", exact: true } ).click ();
        const modelDimensions = await page.locator ( ".editor" ).evaluate
        (
            ( element ) => ( {
                clientHeight: element.clientHeight,
                scrollHeight: element.scrollHeight
            } )
        );
        expect ( modelDimensions.scrollHeight ).toBeGreaterThan ( modelDimensions.clientHeight );
    }
);
