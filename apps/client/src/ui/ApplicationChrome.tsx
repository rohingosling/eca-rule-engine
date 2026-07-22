//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Application menus and toolbar presentation, separated from document orchestration.
//
//---------------------------------------------------------------------------------------------------------------------

import {
    ArrowExport20Regular, ArrowImport20Regular, ArrowRedo24Regular, ArrowUndo20Regular, ArrowUndo24Regular,
    BookOpen20Regular, Checkmark20Regular, CheckmarkCircle20Regular, ClipboardPaste20Regular, Code20Regular,
    Copy20Regular, Cut20Regular,
    Delete20Regular, Desktop20Regular, Dismiss20Regular, DocumentAdd20Regular, DocumentAdd24Regular,
    DocumentPdf20Regular, DocumentSave20Regular, DocumentSettings20Regular, FolderOpen20Regular,
    FolderOpen24Regular, Info20Regular, Navigation20Regular, Print20Regular, Save20Regular, Save24Regular,
    Search20Regular, Settings20Regular, TextEditStyle20Regular, WeatherMoon20Regular, WeatherSunny20Regular
} from "@fluentui/react-icons";
import { type ReactNode, useEffect, useState } from "react";
import { PROJECT_PAPER_URL, PROJECT_REPOSITORY_URL, PROJECT_WIKI_URL } from "../config/application-metadata";
import { THEME_MODES, type ThemeMode } from "../config/theme-preference";

//---------------------------------------------------------------------------------------------------------------------
// Type: MenuName
//
// Description:
//
//   Defines the valid representation of menu name.
//
//---------------------------------------------------------------------------------------------------------------------
type MenuName = "file" | "edit" | "preferences" | "help";
//---------------------------------------------------------------------------------------------------------------------
// Type: TextCommand
//
// Description:
//
//   Defines the valid representation of text command.
//
//---------------------------------------------------------------------------------------------------------------------
type TextCommand = "cut" | "copy" | "paste" | "delete";

//---------------------------------------------------------------------------------------------------------------------
// Interface: ApplicationChromeProperties
//
// Description:
//
//   Defines the named fields and callable operations that make up application chrome properties.
//
//---------------------------------------------------------------------------------------------------------------------
interface ApplicationChromeProperties
{
    canRedo: boolean;
    canUndo: boolean;
    closeDocument: () => void;
    documentOpen: boolean;
    editText: ( command: TextCommand ) => void;
    exportCSV: () => void;
    exportYAML: () => void;
    find: () => void;
    gotoElement: () => void;
    importCSV: () => void;
    importYAML: () => void;
    newDocument: () => void;
    openAbout: () => void;
    openDocument: () => void;
    openPageSetup: () => void;
    openSettings: () => void;
    print: () => void;
    redo: () => void;
    replace: () => void;
    save: () => void;
    saveAs: () => void;
    setThemeMode: ( mode: ThemeMode ) => void;
    themeMode: ThemeMode;
    undo: () => void;
    validateDocument: () => void;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: MenuCommandContent
//
// Description:
//
//   Renders the menu command content component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (structured object):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

function MenuCommandContent (
    {
        icon, label, shortcut }:
        {
            icon?: ReactNode; label: string; shortcut?: string
        } )
{

    // Return the rendered interface element.

    return <><span className="menu-command"><span className="menu-icon" aria-hidden="true">{ icon }</span>
        <span>{ label }</span></span>{ shortcut && <kbd>{ shortcut }</kbd> }</>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: ApplicationChrome
//
// Description:
//
//   Renders the application chrome component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (ApplicationChromeProperties):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function ApplicationChrome ( properties: ApplicationChromeProperties )
{
    const [ openMenu, setOpenMenu ] = useState<MenuName>();

    useEffect
    (
        () =>
        {
            //-------------------------------------------------------------------------------------------------------------
            // Function: closeMenu
            //
            // Description:
            //
            //   Closes menu using the supplied inputs and current state.
            //
            // Arguments:
            //
            //   event (PointerEvent):
            //     The event used by this operation.
            //
            // Returns:
            //
            //   The close menu result.
            //
            //-------------------------------------------------------------------------------------------------------------

            const closeMenu = ( event: PointerEvent ) =>
            {
                if ( !( event.target as Element ).closest ( ".menu-bar" ) )
                {
                    setOpenMenu ( undefined );
                }
            };
            window.addEventListener ( "pointerdown", closeMenu );

            // Return the value produced by this code path.

            return () => window.removeEventListener ( "pointerdown", closeMenu );
        }, []
    );

    //-----------------------------------------------------------------------------------------------------------------
    // Function: toggleMenu
    //
    // Description:
    //
    //   Performs the toggle menu operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   event (React.MouseEvent):
    //     The event used by this operation.
    //
    //   menu (MenuName):
    //     The menu used by this operation.
    //
    // Returns:
    //
    //   The toggle menu result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const toggleMenu = ( event: React.MouseEvent, menu: MenuName ) =>
    {
        event.preventDefault ();
        setOpenMenu ( current => current === menu ? undefined : menu );
    };

    // Return the rendered interface element.

    return <>
        <nav className="menu-bar" aria-label="Application menu" onClick={ event =>
        {
        if ( ( event.target as Element ).closest ( ".menu" ) )
            {
            setOpenMenu ( undefined );
        }
    } }>
            <details open={ openMenu === "file" }><summary onClick={ event => toggleMenu ( event, "file" ) }>File</summary><div className="menu">
                <button onClick={ properties.newDocument }><MenuCommandContent icon={ <DocumentAdd20Regular /> } label="New" shortcut="Ctrl+N" /></button>
                <button onClick={ properties.openDocument }><MenuCommandContent icon={ <FolderOpen20Regular /> } label="Open…" shortcut="Ctrl+O" /></button>
                <button disabled={ !properties.documentOpen } onClick={ properties.save }><MenuCommandContent icon={ <Save20Regular /> } label="Save" shortcut="Ctrl+S" /></button>
                <button disabled={ !properties.documentOpen } onClick={ properties.saveAs }><MenuCommandContent icon={ <DocumentSave20Regular /> } label="Save As…" shortcut="Ctrl+Shift+S" /></button>
                <button disabled={ !properties.documentOpen } onClick={ properties.closeDocument }><MenuCommandContent icon={ <Dismiss20Regular /> } label="Close" /></button><hr />
                <span className="menu-heading">Import</span><button disabled={ !properties.documentOpen } onClick={ properties.importYAML }><MenuCommandContent icon={ <ArrowImport20Regular /> } label="YAML…" /></button><button disabled={ !properties.documentOpen } onClick={ properties.importCSV }><MenuCommandContent icon={ <ArrowImport20Regular /> } label="CSV…" /></button>
                <span className="menu-heading">Export</span><button disabled={ !properties.documentOpen } onClick={ properties.exportYAML }><MenuCommandContent icon={ <ArrowExport20Regular /> } label="YAML…" /></button><button disabled={ !properties.documentOpen } onClick={ properties.exportCSV }><MenuCommandContent icon={ <ArrowExport20Regular /> } label="CSV…" /></button><hr />
                <button disabled={ !properties.documentOpen } onClick={ properties.openPageSetup }><MenuCommandContent icon={ <DocumentSettings20Regular /> } label="Page Setup…" /></button><button disabled={ !properties.documentOpen } onClick={ properties.print }><MenuCommandContent icon={ <Print20Regular /> } label="Print…" shortcut="Ctrl+P" /></button><hr />
                <button disabled={ !properties.documentOpen } onClick={ properties.validateDocument }>
                    <MenuCommandContent icon={ <CheckmarkCircle20Regular /> } label="Validate model"
                        shortcut="Ctrl+Shift+V" /></button>
            </div></details>
            <details open={ openMenu === "edit" }><summary onClick={ event => toggleMenu ( event, "edit" ) }>Edit</summary><div className="menu">
                <button disabled={ !properties.documentOpen || !properties.canUndo } onClick={ properties.undo }><MenuCommandContent icon={ <ArrowUndo20Regular /> } label="Undo" shortcut="Ctrl+Z" /></button><hr />
                { ( [ "cut", "copy", "paste", "delete" ] as TextCommand[] ).map
                (
                    command => <button key={ command }
                    disabled={ !properties.documentOpen } onClick={ () => properties.editText ( command ) }>
                    <MenuCommandContent icon={ command === "cut" ? <Cut20Regular /> : command === "copy" ? <Copy20Regular />
                        : command === "paste" ? <ClipboardPaste20Regular /> : <Delete20Regular /> }
                    label={ command [ 0 ].toUpperCase () + command.slice ( 1 ) } /></button>
                ) }<hr />
                <button disabled={ !properties.documentOpen } onClick={ properties.find }><MenuCommandContent icon={ <Search20Regular /> } label="Find…" shortcut="Ctrl+F" /></button>
                <button disabled={ !properties.documentOpen } onClick={ properties.replace }><MenuCommandContent icon={ <TextEditStyle20Regular /> } label="Replace…" shortcut="Ctrl+H" /></button>
                <button disabled={ !properties.documentOpen } onClick={ properties.gotoElement }><MenuCommandContent icon={ <Navigation20Regular /> } label="Goto…" shortcut="Ctrl+G" /></button>
            </div></details>
            <details open={ openMenu === "preferences" }><summary onClick={ event => toggleMenu ( event, "preferences" ) }>Preferences</summary><div className="menu"><span className="menu-heading">Theme</span>
                { THEME_MODES.map
                (
                    mode => <button key={ mode }
                    aria-pressed={ properties.themeMode === mode }
                    onClick={ () => properties.setThemeMode ( mode ) }><MenuCommandContent
                    icon={ properties.themeMode === mode ? <Checkmark20Regular /> : mode === "dark"
                        ? <WeatherMoon20Regular /> : mode === "light" ? <WeatherSunny20Regular /> : <Desktop20Regular /> }
                    label={ mode [ 0 ].toUpperCase () + mode.slice ( 1 ) } /></button>
                ) }<hr />
                <button onClick={ properties.openSettings }><MenuCommandContent icon={ <Settings20Regular /> } label="Settings…" /></button></div></details>
            <details open={ openMenu === "help" }><summary onClick={ event => toggleMenu ( event, "help" ) }>Help</summary><div className="menu">
                <a href={ PROJECT_WIKI_URL } target="_blank" rel="noreferrer"><MenuCommandContent icon={ <BookOpen20Regular /> } label="Project Wiki" /></a>
                <a href={ PROJECT_PAPER_URL } target="_blank" rel="noreferrer"><MenuCommandContent icon={ <DocumentPdf20Regular /> } label="Paper (PDF)" /></a>
                <a href={ PROJECT_REPOSITORY_URL } target="_blank" rel="noreferrer"><MenuCommandContent icon={ <Code20Regular /> } label="GitHub" /></a><hr />
                <button onClick={ properties.openAbout }><MenuCommandContent icon={ <Info20Regular /> } label="About…" /></button></div></details>
        </nav>
        <nav className="button-bar" aria-label="Common commands">
            <button className="toolbar-button" aria-label="New model" title="New model (Ctrl+N)" onClick={ properties.newDocument }><DocumentAdd24Regular aria-hidden="true" /></button>
            <button className="toolbar-button" aria-label="Open JSON model" title="Open JSON model (Ctrl+O)" onClick={ properties.openDocument }><FolderOpen24Regular aria-hidden="true" /></button>
            <button className="toolbar-button" aria-label="Save model" title="Save model (Ctrl+S)" disabled={ !properties.documentOpen } onClick={ properties.save }><Save24Regular aria-hidden="true" /></button>
            <span className="toolbar-separator" /><button className="toolbar-button" aria-label="Undo" title="Undo (Ctrl+Z)" disabled={ !properties.documentOpen || !properties.canUndo } onClick={ properties.undo }><ArrowUndo24Regular aria-hidden="true" /></button>
            <button className="toolbar-button" aria-label="Redo" title="Redo (Ctrl+Y)" disabled={ !properties.documentOpen || !properties.canRedo } onClick={ properties.redo }><ArrowRedo24Regular aria-hidden="true" /></button>
        </nav>
    </>;
}
