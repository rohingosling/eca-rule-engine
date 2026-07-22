//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Read-only, context-aware academic guide for the model laboratory workspace.
//
//---------------------------------------------------------------------------------------------------------------------

import { useId } from "react";
import { MathFormula } from "./MathFormula";
import { USER_GUIDE_ARTICLES, type UserGuideTopic } from "./user-guide-content";

//---------------------------------------------------------------------------------------------------------------------
// Interface: UserGuideProperties
//
// Description:
//
//   Defines the named fields and callable operations that make up user guide properties.
//
//---------------------------------------------------------------------------------------------------------------------
interface UserGuideProperties
{
    contextLabel?: string;
    topic: UserGuideTopic;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: UserGuide
//
// Description:
//
//   Renders the user guide component from its supplied state and callbacks, producing the corresponding user-interface
//   element.
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

export function UserGuide (
{
    contextLabel, topic
}: UserGuideProperties )
{
    const headingIdentifier = useId ();
    const article = USER_GUIDE_ARTICLES [ topic ];

    // Return the rendered interface element.

    return <aside className="user-guide-panel" aria-labelledby={ headingIdentifier }>
        <p className="eyebrow">User guide</p>
        <h2 id={ headingIdentifier }>{ article.title }</h2>
        { contextLabel && <p className="user-guide-context">Selected: { contextLabel }</p> }
        <section className="user-guide-section">
            <h3>Mathematical context</h3>
            <p>{ article.definition }</p>
            { article.formula && <MathFormula source={ article.formula } /> }
            <p className="user-guide-paper-reference">{ article.paperReference }</p>
        </section>
        <section className="user-guide-section">
            <h3>What to do here</h3>
            <ol>{ article.guidance.map ( instruction => <li key={ instruction }>{ instruction }</li> ) }</ol>
        </section>
    </aside>;
}
