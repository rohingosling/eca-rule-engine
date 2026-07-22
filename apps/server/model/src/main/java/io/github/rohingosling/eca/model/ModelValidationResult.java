//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Deterministic validation result containing either an immutable compiled model or ordered diagnostics.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.model;

import io.github.rohingosling.eca.core.CompiledModel;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

//*********************************************************************************************************************
// Class: ModelValidationResult
//
// Description:
//
//   Deterministic validation result containing either an immutable compiled model or ordered diagnostics.
//
//*********************************************************************************************************************

public final class ModelValidationResult
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final String schemaVersion;
    private final String modelId;
    private final List<Diagnostic> diagnostics;
    private final CompiledModel compiledModel;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: ModelValidationResult
    //
    // Description:
    //
    //   Creates a new ModelValidationResult instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   schemaVersion (String):
    //     The schema version value supplied to this operation.
    //
    //   modelId (String):
    //     The stable model ID used to locate the corresponding model element.
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    //   compiledModel (CompiledModel):
    //     The compiled model value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private ModelValidationResult (
        String schemaVersion, String modelId, List<Diagnostic> diagnostics, CompiledModel compiledModel )
    {
        List<Diagnostic> sortedDiagnostics = diagnostics.stream ().distinct ().sorted ().toList ();

        this.schemaVersion = schemaVersion;
        this.modelId       = modelId;
        this.diagnostics   = sortedDiagnostics;
        this.compiledModel = compiledModel;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: valid
    //
    // Description:
    //
    //   Verifies that valid and fails the test when the observed behavior differs.
    //
    // Arguments:
    //
    //   compiledModel (CompiledModel):
    //     The compiled model used by this operation.
    //
    // Returns:
    //
    //   The valid result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static ModelValidationResult valid ( CompiledModel compiledModel )
    {

        // Return the newly constructed ModelValidationResult instance.

        return new ModelValidationResult
        (
            compiledModel.getSchemaVersion (), compiledModel.getId (), Collections.emptyList (), compiledModel
        );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: invalid
    //
    // Description:
    //
    //   Verifies that invalid and fails the test when the observed behavior differs.
    //
    // Arguments:
    //
    //   schemaVersion (String):
    //     The schema version used by this operation.
    //
    //   modelId (String):
    //     The stable model ID used to locate the corresponding model element.
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The invalid result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static ModelValidationResult invalid (
        String schemaVersion, String modelId, List<Diagnostic> diagnostics )
    {

        // Return the newly constructed ModelValidationResult instance.

        return new ModelValidationResult ( schemaVersion, modelId, diagnostics, null );
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: isValid
    //
    // Description:
    //
    //   Determines whether is valid holds for the supplied value or application state.
    //
    // Returns:
    //
    //   True when the requested condition holds; otherwise false.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public boolean isValid ()
    {

        // Return the result produced by the delegated operation.

        return this.diagnostics.isEmpty () && this.compiledModel != null;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getSchemaVersion
    //
    // Description:
    //
    //   Returns schema version from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested schema version value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Optional<String> getSchemaVersion ()
    {

        // Return the result produced by the delegated operation.

        return Optional.ofNullable ( this.schemaVersion );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getModelId
    //
    // Description:
    //
    //   Returns model ID from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested model ID value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Optional<String> getModelId ()
    {

        // Return the result produced by the delegated operation.

        return Optional.ofNullable ( this.modelId );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getDiagnostics
    //
    // Description:
    //
    //   Returns diagnostics from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested diagnostics value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public List<Diagnostic> getDiagnostics ()
    {

        // Return the diagnostics.

        return this.diagnostics;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getCompiledModel
    //
    // Description:
    //
    //   Returns compiled model from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested compiled model value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Optional<CompiledModel> getCompiledModel ()
    {

        // Return the result produced by the delegated operation.

        return Optional.ofNullable ( this.compiledModel );
    }
}
