//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Browser API shims shared by component and accessibility tests.
//
//---------------------------------------------------------------------------------------------------------------------

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach ( () => cleanup () );

Object.defineProperty
(
    window, "matchMedia",
    {
        configurable: true,
        value: vi.fn
        (
            ( query: string ) => (
            {
                addEventListener: vi.fn (),
                matches: false,
                media: query,
                removeEventListener: vi.fn ()
            })
        )
    }
);

//*********************************************************************************************************************
// Class: TestResizeObserver
//
// Description:
//
//   Encapsulates test resize observer state and behavior.
//
//*********************************************************************************************************************
class TestResizeObserver
{
    //-----------------------------------------------------------------------------------------------------------------
    // Method: disconnect
    //
    // Description:
    //
    //   Performs the disconnect operation using the supplied inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    disconnect (): void
    {
    }
    //-----------------------------------------------------------------------------------------------------------------
    // Method: observe
    //
    // Description:
    //
    //   Performs the observe operation using the supplied inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    observe (): void
    {
    }
    //-----------------------------------------------------------------------------------------------------------------
    // Method: unobserve
    //
    // Description:
    //
    //   Performs the unobserve operation using the supplied inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    unobserve (): void
    {
    }
}

globalThis.ResizeObserver = TestResizeObserver;

Object.defineProperty
(
    HTMLCanvasElement.prototype, "getContext",
    {
        configurable: true,
        value: vi.fn ( () => null )
    }
);

if ( !window.requestAnimationFrame )
{
    window.requestAnimationFrame = callback => window.setTimeout ( () => callback ( performance.now () ), 0 );
}
