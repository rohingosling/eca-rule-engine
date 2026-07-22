//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Interactive graph projection for event, condition, action, and rule navigation.
//
//---------------------------------------------------------------------------------------------------------------------

import {
    Background, BackgroundVariant, Controls, MiniMap, ReactFlow, type EdgeMouseHandler, Handle,
    type NodeMouseHandler, type NodeProps, Position, useEdgesState, useNodesState
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo } from "react";
import type { StatelessECAModel } from "../contracts/model.generated";
import type { EditorSelection } from "./StructuredEditor";
import {
    graphNodeSelection, type ModelGraphEdge, type ModelGraphNode, projectModelGraph
} from "./graph-projection";

//---------------------------------------------------------------------------------------------------------------------
// Interface: ModelGraphProperties
//
// Description:
//
//   Defines the named fields and callable operations that make up model graph properties.
//
//---------------------------------------------------------------------------------------------------------------------
interface ModelGraphProperties
{
    model: StatelessECAModel;
    openSelection: ( selection: EditorSelection ) => void;
    selection: EditorSelection;
    setSelection: ( selection: EditorSelection ) => void;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: GraphDefinitionNode
//
// Description:
//
//   Renders the graph definition node component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (NodeProps<ModelGraphNode>):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

function GraphDefinitionNode ( properties: NodeProps<ModelGraphNode> )
{
    const typeLabel = properties.data.kind === "unresolved" ? "Unresolved reference"
        : properties.data.kind [ 0 ].toUpperCase () + properties.data.kind.slice ( 1 );

    // Return the rendered interface element.

    return <article className={ properties.data.diagnostic ? "graph-node diagnostic" : `graph-node ${ properties.data.kind }` }
        aria-label={ `${ typeLabel }: ${ properties.data.identifier }` }>
        <Handle type="target" position={ Position.Left } />
        <span className="graph-node-kind">{ typeLabel }</span>
        <strong>{ properties.data.label }</strong>
        <span className="graph-node-identifier">{ properties.data.identifier || "Empty reference" }</span>
        <Handle type="source" position={ Position.Right } />
    </article>;
}

const GRAPH_NODE_TYPES =
{
    action: GraphDefinitionNode,
    condition: GraphDefinitionNode,
    event: GraphDefinitionNode,
    unresolved: GraphDefinitionNode
};

//---------------------------------------------------------------------------------------------------------------------
// Function: mergeNodePositions
//
// Description:
//
//   Merges node positions using the supplied inputs and current state.
//
// Arguments:
//
//   projectedNodes (ModelGraphNode[]):
//     The projected nodes collection inspected or transformed by this operation.
//
//   currentNodes (ModelGraphNode[]):
//     The current nodes collection inspected or transformed by this operation.
//
//   selection (EditorSelection):
//     The selection used by this operation.
//
// Returns:
//
//   The merge node positions result.
//
//---------------------------------------------------------------------------------------------------------------------

function mergeNodePositions ( projectedNodes: ModelGraphNode[], currentNodes: ModelGraphNode[],
    selection: EditorSelection ): ModelGraphNode[]
{
    const currentPositions = new Map ( currentNodes.map ( node => [ node.id, node.position ] ) );

    // Return the value selected by the evaluated condition.

    return projectedNodes.map
    (
        node => ( (
            {
                ...node,
                position: currentPositions.get ( node.id ) ?? node.position,
                selected: !node.data.diagnostic && selection.section === node.data.section
                    && selection.identifier === node.data.identifier
            }
        ) )
    );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: ModelGraph
//
// Description:
//
//   Renders the model graph component from its supplied state and callbacks, producing the corresponding
//   user-interface element.
//
// Arguments:
//
//   properties (ModelGraphProperties):
//     The component properties that provide current state, policy values, and interaction callbacks.
//
// Returns:
//
//   The rendered React element for the component.
//
//---------------------------------------------------------------------------------------------------------------------

export function ModelGraph ( properties: ModelGraphProperties )
{
    const projection = useMemo ( () => projectModelGraph ( properties.model ), [ properties.model ] );
    const [ nodes, setNodes, onNodesChange ] = useNodesState<ModelGraphNode> ( projection.nodes );
    const [ edges, setEdges, onEdgesChange ] = useEdgesState<ModelGraphEdge> ( projection.edges );

    useEffect
    (
        () =>
        {
            setNodes ( currentNodes => mergeNodePositions ( projection.nodes, currentNodes, properties.selection ) );
            setEdges
            (
                projection.edges.map
                (
                    edge => ( (
                        {
                            ...edge, selected: properties.selection.section === "rules"
                                && properties.selection.identifier === edge.data?.ruleIdentifier
                        }
                    ) )
                )
            );
        }, [ projection, properties.selection, setEdges, setNodes ]
    );

    //-----------------------------------------------------------------------------------------------------------------
    // Function: selectNode
    //
    // Description:
    //
    //   Selects node using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   _event (inferred):
    //     The event used by this operation.
    //
    //   node (inferred):
    //     The node used by this operation.
    //
    // Returns:
    //
    //   The select node result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const selectNode: NodeMouseHandler<ModelGraphNode> = ( _event, node ) =>
    {
        properties.setSelection ( graphNodeSelection ( node ) );
    };
    //-----------------------------------------------------------------------------------------------------------------
    // Function: openNode
    //
    // Description:
    //
    //   Opens node using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   _event (inferred):
    //     The event used by this operation.
    //
    //   node (inferred):
    //     The node used by this operation.
    //
    // Returns:
    //
    //   The open node result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const openNode: NodeMouseHandler<ModelGraphNode> = ( _event, node ) =>
    {
        properties.openSelection ( graphNodeSelection ( node ) );
    };
    //-----------------------------------------------------------------------------------------------------------------
    // Function: selectEdge
    //
    // Description:
    //
    //   Selects edge using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   _event (inferred):
    //     The event used by this operation.
    //
    //   edge (inferred):
    //     The edge used by this operation.
    //
    // Returns:
    //
    //   The select edge result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const selectEdge: EdgeMouseHandler<ModelGraphEdge> = ( _event, edge ) =>
    {
        properties.setSelection
        (
            {
                identifier: edge.data?.ruleIdentifier ?? "", section: "rules"
            }
        );
    };
    //-----------------------------------------------------------------------------------------------------------------
    // Function: openEdge
    //
    // Description:
    //
    //   Opens edge using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   _event (inferred):
    //     The event used by this operation.
    //
    //   edge (inferred):
    //     The edge used by this operation.
    //
    // Returns:
    //
    //   The open edge result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    const openEdge: EdgeMouseHandler<ModelGraphEdge> = ( _event, edge ) =>
    {
        properties.openSelection
        (
            {
                identifier: edge.data?.ruleIdentifier ?? "", section: "rules"
            }
        );
    };
    const graphSelectionAvailable = ( properties.selection.section === "events"
        || properties.selection.section === "conditions" || properties.selection.section === "actions"
        || properties.selection.section === "rules" ) && Boolean ( properties.selection.identifier );

    // Return the rendered interface element.

    return <section className="model-graph" aria-labelledby="model-graph-heading">
        <div className="model-graph-heading">
            <div><p className="eyebrow">Graph projection</p><h2 id="model-graph-heading">Rule relationships</h2></div>
            <div className="model-graph-guidance"><p>Drag to arrange. Pan and zoom affect only this view.</p>
                <button type="button" disabled={ !graphSelectionAvailable }
                    onClick={ () => properties.openSelection ( properties.selection ) }>Open selection in Model</button>
            </div>
        </div>
        { nodes.length === 0
            ? <p className="empty-state">Add an event, condition, action, or rule to populate the graph.</p>
            : <div className="model-graph-canvas">
                <ReactFlow<ModelGraphNode, ModelGraphEdge> nodes={ nodes } edges={ edges } nodeTypes={ GRAPH_NODE_TYPES }
                    onNodesChange={ onNodesChange } onEdgesChange={ onEdgesChange } onNodeClick={ selectNode }
                    onNodeDoubleClick={ openNode } onEdgeClick={ selectEdge } onEdgeDoubleClick={ openEdge }
                    fitView fitViewOptions={
                        {
                            padding: .18
                        } } minZoom={ .2 } maxZoom={ 2 } nodesConnectable={ false }
                    aria-label="ECA rule graph">
                    <Background variant={ BackgroundVariant.Dots } gap={ 24 } size={ 1 } />
                    <MiniMap pannable zoomable ariaLabel="Rule graph minimap" />
                    <Controls showInteractive={ false } />
                </ReactFlow>
            </div> }
    </section>;
}
