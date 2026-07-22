//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Vite build and Vitest DOM-test configuration.
//
//---------------------------------------------------------------------------------------------------------------------

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const CONTENT_SECURITY_POLICY = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
    + "img-src 'self' data:; font-src 'self'; worker-src 'self'; connect-src 'none'; object-src 'none'; "
    + "base-uri 'none'; form-action 'none'";

//---------------------------------------------------------------------------------------------------------------------
// Function: productionSecurityPolicy
//
// Description:
//
//   Performs the production security policy operation using the supplied inputs and current state.
//
// Returns:
//
//   The production security policy result.
//
//---------------------------------------------------------------------------------------------------------------------

function productionSecurityPolicy ()
{

    // Return the assembled object value.

    return {
        name: "production-security-policy",
        transformIndexHtml:
        {
            order: "pre" as const,
            handler: () => [
                {
                    tag: "meta",
                    attrs:
                    {
                        "http-equiv": "Content-Security-Policy",
                        content: CONTENT_SECURITY_POLICY
                    },
                    injectTo: "head-prepend" as const
                },
                {
                    tag: "meta",
                    attrs:
                    {
                        name: "referrer",
                        content: "no-referrer"
                    },
                    injectTo: "head-prepend" as const
                }
            ]
        }
    };
}

export default defineConfig
(
    ( { command } ) =>
    (
    {
        plugins: command === "build" ? [ react (), productionSecurityPolicy () ] : [ react () ],
        build:
        {
            rolldownOptions:
            {
                output:
                {
                    codeSplitting:
                    {
                        groups:
                        [
                            { name: "fluent", test: /node_modules[\\/]@fluentui[\\/]/ },
                            { name: "react", test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/ },
                            { name: "vendor", test: /node_modules[\\/]/ }
                        ]
                    }
                }
            }
        },
        test:
        {
            environment: "jsdom",
            globals: true,
            include: [ "src/**/*.test.{ts,tsx}" ],
            setupFiles: [ "src/test/setup.ts" ]
        }
    } )
);
