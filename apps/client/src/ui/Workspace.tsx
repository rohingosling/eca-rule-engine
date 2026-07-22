//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Accessible workspace views with persistent navigation and contextual academic guidance.
//
//---------------------------------------------------------------------------------------------------------------------

import { lazy, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
    DEFAULT_SIDE_PANEL_VIEWPORT_RATIO, MAXIMUM_SIDE_PANEL_VIEWPORT_RATIO, MINIMUM_MODEL_TREE_WIDTH_PIXELS,
    MINIMUM_USER_GUIDE_WIDTH_PIXELS, MODEL_TREE_WIDTH_STORAGE_KEY, SPLITTER_KEYBOARD_STEP_PIXELS,
    USER_GUIDE_WIDTH_STORAGE_KEY
} from "../config/editor-layout";
import type { StatelessECAModel } from "../contracts/model.generated";
import {
    referencedDefinitionIdentifiers, removeDefinition
} from "../document/model-commands";
import { copyModelItem, insertNewModelItem, type ModelCollectionItem } from "../document/tree-commands";
import {
    type EditorCollectionSection, type EditorNavigation, type EditorSelection, ModelTree, type ModelTreeCommands,
    StructuredEditor
} from "./StructuredEditor";
import { UserGuide, type UserGuideTopic } from "./user-guide";
import type { SimulatorExperiment } from "./Simulator";

const JsonCodeView = lazy
(
    async () => (
    {
        default: ( await import ( "./JsonCodeView" ) ).JsonCodeView
    } )
);
const Simulator    = lazy
(
    async () => (
    {
        default: ( await import ( "./Simulator" ) ).Simulator
    } )
);
const ModelGraph  = lazy
(
    async () => (
    {
        default: ( await import ( "./ModelGraph" ) ).ModelGraph
    } )
);

//---------------------------------------------------------------------------------------------------------------------
// Type: WorkspaceTab
//
// Description:
//
//   Defines the valid representation of workspace tab.
//
//---------------------------------------------------------------------------------------------------------------------
export type WorkspaceTab = "model" | "graph" | "simulator" | "code";

//---------------------------------------------------------------------------------------------------------------------
// Interface: WorkspaceProperties
//
// Description:
//
//   Defines the named fields and callable operations that make up workspace properties.
//
//---------------------------------------------------------------------------------------------------------------------
interface WorkspaceProperties
{
    activeTab: WorkspaceTab;
    documentOpen: boolean;
    documentRevision: number;
    documentSession?: number;
    editorNavigation?: EditorNavigation;
    exportCollection?: ( section: EditorCollectionSection ) => void;
    importCollection?: ( section: EditorCollectionSection ) => void;
    model: StatelessECAModel;
    openNewModel: () => void;
    setActiveTab: ( tab: WorkspaceTab ) => void;
    updateModel: ( model: StatelessECAModel ) => void;
}

const WORKSPACE_TABS: Array<
    {
        identifier: WorkspaceTab; label: string
    }> = [
    {
        identifier: "model", label: "Model"
    },
    {
        identifier: "graph", label: "Graph"
    },
    {
        identifier: "simulator", label: "Simulator"
    },
    {
        identifier: "code", label: "Code"
    }
];

//---------------------------------------------------------------------------------------------------------------------
// Function: readStoredWidth
//
// Description:
//
//   Reads the supplied representation and returns its normalized in-memory form.
//
// Arguments:
//
//   storageKey (string):
//     The storage key used by this operation.
//
//   fallback (number):
//     The fallback used by this operation.
//
//   minimum (number):
//     The minimum used by this operation.
//
// Returns:
//
//   The read stored width result.
//
//---------------------------------------------------------------------------------------------------------------------

function readStoredWidth ( storageKey: string, fallback: number, minimum: number ): number
{
    const storedWidth = Number ( localStorage.getItem ( storageKey ) );

    // Return the value selected by the evaluated condition.

    return Number.isFinite ( storedWidth ) && storedWidth >= minimum ? storedWidth : Math.max ( minimum, fallback );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: EmptyWorkspace
//
// Description:
//
//   Renders the empty workspace component from its supplied state and callbacks, producing the corresponding
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

function EmptyWorkspace (
    {
        message, openNewModel }:
        {
            message: string; openNewModel: () => void
        } )
{

    // Return the rendered interface element.

    return <section className="no-document"><h2>No document is open</h2><p>{ message }</p>
        <button onClick={ openNewModel }>New model</button></section>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: EmptyModelTree
//
// Description:
//
//   Renders the empty model tree component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

function EmptyModelTree ()
{

    // Return the rendered interface element.

    return <nav className="model-tree empty-model-tree" aria-label="ECA model structure">
        <p className="eyebrow">Model tree</p><p>No document is open.</p>
    </nav>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: WorkspaceLoading
//
// Description:
//
//   Renders the workspace loading component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

function WorkspaceLoading ()
{

    // Return the rendered interface element.

    return <p className="empty-state" role="status">Loading workspace…</p>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: Workspace
//
// Description:
//
//   Renders the workspace component from its supplied state and callbacks, producing the corresponding user-interface
//   element.
//
// Arguments:
//
//   properties (WorkspaceProperties):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function Workspace ( properties: WorkspaceProperties )
{
    const tabReferences = useRef<Record<WorkspaceTab, HTMLButtonElement | null>>
    (
        {
            model: null, graph: null, simulator: null, code: null
        }
    );
    const [ selection, setSelection ] = useState<EditorSelection>
    (
        {
            section: "model", identifier: ""
        }
    );
    const [ expandedSections, setExpandedSections ] = useState<EditorCollectionSection[]> ( [] );
    const [ copiedItem, setCopiedItem ] = useState<
        {
            item: ModelCollectionItem; section: EditorCollectionSection
        }>();
    const [ modelTreeWidth, setModelTreeWidth ] = useState
    (
        () => readStoredWidth
        (
            MODEL_TREE_WIDTH_STORAGE_KEY, window.innerWidth * DEFAULT_SIDE_PANEL_VIEWPORT_RATIO,
            MINIMUM_MODEL_TREE_WIDTH_PIXELS
        )
    );
    const [ userGuideWidth, setUserGuideWidth ] = useState
    (
        () => readStoredWidth
        (
            USER_GUIDE_WIDTH_STORAGE_KEY, window.innerWidth * DEFAULT_SIDE_PANEL_VIEWPORT_RATIO,
            MINIMUM_USER_GUIDE_WIDTH_PIXELS
        )
    );
    const [ experimentHistory, setExperimentHistory ] = useState<SimulatorExperiment[]> ( [] );

    useEffect ( () => setExperimentHistory ( [] ), [ properties.documentSession ] );

    const selectEditor = useCallback
    (
        ( nextSelection: EditorSelection ) =>
        {
            setSelection ( nextSelection );
            properties.setActiveTab ( "model" );
        }, [ properties.setActiveTab ]
    );

    //-----------------------------------------------------------------------------------------------------------------
    // Function: revealItem
    //
    // Description:
    //
    //   Performs the reveal item operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   section (EditorCollectionSection):
    //     The section used by this operation.
    //
    //   identifier (string):
    //     The stable identifier used to locate the corresponding model element.
    //
    // Returns:
    //
    //   The reveal item result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const revealItem = ( section: EditorCollectionSection, identifier: string ) =>
    {
        setExpandedSections ( current => current.includes ( section ) ? current : [ ...current, section ] );
        selectEditor
        (
            {
                section, identifier
            }
        );
    };

    const treeCommands: ModelTreeCommands =
    {
        addItem: ( section, relativeIdentifier, after = false ) =>
        {
            const relativeIndex = relativeIdentifier
                ? properties.model [ section ].findIndex ( item => item.id === relativeIdentifier ) : -1;
            const result = insertNewModelItem
            (
                properties.model, section,
                relativeIndex < 0 ? undefined : relativeIndex + ( after ? 1 : 0 )
            );
            if ( result )
            {
                properties.updateModel ( result.model );
                revealItem ( section, result.identifier );
            }
        },
        copyItem: ( section, identifier ) =>
        {
            const item = properties.model [ section ].find ( candidate => candidate.id === identifier );
            if ( item ) setCopiedItem
            (
                {
                    section, item: structuredClone ( item )
                }
            );
        },
        deleteCollection: section =>
        {
            const itemCount = properties.model [ section ].length;
            if ( itemCount === 0 || !window.confirm (
                `Delete all ${ itemCount } items from ${ section }? References are not removed.` ) )
            {
                // Return without a value after completing this code path.

                return;
            }
            properties.updateModel
            (
                (
                    {
                        ...properties.model, [ section ]: []
                    }
                ) as StatelessECAModel
            );
            selectEditor
            (
                {
                    section, identifier: ""
                }
            );
        },
        deleteItem: ( section, identifier ) =>
        {
            const references = section === "rules" ? []
                : referencedDefinitionIdentifiers ( properties.model, section, identifier );
            const warning = references.length === 0 ? "" : ` This leaves references in: ${ references.join ( ", " ) }.`;
            if ( !window.confirm ( `Delete ${ identifier }?${ warning }` ) )
            {
                // Return without a value after completing this code path.

                return;
            }
            properties.updateModel
            (
                section === "rules"
                ?
                    {
                        ...properties.model, rules: properties.model.rules.filter ( rule => rule.id !== identifier )
                    }
                : removeDefinition ( properties.model, section, identifier )
            );
            selectEditor
            (
                {
                    section, identifier: ""
                }
            );
        },
        exportCollection: section => properties.exportCollection?.( section ),
        importCollection: section => properties.importCollection?.( section ),
        pasteItem: ( section, relativeIdentifier, after ) =>
        {
            if ( copiedItem?.section !== section )
            {
                // Return without a value after completing this code path.

                return;
            }
            const relativeIndex = properties.model [ section ].findIndex ( item => item.id === relativeIdentifier );
            if ( relativeIndex < 0 )
            {
                // Return without a value after completing this code path.

                return;
            }
            const result = copyModelItem
            (
                properties.model, section, copiedItem.item,
                relativeIndex + ( after ? 1 : 0 )
            );
            if ( result )
            {
                properties.updateModel ( result.model );
                revealItem ( section, result.identifier );
            }
        },
        pasteSection: copiedItem?.section
    };

    useEffect
    (
        () =>
        {
            if ( !properties.editorNavigation )
            {
                // Return without a value after completing this code path.

                return;
            }
            const navigation = properties.editorNavigation;
            setSelection
            (
                {
                    section: navigation.section, identifier: navigation.identifier ?? ""
                }
            );
            properties.setActiveTab ( "model" );
            if ( navigation.section !== "model" && navigation.identifier )
            {
                setExpandedSections
                (
                    current => current.includes ( navigation.section as EditorCollectionSection )
                    ? current : [ ...current, navigation.section as EditorCollectionSection ]
                );
            }
            if ( navigation.field )
            {
                window.requestAnimationFrame
                (
                    () => window.requestAnimationFrame
                    (
                        () =>
                        {
                            const exactField = document.querySelector<HTMLElement> (
                                `[data-model-field="${ CSS.escape ( navigation.field! ) }"]` );
                            const fallbackField = navigation.field!.includes ( "/" )
                                ? document.querySelector<HTMLElement> (
                                    `[data-model-field="${ CSS.escape ( navigation.field!.split ( "/" ) [ 0 ] ) }"]` ) : undefined;
                            const field = exactField ?? fallbackField;
                            const control = field?.matches ( "input, select, textarea, button" ) ? field
                                : field?.querySelector<HTMLElement> ( "input, select, textarea, button" );
                            ( control ?? document.getElementById ( "editor-heading" ) )?.focus ();
                        }
                    )
                );
            }
        }, [ properties.editorNavigation, properties.setActiveTab ]
    );

    useEffect
    (
        () => localStorage.setItem (
        MODEL_TREE_WIDTH_STORAGE_KEY, String ( modelTreeWidth ) ), [ modelTreeWidth ]
    );
    useEffect
    (
        () => localStorage.setItem (
        USER_GUIDE_WIDTH_STORAGE_KEY, String ( userGuideWidth ) ), [ userGuideWidth ]
    );

    //-----------------------------------------------------------------------------------------------------------------
    // Function: handleTabKeyDown
    //
    // Description:
    //
    //   Handles tab key down and coordinates the associated state transition or user-interface response.
    //
    // Arguments:
    //
    //   event (ReactKeyboardEvent<HTMLDivElement>):
    //     The event used by this operation.
    //
    // Returns:
    //
    //   The handle tab key down result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const handleTabKeyDown = ( event: ReactKeyboardEvent<HTMLDivElement> ) =>
    {
        const currentIndex = WORKSPACE_TABS.findIndex ( tab => tab.identifier === properties.activeTab );
        let nextIndex: number | undefined;
        if ( event.key === "ArrowLeft" || event.key === "ArrowRight" )
        {
            nextIndex = ( currentIndex + ( event.key === "ArrowRight" ? 1 : WORKSPACE_TABS.length - 1 ) )
                % WORKSPACE_TABS.length;
        }
        else if ( event.key === "Home" ) nextIndex = 0;
        else if ( event.key === "End" ) nextIndex = WORKSPACE_TABS.length - 1;
        if ( nextIndex === undefined )
        {
            // Return without a value after completing this code path.

            return;
        }

        event.preventDefault ();
        const nextTab = WORKSPACE_TABS [ nextIndex ].identifier;
        properties.setActiveTab ( nextTab );
        tabReferences.current [ nextTab ]?.focus ();
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: resizePanel
    //
    // Description:
    //
    //   Performs the resize panel operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   event (ReactPointerEvent<HTMLDivElement>):
    //     The event used by this operation.
    //
    //   currentWidth (number):
    //     The current width used by this operation.
    //
    //   minimumWidth (number):
    //     The minimum width used by this operation.
    //
    //   direction (1 | -1):
    //     The direction used by this operation.
    //
    //   updateWidth (( width: number ) => void):
    //     The update width used by this operation.
    //
    // Returns:
    //
    //   The resize panel result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const resizePanel = ( event: ReactPointerEvent<HTMLDivElement>, currentWidth: number,
        minimumWidth: number, direction: 1 | -1, updateWidth: ( width: number ) => void ) =>
    {
        const startingX = event.clientX;
        const maximumWidth = window.innerWidth * MAXIMUM_SIDE_PANEL_VIEWPORT_RATIO;
        //-------------------------------------------------------------------------------------------------------------
        // Function: resize
        //
        // Description:
        //
        //   Performs the resize operation using the supplied inputs and current state.
        //
        // Arguments:
        //
        //   pointerEvent (PointerEvent):
        //     The pointer event used by this operation.
        //
        // Returns:
        //
        //   The resize result.
        //
        //-------------------------------------------------------------------------------------------------------------

        const resize = ( pointerEvent: PointerEvent ) => updateWidth
        (
            Math.max
            (
                minimumWidth,
                Math.min ( maximumWidth, currentWidth + direction * ( pointerEvent.clientX - startingX ) )
            )
        );
        //-------------------------------------------------------------------------------------------------------------
        // Function: finish
        //
        // Description:
        //
        //   Performs the finish operation using the supplied inputs and current state.
        //
        // Returns:
        //
        //   The finish result.
        //
        //-------------------------------------------------------------------------------------------------------------

        const finish = () =>
        {
            window.removeEventListener ( "pointermove", resize );
            window.removeEventListener ( "pointerup", finish );
        };
        window.addEventListener ( "pointermove", resize );
        window.addEventListener ( "pointerup", finish );
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: resizeWithKeyboard
    //
    // Description:
    //
    //   Performs the resize with keyboard operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   event (ReactKeyboardEvent<HTMLDivElement>):
    //     The event used by this operation.
    //
    //   currentWidth (number):
    //     The current width used by this operation.
    //
    //   minimumWidth (number):
    //     The minimum width used by this operation.
    //
    //   direction (1 | -1):
    //     The direction used by this operation.
    //
    //   updateWidth (( width: number ) => void):
    //     The update width used by this operation.
    //
    // Returns:
    //
    //   The resize with keyboard result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const resizeWithKeyboard = ( event: ReactKeyboardEvent<HTMLDivElement>, currentWidth: number,
        minimumWidth: number, direction: 1 | -1, updateWidth: ( width: number ) => void ) =>
    {
        if ( event.key !== "ArrowLeft" && event.key !== "ArrowRight" )
        {
            // Return without a value after completing this code path.

            return;
        }
        event.preventDefault ();
        const arrowDirection = event.key === "ArrowRight" ? 1 : -1;
        updateWidth
        (
            Math.max
            (
                minimumWidth, Math.min
                (
                    window.innerWidth * MAXIMUM_SIDE_PANEL_VIEWPORT_RATIO,
                    currentWidth + direction * arrowDirection * SPLITTER_KEYBOARD_STEP_PIXELS
                )
            )
        );
    };

    const guideTopic: UserGuideTopic = !properties.documentOpen ? "no-document"
        : properties.activeTab === "graph" ? "graph"
            : properties.activeTab === "simulator" ? "simulator"
            : properties.activeTab === "code" ? "code" : selection.section;
    const selectedDefinition = selection.section === "model" || !selection.identifier ? undefined
        : properties.model [ selection.section ].find ( item => item.id === selection.identifier );
    const guideContext = !properties.documentOpen || properties.activeTab !== "model" ? undefined
        : selectedDefinition?.name ?? ( selection.section === "model" ? properties.model.name : undefined );
    const workspaceStyle =
    {
        "--model-tree-width": `${ modelTreeWidth }px`,
        "--user-guide-width": `${ userGuideWidth }px`
    } as CSSProperties;

    // Return the rendered interface element.

    return <main><div className="workspace-shell" style={ workspaceStyle }>
        { properties.documentOpen
            ? <ModelTree model={ properties.model } selection={ selection } setSelection={ selectEditor }
                commands={ treeCommands } expandedSections={ expandedSections }
                toggleSection={ section => setExpandedSections
                (
                    current =>
                    current.includes ( section ) ? current.filter ( item => item !== section )
                        : [ ...current, section ]
                ) } />
            : <EmptyModelTree /> }
        <div className="splitter" role="separator" aria-orientation="vertical" aria-label="Resize model tree"
            tabIndex={ 0 } aria-valuemin={ MINIMUM_MODEL_TREE_WIDTH_PIXELS }
            aria-valuemax={ Math.round ( window.innerWidth * MAXIMUM_SIDE_PANEL_VIEWPORT_RATIO ) }
            aria-valuenow={ Math.round ( modelTreeWidth ) }
            onPointerDown={ event => resizePanel
            (
                event, modelTreeWidth,
                MINIMUM_MODEL_TREE_WIDTH_PIXELS, 1, setModelTreeWidth
            ) }
            onKeyDown={ event => resizeWithKeyboard
            (
                event, modelTreeWidth,
                MINIMUM_MODEL_TREE_WIDTH_PIXELS, 1, setModelTreeWidth
            ) } />
        <div className="workspace-tabs">
            <div className="workspace-tab-list" role="tablist" aria-label="Workspace views"
                onKeyDown={ handleTabKeyDown }>
                { WORKSPACE_TABS.map
                (
                    tab => <button type="button" id={ `workspace-tab-${ tab.identifier }` }
                                    key={ tab.identifier } ref={ element =>
                                    {
                        tabReferences.current [ tab.identifier ] = element;
                    } }
                                    role="tab" aria-selected={ properties.activeTab === tab.identifier }
                                    aria-controls={ `workspace-panel-${ tab.identifier }` }
                                    tabIndex={ properties.activeTab === tab.identifier ? 0 : -1 }
                                    onClick={ () => properties.setActiveTab ( tab.identifier ) }>{ tab.label }</button>
                ) }
            </div>
            <section className="workspace-tab-panel" id="workspace-panel-model" role="tabpanel"
                aria-labelledby="workspace-tab-model" hidden={ properties.activeTab !== "model" }>
                { properties.documentOpen
                    ? <StructuredEditor model={ properties.model } updateModel={ properties.updateModel }
                        selection={ selection } setSelection={ selectEditor } />
                    : <EmptyWorkspace message="Create a new model or open a JSON model to begin."
                        openNewModel={ properties.openNewModel } /> }
            </section>
            <section className="workspace-tab-panel" id="workspace-panel-graph" role="tabpanel"
                aria-labelledby="workspace-tab-graph" hidden={ properties.activeTab !== "graph" }>
                { properties.activeTab === "graph" && <Suspense fallback={ <WorkspaceLoading /> }>
                    { properties.documentOpen
                        ? <ModelGraph model={ properties.model } selection={ selection } setSelection={ setSelection }
                            openSelection={ selectEditor } />
                        : <EmptyWorkspace message="Open a model to view its rule graph."
                            openNewModel={ properties.openNewModel } /> }
                </Suspense> }
            </section>
            <section className="workspace-tab-panel" id="workspace-panel-simulator" role="tabpanel"
                aria-labelledby="workspace-tab-simulator" hidden={ properties.activeTab !== "simulator" }>
                { properties.activeTab === "simulator" && <Suspense fallback={ <WorkspaceLoading /> }>
                    { properties.documentOpen
                        ? <Simulator model={ properties.model }
                            documentRevision={ properties.documentRevision } experimentHistory={ experimentHistory }
                            setExperimentHistory={ setExperimentHistory } />
                        : <EmptyWorkspace message="Open a model before raising an event in the simulator."
                            openNewModel={ properties.openNewModel } /> }
                </Suspense> }
            </section>
            <section className="workspace-tab-panel" id="workspace-panel-code" role="tabpanel"
                aria-labelledby="workspace-tab-code" hidden={ properties.activeTab !== "code" }>
                { properties.activeTab === "code" && <Suspense fallback={ <WorkspaceLoading /> }>
                    { properties.documentOpen
                        ? <JsonCodeView model={ properties.model } />
                        : <EmptyWorkspace message="Open a model to view its JSON source."
                            openNewModel={ properties.openNewModel } /> }
                </Suspense> }
            </section>
        </div>
        <div className="splitter" role="separator" aria-orientation="vertical" aria-label="Resize User Guide"
            tabIndex={ 0 } aria-valuemin={ MINIMUM_USER_GUIDE_WIDTH_PIXELS }
            aria-valuemax={ Math.round ( window.innerWidth * MAXIMUM_SIDE_PANEL_VIEWPORT_RATIO ) }
            aria-valuenow={ Math.round ( userGuideWidth ) }
            onPointerDown={ event => resizePanel
            (
                event, userGuideWidth,
                MINIMUM_USER_GUIDE_WIDTH_PIXELS, -1, setUserGuideWidth
            ) }
            onKeyDown={ event => resizeWithKeyboard
            (
                event, userGuideWidth,
                MINIMUM_USER_GUIDE_WIDTH_PIXELS, -1, setUserGuideWidth
            ) } />
        <UserGuide topic={ guideTopic } contextLabel={ guideContext } />
    </div></main>;
}
