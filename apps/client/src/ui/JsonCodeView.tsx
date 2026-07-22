//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Read-only, syntax-highlighted JSON source view with bounded DOM rendering.
//
//---------------------------------------------------------------------------------------------------------------------

import {
    type CSSProperties, memo, type ReactNode, useEffect, useMemo, useRef, useState, type UIEvent
} from "react";
import {
    DEFAULT_CODE_VIEWPORT_HEIGHT_PIXELS, EDITOR_LAYOUT_STYLE_VARIABLES, JSON_CODE_LINE_HEIGHT_PIXELS,
    JSON_CODE_OVERSCAN_LINES
} from "../config/editor-layout";
import type { StatelessECAModel } from "../contracts/model.generated";
import { serializeModel } from "../document/model-document";

//---------------------------------------------------------------------------------------------------------------------
// Interface: JsonCodeViewProperties
//
// Description:
//
//   Defines the named fields and callable operations that make up JSON code view properties.
//
//---------------------------------------------------------------------------------------------------------------------
interface JsonCodeViewProperties
{
    model: StatelessECAModel;
}

const JSON_TOKEN_PATTERN = /("(?:\\.|[^"\\])*")(?=\s*:)|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false)\b|\b(null)\b/g;

//---------------------------------------------------------------------------------------------------------------------
// Function: highlightLine
//
// Description:
//
//   Performs the highlight line operation using the supplied inputs and current state.
//
// Arguments:
//
//   line (string):
//     The line used by this operation.
//
// Returns:
//
//   The highlight line result.
//
//---------------------------------------------------------------------------------------------------------------------

function highlightLine ( line: string ): ReactNode[]
{
    const content: ReactNode[] = [];
    let previousIndex = 0;

    for ( const match of line.matchAll ( JSON_TOKEN_PATTERN ) )
    {
        const matchIndex = match.index;
        if ( matchIndex > previousIndex )
        {
            content.push ( line.slice ( previousIndex, matchIndex ) );
        }

        const tokenClass = match [ 1 ] ? "json-key" : match [ 2 ] ? "json-string"
            : match [ 3 ] ? "json-number" : match [ 4 ] ? "json-boolean" : "json-null";
        content.push ( <span className={ tokenClass } key={ matchIndex }>{ match [ 0 ] }</span> );
        previousIndex = matchIndex + match [ 0 ].length;
    }

    if ( previousIndex < line.length )
    {
        content.push ( line.slice ( previousIndex ) );
    }

    // Return the content.

    return content;
}

export const JsonCodeView = memo
(
    function JsonCodeView (
    {
        model
    }: JsonCodeViewProperties )
    {
        const containerReference = useRef<HTMLDivElement> ( null );
        const [ scrollTop, setScrollTop ] = useState ( 0 );
        const [ viewportHeight, setViewportHeight ] = useState ( DEFAULT_CODE_VIEWPORT_HEIGHT_PIXELS );
        const [ copyStatus, setCopyStatus ] = useState ( "" );
        const serialization = useMemo ( () => serializeModel ( model ), [ model ] );
        const lines = useMemo ( () => serialization.trimEnd ().split ( "\n" ), [ serialization ] );

        useEffect
        (
            () =>
            {
                const container = containerReference.current;
                if ( !container )
                {

                    // Return without a value after completing this code path.

                    return;
                }

                setViewportHeight ( container.clientHeight || DEFAULT_CODE_VIEWPORT_HEIGHT_PIXELS );
                if ( typeof ResizeObserver === "undefined" )
                {

                    // Return without a value after completing this code path.

                    return;
                }
                const resizeObserver = new ResizeObserver
                (
                    entries =>
                    setViewportHeight ( entries [ 0 ]?.contentRect.height || DEFAULT_CODE_VIEWPORT_HEIGHT_PIXELS )
                );
                resizeObserver.observe ( container );

                // Return the value produced by this code path.

                return () => resizeObserver.disconnect ();
            }, []
        );

        const visibleLineCount = Math.ceil ( viewportHeight / JSON_CODE_LINE_HEIGHT_PIXELS )
            + JSON_CODE_OVERSCAN_LINES * 2;
        const maximumFirstLine = Math.max ( 0, lines.length - visibleLineCount );
        const firstLine = Math.min
        (
            maximumFirstLine,
            Math.max ( 0, Math.floor ( scrollTop / JSON_CODE_LINE_HEIGHT_PIXELS ) - JSON_CODE_OVERSCAN_LINES )
        );
        const lastLine = Math.min ( lines.length, firstLine + visibleLineCount );
        const visibleLines = lines.slice ( firstLine, lastLine );
        //-----------------------------------------------------------------------------------------------------------------
        // Function: updateScrollPosition
        //
        // Description:
        //
        //   Updates scroll position using the supplied inputs and current state.
        //
        // Arguments:
        //
        //   event (UIEvent<HTMLDivElement>):
        //     The event used by this operation.
        //
        // Returns:
        //
        //   The update scroll position result.
        //
        //-----------------------------------------------------------------------------------------------------------------

        const updateScrollPosition = ( event: UIEvent<HTMLDivElement> ) => setScrollTop ( event.currentTarget.scrollTop );

        //-----------------------------------------------------------------------------------------------------------------
        // Function: copySource
        //
        // Description:
        //
        //   Copies source using the supplied inputs and current state.
        //
        // Returns:
        //
        //   The copy source result.
        //
        //-----------------------------------------------------------------------------------------------------------------

        const copySource = async () =>
        {
            try
            {
                await navigator.clipboard.writeText ( serialization );
                setCopyStatus ( "JSON copied." );
            }
            catch
            {
                setCopyStatus ( "The browser could not copy the JSON." );
            }
        };

        // Return the rendered interface element.

        return <div className="json-code-panel" style={ EDITOR_LAYOUT_STYLE_VARIABLES as CSSProperties }>
            <div className="json-code-toolbar"><span>{ lines.length } lines</span>
                <button type="button" className="secondary" onClick={ () => void copySource () }>Copy JSON</button>
                <span className="visually-hidden" role="status">{ copyStatus }</span>
            </div>
            <div ref={ containerReference } className="json-code-view" role="region" tabIndex={ 0 }
                aria-label="Read-only JSON model source" onScroll={ updateScrollPosition }>
                <textarea className="visually-hidden" aria-label="Complete JSON model source"
                    readOnly tabIndex={ -1 } value={ serialization } />
                <pre aria-hidden="true" style={ (
                    {
                        paddingTop: firstLine * JSON_CODE_LINE_HEIGHT_PIXELS,
                        paddingBottom: ( lines.length - lastLine ) * JSON_CODE_LINE_HEIGHT_PIXELS
                    }
                ) }><code>
                    { visibleLines.map
                    (
                        ( line, visibleIndex ) =>
                                    {
                            const lineIndex = firstLine + visibleIndex;

                                        // Return the rendered interface element.

                                        return <span className="json-code-line" key={ lineIndex }>
                                            <span className="json-line-number" aria-hidden="true">{ lineIndex + 1 }</span>
                                            <span className="json-line-content">{ highlightLine ( line ) }{ "\n" }</span>
                                        </span>;
                        }
                    ) }
                </code></pre>
            </div>
        </div>;
    }
);
