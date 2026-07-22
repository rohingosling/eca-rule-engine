//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   HTTP Problem Details response construction with stable codes and request correlation.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.service;

import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.github.rohingosling.eca.model.Diagnostic;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;

import java.util.List;

//*********************************************************************************************************************
// Class: ProblemResponseFactory
//
// Description:
//
//   HTTP Problem Details response construction with stable codes and request correlation.
//
//*********************************************************************************************************************

@ApplicationScoped
public final class ProblemResponseFactory
{
    //=================================================================================================================
    // Constants
    //=================================================================================================================

    public static final String PROBLEM_MEDIA_TYPE = "application/problem+json";

    private static final String PROBLEM_TYPE_BASE = "https://eca-rule-engine.example/problems/";

    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final RequestMetadata requestMetadata;
    private final ServiceJsonCodec jsonCodec;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: ProblemResponseFactory
    //
    // Description:
    //
    //   Creates a new ProblemResponseFactory instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   requestMetadata (RequestMetadata):
    //     The request metadata value supplied to this operation.
    //
    //   jsonCodec (ServiceJsonCodec):
    //     The JSON codec value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Inject
    public ProblemResponseFactory ( RequestMetadata requestMetadata, ServiceJsonCodec jsonCodec )
    {
        this.requestMetadata = requestMetadata;
        this.jsonCodec       = jsonCodec;
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: create
    //
    // Description:
    //
    //   Constructs create from the supplied inputs without mutating the caller's source values.
    //
    // Arguments:
    //
    //   status (int):
    //     The status collection inspected or transformed by this operation.
    //
    //   code (String):
    //     The code used by this operation.
    //
    //   title (String):
    //     The title used by this operation.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Response create ( int status, String code, String title )
    {

        // Return the result produced by the delegated operation.

        return this.create ( status, code, title, null, List.of () );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: create
    //
    // Description:
    //
    //   Constructs create from the supplied inputs without mutating the caller's source values.
    //
    // Arguments:
    //
    //   status (int):
    //     The status collection inspected or transformed by this operation.
    //
    //   code (String):
    //     The code used by this operation.
    //
    //   title (String):
    //     The title used by this operation.
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Response create ( int status, String code, String title, List<Diagnostic> diagnostics )
    {

        // Return the result produced by the delegated operation.

        return this.create ( status, code, title, null, diagnostics );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: create
    //
    // Description:
    //
    //   Constructs create from the supplied inputs without mutating the caller's source values.
    //
    // Arguments:
    //
    //   status (int):
    //     The status collection inspected or transformed by this operation.
    //
    //   code (String):
    //     The code used by this operation.
    //
    //   title (String):
    //     The title used by this operation.
    //
    //   detail (String):
    //     The detail used by this operation.
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Response create (
        int status, String code, String title, String detail, List<Diagnostic> diagnostics )
    {
        ObjectNode problem = this.createEntity ( status, code, title, detail, diagnostics );

        // Return the result produced by the delegated operation.

        return Response.status ( status ).type ( PROBLEM_MEDIA_TYPE ).entity ( problem ).build ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: createEntity
    //
    // Description:
    //
    //   Constructs entity from the supplied inputs without mutating the caller's source values.
    //
    // Arguments:
    //
    //   status (int):
    //     The status collection inspected or transformed by this operation.
    //
    //   code (String):
    //     The code used by this operation.
    //
    //   title (String):
    //     The title used by this operation.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ObjectNode createEntity ( int status, String code, String title )
    {

        // Return the result produced by the delegated operation.

        return this.createEntity ( status, code, title, null, List.of () );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: createEntity
    //
    // Description:
    //
    //   Constructs entity from the supplied inputs without mutating the caller's source values.
    //
    // Arguments:
    //
    //   status (int):
    //     The status collection inspected or transformed by this operation.
    //
    //   code (String):
    //     The code used by this operation.
    //
    //   title (String):
    //     The title used by this operation.
    //
    //   detail (String):
    //     The detail used by this operation.
    //
    //   diagnostics (List<Diagnostic>):
    //     The diagnostics collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The newly constructed value, model element, or immutable state projection.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private ObjectNode createEntity (
        int status, String code, String title, String detail, List<Diagnostic> diagnostics )
    {
        ObjectNode problem = JsonNodeFactory.instance.objectNode ();
        problem.put ( "type", PROBLEM_TYPE_BASE + code );
        problem.put ( "title", title );
        problem.put ( "status", status );
        problem.put ( "code", code );
        problem.put ( "correlationId", this.requestMetadata.getCorrelationId () );

        if ( detail != null )
        {
            problem.put ( "detail", detail );
        }

        if ( !diagnostics.isEmpty () )
        {
            ArrayNode diagnosticNodes = problem.putArray ( "diagnostics" );

            for ( Diagnostic diagnostic : diagnostics )
            {
                diagnosticNodes.add ( this.jsonCodec.createDiagnostic ( diagnostic ) );
            }
        }

        this.requestMetadata.setDiagnosticCodes
        (
            diagnostics.stream ().map ( Diagnostic::getCode ).distinct ().sorted ().toList ()
        );

        // Return the problem.

        return problem;
    }
}
