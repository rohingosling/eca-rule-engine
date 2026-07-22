//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Provides main behavior used by the ECA rule-engine model laboratory and its automated verification.
//
//---------------------------------------------------------------------------------------------------------------------

import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./ui/App";
import "./ui/styles.css";

ReactDOM.createRoot ( document.getElementById ( "root" )! ).render
(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
