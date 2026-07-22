//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Defines executable client limits generated from the authoritative model and diagnostic schemas. These values keep
//   browser validation aligned with the published contract.
//
//---------------------------------------------------------------------------------------------------------------------

export const MAXIMUM_IDENTIFIER_LENGTH = 128;
export const MAXIMUM_DISPLAY_NAME_LENGTH = 256;
export const MAXIMUM_DESCRIPTION_LENGTH = 4096;
export const MAXIMUM_DIAGNOSTIC_MESSAGE_CODE_POINTS = 4096;

export const MAXIMUM_PARAMETERS = 10000;
export const MAXIMUM_PAYLOADS = 10000;
export const MAXIMUM_EVENTS = 10000;
export const MAXIMUM_CONDITIONS = 100000;
export const MAXIMUM_ACTIONS = 10000;
export const MAXIMUM_RULES = 100000;

export const MAXIMUM_PAYLOAD_PARAMETERS = 256;
export const MAXIMUM_CONDITION_DEPENDENCIES = 256;

export const IDENTIFIER_PATTERN = /^[A-Za-z][A-Za-z0-9._-]{0,127}$/;

export const MODEL_COLLECTION_LIMITS =
{
    parameters: MAXIMUM_PARAMETERS,
    payloads: MAXIMUM_PAYLOADS,
    events: MAXIMUM_EVENTS,
    conditions: MAXIMUM_CONDITIONS,
    actions: MAXIMUM_ACTIONS,
    rules: MAXIMUM_RULES
} as const;
