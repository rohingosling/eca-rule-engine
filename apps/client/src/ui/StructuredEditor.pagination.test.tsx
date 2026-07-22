//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Bounded-rendering and accessible-navigation coverage for very large model collections.
//
//---------------------------------------------------------------------------------------------------------------------

import axe from "axe-core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MODEL_TREE_COLLECTION_PAGE_SIZE, STRUCTURED_EDITOR_COLLECTION_PAGE_SIZE } from "../config/editor-layout";
import { MAXIMUM_RULES } from "../contracts/contract-limits";
import type { Rule, StatelessECAModel } from "../contracts/model.generated";
import { createEmptyModel } from "../document/model-document";
import { calculateCollectionPage } from "./CollectionPagination";
import { ModelTree, StructuredEditor } from "./StructuredEditor";

const rules: Rule[] = Array.from
(
    {
        length: MAXIMUM_RULES
    }, ( _, index ) => (
    {
        id: `rule-${ index }`,
        name: `Rule ${ index }`,
        event: "event-one",
        condition: "condition-one",
        action: "action-one"
    } )
);

const largeModel: StatelessECAModel =
{
    ...createEmptyModel (),
    events: [
    {
        id: "event-one", name: "Event one"
    } ],
    conditions: [
    {
        id: "condition-one", name: "Condition one", dependencies: [],
        predicate:
        {
            name: "always", arguments:
            {
            }
        }
    } ],
    actions: [
    {
        id: "action-one", name: "Action one", parameters:
        {
        }
    } ],
    rules
};

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: bounded model-collection rendering
//
// Description:
//
//   Verifies bounded model-collection rendering and records the expected externally observable behavior for future
//   changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "bounded model-collection rendering", () =>
    {
        //-----------------------------------------------------------------------------------------------------------------
        // Test: clamps empty and out-of-range page requests
        //
        // Description:
        //
        //   Verifies clamps empty and out-of-range page requests and records the expected externally observable behavior
        //   for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "clamps empty and out-of-range page requests", () =>
            {
                expect ( calculateCollectionPage ( 0, 999, 100 ) ).toEqual
                (
                    {
                        startIndex: 0, endIndexExclusive: 0, pageIndex: 0, totalPages: 1
                    }
                );
                expect ( calculateCollectionPage ( 201, 999, 100 ) ).toEqual
                (
                    {
                        startIndex: 200, endIndexExclusive: 201, pageIndex: 2, totalPages: 3
                    }
                );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: bounds expanded tree leaves while keyboard paging reaches the final rule
        //
        // Description:
        //
        //   Verifies bounds expanded tree leaves while keyboard paging reaches the final rule and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "bounds expanded tree leaves while keyboard paging reaches the final rule", async () =>
            {
                const user = userEvent.setup ();
                const
                    {
                        container
                    } = render
                    (
                        <ModelTree model={ largeModel }
                        selection={
                            {
                                section: "rules", identifier: ""
                            } }
                        setSelection={ vi.fn () } expandedSections={ [ "rules" ] } toggleSection={ vi.fn () } />
                    );

                expect ( container.querySelectorAll ( ".tree-children > .tree-item-row > .tree-label" ) )
                    .toHaveLength ( MODEL_TREE_COLLECTION_PAGE_SIZE );
                expect
                (
                    screen.getByRole
                    (
                        "group",
                        {
                            name: "Rules tree items pagination"
                        }
                    )
                )
                    .not.toHaveTextContent ( /Items|Page/ );
                expect
                (
                    screen.queryByRole
                    (
                        "button",
                        {
                            name: `Rule ${ MODEL_TREE_COLLECTION_PAGE_SIZE }`
                        }
                    )
                )
                    .toBeNull ();

                const nextPageButton = screen.getByRole
                (
                    "button",
                    {
                        name: "Next Rules tree items page"
                    }
                );
                nextPageButton.focus ();
                await user.keyboard ( "{Enter}" );
                expect
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: `Rule ${ MODEL_TREE_COLLECTION_PAGE_SIZE }`
                        }
                    )
                )
                    .toBeVisible ();

                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Last Rules tree items page"
                        }
                    )
                );
                expect
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: `Rule ${ MAXIMUM_RULES - 1 }`
                        }
                    )
                ).toBeVisible ();
                expect ( container.querySelectorAll ( ".tree-children > .tree-item-row > .tree-label" ) )
                    .toHaveLength ( MODEL_TREE_COLLECTION_PAGE_SIZE );
                expect ( ( await axe.run ( container ) ).violations ).toEqual ( [] );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: keeps single-page tree collections free of pagination messages and controls
        //
        // Description:
        //
        //   Verifies keeps single-page tree collections free of pagination messages and controls and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "keeps single-page tree collections free of pagination messages and controls", () =>
            {
                render
                (
                    <ModelTree model={
                    {
                        ...largeModel, rules: largeModel.rules.slice ( 0, 1 )
                    } }
                    selection={
                        {
                            section: "rules", identifier: ""
                        } }
                    setSelection={ vi.fn () } expandedSections={ [ "rules" ] } toggleSection={ vi.fn () } />
                );

                expect
                (
                    screen.queryByRole
                    (
                        "group",
                        {
                            name: "Rules tree items pagination"
                        }
                    )
                ).toBeNull ();
                expect
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Rule 0"
                        }
                    )
                ).toBeVisible ();
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: bounds editable rows while paging keeps every rule reachable
        //
        // Description:
        //
        //   Verifies bounds editable rows while paging keeps every rule reachable and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "bounds editable rows while paging keeps every rule reachable", async () =>
            {
                const user = userEvent.setup ();
                const
                    {
                        container
                    } = render
                    (
                        <StructuredEditor model={ largeModel }
                        selection={
                            {
                                section: "rules", identifier: ""
                            } }
                        setSelection={ vi.fn () } updateModel={ vi.fn () } />
                    );
                const collectionTable = screen.getByRole
                (
                    "table",
                    {
                        name: "Rules collection"
                    }
                );

                expect
                (
                    screen.queryByRole
                    (
                        "heading",
                        {
                            name: "Event-grouped outcomes"
                        }
                    )
                ).toBeNull ();
                expect ( collectionTable.querySelectorAll ( "tbody tr" ) ).toHaveLength ( STRUCTURED_EDITOR_COLLECTION_PAGE_SIZE );
                expect ( screen.queryByLabelText ( `rule-${ STRUCTURED_EDITOR_COLLECTION_PAGE_SIZE } name` ) ).toBeNull ();

                const nextPageButton = screen.getByRole
                (
                    "button",
                    {
                        name: "Next Rules collection items page"
                    }
                );
                nextPageButton.focus ();
                await user.keyboard ( "{Enter}" );
                expect ( screen.getByLabelText ( `rule-${ STRUCTURED_EDITOR_COLLECTION_PAGE_SIZE } name` ) ).toBeVisible ();

                await user.click
                (
                    screen.getByRole
                    (
                        "button",
                        {
                            name: "Last Rules collection items page"
                        }
                    )
                );
                expect ( screen.getByLabelText ( `rule-${ MAXIMUM_RULES - 1 } name` ) ).toBeVisible ();
                expect ( collectionTable.querySelectorAll ( "tbody tr" ) ).toHaveLength ( STRUCTURED_EDITOR_COLLECTION_PAGE_SIZE );
                expect ( ( await axe.run ( container ) ).violations ).toEqual ( [] );
            }
        );
    }
);
