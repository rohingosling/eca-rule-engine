//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Contract-version 1 service, model-validation, and stateless-evaluation HTTP resources.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import io.github.rohingosling.eca.core.BuiltInPredicate;
import io.github.rohingosling.eca.core.CompiledModel;
import io.github.rohingosling.eca.core.EvaluationResult;
import io.github.rohingosling.eca.core.EventOccurrence;
import io.github.rohingosling.eca.model.Diagnostic;
import io.github.rohingosling.eca.model.ImplementationMetadata;
import io.github.rohingosling.eca.model.ModelValidationResult;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

//*********************************************************************************************************************
// Class: ServiceResource
//
// Description:
//
//   Contract-version 1 service, model-validation, and stateless-evaluation HTTP resources.
//
//*********************************************************************************************************************

@Path ( "/api/v1" )
@Produces ( MediaType.APPLICATION_JSON )
public final class ServiceResource
{
    //=================================================================================================================
    // Constants
    //=================================================================================================================

    private static final String IMPLEMENTATION_NAME    = "eca-rule-engine";
    private static final String API_VERSION            = "1";
    private static final Set<String> EVALUATION_FIELDS = Set.of ( "model", "event", "trace" );

    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final ActiveModelState activeModelState;
    private final ServiceJsonCodec jsonCodec;
    private final ProblemResponseFactory problemFactory;
    private final RequestMetadata requestMetadata;
    private final RequestDocumentReader requestDocumentReader;
    private final RuleEngineService ruleEngineService;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/2: ServiceResource
    //
    // Description:
    //
    //   Creates a new ServiceResource instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   activeModelState (ActiveModelState):
    //     The active model state value supplied to this operation.
    //
    //   configuration (ServiceConfiguration):
    //     The configuration value supplied to this operation.
    //
    //   jsonCodec (ServiceJsonCodec):
    //     The JSON codec value supplied to this operation.
    //
    //   problemFactory (ProblemResponseFactory):
    //     The problem factory value supplied to this operation.
    //
    //   requestMetadata (RequestMetadata):
    //     The request metadata value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ServiceResource (
        ActiveModelState activeModelState, ServiceConfiguration configuration, ServiceJsonCodec jsonCodec,
        ProblemResponseFactory problemFactory, RequestMetadata requestMetadata )
    {
        this
        (
            activeModelState,
            jsonCodec,
            problemFactory,
            requestMetadata,
            new RequestDocumentReader ( configuration ),
            new RuleEngineService ( configuration )
        );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 2/2: ServiceResource
    //
    // Description:
    //
    //   Creates a new ServiceResource instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   activeModelState (ActiveModelState):
    //     The active model state value supplied to this operation.
    //
    //   jsonCodec (ServiceJsonCodec):
    //     The JSON codec value supplied to this operation.
    //
    //   problemFactory (ProblemResponseFactory):
    //     The problem factory value supplied to this operation.
    //
    //   requestMetadata (RequestMetadata):
    //     The request metadata value supplied to this operation.
    //
    //   requestDocumentReader (RequestDocumentReader):
    //     The request document reader value supplied to this operation.
    //
    //   ruleEngineService (RuleEngineService):
    //     The rule engine service value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Inject
    public ServiceResource (
        ActiveModelState activeModelState, ServiceJsonCodec jsonCodec,
        ProblemResponseFactory problemFactory, RequestMetadata requestMetadata,
        RequestDocumentReader requestDocumentReader, RuleEngineService ruleEngineService )
    {
        this.activeModelState      = activeModelState;
        this.jsonCodec             = jsonCodec;
        this.problemFactory        = problemFactory;
        this.requestMetadata       = requestMetadata;
        this.requestDocumentReader = requestDocumentReader;
        this.ruleEngineService     = ruleEngineService;
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getHealth
    //
    // Description:
    //
    //   Returns health from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested health value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @GET
    @Path ( "/health" )
    public Map<String, Object> getHealth ()
    {
        Map<String, Object> health = new LinkedHashMap<> ();
        health.put ( "status", "up" );
        health.put ( "ready", this.activeModelState.isReady () );
        health.put ( "version", ImplementationMetadata.getImplementationVersion () );

        // Return the health.

        return health;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getInfo
    //
    // Description:
    //
    //   Returns info from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested info value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @GET
    @Path ( "/info" )
    public Map<String, Object> getInfo ()
    {
        Map<String, Object> information = new LinkedHashMap<> ();
        information.put ( "implementation", IMPLEMENTATION_NAME );
        information.put ( "version", ImplementationMetadata.getImplementationVersion () );
        information.put ( "apiVersion", API_VERSION );
        information.put ( "supportedSchemaVersions", List.of ( ImplementationMetadata.getContractVersion () ) );
        information.put ( "predicates", getPredicateNames () );
        information.put ( "activeModelAvailable", this.activeModelState.getActiveModel ().isPresent () );
        this.activeModelState.getActiveModel ().ifPresent
        (
            activeModel -> addActiveModelInformation
            (
                information,
                activeModel
            )
        );

        // Return the information.

        return information;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getActiveModel
    //
    // Description:
    //
    //   Returns active model from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested active model value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @GET
    @Path ( "/model" )
    public Response getActiveModel ()
    {

        // Return the result produced by the delegated operation.

        return this.activeModelState.getActiveModelDocument ()
            .map ( model -> Response.ok ( model ).build () )
            .orElseGet
            (
                () -> this.problemFactory.create
                (
                    404,
                    "active-model-not-configured",
                    "No active model is configured"
                )
            );
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: validateModel
    //
    // Description:
    //
    //   Validates model and reports deterministic diagnostics for every detected contract violation.
    //
    // Arguments:
    //
    //   requestBody (InputStream):
    //     The request body used by this operation.
    //
    // Returns:
    //
    //   The deterministic diagnostics produced by validation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @POST
    @Path ( "/models/validate" )
    @Consumes ( MediaType.APPLICATION_JSON )
    public Response validateModel ( InputStream requestBody )
    {
        RequestDocument requestDocument = this.requestDocumentReader.read ( requestBody );

        if ( requestDocument.tooLarge () )
        {

            // Return the result produced by the delegated operation.

            return this.problemFactory.create ( 413, "request-too-large", "The request body is too large" );
        }

        if ( requestDocument.malformed () || requestDocument.json ().isBlank () )
        {

            // Return the result produced by the delegated operation.

            return this.problemFactory.create ( 400, "malformed-request", "Request JSON is malformed" );
        }

        JsonNode modelDocument;

        try
        {
            modelDocument = this.jsonCodec.readTree ( requestDocument.json () );
        }
        catch ( JsonProcessingException exception )
        {

            // Return the result produced by the delegated operation.

            return this.problemFactory.create ( 400, "malformed-request", "Request JSON is malformed" );
        }

        ModelValidationResult result = this.ruleEngineService.validateModel ( modelDocument );
        this.requestMetadata.setDiagnosticCodes ( diagnosticCodes ( result.getDiagnostics () ) );
        result.getModelId ().ifPresent ( this.requestMetadata::setModelId );

        if ( hasDiagnostic ( result, "model-byte-limit-exceeded" ) )
        {

            // Return the result produced by the delegated operation.

            return this.problemFactory.create ( 413, "request-too-large", "The request body is too large" );
        }

        if ( hasDiagnostic ( result, "invalid-json" ) )
        {

            // Return the result produced by the delegated operation.

            return this.problemFactory.create
            (
                400,
                "malformed-request",
                "Request JSON is malformed",
                result.getDiagnostics ()
            );
        }

        // Return the result produced by the delegated operation.

        return Response.ok ( this.jsonCodec.createValidationResult ( result ) ).build ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: evaluateEvent
    //
    // Description:
    //
    //   Evaluates event using the current event occurrence and rule data, without retaining prior-event state.
    //
    // Arguments:
    //
    //   requestBody (InputStream):
    //     The request body used by this operation.
    //
    // Returns:
    //
    //   The evaluation result, selected action, condition trace, or predicate outcome produced for the current input.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @POST
    @Path ( "/evaluations" )
    @Consumes ( MediaType.APPLICATION_JSON )
    public Response evaluateEvent ( InputStream requestBody )
    {
        RequestDocument requestDocument = this.requestDocumentReader.read ( requestBody );

        if ( requestDocument.tooLarge () )
        {

            // Return the result produced by the delegated operation.

            return this.problemFactory.create ( 413, "request-too-large", "The request body is too large" );
        }

        if ( requestDocument.malformed () || requestDocument.json ().isBlank () )
        {

            // Return the result produced by the delegated operation.

            return this.problemFactory.create ( 400, "malformed-request", "Request JSON is malformed" );
        }

        JsonNode request;

        try
        {
            request = this.jsonCodec.readTree ( requestDocument.json () );
        }
        catch ( JsonProcessingException exception )
        {

            // Return the result produced by the delegated operation.

            return this.problemFactory.create ( 400, "malformed-request", "Request JSON is malformed" );
        }

        List<Diagnostic> requestDiagnostics = validateEvaluationRequest ( request );

        if ( !requestDiagnostics.isEmpty () )
        {

            // Return the result produced by the delegated operation.

            return this.invalidEvaluation ( requestDiagnostics );
        }

        EvaluationOperation operation = this.ruleEngineService.evaluate
        (
            request,
            this.activeModelState.getActiveModel ()
        );

        if ( operation.isModelUnavailable () )
        {

            // Return the result produced by the delegated operation.

            return this.problemFactory.create
            (
                409,
                "evaluation-model-unavailable",
                "No evaluation model is available"
            );
        }

        if ( !operation.isValid () )
        {

            // Return the result produced by the delegated operation.

            return this.invalidEvaluation ( operation.getDiagnostics () );
        }

        CompiledModel model = operation.getModel ();
        EventOccurrence eventOccurrence = operation.getEventOccurrence ();
        EvaluationResult evaluationResult = operation.getEvaluationResult ();

        this.requestMetadata.setModelId ( model.getId () );
        this.requestMetadata.setEventType ( eventOccurrence.getType () );
        this.requestMetadata.setActionSelected ( evaluationResult.getSelectedAction ().isPresent () );

        // Return the result produced by the delegated operation.

        return Response.ok ( this.jsonCodec.createEvaluationResult ( model, eventOccurrence, evaluationResult ) ).build ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: invalidEvaluation
    //
    // Description:
    //
    //   Verifies that invalid evaluation and fails the test when the observed behavior differs.
    //
    // Arguments:
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The invalid evaluation result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private Response invalidEvaluation ( List<Diagnostic> diagnostics )
    {
        List<Diagnostic> sortedDiagnostics = new ArrayList<> ( diagnostics );
        Collections.sort ( sortedDiagnostics );

        // Return the result produced by the delegated operation.

        return this.problemFactory.create
        (
            422,
            "invalid-evaluation",
            "Evaluation input is invalid",
            sortedDiagnostics
        );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: validateEvaluationRequest
    //
    // Description:
    //
    //   Validates evaluation request and reports deterministic diagnostics for every detected contract violation.
    //
    // Arguments:
    //
    //   request (JsonNode):
    //     The request used by this operation.
    //
    // Returns:
    //
    //   The deterministic diagnostics produced by validation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static List<Diagnostic> validateEvaluationRequest ( JsonNode request )
    {
        List<Diagnostic> diagnostics = new ArrayList<> ();

        if ( request == null || !request.isObject () )
        {
            diagnostics.add
            (
                new Diagnostic ( "evaluation-request-object-required", "The evaluation request must be an object.", "" )
            );

            // Return the diagnostics.

            return diagnostics;
        }

        request.fieldNames ().forEachRemaining
        (
            fieldName ->
            {
                if ( !EVALUATION_FIELDS.contains ( fieldName ) )
                {
                    diagnostics.add
                    (
                        new Diagnostic
                        (
                            "unknown-evaluation-property",
                            "The evaluation property '" + fieldName + "' is not supported.",
                            "/" + escapeJsonPointerSegment ( fieldName )
                        )
                    );
                }
            }
        );

        JsonNode event = request.get ( "event" );

        if ( event == null )
        {
            diagnostics.add ( new Diagnostic ( "evaluation-event-required", "The event is required.", "/event" ) );
        }

        JsonNode model = request.get ( "model" );

        if ( model != null && !model.isNull () && !model.isObject () )
        {
            diagnostics.add
            (
                new Diagnostic ( "invalid-evaluation-model", "The model must be an object or null.", "/model" )
            );
        }

        JsonNode trace = request.get ( "trace" );

        if ( trace != null && !trace.isBoolean () )
        {
            diagnostics.add
            (
                new Diagnostic ( "invalid-trace-option", "The trace option must be Boolean.", "/trace" )
            );
        }

        Collections.sort ( diagnostics );

        // Return the diagnostics.

        return diagnostics;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: diagnosticCodes
    //
    // Description:
    //
    //   Derives codes using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The diagnostic codes result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static List<String> diagnosticCodes ( List<Diagnostic> diagnostics )
    {

        // Return the result produced by the delegated operation.

        return diagnostics.stream ().map ( Diagnostic::getCode ).distinct ().sorted ().toList ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: hasDiagnostic
    //
    // Description:
    //
    //   Determines whether has diagnostic holds for the supplied value or application state.
    //
    // Arguments:
    //
    //   result (ModelValidationResult):
    //     The result used by this operation.
    //
    //   code (String):
    //     The code used by this operation.
    //
    // Returns:
    //
    //   True when the requested condition holds; otherwise false.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static boolean hasDiagnostic ( ModelValidationResult result, String code )
    {

        // Return the result produced by the delegated operation.

        return result.getDiagnostics ().stream ().anyMatch ( diagnostic -> code.equals ( diagnostic.getCode () ) );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: escapeJsonPointerSegment
    //
    // Description:
    //
    //   Escapes JSON pointer segment using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   segment (String):
    //     The segment used by this operation.
    //
    // Returns:
    //
    //   The escape JSON pointer segment result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static String escapeJsonPointerSegment ( String segment )
    {

        // Return the result produced by the delegated operation.

        return segment.replace ( "~", "~0" ).replace ( "/", "~1" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getPredicateNames
    //
    // Description:
    //
    //   Returns predicate names from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested predicate names value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static List<String> getPredicateNames ()
    {
        List<String> predicateNames = new ArrayList<> ();

        Arrays.stream ( BuiltInPredicate.values () )
            .map ( BuiltInPredicate::getContractName )
            .sorted ()
            .forEach ( predicateNames::add );

        // Return the predicate names.

        return predicateNames;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: addActiveModelInformation
    //
    // Description:
    //
    //   Adds active model information using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   information (Map<String, Object>):
    //     The information used by this operation.
    //
    //   activeModel (CompiledModel):
    //     The active model used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static void addActiveModelInformation (
        Map<String, Object> information, CompiledModel activeModel )
    {
        information.put ( "activeModelId", activeModel.getId () );
        information.put ( "activeModelSchemaVersion", activeModel.getSchemaVersion () );
    }

}
