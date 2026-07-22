//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Packaged-process acceptance tests for the contract-version 1 HTTP service, configuration, and error boundary.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.cli;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.networknt.schema.Schema;
import com.networknt.schema.SchemaLocation;
import com.networknt.schema.SchemaRegistry;
import com.networknt.schema.SpecificationVersion;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

//*********************************************************************************************************************
// Class: EcaServiceIT
//
// Description:
//
//   Packaged-process acceptance tests for the contract-version 1 HTTP service, configuration, and error boundary.
//
//*********************************************************************************************************************

class EcaServiceIT
{
    //=================================================================================================================
    // Constants
    //=================================================================================================================

    private static final String        ALLOWED_ORIGIN         = "https://client.example";
    private static final String        CORRELATION_HEADER     = "X-Correlation-ID";
    private static final int           MAXIMUM_REQUEST_BYTES  = 65_536;
    private static final Pattern       LISTENING_PORT_PATTERN = Pattern.compile
    (
        "Listening on: http://(?:\\[[^]]+]|[^:]+):(\\d+)"
    );
    private static final AtomicInteger SERVICE_SEQUENCE       = new AtomicInteger ();

    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final ObjectMapper objectMapper = new ObjectMapper ();
    private final SchemaRegistry contractSchemaRegistry = createContractSchemaRegistry ();

    @TempDir
    private Path temporaryDirectory;

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: packagedServiceImplementsVersionOneHttpContract
    //
    // Description:
    //
    //   Performs the packaged service implements version one HTTP contract operation using the supplied inputs and
    //   current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    @Timeout ( 90 )
    void packagedServiceImplementsVersionOneHttpContract () throws Exception
    {
        Path contractsDirectory = contractsDirectory ();
        Path modelPath = contractsDirectory.resolve ( "conformance/models/reference-model.json" );
        RunningService service = this.startService
        (
            Map.of
            (
                "ECA_MODEL_PATH", modelPath.toString (),
                "ECA_ALLOWED_ORIGINS", ALLOWED_ORIGIN,
                "ECA_MAX_REQUEST_BYTES", Integer.toString ( MAXIMUM_REQUEST_BYTES )
            )
        );

        try
        {
            HttpResponse<String> healthResponse = service.awaitReady ();
            HttpResponse<String> informationResponse = get ( service.uri ( "/api/v1/info" ) );
            HttpResponse<String> modelResponse = get ( service.uri ( "/api/v1/model" ) );
            JsonNode health = this.objectMapper.readTree ( healthResponse.body () );
            JsonNode information = this.objectMapper.readTree ( informationResponse.body () );
            JsonNode activeModel = this.objectMapper.readTree ( modelResponse.body () );

            assertThat ( healthResponse.statusCode () ).isEqualTo ( 200 );
            assertThat ( health.get ( "status" ).textValue () ).isEqualTo ( "up" );
            assertThat ( health.get ( "ready" ).booleanValue () ).isTrue ();
            this.assertMatchesContractSchema ( health, "health.schema.json" );
            assertThat ( informationResponse.statusCode () ).isEqualTo ( 200 );
            assertThat ( information.get ( "activeModelAvailable" ).booleanValue () ).isTrue ();
            assertThat ( information.get ( "activeModelId" ).textValue () ).isEqualTo ( "reference" );
            assertThat ( information.get ( "activeModelSchemaVersion" ).textValue () ).isEqualTo ( "1.0" );
            this.assertMatchesContractSchema ( information, "service-info.schema.json" );
            assertThat ( modelResponse.statusCode () ).isEqualTo ( 200 );
            assertThat ( activeModel.get ( "id" ).textValue () ).isEqualTo ( "reference" );
            this.assertMatchesContractSchema ( activeModel, "model.schema.json" );

            this.assertValidationOperations ( service, contractsDirectory );
            this.assertEvaluationOperation ( service, contractsDirectory );
            this.assertErrorBoundary ( service );
            this.assertCorsPolicy ( service );
            assertThat ( service.process ().isAlive () ).isTrue ();
        }
        finally
        {
            service.close ();
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: packagedCliConsumesEveryConformanceFixture
    //
    // Description:
    //
    //   Performs the packaged cli consumes every conformance fixture operation using the supplied inputs and current
    //   state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    @Timeout ( 120 )
    void packagedCliConsumesEveryConformanceFixture () throws Exception
    {
        Path contractsDirectory = contractsDirectory ();
        JsonNode manifest = this.objectMapper.readTree
        (
            Files.readString ( contractsDirectory.resolve ( "conformance/manifest.json" ) )
        );

        for ( JsonNode validationCase : manifest.get ( "modelValidationCases" ) )
        {
            String caseIdentifier = validationCase.get ( "id" ).textValue ();
            Path modelPath = contractsDirectory.resolve ( validationCase.get ( "modelPath" ).textValue () );
            PackagedCommandResult commandResult = this.runPackagedCommand ( "validate", modelPath.toString () );
            JsonNode validationResult = this.objectMapper.readTree ( commandResult.standardOutput () );

            assertThat ( commandResult.exitCode () ).as ( caseIdentifier ).isZero ();
            assertThat ( commandResult.standardError () ).as ( caseIdentifier ).isEmpty ();
            assertThat ( diagnosticIdentities ( validationResult.get ( "diagnostics" ) ) )
                .as ( caseIdentifier )
                .containsExactlyElementsOf ( diagnosticIdentities ( validationCase.get ( "expectedDiagnostics" ) ) );
            this.assertMatchesContractSchema ( validationResult, "validation-result.schema.json" );
        }

        for ( JsonNode evaluationCaseEntry : manifest.get ( "evaluationCases" ) )
        {
            String caseIdentifier = evaluationCaseEntry.get ( "id" ).textValue ();
            Path casePath = contractsDirectory.resolve ( evaluationCaseEntry.get ( "casePath" ).textValue () );
            JsonNode evaluationCase = this.objectMapper.readTree ( Files.readString ( casePath ) );
            Path modelPath = casePath.getParent ()
                .resolve ( evaluationCase.get ( "modelPath" ).textValue () )
                .normalize ();
            JsonNode model = this.objectMapper.readTree ( Files.readString ( modelPath ) );
            Path eventPath = this.temporaryDirectory.resolve ( "packaged-event-" + caseIdentifier + ".json" );
            Files.writeString ( eventPath, evaluationCase.get ( "event" ).toString () );

            PackagedCommandResult commandResult = this.runPackagedCommand
            (
                "evaluate",
                modelPath.toString (),
                eventPath.toString (),
                "--trace"
            );
            JsonNode expectedDiagnostic = evaluationCase.get ( "expectedDiagnostic" );

            if ( expectedDiagnostic != null )
            {
                assertThat ( commandResult.exitCode () )
                    .as ( caseIdentifier )
                    .isEqualTo ( CliExitCode.INVALID_EVALUATION );
                assertThat ( commandResult.standardOutput () ).as ( caseIdentifier ).isEmpty ();
                assertThat ( commandResult.standardError () )
                    .as ( caseIdentifier )
                    .contains
                    (
                        expectedDiagnostic.get ( "code" ).textValue (),
                        expectedDiagnostic.get ( "message" ).textValue ()
                    );
                continue;
            }

            JsonNode evaluationResult = this.objectMapper.readTree ( commandResult.standardOutput () );
            JsonNode selectedAction = evaluationResult.get ( "selectedAction" );
            JsonNode expectedActionIdentifier = evaluationCase.get ( "expectedActionId" );

            assertThat ( commandResult.exitCode () ).as ( caseIdentifier ).isZero ();
            assertThat ( commandResult.standardError () ).as ( caseIdentifier ).isEmpty ();
            this.assertSelectedAction ( caseIdentifier, selectedAction, model, expectedActionIdentifier );
            assertThat ( evaluationResult.get ( "trace" ) )
                .as ( caseIdentifier )
                .isEqualTo ( evaluationCase.get ( "expectedTrace" ) );
        }

        Path trailingTokenPath = this.temporaryDirectory.resolve ( "trailing-token-model.json" );
        Files.writeString ( trailingTokenPath, "{} {}" );
        PackagedCommandResult trailingTokenResult = this.runPackagedCommand
        (
            "validate", trailingTokenPath.toString ()
        );
        assertThat ( trailingTokenResult.exitCode () ).isNotZero ();
        assertThat ( trailingTokenResult.standardError () ).contains ( "invalid-json" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: modelAvailabilityAndTraceConfigurationAreEnforced
    //
    // Description:
    //
    //   Performs the model availability and trace configuration are enforced operation using the supplied inputs and
    //   current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    @Timeout ( 90 )
    void modelAvailabilityAndTraceConfigurationAreEnforced () throws Exception
    {
        RunningService service = this.startService ( Map.of ( "ECA_TRACE_ENABLED", "false" ) );

        try
        {
            service.awaitReady ();
            HttpResponse<String> modelResponse = get ( service.uri ( "/api/v1/model" ) );
            HttpResponse<String> unavailableEvaluationResponse = postJson
            (
                service.uri ( "/api/v1/evaluations" ),
                Files.readString ( contractsDirectory ().resolve ( "conformance/schema/valid/evaluate-request.json" ) )
            );
            JsonNode modelProblem = this.objectMapper.readTree ( modelResponse.body () );
            JsonNode evaluationProblem = this.objectMapper.readTree ( unavailableEvaluationResponse.body () );

            assertThat ( modelResponse.statusCode () ).isEqualTo ( 404 );
            assertThat ( modelProblem.get ( "code" ).textValue () ).isEqualTo ( "active-model-not-configured" );
            assertThat ( unavailableEvaluationResponse.statusCode () ).isEqualTo ( 409 );
            assertThat ( evaluationProblem.get ( "code" ).textValue () ).isEqualTo ( "evaluation-model-unavailable" );

            JsonNode model = this.objectMapper.readTree
            (
                Files.readString ( contractsDirectory ().resolve ( "conformance/models/reference-model.json" ) )
            );
            ObjectNode suppliedModelRequest = this.objectMapper.createObjectNode ();
            suppliedModelRequest.set ( "model", model );
            suppliedModelRequest.set ( "event", this.objectMapper.readTree ( "{\"type\":\"signal.received\"}" ) );
            suppliedModelRequest.put ( "trace", true );
            HttpResponse<String> suppliedModelResponse = postJson
            (
                service.uri ( "/api/v1/evaluations" ),
                suppliedModelRequest.toString ()
            );
            JsonNode suppliedModelEvaluation = this.objectMapper.readTree ( suppliedModelResponse.body () );

            assertThat ( suppliedModelResponse.statusCode () ).isEqualTo ( 200 );
            assertThat ( suppliedModelEvaluation.get ( "modelId" ).textValue () ).isEqualTo ( "reference" );
            assertThat ( suppliedModelEvaluation.has ( "trace" ) ).isFalse ();
            this.assertSelectedAction
            (
                "trace-disabled selected action",
                suppliedModelEvaluation.get ( "selectedAction" ),
                model,
                this.objectMapper.getNodeFactory ().textNode ( "record" )
            );

            suppliedModelRequest.set ( "event", this.objectMapper.readTree ( "{\"type\":\"signal.unknown\"}" ) );
            HttpResponse<String> noActionResponse = postJson
            (
                service.uri ( "/api/v1/evaluations" ),
                suppliedModelRequest.toString ()
            );
            JsonNode noActionEvaluation = this.objectMapper.readTree ( noActionResponse.body () );

            assertThat ( noActionResponse.statusCode () ).isEqualTo ( 200 );
            assertThat ( noActionEvaluation.has ( "trace" ) ).isFalse ();
            assertThat ( noActionEvaluation.has ( "selectedAction" ) ).isTrue ();
            assertThat ( noActionEvaluation.get ( "selectedAction" ).isNull () ).isTrue ();
        }
        finally
        {
            service.close ();
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: wildcardCorsConfigurationFailsStartup
    //
    // Description:
    //
    //   Verifies that wildcard cors configuration fails startup and fails the test when the observed behavior differs.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    @Timeout ( 45 )
    void wildcardCorsConfigurationFailsStartup () throws Exception
    {
        RunningService service = this.startService ( Map.of ( "ECA_ALLOWED_ORIGINS", "*" ) );

        try
        {
            assertThat ( service.process ().waitFor ( 30, TimeUnit.SECONDS ) ).isTrue ();
            assertThat ( service.process ().exitValue () ).isNotZero ();
        }
        finally
        {
            service.close ();
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: assertValidationOperations
    //
    // Description:
    //
    //   Verifies validation operations using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   service (RunningService):
    //     The service used by this operation.
    //
    //   contractsDirectory (Path):
    //     The contracts directory used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void assertValidationOperations ( RunningService service, Path contractsDirectory ) throws Exception
    {
        JsonNode manifest = this.objectMapper.readTree
        (
            Files.readString ( contractsDirectory.resolve ( "conformance/manifest.json" ) )
        );

        for ( JsonNode validationCase : manifest.get ( "modelValidationCases" ) )
        {
            String caseIdentifier = validationCase.get ( "id" ).textValue ();
            String modelJson = Files.readString
            (
                contractsDirectory.resolve ( validationCase.get ( "modelPath" ).textValue () )
            );
            HttpResponse<String> response = postJson
            (
                service.uri ( "/api/v1/models/validate" ), modelJson
            );
            JsonNode result = this.objectMapper.readTree ( response.body () );

            assertThat ( response.statusCode () ).as ( caseIdentifier ).isEqualTo ( 200 );
            assertThat ( result.get ( "valid" ).booleanValue () )
                .as ( caseIdentifier )
                .isEqualTo ( validationCase.get ( "expectedDiagnostics" ).isEmpty () );
            assertThat ( diagnosticIdentities ( result.get ( "diagnostics" ) ) )
                .as ( caseIdentifier )
                .containsExactlyElementsOf ( diagnosticIdentities ( validationCase.get ( "expectedDiagnostics" ) ) );
            this.assertMatchesContractSchema ( result, "validation-result.schema.json" );
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: assertEvaluationOperation
    //
    // Description:
    //
    //   Verifies evaluation operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   service (RunningService):
    //     The service used by this operation.
    //
    //   contractsDirectory (Path):
    //     The contracts directory used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void assertEvaluationOperation ( RunningService service, Path contractsDirectory ) throws Exception
    {
        JsonNode manifest = this.objectMapper.readTree
        (
            Files.readString ( contractsDirectory.resolve ( "conformance/manifest.json" ) )
        );

        for ( JsonNode evaluationCaseEntry : manifest.get ( "evaluationCases" ) )
        {
            String caseIdentifier = evaluationCaseEntry.get ( "id" ).textValue ();
            Path casePath = contractsDirectory.resolve ( evaluationCaseEntry.get ( "casePath" ).textValue () );
            JsonNode evaluationCase = this.objectMapper.readTree ( Files.readString ( casePath ) );
            Path modelPath = casePath.getParent ()
                .resolve ( evaluationCase.get ( "modelPath" ).textValue () )
                .normalize ();
            JsonNode model = this.objectMapper.readTree ( Files.readString ( modelPath ) );
            ObjectNode request = this.objectMapper.createObjectNode ();
            request.set ( "model", model );
            request.set ( "event", evaluationCase.get ( "event" ) );
            request.put ( "trace", true );
            HttpResponse<String> evaluationResponse = postJson
            (
                service.uri ( "/api/v1/evaluations" ),
                request.toString (),
                Map.of ( CORRELATION_HEADER, "integration-" + caseIdentifier )
            );
            JsonNode evaluation = this.objectMapper.readTree ( evaluationResponse.body () );
            JsonNode expectedDiagnostic = evaluationCase.get ( "expectedDiagnostic" );

            if ( expectedDiagnostic != null )
            {
                this.assertProblem ( evaluationResponse, evaluation, 422, "invalid-evaluation" );
                assertThat ( evaluationResponse.headers ().firstValue ( CORRELATION_HEADER ) )
                    .as ( caseIdentifier )
                    .contains ( "integration-" + caseIdentifier );
                assertThat ( evaluation.at ( "/diagnostics/0/code" ).textValue () )
                    .as ( caseIdentifier )
                    .isEqualTo ( expectedDiagnostic.get ( "code" ).textValue () );
                assertThat ( evaluation.at ( "/diagnostics/0/message" ).textValue () )
                    .as ( caseIdentifier )
                    .isEqualTo ( expectedDiagnostic.get ( "message" ).textValue () );
                assertThat ( evaluation.at ( "/diagnostics/0/pointer" ).textValue () )
                    .as ( caseIdentifier )
                    .isEqualTo ( "/event" + expectedDiagnostic.get ( "pointer" ).textValue () );
                continue;
            }

            JsonNode selectedAction = evaluation.get ( "selectedAction" );
            JsonNode expectedActionIdentifier = evaluationCase.get ( "expectedActionId" );

            assertThat ( evaluationResponse.statusCode () ).as ( caseIdentifier ).isEqualTo ( 200 );
            assertThat ( evaluationResponse.headers ().firstValue ( CORRELATION_HEADER ) )
                .as ( caseIdentifier )
                .contains ( "integration-" + caseIdentifier );
            this.assertSelectedAction ( caseIdentifier, selectedAction, model, expectedActionIdentifier );
            assertThat ( evaluation.get ( "trace" ) )
                .as ( caseIdentifier )
                .isEqualTo ( evaluationCase.get ( "expectedTrace" ) );
            this.assertMatchesContractSchema ( evaluation, "evaluate-response.schema.json" );
        }

        HttpResponse<String> preciseNumberResponse = postJson
        (
            service.uri ( "/api/v1/evaluations" ),
            "{\"model\":null,\"event\":{\"type\":\"signal.received\",\"payload\":{\"level\":"
                + "10.000000000000000001}},\"trace\":false}"
        );
        JsonNode preciseNumberProblem = this.objectMapper.readTree ( preciseNumberResponse.body () );

        this.assertProblem ( preciseNumberResponse, preciseNumberProblem, 422, "invalid-evaluation" );
        assertThat ( preciseNumberProblem.at ( "/diagnostics/0/code" ).textValue () )
            .isEqualTo ( "ambiguous-action-selection" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: assertErrorBoundary
    //
    // Description:
    //
    //   Verifies error boundary using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   service (RunningService):
    //     The service used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void assertErrorBoundary ( RunningService service ) throws Exception
    {
        HttpResponse<String> malformedResponse = postJson
        (
            service.uri ( "/api/v1/models/validate" ), "{"
        );
        HttpResponse<String> unsupportedMediaResponse = post
        (
            service.uri ( "/api/v1/models/validate" ), "{}", "text/plain", Map.of ()
        );
        HttpResponse<String> oversizedResponse = postJson
        (
            service.uri ( "/api/v1/models/validate" ),
            "{\"padding\":\"" + "x".repeat ( MAXIMUM_REQUEST_BYTES ) + "\"}"
        );
        HttpResponse<String> invalidEvaluationResponse = postJson
        (
            service.uri ( "/api/v1/evaluations" ),
            "{\"event\":{\"type\":42}}"
        );
        HttpResponse<String> duplicateMemberResponse = postJson
        (
            service.uri ( "/api/v1/evaluations" ),
            "{\"event\":{\"type\":\"first\",\"type\":\"second\"}}"
        );
        HttpResponse<String> trailingTokenResponse = postJson
        (
            service.uri ( "/api/v1/models/validate" ), "{} {}"
        );
        JsonNode malformedProblem = this.objectMapper.readTree ( malformedResponse.body () );
        JsonNode unsupportedMediaProblem = this.objectMapper.readTree ( unsupportedMediaResponse.body () );
        JsonNode oversizedProblem = this.objectMapper.readTree ( oversizedResponse.body () );
        JsonNode invalidEvaluationProblem = this.objectMapper.readTree ( invalidEvaluationResponse.body () );
        JsonNode duplicateMemberProblem = this.objectMapper.readTree ( duplicateMemberResponse.body () );
        JsonNode trailingTokenProblem = this.objectMapper.readTree ( trailingTokenResponse.body () );

        this.assertProblem ( malformedResponse, malformedProblem, 400, "malformed-request" );
        this.assertProblem ( unsupportedMediaResponse, unsupportedMediaProblem, 415, "unsupported-media-type" );
        this.assertProblem ( oversizedResponse, oversizedProblem, 413, "request-too-large" );
        this.assertProblem ( invalidEvaluationResponse, invalidEvaluationProblem, 422, "invalid-evaluation" );
        this.assertProblem ( duplicateMemberResponse, duplicateMemberProblem, 400, "malformed-request" );
        this.assertProblem ( trailingTokenResponse, trailingTokenProblem, 400, "malformed-request" );
        assertThat ( invalidEvaluationProblem.at ( "/diagnostics/0/code" ).textValue () )
            .isEqualTo ( "invalid-event-type" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: assertCorsPolicy
    //
    // Description:
    //
    //   Verifies cors policy using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   service (RunningService):
    //     The service used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void assertCorsPolicy ( RunningService service ) throws Exception
    {
        HttpRequest preflightRequest = HttpRequest.newBuilder ( service.uri ( "/api/v1/evaluations" ) )
            .timeout ( Duration.ofSeconds ( 2 ) )
            .header ( "Origin", ALLOWED_ORIGIN )
            .header ( "Access-Control-Request-Method", "POST" )
            .header ( "Access-Control-Request-Headers", "Content-Type,X-Correlation-ID" )
            .method ( "OPTIONS", HttpRequest.BodyPublishers.noBody () )
            .build ();
        HttpResponse<String> preflightResponse = send ( preflightRequest );
        HttpRequest rejectedPreflightRequest = HttpRequest.newBuilder ( service.uri ( "/api/v1/evaluations" ) )
            .timeout ( Duration.ofSeconds ( 2 ) )
            .header ( "Origin", "https://rejected.example" )
            .header ( "Access-Control-Request-Method", "POST" )
            .method ( "OPTIONS", HttpRequest.BodyPublishers.noBody () )
            .build ();
        HttpResponse<String> rejectedPreflightResponse = send ( rejectedPreflightRequest );

        assertThat ( preflightResponse.statusCode () ).isBetween ( 200, 299 );
        assertThat ( preflightResponse.headers ().firstValue ( "Access-Control-Allow-Origin" ) )
            .contains ( ALLOWED_ORIGIN );
        assertThat
        (
            preflightResponse.headers ().firstValue ( "Access-Control-Allow-Credentials" ).orElse ( "false" )
        ).isNotEqualTo ( "true" );
        assertThat ( rejectedPreflightResponse.headers ().firstValue ( "Access-Control-Allow-Origin" ) ).isEmpty ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: startService
    //
    // Description:
    //
    //   Starts service using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   environment (Map<String, String>):
    //     The environment used by this operation.
    //
    // Returns:
    //
    //   The start service result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private RunningService startService ( Map<String, String> environment ) throws IOException
    {
        int serviceSequence = SERVICE_SEQUENCE.incrementAndGet ();
        Path packagedJar = Path.of ( System.getProperty ( "packaged.jar" ) ).toAbsolutePath ().normalize ();
        Path standardOutputPath = this.temporaryDirectory.resolve
        (
            "service-" + serviceSequence + "-output.log"
        );
        Path standardErrorPath = this.temporaryDirectory.resolve
        (
            "service-" + serviceSequence + "-error.log"
        );
        ProcessBuilder processBuilder = new ProcessBuilder
        (
            javaExecutable ().toString (),
            "-jar",
            packagedJar.toString (),
            "start"
        );
        processBuilder.environment ().put ( "PORT", "0" );
        processBuilder.environment ().putAll ( environment );
        processBuilder.redirectOutput ( standardOutputPath.toFile () );
        processBuilder.redirectError ( standardErrorPath.toFile () );

        // Return the newly constructed RunningService instance.

        return new RunningService
        (
            processBuilder.start (), standardOutputPath, standardErrorPath
        );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: runPackagedCommand
    //
    // Description:
    //
    //   Runs packaged command using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   arguments (String...):
    //     The arguments collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The run packaged command result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private PackagedCommandResult runPackagedCommand ( String... arguments ) throws Exception
    {
        Path packagedJar = Path.of ( System.getProperty ( "packaged.jar" ) ).toAbsolutePath ().normalize ();
        List<String> command = new java.util.ArrayList<> ();
        command.add ( javaExecutable ().toString () );
        command.add ( "-jar" );
        command.add ( packagedJar.toString () );
        command.addAll ( List.of ( arguments ) );
        Process process = new ProcessBuilder ( command ).start ();

        if ( !process.waitFor ( 30, TimeUnit.SECONDS ) )
        {
            process.destroyForcibly ();
            throw new AssertionError ( "The packaged CLI command did not complete." );
        }

        String standardOutput = new String ( process.getInputStream ().readAllBytes (), java.nio.charset.StandardCharsets.UTF_8 );
        String standardError = new String ( process.getErrorStream ().readAllBytes (), java.nio.charset.StandardCharsets.UTF_8 );

        // Return the newly constructed PackagedCommandResult instance.

        return new PackagedCommandResult ( process.exitValue (), standardOutput, standardError );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: assertProblem
    //
    // Description:
    //
    //   Verifies problem using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   response (HttpResponse<String>):
    //     The response used by this operation.
    //
    //   problem (JsonNode):
    //     The problem used by this operation.
    //
    //   expectedStatus (int):
    //     The expected status collection inspected or transformed by this operation.
    //
    //   expectedCode (String):
    //     The expected code used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void assertProblem (
        HttpResponse<String> response, JsonNode problem, int expectedStatus, String expectedCode )
    {
        assertThat ( response.statusCode () ).isEqualTo ( expectedStatus );
        assertThat ( response.headers ().firstValue ( "Content-Type" ).orElse ( "" ) )
            .startsWith ( "application/problem+json" );
        assertThat ( problem.get ( "status" ).intValue () ).isEqualTo ( expectedStatus );
        assertThat ( problem.get ( "code" ).textValue () ).isEqualTo ( expectedCode );
        assertThat ( problem.get ( "correlationId" ).textValue () ).isNotBlank ();
        assertThat ( response.headers ().firstValue ( CORRELATION_HEADER ) )
            .contains ( problem.get ( "correlationId" ).textValue () );
        this.assertMatchesContractSchema ( problem, "problem.schema.json" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: assertSelectedAction
    //
    // Description:
    //
    //   Verifies selected action using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   caseIdentifier (String):
    //     The stable case identifier used to locate the corresponding model element.
    //
    //   selectedAction (JsonNode):
    //     The selected action used by this operation.
    //
    //   model (JsonNode):
    //     The compiled or contract model inspected by this operation.
    //
    //   expectedActionIdentifier (JsonNode):
    //     The stable expected action identifier used to locate the corresponding model element.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void assertSelectedAction (
        String caseIdentifier, JsonNode selectedAction, JsonNode model, JsonNode expectedActionIdentifier )
    {
        JsonNode expectedAction = this.resolveExpectedAction ( model, expectedActionIdentifier );

        assertThat ( selectedAction ).as ( caseIdentifier ).isEqualTo ( expectedAction );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: resolveExpectedAction
    //
    // Description:
    //
    //   Resolves expected action using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   model (JsonNode):
    //     The compiled or contract model inspected by this operation.
    //
    //   expectedActionIdentifier (JsonNode):
    //     The stable expected action identifier used to locate the corresponding model element.
    //
    // Returns:
    //
    //   The resolve expected action result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private JsonNode resolveExpectedAction ( JsonNode model, JsonNode expectedActionIdentifier )
    {
        if ( expectedActionIdentifier == null || expectedActionIdentifier.isNull () )
        {

            // Return the result produced by the delegated operation.

            return this.objectMapper.nullNode ();
        }

        for ( JsonNode action : model.get ( "actions" ) )
        {
            if ( expectedActionIdentifier.textValue ().equals ( action.get ( "id" ).textValue () ) )
            {

                // Return the action.

                return action;
            }
        }

        throw new AssertionError ( "Expected action is not present in the conformance model." );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: assertMatchesContractSchema
    //
    // Description:
    //
    //   Verifies matches contract schema using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   document (JsonNode):
    //     The document used by this operation.
    //
    //   schemaFilename (String):
    //     The schema filename used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void assertMatchesContractSchema ( JsonNode document, String schemaFilename )
    {
        String schemaIdentifier = "https://eca-rule-engine.example/schemas/v1/" + schemaFilename;
        Schema schema = this.contractSchemaRegistry.getSchema ( SchemaLocation.of ( schemaIdentifier ) );
        assertThat ( schema.validate ( document ) ).as ( schemaFilename ).isEmpty ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: diagnosticIdentities
    //
    // Description:
    //
    //   Derives identities using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   diagnostics (JsonNode):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The diagnostic identities result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static List<String> diagnosticIdentities ( JsonNode diagnostics )
    {

        // Return the result produced by the delegated operation.

        return diagnostics.valueStream ()
            .map
            (
                diagnostic -> diagnostic.get ( "pointer" ).textValue ()
                + "|" + diagnostic.get ( "code" ).textValue ()
            )
            .toList ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: get
    //
    // Description:
    //
    //   Returns from the current model, configuration, or application state.
    //
    // Arguments:
    //
    //   uri (URI):
    //     The uri used by this operation.
    //
    // Returns:
    //
    //   The requested value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static HttpResponse<String> get ( URI uri ) throws IOException, InterruptedException
    {
        HttpRequest request = HttpRequest.newBuilder ( uri )
            .timeout ( Duration.ofSeconds ( 2 ) )
            .GET ()
            .build ();

        // Return the result produced by the delegated operation.

        return send ( request );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: postJson
    //
    // Description:
    //
    //   Posts JSON using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   uri (URI):
    //     The uri used by this operation.
    //
    //   body (String):
    //     The body used by this operation.
    //
    // Returns:
    //
    //   The post JSON result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static HttpResponse<String> postJson ( URI uri, String body ) throws IOException, InterruptedException
    {

        // Return the result produced by the delegated operation.

        return postJson ( uri, body, Map.of () );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: postJson
    //
    // Description:
    //
    //   Posts JSON using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   uri (URI):
    //     The uri used by this operation.
    //
    //   body (String):
    //     The body used by this operation.
    //
    //   headers (Map<String, String>):
    //     The headers collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The post JSON result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static HttpResponse<String> postJson (
        URI uri, String body, Map<String, String> headers ) throws IOException, InterruptedException
    {

        // Return the result produced by the delegated operation.

        return post ( uri, body, "application/json", headers );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: post
    //
    // Description:
    //
    //   Posts the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   uri (URI):
    //     The uri used by this operation.
    //
    //   body (String):
    //     The body used by this operation.
    //
    //   contentType (String):
    //     The content type used by this operation.
    //
    //   headers (Map<String, String>):
    //     The headers collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The post result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static HttpResponse<String> post (
        URI uri, String body, String contentType, Map<String, String> headers )
        throws IOException, InterruptedException
    {
        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder ( uri )
            .timeout ( Duration.ofSeconds ( 2 ) )
            .header ( "Content-Type", contentType )
            .POST ( HttpRequest.BodyPublishers.ofString ( body ) );
        headers.forEach ( requestBuilder::header );

        // Return the result produced by the delegated operation.

        return send ( requestBuilder.build () );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: send
    //
    // Description:
    //
    //   Sends the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   request (HttpRequest):
    //     The request used by this operation.
    //
    // Returns:
    //
    //   The send result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static HttpResponse<String> send ( HttpRequest request ) throws IOException, InterruptedException
    {
        HttpClient httpClient = HttpClient.newBuilder ()
            .connectTimeout ( Duration.ofSeconds ( 2 ) )
            .version ( HttpClient.Version.HTTP_1_1 )
            .build ();

        // Return the result produced by the delegated operation.

        return httpClient.send ( request, HttpResponse.BodyHandlers.ofString () );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: contractsDirectory
    //
    // Description:
    //
    //   Performs the contracts directory operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The contracts directory result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static Path contractsDirectory ()
    {

        // Return the result produced by the delegated operation.

        return Path.of ( System.getProperty ( "contracts.directory" ) ).toAbsolutePath ().normalize ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: createContractSchemaRegistry
    //
    // Description:
    //
    //   Constructs contract schema registry from the supplied inputs without mutating the caller's source values.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static SchemaRegistry createContractSchemaRegistry ()
    {
        Path schemaDirectory = contractsDirectory ().resolve ( "schemas" );
        Map<String, String> schemaSources = new LinkedHashMap<> ();

        try ( java.util.stream.Stream<Path> schemaPaths = Files.list ( schemaDirectory ) )
        {
            for ( Path schemaPath : schemaPaths.filter
            (
                path -> path.getFileName ().toString ().endsWith ( ".schema.json" )
            ).sorted ().toList () )
            {
                JsonNode schemaNode = new ObjectMapper ().readTree ( Files.readString ( schemaPath ) );
                schemaSources.put ( schemaNode.get ( "$id" ).textValue (), schemaNode.toString () );
            }
        }
        catch ( IOException exception )
        {
            throw new IllegalStateException ( "The contract schemas could not be loaded for HTTP tests.", exception );
        }

        // Return the result produced by the delegated operation.

        return SchemaRegistry.withDefaultDialect
        (
            SpecificationVersion.DRAFT_2020_12,
            registryBuilder -> registryBuilder.schemas ( schemaSources )
        );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: javaExecutable
    //
    // Description:
    //
    //   Performs the java executable operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The java executable result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static Path javaExecutable ()
    {
        String executableName = System.getProperty ( "os.name" ).startsWith ( "Windows" ) ? "java.exe" : "java";

        // Return the result produced by the delegated operation.

        return Path.of ( System.getProperty ( "java.home" ), "bin", executableName );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: readIfPresent
    //
    // Description:
    //
    //   Reads the supplied representation and returns its normalized in-memory form.
    //
    // Arguments:
    //
    //   path (Path):
    //     The path used by this operation.
    //
    // Returns:
    //
    //   The read if present result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static String readIfPresent ( Path path )
    {
        try
        {

            // Return the value selected by the evaluated condition.

            return Files.exists ( path ) ? Files.readString ( path ) : "<missing>";
        }
        catch ( IOException exception )
        {

            // Return the value produced by this code path.

            return "<unreadable>";
        }
    }

    //*****************************************************************************************************************
    // Class: PackagedCommandResult
    //
    // Description:
    //
    //   Encapsulates packaged command result state and behavior.
    //
    //*****************************************************************************************************************

    private static final class PackagedCommandResult
    {
        //=============================================================================================================
        // Fields
        //=============================================================================================================

        private final int exitCode;
        private final String standardOutput;
        private final String standardError;

        //=============================================================================================================
        // Constructors
        //=============================================================================================================

        //-------------------------------------------------------------------------------------------------------------
        // Constructor 1/2: PackagedCommandResult
        //
        // Description:
        //
        //   Creates a new PackagedCommandResult instance from the supplied values and establishes its initial
        //   invariants.
        //
        // Arguments:
        //
        //   exitCode (int):
        //     The exit code value supplied to this operation.
        //
        //   standardOutput (String):
        //     The standard output value supplied to this operation.
        //
        //   standardError (String):
        //     The standard error value supplied to this operation.
        //
        //-------------------------------------------------------------------------------------------------------------

        private PackagedCommandResult ( int exitCode, String standardOutput, String standardError )
        {
            this.exitCode       = exitCode;
            this.standardOutput = standardOutput;
            this.standardError  = standardError;
        }

        //=============================================================================================================
        // Methods
        //=============================================================================================================

        //-------------------------------------------------------------------------------------------------------------
        // Method: exitCode
        //
        // Description:
        //
        //   Performs the exit code operation using the supplied inputs and current state.
        //
        // Returns:
        //
        //   The exit code result.
        //
        //-------------------------------------------------------------------------------------------------------------

        private int exitCode ()
        {

            // Return the exit code.

            return this.exitCode;
        }

        //-------------------------------------------------------------------------------------------------------------
        // Method: standardOutput
        //
        // Description:
        //
        //   Performs the standard output operation using the supplied inputs and current state.
        //
        // Returns:
        //
        //   The standard output result.
        //
        //-------------------------------------------------------------------------------------------------------------

        private String standardOutput ()
        {

            // Return the standard output.

            return this.standardOutput;
        }

        //-------------------------------------------------------------------------------------------------------------
        // Method: standardError
        //
        // Description:
        //
        //   Performs the standard error operation using the supplied inputs and current state.
        //
        // Returns:
        //
        //   The standard error result.
        //
        //-------------------------------------------------------------------------------------------------------------

        private String standardError ()
        {

            // Return the standard error.

            return this.standardError;
        }
    }

    //*****************************************************************************************************************
    // Class: RunningService
    //
    // Description:
    //
    //   Encapsulates running service state and behavior.
    //
    //*****************************************************************************************************************

    private static final class RunningService implements AutoCloseable
    {
        //=============================================================================================================
        // Fields
        //=============================================================================================================

        private final Process process;
        private final Path standardOutputPath;
        private final Path standardErrorPath;

        private int port = -1;

        //=============================================================================================================
        // Constructors
        //=============================================================================================================

        //-------------------------------------------------------------------------------------------------------------
        // Constructor 2/2: RunningService
        //
        // Description:
        //
        //   Creates a new RunningService instance from the supplied values and establishes its initial invariants.
        //
        // Arguments:
        //
        //   process (Process):
        //     The process collection inspected or transformed by this operation.
        //
        //   standardOutputPath (Path):
        //     The standard output path value supplied to this operation.
        //
        //   standardErrorPath (Path):
        //     The standard error path value supplied to this operation.
        //
        //-------------------------------------------------------------------------------------------------------------

        private RunningService ( Process process, Path standardOutputPath, Path standardErrorPath )
        {
            this.process            = process;
            this.standardOutputPath = standardOutputPath;
            this.standardErrorPath  = standardErrorPath;
        }

        //=============================================================================================================
        // Methods
        //=============================================================================================================

        //-------------------------------------------------------------------------------------------------------------
        // Method: process
        //
        // Description:
        //
        //   Processes the supplied values using the supplied inputs and current state.
        //
        // Returns:
        //
        //   The process result.
        //
        //-------------------------------------------------------------------------------------------------------------

        private Process process ()
        {

            // Return the process.

            return this.process;
        }

        //-------------------------------------------------------------------------------------------------------------
        // Method: uri
        //
        // Description:
        //
        //   Performs the uri operation using the supplied inputs and current state.
        //
        // Arguments:
        //
        //   path (String):
        //     The path used by this operation.
        //
        // Returns:
        //
        //   The uri result.
        //
        //-------------------------------------------------------------------------------------------------------------

        private URI uri ( String path )
        {
            if ( this.port < 0 )
            {
                throw new IllegalStateException ( "The service listening port is not available yet." );
            }

            // Return the result produced by the delegated operation.

            return URI.create ( "http://127.0.0.1:" + this.port + path );
        }

        //-------------------------------------------------------------------------------------------------------------
        // Method: awaitReady
        //
        // Description:
        //
        //   Waits for ready using the supplied inputs and current state.
        //
        // Returns:
        //
        //   The await ready result.
        //
        //-------------------------------------------------------------------------------------------------------------

        private HttpResponse<String> awaitReady () throws Exception
        {
            Instant deadline = Instant.now ().plusSeconds ( 30 );
            Exception lastException = null;

            while ( Instant.now ().isBefore ( deadline ) )
            {
                if ( !this.process.isAlive () )
                {
                    throw new AssertionError
                    (
                        "The service process exited before readiness.\nstdout:\n"
                            + readIfPresent ( this.standardOutputPath )
                            + "\nstderr:\n"
                            + readIfPresent ( this.standardErrorPath )
                    );
                }

                if ( this.port < 0 )
                {
                    Matcher portMatcher = LISTENING_PORT_PATTERN.matcher ( readIfPresent ( this.standardOutputPath ) );

                    if ( portMatcher.find () )
                    {
                        this.port = Integer.parseInt ( portMatcher.group ( 1 ) );
                    }
                }

                try
                {
                    if ( this.port < 0 )
                    {
                        Thread.sleep ( 100 );
                        continue;
                    }

                    HttpResponse<String> response = get ( this.uri ( "/api/v1/health" ) );

                    if ( response.statusCode () == 200 )
                    {

                        // Return the response.

                        return response;
                    }
                }
                catch ( IOException | InterruptedException exception )
                {
                    lastException = exception;

                    if ( exception instanceof InterruptedException )
                    {
                        Thread.currentThread ().interrupt ();
                        throw exception;
                    }
                }

                Thread.sleep ( 100 );
            }

            throw new AssertionError
            (
                "The service did not become ready.\nstdout:\n"
                    + readIfPresent ( this.standardOutputPath )
                    + "\nstderr:\n"
                    + readIfPresent ( this.standardErrorPath ),
                lastException
            );
        }

        //-------------------------------------------------------------------------------------------------------------
        // Method: close
        //
        // Description:
        //
        //   Closes the supplied values using the supplied inputs and current state.
        //
        //-------------------------------------------------------------------------------------------------------------

        @Override
        public void close () throws InterruptedException
        {
            this.process.destroy ();

            if ( !this.process.waitFor ( 10, TimeUnit.SECONDS ) )
            {
                this.process.destroyForcibly ();
                this.process.waitFor ( 10, TimeUnit.SECONDS );
            }
        }
    }
}
