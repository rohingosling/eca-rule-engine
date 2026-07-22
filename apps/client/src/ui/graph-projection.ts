//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Deterministic, evaluation-neutral projection of an ECA model into graph nodes and rule connections.
//
//---------------------------------------------------------------------------------------------------------------------

import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { StatelessECAModel } from "../contracts/model.generated";
import type { EditorCollectionSection } from "./StructuredEditor";

//---------------------------------------------------------------------------------------------------------------------
// Type: GraphDefinitionSection
//
// Description:
//
//   Defines the valid representation of graph definition section.
//
//---------------------------------------------------------------------------------------------------------------------
export type GraphDefinitionSection = "events" | "conditions" | "actions";
//---------------------------------------------------------------------------------------------------------------------
// Type: GraphNodeKind
//
// Description:
//
//   Defines the valid representation of graph node kind.
//
//---------------------------------------------------------------------------------------------------------------------
export type GraphNodeKind = "event" | "condition" | "action" | "unresolved";

//---------------------------------------------------------------------------------------------------------------------
// Interface: ModelGraphNodeData
//
// Description:
//
//   Defines the named fields and callable operations that make up model graph node data.
//
//---------------------------------------------------------------------------------------------------------------------
export interface ModelGraphNodeData extends Record<string, unknown>
{
    diagnostic: boolean;
    identifier: string;
    kind: GraphNodeKind;
    label: string;
    section: GraphDefinitionSection;
}

//---------------------------------------------------------------------------------------------------------------------
// Interface: ModelGraphEdgeData
//
// Description:
//
//   Defines the named fields and callable operations that make up model graph edge data.
//
//---------------------------------------------------------------------------------------------------------------------
export interface ModelGraphEdgeData extends Record<string, unknown>
{
    diagnostic: boolean;
    ruleIdentifier: string;
}

//---------------------------------------------------------------------------------------------------------------------
// Type: ModelGraphNode
//
// Description:
//
//   Defines the valid representation of model graph node.
//
//---------------------------------------------------------------------------------------------------------------------
export type ModelGraphNode = Node<ModelGraphNodeData, GraphNodeKind>;
//---------------------------------------------------------------------------------------------------------------------
// Type: ModelGraphEdge
//
// Description:
//
//   Defines the valid representation of model graph edge.
//
//---------------------------------------------------------------------------------------------------------------------
export type ModelGraphEdge = Edge<ModelGraphEdgeData>;

//---------------------------------------------------------------------------------------------------------------------
// Interface: ModelGraphProjection
//
// Description:
//
//   Defines the named fields and callable operations that make up model graph projection.
//
//---------------------------------------------------------------------------------------------------------------------
export interface ModelGraphProjection
{
    edges: ModelGraphEdge[];
    nodes: ModelGraphNode[];
}

const HORIZONTAL_SPACING_PIXELS = 320;
const VERTICAL_SPACING_PIXELS   = 120;
const GRAPH_NODE_WIDTH_PIXELS   = 220;

const GRAPH_SECTIONS: GraphDefinitionSection[] = [ "events", "conditions", "actions" ];

//---------------------------------------------------------------------------------------------------------------------
// Function: singularLabel
//
// Description:
//
//   Performs the singular label operation using the supplied inputs and current state.
//
// Arguments:
//
//   section (GraphDefinitionSection):
//     The section used by this operation.
//
// Returns:
//
//   The singular label result.
//
//---------------------------------------------------------------------------------------------------------------------

function singularLabel ( section: GraphDefinitionSection ): string
{

    // Return the value selected by the evaluated condition.

    return section === "events" ? "Event" : section === "conditions" ? "Condition" : "Action";
}

//---------------------------------------------------------------------------------------------------------------------
// Function: nodeIdentifier
//
// Description:
//
//   Performs the node identifier operation using the supplied inputs and current state.
//
// Arguments:
//
//   section (GraphDefinitionSection):
//     The section used by this operation.
//
//   index (number):
//     The index used by this operation.
//
//   identifier (string):
//     The stable identifier used to locate the corresponding model element.
//
// Returns:
//
//   The node identifier result.
//
//---------------------------------------------------------------------------------------------------------------------

function nodeIdentifier ( section: GraphDefinitionSection, index: number, identifier: string ): string
{

    // Return the value produced by this code path.

    return `${ section }:${ index }:${ encodeURIComponent ( identifier ) }`;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: unresolvedNodeIdentifier
//
// Description:
//
//   Performs the unresolved node identifier operation using the supplied inputs and current state.
//
// Arguments:
//
//   section (GraphDefinitionSection):
//     The section used by this operation.
//
//   identifier (string):
//     The stable identifier used to locate the corresponding model element.
//
// Returns:
//
//   The unresolved node identifier result.
//
//---------------------------------------------------------------------------------------------------------------------

function unresolvedNodeIdentifier ( section: GraphDefinitionSection, identifier: string ): string
{

    // Return the value produced by this code path.

    return `unresolved:${ section }:${ encodeURIComponent ( identifier || "empty-reference" ) }`;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: projectModelGraph
//
// Description:
//
//   Performs the project model graph operation using the supplied inputs and current state.
//
// Arguments:
//
//   model (StatelessECAModel):
//     The compiled or contract model inspected by this operation.
//
// Returns:
//
//   The project model graph result.
//
//---------------------------------------------------------------------------------------------------------------------

export function projectModelGraph ( model: StatelessECAModel ): ModelGraphProjection
{
    const nodes: ModelGraphNode[] = [];
    const nodeIdentifiers = new Map<GraphDefinitionSection, Map<string, string>> ();

    GRAPH_SECTIONS.forEach
    (
        ( section, sectionIndex ) =>
        {
            const identifiers = new Map<string, string> ();
            model [ section ].forEach
            (
                ( definition, definitionIndex ) =>
                {
                    const identifier = nodeIdentifier ( section, definitionIndex, definition.id );
                    if ( !identifiers.has ( definition.id ) )
                    {
                        identifiers.set ( definition.id, identifier );
                    }
                    nodes.push
                    (
                        {
                            id: identifier,
                            type: section === "events" ? "event" : section === "conditions" ? "condition" : "action",
                            position:
                            {
                                x: sectionIndex * HORIZONTAL_SPACING_PIXELS,
                                y: definitionIndex * VERTICAL_SPACING_PIXELS
                            },
                            width: GRAPH_NODE_WIDTH_PIXELS,
                            data:
                            {
                                diagnostic: false,
                                identifier: definition.id,
                                kind: section === "events" ? "event" : section === "conditions" ? "condition" : "action",
                                label: definition.name || definition.id,
                                section
                            }
                        }
                    );
                }
            );
            nodeIdentifiers.set ( section, identifiers );
        }
    );

    const unresolvedNodes = new Map<string, ModelGraphNode> ();
    //-----------------------------------------------------------------------------------------------------------------
    // Function: resolveReference
    //
    // Description:
    //
    //   Resolves reference using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   section (GraphDefinitionSection):
    //     The section used by this operation.
    //
    //   reference (string):
    //     The reference used by this operation.
    //
    // Returns:
    //
    //   The resolve reference result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const resolveReference = ( section: GraphDefinitionSection, reference: string ): string =>
    {
        const resolvedIdentifier = nodeIdentifiers.get ( section )?.get ( reference );
        if ( resolvedIdentifier )
        {

            // Return the resolved identifier.

            return resolvedIdentifier;
        }

        const identifier = unresolvedNodeIdentifier ( section, reference );
        if ( !unresolvedNodes.has ( identifier ) )
        {
            const sectionIndex = GRAPH_SECTIONS.indexOf ( section );
            const missingIndex = [ ...unresolvedNodes.values () ].filter (
                node => node.data.section === section ).length;
            unresolvedNodes.set
            (
                identifier,
                {
                    id: identifier,
                    type: "unresolved",
                    position:
                    {
                        x: sectionIndex * HORIZONTAL_SPACING_PIXELS,
                        y: ( model [ section ].length + missingIndex ) * VERTICAL_SPACING_PIXELS
                    },
                    width: GRAPH_NODE_WIDTH_PIXELS,
                    data:
                    {
                        diagnostic: true,
                        identifier: reference,
                        kind: "unresolved",
                        label: `Missing ${ singularLabel ( section ).toLowerCase () }: ${ reference || "empty reference" }`,
                        section
                    }
                }
            );
        }

        // Return the identifier.

        return identifier;
    };

    const edges = model.rules.flatMap<ModelGraphEdge>
    (
        ( rule, ruleIndex ) =>
        {
            const eventIdentifier     = resolveReference ( "events", rule.event );
            const conditionIdentifier = resolveReference ( "conditions", rule.condition );
            const actionIdentifier    = resolveReference ( "actions", rule.action );
            const diagnostic = !nodeIdentifiers.get ( "events" )?.has ( rule.event )
                || !nodeIdentifiers.get ( "conditions" )?.has ( rule.condition )
                || !nodeIdentifiers.get ( "actions" )?.has ( rule.action );
            const commonProperties =
            {
                animated: false,
                className: diagnostic ? "graph-rule-edge diagnostic" : "graph-rule-edge",
                data:
                {
                    diagnostic, ruleIdentifier: rule.id
                },
                label: rule.name || rule.id,
                markerEnd:
                {
                    type: MarkerType.ArrowClosed
                },
                selectable: true
            };

            // Return the assembled array value.

            return [
                {
                    ...commonProperties,
                    id: `rule:${ ruleIndex }:event-condition`,
                    source: eventIdentifier,
                    target: conditionIdentifier
                },
                {
                    ...commonProperties,
                    id: `rule:${ ruleIndex }:condition-action`,
                    source: conditionIdentifier,
                    target: actionIdentifier
                }
            ];
        }
    );

    // Return the value produced by this code path.

    return (
        {
            edges,
            nodes: [ ...nodes, ...unresolvedNodes.values () ]
        }
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: graphNodeSelection
//
// Description:
//
//   Performs the graph node selection operation using the supplied inputs and current state.
//
// Arguments:
//
//   node (ModelGraphNode):
//     The node used by this operation.
//
// Returns:
//
//   The graph node selection result.
//
//---------------------------------------------------------------------------------------------------------------------

export function graphNodeSelection ( node: ModelGraphNode ):
    {
        identifier: string; section: EditorCollectionSection
    }
{

    // Return the value selected by the evaluated condition.

    return (
        {
            identifier: node.data.diagnostic ? "" : node.data.identifier,
            section: node.data.section
        }
    );
}
