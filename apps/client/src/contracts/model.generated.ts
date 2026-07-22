//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Defines TypeScript representations generated from the authoritative model schema. Regenerate this file when the
//   schema changes; do not edit the generated declarations directly.
//
//---------------------------------------------------------------------------------------------------------------------

export type Identifier = string;
export type DisplayName = string;
export type Description = string;
export type Condition =
{
    [k: string]: unknown;
} &
{
    id: Identifier;
    name: DisplayName;
    description?: Description;
    /**
     * @maxItems 256
     */
    dependencies: Identifier[];
    predicate: Predicate;
};
export type Predicate = AlwaysPredicate | ComparisonPredicate;

/**
 * A version 1 model containing reusable parameter and payload definitions, event types, conditions, actions, and rules.
 */
export interface StatelessECAModel
{
    schemaVersion: "1.0";
    id: Identifier;
    name: DisplayName;
    description?: Description;
    /**
     * @maxItems 10000
     */
    parameters: ParameterDefinition[];
    /**
     * @maxItems 10000
     */
    payloads: PayloadDefinition[];
    /**
     * @maxItems 10000
     */
    events: EventType[];
    /**
     * @maxItems 100000
     */
    conditions: Condition[];
    /**
     * @maxItems 10000
     */
    actions: Action[];
    /**
     * @maxItems 100000
     */
    rules: Rule[];
}
export interface ParameterDefinition
{
    id: Identifier;
    name: DisplayName;
    type: "null" | "boolean" | "number" | "integer" | "string" | "array" | "object";
    description?: Description;
}
export interface PayloadDefinition
{
    id: Identifier;
    name: DisplayName;
    description?: Description;
    /**
     * @maxItems 256
     */
    parameters: Identifier[];
}
export interface EventType
{
    id: Identifier;
    name: DisplayName;
    description?: Description;
    payload?: Identifier;
}
export interface AlwaysPredicate
{
    name: "always";
    arguments:
    {
    };
}
export interface ComparisonPredicate
{
    name: "equals" | "notEquals" | "greaterThan" | "greaterThanOrEqual" | "lessThan" | "lessThanOrEqual" | "contains";
    arguments:
    {
        parameter: Identifier;
        value: unknown;
    };
}
export interface Action
{
    id: Identifier;
    name: DisplayName;
    description?: Description;
    parameters:
    {
        [k: string]: unknown;
    };
}
export interface Rule
{
    id: Identifier;
    name: DisplayName;
    description?: Description;
    event: Identifier;
    condition: Identifier;
    action: Identifier;
}
