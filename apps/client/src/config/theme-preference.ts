//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Compile-time theme options, defaults, storage keys, and browser queries.
//
//---------------------------------------------------------------------------------------------------------------------

export const THEME_MODES = [ "dark", "light", "system" ] as const;
//---------------------------------------------------------------------------------------------------------------------
// Type: ThemeMode
//
// Description:
//
//   Defines the valid representation of theme mode.
//
//---------------------------------------------------------------------------------------------------------------------
export type ThemeMode = typeof THEME_MODES [ number ];

export const DEFAULT_THEME_MODE = "system" satisfies ThemeMode;
export const THEME_PREFERENCE_STORAGE_KEY = "eca-theme";
export const SYSTEM_DARK_THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

//---------------------------------------------------------------------------------------------------------------------
// Function: isThemeMode
//
// Description:
//
//   Determines whether is theme mode holds for the supplied value or application state.
//
// Arguments:
//
//   value (string | null):
//     The value used by this operation.
//
// Returns:
//
//   True when the requested condition holds; otherwise false.
//
//---------------------------------------------------------------------------------------------------------------------

export function isThemeMode ( value: string | null ): value is ThemeMode
{

    // Return the result produced by the delegated operation.

    return THEME_MODES.some ( themeMode => themeMode === value );
}

//---------------------------------------------------------------------------------------------------------------------
// Function: themeModeFromStorage
//
// Description:
//
//   Performs the theme mode from storage operation using the supplied inputs and current state.
//
// Arguments:
//
//   value (string | null):
//     The value used by this operation.
//
// Returns:
//
//   The theme mode from storage result.
//
//---------------------------------------------------------------------------------------------------------------------

export function themeModeFromStorage ( value: string | null ): ThemeMode
{

    // Return the value selected by the evaluated condition.

    return isThemeMode ( value ) ? value : DEFAULT_THEME_MODE;
}
