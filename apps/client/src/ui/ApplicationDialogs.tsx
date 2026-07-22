//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Validation, settings, page setup, and About dialog presentation.
//
//---------------------------------------------------------------------------------------------------------------------

import { type RefObject, useState } from "react";
import {
    APPLICATION_AUTHOR, APPLICATION_DESCRIPTION, APPLICATION_RELEASE_STATUS, APPLICATION_TITLE
} from "../config/application-metadata";
import {
    DEFAULT_PAGE_ORIENTATION, DEFAULT_PAGE_SIZE, PAGE_ORIENTATIONS, PAGE_SIZES, PRINT_PAGE_MARGIN_MILLIMETERS,
    type PageOrientation, type PageSize
} from "../config/page-setup";
import { THEME_MODES, type ThemeMode } from "../config/theme-preference";
import type { ModelDiagnostic } from "../engine/model-validation";
import { DiagnosticsPanel, type DocumentDiagnosticSnapshot } from "./DiagnosticsPanel";

//---------------------------------------------------------------------------------------------------------------------
// Type: SettingsGroup
//
// Description:
//
//   Defines the valid representation of settings group.
//
//---------------------------------------------------------------------------------------------------------------------
type SettingsGroup = "general" | "editor" | "files" | "validation" | "experiment" | "accessibility" | "advanced";

const SETTINGS_GROUPS: Array<[ SettingsGroup, string ]> = [
    [ "general", "General" ], [ "editor", "Editor" ], [ "files", "Files" ], [ "validation", "Validation" ],
    [ "experiment", "Experiment" ], [ "accessibility", "Accessibility" ], [ "advanced", "Advanced" ]
];

//---------------------------------------------------------------------------------------------------------------------
// Interface: ApplicationDialogsProperties
//
// Description:
//
//   Defines the named fields and callable operations that make up application dialogs properties.
//
//---------------------------------------------------------------------------------------------------------------------
interface ApplicationDialogsProperties
{
    aboutDialog: RefObject<HTMLDialogElement | null>;
    applicationVersion: string;
    pageSetupDialog: RefObject<HTMLDialogElement | null>;
    diagnosticSnapshot: DocumentDiagnosticSnapshot;
    documentRevision: number;
    navigateDiagnostic: ( diagnostic: ModelDiagnostic ) => void;
    setThemeMode: ( mode: ThemeMode ) => void;
    settingsDialog: RefObject<HTMLDialogElement | null>;
    themeMode: ThemeMode;
    validationDialog: RefObject<HTMLDialogElement | null>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: ApplicationDialogs
//
// Description:
//
//   Renders the application dialogs component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (ApplicationDialogsProperties):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function ApplicationDialogs ( properties: ApplicationDialogsProperties )
{
    const [ settingsGroup, setSettingsGroup ] = useState<SettingsGroup> ( "general" );
    const [ pageOrientation, setPageOrientation ] = useState<PageOrientation> ( DEFAULT_PAGE_ORIENTATION );
    const [ pageSize, setPageSize ] = useState<PageSize> ( DEFAULT_PAGE_SIZE );

    // Return the rendered interface element.

    return <>
        <dialog ref={ properties.validationDialog } className="validation-dialog"
            aria-labelledby="diagnostics-heading"><form method="dialog">
            <DiagnosticsPanel snapshot={ properties.diagnosticSnapshot }
                currentRevision={ properties.documentRevision } navigate={ properties.navigateDiagnostic } />
            <div className="dialog-actions"><button>Close</button></div>
        </form></dialog>
        <dialog ref={ properties.settingsDialog } className="settings-dialog"
            aria-labelledby="settings-dialog-heading"><form method="dialog">
            <h2 id="settings-dialog-heading">Settings</h2>
            <div className="settings-workspace"><nav className="settings-master" aria-label="Settings groups">
                { SETTINGS_GROUPS.map
                (
                    ( [ identifier, label ] ) => <button type="button" key={ identifier }
                    className={ settingsGroup === identifier ? "selected-item" : "secondary" }
                    aria-current={ settingsGroup === identifier ? "page" : undefined }
                    onClick={ () => setSettingsGroup ( identifier ) }>{ label }</button>
                ) }
            </nav><section className="settings-detail" aria-labelledby="settings-group-heading">
                <h3 id="settings-group-heading">{ SETTINGS_GROUPS.find
                (
                    ( [ identifier ] ) =>
                    identifier === settingsGroup
                )?.[ 1 ] }</h3>
                { settingsGroup === "general" ? <div className="settings-fields">
                    <label>Theme<select value={ properties.themeMode }
                        onChange={ event => properties.setThemeMode ( event.target.value as ThemeMode ) }>
                        { THEME_MODES.map
                        (
                            themeMode => <option key={ themeMode } value={ themeMode }>
                            { themeMode [ 0 ].toUpperCase () + themeMode.slice ( 1 ) }</option>
                        ) }
                    </select></label><p>Models remain in memory unless you explicitly save or export them.</p>
                </div> : <div className="planned-settings" role="status"><p>This settings group is still in development.</p>
                    <p>Its options will be added in a later phase.</p></div> }
            </section></div><div className="dialog-actions"><button>Close</button></div></form></dialog>
        <dialog ref={ properties.pageSetupDialog } aria-labelledby="page-setup-dialog-heading">
            <form method="dialog"><h2 id="page-setup-dialog-heading">Page setup</h2>
            <label>Paper size<select value={ pageSize }
                onChange={ event => setPageSize ( event.target.value as PageSize ) }>
                { PAGE_SIZES.map
                (
                    availablePageSize => <option key={ availablePageSize }>
                    { availablePageSize }</option>
                ) }</select></label>
            <label>Orientation<select value={ pageOrientation }
                onChange={ event => setPageOrientation ( event.target.value as PageOrientation ) }>
                { PAGE_ORIENTATIONS.map ( orientation => <option key={ orientation }>{ orientation }</option> ) }
            </select></label><button>Apply</button></form></dialog>
        <style>{ `@page { size: ${ pageSize } ${ pageOrientation }; margin: ${ PRINT_PAGE_MARGIN_MILLIMETERS }mm; }` }</style>
        <dialog ref={ properties.aboutDialog } className="about-dialog" aria-labelledby="about-dialog-heading">
            <form method="dialog"><h2 id="about-dialog-heading">{ APPLICATION_TITLE }</h2><div className="about-fields">
                <label>Version<input value={ properties.applicationVersion } readOnly /></label>
                <label>Author<input value={ APPLICATION_AUTHOR } readOnly /></label>
                <label>Description<textarea value={ APPLICATION_DESCRIPTION } readOnly /></label>
                <label>Release Status<input value={ APPLICATION_RELEASE_STATUS } readOnly /></label>
            </div><div className="dialog-actions"><button>Close</button></div></form></dialog>
    </>;
}
