//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   YAML and collection-oriented CSV interchange for the version 1 model document.
//
//---------------------------------------------------------------------------------------------------------------------

import { parse, stringify } from "yaml";
import type {
    Action, Condition, EventType, ParameterDefinition, PayloadDefinition, Rule, StatelessECAModel
} from "../contracts/model.generated";

//---------------------------------------------------------------------------------------------------------------------
// Type: ModelCollectionName
//
// Description:
//
//   Defines the valid representation of model collection name.
//
//---------------------------------------------------------------------------------------------------------------------
export type ModelCollectionName = "parameters" | "payloads" | "events" | "conditions" | "actions" | "rules";

//---------------------------------------------------------------------------------------------------------------------
// Function: parseYAMLModel
//
// Description:
//
//   Parses the supplied representation and returns its normalized in-memory form.
//
// Arguments:
//
//   content (string):
//     The content used by this operation.
//
// Returns:
//
//   The parse YAML model result.
//
//---------------------------------------------------------------------------------------------------------------------

export function parseYAMLModel ( content: string ): StatelessECAModel
{

    // Return the result produced by the delegated operation.

    return parse ( content ) as StatelessECAModel;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: serializeYAMLModel
//
// Description:
//
//   Serializes YAML model using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
// Returns:
//
//   The serialize YAML model result.
//
//---------------------------------------------------------------------------------------------------------------------

export function serializeYAMLModel ( model: StatelessECAModel ): string
{

    // Return the result produced by the delegated operation.

    return stringify
    (
        model, (
            {
                lineWidth: 0
            }
        )
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: escapeCSVField
//
// Description:
//
//   Escapes CSV field using the supplied inputs and current state.
//
// Arguments:
//
//   value (unknown):
//     The value used by this operation.
//
// Returns:
//
//   The escape CSV field result.
//
//---------------------------------------------------------------------------------------------------------------------

function escapeCSVField ( value: unknown ): string
{
    const text = typeof value === "string" ? value : JSON.stringify ( value );

    // Return the value selected by the evaluated condition.

    return /[",\r\n]/.test ( text ) ? `"${ text.replaceAll ( '"', '""' ) }"` : text;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: serializeCollectionCSV
//
// Description:
//
//   Serializes collection CSV using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   collection (ModelCollectionName):
//     The collection inspected or transformed by this operation.
//
// Returns:
//
//   The serialize collection CSV result.
//
//---------------------------------------------------------------------------------------------------------------------

export function serializeCollectionCSV ( model: StatelessECAModel, collection: ModelCollectionName ): string
{
    const headers = collection === "parameters" ? [ "id", "name", "description", "type" ]
        : collection === "payloads" ? [ "id", "name", "description", "parameters" ]
            : collection === "events" ? [ "id", "name", "description", "payload" ]
                : collection === "conditions" ? [ "id", "name", "description", "dependencies", "predicate" ]
                    : collection === "actions" ? [ "id", "name", "description", "parameters" ]
                        : [ "id", "name", "description", "event", "condition", "action" ];
    const rows = model [ collection ].map
    (
        item => headers.map
        (
            header =>
            escapeCSVField ( ( item as unknown as Record<string, unknown> ) [ header ] ?? "" )
        ).join ( "," )
    );

    // Return the value selected by the evaluated condition.

    return `${ headers.join ( "," ) }\r\n${ rows.join ( "\r\n" ) }${ rows.length ? "\r\n" : "" }`;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: parseCSVRows
//
// Description:
//
//   Parses the supplied representation and returns its normalized in-memory form.
//
// Arguments:
//
//   content (string):
//     The content used by this operation.
//
// Returns:
//
//   The parse CSV rows result.
//
//---------------------------------------------------------------------------------------------------------------------

export function parseCSVRows ( content: string ): string[][]
{
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let quoted = false;
    for ( let index = 0; index < content.length; index++ )
    {
        const character = content [ index ];
        if ( quoted && character === '"' && content [ index + 1 ] === '"' )
        {
            field += '"';
            index++;
        }
        else if ( character === '"' )
        {
            quoted = !quoted;
        }
        else if ( character === "," && !quoted )
        {
            row.push ( field );
            field = "";
        }
        else if ( ( character === "\n" || character === "\r" ) && !quoted )
        {
            if ( character === "\r" && content [ index + 1 ] === "\n" ) index++;
            row.push ( field );
            if ( row.some ( value => value.length > 0 ) ) rows.push ( row );
            row = [];
            field = "";
        }
        else
        {
            field += character;
        }
    }
    if ( quoted ) throw new Error ( "The CSV file contains an unterminated quoted field." );
    if ( field.length || row.length )
    {
        row.push ( field );
        rows.push ( row );
    }

    // Return the rows.

    return rows;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: optionalJSON
//
// Description:
//
//   Performs the optional JSON operation using the supplied inputs and current state.
//
// Arguments:
//
//   value (string):
//     The value used by this operation.
//
//   fallback (unknown):
//     The fallback used by this operation.
//
// Returns:
//
//   The optional JSON result.
//
//---------------------------------------------------------------------------------------------------------------------

function optionalJSON ( value: string, fallback: unknown ): unknown
{

    // Return the value selected by the evaluated condition.

    return value.trim () ? JSON.parse ( value ) : fallback;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: importCollectionCSV
//
// Description:
//
//   Performs the import collection CSV operation using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   collection (ModelCollectionName):
//     The collection inspected or transformed by this operation.
//
//   content (string):
//     The content used by this operation.
//
// Returns:
//
//   The import collection CSV result.
//
//---------------------------------------------------------------------------------------------------------------------

export function importCollectionCSV (
    model: StatelessECAModel, collection: ModelCollectionName, content: string ): StatelessECAModel
{
    const rows = parseCSVRows ( content );
    if ( rows.length === 0 ) throw new Error ( "The CSV file is empty." );
    const headers = rows [ 0 ].map ( header => header.trim () );
    const records = rows.slice ( 1 ).map
    (
        values => Object.fromEntries (
        headers.map ( ( header, index ) => [ header, values [ index ] ?? "" ] ) )
    );
    const imported = records.map
    (
        record =>
        {
            const common =
            {
                id: record.id, name: record.name, ...( record.description ?
                {
                    description: record.description
                } :
                {
                } )
            };
            if ( collection === "parameters" )
            {
                // Return the value produced by this code path.

                return (
                {
                    ...common, type: record.type || "string"
                }
            ) as ParameterDefinition;
            }
            if ( collection === "payloads" )
            {
                // Return the value produced by this code path.

                return (
                {
                    ...common, parameters: optionalJSON ( record.parameters, [] )
                }
            ) as PayloadDefinition;
            }
            if ( collection === "events" )
            {
                // Return the value selected by the evaluated condition.

                return (
                {
                    ...common, ...( record.payload ?
                    {
                        payload: record.payload
                    } :
                    {
                    } )
                }
            ) as EventType;
            }
            if ( collection === "conditions" )
            {
                // Return the value produced by this code path.

                return (
                {
                    ...common, dependencies: optionalJSON ( record.dependencies, [] ),
                    predicate: optionalJSON
                    (
                        record.predicate,
                        {
                            name: "always", arguments:
                            {
                            }
                        }
                    )
                }
            ) as Condition;
            }
            if ( collection === "actions" )
            {
                // Return the value produced by this code path.

                return (
                {
                    ...common, parameters: optionalJSON
                    (
                        record.parameters,
                        {
                        }
                    )
                }
            ) as Action;
            }

            // Return the value produced by this code path.

            return (
                {
                    ...common, event: record.event, condition: record.condition, action: record.action
                }
            ) as Rule;
        }
    );

    // Return the value produced by this code path.

    return (
        {
            ...model, [ collection ]: imported
        }
    );
}
