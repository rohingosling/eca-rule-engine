//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Shared, accessible pagination calculations and controls for bounded model-collection rendering.
//
//---------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------
// Interface: CollectionPage
//
// Description:
//
//   Defines the named fields and callable operations that make up collection page.
//
//---------------------------------------------------------------------------------------------------------------------
export interface CollectionPage
{
    endIndexExclusive: number;
    pageIndex: number;
    startIndex: number;
    totalPages: number;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: CollectionPaginationProperties
//
// Description:
//
//   Defines the named fields and callable operations that make up collection pagination properties.
//
//---------------------------------------------------------------------------------------------------------------------
interface CollectionPaginationProperties extends CollectionPage
{
    itemCount: number;
    label: string;
    setPageIndex: ( pageIndex: number ) => void;
    showSummary?: boolean;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: calculateCollectionPage
//
// Description:
//
//   Calculates collection page using the supplied inputs and current state.
//
// Arguments:
//
//   itemCount (number):
//     The item count used by this operation.
//
//   requestedPageIndex (number):
//     The requested page index used by this operation.
//
//   pageSize (number):
//     The page size used by this operation.
//
// Returns:
//
//   The calculate collection page result.
//
//---------------------------------------------------------------------------------------------------------------------

export function calculateCollectionPage (
    itemCount: number, requestedPageIndex: number, pageSize: number ): CollectionPage
{
    const totalPages        = Math.max ( 1, Math.ceil ( itemCount / pageSize ) );
    const pageIndex         = Math.max ( 0, Math.min ( requestedPageIndex, totalPages - 1 ) );
    const startIndex        = pageIndex * pageSize;
    const endIndexExclusive = Math.min ( startIndex + pageSize, itemCount );

    // Return the value produced by this code path.

    return (
        {
            endIndexExclusive, pageIndex, startIndex, totalPages
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: CollectionPagination
//
// Description:
//
//   Renders the collection pagination component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (CollectionPaginationProperties):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function CollectionPagination ( properties: CollectionPaginationProperties )
{
    const firstVisibleItem = properties.itemCount === 0 ? 0 : properties.startIndex + 1;
    const rangeDescription = properties.itemCount === 0
        ? "No items."
        : `Items ${ firstVisibleItem }–${ properties.endIndexExclusive } of ${ properties.itemCount }.`;
    const showSummary = properties.showSummary ?? true;

    if ( !showSummary && properties.totalPages <= 1 )
    {

        // Return no value for this code path.

        return null;
    }

    // Return the rendered interface element.

    return <div className="collection-pagination" role="group" aria-label={ `${ properties.label } pagination` }>
        { showSummary && <span className="collection-pagination-summary" aria-live="polite">
            { rangeDescription } Page { properties.pageIndex + 1 } of { properties.totalPages }.
        </span> }
        { properties.totalPages > 1 && <div className="collection-pagination-actions">
            <button type="button" className="secondary" disabled={ properties.pageIndex === 0 }
                aria-label={ `First ${ properties.label } page` }
                onClick={ () => properties.setPageIndex ( 0 ) }>First</button>
            <button type="button" className="secondary" disabled={ properties.pageIndex === 0 }
                aria-label={ `Previous ${ properties.label } page` }
                onClick={ () => properties.setPageIndex ( properties.pageIndex - 1 ) }>Previous</button>
            <button type="button" className="secondary"
                disabled={ properties.pageIndex === properties.totalPages - 1 }
                aria-label={ `Next ${ properties.label } page` }
                onClick={ () => properties.setPageIndex ( properties.pageIndex + 1 ) }>Next</button>
            <button type="button" className="secondary"
                disabled={ properties.pageIndex === properties.totalPages - 1 }
                aria-label={ `Last ${ properties.label } page` }
                onClick={ () => properties.setPageIndex ( properties.totalPages - 1 ) }>Last</button>
        </div> }
    </div>;
}
