//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine Laboratory
// Version: 0.1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Contextual academic guidance derived from the stateless ECA technical note.
//
//---------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------
// Type: UserGuideTopic
//
// Description:
//
//   Defines the valid representation of user guide topic.
//
//---------------------------------------------------------------------------------------------------------------------
export type UserGuideTopic =
    "no-document" |
    "model" |
    "parameters" |
    "payloads" |
    "events" |
    "conditions" |
    "actions" |
    "rules" |
    "graph" |
    "simulator" |
    "code";

//---------------------------------------------------------------------------------------------------------------------
// Interface: UserGuideArticle
//
// Description:
//
//   Defines the named fields and callable operations that make up user guide article.
//
//---------------------------------------------------------------------------------------------------------------------
export interface UserGuideArticle
{
    definition:     string;
    /** Display-mode LaTeX source rendered by KaTeX. */
    formula?:       string;
    guidance:       string[];
    paperReference: string;
    title:          string;
}

export const USER_GUIDE_ARTICLES: Record<UserGuideTopic, UserGuideArticle> =
{
    "no-document":
    {
        title:
            "Begin with a model document",

        definition:
            "The laboratory keeps the current model and every event occurrence in browser memory. No rule-engine "
            + "model exists in the workspace until you create or open a document.",

        paperReference:
            "Technical note: The Rule Engine defines a partial query on admissible current inputs.",

        guidance:
        [
            "Choose New model to begin an empty ECA model.",
            "Choose Open to continue from a saved model document.",
            "Nothing is uploaded when either command is used; normal authoring and evaluation remain browser-local."
        ]
    },

    model:
    {
        title:
            "ECA model",

        definition:
            "The query maps an admissible occurrence and rule-set input to either the "
            + "unique action identified by its matching rules or ⊥ when no rule matches. An input that identifies "
            + "distinct actions is outside the query domain and becomes an ambiguity diagnostic in the application.",

        formula:
            "\\begin{aligned}Q&:\\mathcal{X}\\times\\mathfrak{S}\\rightharpoonup A_{\\bot}\\\\"
            + "\\operatorname{dom}(Q)&=\\mathfrak{D}_q\\end{aligned}",

        paperReference:
            "Technical note: Actions and Rules, and The Rule Engine.",

        guidance:
        [
            "Give the model a stable identifier and a clear human-readable name.",
            "Define parameters and reusable payload definitions before attaching one payload definition to each event.",
            "Then define conditions, action data, and rules that connect them.",
            "Use arrow keys and Enter to move through the model tree and structured form controls; native editing keys remain available inside values."
        ]
    },

    graph:
    {
        title:
            "Rule graph",

        definition:
            "The graph is a projection of the same model edited by the forms. Events, conditions, and actions are "
            + "definitions; each rule contributes an event-to-condition and condition-to-action connection.",

        formula:
            "r=(e,c,a)\\in E\\times C\\times A",

        paperReference:
            "Technical note: Actions and Rules.",

        guidance:
        [
            "Click a node or connection to synchronize the model-tree selection.",
            "Double-click a node or connection to open its accessible detail form on the Model tab.",
            "Drag, pan, zoom, fit, and minimap operations change only the view and never evaluation semantics.",
            "Dashed red connections and Missing reference nodes keep incomplete rules visible for repair."
        ]
    },

    parameters:
    {
        title:
            "Parameters",

        definition:
            "The paper denotes the set of parameter names by K. A parameter name is a possible key in an "
            + "occurrence payload; its value, when present, belongs to the value set V.",

        formula:
            "k\\in K",

        paperReference:
            "Technical note: Events and Optional Payloads, immediately before Definition 1.",

        guidance:
        [
            "Add each parameter concept once, using an identifier that can serve as a payload key.",
            "Choose the JSON value type that occurrences are permitted to carry for that parameter.",
            "Parameters are independent definitions here. Associate them with reusable payload definitions on the Payloads page."
        ]
    },

    payloads:
    {
        title:
            "Payload definitions",

        definition:
            "In the paper, an occurrence payload p is the actual finite partial map from parameter names to values. "
            + "A PayloadDefinition in the editor is a reusable authoring template that lists which parameters such a map may carry; "
            + "it is not itself an occurrence payload and contains no occurrence values.",

        formula:
            "p\\colon K\\rightharpoonup V",

        paperReference:
            "Technical note: Events and Optional Payloads, Definition 1 and Equation (2).",

        guidance:
        [
            "Create a payload definition for each reusable parameter shape in the model.",
            "Add parameters from the searchable list of parameter definitions.",
            "The empty parameter set represents a payload definition with no declared values."
        ]
    },

    events:
    {
        title:
            "Events",

        definition:
            "An event type e identifies what occurred. An event occurrence x pairs that type with a particular payload p. "
            + "The event type and the occurrence are therefore different mathematical objects.",

        formula:
            "x=(e,p)\\in E\\times P",

        paperReference:
            "Technical note: Events and Optional Payloads, Definition 2 and Equation (3).",

        guidance:
        [
            "Create one event definition for each kind of occurrence the engine should recognize.",
            "Select at most one reusable payload definition for the event.",
            "Leave the payload selection empty when the event carries no declared parameters."
        ]
    },

    conditions:
    {
        title:
            "Conditions and predicates",

        definition:
            "A condition c has a finite dependency set K_c and a total Boolean predicate q(c, p). If a required "
            + "parameter is absent, the condition is false. The always predicate has no dependencies and returns true for every "
            + "payload, so a rule using it is unconditional with respect to payload data but must still match its event.",

        formula:
            "q\\colon C\\times P\\to\\{0,1\\}",

        paperReference:
            "Technical note: Conditions and Their Predicate, Equation (5), Equation (7), and the distinguished condition ⊤.",

        guidance:
        [
            "Choose always when an event match alone should be sufficient for the rule's condition.",
            "For a comparison predicate, select the required parameter and enter the comparison value.",
            "Make sure every event used with the condition has a payload definition containing that parameter."
        ]
    },

    actions:
    {
        title:
            "Actions",

        definition:
            "The paper treats A as an abstract set of actions. It assigns no executable action type or behavior: an action "
            + "is uninterpreted symbolic data returned by the query. The engine returns at most one action and never executes it.",

        formula:
            "a\\in A",

        paperReference:
            "Technical note: Actions and Rules, and The Rule Engine.",

        guidance:
        [
            "Create a stable identifier and description for the action data a matching rule should select.",
            "Store only inert, serializable data; scripts, commands, and side effects are outside the engine boundary.",
            "A separate consumer may interpret returned action data after evaluation, under its own security policy."
        ]
    },

    rules:
    {
        title:
            "Rules",

        definition:
            "A rule is a triple containing one event type, one condition, and one candidate action. At an admissible "
            + "query input, several rules may match, but all of them must identify the same action for that occurrence.",

        formula:
            "r=(e,c,a)\\in E\\times C\\times A",

        paperReference:
            "Technical note: Actions and Rules, especially Rule and Admissible query input.",

        guidance:
        [
            "Select the event, condition, and action definitions that form the rule.",
            "Use the Rules table to review every rule, and select an identifier to edit its event, condition, and action references.",
            "Use an always condition when the event should select the action without inspecting payload values."
        ]
    },

    simulator:
    {
        title:
            "Simulator",

        definition:
            "The simulator applies Q to the current event occurrence and the complete rule set. It returns one action, "
            + "no action, or an ambiguity diagnostic when matching rules identify distinct actions. Earlier occurrences cannot "
            + "influence this result.",

        formula:
            "\\begin{gathered}"
            + "Q((e,p),R)="
            + "\\begin{cases}"
            + "a, & C_R(e,p)=\\{a\\},\\\\"
            + "\\bot, & C_R(e,p)=\\varnothing."
            + "\\end{cases}\\\\[2em]"
            + "\\mathrm{action}"
            + "=\\operatorname{query}\\Bigl("
            + "\\operatorname{event}\\bigl(\\mathrm{payload}\\bigr),"
            + "\\mathrm{rules}"
            + "\\Bigr)"
            + "\\end{gathered}",

        paperReference:
            "Technical note: The Rule Engine and Statelessness.",

        guidance:
        [
            "Choose an event and include whichever optional payload values belong to this occurrence.",
            "Raise the event to inspect condition results, matching rules, the optional action, and the evaluation trace.",
            "Change the occurrence and repeat; no previous simulation run becomes hidden engine state."
        ]
    },

    code:
    {
        title:
            "Model source",

        definition:
            "The code page is a read-only serialization of the authoring document. Payload definitions describe reusable "
            + "parameter shapes, while occurrence payload values are supplied only when an event is simulated or evaluated.",

        paperReference:
            "Technical note: the formal elements are summarized in The Rule Engine.",

        guidance:
        [
            "Use the line-numbered JSON view to inspect the exact document that Save writes and Open reads.",
            "Make structural changes through the Model forms so validation and references remain synchronized.",
            "Copy the JSON when you need to review or share the portable authoring document."
        ]
    }
};
