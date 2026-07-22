//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Accessible, display-mode LaTeX rendering for contextual User Guide formulas.
//
//---------------------------------------------------------------------------------------------------------------------

import katex from "katex";
import "katex/dist/katex.min.css";

//---------------------------------------------------------------------------------------------------------------------
// Interface: MathFormulaProperties
//
// Description:
//
//   Defines the named fields and callable operations that make up math formula properties.
//
//---------------------------------------------------------------------------------------------------------------------
interface MathFormulaProperties
{
    source: string;
}

//---------------------------------------------------------------------------------------------------------------------
// Function: MathFormula
//
// Description:
//
//   Renders the math formula component from its supplied state and callbacks, producing the corresponding
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

export function MathFormula (
{
    source
}: MathFormulaProperties )
{
    const markup = katex.renderToString
    (
        source,
        {
            displayMode: true,
            errorColor: "currentColor",
            output: "htmlAndMathml",
            strict: "error",
            throwOnError: false,
            trust: false
        }
    );

    // KaTeX escapes source text and disables trusted commands above. Its generated HTML is required for typesetting,
    // while the paired MathML tree supplies an accessible representation to assistive technologies.

    // Return the rendered interface element.

    return <div className="user-guide-formula" data-latex-source={ source }
        dangerouslySetInnerHTML={ (
            {
                __html: markup
            }
        ) } />;
}
