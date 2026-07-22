//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Production-bundle browser smoke-test configuration.
//
//---------------------------------------------------------------------------------------------------------------------

import { defineConfig } from "@playwright/test";

export default defineConfig
(
    {
        testDir: "tests",
        use: {
            baseURL: "http://127.0.0.1:4174",
            trace: "retain-on-failure"
        },
        webServer: {
            command: "npm run preview -- --host 127.0.0.1 --port 4174",
            reuseExistingServer: false,
            url: "http://127.0.0.1:4174"
        }
    }
);
