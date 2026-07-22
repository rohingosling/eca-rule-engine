#-----------------------------------------------------------------------------------------------------------------------
# Project: ECA Rule Engine Contract Verification
# Version: 1.0
# Date:    2022
# Author:  Rohin Gosling
#
# Description:
#
#   Verifies the Draft 2020-12 schemas, OpenAPI contract, conformance fixtures, semantic diagnostics, single-action
#   evaluation traces, and generated mathematical property cases that form the executable contract gate.
#
#-----------------------------------------------------------------------------------------------------------------------

from copy                           import deepcopy
from decimal                        import Decimal
from json                           import JSONDecodeError, load, loads
from math                           import isfinite
from pathlib                        import Path
from sys                            import exit
from typing                         import Any
from jsonschema                     import Draft202012Validator
from openapi_spec_validator         import validate as validate_openapi
from openapi_spec_validator.readers import read_from_filename
from referencing                    import Registry, Resource


CONTRACTS_DIRECTORY    = Path ( __file__ ).resolve ().parent
SCHEMAS_DIRECTORY      = CONTRACTS_DIRECTORY / "schemas"
MANIFEST_PATH          = CONTRACTS_DIRECTORY / "conformance" / "manifest.json"
OPENAPI_PATH           = CONTRACTS_DIRECTORY / "openapi" / "eca-service.yaml"
DIAGNOSTIC_SCHEMA_PATH = SCHEMAS_DIRECTORY / "diagnostic.schema.json"

ORDERING_PREDICATES = {
    "greaterThan",
    "greaterThanOrEqual",
    "lessThan",
    "lessThanOrEqual",
}


class ContractVerificationError ( RuntimeError ):

    pass


class EvaluationDiagnosticError ( ContractVerificationError ):

    def __init__ ( self, diagnostic: dict [ str, str ] ):

        super ().__init__ ( diagnostic [ "message" ] )
        self.diagnostic = diagnostic


def require ( condition: bool, message: str ) -> None:

    if not condition:
        raise ContractVerificationError ( message )


def reject_non_finite_number ( value: str ) -> None:

    raise ContractVerificationError ( f"JSON document contains non-finite number '{value}'." )


def reject_duplicate_object_members ( members: list [ tuple [ str, Any ] ] ) -> dict [ str, Any ]:

    value: dict [ str, Any ] = {}

    for name, member_value in members:
        require ( name not in value, f"JSON object contains duplicate member '{name}'." )
        value [ name ] = member_value

    # Return the value.

    return value


def parse_json ( text: str ) -> Any:

    # Return the result produced by the delegated operation.

    return loads (
        text,
        object_pairs_hook = reject_duplicate_object_members,
        parse_float       = Decimal,
        parse_constant    = reject_non_finite_number,
    )


def load_json ( path: Path ) -> Any:

    with path.open ( "r", encoding = "utf-8" ) as input_file:
        value = load (
            input_file,
            object_pairs_hook = reject_duplicate_object_members,
            parse_float       = Decimal,
            parse_constant    = reject_non_finite_number,
        )

    # Return the value.

    return value


DIAGNOSTIC_MESSAGE_MAXIMUM_CODE_POINTS = load_json (
    DIAGNOSTIC_SCHEMA_PATH
) [ "properties" ] [ "message" ] [ "maxLength" ]
DIAGNOSTIC_MESSAGE_TRUNCATION_MARKER = "\u2026"


def limit_diagnostic_message ( message: str ) -> str:

    if len ( message ) <= DIAGNOSTIC_MESSAGE_MAXIMUM_CODE_POINTS:

        # Return the message.

        return message

    retained_code_point_count = (
        DIAGNOSTIC_MESSAGE_MAXIMUM_CODE_POINTS - len ( DIAGNOSTIC_MESSAGE_TRUNCATION_MARKER )
    )

    # Return the value produced by this code path.

    return message [ : retained_code_point_count ] + DIAGNOSTIC_MESSAGE_TRUNCATION_MARKER


def resolve_contract_path ( relative_path: str ) -> Path:

    resolved_path = ( CONTRACTS_DIRECTORY / relative_path ).resolve ()
    require (
        resolved_path.is_relative_to ( CONTRACTS_DIRECTORY ),
        f"Contract path escapes the contract directory: {relative_path}",
    )
    require ( resolved_path.is_file (), f"Contract file does not exist: {relative_path}" )

    # Return the resolved path.

    return resolved_path


def load_schema_validators () -> dict [ Path, Draft202012Validator ]:

    schemas:   dict [ Path, dict [ str, Any ] ]         = {}
    resources: list [ tuple [ str, Resource [ Any ] ] ] = []

    for schema_path in sorted ( SCHEMAS_DIRECTORY.glob ( "*.schema.json" ) ):
        schema = load_json ( schema_path )
        Draft202012Validator.check_schema ( schema )
        require ( "$id" in schema, f"Schema has no $id: {schema_path.name}" )
        schemas [ schema_path.resolve () ] = schema
        resources.append ( ( schema [ "$id" ], Resource.from_contents ( schema ) ) )

    registry = Registry ().with_resources ( resources )
    validators = {
        schema_path: Draft202012Validator (
            schema,
            registry       = registry,
            format_checker = Draft202012Validator.FORMAT_CHECKER,
        )
        for schema_path, schema in schemas.items ()
    }

    # Return the validators.

    return validators


def verify_openapi () -> None:

    specification, base_uri = read_from_filename ( str ( OPENAPI_PATH ) )
    validate_openapi ( specification, base_uri = base_uri )


def verify_unique_case_identifiers ( manifest: dict [ str, Any ] ) -> None:

    for group_name in ( "schemaCases", "modelValidationCases", "evaluationCases", "propertyCases" ):
        identifiers = [ case [ "id" ] for case in manifest [ group_name ] ]
        require (
            len ( identifiers ) == len ( set ( identifiers ) ),
            f"Manifest group '{group_name}' contains duplicate case identifiers.",
        )


def verify_schema_cases (
    manifest: dict [ str, Any ], validators: dict [ Path, Draft202012Validator ]
) -> int:

    verified_count = 0

    for case in manifest [ "schemaCases" ]:
        schema_path   = resolve_contract_path ( case [ "schemaPath" ] )
        document_path = resolve_contract_path ( case [ "documentPath" ] )
        require ( schema_path in validators, f"Schema case references an unknown schema: {case['id']}" )

        document = load_json ( document_path )
        errors   = list ( validators [ schema_path ].iter_errors ( document ) )
        is_valid = not errors

        require (
            is_valid == case [ "expectedValid" ],
            f"Schema case '{case['id']}' expected valid={case['expectedValid']} but got valid={is_valid}.",
        )
        verified_count += 1

    # Return the verified count.

    return verified_count


def add_diagnostic (
    diagnostics: list [ dict [ str, str ] ], code: str, message: str, pointer: str
) -> None:

    diagnostics.append ( { "code": code, "message": message, "pointer": pointer } )


def add_duplicate_identifier_diagnostics (
    diagnostics: list [ dict [ str, str ] ], collection: list [ dict [ str, Any ] ],
    collection_pointer: str, code: str, noun: str
) -> None:

    identifiers: set [ str ] = set ()

    for item_index, item in enumerate ( collection ):
        identifier = item [ "id" ]

        if identifier in identifiers:
            add_diagnostic (
                diagnostics,
                code,
                f"Duplicate {noun} identifier '{identifier}'.",
                f"/{collection_pointer}/{item_index}/id",
            )
        else:
            identifiers.add ( identifier )


def index_by_identifier ( collection: list [ dict [ str, Any ] ] ) -> dict [ str, dict [ str, Any ] ]:

    items_by_identifier: dict [ str, dict [ str, Any ] ] = {}

    for item in collection:
        items_by_identifier.setdefault ( item [ "id" ], item )

    # Return the items by identifier.

    return items_by_identifier


def is_json_number ( value: Any ) -> bool:

    if isinstance ( value, bool ):

        # Return false for this code path.

        return False

    if isinstance ( value, int ):

        # Return true for this code path.

        return True

    if isinstance ( value, Decimal ):

        # Return the result produced by the delegated operation.

        return value.is_finite ()

    # Return the result produced by the delegated operation.

    return isinstance ( value, float ) and isfinite ( value )


def value_matches_parameter_type ( value: Any, parameter_type: str ) -> bool:

    if parameter_type == "null":

        # Return the value produced by this code path.

        return value is None

    if parameter_type == "boolean":

        # Return the result produced by the delegated operation.

        return isinstance ( value, bool )

    if parameter_type == "number":

        # Return the result produced by the delegated operation.

        return is_json_number ( value )

    if parameter_type == "integer":
        if not is_json_number ( value ):

            # Return false for this code path.

            return False

        if isinstance ( value, int ):

            # Return true for this code path.

            return True

        if isinstance ( value, Decimal ):

            # Return the value produced by this code path.

            return value == value.to_integral_value ()

        # Return the result produced by the delegated operation.

        return value.is_integer ()

    if parameter_type == "string":

        # Return the result produced by the delegated operation.

        return isinstance ( value, str )

    if parameter_type == "array":

        # Return the result produced by the delegated operation.

        return isinstance ( value, list )

    if parameter_type == "object":

        # Return the result produced by the delegated operation.

        return isinstance ( value, dict )

    # Return false for this code path.

    return False


def verify_numeric_edge_cases () -> int:

    large_integer = 10 ** 10_000
    large_decimal = Decimal ( "1e10000" )

    require ( is_json_number ( large_integer ), "A large finite JSON integer was rejected." )
    require ( is_json_number ( large_decimal ), "A large finite JSON decimal was rejected." )
    require ( value_matches_parameter_type ( large_integer, "integer" ), "A large JSON integer lost integer identity." )
    require ( not is_json_number ( Decimal ( "Infinity" ) ), "A non-finite decimal was accepted." )

    # Return the value produced by this code path.

    return 4


def verify_parser_edge_cases () -> int:

    require ( parse_json ( "{\"value\": 1}\n\t" ) [ "value" ] == 1, "Trailing JSON whitespace was rejected." )

    try:
        parse_json ( "{\"value\": 1, \"value\": 2}" )
        raise ContractVerificationError ( "A duplicate JSON object member was accepted." )
    except ContractVerificationError as exception:
        require ( "duplicate member" in str ( exception ), "Duplicate-member rejection was not deterministic." )

    try:
        parse_json ( "{} {}" )
        raise ContractVerificationError ( "Multiple JSON root values were accepted." )
    except JSONDecodeError:
        pass

    # Return the value produced by this code path.

    return 3


def validate_model_semantics ( model: dict [ str, Any ] ) -> list [ dict [ str, str ] ]:

    diagnostics: list [ dict [ str, str ] ] = []

    add_duplicate_identifier_diagnostics (
        diagnostics, model [ "parameters" ], "parameters", "duplicate-parameter-identifier", "parameter"
    )
    add_duplicate_identifier_diagnostics (
        diagnostics, model [ "payloads" ], "payloads", "duplicate-payload-identifier", "payload"
    )
    add_duplicate_identifier_diagnostics (
        diagnostics, model [ "events" ], "events", "duplicate-event-identifier", "event"
    )
    add_duplicate_identifier_diagnostics (
        diagnostics, model [ "conditions" ], "conditions", "duplicate-condition-identifier", "condition"
    )
    add_duplicate_identifier_diagnostics (
        diagnostics, model [ "actions" ], "actions", "duplicate-action-identifier", "action"
    )
    add_duplicate_identifier_diagnostics (
        diagnostics, model [ "rules" ], "rules", "duplicate-rule-identifier", "rule"
    )

    parameters_by_identifier = index_by_identifier ( model [ "parameters" ] )
    payloads_by_identifier   = index_by_identifier ( model [ "payloads" ] )
    events_by_identifier     = index_by_identifier ( model [ "events" ] )
    conditions_by_identifier = index_by_identifier ( model [ "conditions" ] )
    actions_by_identifier    = index_by_identifier ( model [ "actions" ] )

    for payload_index, payload_definition in enumerate ( model [ "payloads" ] ):
        for parameter_index, parameter_identifier in enumerate ( payload_definition [ "parameters" ] ):
            if parameter_identifier not in parameters_by_identifier:
                add_diagnostic (
                    diagnostics,
                    "unresolved-parameter-reference",
                    f"Payload '{payload_definition['id']}' references unknown parameter '{parameter_identifier}'.",
                    f"/payloads/{payload_index}/parameters/{parameter_index}",
                )

    for event_index, event_type in enumerate ( model [ "events" ] ):
        payload_identifier = event_type.get ( "payload" )

        if payload_identifier is not None and payload_identifier not in payloads_by_identifier:
            add_diagnostic (
                diagnostics,
                "unresolved-payload-reference",
                f"Event '{event_type['id']}' references unknown payload '{payload_identifier}'.",
                f"/events/{event_index}/payload",
            )

    for condition_index, condition in enumerate ( model [ "conditions" ] ):
        predicate = condition [ "predicate" ]

        if predicate [ "name" ] != "always":
            parameter_name = predicate [ "arguments" ] [ "parameter" ]

            if condition [ "dependencies" ] != [ parameter_name ]:
                add_diagnostic (
                    diagnostics,
                    "predicate-dependency-mismatch",
                    f"Condition '{condition['id']}' must depend only on predicate parameter '{parameter_name}'.",
                    f"/conditions/{condition_index}/predicate/arguments/parameter",
                )

    checked_event_conditions: set [ tuple [ str, str ] ] = set ()

    for rule_index, rule in enumerate ( model [ "rules" ] ):
        event_identifier     = rule [ "event" ]
        condition_identifier = rule [ "condition" ]
        action_identifier    = rule [ "action" ]

        if action_identifier not in actions_by_identifier:
            add_diagnostic (
                diagnostics,
                "unresolved-action-reference",
                f"Rule '{rule['id']}' references unknown action '{action_identifier}'.",
                f"/rules/{rule_index}/action",
            )

        if condition_identifier not in conditions_by_identifier:
            add_diagnostic (
                diagnostics,
                "unresolved-condition-reference",
                f"Rule '{rule['id']}' references unknown condition '{condition_identifier}'.",
                f"/rules/{rule_index}/condition",
            )

        if event_identifier not in events_by_identifier:
            add_diagnostic (
                diagnostics,
                "unresolved-event-reference",
                f"Rule '{rule['id']}' references unknown event '{event_identifier}'.",
                f"/rules/{rule_index}/event",
            )

        relation = ( event_identifier, condition_identifier )

        if (
            event_identifier not in events_by_identifier
            or condition_identifier not in conditions_by_identifier
            or relation in checked_event_conditions
        ):
            continue

        checked_event_conditions.add ( relation )
        event_type = events_by_identifier [ event_identifier ]
        condition  = conditions_by_identifier [ condition_identifier ]
        predicate  = condition [ "predicate" ]

        if predicate [ "name" ] == "always":
            continue

        parameter_identifier = condition [ "dependencies" ] [ 0 ]
        payload_identifier   = event_type.get ( "payload" )

        if payload_identifier is not None and payload_identifier not in payloads_by_identifier:
            continue

        payload_parameter_identifiers = set (
            payloads_by_identifier [ payload_identifier ] [ "parameters" ]
        ) if payload_identifier is not None else set ()

        if parameter_identifier not in payload_parameter_identifiers:
            add_diagnostic (
                diagnostics,
                "undeclared-condition-dependency",
                f"Event '{event_identifier}' payload does not include condition dependency '{parameter_identifier}'.",
                f"/rules/{rule_index}/condition",
            )
            continue

        if parameter_identifier not in parameters_by_identifier:
            continue

        parameter_type  = parameters_by_identifier [ parameter_identifier ] [ "type" ]
        predicate_name  = predicate [ "name" ]
        condition_index = model [ "conditions" ].index ( condition )

        if predicate_name in ORDERING_PREDICATES and parameter_type not in ( "number", "integer", "string" ):
            add_diagnostic (
                diagnostics,
                "incompatible-predicate-operand",
                f"Predicate '{predicate_name}' cannot compare parameter type '{parameter_type}'.",
                f"/conditions/{condition_index}/predicate/name",
            )
            continue

        if predicate_name == "contains" and parameter_type not in ( "array", "string" ):
            add_diagnostic (
                diagnostics,
                "incompatible-predicate-operand",
                f"Predicate 'contains' cannot inspect parameter type '{parameter_type}'.",
                f"/conditions/{condition_index}/predicate/name",
            )
            continue

        comparison_value = predicate [ "arguments" ] [ "value" ]
        comparison_value_is_compatible = (
            parameter_type == "array" and predicate_name == "contains"
        ) or value_matches_parameter_type ( comparison_value, parameter_type )

        if not comparison_value_is_compatible:
            add_diagnostic (
                diagnostics,
                "incompatible-comparison-value",
                f"Predicate value is incompatible with parameter type '{parameter_type}'.",
                f"/conditions/{condition_index}/predicate/arguments/value",
            )

    unique_diagnostics: dict [ tuple [ str, str ], dict [ str, str ] ] = {}

    for diagnostic in diagnostics:
        key = ( diagnostic [ "pointer" ], diagnostic [ "code" ] )
        unique_diagnostics.setdefault ( key, diagnostic )

    # Return the assembled list value.

    return [ unique_diagnostics [ key ] for key in sorted ( unique_diagnostics ) ]


def diagnostic_identity ( diagnostic: dict [ str, str ] ) -> dict [ str, str ]:

    # Return the assembled mapping value.

    return { "code": diagnostic [ "code" ], "pointer": diagnostic [ "pointer" ] }


def verify_model_validation_cases (
    manifest: dict [ str, Any ], model_validator: Draft202012Validator
) -> int:

    verified_count = 0

    for case in manifest [ "modelValidationCases" ]:
        model         = load_json ( resolve_contract_path ( case [ "modelPath" ] ) )
        schema_errors = list ( model_validator.iter_errors ( model ) )
        require ( not schema_errors, f"Semantic model case is structurally invalid: {case['id']}" )

        actual_diagnostics = [ diagnostic_identity ( diagnostic ) for diagnostic in validate_model_semantics ( model ) ]
        require (
            actual_diagnostics == case [ "expectedDiagnostics" ],
            f"Semantic diagnostics differ for case '{case['id']}'.\n"
            f"Expected: {case['expectedDiagnostics']}\nActual:   {actual_diagnostics}",
        )
        verified_count += 1

    # Return the verified count.

    return verified_count


def json_values_equal ( first_value: Any, second_value: Any ) -> bool:

    if is_json_number ( first_value ) and is_json_number ( second_value ):

        # Return the value produced by this code path.

        return first_value == second_value

    if type ( first_value ) is not type ( second_value ):

        # Return false for this code path.

        return False

    if isinstance ( first_value, list ):

        # Return the result produced by the delegated operation.

        return len ( first_value ) == len ( second_value ) and all (
            json_values_equal ( first_item, second_item )
            for first_item, second_item in zip ( first_value, second_value, strict = True )
        )

    if isinstance ( first_value, dict ):

        # Return the result produced by the delegated operation.

        return first_value.keys () == second_value.keys () and all (
            json_values_equal ( first_value [ key ], second_value [ key ] ) for key in first_value
        )

    # Return the value produced by this code path.

    return first_value == second_value


def evaluate_predicate ( predicate: dict [ str, Any ], payload: dict [ str, Any ] ) -> bool:

    predicate_name = predicate [ "name" ]

    if predicate_name == "always":

        # Return true for this code path.

        return True

    arguments        = predicate [ "arguments" ]
    payload_value    = payload [ arguments [ "parameter" ] ]
    comparison_value = arguments [ "value" ]

    if predicate_name == "equals":

        # Return the result produced by the delegated operation.

        return json_values_equal ( payload_value, comparison_value )

    if predicate_name == "notEquals":

        # Return the value produced by this code path.

        return not json_values_equal ( payload_value, comparison_value )

    if predicate_name == "contains":
        if isinstance ( payload_value, list ):

            # Return the result produced by the delegated operation.

            return any ( json_values_equal ( item, comparison_value ) for item in payload_value )

        # Return the result produced by the delegated operation.

        return (
            isinstance ( payload_value, str )
            and isinstance ( comparison_value, str )
            and comparison_value in payload_value
        )

    values_are_numbers = is_json_number ( payload_value ) and is_json_number ( comparison_value )
    values_are_strings = isinstance ( payload_value, str ) and isinstance ( comparison_value, str )

    if not values_are_numbers and not values_are_strings:

        # Return false for this code path.

        return False

    if predicate_name == "greaterThan":

        # Return the value produced by this code path.

        return payload_value > comparison_value

    if predicate_name == "greaterThanOrEqual":

        # Return the value produced by this code path.

        return payload_value >= comparison_value

    if predicate_name == "lessThan":

        # Return the value produced by this code path.

        return payload_value < comparison_value

    if predicate_name == "lessThanOrEqual":

        # Return the value produced by this code path.

        return payload_value <= comparison_value

    raise ContractVerificationError ( f"Unsupported predicate '{predicate_name}'." )


def validate_event_occurrence ( model: dict [ str, Any ], event: dict [ str, Any ] ) -> None:

    events_by_identifier = index_by_identifier ( model [ "events" ] )
    event_identifier     = event [ "type" ]

    if event_identifier not in events_by_identifier:

        # Return without a value after completing this code path.

        return

    event_type               = events_by_identifier [ event_identifier ]
    parameters_by_identifier = index_by_identifier ( model [ "parameters" ] )
    payloads_by_identifier   = index_by_identifier ( model [ "payloads" ] )
    payload_identifier       = event_type.get ( "payload" )
    payload_parameter_identifiers = set (
        payloads_by_identifier [ payload_identifier ] [ "parameters" ]
    ) if payload_identifier is not None else set ()

    for parameter_identifier, value in event.get ( "payload", {} ).items ():
        require (
            parameter_identifier in payload_parameter_identifiers,
            f"Event '{event_identifier}' contains undeclared payload parameter '{parameter_identifier}'.",
        )
        require (
            parameter_identifier in parameters_by_identifier
            and value_matches_parameter_type ( value, parameters_by_identifier [ parameter_identifier ] [ "type" ] ),
            f"Event '{event_identifier}' payload parameter '{parameter_identifier}' has the wrong type.",
        )


def evaluate ( model: dict [ str, Any ], event: dict [ str, Any ] ) -> dict [ str, Any ]:

    validate_event_occurrence ( model, event )
    event_identifier = event [ "type" ]
    payload          = event.get ( "payload", {} )
    matching_rules = sorted (
        ( rule for rule in model [ "rules" ] if rule [ "event" ] == event_identifier ),
        key = lambda rule: rule [ "id" ],
    )

    if not matching_rules:

        # Return the assembled mapping value.

        return { "selectedActionId": None, "trace": { "conditions": [], "rules": [] } }

    conditions_by_identifier = index_by_identifier ( model [ "conditions" ] )
    condition_results: dict [ str, bool ]         = {}
    condition_trace:   list [ dict [ str, Any ] ] = []

    for condition_identifier in sorted ( { rule [ "condition" ] for rule in matching_rules } ):
        condition = conditions_by_identifier [ condition_identifier ]
        missing_dependencies = sorted (
            dependency for dependency in condition [ "dependencies" ] if dependency not in payload
        )

        if missing_dependencies:
            condition_result = False
            reason           = "missing-dependency"
        else:
            condition_result = evaluate_predicate ( condition [ "predicate" ], payload )
            reason           = "predicate-true" if condition_result else "predicate-false"

        condition_results [ condition_identifier ] = condition_result
        condition_trace.append (
            {
                "condition": condition_identifier,
                "result": condition_result,
                "reason": reason,
                "missingDependencies": missing_dependencies,
            }
        )

    selected_action_identifiers: set [ str ]                = set ()
    matched_rule_identifiers:    list [ str ]               = []
    rule_trace:                  list [ dict [ str, Any ] ] = []

    for rule in matching_rules:
        condition_result = condition_results [ rule [ "condition" ] ]

        if condition_result:
            selected_action_identifiers.add ( rule [ "action" ] )
            matched_rule_identifiers.append ( rule [ "id" ] )

        rule_trace.append (
            {
                "rule": rule [ "id" ],
                "condition": rule [ "condition" ],
                "conditionResult": condition_result,
                "action": rule [ "action" ],
                "matched": condition_result,
            }
        )

    if len ( selected_action_identifiers ) > 1:
        sorted_action_identifiers = sorted ( selected_action_identifiers )
        sorted_rule_identifiers   = sorted ( matched_rule_identifiers )
        raise EvaluationDiagnosticError (
            {
                "code": "ambiguous-action-selection",
                "message": limit_diagnostic_message (
                    f"Event '{event_identifier}' matched distinct actions "
                    f"[{', '.join ( sorted_action_identifiers )}] through rules "
                    f"[{', '.join ( sorted_rule_identifiers )}]."
                ),
                "pointer": "/type",
            }
        )

    selected_action_identifier = next ( iter ( selected_action_identifiers ), None )

    # Return the assembled mapping value.

    return {
        "selectedActionId": selected_action_identifier,
        "trace": { "conditions": condition_trace, "rules": rule_trace },
    }


def load_evaluation_cases (
    manifest: dict [ str, Any ], model_validator: Draft202012Validator,
    diagnostic_validator: Draft202012Validator
) -> dict [ str, tuple [ dict [ str, Any ], dict [ str, Any ] ] ]:

    evaluation_cases: dict [ str, tuple [ dict [ str, Any ], dict [ str, Any ] ] ] = {}

    for case_entry in manifest [ "evaluationCases" ]:
        case_path = resolve_contract_path ( case_entry [ "casePath" ] )
        case      = load_json ( case_path )
        require ( case [ "id" ] == case_entry [ "id" ], f"Evaluation case identifier drift: {case_path.name}" )

        model_path = ( case_path.parent / case [ "modelPath" ] ).resolve ()
        require (
            model_path.is_relative_to ( CONTRACTS_DIRECTORY ) and model_path.is_file (),
            f"Evaluation case model path is invalid: {case['id']}",
        )
        model = load_json ( model_path )
        require ( not list ( model_validator.iter_errors ( model ) ), f"Evaluation model is invalid: {case['id']}" )
        require ( not validate_model_semantics ( model ), f"Evaluation model has semantic errors: {case['id']}" )
        has_expected_action     = "expectedActionId" in case
        has_expected_diagnostic = "expectedDiagnostic" in case
        require (
            has_expected_action != has_expected_diagnostic,
            f"Evaluation case must define exactly one outcome: {case['id']}",
        )

        if has_expected_diagnostic:
            require (
                "expectedTrace" not in case,
                f"Diagnostic evaluation case must not define a success trace: {case['id']}",
            )
            diagnostic_errors = list ( diagnostic_validator.iter_errors ( case [ "expectedDiagnostic" ] ) )
            require ( not diagnostic_errors, f"Evaluation diagnostic is invalid: {case['id']}" )
        else:
            require ( "expectedTrace" in case, f"Successful evaluation case has no trace: {case['id']}" )
            expected_action_identifier = case [ "expectedActionId" ]
            require (
                expected_action_identifier is None
                or expected_action_identifier in index_by_identifier ( model [ "actions" ] ),
                f"Evaluation case expects an unknown action: {case['id']}",
            )

        evaluation_cases [ case [ "id" ] ] = ( case, model )

    # Return the evaluation cases.

    return evaluation_cases


def verify_evaluation_cases (
    evaluation_cases: dict [ str, tuple [ dict [ str, Any ], dict [ str, Any ] ] ]
) -> int:

    for case_identifier, ( case, model ) in evaluation_cases.items ():

        if "expectedDiagnostic" in case:
            try:
                evaluate ( model, case [ "event" ] )
            except EvaluationDiagnosticError as exception:
                actual_diagnostic = exception.diagnostic
            else:
                raise ContractVerificationError (
                    f"Evaluation case '{case_identifier}' expected an ambiguity diagnostic."
                )

            require (
                actual_diagnostic == case [ "expectedDiagnostic" ],
                f"Evaluation diagnostic differs for case '{case_identifier}'.\n"
                f"Expected: {case['expectedDiagnostic']}\nActual:   {actual_diagnostic}",
            )
        else:
            actual_result = evaluate ( model, case [ "event" ] )
            expected_result = {
                "selectedActionId": case [ "expectedActionId" ],
                "trace": case [ "expectedTrace" ],
            }
            require (
                actual_result == expected_result,
                f"Evaluation result differs for case '{case_identifier}'.\n"
                f"Expected: {expected_result}\nActual:   {actual_result}",
            )

    # Return the result produced by the delegated operation.

    return len ( evaluation_cases )


def create_long_identifier ( prefix: str, index: int, filler: str ) -> str:

    identifier_prefix = f"{prefix}.{index:03d}."

    # Return the value produced by this code path.

    return identifier_prefix + filler * ( 120 - len ( identifier_prefix ) )


def create_large_ambiguity_model ( reverse_declaration_order: bool ) -> dict [ str, Any ]:

    actions: list [ dict [ str, Any ] ] = []
    rules:   list [ dict [ str, Any ] ] = []

    for index in range ( 17 ):
        action_identifier = create_long_identifier ( "action", index, "a" )
        rule_identifier   = create_long_identifier ( "rule", index, "r" )
        actions.append ( { "id": action_identifier, "name": f"Action {index}", "parameters": {} } )
        rules.append (
            {
                "id": rule_identifier,
                "name": f"Rule {index}",
                "event": "signal.received",
                "condition": "always",
                "action": action_identifier,
            }
        )

    if reverse_declaration_order:
        actions.reverse ()
        rules.reverse ()

    # Return the assembled mapping value.

    return {
        "schemaVersion": "1.0",
        "id": "large-ambiguity",
        "name": "Large ambiguity",
        "parameters": [],
        "payloads": [],
        "events": [ { "id": "signal.received", "name": "Signal received" } ],
        "conditions": [
            {
                "id": "always",
                "name": "Always",
                "dependencies": [],
                "predicate": { "name": "always", "arguments": {} },
            }
        ],
        "actions": actions,
        "rules": rules,
    }


def capture_ambiguity_diagnostic ( model: dict [ str, Any ] ) -> dict [ str, str ]:

    try:
        evaluate ( model, { "type": "signal.received" } )
    except EvaluationDiagnosticError as exception:

        # Return the diagnostic.

        return exception.diagnostic

    raise ContractVerificationError ( "The generated evaluation did not produce an ambiguity diagnostic." )


def verify_ambiguity_message_policy (
    model_validator: Draft202012Validator, diagnostic_validator: Draft202012Validator
) -> int:

    original_model = create_large_ambiguity_model ( False )
    permuted_model = create_large_ambiguity_model ( True )
    require ( not list ( model_validator.iter_errors ( original_model ) ), "Generated ambiguity model is invalid." )
    require ( not validate_model_semantics ( original_model ), "Generated ambiguity model has semantic errors." )

    original_diagnostic = capture_ambiguity_diagnostic ( original_model )
    repeated_diagnostic = capture_ambiguity_diagnostic ( original_model )
    permuted_diagnostic = capture_ambiguity_diagnostic ( permuted_model )
    message             = original_diagnostic [ "message" ]

    require (
        DIAGNOSTIC_MESSAGE_MAXIMUM_CODE_POINTS == 4096,
        "The diagnostic schema message bound must remain 4096 Unicode code points.",
    )
    require (
        len ( message ) == DIAGNOSTIC_MESSAGE_MAXIMUM_CODE_POINTS,
        "Generated ambiguity message does not meet the diagnostic code-point bound.",
    )
    require (
        message.endswith ( DIAGNOSTIC_MESSAGE_TRUNCATION_MARKER ),
        "Generated ambiguity message does not end with the truncation marker.",
    )
    require ( repeated_diagnostic == original_diagnostic, "Ambiguity message generation is not deterministic." )
    require ( permuted_diagnostic == original_diagnostic, "Ambiguity message depends on declaration order." )
    require (
        not list ( diagnostic_validator.iter_errors ( original_diagnostic ) ),
        "Generated ambiguity diagnostic violates the diagnostic schema.",
    )

    supplementary_message         = "\U0001F600" * DIAGNOSTIC_MESSAGE_MAXIMUM_CODE_POINTS + "tail"
    limited_supplementary_message = limit_diagnostic_message ( supplementary_message )
    require (
        len ( limited_supplementary_message ) == DIAGNOSTIC_MESSAGE_MAXIMUM_CODE_POINTS
        and limited_supplementary_message.endswith ( DIAGNOSTIC_MESSAGE_TRUNCATION_MARKER ),
        "Diagnostic truncation is not Unicode-code-point safe.",
    )

    # Return the value produced by this code path.

    return 1


def verify_property_cases (
    manifest: dict [ str, Any ],
    evaluation_cases: dict [ str, tuple [ dict [ str, Any ], dict [ str, Any ] ] ],
    model_validator: Draft202012Validator,
) -> int:

    verified_count = 0

    for property_case in manifest [ "propertyCases" ]:
        property_identifier       = property_case [ "id" ]
        property_kind             = property_case [ "kind" ]
        source_case, source_model = evaluation_cases [ property_case [ "sourceCase" ] ]
        baseline_result           = evaluate ( source_model, source_case [ "event" ] )

        if property_kind == "determinism":
            for _ in range ( property_case [ "repetitions" ] ):
                require (
                    evaluate ( source_model, source_case [ "event" ] ) == baseline_result,
                    f"Property case '{property_identifier}' failed.",
                )

        elif property_kind == "replay":
            intervening_case, intervening_model = evaluation_cases [ property_case [ "interveningCase" ] ]

            for _ in range ( property_case [ "repetitions" ] ):
                evaluate ( intervening_model, intervening_case [ "event" ] )
                require (
                    evaluate ( source_model, source_case [ "event" ] ) == baseline_result,
                    f"Property case '{property_identifier}' failed.",
                )

        elif property_kind == "payload-locality":
            for value in property_case [ "values" ]:
                event                                                                = deepcopy ( source_case [ "event" ] )
                event.setdefault ( "payload", {} ) [ property_case [ "parameter" ] ] = value
                require (
                    evaluate ( source_model, event ) == baseline_result,
                    f"Property case '{property_identifier}' failed.",
                )

        elif property_kind == "admissible-extension-stability":
            require (
                baseline_result [ "selectedActionId" ] is not None,
                f"Property case '{property_identifier}' requires a selected baseline action.",
            )
            extended_model = deepcopy ( source_model )
            extended_model [ "rules" ].append ( property_case [ "addedRule" ] )
            require (
                not list ( model_validator.iter_errors ( extended_model ) ),
                f"Property case '{property_identifier}' generated an invalid model.",
            )
            require (
                not validate_model_semantics ( extended_model ),
                f"Property case '{property_identifier}' generated semantic diagnostics.",
            )
            extended_result = evaluate ( extended_model, source_case [ "event" ] )
            require (
                extended_result [ "selectedActionId" ] == baseline_result [ "selectedActionId" ],
                f"Property case '{property_identifier}' failed.",
            )

        else:
            raise ContractVerificationError ( f"Unknown property case kind '{property_kind}'." )

        verified_count += 1

    # Return the verified count.

    return verified_count


def main () -> int:

    manifest = load_json ( MANIFEST_PATH )
    verify_unique_case_identifiers ( manifest )

    validators      = load_schema_validators ()
    model_validator = validators [ ( SCHEMAS_DIRECTORY / "model.schema.json" ).resolve () ]

    verify_openapi ()
    numeric_edge_case_count     = verify_numeric_edge_cases ()
    parser_edge_case_count      = verify_parser_edge_cases ()
    schema_case_count           = verify_schema_cases ( manifest, validators )
    model_validation_case_count = verify_model_validation_cases ( manifest, model_validator )
    diagnostic_validator        = validators [ ( SCHEMAS_DIRECTORY / "diagnostic.schema.json" ).resolve () ]
    evaluation_cases            = load_evaluation_cases ( manifest, model_validator, diagnostic_validator )
    evaluation_case_count       = verify_evaluation_cases ( evaluation_cases )
    ambiguity_policy_case_count = verify_ambiguity_message_policy ( model_validator, diagnostic_validator )
    property_case_count         = verify_property_cases ( manifest, evaluation_cases, model_validator )

    print ( "Contract verification passed." )
    print ( f"  Schemas:                   {len(validators)}" )
    print ( f"  Schema fixture cases:      {schema_case_count}" )
    print ( f"  Semantic validation cases: {model_validation_case_count}" )
    print ( f"  Evaluation cases:          {evaluation_case_count}" )
    print ( f"  Ambiguity bound cases:     {ambiguity_policy_case_count}" )
    print ( f"  Property generators:       {property_case_count}" )
    print ( f"  Numeric edge cases:        {numeric_edge_case_count}" )
    print ( f"  Parser edge cases:         {parser_edge_case_count}" )

    # Return the value produced by this code path.

    return 0


if __name__ == "__main__":
    try:
        exit ( main () )
    except Exception as exception:
        print ( f"Contract verification failed: {exception}" )
        exit ( 1 )
