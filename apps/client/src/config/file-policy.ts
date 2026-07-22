//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Compile-time document names, file limits, accepted formats, and media types.
//
//---------------------------------------------------------------------------------------------------------------------

export const UNTITLED_MODEL_FILE_NAME = "Untitled.json";
export const NO_DOCUMENT_FILE_NAME = "No document";
export const DEFAULT_APPLICATION_STATUS_MESSAGE = "Ready";

export const MAXIMUM_IMPORT_BYTES = 1024 * 1024;
export const MAXIMUM_IMPORT_MEBIBYTES = MAXIMUM_IMPORT_BYTES / ( 1024 * 1024 );

export const JSON_FILE_ACCEPT = "application/json,.json";
export const YAML_FILE_ACCEPT = "application/yaml,text/yaml,.yaml,.yml";
export const CSV_FILE_ACCEPT = "text/csv,.csv";

export const JSON_MEDIA_TYPE = "application/json";
export const YAML_MEDIA_TYPE = "application/yaml";
export const CSV_MEDIA_TYPE = "text/csv";

export const JSON_FILE_EXTENSION = ".json";
export const YAML_FILE_EXTENSION = ".yaml";
export const CSV_FILE_EXTENSION = ".csv";
