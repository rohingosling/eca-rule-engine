//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Command, stream, exit-code, canonical-output, and shared-conformance acceptance tests for the CLI adapter.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.cli;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

//*********************************************************************************************************************
// Class: EcaApplicationTest
//
// Description:
//
//   Command, stream, exit-code, canonical-output, and shared-conformance acceptance tests for the CLI adapter.
//
//*********************************************************************************************************************

class EcaApplicationTest
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final ObjectMapper objectMapper = new ObjectMapper ();

    @TempDir
    private Path temporaryDirectory;

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: helpAndVersionAreSuccessful
    //
    // Description:
    //
    //   Performs the help and version are successful operation using the supplied inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void helpAndVersionAreSuccessful ()
    {
        ExecutionResult helpResult = this.execute
        (
            new String[]
            {
                "--help"
            }, ""
        );
        ExecutionResult versionResult = this.execute
        (
            new String[]
            {
                "--version"
            }, ""
        );

        assertThat ( helpResult.getExitCode () ).isEqualTo ( CliExitCode.SUCCESS );
        assertThat ( helpResult.getStandardOutput () ).contains ( "validate", "evaluate", "start" );
        assertThat ( helpResult.getStandardError () ).isEmpty ();
        assertThat ( versionResult.getExitCode () ).isEqualTo ( CliExitCode.SUCCESS );
        assertThat ( versionResult.getStandardOutput () ).contains ( "eca 0.1.0-SNAPSHOT", "contract 1.0" );
        assertThat ( versionResult.getStandardError () ).isEmpty ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: missingCommandIsSyntaxErrorWithUsage
    //
    // Description:
    //
    //   Verifies that missing command is syntax error with usage and fails the test when the observed behavior
    //   differs.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void missingCommandIsSyntaxErrorWithUsage ()
    {
        ExecutionResult result = this.execute
        (
            new String[]
            {
            }, ""
        );

        assertThat ( result.getExitCode () ).isEqualTo ( CliExitCode.SYNTAX_ERROR );
        assertThat ( result.getStandardOutput () ).contains ( "Usage: eca" );
        assertThat ( result.getStandardError () ).isEmpty ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: validateReadsStandardInputAndEmitsContractJson
    //
    // Description:
    //
    //   Validates reads standard input and emits contract JSON and reports deterministic diagnostics for every
    //   detected contract violation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void validateReadsStandardInputAndEmitsContractJson () throws Exception
    {
        String modelJson = this.readContractText ( "conformance/models/reference-model.json" );
        ExecutionResult result = this.execute
        (
            new String[]
            {
                "validate", "-"
            }, modelJson
        );
        JsonNode output = this.objectMapper.readTree ( result.getStandardOutput () );

        assertThat ( result.getExitCode () ).isEqualTo ( CliExitCode.SUCCESS );
        assertThat ( result.getStandardError () ).isEmpty ();
        assertThat ( output.get ( "valid" ).booleanValue () ).isTrue ();
        assertThat ( output.get ( "schemaVersion" ).textValue () ).isEqualTo ( "1.0" );
        assertThat ( output.get ( "modelId" ).textValue () ).isEqualTo ( "reference" );
        assertThat ( output.get ( "diagnostics" ) ).isEmpty ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: validateCapsSchemaDiagnosticMessagesAtTheContractLimit
    //
    // Description:
    //
    //   Validates caps schema diagnostic messages at the contract limit and reports deterministic diagnostics for
    //   every detected contract violation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void validateCapsSchemaDiagnosticMessagesAtTheContractLimit () throws Exception
    {
        JsonNode diagnosticSchema = this.objectMapper.readTree
        (
            this.readContractText ( "schemas/diagnostic.schema.json" )
        );
        int maximumMessageCodePoints = diagnosticSchema.at ( "/properties/message/maxLength" ).intValue ();
        String unexpectedPropertyName = "x".repeat ( maximumMessageCodePoints + 1 );
        String modelJson = "{\"schemaVersion\":\"1.0\",\"id\":\"model\",\"name\":\"Model\","
            + "\"parameters\":[],\"payloads\":[],\"events\":[],\"conditions\":[],\"actions\":[],\"rules\":[],\""
            + unexpectedPropertyName + "\":true}";

        ExecutionResult result = this.execute
        (
            new String[]
            {
                "validate", "-"
            }, modelJson
        );
        JsonNode output = this.objectMapper.readTree ( result.getStandardOutput () );
        String message = output.at ( "/diagnostics/0/message" ).textValue ();

        assertThat ( result.getExitCode () ).isEqualTo ( CliExitCode.SUCCESS );
        assertThat ( result.getStandardError () ).isEmpty ();
        assertThat ( output.at ( "/diagnostics/0/code" ).textValue () )
            .isEqualTo ( "schema-additional-properties" );
        assertThat ( message.codePointCount ( 0, message.length () ) ).isEqualTo ( maximumMessageCodePoints );
        assertThat ( message ).endsWith ( "\u2026" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: validateMatchesEverySemanticConformanceFixture
    //
    // Description:
    //
    //   Validates matches every semantic conformance fixture and reports deterministic diagnostics for every detected
    //   contract violation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void validateMatchesEverySemanticConformanceFixture () throws Exception
    {
        JsonNode manifest = this.objectMapper.readTree ( this.readContractText ( "conformance/manifest.json" ) );

        for ( JsonNode validationCase : manifest.get ( "modelValidationCases" ) )
        {
            String caseIdentifier = validationCase.get ( "id" ).textValue ();
            Path modelPath = this.contractsDirectory ().resolve
            (
                validationCase.get ( "modelPath" ).textValue ()
            );
            ExecutionResult result = this.execute
            (
                new String[]
                    {
                        "validate", modelPath.toString ()
                    },
                ""
            );
            JsonNode output = this.objectMapper.readTree ( result.getStandardOutput () );

            assertThat ( result.getExitCode () ).as ( caseIdentifier ).isEqualTo ( CliExitCode.SUCCESS );
            assertThat ( result.getStandardError () ).as ( caseIdentifier ).isEmpty ();
            assertThat ( output.get ( "valid" ).booleanValue () )
                .as ( caseIdentifier )
                .isEqualTo ( validationCase.get ( "expectedDiagnostics" ).isEmpty () );
            assertThat ( diagnosticIdentities ( output.get ( "diagnostics" ) ) )
                .as ( caseIdentifier )
                .containsExactlyElementsOf ( diagnosticIdentities ( validationCase.get ( "expectedDiagnostics" ) ) );
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: malformedAndUnreadableInputsUseDistinctExitCodes
    //
    // Description:
    //
    //   Performs the malformed and unreadable inputs use distinct exit codes operation using the supplied inputs and
    //   current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void malformedAndUnreadableInputsUseDistinctExitCodes ()
    {
        ExecutionResult malformedResult = this.execute
        (
            new String[]
            {
                "validate", "-"
            }, "{"
        );
        ExecutionResult trailingTokenResult = this.execute
        (
            new String[]
            {
                "validate", "-"
            }, "{} {}"
        );
        ExecutionResult trailingWhitespaceResult = this.execute
        (
            new String[]
            {
                "validate", "-"
            }, "{}\n\t"
        );
        ExecutionResult unreadableResult = this.execute
        (
            new String[]
                {
                    "validate", this.temporaryDirectory.resolve ( "missing.json" ).toString ()
                },
            ""
        );

        assertThat ( malformedResult.getExitCode () ).isEqualTo ( CliExitCode.INVALID_JSON );
        assertThat ( malformedResult.getStandardOutput () ).isEmpty ();
        assertThat ( malformedResult.getStandardError () ).contains ( "invalid-json" );
        assertThat ( trailingTokenResult.getExitCode () ).isEqualTo ( CliExitCode.INVALID_JSON );
        assertThat ( trailingTokenResult.getStandardError () ).contains ( "invalid-json" );
        assertThat ( trailingWhitespaceResult.getExitCode () ).isEqualTo ( CliExitCode.SUCCESS );
        assertThat ( unreadableResult.getExitCode () ).isEqualTo ( CliExitCode.CONFIGURATION_ERROR );
        assertThat ( unreadableResult.getStandardOutput () ).isEmpty ();
        assertThat ( unreadableResult.getStandardError () ).contains ( "could not be read" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: everyEvaluationFixtureMatchesTheActionOrAmbiguityDiagnosticAndCompleteTrace
    //
    // Description:
    //
    //   Verifies that every evaluation fixture matches the action or ambiguity diagnostic and complete trace and fails
    //   the test when the observed behavior differs.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void everyEvaluationFixtureMatchesTheActionOrAmbiguityDiagnosticAndCompleteTrace () throws Exception
    {
        JsonNode manifest = this.objectMapper.readTree ( this.readContractText ( "conformance/manifest.json" ) );

        for ( JsonNode evaluationCaseEntry : manifest.get ( "evaluationCases" ) )
        {
            Path casePath = this.contractsDirectory ().resolve
            (
                evaluationCaseEntry.get ( "casePath" ).textValue ()
            );
            JsonNode evaluationCase = this.objectMapper.readTree ( Files.readString ( casePath ) );
            Path modelPath = casePath.getParent ()
                .resolve ( evaluationCase.get ( "modelPath" ).textValue () )
                .normalize ();
            JsonNode model = this.objectMapper.readTree ( Files.readString ( modelPath ) );
            Path eventPath = this.temporaryDirectory.resolve
            (
                evaluationCaseEntry.get ( "id" ).textValue () + ".json"
            );
            Files.writeString ( eventPath, evaluationCase.get ( "event" ).toPrettyString () );

            ExecutionResult result = this.execute
            (
                new String[]
                    {
                        "evaluate", modelPath.toString (), eventPath.toString (), "--trace"
                    },
                ""
            );
            JsonNode expectedDiagnostic = evaluationCase.get ( "expectedDiagnostic" );

            if ( expectedDiagnostic != null )
            {
                assertThat ( result.getExitCode () )
                    .as ( evaluationCaseEntry.get ( "id" ).textValue () )
                    .isEqualTo ( CliExitCode.INVALID_EVALUATION );
                assertThat ( result.getStandardOutput () )
                    .as ( evaluationCaseEntry.get ( "id" ).textValue () )
                    .isEmpty ();
                assertThat ( result.getStandardError () )
                    .as ( evaluationCaseEntry.get ( "id" ).textValue () )
                    .contains
                    (
                        expectedDiagnostic.get ( "code" ).textValue (),
                        expectedDiagnostic.get ( "message" ).textValue ()
                    );
                continue;
            }

            JsonNode output = this.objectMapper.readTree ( result.getStandardOutput () );
            JsonNode actualAction = output.get ( "selectedAction" );
            JsonNode expectedActionIdentifier = evaluationCase.get ( "expectedActionId" );
            JsonNode expectedAction = this.resolveExpectedAction ( model, expectedActionIdentifier );

            assertThat ( result.getExitCode () )
                .as ( evaluationCaseEntry.get ( "id" ).textValue () )
                .isEqualTo ( CliExitCode.SUCCESS );
            assertThat ( result.getStandardError () )
                .as ( evaluationCaseEntry.get ( "id" ).textValue () )
                .isEmpty ();

            assertThat ( actualAction )
                .as ( evaluationCaseEntry.get ( "id" ).textValue () )
                .isEqualTo ( expectedAction );

            assertThat ( output.get ( "trace" ) )
                .as ( evaluationCaseEntry.get ( "id" ).textValue () )
                .isEqualTo ( evaluationCase.get ( "expectedTrace" ) );

            if ( "absent-payload".equals ( evaluationCaseEntry.get ( "id" ).textValue () ) )
            {
                JsonNode contractResponse = this.objectMapper.readTree
                (
                    this.readContractText ( "conformance/schema/valid/evaluate-response.json" )
                );
                assertThat ( output ).isEqualTo ( contractResponse );
            }
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: evaluateKeepsSelectedActionAndOmitsTraceUnlessRequested
    //
    // Description:
    //
    //   Evaluates keeps selected action and omits trace unless requested using the current event occurrence and rule
    //   data, without retaining prior-event state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void evaluateKeepsSelectedActionAndOmitsTraceUnlessRequested () throws Exception
    {
        Path modelPath = this.contractsDirectory ().resolve ( "conformance/models/reference-model.json" );
        JsonNode model = this.objectMapper.readTree ( Files.readString ( modelPath ) );
        Path eventPath = this.temporaryDirectory.resolve ( "event.json" );
        Files.writeString ( eventPath, "{\"type\":\"signal.received\"}" );
        ExecutionResult result = this.execute
        (
            new String[]
                {
                    "evaluate", modelPath.toString (), eventPath.toString ()
                },
            ""
        );
        JsonNode output = this.objectMapper.readTree ( result.getStandardOutput () );

        assertThat ( result.getExitCode () ).isEqualTo ( CliExitCode.SUCCESS );
        assertThat ( output.has ( "trace" ) ).isFalse ();
        assertThat ( output.has ( "selectedAction" ) ).isTrue ();
        assertThat ( output.get ( "selectedAction" ) )
            .isEqualTo
            (
                this.resolveExpectedAction
                (
                    model, this.objectMapper.getNodeFactory ().textNode ( "record" )
                )
            );

        Files.writeString ( eventPath, "{\"type\":\"signal.unknown\"}" );
        ExecutionResult noActionResult = this.execute
        (
            new String[]
                {
                    "evaluate", modelPath.toString (), eventPath.toString ()
                },
            ""
        );
        JsonNode noActionOutput = this.objectMapper.readTree ( noActionResult.getStandardOutput () );

        assertThat ( noActionResult.getExitCode () ).isEqualTo ( CliExitCode.SUCCESS );
        assertThat ( noActionOutput.has ( "trace" ) ).isFalse ();
        assertThat ( noActionOutput.has ( "selectedAction" ) ).isTrue ();
        assertThat ( noActionOutput.get ( "selectedAction" ).isNull () ).isTrue ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: evaluateRejectsTwoStandardInputsAndIncompatiblePayloads
    //
    // Description:
    //
    //   Evaluates rejects two standard inputs and incompatible payloads using the current event occurrence and rule
    //   data, without retaining prior-event state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void evaluateRejectsTwoStandardInputsAndIncompatiblePayloads () throws Exception
    {
        ExecutionResult twoInputsResult = this.execute
        (
            new String[]
                {
                    "evaluate", "-", "-"
                },
            "{}"
        );
        Path modelPath = this.contractsDirectory ().resolve ( "conformance/models/reference-model.json" );
        Path eventPath = this.temporaryDirectory.resolve ( "incompatible-event.json" );
        Files.writeString ( eventPath, "{\"type\":\"signal.received\",\"payload\":{\"level\":\"high\"}}" );
        ExecutionResult incompatibleResult = this.execute
        (
            new String[]
                {
                    "evaluate", modelPath.toString (), eventPath.toString ()
                },
            ""
        );

        assertThat ( twoInputsResult.getExitCode () ).isEqualTo ( CliExitCode.SYNTAX_ERROR );
        assertThat ( twoInputsResult.getStandardError () ).contains ( "cannot both read" );
        assertThat ( incompatibleResult.getExitCode () ).isEqualTo ( CliExitCode.INVALID_EVALUATION );
        assertThat ( incompatibleResult.getStandardOutput () ).isEmpty ();
        assertThat ( incompatibleResult.getStandardError () ).contains ( "incompatible-event-parameter" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: evaluateRejectsInvalidPayloadParameterIdentifiers
    //
    // Description:
    //
    //   Evaluates rejects invalid payload parameter identifiers using the current event occurrence and rule data,
    //   without retaining prior-event state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void evaluateRejectsInvalidPayloadParameterIdentifiers () throws Exception
    {
        Path modelPath = this.contractsDirectory ().resolve ( "conformance/models/reference-model.json" );
        Path eventPath = this.temporaryDirectory.resolve ( "invalid-payload-property.json" );
        Files.writeString ( eventPath, "{\"type\":\"signal.received\",\"payload\":{\"bad parameter\":12}}" );

        ExecutionResult result = this.execute
        (
            new String[]
                {
                    "evaluate", modelPath.toString (), eventPath.toString ()
                },
            ""
        );

        assertThat ( result.getExitCode () ).isEqualTo ( CliExitCode.INVALID_EVALUATION );
        assertThat ( result.getStandardOutput () ).isEmpty ();
        assertThat ( result.getStandardError () ).contains ( "invalid-event-payload-parameter-identifier" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: startValidatesModelBeforeCallingServiceAdapter
    //
    // Description:
    //
    //   Starts validates model before calling service adapter using the supplied inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void startValidatesModelBeforeCallingServiceAdapter () throws Exception
    {
        Path modelPath = this.contractsDirectory ().resolve ( "conformance/models/reference-model.json" );
        AtomicReference<Optional<String>> suppliedModel = new AtomicReference<> ();
        ExecutionResult result = this.execute
        (
            new String[]
                {
                    "start", modelPath.toString ()
                },
            "",
            modelJson ->
            {
                suppliedModel.set ( modelJson );

                // Return the success.

                return CliExitCode.SUCCESS;
            }
        );

        assertThat ( result.getExitCode () ).isEqualTo ( CliExitCode.SUCCESS );
        assertThat ( suppliedModel.get () ).isPresent ();
        assertThat ( suppliedModel.get ().orElseThrow () ).contains ( "\"id\": \"reference\"" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: startRejectsInvalidModelWithoutCallingServiceAdapter
    //
    // Description:
    //
    //   Starts rejects invalid model without calling service adapter using the supplied inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void startRejectsInvalidModelWithoutCallingServiceAdapter ()
    {
        AtomicBoolean serviceAdapterCalled = new AtomicBoolean ( false );
        ExecutionResult result = this.execute
        (
            new String[]
                {
                    "start", "-"
                },
            "{}",
            modelJson ->
            {
                serviceAdapterCalled.set ( true );

                // Return the success.

                return CliExitCode.SUCCESS;
            }
        );

        assertThat ( result.getExitCode () ).isEqualTo ( CliExitCode.CONFIGURATION_ERROR );
        assertThat ( serviceAdapterCalled ).isFalse ();
        assertThat ( result.getStandardError () ).contains ( "startup model is invalid" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: execute
    //
    // Description:
    //
    //   Executes the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   arguments (String[]):
    //     The arguments collection inspected or transformed by this operation.
    //
    //   standardInput (String):
    //     The standard input used by this operation.
    //
    // Returns:
    //
    //   The execute result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private ExecutionResult execute ( String[] arguments, String standardInput )
    {

        // Return the result produced by the delegated operation.

        return this.execute ( arguments, standardInput, modelJson -> CliExitCode.CONFIGURATION_ERROR );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: execute
    //
    // Description:
    //
    //   Executes the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   arguments (String[]):
    //     The arguments collection inspected or transformed by this operation.
    //
    //   standardInput (String):
    //     The standard input used by this operation.
    //
    //   serviceStarter (CliServiceStarter):
    //     The service starter used by this operation.
    //
    // Returns:
    //
    //   The execute result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private ExecutionResult execute (
        String[] arguments, String standardInput, CliServiceStarter serviceStarter )
    {
        ByteArrayOutputStream standardOutputBytes = new ByteArrayOutputStream ();
        ByteArrayOutputStream standardErrorBytes  = new ByteArrayOutputStream ();
        PrintWriter standardOutput = new PrintWriter
        (
            new OutputStreamWriter ( standardOutputBytes, StandardCharsets.UTF_8 ),
            true
        );
        PrintWriter standardError = new PrintWriter
        (
            new OutputStreamWriter ( standardErrorBytes, StandardCharsets.UTF_8 ),
            true
        );
        int exitCode = EcaApplication.execute
        (
            arguments,
            new ByteArrayInputStream ( standardInput.getBytes ( StandardCharsets.UTF_8 ) ),
            standardOutput,
            standardError,
            serviceStarter
        );

        standardOutput.flush ();
        standardError.flush ();

        // Return the newly constructed ExecutionResult instance.

        return new ExecutionResult
        (
            exitCode,
            standardOutputBytes.toString ( StandardCharsets.UTF_8 ),
            standardErrorBytes.toString ( StandardCharsets.UTF_8 )
        );
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

    private Path contractsDirectory ()
    {

        // Return the result produced by the delegated operation.

        return Path.of ( System.getProperty ( "contracts.directory" ) ).toAbsolutePath ().normalize ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: readContractText
    //
    // Description:
    //
    //   Reads the supplied representation and returns its normalized in-memory form.
    //
    // Arguments:
    //
    //   relativePath (String):
    //     The relative path used by this operation.
    //
    // Returns:
    //
    //   The read contract text result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private String readContractText ( String relativePath ) throws Exception
    {

        // Return the result produced by the delegated operation.

        return Files.readString ( this.contractsDirectory ().resolve ( relativePath ) );
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
        List<String> identities = new ArrayList<> ();

        for ( JsonNode diagnostic : diagnostics )
        {
            identities.add
            (
                diagnostic.get ( "pointer" ).textValue () + "|" + diagnostic.get ( "code" ).textValue ()
            );
        }

        // Return the identities.

        return identities;
    }

    //*****************************************************************************************************************
    // Class: ExecutionResult
    //
    // Description:
    //
    //   Encapsulates execution result state and behavior.
    //
    //*****************************************************************************************************************

    private static final class ExecutionResult
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
        // Constructor 1/1: ExecutionResult
        //
        // Description:
        //
        //   Creates a new ExecutionResult instance from the supplied values and establishes its initial invariants.
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

        private ExecutionResult ( int exitCode, String standardOutput, String standardError )
        {
            this.exitCode       = exitCode;
            this.standardOutput = standardOutput;
            this.standardError  = standardError;
        }

        //=============================================================================================================
        // Accessors
        //=============================================================================================================

        //-------------------------------------------------------------------------------------------------------------
        // Method: getExitCode
        //
        // Description:
        //
        //   Returns exit code from the current model, configuration, or application state.
        //
        // Returns:
        //
        //   The requested exit code value.
        //
        //-------------------------------------------------------------------------------------------------------------

        int getExitCode ()
        {

            // Return the exit code.

            return this.exitCode;
        }

        //-------------------------------------------------------------------------------------------------------------
        // Method: getStandardOutput
        //
        // Description:
        //
        //   Returns standard output from the current model, configuration, or application state.
        //
        // Returns:
        //
        //   The requested standard output value.
        //
        //-------------------------------------------------------------------------------------------------------------

        String getStandardOutput ()
        {

            // Return the standard output.

            return this.standardOutput;
        }

        //-------------------------------------------------------------------------------------------------------------
        // Method: getStandardError
        //
        // Description:
        //
        //   Returns standard error from the current model, configuration, or application state.
        //
        // Returns:
        //
        //   The requested standard error value.
        //
        //-------------------------------------------------------------------------------------------------------------

        String getStandardError ()
        {

            // Return the standard error.

            return this.standardError;
        }
    }
}
