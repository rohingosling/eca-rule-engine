//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Exercises application config behavior and verifies its observable contract across representative inputs and
//   interactions.
//
//---------------------------------------------------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
    EDITOR_LAYOUT_STYLE_VARIABLES, JSON_CODE_LINE_HEIGHT_PIXELS, USER_GUIDE_FORMULA_BOTTOM_GAP_REM
} from "./editor-layout";
import { PROJECT_PAPER_URL, PROJECT_REPOSITORY_URL, PROJECT_WIKI_URL } from "./application-metadata";
import { DEFAULT_THEME_MODE, themeModeFromStorage } from "./theme-preference";

//---------------------------------------------------------------------------------------------------------------------
// Test Suite: client compile-time configuration
//
// Description:
//
//   Verifies client compile-time configuration and records the expected externally observable behavior for future
//   changes.
//
//---------------------------------------------------------------------------------------------------------------------
describe
(
    "client compile-time configuration", () =>
    {
        //-----------------------------------------------------------------------------------------------------------------
        // Test: rejects unknown stored themes and keeps the JSON line height synchronized
        //
        // Description:
        //
        //   Verifies rejects unknown stored themes and keeps the JSON line height synchronized and records the expected
        //   externally observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "rejects unknown stored themes and keeps the JSON line height synchronized", () =>
            {
                expect ( themeModeFromStorage ( "unknown" ) ).toBe ( DEFAULT_THEME_MODE );
                expect ( themeModeFromStorage ( "dark" ) ).toBe ( "dark" );
                expect ( EDITOR_LAYOUT_STYLE_VARIABLES [ "--json-code-line-height" ] )
                    .toBe ( `${ JSON_CODE_LINE_HEIGHT_PIXELS }px` );
                expect ( EDITOR_LAYOUT_STYLE_VARIABLES [ "--user-guide-formula-bottom-gap" ] )
                    .toBe ( `${ USER_GUIDE_FORMULA_BOTTOM_GAP_REM }rem` );
            }
        );

        //-----------------------------------------------------------------------------------------------------------------
        // Test: links Help commands to the published project documentation
        //
        // Description:
        //
        //   Verifies links Help commands to the published project documentation and records the expected externally
        //   observable behavior for future changes.
        //
        //-----------------------------------------------------------------------------------------------------------------
        it
        (
            "links Help commands to the published project documentation", () =>
            {
                expect ( PROJECT_REPOSITORY_URL ).toBe ( "https://github.com/rohingosling/eca-rule-engine" );
                expect ( PROJECT_WIKI_URL ).toBe ( "https://github.com/rohingosling/eca-rule-engine/wiki" );
                expect ( PROJECT_PAPER_URL )
                    .toBe ( "https://github.com/rohingosling/eca-rule-engine/blob/main/docs/technical-note/stateless-eca-rule-engine.pdf" );
            }
        );
    }
);
