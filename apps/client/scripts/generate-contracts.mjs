//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Generate TypeScript model types, executable schema limits, and a CSP-safe standalone validator from the
//   authoritative JSON Schema.
//
//---------------------------------------------------------------------------------------------------------------------

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import standaloneCode from "ajv/dist/standalone/index.js";
import { compile } from "json-schema-to-typescript";

const clientDirectory = resolve ( import.meta.dirname, ".." );
const modelSchemaPath = resolve ( clientDirectory, "../../contracts/schemas/model.schema.json" );
const diagnosticSchemaPath = resolve ( clientDirectory, "../../contracts/schemas/diagnostic.schema.json" );
const outputPath = resolve ( clientDirectory, "src/contracts/model.generated.ts" );
const limitsOutputPath = resolve ( clientDirectory, "src/contracts/contract-limits.ts" );
const validatorOutputPath = resolve ( clientDirectory, "src/contracts/model.validator.generated.ts" );
const modelSchema = JSON.parse ( await readFile ( modelSchemaPath, "utf8" ) );
const diagnosticSchema = JSON.parse ( await readFile ( diagnosticSchemaPath, "utf8" ) );

const generatedTypesHeader = `//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Defines TypeScript representations generated from the authoritative model schema. Regenerate this file when the
//   schema changes; do not edit the generated declarations directly.
//
//---------------------------------------------------------------------------------------------------------------------

`;
const generatedLimitsHeader = `//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Defines executable client limits generated from the authoritative model and diagnostic schemas. These values keep
//   browser validation aligned with the published contract.
//
//---------------------------------------------------------------------------------------------------------------------

`;
const generatedValidatorHeader = `//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Provides the CSP-safe model validator generated from the authoritative JSON Schema. The compact predicates
//   below are emitted by Ajv and should be regenerated rather than edited directly.
//
//---------------------------------------------------------------------------------------------------------------------

`;

//---------------------------------------------------------------------------------------------------------------------
// Function: normalizeLineEndings
//
// Description:
//
//   Normalizes line endings for the enclosing operation while preserving its documented input and state invariants.
//
// Arguments:
//
//   source (inferred):
//     The source supplied to this operation.
//
// Returns:
//
//   The value or state projection produced by the operation.
//
//---------------------------------------------------------------------------------------------------------------------

const normalizeLineEndings = ( source ) => source.replace ( /\r\n?/g, "\n" );

//---------------------------------------------------------------------------------------------------------------------
// Function: addGeneratedReturnComments
//
// Description:
//
//   Adds an explanatory comment above every return statement in compact JavaScript emitted by the schema compiler.
//
// Arguments:
//
//   source (string):
//     The generated JavaScript source inspected and transformed by this operation.
//
// Returns:
//
//   The generated JavaScript source with return comments inserted outside strings and comments.
//
//---------------------------------------------------------------------------------------------------------------------

function addGeneratedReturnComments ( source )
{
    let generatedSource = "";
    let sourceIndex = 0;
    let lexicalState = "code";

    while ( sourceIndex < source.length )
    {
        const character = source [ sourceIndex ];
        const nextCharacter = source [ sourceIndex + 1 ];

        if ( lexicalState === "code" )
        {
            if ( character === "\"" || character === "'" || character === "`" )
            {
                lexicalState = character;
            }
            else if ( character === "/" && nextCharacter === "/" )
            {
                lexicalState = "line-comment";
            }
            else if ( character === "/" && nextCharacter === "*" )
            {
                lexicalState = "block-comment";
            }
            else if ( source.startsWith ( "return", sourceIndex )
                && !/[A-Za-z0-9_$]/.test ( source [ sourceIndex - 1 ] ?? "" )
                && !/[A-Za-z0-9_$]/.test ( source [ sourceIndex + 6 ] ?? "" ) )
            {
                generatedSource += "\n// Return the generated validation result for this code path.\nreturn";
                sourceIndex += 6;
                continue;
            }
        }
        else if ( lexicalState === "line-comment" && ( character === "\n" || character === "\r" ) )
        {
            lexicalState = "code";
        }
        else if ( lexicalState === "block-comment" && character === "*" && nextCharacter === "/" )
        {
            generatedSource += "*/";
            sourceIndex += 2;
            lexicalState = "code";
            continue;
        }
        else if ( lexicalState === character && source [ sourceIndex - 1 ] !== "\\" )
        {
            lexicalState = "code";
        }

        generatedSource += character;
        sourceIndex++;
    }

    // Return the generated source with explanatory return comments.

    return generatedSource;
}

const generatedSource = await compile
(
    modelSchema, "EcaModel",
    {
        bannerComment: generatedTypesHeader,
        style:
        {
            singleQuote: false, semi: true, tabWidth: 4, trailingComma: "none"
        }
    }
);
const generated = generatedSource
    .replace ( /^(export interface [^{\r\n]+) \{$/gm, "$1\n{" )
    .replace ( /^(export type [^=\r\n]+ =) \{$/gm, "$1\n{" )
    .replace ( /^} & \{$/gm, "} &\n{" )
    .replace
    (
        /^(\s*)([A-Za-z_$][\w$]*\??:) \{\};$/gm,
        ( _, indentation, property ) => `${ indentation }${ property }\n${ indentation }{\n${ indentation }};`
    )
    .replace ( /^(\s*)([A-Za-z_$][\w$]*\??:) \{$/gm, "$1$2\n$1{" );
const identifierPattern = modelSchema.$defs.identifier.pattern.replaceAll ( "/", "\\/" );
const generatedLimits = generatedLimitsHeader
    + `export const MAXIMUM_IDENTIFIER_LENGTH = ${ modelSchema.$defs.identifier.maxLength };\n`
    + `export const MAXIMUM_DISPLAY_NAME_LENGTH = ${ modelSchema.$defs.displayName.maxLength };\n`
    + `export const MAXIMUM_DESCRIPTION_LENGTH = ${ modelSchema.$defs.description.maxLength };\n`
    + `export const MAXIMUM_DIAGNOSTIC_MESSAGE_CODE_POINTS = ${
        diagnosticSchema.properties.message.maxLength };\n\n`
    + `export const MAXIMUM_PARAMETERS = ${ modelSchema.properties.parameters.maxItems };\n`
    + `export const MAXIMUM_PAYLOADS = ${ modelSchema.properties.payloads.maxItems };\n`
    + `export const MAXIMUM_EVENTS = ${ modelSchema.properties.events.maxItems };\n`
    + `export const MAXIMUM_CONDITIONS = ${ modelSchema.properties.conditions.maxItems };\n`
    + `export const MAXIMUM_ACTIONS = ${ modelSchema.properties.actions.maxItems };\n`
    + `export const MAXIMUM_RULES = ${ modelSchema.properties.rules.maxItems };\n\n`
    + `export const MAXIMUM_PAYLOAD_PARAMETERS = ${
        modelSchema.$defs.payloadDefinition.properties.parameters.maxItems };\n`
    + `export const MAXIMUM_CONDITION_DEPENDENCIES = ${
        modelSchema.$defs.condition.properties.dependencies.maxItems };\n\n`
    + `export const IDENTIFIER_PATTERN = /${ identifierPattern }/;\n\n`
    + `export const MODEL_COLLECTION_LIMITS =\n{\n`
    + `    parameters: MAXIMUM_PARAMETERS,\n`
    + `    payloads: MAXIMUM_PAYLOADS,\n`
    + `    events: MAXIMUM_EVENTS,\n`
    + `    conditions: MAXIMUM_CONDITIONS,\n`
    + `    actions: MAXIMUM_ACTIONS,\n`
    + `    rules: MAXIMUM_RULES\n`
    + `} as const;\n`;
const schemaCompiler = new Ajv2020
(
    {
        allErrors: true,
        strict: true,
        strictTypes: false,
        code:
        {
            esm: true,
            source: true
        }
    }
);
const schemaValidator = schemaCompiler.compile ( modelSchema );
const standaloneValidatorSource = standaloneCode ( schemaCompiler, schemaValidator );
const standaloneRuntimeHelpers = `//---------------------------------------------------------------------------------------------------------------------
// Function: generatedJSONDeepEqual
//
// Description:
//
//   Compares arbitrary JSON-compatible values recursively so schema uniqueness checks use structural equality.
//
// Arguments:
//
//   left (inferred):
//     The value on the left side of the comparison.
//
//   right (inferred):
//     The value on the right side of the comparison.
//
// Returns:
//
//   True when both values have the same JSON structure and content; otherwise false.
//
//---------------------------------------------------------------------------------------------------------------------

function generatedJSONDeepEqual ( left, right )
{
    if ( left === right )
    {
        // Return true when both values are identical.

        return true;
    }
    if ( left === null || right === null || typeof left !== "object" || typeof right !== "object" )
    {
        // Return false when only one value can participate in structural comparison.

        return false;
    }
    if ( Array.isArray ( left ) )
    {
        if ( !Array.isArray ( right ) || left.length !== right.length )
        {
            // Return false when the array shapes differ.

            return false;
        }

        // Return whether corresponding array elements are structurally equal.

        return left.every ( ( value, index ) => generatedJSONDeepEqual ( value, right [ index ] ) );
    }
    if ( Array.isArray ( right ) )
    {
        // Return false when only the right value is an array.

        return false;
    }
    const leftKeys = Object.keys ( left );
    if ( leftKeys.length !== Object.keys ( right ).length )
    {
        // Return false when the objects expose different numbers of properties.

        return false;
    }

    // Return whether corresponding object properties are structurally equal.

    return leftKeys.every
    (
        key => Object.prototype.hasOwnProperty.call ( right, key )
            && generatedJSONDeepEqual ( left [ key ], right [ key ] )
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: generatedUnicodeCodePointLength
//
// Description:
//
//   Processes generated unicode code point length for the enclosing module and exposes the resulting value or state
//   transition to its caller.
//
// Arguments:
//
//   value (inferred):
//     The value supplied to this operation.
//
// Returns:
//
//   The value or state projection produced by the operation.
//
//---------------------------------------------------------------------------------------------------------------------

function generatedUnicodeCodePointLength ( value )
{
    // Return the number of Unicode code points in the value.

    return Array.from ( value ).length;
}

`;
const generatedValidator = generatedValidatorHeader + "// @ts-nocheck\n\n"
    + standaloneRuntimeHelpers
    + addGeneratedReturnComments ( standaloneValidatorSource )
        .replace
        (
            /const (func\d+) = require\("ajv\/dist\/runtime\/equal"\)\.default;/g,
            "const $1 = generatedJSONDeepEqual;"
        )
        .replace
        (
            /const (func\d+) = require\("ajv\/dist\/runtime\/ucs2length"\)\.default;/g,
            "const $1 = generatedUnicodeCodePointLength;"
        )
    + "\n";

if ( generatedValidator.includes ( "require(" ) )
{
    throw new Error ( "The generated validator contains an unsupported runtime module reference." );
}

if ( process.argv.includes ( "--check" ) )
{
    const current = await readFile ( outputPath, "utf8" ).catch ( () => "" );
    const currentLimits = await readFile ( limitsOutputPath, "utf8" ).catch ( () => "" );
    const currentValidator = await readFile ( validatorOutputPath, "utf8" ).catch ( () => "" );

    if ( normalizeLineEndings ( current ) !== generated
        || normalizeLineEndings ( currentLimits ) !== generatedLimits
        || normalizeLineEndings ( currentValidator ) !== generatedValidator )
    {
        console.error ( "Generated contract types, limits, or validator are stale. Run npm run contracts:generate." );
        process.exitCode = 1;
    }
}
else
{
    await writeFile ( outputPath, generated, "utf8" );
    await writeFile ( limitsOutputPath, generatedLimits, "utf8" );
    await writeFile ( validatorOutputPath, generatedValidator, "utf8" );
}
