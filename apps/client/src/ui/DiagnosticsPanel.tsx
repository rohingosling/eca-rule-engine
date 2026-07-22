//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Implements diagnostics panel presentation and interaction behavior for the browser-based ECA model laboratory.
//
//---------------------------------------------------------------------------------------------------------------------

import type { ModelDiagnostic } from "../engine/model-validation";
import { diagnosticMessage } from "./diagnostic-navigation";

//---------------------------------------------------------------------------------------------------------------------
// Interface: DocumentDiagnosticSnapshot
//
// Description:
//
//   Defines the named fields and callable operations that make up document diagnostic snapshot.
//
//---------------------------------------------------------------------------------------------------------------------
export interface DocumentDiagnosticSnapshot
{
    diagnostics: ModelDiagnostic[];
    revision: number;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: DiagnosticsPanelProperties
//
// Description:
//
//   Defines the named fields and callable operations that make up diagnostics panel properties.
//
//---------------------------------------------------------------------------------------------------------------------
interface DiagnosticsPanelProperties
{
    currentRevision: number;
    navigate: ( diagnostic: ModelDiagnostic ) => void;
    snapshot: DocumentDiagnosticSnapshot;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: DiagnosticsPanel
//
// Description:
//
//   Renders the diagnostics panel component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (DiagnosticsPanelProperties):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function DiagnosticsPanel ( properties: DiagnosticsPanelProperties )
{
    const stale = properties.snapshot.revision !== properties.currentRevision;

    // Return the rendered interface element.

    return <section className={ stale ? "diagnostics-panel stale" : "diagnostics-panel" }
        aria-labelledby="diagnostics-heading">
        <div className="diagnostics-heading-row"><div><p className="eyebrow">Document validation</p>
            <h2 id="diagnostics-heading">Diagnostics</h2></div></div>
        <p className="diagnostics-summary">Revision { properties.snapshot.revision }: {
            properties.snapshot.diagnostics.length === 0 ? "no diagnostics" :
                `${ properties.snapshot.diagnostics.length } error${ properties.snapshot.diagnostics.length === 1 ? "" : "s" }`
        }.{ stale ? ` Stale — the document is now revision ${ properties.currentRevision }.` : " Current." }</p>
        { properties.snapshot.diagnostics.length > 0 && <ol className="diagnostics-list">
            { properties.snapshot.diagnostics.map
            (
                ( diagnostic, index ) => <li key={ `${ diagnostic.pointer }-${ diagnostic.code }-${ index }` }>
                    <button type="button" onClick={ () => properties.navigate ( diagnostic ) }>
                        <span className="diagnostic-severity">Error</span>
                        <code>{ diagnostic.code }</code>
                        <span>{ "message" in diagnostic ? diagnostic.message : diagnosticMessage ( diagnostic.code ) }</span>
                        <code>{ diagnostic.pointer }</code>
                    </button>
                </li>
            ) }
        </ol> }
    </section>;
}
