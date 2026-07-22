//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Bounded JSON parsing, Draft 2020-12 validation, semantic validation, and immutable model compilation.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.model;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.networknt.schema.Error;
import com.networknt.schema.Schema;
import com.networknt.schema.SchemaRegistry;
import com.networknt.schema.SchemaRegistryConfig;
import com.networknt.schema.SpecificationVersion;
import com.networknt.schema.path.PathType;
import io.github.rohingosling.eca.core.Action;
import io.github.rohingosling.eca.core.BuiltInPredicate;
import io.github.rohingosling.eca.core.CompiledModel;
import io.github.rohingosling.eca.core.Condition;
import io.github.rohingosling.eca.core.EventType;
import io.github.rohingosling.eca.core.ParameterDefinition;
import io.github.rohingosling.eca.core.ParameterType;
import io.github.rohingosling.eca.core.PredicateDefinition;
import io.github.rohingosling.eca.core.Rule;
import io.github.rohingosling.eca.core.Value;

import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

//*********************************************************************************************************************
// Class: ModelCompiler
//
// Description:
//
//   Bounded JSON parsing, Draft 2020-12 validation, semantic validation, and immutable model compilation.
//
//*********************************************************************************************************************

public final class ModelCompiler
{
    //=================================================================================================================
    // Constants
    //=================================================================================================================

    private static final String MODEL_SCHEMA_RESOURCE = "/contracts/schemas/model.schema.json";

    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final ModelLimits limits;
    private final ObjectMapper objectMapper;
    private final Schema modelSchema;
    private final SemanticModelValidator semanticValidator;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/2: ModelCompiler
    //
    // Description:
    //
    //   Creates a new ModelCompiler instance from the supplied values and establishes its initial invariants.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ModelCompiler ()
    {
        this ( ModelLimits.defaults () );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 2/2: ModelCompiler
    //
    // Description:
    //
    //   Creates a new ModelCompiler instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   limits (ModelLimits):
    //     The limits collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ModelCompiler ( ModelLimits limits )
    {
        this.limits            = Objects.requireNonNull ( limits, "limits" );
        this.objectMapper      = JsonParserFactory.create ( limits );
        this.modelSchema       = this.loadModelSchema ();
        this.semanticValidator = new SemanticModelValidator ();
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: compile
    //
    // Description:
    //
    //   Compiles the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   modelPath (Path):
    //     The model path used by this operation.
    //
    // Returns:
    //
    //   The compile result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ModelValidationResult compile ( Path modelPath )
    {
        Objects.requireNonNull ( modelPath, "modelPath" );

        try ( InputStream inputStream = Files.newInputStream ( modelPath ) )
        {
            int maximumRequestBytes = this.limits.getMaximumRequestBytes ();
            int boundedReadLength = maximumRequestBytes == Integer.MAX_VALUE
                ? Integer.MAX_VALUE
                : maximumRequestBytes + 1;
            byte[] documentBytes = inputStream.readNBytes ( boundedReadLength );

            if ( documentBytes.length > maximumRequestBytes )
            {

                // Return the result produced by the delegated operation.

                return byteLimitExceeded ();
            }

            String modelJson = StandardCharsets.UTF_8.newDecoder ()
                .onMalformedInput ( CodingErrorAction.REPORT )
                .onUnmappableCharacter ( CodingErrorAction.REPORT )
                .decode ( ByteBuffer.wrap ( documentBytes ) )
                .toString ();

            // Return the result produced by the delegated operation.

            return this.compile ( modelJson );
        }
        catch ( CharacterCodingException exception )
        {

            // Return the result produced by the delegated operation.

            return ModelValidationResult.invalid
            (
                null,
                null,
                Collections.singletonList
                (
                    new Diagnostic ( "model-read-failed", "The model could not be read as UTF-8 text.", "" )
                )
            );
        }
        catch ( IOException exception )
        {

            // Return the result produced by the delegated operation.

            return modelReadFailed ();
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: compile
    //
    // Description:
    //
    //   Compiles the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   modelJson (String):
    //     The model JSON used by this operation.
    //
    // Returns:
    //
    //   The compile result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ModelValidationResult compile ( String modelJson )
    {
        Objects.requireNonNull ( modelJson, "modelJson" );

        if ( modelJson.getBytes ( StandardCharsets.UTF_8 ).length > this.limits.getMaximumRequestBytes () )
        {

            // Return the result produced by the delegated operation.

            return byteLimitExceeded ();
        }

        JsonNode model;

        try
        {
            model = this.objectMapper.readTree ( modelJson );
        }
        catch ( JsonProcessingException exception )
        {

            // Return the result produced by the delegated operation.

            return ModelValidationResult.invalid
            (
                null,
                null,
                Collections.singletonList
                (
                    new Diagnostic ( "invalid-json", "The model document is not valid JSON.", "" )
                )
            );
        }

        if ( model == null )
        {

            // Return the result produced by the delegated operation.

            return ModelValidationResult.invalid
            (
                null,
                null,
                Collections.singletonList
                (
                    new Diagnostic ( "invalid-json", "The model document is empty.", "" )
                )
            );
        }

        // Return the result produced by the delegated operation.

        return this.compile ( model );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: compile
    //
    // Description:
    //
    //   Compiles the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   model (JsonNode):
    //     The compiled or contract model inspected by this operation.
    //
    // Returns:
    //
    //   The compile result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ModelValidationResult compile ( JsonNode model )
    {
        Objects.requireNonNull ( model, "model" );

        String schemaVersion = this.readOptionalText ( model, "schemaVersion" );
        String modelId = this.readOptionalText ( model, "id" );
        List<Diagnostic> stringLimitDiagnostics = JsonStringLimitValidator.validate
        (
            model,
            this.limits.getMaximumStringLength ()
        );

        if ( !stringLimitDiagnostics.isEmpty () )
        {

            // Return the result produced by the delegated operation.

            return ModelValidationResult.invalid ( schemaVersion, modelId, stringLimitDiagnostics );
        }

        List<Diagnostic> schemaDiagnostics = this.validateSchema ( model );

        if ( !schemaDiagnostics.isEmpty () )
        {

            // Return the result produced by the delegated operation.

            return ModelValidationResult.invalid ( schemaVersion, modelId, schemaDiagnostics );
        }

        List<Diagnostic> limitDiagnostics = this.validateConfiguredLimits ( model );

        if ( !limitDiagnostics.isEmpty () )
        {

            // Return the result produced by the delegated operation.

            return ModelValidationResult.invalid ( schemaVersion, modelId, limitDiagnostics );
        }

        List<Diagnostic> semanticDiagnostics = this.semanticValidator.validate ( model );

        if ( !semanticDiagnostics.isEmpty () )
        {

            // Return the result produced by the delegated operation.

            return ModelValidationResult.invalid ( schemaVersion, modelId, semanticDiagnostics );
        }

        // Return the result produced by the delegated operation.

        return ModelValidationResult.valid ( this.compileModel ( model ) );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getObjectMapper
    //
    // Description:
    //
    //   Returns object mapper from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested object mapper value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    ObjectMapper getObjectMapper ()
    {

        // Return the object mapper.

        return this.objectMapper;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: loadModelSchema
    //
    // Description:
    //
    //   Loads model schema using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The load model schema result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private Schema loadModelSchema ()
    {
        try ( InputStream schemaStream = ModelCompiler.class.getResourceAsStream ( MODEL_SCHEMA_RESOURCE ) )
        {
            if ( schemaStream == null )
            {
                throw new IllegalStateException ( "The model schema resource is missing." );
            }

            JsonNode schemaNode = this.objectMapper.readTree ( schemaStream );
            SchemaRegistryConfig registryConfig = SchemaRegistryConfig.builder ()
                .locale ( Locale.ROOT )
                .pathType ( PathType.JSON_POINTER )
                .formatAssertionsEnabled ( true )
                .build ();
            SchemaRegistry schemaRegistry = SchemaRegistry.withDefaultDialect
            (
                SpecificationVersion.DRAFT_2020_12,
                registryBuilder -> registryBuilder.schemaRegistryConfig ( registryConfig )
            );

            // Return the result produced by the delegated operation.

            return schemaRegistry.getSchema ( schemaNode );
        }
        catch ( IOException exception )
        {
            throw new IllegalStateException ( "The model schema resource could not be loaded.", exception );
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: validateSchema
    //
    // Description:
    //
    //   Validates schema and reports deterministic diagnostics for every detected contract violation.
    //
    // Arguments:
    //
    //   model (JsonNode):
    //     The compiled or contract model inspected by this operation.
    //
    // Returns:
    //
    //   The deterministic diagnostics produced by validation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private List<Diagnostic> validateSchema ( JsonNode model )
    {
        List<Diagnostic> diagnostics = new ArrayList<> ();

        for ( Error error : this.modelSchema.validate ( model ) )
        {
            diagnostics.add
            (
                new Diagnostic
                (
                    "schema-" + toKebabCase ( error.getKeyword () ),
                    error.getMessage (),
                    normalizePointer ( error.getInstanceLocation ().toString () )
                )
            );
        }

        Collections.sort ( diagnostics );

        // Return the diagnostics.

        return diagnostics;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: validateConfiguredLimits
    //
    // Description:
    //
    //   Validates configured limits and reports deterministic diagnostics for every detected contract violation.
    //
    // Arguments:
    //
    //   model (JsonNode):
    //     The compiled or contract model inspected by this operation.
    //
    // Returns:
    //
    //   The deterministic diagnostics produced by validation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private List<Diagnostic> validateConfiguredLimits ( JsonNode model )
    {
        List<Diagnostic> diagnostics = new ArrayList<> ();
        this.addCollectionLimitDiagnostic
        (
            diagnostics, model, "parameters", this.limits.getMaximumParameters (), "parameter-limit-exceeded"
        );
        this.addCollectionLimitDiagnostic
        (
            diagnostics, model, "payloads", this.limits.getMaximumPayloads (), "payload-limit-exceeded"
        );
        this.addCollectionLimitDiagnostic
        (
            diagnostics, model, "events", this.limits.getMaximumEvents (), "event-limit-exceeded"
        );
        this.addCollectionLimitDiagnostic
        (
            diagnostics, model, "conditions", this.limits.getMaximumConditions (), "condition-limit-exceeded"
        );
        this.addCollectionLimitDiagnostic
        (
            diagnostics, model, "actions", this.limits.getMaximumActions (), "action-limit-exceeded"
        );
        this.addCollectionLimitDiagnostic
        (
            diagnostics, model, "rules", this.limits.getMaximumRules (), "rule-limit-exceeded"
        );
        Collections.sort ( diagnostics );

        // Return the diagnostics.

        return diagnostics;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: addCollectionLimitDiagnostic
    //
    // Description:
    //
    //   Adds collection limit diagnostic using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    //   model (JsonNode):
    //     The compiled or contract model inspected by this operation.
    //
    //   collectionName (String):
    //     The collection name collection inspected or transformed by this operation.
    //
    //   maximumSize (int):
    //     The maximum size used by this operation.
    //
    //   code (String):
    //     The code used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void addCollectionLimitDiagnostic (
        List<Diagnostic> diagnostics, JsonNode model, String collectionName, int maximumSize, String code )
    {
        if ( model.get ( collectionName ).size () > maximumSize )
        {
            diagnostics.add
            (
                new Diagnostic
                (
                    code,
                    "The model exceeds the configured " + collectionName + " limit of " + maximumSize + ".",
                    "/" + collectionName
                )
            );
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: compileModel
    //
    // Description:
    //
    //   Compiles model using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   model (JsonNode):
    //     The compiled or contract model inspected by this operation.
    //
    // Returns:
    //
    //   The compile model result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private CompiledModel compileModel ( JsonNode model )
    {
        Map<String, JsonNode> parameters = this.indexByIdentifier ( model.get ( "parameters" ) );
        Map<String, JsonNode> payloads   = this.indexByIdentifier ( model.get ( "payloads" ) );

        // Return the newly constructed CompiledModel instance.

        return new CompiledModel
        (
            model.get ( "schemaVersion" ).textValue (),
            model.get ( "id" ).textValue (),
            this.compileEvents ( model.get ( "events" ), payloads, parameters ),
            this.compileConditions ( model.get ( "conditions" ) ),
            this.compileActions ( model.get ( "actions" ) ),
            this.compileRules ( model.get ( "rules" ) )
        );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: compileEvents
    //
    // Description:
    //
    //   Compiles events using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   events (JsonNode):
    //     The events collection inspected or transformed by this operation.
    //
    //   payloads (Map<String, JsonNode>):
    //     The payloads collection inspected or transformed by this operation.
    //
    //   parameters (Map<String, JsonNode>):
    //     The parameters collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The compile events result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private List<EventType> compileEvents (
        JsonNode events, Map<String, JsonNode> payloads, Map<String, JsonNode> parameters )
    {
        List<EventType> compiledEvents = new ArrayList<> ();

        for ( JsonNode event : events )
        {
            List<ParameterDefinition> compiledParameters = new ArrayList<> ();
            JsonNode payloadReference = event.get ( "payload" );

            if ( payloadReference != null )
            {
                JsonNode payload = payloads.get ( payloadReference.textValue () );

                for ( JsonNode parameterReference : payload.get ( "parameters" ) )
                {
                    JsonNode parameter = parameters.get ( parameterReference.textValue () );
                    compiledParameters.add
                    (
                        new ParameterDefinition
                        (
                            parameter.get ( "id" ).textValue (),
                            parameter.get ( "name" ).textValue (),
                            ParameterType.fromContractName ( parameter.get ( "type" ).textValue () )
                        )
                    );
                }
            }

            compiledEvents.add
            (
                new EventType
                (
                    event.get ( "id" ).textValue (),
                    event.get ( "name" ).textValue (),
                    compiledParameters
                )
            );
        }

        // Return the compiled events.

        return compiledEvents;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: compileConditions
    //
    // Description:
    //
    //   Compiles conditions using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   conditions (JsonNode):
    //     The conditions collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The compile conditions result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private List<Condition> compileConditions ( JsonNode conditions )
    {
        List<Condition> compiledConditions = new ArrayList<> ();

        for ( JsonNode condition : conditions )
        {
            JsonNode predicateNode = condition.get ( "predicate" );
            String predicateName = predicateNode.get ( "name" ).textValue ();
            PredicateDefinition predicate;

            if ( "always".equals ( predicateName ) )
            {
                predicate = PredicateDefinition.always ();
            }
            else
            {
                JsonNode arguments = predicateNode.get ( "arguments" );
                predicate = PredicateDefinition.comparison
                (
                    BuiltInPredicate.fromContractName ( predicateName ),
                    arguments.get ( "parameter" ).textValue (),
                    JsonValueConverter.convert ( arguments.get ( "value" ) )
                );
            }

            List<String> dependencies = new ArrayList<> ();

            for ( JsonNode dependency : condition.get ( "dependencies" ) )
            {
                dependencies.add ( dependency.textValue () );
            }

            compiledConditions.add
            (
                new Condition
                (
                    condition.get ( "id" ).textValue (),
                    condition.get ( "name" ).textValue (),
                    dependencies,
                    predicate
                )
            );
        }

        // Return the compiled conditions.

        return compiledConditions;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: compileActions
    //
    // Description:
    //
    //   Compiles actions using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   actions (JsonNode):
    //     The actions collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The compile actions result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private List<Action> compileActions ( JsonNode actions )
    {
        List<Action> compiledActions = new ArrayList<> ();

        for ( JsonNode action : actions )
        {
            Map<String, Value> parameters = JsonValueConverter.convert ( action.get ( "parameters" ) ).asObject ();
            compiledActions.add
            (
                new Action
                (
                    action.get ( "id" ).textValue (),
                    action.get ( "name" ).textValue (),
                    this.readOptionalText ( action, "description" ),
                    parameters
                )
            );
        }

        // Return the compiled actions.

        return compiledActions;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: compileRules
    //
    // Description:
    //
    //   Compiles rules using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   rules (JsonNode):
    //     The rules collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The compile rules result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private List<Rule> compileRules ( JsonNode rules )
    {
        List<Rule> compiledRules = new ArrayList<> ();

        for ( JsonNode rule : rules )
        {
            compiledRules.add
            (
                new Rule
                (
                    rule.get ( "id" ).textValue (),
                    rule.get ( "name" ).textValue (),
                    rule.get ( "event" ).textValue (),
                    rule.get ( "condition" ).textValue (),
                    rule.get ( "action" ).textValue ()
                )
            );
        }

        // Return the compiled rules.

        return compiledRules;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: indexByIdentifier
    //
    // Description:
    //
    //   Builds a lookup that retains the first item associated with each identifier.
    //
    // Arguments:
    //
    //   collection (JsonNode):
    //     The collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The index by identifier result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private Map<String, JsonNode> indexByIdentifier ( JsonNode collection )
    {
        Map<String, JsonNode> indexedCollection = new LinkedHashMap<> ();

        for ( JsonNode item : collection )
        {
            indexedCollection.putIfAbsent ( item.get ( "id" ).textValue (), item );
        }

        // Return the indexed collection.

        return indexedCollection;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: readOptionalText
    //
    // Description:
    //
    //   Reads the supplied representation and returns its normalized in-memory form.
    //
    // Arguments:
    //
    //   parent (JsonNode):
    //     The parent used by this operation.
    //
    //   fieldName (String):
    //     The field name used by this operation.
    //
    // Returns:
    //
    //   The read optional text result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private String readOptionalText ( JsonNode parent, String fieldName )
    {
        JsonNode value = parent.get ( fieldName );

        // Return the value selected by the evaluated condition.

        return value != null && value.isTextual () ? value.textValue () : null;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: normalizePointer
    //
    // Description:
    //
    //   Normalizes pointer using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   pointer (String):
    //     The pointer used by this operation.
    //
    // Returns:
    //
    //   The normalize pointer result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static String normalizePointer ( String pointer )
    {
        if ( pointer == null || pointer.isEmpty () || "#".equals ( pointer ) )
        {

            // Return the value produced by this code path.

            return "";
        }

        // Return the value selected by the evaluated condition.

        return pointer.startsWith ( "#" ) ? pointer.substring ( 1 ) : pointer;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: byteLimitExceeded
    //
    // Description:
    //
    //   Performs the byte limit exceeded operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The byte limit exceeded result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static ModelValidationResult byteLimitExceeded ()
    {

        // Return the result produced by the delegated operation.

        return ModelValidationResult.invalid
        (
            null,
            null,
            Collections.singletonList
            (
                new Diagnostic ( "model-byte-limit-exceeded", "The model exceeds the configured byte limit.", "" )
            )
        );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: modelReadFailed
    //
    // Description:
    //
    //   Performs the model read failed operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The model read failed result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static ModelValidationResult modelReadFailed ()
    {

        // Return the result produced by the delegated operation.

        return ModelValidationResult.invalid
        (
            null,
            null,
            Collections.singletonList
            (
                new Diagnostic ( "model-read-failed", "The model could not be read as UTF-8 text.", "" )
            )
        );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: toKebabCase
    //
    // Description:
    //
    //   Performs the to kebab case operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   value (String):
    //     The value used by this operation.
    //
    // Returns:
    //
    //   The to kebab case result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static String toKebabCase ( String value )
    {
        if ( value == null || value.isEmpty () )
        {

            // Return the value produced by this code path.

            return "validation";
        }

        StringBuilder result = new StringBuilder ();

        for ( int characterIndex = 0; characterIndex < value.length (); characterIndex++ )
        {
            char character = value.charAt ( characterIndex );

            if ( Character.isUpperCase ( character ) )
            {
                result.append ( '-' ).append ( Character.toLowerCase ( character ) );
            }
            else if ( character == '_' )
            {
                result.append ( '-' );
            }
            else
            {
                result.append ( character );
            }
        }

        // Return the result produced by the delegated operation.

        return result.toString ();
    }
}
