//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Structured tree navigation and master-detail editor for version 1 ECA models.
//
//---------------------------------------------------------------------------------------------------------------------

import {
    BranchFork24Regular, ChevronDown16Regular, ChevronRight16Regular, Document24Regular,
    DocumentData24Regular, Filter24Regular, Flash24Regular, MoreHorizontal24Regular, Play24Regular,
    TextBulletList24Regular
} from "@fluentui/react-icons";
import {
    type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent,
    type ReactNode, useEffect, useRef, useState
} from "react";
import {
    MODEL_TREE_COLLECTION_PAGE_SIZE, STRUCTURED_EDITOR_COLLECTION_PAGE_SIZE
} from "../config/editor-layout";
import {
    MAXIMUM_DESCRIPTION_LENGTH, MAXIMUM_DISPLAY_NAME_LENGTH, MODEL_COLLECTION_LIMITS
} from "../contracts/contract-limits";
import type {
    Action, Condition, EventType, ParameterDefinition, PayloadDefinition, Rule, StatelessECAModel
} from "../contracts/model.generated";
import {
    type DefinitionCollection, identifierValidationError, type ItemCollection, referencedDefinitionIdentifiers,
    removeDefinition, renameItem
} from "../document/model-commands";
import { insertNewModelItem, type ModelCollectionItem } from "../document/tree-commands";
import {
    ActionForm, ConditionForm, EventForm, IdentifierField, ParameterForm, PayloadForm, RuleForm
} from "./EditorForms";
import { calculateCollectionPage, CollectionPagination } from "./CollectionPagination";
import { selectModelParameterNames } from "./model-metadata";

//---------------------------------------------------------------------------------------------------------------------
// Type: EditorSection
//
// Description:
//
//   Defines the valid representation of editor section.
//
//---------------------------------------------------------------------------------------------------------------------
export type EditorSection = "model" | "parameters" | "payloads" | "events" | "conditions" | "actions" | "rules";
//---------------------------------------------------------------------------------------------------------------------
// Type: EditorCollectionSection
//
// Description:
//
//   Defines the valid representation of editor collection section.
//
//---------------------------------------------------------------------------------------------------------------------
export type EditorCollectionSection = Exclude<EditorSection, "model">;
//---------------------------------------------------------------------------------------------------------------------
// Type: CollectionItem
//
// Description:
//
//   Defines the valid representation of collection item.
//
//---------------------------------------------------------------------------------------------------------------------
type CollectionItem = ModelCollectionItem;

//---------------------------------------------------------------------------------------------------------------------
// Interface: EditorNavigation
//
// Description:
//
//   Defines the named fields and callable operations that make up editor navigation.
//
//---------------------------------------------------------------------------------------------------------------------
export interface EditorNavigation
{
    field?: string;
    identifier?: string;
    section: EditorSection;
    sequence: number;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: EditorSelection
//
// Description:
//
//   Defines the named fields and callable operations that make up editor selection.
//
//---------------------------------------------------------------------------------------------------------------------
export interface EditorSelection
{
    identifier: string;
    section: EditorSection;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: ModelTreeProperties
//
// Description:
//
//   Defines the named fields and callable operations that make up model tree properties.
//
//---------------------------------------------------------------------------------------------------------------------
interface ModelTreeProperties
{
    commands?: ModelTreeCommands;
    expandedSections: EditorCollectionSection[];
    model: StatelessECAModel;
    selection: EditorSelection;
    setSelection: ( selection: EditorSelection ) => void;
    toggleSection: ( section: EditorCollectionSection ) => void;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: ModelTreeCommands
//
// Description:
//
//   Defines the named fields and callable operations that make up model tree commands.
//
//---------------------------------------------------------------------------------------------------------------------
export interface ModelTreeCommands
{
    addItem: ( section: EditorCollectionSection, relativeIdentifier?: string, after?: boolean ) => void;
    copyItem: ( section: EditorCollectionSection, identifier: string ) => void;
    deleteCollection: ( section: EditorCollectionSection ) => void;
    deleteItem: ( section: EditorCollectionSection, identifier: string ) => void;
    exportCollection: ( section: EditorCollectionSection ) => void;
    importCollection: ( section: EditorCollectionSection ) => void;
    pasteItem: ( section: EditorCollectionSection, relativeIdentifier: string, after: boolean ) => void;
    pasteSection?: EditorCollectionSection;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: TreeMenuTarget
//
// Description:
//
//   Defines the named fields and callable operations that make up tree menu target.
//
//---------------------------------------------------------------------------------------------------------------------
interface TreeMenuTarget
{
    identifier?: string;
    label: string;
    left: number;
    section: EditorCollectionSection;
    top: number;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: StructuredEditorProperties
//
// Description:
//
//   Defines the named fields and callable operations that make up structured editor properties.
//
//---------------------------------------------------------------------------------------------------------------------
interface StructuredEditorProperties
{
    model: StatelessECAModel;
    selection: EditorSelection;
    setSelection: ( selection: EditorSelection ) => void;
    updateModel: ( model: StatelessECAModel ) => void;
}

export const EDITOR_COLLECTIONS: Array<
    {
        label: string; section: EditorCollectionSection
    }> = [
    {
        section: "parameters", label: "Parameters"
    },
    {
        section: "payloads", label: "Payloads"
    },
    {
        section: "events", label: "Events"
    },
    {
        section: "conditions", label: "Conditions"
    },
    {
        section: "actions", label: "Actions"
    },
    {
        section: "rules", label: "Rules"
    }
];

const INITIAL_COLLECTION_PAGE_INDEXES: Record<EditorCollectionSection, number> =
{
    parameters: 0,
    payloads: 0,
    events: 0,
    conditions: 0,
    actions: 0,
    rules: 0
};

//---------------------------------------------------------------------------------------------------------------------
// Function: TreeNodeContent
//
// Description:
//
//   Renders the tree node content component from its supplied state and callbacks, producing the corresponding
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

function TreeNodeContent (
    {
        icon, label, count }:
        {
            icon: ReactNode; label: string; count?: number
        } )
{

    // Return the rendered interface element.

    return <span className="tree-node-content"><span className="tree-node-icon" aria-hidden="true">{ icon }</span>
        <span className="tree-node-text">{ label }</span>
        { count !== undefined && <span className="tree-node-count">{ count }</span> }</span>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: CollectionIcon
//
// Description:
//
//   Renders the collection icon component from its supplied state and callbacks, producing the corresponding
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

function CollectionIcon (
    {
        section }:
        {
            section: EditorCollectionSection
        } )
{
    if ( section === "parameters" )
    {
        // Return the rendered interface element.

        return <TextBulletList24Regular />;
    }
    if ( section === "payloads" )
    {
        // Return the rendered interface element.

        return <DocumentData24Regular />;
    }
    if ( section === "events" )
    {
        // Return the rendered interface element.

        return <Flash24Regular />;
    }
    if ( section === "conditions" )
    {
        // Return the rendered interface element.

        return <Filter24Regular />;
    }
    if ( section === "actions" )
    {
        // Return the rendered interface element.

        return <Play24Regular />;
    }

    // Return the rendered interface element.

    return <BranchFork24Regular />;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: ExpanderIcon
//
// Description:
//
//   Renders the expander icon component from its supplied state and callbacks, producing the corresponding
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

function ExpanderIcon (
    {
        expanded }:
        {
            expanded: boolean
        } )
{

    // Return the value selected by the evaluated condition.

    return expanded ? <ChevronDown16Regular aria-hidden="true" /> : <ChevronRight16Regular aria-hidden="true" />;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: ModelTree
//
// Description:
//
//   Renders the model tree component from its supplied state and callbacks, producing the corresponding user-interface
//   element.
//
// Arguments:
//
//   properties (ModelTreeProperties):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function ModelTree ( properties: ModelTreeProperties )
{
    const [ collectionPageIndexes, setCollectionPageIndexes ] = useState ( INITIAL_COLLECTION_PAGE_INDEXES );
    const [ menuTarget, setMenuTarget ] = useState<TreeMenuTarget>();
    const menuReference = useRef<HTMLDivElement> ( null );
    const menuInvokerReference = useRef<HTMLElement> ( null );

    useEffect
    (
        () =>
        {
            if ( !menuTarget )
            {
                // Return without a value after completing this code path.

                return;
            }
            menuReference.current?.querySelector<HTMLButtonElement> ( "[role='menuitem']:not(:disabled)" )?.focus ();
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
                if ( !menuReference.current?.contains ( event.target as Node ) ) setMenuTarget ( undefined );
            };
            window.addEventListener ( "pointerdown", closeMenu );

            // Return the value produced by this code path.

            return () => window.removeEventListener ( "pointerdown", closeMenu );
        }, [ menuTarget ]
    );

    //-----------------------------------------------------------------------------------------------------------------
    // Function: openMenu
    //
    // Description:
    //
    //   Opens menu using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   section (EditorCollectionSection):
    //     The section used by this operation.
    //
    //   label (string):
    //     The label used by this operation.
    //
    //   element (HTMLElement):
    //     The element used by this operation.
    //
    //   identifier (string):
    //     The stable identifier used to locate the corresponding model element.
    //
    //   pointer ({ clientX: number; clientY: number }):
    //     The pointer used by this operation.
    //
    // Returns:
    //
    //   The open menu result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const openMenu = ( section: EditorCollectionSection, label: string, element: HTMLElement,
        identifier?: string, pointer?: { clientX: number; clientY: number } ) =>
    {
        const bounds = element.getBoundingClientRect ();
        menuInvokerReference.current = element;
        properties.setSelection
        (
            {
                section, identifier: identifier ?? ""
            }
        );
        setMenuTarget
        (
            {
                section, identifier, label,
                left: pointer?.clientX ?? bounds.right,
                top: pointer?.clientY ?? bounds.bottom
            }
        );
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: openContextMenu
    //
    // Description:
    //
    //   Opens context menu using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   event (ReactMouseEvent<HTMLElement>):
    //     The event used by this operation.
    //
    //   section (EditorCollectionSection):
    //     The section used by this operation.
    //
    //   label (string):
    //     The label used by this operation.
    //
    //   identifier (string):
    //     The stable identifier used to locate the corresponding model element.
    //
    // Returns:
    //
    //   The open context menu result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const openContextMenu = ( event: ReactMouseEvent<HTMLElement>, section: EditorCollectionSection,
        label: string, identifier?: string ) =>
    {
        event.preventDefault ();
        openMenu ( section, label, event.currentTarget, identifier, event );
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: openKeyboardMenu
    //
    // Description:
    //
    //   Opens keyboard menu using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   event (ReactKeyboardEvent<HTMLElement>):
    //     The event used by this operation.
    //
    //   section (EditorCollectionSection):
    //     The section used by this operation.
    //
    //   label (string):
    //     The label used by this operation.
    //
    //   identifier (string):
    //     The stable identifier used to locate the corresponding model element.
    //
    // Returns:
    //
    //   The open keyboard menu result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const openKeyboardMenu = ( event: ReactKeyboardEvent<HTMLElement>, section: EditorCollectionSection,
        label: string, identifier?: string ) =>
    {
        if ( !( ( event.shiftKey && event.key === "F10" ) || event.key === "ContextMenu" ) )
        {
            // Return without a value after completing this code path.

            return;
        }
        event.preventDefault ();
        openMenu ( section, label, event.currentTarget, identifier );
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: runMenuCommand
    //
    // Description:
    //
    //   Runs menu command using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   command (() => void):
    //     The command used by this operation.
    //
    // Returns:
    //
    //   The run menu command result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const runMenuCommand = ( command: () => void ) =>
    {
        setMenuTarget ( undefined );
        menuInvokerReference.current?.focus ();
        command ();
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: handleMenuKeyDown
    //
    // Description:
    //
    //   Handles menu key down and coordinates the associated state transition or user-interface response.
    //
    // Arguments:
    //
    //   event (ReactKeyboardEvent<HTMLDivElement>):
    //     The event used by this operation.
    //
    // Returns:
    //
    //   The handle menu key down result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const handleMenuKeyDown = ( event: ReactKeyboardEvent<HTMLDivElement> ) =>
    {
        if ( event.key === "Escape" )
        {
            event.preventDefault ();
            setMenuTarget ( undefined );
            menuInvokerReference.current?.focus ();

            // Return without a value after completing this code path.

            return;
        }
        if ( ![ "ArrowDown", "ArrowUp", "Home", "End" ].includes ( event.key ) )
        {
            // Return without a value after completing this code path.

            return;
        }

        const items = Array.from
        (
            menuReference.current?.querySelectorAll<HTMLButtonElement> (
            "[role='menuitem']:not(:disabled)" ) ?? []
        );
        if ( items.length === 0 )
        {
            // Return without a value after completing this code path.

            return;
        }
        event.preventDefault ();
        const currentIndex = items.indexOf ( document.activeElement as HTMLButtonElement );
        const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
            : ( currentIndex + ( event.key === "ArrowDown" ? 1 : items.length - 1 ) ) % items.length;
        items [ nextIndex ].focus ();
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: handleTreeKeyDown
    //
    // Description:
    //
    //   Handles tree key down and coordinates the associated state transition or user-interface response.
    //
    // Arguments:
    //
    //   event (ReactKeyboardEvent<HTMLElement>):
    //     The event used by this operation.
    //
    // Returns:
    //
    //   The handle tree key down result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const handleTreeKeyDown = ( event: ReactKeyboardEvent<HTMLElement> ) =>
    {
        const activeNode = ( event.target as HTMLElement ).closest<HTMLButtonElement> ( ".tree-label" );
        if ( !activeNode || !event.currentTarget.contains ( activeNode ) )
        {
            // Return without a value after completing this code path.

            return;
        }
        const visibleNodes = Array.from ( event.currentTarget.querySelectorAll<HTMLButtonElement> ( ".tree-label" ) );
        const currentIndex = visibleNodes.indexOf ( activeNode );
        if ( currentIndex < 0 )
        {
            // Return without a value after completing this code path.

            return;
        }

        if ( event.key === "Enter" )
        {
            event.preventDefault ();
            activeNode.click ();

            // Return without a value after completing this code path.

            return;
        }
        if ( event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End" )
        {
            event.preventDefault ();
            const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? visibleNodes.length - 1
                : Math.max
                (
                    0, Math.min
                    (
                        visibleNodes.length - 1,
                        currentIndex + ( event.key === "ArrowDown" ? 1 : -1 )
                    )
                );
            visibleNodes [ nextIndex ]?.focus ();

            // Return without a value after completing this code path.

            return;
        }

        const nodeKind = activeNode.dataset.treeNodeKind;
        const section  = activeNode.dataset.treeSection as EditorCollectionSection | undefined;
        if ( event.key === "ArrowRight" && nodeKind === "collection" && section )
        {
            event.preventDefault ();
            if ( activeNode.getAttribute ( "aria-expanded" ) !== "true" )
            {
                properties.toggleSection ( section );
            }
            else
            {
                visibleNodes.find
                (
                    node => node.dataset.treeNodeKind === "item"
                    && node.dataset.treeSection === section
                )?.focus ();
            }
        }
        else if ( event.key === "ArrowLeft" && nodeKind === "item" && section )
        {
            event.preventDefault ();
            visibleNodes.find
            (
                node => node.dataset.treeNodeKind === "collection"
                && node.dataset.treeSection === section
            )?.focus ();
        }
        else if ( event.key === "ArrowLeft" && nodeKind === "collection" && section )
        {
            event.preventDefault ();
            if ( activeNode.getAttribute ( "aria-expanded" ) === "true" ) properties.toggleSection ( section );
            else visibleNodes [ 0 ]?.focus ();
        }
    };

    useEffect
    (
        () =>
        {
            if ( properties.selection.section === "model" || !properties.selection.identifier )
            {

                // Return without a value after completing this code path.

                return;
            }

            const section           = properties.selection.section;
            const selectedItemIndex = properties.model [ section ].findIndex (
                item => item.id === properties.selection.identifier );
            if ( selectedItemIndex < 0 )
            {

                // Return without a value after completing this code path.

                return;
            }

            const selectedPageIndex = Math.floor ( selectedItemIndex / MODEL_TREE_COLLECTION_PAGE_SIZE );
            setCollectionPageIndexes
            (
                currentPageIndexes => currentPageIndexes [ section ] === selectedPageIndex
                ? currentPageIndexes :
                {
                    ...currentPageIndexes, [ section ]: selectedPageIndex
                }
            );
        }, [ properties.model, properties.selection.identifier, properties.selection.section ]
    );

    // Return the rendered interface element.

    return <nav className="model-tree" aria-label="ECA model structure"
        aria-describedby="model-tree-keyboard-help" onKeyDown={ handleTreeKeyDown }>
        <p id="model-tree-keyboard-help" className="visually-hidden">Use Up and Down to move through visible nodes,
            Right to expand or enter a collection, Left to collapse or return to its parent, and Enter to select.</p>
        <button type="button"
            data-tree-node-kind="model"
            className={ properties.selection.section === "model" ? "tree-label selected-item" : "tree-label" }
            aria-current={ properties.selection.section === "model" ? "true" : undefined }
            onClick={ () => properties.setSelection
            (
                (
                    {
                        section: "model", identifier: ""
                    }
                )
            ) }>
            <TreeNodeContent icon={ <DocumentData24Regular /> } label="ECA Model" />
        </button>
        { EDITOR_COLLECTIONS.map
        (
            collection =>
                {
                const expanded        = properties.expandedSections.includes ( collection.section );
                    const collectionItems = properties.model [ collection.section ];
                    const collectionPage  = calculateCollectionPage
                    (
                        collectionItems.length,
                        collectionPageIndexes [ collection.section ], MODEL_TREE_COLLECTION_PAGE_SIZE
                    );
                    const visibleItems    = collectionItems.slice (
                        collectionPage.startIndex, collectionPage.endIndexExclusive );

                    // Return the rendered interface element.

                    return <div className="tree-group" key={ collection.section }>
                        <div className="tree-parent">
                            <button type="button" className="tree-expander"
                                aria-label={ `${ expanded ? "Collapse" : "Expand" } ${ collection.label }` }
                                aria-expanded={ expanded } onClick={ () => properties.toggleSection ( collection.section ) }>
                                <ExpanderIcon expanded={ expanded } />
                            </button>
                            <button type="button"
                                data-tree-node-kind="collection" data-tree-section={ collection.section }
                                className={ properties.selection.section === collection.section
                                    && !properties.selection.identifier ? "tree-label selected-item" : "tree-label" }
                                aria-current={ properties.selection.section === collection.section
                                    && !properties.selection.identifier ? "true" : undefined }
                                aria-expanded={ expanded }
                                onClick={ () => properties.setSelection
                                (
                                    (
                                        {
                                            section: collection.section, identifier: ""
                                        }
                                    )
                                ) }
                                onContextMenu={ event => openContextMenu ( event, collection.section, collection.label ) }
                                onKeyDown={ event => openKeyboardMenu ( event, collection.section, collection.label ) }>
                                <TreeNodeContent icon={ <CollectionIcon section={ collection.section } /> }
                                    label={ collection.label } count={ collectionItems.length } />
                            </button>
                            { properties.commands && <button type="button" className="tree-command-trigger"
                                aria-label={ `More commands for ${ collection.label }` }
                                onClick={ event => openMenu ( collection.section, collection.label, event.currentTarget ) }>
                                <MoreHorizontal24Regular aria-hidden="true" /></button> }
                        </div>
                        { expanded && <div className="tree-children">
                            <CollectionPagination { ...collectionPage } itemCount={ collectionItems.length }
                                label={ `${ collection.label } tree items` }
                                showSummary={ false }
                                setPageIndex={ pageIndex => setCollectionPageIndexes
                                (
                                    currentPageIndexes => ( (
                                        {
                                            ...currentPageIndexes, [ collection.section ]: pageIndex
                                        }
                                    ) )
                                ) } />
                            { visibleItems.map
                            (
                                item => <div className="tree-item-row" key={ item.id }>
                                    <button type="button"
                                        data-tree-node-kind="item" data-tree-section={ collection.section }
                                        className={ properties.selection.section === collection.section
                                            && properties.selection.identifier === item.id
                                            ? "tree-label selected-item" : "tree-label" }
                                        aria-current={ properties.selection.section === collection.section
                                            && properties.selection.identifier === item.id ? "true" : undefined }
                                        onClick={ () => properties.setSelection
                                        (
                                            (
                                                {
                                                    section: collection.section, identifier: item.id
                                                }
                                            )
                                        ) }
                                        onContextMenu={ event => openContextMenu (
                                            event, collection.section, item.name || item.id, item.id ) }
                                        onKeyDown={ event => openKeyboardMenu (
                                            event, collection.section, item.name || item.id, item.id ) }>
                                        <TreeNodeContent icon={ <Document24Regular /> } label={ item.name || item.id } />
                                    </button>
                                    { properties.commands && <button type="button" className="tree-command-trigger"
                                        aria-label={ `More commands for ${ item.name || item.id }` }
                                        onClick={ event => openMenu
                                        (
                                            collection.section, item.name || item.id,
                                            event.currentTarget, item.id
                                        ) }><MoreHorizontal24Regular aria-hidden="true" /></button> }
                                </div>
                            ) }
                        </div> }
                    </div>;
            }
        ) }
        { menuTarget && properties.commands && <div ref={ menuReference } className="tree-command-menu" role="menu"
            aria-label={ `${ menuTarget.label } commands` } style={
                {
                    left: menuTarget.left, top: menuTarget.top
                } as CSSProperties }
            onKeyDown={ handleMenuKeyDown }>
            { menuTarget.identifier ? <>
                <button type="button" role="menuitem" onClick={ () => runMenuCommand
                (
                    () => properties.commands?.addItem (
                    menuTarget.section, menuTarget.identifier, false )
                ) }>Add above</button>
                <button type="button" role="menuitem" onClick={ () => runMenuCommand
                (
                    () => properties.commands?.addItem (
                    menuTarget.section, menuTarget.identifier, true )
                ) }>Add below</button>
                <button type="button" role="menuitem" onClick={ () => runMenuCommand
                (
                    () => properties.commands?.copyItem (
                    menuTarget.section, menuTarget.identifier! )
                ) }>Copy</button>
                <button type="button" role="menuitem" disabled={ properties.commands.pasteSection !== menuTarget.section }
                    onClick={ () => runMenuCommand
                    (
                        () => properties.commands?.pasteItem (
                        menuTarget.section, menuTarget.identifier!, false )
                    ) }>Paste above</button>
                <button type="button" role="menuitem" disabled={ properties.commands.pasteSection !== menuTarget.section }
                    onClick={ () => runMenuCommand
                    (
                        () => properties.commands?.pasteItem (
                        menuTarget.section, menuTarget.identifier!, true )
                    ) }>Paste below</button>
                <button type="button" role="menuitem" onClick={ () => runMenuCommand
                (
                    () => properties.commands?.deleteItem (
                    menuTarget.section, menuTarget.identifier! )
                ) }>Delete</button>
            </> : <>
                <button type="button" role="menuitem" onClick={ () => runMenuCommand
                (
                    () => properties.commands?.addItem (
                    menuTarget.section )
                ) }>Add</button>
                <button type="button" role="menuitem" disabled={ properties.model [ menuTarget.section ].length === 0 }
                    onClick={ () => runMenuCommand
                    (
                        () => properties.commands?.deleteCollection (
                        menuTarget.section )
                    ) }>Delete all</button>
                <button type="button" role="menuitem" onClick={ () => runMenuCommand
                (
                    () => properties.commands?.importCollection (
                    menuTarget.section )
                ) }>Import CSV</button>
                <button type="button" role="menuitem" onClick={ () => runMenuCommand
                (
                    () => properties.commands?.exportCollection (
                    menuTarget.section )
                ) }>Export CSV</button>
            </> }
        </div> }
    </nav>;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: StructuredEditor
//
// Description:
//
//   Renders the structured editor component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (StructuredEditorProperties):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function StructuredEditor ( properties: StructuredEditorProperties )
{
    const
        {
            model, selection, setSelection, updateModel
        } = properties;
    const [ collectionPageIndexes, setCollectionPageIndexes ] = useState ( INITIAL_COLLECTION_PAGE_INDEXES );
    const section            = selection.section;
    const selectedIdentifier = selection.identifier;
    const parameterNames     = selectModelParameterNames ( model );
    const collectionSection  = section === "model" ? undefined : section;
    const selectedItem       = collectionSection
        ? model [ collectionSection ].find ( item => item.id === selectedIdentifier ) : undefined;
    const collectionItems    = collectionSection ? model [ collectionSection ] as CollectionItem[] : [];
    const collectionPage     = calculateCollectionPage
    (
        collectionItems.length,
        collectionSection ? collectionPageIndexes [ collectionSection ] : 0, STRUCTURED_EDITOR_COLLECTION_PAGE_SIZE
    );
    const visibleItems       = collectionItems.slice ( collectionPage.startIndex, collectionPage.endIndexExclusive );

    useEffect
    (
        () =>
        {
            if ( collectionSection && selectedIdentifier && !selectedItem )
            {
                setSelection
                (
                    {
                        section: collectionSection, identifier: ""
                    }
                );
            }
        }, [ collectionSection, selectedIdentifier, selectedItem, setSelection ]
    );

    //-----------------------------------------------------------------------------------------------------------------
    // Function: handleFormKeyDown
    //
    // Description:
    //
    //   Handles form key down and coordinates the associated state transition or user-interface response.
    //
    // Arguments:
    //
    //   event (ReactKeyboardEvent<HTMLElement>):
    //     The event used by this operation.
    //
    // Returns:
    //
    //   The handle form key down result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const handleFormKeyDown = ( event: ReactKeyboardEvent<HTMLElement> ) =>
    {
        if ( event.altKey || event.ctrlKey || event.metaKey || event.shiftKey )
        {
            // Return without a value after completing this code path.

            return;
        }
        const activeControl = event.target as HTMLElement;
        if ( !activeControl.matches ( "input, select, textarea, button" ) )
        {
            // Return without a value after completing this code path.

            return;
        }
        const controls = Array.from
        (
            event.currentTarget.querySelectorAll<HTMLElement> (
            "input, select, textarea, button" )
        ).filter ( control => !( control as HTMLInputElement ).disabled );
        const currentIndex = controls.indexOf ( activeControl );
        if ( currentIndex < 0 )
        {
            // Return without a value after completing this code path.

            return;
        }

        if ( event.key === "Enter" )
        {
            if ( activeControl instanceof HTMLButtonElement )
            {
                // Return without a value after completing this code path.

                return;
            }
            if ( activeControl instanceof HTMLTextAreaElement )
            {
                // Return without a value after completing this code path.

                return;
            }
            if ( activeControl instanceof HTMLInputElement && activeControl.type === "checkbox" )
            {
                event.preventDefault ();
                activeControl.click ();

                // Return without a value after completing this code path.

                return;
            }
            event.preventDefault ();
            controls.slice ( currentIndex + 1 ).find (
                control => !( control instanceof HTMLTextAreaElement ) )?.focus ();

            // Return without a value after completing this code path.

            return;
        }

        let move: -1 | 1 | undefined;
        if ( activeControl instanceof HTMLTextAreaElement )
        {
            const selectionStart = activeControl.selectionStart ?? 0;
            const beforeCaret    = activeControl.value.slice ( 0, selectionStart );
            const afterCaret     = activeControl.value.slice ( selectionStart );
            if ( event.key === "ArrowUp" && !beforeCaret.includes ( "\n" ) ) move = -1;
            if ( event.key === "ArrowDown" && !afterCaret.includes ( "\n" ) ) move = 1;
        }
        else if ( activeControl instanceof HTMLSelectElement
            || activeControl instanceof HTMLInputElement && activeControl.type === "number" )
        {
            if ( event.key === "ArrowLeft" ) move = -1;
            if ( event.key === "ArrowRight" ) move = 1;
        }
        else if ( activeControl instanceof HTMLInputElement
            && [ "email", "password", "search", "tel", "text", "url" ].includes ( activeControl.type ) )
        {
            if ( event.key === "ArrowUp" ) move = -1;
            if ( event.key === "ArrowDown" ) move = 1;
        }
        else
        {
            if ( event.key === "ArrowLeft" || event.key === "ArrowUp" ) move = -1;
            if ( event.key === "ArrowRight" || event.key === "ArrowDown" ) move = 1;
        }
        if ( move === undefined )
        {
            // Return without a value after completing this code path.

            return;
        }

        const nextControl = controls [ currentIndex + move ];
        if ( nextControl )
        {
            event.preventDefault ();
            nextControl.focus ();
        }
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: editCollection
    //
    // Description:
    //
    //   Performs the edit collection operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   collection (CollectionName):
    //     The collection inspected or transformed by this operation.
    //
    //   itemIdentifier (string):
    //     The stable item identifier used to locate the corresponding model element.
    //
    //   changes (Partial<StatelessECAModel[CollectionName][number]>):
    //     The changes collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The edit collection result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const editCollection = <CollectionName extends EditorCollectionSection> (
        collection: CollectionName, itemIdentifier: string,
        changes: Partial<StatelessECAModel[CollectionName][number]> ) =>
    {
        updateModel
        (
            {
                ...model,
                [ collection ]: model [ collection ].map
                (
                    item => item.id === itemIdentifier
                    ?
                    {
                        ...item, ...changes
                    } : item
                )
            }
        );
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: rename
    //
    // Description:
    //
    //   Performs the rename operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   collection (ItemCollection):
    //     The collection inspected or transformed by this operation.
    //
    //   oldIdentifier (string):
    //     The stable old identifier used to locate the corresponding model element.
    //
    //   newIdentifier (string):
    //     The stable new identifier used to locate the corresponding model element.
    //
    // Returns:
    //
    //   The rename result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const rename = ( collection: ItemCollection, oldIdentifier: string, newIdentifier: string ) =>
    {
        if ( newIdentifier === oldIdentifier
            || identifierValidationError ( newIdentifier, model [ collection ].map ( item => item.id ), oldIdentifier ) )
        {

            // Return without a value after completing this code path.

            return;
        }
        updateModel ( renameItem ( model, collection, oldIdentifier, newIdentifier ) );
        setSelection
        (
            {
                section: collection, identifier: newIdentifier
            }
        );
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: remove
    //
    // Description:
    //
    //   Removes the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   collection (DefinitionCollection | "rules"):
    //     The collection inspected or transformed by this operation.
    //
    //   itemIdentifier (string):
    //     The stable item identifier used to locate the corresponding model element.
    //
    // Returns:
    //
    //   The remove result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const remove = ( collection: DefinitionCollection | "rules", itemIdentifier: string ) =>
    {
        const references = collection === "rules" ? []
            : referencedDefinitionIdentifiers ( model, collection, itemIdentifier );
        const warning = references.length === 0 ? "" : ` This leaves references in: ${ references.join ( ", " ) }.`;
        if ( !window.confirm ( `Delete ${ itemIdentifier }?${ warning }` ) )
        {

            // Return without a value after completing this code path.

            return;
        }
        updateModel
        (
            collection === "rules"
            ?
                {
                    ...model, rules: model.rules.filter ( rule => rule.id !== itemIdentifier )
                }
            : removeDefinition ( model, collection, itemIdentifier )
        );
        setSelection
        (
            {
                section: collection, identifier: ""
            }
        );
    };

    //-----------------------------------------------------------------------------------------------------------------
    // Function: addDefinition
    //
    // Description:
    //
    //   Adds definition using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   collection (EditorCollectionSection):
    //     The collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The add definition result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const addDefinition = ( collection: EditorCollectionSection ) =>
    {
        const result = insertNewModelItem ( model, collection );
        if ( !result )
        {
            // Return without a value after completing this code path.

            return;
        }
        updateModel ( result.model );
        setSelection
        (
            {
                section: collection, identifier: result.identifier
            }
        );
    };

    const detailType = selectedIdentifier ? "Element details" : section === "model" ? "Model details" : "Collection";
    const detailHeading = selectedItem?.name || selectedIdentifier
        || ( section === "model" ? model.name : section [ 0 ].toUpperCase () + section.slice ( 1 ) );

    // Return the rendered interface element.

    return <section className="editor" aria-labelledby="editor-heading" aria-describedby="editor-keyboard-help"
        onKeyDown={ handleFormKeyDown }>
        <p id="editor-keyboard-help" className="visually-hidden">Use vertical arrows between single-line text fields,
            horizontal arrows between choice fields, boundary arrows around multiline fields, and Enter to advance from
            a single-line field.</p>
        <p className="eyebrow">{ detailType }</p>
        <h2 id="editor-heading" tabIndex={ -1 }>{ detailHeading }</h2>
        { section === "model" && <div className="form-grid model-form">
            <IdentifierField value={ model.id } update={ value => updateModel
            (
                (
                    {
                        ...model, id: value
                    }
                )
            ) } />
            <label data-model-field="name">Name<input value={ model.name } required maxLength={ MAXIMUM_DISPLAY_NAME_LENGTH }
                onChange={ event => updateModel
                (
                    (
                        {
                            ...model, name: event.target.value
                        }
                    )
                ) } /></label>
            <label data-model-field="schemaVersion">Schema version<input value={ model.schemaVersion } disabled /></label>
            <label className="wide" data-model-field="description">Description<textarea value={ model.description ?? "" }
                maxLength={ MAXIMUM_DESCRIPTION_LENGTH }
                onChange={ event => updateModel
                (
                    (
                        {
                            ...model, description: event.target.value
                        }
                    )
                ) } /></label>
        </div> }
        { collectionSection && !selectedIdentifier && <div className="collection-overview">
            <div className="collection-actions">
                <button type="button"
                    disabled={ model [ collectionSection ].length >= MODEL_COLLECTION_LIMITS [ collectionSection ] }
                    title={ model [ collectionSection ].length >= MODEL_COLLECTION_LIMITS [ collectionSection ]
                        ? "This collection has reached the contract limit." : undefined }
                    onClick={ () => addDefinition ( collectionSection ) }>
                    Add { collectionSection === "payloads" ? "payload" : collectionSection.slice ( 0, -1 ) }</button>
            </div>
            <CollectionPagination { ...collectionPage } itemCount={ collectionItems.length }
                label={ `${ collectionSection [ 0 ].toUpperCase () + collectionSection.slice ( 1 ) } collection items` }
                setPageIndex={ pageIndex => setCollectionPageIndexes
                (
                    currentPageIndexes => ( (
                        {
                            ...currentPageIndexes, [ collectionSection ]: pageIndex
                        }
                    ) )
                ) } />
            <table aria-label={ `${ collectionSection [ 0 ].toUpperCase () + collectionSection.slice ( 1 ) } collection` }>
                <thead><tr><th>Identifier</th><th>Name</th><th>Description</th></tr></thead><tbody>
                { visibleItems.map
                (
                    item => <tr key={ item.id }
                        onDoubleClick={ () => setSelection
                        (
                            (
                                {
                                    section: collectionSection, identifier: item.id
                                }
                            )
                        ) }>
                        <td><button type="button" className="table-link"
                            onClick={ () => setSelection
                            (
                                (
                                    {
                                        section: collectionSection, identifier: item.id
                                    }
                                )
                            ) }>{ item.id }</button></td>
                        <td><input aria-label={ `${ item.id } name` } value={ item.name }
                            onChange={ event => editCollection
                            (
                                collectionSection, item.id, (
                                    {
                                        name: event.target.value
                                    }
                                )
                            ) } /></td>
                        <td><input aria-label={ `${ item.id } description` } value={ item.description ?? "" }
                            onChange={ event => editCollection
                            (
                                collectionSection, item.id, (
                                    {
                                        description: event.target.value
                                    }
                                )
                            ) } /></td>
                    </tr>
                ) }
            </tbody></table>
        </div> }
        { selectedIdentifier && <div className="detail-form">
            { selectedItem && section === "parameters" && <ParameterForm key={ selectedItem.id }
                parameter={ selectedItem as ParameterDefinition }
                identifiers={ model.parameters.map ( item => item.id ) }
                edit={ changes => editCollection ( "parameters", selectedItem.id, changes ) }
                rename={ value => rename ( "parameters", selectedItem.id, value ) }
                remove={ () => remove ( "parameters", selectedItem.id ) } /> }
            { selectedItem && section === "payloads" && <PayloadForm key={ selectedItem.id }
                payload={ selectedItem as PayloadDefinition } model={ model }
                identifiers={ model.payloads.map ( item => item.id ) }
                edit={ changes => editCollection ( "payloads", selectedItem.id, changes ) }
                rename={ value => rename ( "payloads", selectedItem.id, value ) }
                remove={ () => remove ( "payloads", selectedItem.id ) } /> }
            { selectedItem && section === "events" && <EventForm key={ selectedItem.id }
                event={ selectedItem as EventType } payloads={ model.payloads }
                identifiers={ model.events.map ( item => item.id ) }
                edit={ changes => editCollection ( "events", selectedItem.id, changes ) }
                rename={ value => rename ( "events", selectedItem.id, value ) }
                remove={ () => remove ( "events", selectedItem.id ) } /> }
            { selectedItem && section === "conditions" && <ConditionForm key={ selectedItem.id }
                condition={ selectedItem as Condition } identifiers={ model.conditions.map ( item => item.id ) }
                parameterIdentifiers={ parameterNames }
                edit={ changes => editCollection ( "conditions", selectedItem.id, changes ) }
                rename={ value => rename ( "conditions", selectedItem.id, value ) }
                remove={ () => remove ( "conditions", selectedItem.id ) } /> }
            { selectedItem && section === "actions" && <ActionForm key={ selectedItem.id }
                action={ selectedItem as Action } identifiers={ model.actions.map ( item => item.id ) }
                edit={ changes => editCollection ( "actions", selectedItem.id, changes ) }
                rename={ value => rename ( "actions", selectedItem.id, value ) }
                remove={ () => remove ( "actions", selectedItem.id ) } /> }
            { selectedItem && section === "rules" && <RuleForm key={ selectedItem.id }
                rule={ selectedItem as Rule } model={ model } identifiers={ model.rules.map ( item => item.id ) }
                edit={ changes => editCollection ( "rules", selectedItem.id, changes ) }
                rename={ value => rename ( "rules", selectedItem.id, value ) }
                remove={ () => remove ( "rules", selectedItem.id ) } /> }
        </div> }
    </section>;
}
