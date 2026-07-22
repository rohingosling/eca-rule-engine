//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Compile-time editor sizing, splitter, virtualized-code, and form-spacing defaults.
//
//---------------------------------------------------------------------------------------------------------------------

export const MINIMUM_MODEL_TREE_WIDTH_PIXELS = 170;
export const MINIMUM_USER_GUIDE_WIDTH_PIXELS = 220;
export const DEFAULT_SIDE_PANEL_VIEWPORT_RATIO = 1 / 3;
export const MAXIMUM_SIDE_PANEL_VIEWPORT_RATIO = 0.45;
export const SPLITTER_KEYBOARD_STEP_PIXELS = 10;
export const SPLITTER_WIDTH_PIXELS = 5;

export const MODEL_TREE_WIDTH_STORAGE_KEY = "eca-master-width";
export const USER_GUIDE_WIDTH_STORAGE_KEY = "eca-user-guide-width";

export const FORM_DELETE_SEPARATOR_GAP_REM = 2.25;
export const USER_GUIDE_FORMULA_BOTTOM_GAP_REM = 1;
export const MODEL_TREE_COLLECTION_PAGE_SIZE = 50;
export const STRUCTURED_EDITOR_COLLECTION_PAGE_SIZE = 100;
export const SIMULATOR_CONDITION_TRACE_PAGE_SIZE = 50;
export const SIMULATOR_RULE_TRACE_PAGE_SIZE = 100;
export const SIMULATOR_AMBIGUITY_IDENTIFIER_PREVIEW_LIMIT = 12;
export const SIMULATOR_EXPERIMENT_HISTORY_LIMIT = 20;
export const JSON_CODE_LINE_HEIGHT_PIXELS = 21;
export const JSON_CODE_OVERSCAN_LINES = 20;
export const DEFAULT_CODE_VIEWPORT_HEIGHT_PIXELS = 800;

export const EDITOR_LAYOUT_STYLE_VARIABLES =
{
    "--form-delete-separator-gap": `${ FORM_DELETE_SEPARATOR_GAP_REM }rem`,
    "--json-code-line-height": `${ JSON_CODE_LINE_HEIGHT_PIXELS }px`,
    "--splitter-width": `${ SPLITTER_WIDTH_PIXELS }px`,
    "--user-guide-formula-bottom-gap": `${ USER_GUIDE_FORMULA_BOTTOM_GAP_REM }rem`
} as const;
