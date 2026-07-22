//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Shared bounded text summaries for large identifier and definition collections.
//
//---------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------
// Function: summarizeValues
//
// Description:
//
//   Performs the summarize values operation using the supplied inputs and current state.
//
// Arguments:
//
//   values (readonly string[]):
//     The values collection inspected or transformed by this operation.
//
//   maximumVisibleValues (number):
//     The maximum visible values collection inspected or transformed by this operation.
//
// Returns:
//
//   The summarize values result.
//
//---------------------------------------------------------------------------------------------------------------------

export function summarizeValues ( values: readonly string[], maximumVisibleValues: number ): string
{
    const visibleValues    = values.slice ( 0, maximumVisibleValues );
    const hiddenValueCount = values.length - visibleValues.length;

    // Return the value selected by the evaluated condition.

    return visibleValues.join ( ", " ) + ( hiddenValueCount ? `, +${ hiddenValueCount } more` : "" );
}
