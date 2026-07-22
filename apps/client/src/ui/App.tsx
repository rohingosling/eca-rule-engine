//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Application shell, document lifecycle, menus, and workspace routing.
//
//---------------------------------------------------------------------------------------------------------------------

import { FluentProvider, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import { type ChangeEvent, type CSSProperties, useEffect, useReducer, useRef, useState } from "react";
import packageMetadata from "../../package.json";
import {
    APPLICATION_TITLE, APPLICATION_TITLE_SEPARATOR, DOCUMENT_DIRTY_INDICATOR
} from "../config/application-metadata";
import { EDITOR_LAYOUT_STYLE_VARIABLES } from "../config/editor-layout";
import {
    CSV_FILE_ACCEPT, CSV_MEDIA_TYPE, DEFAULT_APPLICATION_STATUS_MESSAGE, JSON_FILE_ACCEPT, JSON_FILE_EXTENSION,
    JSON_MEDIA_TYPE, MAXIMUM_IMPORT_BYTES, MAXIMUM_IMPORT_MEBIBYTES, NO_DOCUMENT_FILE_NAME,
    UNTITLED_MODEL_FILE_NAME, YAML_FILE_ACCEPT, YAML_MEDIA_TYPE
} from "../config/file-policy";
import {
    SYSTEM_DARK_THEME_MEDIA_QUERY, THEME_PREFERENCE_STORAGE_KEY, themeModeFromStorage, type ThemeMode
} from "../config/theme-preference";
import type { StatelessECAModel } from "../contracts/model.generated";
import {
    importCollectionCSV, type ModelCollectionName, parseYAMLModel, serializeCollectionCSV, serializeYAMLModel
} from "../document/model-formats";
import {
    createDocumentState, createEmptyModel, documentReducer, isDocumentDirty, serializeModel
} from "../document/model-document";
import { describeModelValidationFailure, type ModelDiagnostic, validateModel } from "../engine/model-validation";
import { validateDocumentInWorker } from "../engine/document-validation-worker";
import { ApplicationChrome } from "./ApplicationChrome";
import { ApplicationDialogs } from "./ApplicationDialogs";
import type { DocumentDiagnosticSnapshot } from "./DiagnosticsPanel";
import { diagnosticNavigationTarget } from "./diagnostic-navigation";
import type { EditorNavigation } from "./StructuredEditor";
import { Workspace, type WorkspaceTab } from "./Workspace";

//---------------------------------------------------------------------------------------------------------------------
// Type: OpenFilePicker
//
// Description:
//
//   Defines the valid representation of open file picker.
//
//---------------------------------------------------------------------------------------------------------------------
type OpenFilePicker = ( options?: object ) => Promise<FileSystemFileHandle[]>;
//---------------------------------------------------------------------------------------------------------------------
// Type: SaveFilePicker
//
// Description:
//
//   Defines the valid representation of save file picker.
//
//---------------------------------------------------------------------------------------------------------------------
type SaveFilePicker = ( options?: object ) => Promise<FileSystemFileHandle>;
//---------------------------------------------------------------------------------------------------------------------
// Type: TextControl
//
// Description:
//
//   Defines the valid representation of text control.
//
//---------------------------------------------------------------------------------------------------------------------
type TextControl = HTMLInputElement | HTMLTextAreaElement;

const COLLECTION_NAMES: ModelCollectionName[] = [
    "parameters", "payloads", "events", "conditions", "actions", "rules"
];

//---------------------------------------------------------------------------------------------------------------------
// Function: download
//
// Description:
//
//   Performs the download operation using the supplied inputs and current state.
//
// Arguments:
//
//   content (string):
//     The content used by this operation.
//
//   fileName (string):
//     The file name used by this operation.
//
//   mediaType (string):
//     The media type used by this operation.
//
//---------------------------------------------------------------------------------------------------------------------

function download ( content: string, fileName: string, mediaType: string ): void
{
    const objectURL = URL.createObjectURL
    (
        new Blob
        (
            [ content ],
            {
                type: mediaType
            }
        )
    );
    const anchor = document.createElement ( "a" );
    anchor.href = objectURL;
    anchor.download = fileName;
    anchor.click ();
    URL.revokeObjectURL ( objectURL );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: chooseCollection
//
// Description:
//
//   Performs the choose collection operation using the supplied inputs and current state.
//
// Arguments:
//
//   action (string):
//     The action used by this operation.
//
// Returns:
//
//   The choose collection result.
//
//---------------------------------------------------------------------------------------------------------------------

function chooseCollection ( action: string ): ModelCollectionName | undefined
{
    const answer = window.prompt (
        `${ action} which collection? Enter ${ COLLECTION_NAMES.join ( ", " ) }.` )?.toLowerCase ();

    // Return the result produced by the delegated operation.

    return COLLECTION_NAMES.find ( collection => collection === answer );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: isTextControl
//
// Description:
//
//   Determines whether is text control holds for the supplied value or application state.
//
// Arguments:
//
//   element (Element | null):
//     The element used by this operation.
//
// Returns:
//
//   True when the requested condition holds; otherwise false.
//
//---------------------------------------------------------------------------------------------------------------------

function isTextControl ( element: Element | null ): element is TextControl
{
    if ( element instanceof HTMLTextAreaElement )
    {

        // Return the value produced by this code path.

        return !element.disabled && !element.readOnly;
    }
    if ( !( element instanceof HTMLInputElement ) || element.disabled || element.readOnly )
    {

        // Return false for this code path.

        return false;
    }

    // Return the assembled array value.

    return [ "email", "password", "search", "tel", "text", "url" ].includes ( element.type );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: readBoundedFile
//
// Description:
//
//   Reads the supplied representation and returns its normalized in-memory form.
//
// Arguments:
//
//   file (File):
//     The file used by this operation.
//
// Returns:
//
//   The read bounded file result.
//
//---------------------------------------------------------------------------------------------------------------------

async function readBoundedFile ( file: File ): Promise<string>
{
    if ( file.size > MAXIMUM_IMPORT_BYTES )
    {
        throw new Error ( `The import exceeds the ${ MAXIMUM_IMPORT_MEBIBYTES } MiB file-size limit.` );
    }

    // Return the result produced by the delegated operation.

    return file.text ();
}

//---------------------------------------------------------------------------------------------------------------------
// Function: App
//
// Description:
//
//   Renders the app component from its supplied state and callbacks, producing the corresponding user-interface
//   element.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function App ()
{
    const [ themeMode, setThemeMode ] = useState<ThemeMode>
    (
        () =>
        themeModeFromStorage ( localStorage.getItem ( THEME_PREFERENCE_STORAGE_KEY ) )
    );
    const [ systemIsDark, setSystemIsDark ] = useState
    (
        () =>
        window.matchMedia ( SYSTEM_DARK_THEME_MEDIA_QUERY ).matches
    );
    const [ documentState, dispatch ] = useReducer ( documentReducer, undefined, () => createDocumentState () );
    const [ documentOpen, setDocumentOpen ] = useState ( false );
    const [ documentSession, setDocumentSession ] = useState ( 0 );
    const [ fileName, setFileName ] = useState ( NO_DOCUMENT_FILE_NAME );
    const [ fileHandle, setFileHandle ] = useState<FileSystemFileHandle>();
    const [ message, setMessage ] = useState ( DEFAULT_APPLICATION_STATUS_MESSAGE );
    const [ workspaceTab, setWorkspaceTab ] = useState<WorkspaceTab> ( "model" );
    const [ editorNavigation, setEditorNavigation ] = useState<EditorNavigation>();
    const [ diagnosticSnapshot, setDiagnosticSnapshot ] = useState<DocumentDiagnosticSnapshot>
    (
        {
            diagnostics: [], revision: 0
        }
    );
    const jsonInput = useRef<HTMLInputElement> ( null );
    const yamlInput = useRef<HTMLInputElement> ( null );
    const csvInput = useRef<HTMLInputElement> ( null );
    const settingsDialog = useRef<HTMLDialogElement> ( null );
    const pageSetupDialog = useRef<HTMLDialogElement> ( null );
    const aboutDialog = useRef<HTMLDialogElement> ( null );
    const validationDialog = useRef<HTMLDialogElement> ( null );
    const csvCollection = useRef<ModelCollectionName | undefined> ( undefined );
    const documentStateReference = useRef ( documentState );
    const lastTextControlReference = useRef<TextControl | undefined> ( undefined );
    documentStateReference.current = documentState;

    //-----------------------------------------------------------------------------------------------------------------
    // Function: updateModel
    //
    // Description:
    //
    //   Updates model using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   model (StatelessECAModel):
    //     The compiled or contract model inspected by this operation.
    //
    // Returns:
    //
    //   The update model result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const updateModel = ( model: StatelessECAModel ) => dispatch
    (
        {
            type: "edit", model
        }
    );
    //-----------------------------------------------------------------------------------------------------------------
    // Function: confirmDiscard
    //
    // Description:
    //
    //   Performs the confirm discard operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The confirm discard result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const confirmDiscard = () => !documentOpen || !isDocumentDirty ( documentStateReference.current )
        || window.confirm ( "Discard unsaved changes?" );

    //-----------------------------------------------------------------------------------------------------------------
    // Function: commitActiveField
    //
    // Description:
    //
    //   Performs the commit active field operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The commit active field result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const commitActiveField = async () =>
    {
        if ( document.activeElement instanceof HTMLElement )
        {
            document.activeElement.blur ();
        }
        await new Promise<void> ( resolve => window.requestAnimationFrame ( () => resolve () ) );
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: replaceDocument
    //
    // Description:
    //
    //   Replaces document using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   model (StatelessECAModel):
    //     The compiled or contract model inspected by this operation.
    //
    //   name (string):
    //     The name used by this operation.
    //
    //   handle (FileSystemFileHandle):
    //     The handle used by this operation.
    //
    //   diagnostics (inferred):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The replace document result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const replaceDocument = ( model: StatelessECAModel, name: string, handle?: FileSystemFileHandle,
        diagnostics = validateModel ( model ).diagnostics ) =>
    {
        dispatch
        (
            {
                type: "replace", model
            }
        );
        setDocumentOpen ( true );
        setDocumentSession ( current => current + 1 );
        setFileName ( name );
        setFileHandle ( handle );
        setMessage ( `Opened ${ name }` );
        setDiagnosticSnapshot
        (
            {
                diagnostics, revision: documentStateReference.current.revision + 1
            }
        );
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: createNewDocument
    //
    // Description:
    //
    //   Constructs new document from the supplied inputs without mutating the caller's source values.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const createNewDocument = async () =>
    {
        await commitActiveField ();
        if ( confirmDiscard () )
        {
            replaceDocument ( createEmptyModel (), UNTITLED_MODEL_FILE_NAME );
        }
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: closeDocument
    //
    // Description:
    //
    //   Closes document using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The close document result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const closeDocument = async () =>
    {
        await commitActiveField ();
        if ( !confirmDiscard () )
        {

            // Return without a value after completing this code path.

            return;
        }
        setDocumentOpen ( false );
        setDocumentSession ( current => current + 1 );
        setFileHandle ( undefined );
        setFileName ( NO_DOCUMENT_FILE_NAME );
        setMessage ( "Document closed." );
        setWorkspaceTab ( "model" );
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: readModelFile
    //
    // Description:
    //
    //   Reads the supplied representation and returns its normalized in-memory form.
    //
    // Arguments:
    //
    //   file (File):
    //     The file used by this operation.
    //
    //   format ("json" | "yaml"):
    //     The format used by this operation.
    //
    //   handle (FileSystemFileHandle):
    //     The handle used by this operation.
    //
    // Returns:
    //
    //   The read model file result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const readModelFile = async ( file: File, format: "json" | "yaml", handle?: FileSystemFileHandle ) =>
    {
        try
        {
            const content = await readBoundedFile ( file );
            const value  = format === "json" ? JSON.parse ( content ) : parseYAMLModel ( content );
            const result = validateModel ( value );
            const importedModel = result.model ?? result.recoverableModel;
            if ( !importedModel )
            {
                throw new Error ( describeModelValidationFailure ( result ) );
            }
            await commitActiveField ();
            if ( confirmDiscard () )
            {
                replaceDocument ( importedModel, file.name, handle, result.diagnostics );
                if ( result.diagnostics.length > 0 )
                {
                    setMessage
                    (
                        `Opened ${ file.name } with ${ result.diagnostics.length } model diagnostic${
                        result.diagnostics.length === 1 ? "" : "s" }.`
                    );
                }
            }
        }
        catch ( error )
        {
            setMessage ( `Open failed: ${ error instanceof Error ? error.message : "The file could not be read." }` );
        }
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: openJSON
    //
    // Description:
    //
    //   Opens JSON using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The open JSON result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const openJSON = async () =>
    {
        const picker = ( window as Window &
        {
            showOpenFilePicker?: OpenFilePicker
        } ).showOpenFilePicker;
        if ( picker )
        {
            try
            {
                const [ handle ] = await picker
                (
                    {
                        types: [
                        {
                            description: "JSON ECA model",
                            accept:
                                    {
                                        [ JSON_MEDIA_TYPE ]: [ JSON_FILE_EXTENSION ]
                                    }
                        } ]
                    }
                );
                if ( handle )
                {
                    await readModelFile ( await handle.getFile (), "json", handle );
                }
            }
            catch ( error )
            {
                if ( ( error as DOMException ).name !== "AbortError" )
                {
                    setMessage ( "The file picker could not be opened." );
                }
            }
        }
        else
        {
            jsonInput.current?.click ();
        }
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: saveAs
    //
    // Description:
    //
    //   Performs the save as operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The save as result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const saveAs = async () =>
    {
        if ( !documentOpen )
        {

            // Return without a value after completing this code path.

            return;
        }
        await commitActiveField ();
        const model = documentStateReference.current.present;
        const validationResult = validateModel ( model );
        if ( !validationResult.model )
        {
            setMessage ( `Save failed: ${ describeModelValidationFailure ( validationResult ) }` );

            // Return without a value after completing this code path.

            return;
        }
        const picker = ( window as Window &
        {
            showSaveFilePicker?: SaveFilePicker
        } ).showSaveFilePicker;
        if ( picker )
        {
            try
            {
                const handle = await picker
                (
                    {
                        suggestedName: `${ model.id || "eca-model" }.json`,
                        types: [
                            {
                                description: "JSON ECA model",
                                accept:
                                    {
                                        [ JSON_MEDIA_TYPE ]: [ JSON_FILE_EXTENSION ]
                                    }
                            } ]
                    }
                );
                const writable = await handle.createWritable ();
                await writable.write ( serializeModel ( model ) );
                await writable.close ();
                setFileHandle ( handle );
                setFileName ( handle.name );
                dispatch
                (
                    {
                        type: "markSaved", model
                    }
                );
                setMessage ( `Saved ${ handle.name }` );
            }
            catch ( error )
            {
                if ( ( error as DOMException ).name !== "AbortError" )
                {
                    setMessage ( "Save failed." );
                }
            }
        }
        else
        {
            const name = `${ model.id || "eca-model" }.json`;
            download ( serializeModel ( model ), name, JSON_MEDIA_TYPE );
            setFileName ( name );
            dispatch
            (
                {
                    type: "markSaved", model
                }
            );
            setMessage ( `Downloaded ${ name }` );
        }
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: save
    //
    // Description:
    //
    //   Performs the save operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The save result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const save = async () =>
    {
        if ( !documentOpen )
        {

            // Return without a value after completing this code path.

            return;
        }
        await commitActiveField ();
        if ( !fileHandle )
        {

            // Return the result produced by the delegated operation.

            return saveAs ();
        }
        const model = documentStateReference.current.present;
        const validationResult = validateModel ( model );
        if ( !validationResult.model )
        {
            setMessage ( `Save failed: ${ describeModelValidationFailure ( validationResult ) }` );

            // Return without a value after completing this code path.

            return;
        }
        try
        {
            const writable = await fileHandle.createWritable ();
            await writable.write ( serializeModel ( model ) );
            await writable.close ();
            dispatch
            (
                {
                    type: "markSaved", model
                }
            );
            setMessage ( `Saved ${ fileHandle.name }` );
        }
        catch
        {
            setMessage ( "Save failed. Use Save As to choose another file." );
        }
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: gotoElement
    //
    // Description:
    //
    //   Performs the goto element operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   query (string):
    //     The query used by this operation.
    //
    // Returns:
    //
    //   The goto element result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const gotoElement = ( query?: string ) =>
    {
        const search = query ?? window.prompt ( "Enter a model element identifier, name, or collection name." );
        if ( !search )
        {

            // Return without a value after completing this code path.

            return;
        }
        if ( search === "model" || search === documentState.present.id )
        {
            setWorkspaceTab ( "model" );
            setEditorNavigation
            (
                {
                    section: "model", sequence: performance.now ()
                }
            );

            // Return without a value after completing this code path.

            return;
        }
        const collection = COLLECTION_NAMES.find ( name => name === search );
        if ( collection )
        {
            setWorkspaceTab ( "model" );
            setEditorNavigation
            (
                {
                    section: collection, sequence: performance.now ()
                }
            );

            // Return without a value after completing this code path.

            return;
        }
        for ( const name of COLLECTION_NAMES )
        {
            const item = documentState.present [ name ].find ( value => value.id === search || value.name === search );
            if ( item )
            {
                setWorkspaceTab ( "model" );
                setEditorNavigation
                (
                    {
                        section: name, identifier: item.id, sequence: performance.now ()
                    }
                );

                // Return without a value after completing this code path.

                return;
            }
        }
        setMessage ( `No model element matches “${ search }”.` );
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: editText
    //
    // Description:
    //
    //   Performs the edit text operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   command ("cut" | "copy" | "paste" | "delete"):
    //     The command used by this operation.
    //
    // Returns:
    //
    //   The edit text result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const editText = async ( command: "cut" | "copy" | "paste" | "delete" ) =>
    {
        if ( !documentOpen )
        {

            // Return without a value after completing this code path.

            return;
        }
        const activeElement = document.activeElement;
        const rememberedTextControl = lastTextControlReference.current;
        const textControl = isTextControl ( activeElement ) ? activeElement
            : rememberedTextControl?.isConnected && isTextControl ( rememberedTextControl )
                ? rememberedTextControl : undefined;
        if ( textControl )
        {
            try
            {
                const selectionStart = textControl.selectionStart ?? 0;
                const selectionEnd   = textControl.selectionEnd ?? selectionStart;
                const selectedText   = textControl.value.slice ( selectionStart, selectionEnd );
                let replacement      = "";
                let inputType        = "";

                if ( command === "copy" || command === "cut" )
                {
                    await navigator.clipboard.writeText ( selectedText );
                }
                if ( command === "copy" )
                {
                    textControl.focus ();

                    // Return without a value after completing this code path.

                    return;
                }
                if ( command === "paste" )
                {
                    replacement = await navigator.clipboard.readText ();
                    inputType = "insertFromPaste";
                }
                else if ( command === "cut" )
                {
                    inputType = "deleteByCut";
                }
                else
                {
                    inputType = "deleteContentForward";
                }

                const replacementEnd = command === "delete" && selectionStart === selectionEnd
                    ? Math.min ( selectionEnd + 1, textControl.value.length ) : selectionEnd;
                textControl.setRangeText ( replacement, selectionStart, replacementEnd, "end" );
                textControl.dispatchEvent
                (
                    new InputEvent
                    (
                        "input",
                        {
                            bubbles: true, data: replacement || null, inputType
                        }
                    )
                );
                textControl.focus ();
            }
            catch
            {
                setMessage ( `${ command [ 0 ].toUpperCase () + command.slice ( 1 ) } failed. Check clipboard permissions.` );
            }
        }
        else if ( command === "copy" )
        {
            try
            {
                await navigator.clipboard.writeText ( serializeModel ( documentState.present ) );
            }
            catch
            {
                setMessage ( "Copy failed. Check clipboard permissions." );
            }
        }
        else
        {
            setMessage ( `${ command [ 0 ].toUpperCase () + command.slice ( 1 ) } applies to an active text field.` );
        }
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: find
    //
    // Description:
    //
    //   Finds the supplied values using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The find result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const find = () =>
    {
        if ( !documentOpen )
        {

            // Return without a value after completing this code path.

            return;
        }
        const query = window.prompt ( "Find model text:" );
        if ( !query )
        {

            // Return without a value after completing this code path.

            return;
        }
        const serialized = serializeModel ( documentState.present ).toLowerCase ();
        if ( !serialized.includes ( query.toLowerCase () ) )
        {
            setMessage ( `“${ query }” was not found.` );
        }
        else
        {
            for ( const collection of COLLECTION_NAMES )
            {
                const item = documentState.present [ collection ].find
                (
                    value =>
                    JSON.stringify ( value ).toLowerCase ().includes ( query.toLowerCase () )
                );
                if ( item )
                {
                    gotoElement ( item.id );

                    // Return without a value after completing this code path.

                    return;
                }
            }
            gotoElement ( documentState.present.id );
        }
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: replace
    //
    // Description:
    //
    //   Replaces the supplied values using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The replace result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const replace = async () =>
    {
        if ( !documentOpen )
        {

            // Return without a value after completing this code path.

            return;
        }
        await commitActiveField ();
        const search = window.prompt ( "Find text to replace:" );
        if ( !search )
        {

            // Return without a value after completing this code path.

            return;
        }
        const replacement = window.prompt ( `Replace “${ search }” with:` );
        if ( replacement === null )
        {

            // Return without a value after completing this code path.

            return;
        }
        const source = serializeModel ( documentStateReference.current.present );
        const updated = source.replaceAll ( search, replacement );
        if ( updated === source )
        {
            setMessage ( `“${ search }” was not found.` );
        }
        else if ( window.confirm ( "Replace all occurrences in the model? References may also change." ) )
        {
            try
            {
                const result = validateModel ( JSON.parse ( updated ) );
                if ( !result.model )
                {
                    throw new Error ( describeModelValidationFailure ( result ) );
                }
                updateModel ( result.model );
                setMessage ( "Replacement completed." );
            }
            catch ( error )
            {
                setMessage ( `Replace failed: ${ error instanceof Error ? error.message : "Invalid model JSON." }` );
            }
        }
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: importCSV
    //
    // Description:
    //
    //   Performs the import CSV operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   selectedCollection (ModelCollectionName):
    //     The selected collection collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The import CSV result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const importCSV = ( selectedCollection?: ModelCollectionName ) =>
    {
        if ( !documentOpen )
        {

            // Return without a value after completing this code path.

            return;
        }
        const collection = selectedCollection ?? chooseCollection ( "Import" );
        if ( collection )
        {
            csvCollection.current = collection;
            csvInput.current?.click ();
        }
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: exportCSV
    //
    // Description:
    //
    //   Performs the export CSV operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   selectedCollection (ModelCollectionName):
    //     The selected collection collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The export CSV result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const exportCSV = async ( selectedCollection?: ModelCollectionName ) =>
    {
        if ( !documentOpen )
        {

            // Return without a value after completing this code path.

            return;
        }
        await commitActiveField ();
        const collection = selectedCollection ?? chooseCollection ( "Export" );
        const model = documentStateReference.current.present;
        if ( collection )
        {
            download
            (
                serializeCollectionCSV ( model, collection ),
                `${ model.id }-${ collection }.csv`, CSV_MEDIA_TYPE
            );
        }
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: exportYAML
    //
    // Description:
    //
    //   Performs the export YAML operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The export YAML result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const exportYAML = async () =>
    {
        if ( !documentOpen )
        {

            // Return without a value after completing this code path.

            return;
        }
        await commitActiveField ();
        const model = documentStateReference.current.present;
        download ( serializeYAMLModel ( model ), `${ model.id }.yaml`, YAML_MEDIA_TYPE );
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: validateDocument
    //
    // Description:
    //
    //   Validates document and reports deterministic diagnostics for every detected contract violation.
    //
    // Returns:
    //
    //   The deterministic diagnostics produced by validation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const validateDocument = async () =>
    {
        if ( !documentOpen )
        {
            // Return without a value after completing this code path.

            return;
        }
        await commitActiveField ();
        const revision = documentStateReference.current.revision;
        try
        {
            const result = await validateDocumentInWorker ( documentStateReference.current.present, revision );
            setDiagnosticSnapshot
            (
                {
                    diagnostics: result.diagnostics, revision: result.documentRevision
                }
            );
            setMessage
            (
                result.diagnostics.length === 0 ? "Model validation passed."
                : `Model validation found ${ result.diagnostics.length } diagnostic${
                    result.diagnostics.length === 1 ? "" : "s" }.`
            );
            validationDialog.current?.showModal ();
        }
        catch
        {
            setMessage ( "Model validation failed because the local worker could not start. Try again." );
        }
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: navigateDiagnostic
    //
    // Description:
    //
    //   Navigates to diagnostic using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   diagnostic (ModelDiagnostic):
    //     The diagnostic used by this operation.
    //
    // Returns:
    //
    //   The navigate diagnostic result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const navigateDiagnostic = ( diagnostic: ModelDiagnostic ) =>
    {
        const target = diagnosticNavigationTarget (
            documentStateReference.current.present, diagnostic.pointer, performance.now () );
        validationDialog.current?.close ();
        setWorkspaceTab ( "model" );
        setEditorNavigation
        (
            {
                ...target.navigation, field: target.field
            }
        );
    };

    useEffect
    (
        () =>
        {
            localStorage.setItem ( THEME_PREFERENCE_STORAGE_KEY, themeMode );
            document.documentElement.dataset.theme = themeMode;
        }, [ themeMode ]
    );

    useEffect
    (
        () =>
        {
            const mediaQuery = window.matchMedia ( SYSTEM_DARK_THEME_MEDIA_QUERY );
            //-------------------------------------------------------------------------------------------------------------
            // Function: updateSystemTheme
            //
            // Description:
            //
            //   Updates system theme using the supplied inputs and current state.
            //
            // Arguments:
            //
            //   event (MediaQueryListEvent):
            //     The event used by this operation.
            //
            // Returns:
            //
            //   The update system theme result.
            //
            //-------------------------------------------------------------------------------------------------------------

            const updateSystemTheme = ( event: MediaQueryListEvent ) => setSystemIsDark ( event.matches );
            mediaQuery.addEventListener ( "change", updateSystemTheme );

            // Return the value produced by this code path.

            return () => mediaQuery.removeEventListener ( "change", updateSystemTheme );
        }, []
    );

    useEffect
    (
        () =>
        {
            //-------------------------------------------------------------------------------------------------------------
            // Function: rememberTextControl
            //
            // Description:
            //
            //   Performs the remember text control operation using the supplied inputs and current state.
            //
            // Arguments:
            //
            //   event (FocusEvent):
            //     The event used by this operation.
            //
            // Returns:
            //
            //   The remember text control result.
            //
            //-------------------------------------------------------------------------------------------------------------

            const rememberTextControl = ( event: FocusEvent ) =>
            {
                const target = event.target instanceof Element ? event.target : null;
                if ( isTextControl ( target ) )
                {
                    lastTextControlReference.current = target;
                }
                else if ( !target?.closest ( ".menu-bar" ) )
                {
                    lastTextControlReference.current = undefined;
                }
            };
            document.addEventListener ( "focusin", rememberTextControl );

            // Return the value produced by this code path.

            return () => document.removeEventListener ( "focusin", rememberTextControl );
        }, []
    );

    useEffect
    (
        () =>
        {
            //-------------------------------------------------------------------------------------------------------------
            // Function: protectDirtyDocument
            //
            // Description:
            //
            //   Performs the protect dirty document operation using the supplied inputs and current state.
            //
            // Arguments:
            //
            //   event (BeforeUnloadEvent):
            //     The event used by this operation.
            //
            // Returns:
            //
            //   The protect dirty document result.
            //
            //-------------------------------------------------------------------------------------------------------------

            const protectDirtyDocument = ( event: BeforeUnloadEvent ) =>
            {
                const hasPendingFieldDraft = document.querySelector ( "[data-document-draft-dirty='true']" ) !== null;
                if ( documentOpen && ( isDocumentDirty ( documentStateReference.current ) || hasPendingFieldDraft ) )
                {
                    event.preventDefault ();
                    event.returnValue = "";
                }
            };
            window.addEventListener ( "beforeunload", protectDirtyDocument );

            // Return the value produced by this code path.

            return () => window.removeEventListener ( "beforeunload", protectDirtyDocument );
        }, [ documentOpen ]
    );

    useEffect
    (
        () =>
        {
            //-------------------------------------------------------------------------------------------------------------
            // Function: handleKeyDown
            //
            // Description:
            //
            //   Handles key down and coordinates the associated state transition or user-interface response.
            //
            // Arguments:
            //
            //   event (KeyboardEvent):
            //     The event used by this operation.
            //
            // Returns:
            //
            //   The handle key down result.
            //
            //-------------------------------------------------------------------------------------------------------------

            const handleKeyDown = ( event: KeyboardEvent ) =>
            {
                if ( !event.ctrlKey && !event.metaKey )
                {

                    // Return without a value after completing this code path.

                    return;
                }

                const key = event.key.toLowerCase ();
                if ( key === "n" )
                {
                    event.preventDefault ();
                    void createNewDocument ();
                }
                if ( key === "o" )
                {
                    event.preventDefault ();
                    void openJSON ();
                }
                if ( !documentOpen )
                {

                    // Return without a value after completing this code path.

                    return;
                }
                if ( key === "s" )
                {
                    event.preventDefault ();
                    void ( event.shiftKey ? saveAs () : save () );
                }
                if ( key === "z" )
                {
                    event.preventDefault ();
                    dispatch
                    (
                        {
                            type: event.shiftKey ? "redo" : "undo"
                        }
                    );
                }
                if ( key === "y" )
                {
                    event.preventDefault ();
                    dispatch
                    (
                        {
                            type: "redo"
                        }
                    );
                }
                if ( key === "f" )
                {
                    event.preventDefault ();
                    find ();
                }
                if ( key === "h" )
                {
                    event.preventDefault ();
                    void replace ();
                }
                if ( key === "g" )
                {
                    event.preventDefault ();
                    gotoElement ();
                }
                if ( key === "v" && event.shiftKey )
                {
                    event.preventDefault ();
                    void validateDocument ();
                }
            };
            window.addEventListener ( "keydown", handleKeyDown );

            // Return the value produced by this code path.

            return () => window.removeEventListener ( "keydown", handleKeyDown );
        }
    );

    const darkTheme = themeMode === "dark" || ( themeMode === "system" && systemIsDark );
    const applicationCaption = `${ APPLICATION_TITLE }${ APPLICATION_TITLE_SEPARATOR }${ fileName }`
        + ( documentOpen && isDocumentDirty ( documentState ) ? DOCUMENT_DIRTY_INDICATOR : "" );
    useEffect
    (
        () =>
        {
            document.documentElement.dataset.colorScheme = darkTheme ? "dark" : "light";
        }, [ darkTheme ]
    );

    useEffect
    (
        () =>
        {
            document.title = applicationCaption;
        }, [ applicationCaption ]
    );

    //-----------------------------------------------------------------------------------------------------------------
    // Function: importInput
    //
    // Description:
    //
    //   Performs the import input operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   event (ChangeEvent<HTMLInputElement>):
    //     The event used by this operation.
    //
    //   format ("json" | "yaml"):
    //     The format used by this operation.
    //
    // Returns:
    //
    //   The import input result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const importInput = async ( event: ChangeEvent<HTMLInputElement>, format: "json" | "yaml" ) =>
    {
        const file = event.target.files?.[ 0 ];
        event.target.value = "";
        if ( file )
        {
            await readModelFile ( file, format );
        }
    };

    // Return the rendered interface element.

    return <FluentProvider theme={ darkTheme ? webDarkTheme : webLightTheme }>
        <div className="application-shell" style={ EDITOR_LAYOUT_STYLE_VARIABLES as CSSProperties }>
            <header className="title-bar"><h1>{ applicationCaption }</h1></header>
            <ApplicationChrome documentOpen={ documentOpen }
                canUndo={ documentState.past.length > 0 } canRedo={ documentState.future.length > 0 }
                newDocument={ () => void createNewDocument () } openDocument={ () => void openJSON () }
                save={ () => void save () } saveAs={ () => void saveAs () }
                closeDocument={ () => void closeDocument () } importYAML={ () => yamlInput.current?.click () }
                importCSV={ importCSV } exportYAML={ () => void exportYAML () } exportCSV={ () => void exportCSV () }
                openPageSetup={ () => pageSetupDialog.current?.showModal () } print={ () => window.print () }
                undo={ () => dispatch
                (
                    (
                        {
                            type: "undo"
                        }
                    )
                ) } redo={ () => dispatch
                (
                    (
                        {
                            type: "redo"
                        }
                    )
                ) }
                editText={ command => void editText ( command ) } find={ find } replace={ replace }
                gotoElement={ () => gotoElement () } themeMode={ themeMode } setThemeMode={ setThemeMode }
                validateDocument={ () => void validateDocument () }
                openSettings={ () => settingsDialog.current?.showModal () }
                openAbout={ () => aboutDialog.current?.showModal () } />
            <input ref={ jsonInput } hidden type="file" accept={ JSON_FILE_ACCEPT }
                onChange={ event => void importInput ( event, "json" ) } />
            <input ref={ yamlInput } hidden type="file" accept={ YAML_FILE_ACCEPT }
                onChange={ event => void importInput ( event, "yaml" ) } />
            <input ref={ csvInput } hidden type="file" accept={ CSV_FILE_ACCEPT } onChange={ async event =>
            {
        const file = event.target.files?.[ 0 ]; event.target.value = "";
                if ( file && csvCollection.current )
                {
            try
                    {
                const importedModel = importCollectionCSV (
                            documentStateReference.current.present, csvCollection.current, await readBoundedFile ( file ) );
                        const result = validateModel ( importedModel );
                        if ( !result.model )
                        {
                    throw new Error ( describeModelValidationFailure ( result ) );
                }
                        updateModel ( result.model );
                        setMessage ( `Imported ${ file.name }` );
            }
                    catch ( error )
                    {
                setMessage
                (
                    `CSV import failed: ${ error instanceof Error
                    ? error.message : "Invalid CSV." }`
                );
            }
        }
    } } />
            <Workspace activeTab={ workspaceTab } setActiveTab={ setWorkspaceTab } documentOpen={ documentOpen }
                documentRevision={ documentState.revision } documentSession={ documentSession }
                model={ documentState.present }
                editorNavigation={ editorNavigation } updateModel={ updateModel }
                importCollection={ collection => importCSV ( collection ) }
                exportCollection={ collection => void exportCSV ( collection ) } openNewModel={ () =>
                {
        replaceDocument ( createEmptyModel (), UNTITLED_MODEL_FILE_NAME );
                    setWorkspaceTab ( "model" );
    } } />
            <footer className="status-bar"><span>Parameters: {
                documentOpen ? documentState.present.parameters.length : 0 }</span>
                <span>Payloads: { documentOpen ? documentState.present.payloads.length : 0 }</span>
                <span>Events: { documentOpen ? documentState.present.events.length : 0 }</span>
                <span>Conditions: { documentOpen ? documentState.present.conditions.length : 0 }</span>
                <span>Actions: { documentOpen ? documentState.present.actions.length : 0 }</span>
                <span>Rules: { documentOpen ? documentState.present.rules.length : 0 }</span>
                <span className="status-message" role="status">{ message }</span></footer>
            <ApplicationDialogs settingsDialog={ settingsDialog } pageSetupDialog={ pageSetupDialog }
                aboutDialog={ aboutDialog } applicationVersion={ packageMetadata.version }
                validationDialog={ validationDialog } diagnosticSnapshot={ diagnosticSnapshot }
                documentRevision={ documentState.revision } navigateDiagnostic={ navigateDiagnostic }
                themeMode={ themeMode } setThemeMode={ setThemeMode } />
        </div>
    </FluentProvider>;
}
