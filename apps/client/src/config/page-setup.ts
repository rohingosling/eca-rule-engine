//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Compile-time page-setup choices and print defaults.
//
//---------------------------------------------------------------------------------------------------------------------

export const PAGE_ORIENTATIONS = [ "portrait", "landscape" ] as const;
//---------------------------------------------------------------------------------------------------------------------
// Type: PageOrientation
//
// Description:
//
//   Defines the valid representation of page orientation.
//
//---------------------------------------------------------------------------------------------------------------------
export type PageOrientation = typeof PAGE_ORIENTATIONS [ number ];

export const PAGE_SIZES = [ "A4", "Letter", "Legal" ] as const;
//---------------------------------------------------------------------------------------------------------------------
// Type: PageSize
//
// Description:
//
//   Defines the valid representation of page size.
//
//---------------------------------------------------------------------------------------------------------------------
export type PageSize = typeof PAGE_SIZES [ number ];

export const DEFAULT_PAGE_ORIENTATION = "portrait" satisfies PageOrientation;
export const DEFAULT_PAGE_SIZE = "A4" satisfies PageSize;
export const PRINT_PAGE_MARGIN_MILLIMETERS = 15;
