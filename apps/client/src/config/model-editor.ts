//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Compile-time model editor, document-history, and untrusted-document safety defaults.
//
//---------------------------------------------------------------------------------------------------------------------

export const MAXIMUM_DOCUMENT_HISTORY_LENGTH = 100;
export const MAXIMUM_DOCUMENT_HISTORY_BYTES = 8 * 1024 * 1024;
export const MAXIMUM_JSON_DOCUMENT_DEPTH = 32;

export const DEFAULT_MODEL_IDENTIFIER = "new-model";
export const DEFAULT_MODEL_NAME = "New model";

export const NEW_DEFINITION_DEFAULTS =
{
    parameters:
    {
        identifierPrefix: "parameter", name: "New parameter"
    },
    payloads:
    {
        identifierPrefix: "payload", name: "New payload"
    },
    events:
    {
        identifierPrefix: "event", name: "New event"
    },
    conditions:
    {
        identifierPrefix: "condition", name: "New condition"
    },
    actions:
    {
        identifierPrefix: "action", name: "New action"
    },
    rules:
    {
        identifierPrefix: "rule", name: "New rule"
    }
} as const;

export const DEFAULT_PARAMETER_TYPE = "string" as const;
export const DEFAULT_CONDITION_PREDICATE = "always" as const;
export const DEFAULT_RULE_EVENT_REFERENCE = "event";
export const DEFAULT_RULE_CONDITION_REFERENCE = "condition";
export const DEFAULT_RULE_ACTION_REFERENCE = "action";
