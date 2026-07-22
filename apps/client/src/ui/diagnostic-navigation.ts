//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Implements diagnostic navigation presentation and interaction behavior for the browser-based ECA model laboratory.
//
//---------------------------------------------------------------------------------------------------------------------

import type { StatelessECAModel } from "../contracts/model.generated";
import type { EditorNavigation } from "./StructuredEditor";

const COLLECTION_NAMES = [ "parameters", "payloads", "events", "conditions", "actions", "rules" ] as const;

//---------------------------------------------------------------------------------------------------------------------
// Interface: DiagnosticNavigationTarget
//
// Description:
//
//   Defines the named fields and callable operations that make up diagnostic navigation target.
//
//---------------------------------------------------------------------------------------------------------------------
export interface DiagnosticNavigationTarget
{
    field?: string;
    navigation: EditorNavigation;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: unescapeJsonPointerSegment
//
// Description:
//
//   Performs the unescape JSON pointer segment operation using the supplied inputs and current state.
//
// Arguments:
//
//   segment (string):
//     The segment used by this operation.
//
// Returns:
//
//   The unescape JSON pointer segment result.
//
//---------------------------------------------------------------------------------------------------------------------

function unescapeJsonPointerSegment ( segment: string ): string
{

    // Return the result produced by the delegated operation.

    return segment.replaceAll ( "~1", "/" ).replaceAll ( "~0", "~" );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: diagnosticNavigationTarget
//
// Description:
//
//   Derives navigation target using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
//   pointer (string):
//     The pointer used by this operation.
//
//   sequence (number):
//     The sequence used by this operation.
//
// Returns:
//
//   The diagnostic navigation target result.
//
//---------------------------------------------------------------------------------------------------------------------

export function diagnosticNavigationTarget (
    model: StatelessECAModel, pointer: string, sequence: number ): DiagnosticNavigationTarget
{
    const segments = pointer.split ( "/" ).slice ( 1 ).map ( unescapeJsonPointerSegment );
    const collection = COLLECTION_NAMES.find ( candidate => candidate === segments [ 0 ] );
    if ( !collection )
    {

        // Return the value produced by this code path.

        return (
            {
                field: segments [ 0 ], navigation:
                {
                    section: "model", sequence
                }
            }
        );
    }

    const itemIndex = Number ( segments [ 1 ] );
    const item = Number.isInteger ( itemIndex ) ? model [ collection ] [ itemIndex ] : undefined;

    // Return the value selected by the evaluated condition.

    return (
        {
            field: segments.slice ( 2 ).join ( "/" ) || undefined,
            navigation:
            {
                section: collection, identifier: item?.id, sequence
            }
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: diagnosticMessage
//
// Description:
//
//   Derives message using the supplied inputs and current state.
//
// Arguments:
//
//   code (string):
//     The code used by this operation.
//
// Returns:
//
//   The diagnostic message result.
//
//---------------------------------------------------------------------------------------------------------------------

export function diagnosticMessage ( code: string ): string
{

    // Return the value selected by the evaluated condition.

    return code.split ( "-" ).map ( word => word [ 0 ]?.toUpperCase () + word.slice ( 1 ) ).join ( " " );
}
