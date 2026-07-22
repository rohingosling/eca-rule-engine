//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Structural, semantic, ordering, and parser-limit tests for model validation and compilation.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.model;

import com.fasterxml.jackson.databind.JsonNode;
import io.github.rohingosling.eca.core.CompiledModel;
import io.github.rohingosling.eca.core.DiagnosticMessagePolicy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

//*********************************************************************************************************************
// Class: ModelCompilerTest
//
// Description:
//
//   Structural, semantic, ordering, and parser-limit tests for model validation and compilation.
//
//*********************************************************************************************************************

class ModelCompilerTest
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final ModelCompiler compiler = new ModelCompiler ();
    private final ContractFixtureRepository fixtures = new ContractFixtureRepository
    (
        this.compiler.getObjectMapper ()
    );

    @TempDir
    private Path temporaryDirectory;

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: referenceModelCompilesIntoImmutableIndexes
    //
    // Description:
    //
    //   Performs the reference model compiles into immutable indexes operation using the supplied inputs and current
    //   state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void referenceModelCompilesIntoImmutableIndexes () throws Exception
    {
        ModelValidationResult result = this.compiler.compile
        (
            this.fixtures.readText ( "conformance/models/reference-model.json" )
        );

        assertThat ( result.isValid () ).isTrue ();
        assertThat ( result.getDiagnostics () ).isEmpty ();

        CompiledModel model = result.getCompiledModel ().orElseThrow ();
        assertThat ( model.getId () ).isEqualTo ( "reference" );
        assertThat ( model.getSchemaVersion () ).isEqualTo ( "1.0" );
        assertThat ( model.getRulesForEvent ( "signal.received" ) ).hasSize ( 3 );
        assertThat ( model.getEvents ().get ( "signal.received" ).getParameters () )
            .containsOnlyKeys ( "level", "source" );
        assertThat ( model.getEvents ().get ( "signal.received" ).getParameters ().get ( "level" ).getName () )
            .isEqualTo ( "Level" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: everyStructuralInvalidModelIsRejectedByDraft202012Schema
    //
    // Description:
    //
    //   Verifies that every structural invalid model is rejected by draft202012 schema and fails the test when the
    //   observed behavior differs.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void everyStructuralInvalidModelIsRejectedByDraft202012Schema () throws Exception
    {
        JsonNode manifest = this.fixtures.readManifest ();

        for ( JsonNode schemaCase : manifest.get ( "schemaCases" ) )
        {
            if ( !"schemas/model.schema.json".equals ( schemaCase.get ( "schemaPath" ).textValue () )
                || schemaCase.get ( "expectedValid" ).booleanValue () )
            {
                continue;
            }

            ModelValidationResult result = this.compiler.compile
            (
                this.fixtures.readText ( schemaCase.get ( "documentPath" ).textValue () )
            );

            assertThat ( result.isValid () ).as ( schemaCase.get ( "id" ).textValue () ).isFalse ();
            assertThat ( result.getDiagnostics () ).as ( schemaCase.get ( "id" ).textValue () ).isNotEmpty ();
            assertThat ( result.getDiagnostics () ).allMatch
            (
                diagnostic -> diagnostic.getCode ().startsWith ( "schema-" )
            );
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: semanticFixturesProduceExactlyTheOrderedDiagnosticIdentities
    //
    // Description:
    //
    //   Performs the semantic fixtures produce exactly the ordered diagnostic identities operation using the supplied
    //   inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void semanticFixturesProduceExactlyTheOrderedDiagnosticIdentities () throws Exception
    {
        JsonNode manifest = this.fixtures.readManifest ();

        for ( JsonNode validationCase : manifest.get ( "modelValidationCases" ) )
        {
            ModelValidationResult result = this.compiler.compile
            (
                this.fixtures.readText ( validationCase.get ( "modelPath" ).textValue () )
            );
            List<String> actualDiagnosticIdentities = new ArrayList<> ();
            List<String> expectedDiagnosticIdentities = new ArrayList<> ();

            for ( Diagnostic diagnostic : result.getDiagnostics () )
            {
                actualDiagnosticIdentities.add ( diagnostic.getPointer () + "|" + diagnostic.getCode () );
            }

            for ( JsonNode expectedDiagnostic : validationCase.get ( "expectedDiagnostics" ) )
            {
                expectedDiagnosticIdentities.add
                (
                    expectedDiagnostic.get ( "pointer" ).textValue () + "|"
                        + expectedDiagnostic.get ( "code" ).textValue ()
                );
            }

            assertThat ( actualDiagnosticIdentities )
                .as ( validationCase.get ( "id" ).textValue () )
                .containsExactlyElementsOf ( expectedDiagnosticIdentities );
            assertThat ( result.isValid () )
                .as ( validationCase.get ( "id" ).textValue () )
                .isEqualTo ( expectedDiagnosticIdentities.isEmpty () );
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: malformedDuplicateAndOversizedJsonAreRejectedDeterministically
    //
    // Description:
    //
    //   Performs the malformed duplicate and oversized JSON are rejected deterministically operation using the
    //   supplied inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void malformedDuplicateAndOversizedJsonAreRejectedDeterministically ()
    {
        ModelValidationResult malformedResult = this.compiler.compile ( "{" );
        ModelValidationResult duplicateResult = this.compiler.compile ( "{\"id\":\"first\",\"id\":\"second\"}" );
        ModelValidationResult trailingTokenResult = this.compiler.compile ( "{} {}" );
        ModelValidationResult trailingWhitespaceResult = this.compiler.compile ( "{}\n\t" );

        ModelCompiler limitedCompiler = new ModelCompiler ( new ModelLimits ( 8, 32, 16_384 ) );
        ModelValidationResult oversizedResult = limitedCompiler.compile ( "{\"value\":1}" );

        assertThat ( malformedResult.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "invalid-json" );
        assertThat ( malformedResult.getDiagnostics () ).extracting ( Diagnostic::getMessage )
            .containsExactly ( "The model document is not valid JSON." );
        assertThat ( duplicateResult.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "invalid-json" );
        assertThat ( trailingTokenResult.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "invalid-json" );
        assertThat ( trailingWhitespaceResult.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .doesNotContain ( "invalid-json" );
        assertThat ( oversizedResult.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "model-byte-limit-exceeded" );
        assertThat ( "{\"value\":1}".getBytes ( StandardCharsets.UTF_8 ).length ).isGreaterThan ( 8 );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: diagnosticDeduplicationPreservesDistinctMessagesAtOneLocation
    //
    // Description:
    //
    //   Derives deduplication preserves distinct messages at one location using the supplied inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void diagnosticDeduplicationPreservesDistinctMessagesAtOneLocation ()
    {
        Diagnostic missingIdentifier = new Diagnostic ( "schema-required", "Identifier is required.", "" );
        Diagnostic missingName       = new Diagnostic ( "schema-required", "Name is required.", "" );
        ModelValidationResult result = ModelValidationResult.invalid
        (
            "1.0",
            null,
            List.of ( missingIdentifier, missingIdentifier, missingName )
        );

        assertThat ( result.getDiagnostics () )
            .extracting ( Diagnostic::getMessage )
            .containsExactly ( "Identifier is required.", "Name is required." );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: schemaDiagnosticMessagesRespectTheContractCodePointLimit
    //
    // Description:
    //
    //   Performs the schema diagnostic messages respect the contract code point limit operation using the supplied
    //   inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void schemaDiagnosticMessagesRespectTheContractCodePointLimit ()
        throws Exception
    {
        JsonNode diagnosticSchema = this.compiler.getObjectMapper ().readTree
        (
            this.fixtures.readText ( "schemas/diagnostic.schema.json" )
        );
        int contractMaximumCodePoints = diagnosticSchema.at ( "/properties/message/maxLength" ).intValue ();
        String unexpectedPropertyName = "\uD83D\uDE00".repeat
        (
            DiagnosticMessagePolicy.MAXIMUM_MESSAGE_CODE_POINTS
        );
        String modelJson = "{\"schemaVersion\":\"1.0\",\"id\":\"model\",\"name\":\"Model\","
            + "\"parameters\":[],\"payloads\":[],\"events\":[],\"conditions\":[],\"actions\":[],\"rules\":[],\""
            + unexpectedPropertyName + "\":true}";

        ModelValidationResult result = this.compiler.compile ( modelJson );
        Diagnostic diagnostic = result.getDiagnostics ().get ( 0 );
        String message = diagnostic.getMessage ();

        assertThat ( DiagnosticMessagePolicy.MAXIMUM_MESSAGE_CODE_POINTS )
            .isEqualTo ( contractMaximumCodePoints );
        assertThat ( diagnostic.getCode () ).isEqualTo ( "schema-additional-properties" );
        assertThat ( message.codePointCount ( 0, message.length () ) )
            .isEqualTo ( DiagnosticMessagePolicy.MAXIMUM_MESSAGE_CODE_POINTS );
        assertThat ( message ).endsWith ( "\u2026" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: decimalNumbersRetainTheirExactJsonValue
    //
    // Description:
    //
    //   Performs the decimal numbers retain their exact JSON value operation using the supplied inputs and current
    //   state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void decimalNumbersRetainTheirExactJsonValue () throws Exception
    {
        String referenceModelJson = this.fixtures.readText ( "conformance/models/reference-model.json" );
        ModelValidationResult preciseResult = this.compiler.compile
        (
            referenceModelJson.replace ( "\"value\": 10", "\"value\": 10.000000000000000001" )
        );
        ModelValidationResult largeExponentResult = this.compiler.compile
        (
            referenceModelJson.replace ( "\"value\": 10", "\"value\": 1e400" )
        );

        assertThat ( preciseResult.isValid () ).isTrue ();
        assertThat
        (
            preciseResult.getCompiledModel ().orElseThrow ()
                .getCondition ( "level.high" )
                .getPredicate ()
                .getComparisonValue ()
                .asNumber ()
        ).isEqualByComparingTo ( new BigDecimal ( "10.000000000000000001" ) );
        assertThat ( largeExponentResult.isValid () ).isTrue ();
        assertThat
        (
            largeExponentResult.getCompiledModel ().orElseThrow ()
                .getCondition ( "level.high" )
                .getPredicate ()
                .getComparisonValue ()
                .asNumber ()
        ).isEqualByComparingTo ( new BigDecimal ( "1e400" ) );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: stringLimitCountsUnicodeCodePoints
    //
    // Description:
    //
    //   Verifies that string limit counts unicode code points and fails the test when the observed behavior differs.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void stringLimitCountsUnicodeCodePoints () throws Exception
    {
        ModelLimits limits = new ModelLimits
        (
            ModelLimits.DEFAULT_MAXIMUM_REQUEST_BYTES,
            ModelLimits.DEFAULT_MAXIMUM_JSON_DEPTH,
            100
        );
        ModelCompiler limitedCompiler = new ModelCompiler ( limits );
        String referenceModelJson = this.fixtures.readText ( "conformance/models/reference-model.json" );
        String supplementaryCharacters = "\uD83D\uDE00".repeat ( 80 );
        String excessiveCharacters = "x".repeat ( 101 );

        ModelValidationResult supplementaryResult = limitedCompiler.compile
        (
            referenceModelJson.replace ( "\"warning\"", "\"" + supplementaryCharacters + "\"" )
        );
        ModelValidationResult excessiveResult = limitedCompiler.compile
        (
            referenceModelJson.replace ( "\"warning\"", "\"" + excessiveCharacters + "\"" )
        );

        assertThat ( supplementaryResult.isValid () ).isTrue ();
        assertThat ( excessiveResult.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "string-limit-exceeded" );
        assertThat ( excessiveResult.getDiagnostics () ).extracting ( Diagnostic::getPointer )
            .containsExactly ( "/actions/0/parameters/severity" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: pathCompilationBoundsInputAndRejectsMalformedUtf8
    //
    // Description:
    //
    //   Performs the path compilation bounds input and rejects malformed utf8 operation using the supplied inputs and
    //   current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void pathCompilationBoundsInputAndRejectsMalformedUtf8 () throws Exception
    {
        ModelCompiler limitedCompiler = new ModelCompiler ( new ModelLimits ( 8, 32, 16_384 ) );
        Path oversizedPath = this.temporaryDirectory.resolve ( "oversized.json" );
        Path malformedUtf8Path = this.temporaryDirectory.resolve ( "malformed-utf8.json" );
        Files.writeString ( oversizedPath, "x".repeat ( 1_024 ), StandardCharsets.UTF_8 );
        Files.write
        (
            malformedUtf8Path, new byte[]
            {
                (byte) 0xC3, (byte) 0x28
            }
        );

        ModelValidationResult oversizedResult = limitedCompiler.compile ( oversizedPath );
        ModelValidationResult malformedUtf8Result = this.compiler.compile ( malformedUtf8Path );

        assertThat ( oversizedResult.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "model-byte-limit-exceeded" );
        assertThat ( malformedUtf8Result.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "model-read-failed" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: configurableCollectionLimitsRejectOtherwiseValidModels
    //
    // Description:
    //
    //   Performs the configurable collection limits reject otherwise valid models operation using the supplied inputs
    //   and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void configurableCollectionLimitsRejectOtherwiseValidModels () throws Exception
    {
        ModelLimits limits = new ModelLimits
        (
            ModelLimits.DEFAULT_MAXIMUM_REQUEST_BYTES,
            ModelLimits.DEFAULT_MAXIMUM_JSON_DEPTH,
            ModelLimits.DEFAULT_MAXIMUM_STRING_LENGTH,
            ModelLimits.DEFAULT_MAXIMUM_EVENTS,
            ModelLimits.DEFAULT_MAXIMUM_CONDITIONS,
            1,
            ModelLimits.DEFAULT_MAXIMUM_RULES,
            ModelLimits.DEFAULT_MAXIMUM_PAYLOAD_VALUES
        );
        ModelCompiler limitedCompiler = new ModelCompiler ( limits );
        ModelValidationResult result = limitedCompiler.compile
        (
            this.fixtures.readText ( "conformance/models/reference-model.json" )
        );

        assertThat ( result.isValid () ).isFalse ();
        assertThat ( result.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "action-limit-exceeded" );
        assertThat ( result.getDiagnostics () ).extracting ( Diagnostic::getPointer )
            .containsExactly ( "/actions" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: configurableParameterAndPayloadLimitsRejectOtherwiseValidModels
    //
    // Description:
    //
    //   Performs the configurable parameter and payload limits reject otherwise valid models operation using the
    //   supplied inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void configurableParameterAndPayloadLimitsRejectOtherwiseValidModels () throws Exception
    {
        String referenceModelJson = this.fixtures.readText ( "conformance/models/reference-model.json" );
        ModelLimits parameterLimits = new ModelLimits
        (
            ModelLimits.DEFAULT_MAXIMUM_REQUEST_BYTES,
            ModelLimits.DEFAULT_MAXIMUM_JSON_DEPTH,
            ModelLimits.DEFAULT_MAXIMUM_STRING_LENGTH,
            1,
            ModelLimits.DEFAULT_MAXIMUM_PAYLOADS,
            ModelLimits.DEFAULT_MAXIMUM_EVENTS,
            ModelLimits.DEFAULT_MAXIMUM_CONDITIONS,
            ModelLimits.DEFAULT_MAXIMUM_ACTIONS,
            ModelLimits.DEFAULT_MAXIMUM_RULES,
            ModelLimits.DEFAULT_MAXIMUM_PAYLOAD_VALUES
        );
        ModelLimits payloadLimits = new ModelLimits
        (
            ModelLimits.DEFAULT_MAXIMUM_REQUEST_BYTES,
            ModelLimits.DEFAULT_MAXIMUM_JSON_DEPTH,
            ModelLimits.DEFAULT_MAXIMUM_STRING_LENGTH,
            ModelLimits.DEFAULT_MAXIMUM_PARAMETERS,
            1,
            ModelLimits.DEFAULT_MAXIMUM_EVENTS,
            ModelLimits.DEFAULT_MAXIMUM_CONDITIONS,
            ModelLimits.DEFAULT_MAXIMUM_ACTIONS,
            ModelLimits.DEFAULT_MAXIMUM_RULES,
            ModelLimits.DEFAULT_MAXIMUM_PAYLOAD_VALUES
        );
        String twoPayloadModelJson = referenceModelJson.replace
        (
            "\"payloads\": [",
            "\"payloads\": [{\"id\":\"unused\",\"name\":\"Unused\",\"parameters\":[]},"
        );

        ModelValidationResult parameterResult = new ModelCompiler ( parameterLimits ).compile ( referenceModelJson );
        ModelValidationResult payloadResult = new ModelCompiler ( payloadLimits ).compile ( twoPayloadModelJson );

        assertThat ( parameterResult.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "parameter-limit-exceeded" );
        assertThat ( parameterResult.getDiagnostics () ).extracting ( Diagnostic::getPointer )
            .containsExactly ( "/parameters" );
        assertThat ( payloadResult.getDiagnostics () ).extracting ( Diagnostic::getCode )
            .containsExactly ( "payload-limit-exceeded" );
        assertThat ( payloadResult.getDiagnostics () ).extracting ( Diagnostic::getPointer )
            .containsExactly ( "/payloads" );
    }
}
