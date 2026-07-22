//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Correlation-header propagation, fallback problem mapping, and one structured completion log per request.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.service;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.github.rohingosling.eca.model.ImplementationMetadata;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.util.UUID;

//*********************************************************************************************************************
// Class: RequestLifecycleFilter
//
// Description:
//
//   Correlation-header propagation, fallback problem mapping, and one structured completion log per request.
//
//*********************************************************************************************************************

@Provider
@Priority ( Priorities.AUTHENTICATION )
public final class RequestLifecycleFilter implements ContainerRequestFilter, ContainerResponseFilter
{
    //=================================================================================================================
    // Constants
    //=================================================================================================================

    public static final String CORRELATION_HEADER = "X-Correlation-ID";

    private static final Logger LOGGER = Logger.getLogger ( RequestLifecycleFilter.class );

    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final RequestMetadata requestMetadata;
    private final ProblemResponseFactory problemFactory;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/2: RequestLifecycleFilter
    //
    // Description:
    //
    //   Creates a new RequestLifecycleFilter instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   requestMetadata (RequestMetadata):
    //     The request metadata value supplied to this operation.
    //
    //   problemFactory (ProblemResponseFactory):
    //     The problem factory value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Inject
    public RequestLifecycleFilter ( RequestMetadata requestMetadata, ProblemResponseFactory problemFactory )
    {
        this.requestMetadata = requestMetadata;
        this.problemFactory  = problemFactory;
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: filter
    //
    // Description:
    //
    //   Filters the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   requestContext (ContainerRequestContext):
    //     The request context used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Override
    public void filter ( ContainerRequestContext requestContext )
    {
        this.initializeRequestMetadata ( requestContext );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: initializeRequestMetadata
    //
    // Description:
    //
    //   Performs the initialize request metadata operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   requestContext (ContainerRequestContext):
    //     The request context used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void initializeRequestMetadata ( ContainerRequestContext requestContext )
    {
        if ( this.requestMetadata.getCorrelationId () != null )
        {

            // Return without a value after completing this code path.

            return;
        }

        String suppliedCorrelationId = requestContext.getHeaderString ( CORRELATION_HEADER );
        String correlationId = suppliedCorrelationId == null || suppliedCorrelationId.isBlank ()
            ? UUID.randomUUID ().toString ()
            : suppliedCorrelationId.trim ();
        String requestPath = requestContext.getUriInfo ().getPath ();

        if ( !requestPath.startsWith ( "/" ) )
        {
            requestPath = "/" + requestPath;
        }

        this.requestMetadata.begin
        (
            correlationId,
            requestContext.getMethod (),
            requestPath
        );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: filter
    //
    // Description:
    //
    //   Filters the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   requestContext (ContainerRequestContext):
    //     The request context used by this operation.
    //
    //   responseContext (ContainerResponseContext):
    //     The response context used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Override
    public void filter ( ContainerRequestContext requestContext, ContainerResponseContext responseContext )
        throws IOException
    {
        this.initializeRequestMetadata ( requestContext );
        responseContext.getHeaders ().putSingle ( CORRELATION_HEADER, this.requestMetadata.getCorrelationId () );

        if ( responseContext.getStatus () >= 400
            && ( responseContext.getMediaType () == null
                || !ProblemResponseFactory.PROBLEM_MEDIA_TYPE.equals ( responseContext.getMediaType ().toString () ) ) )
        {
            FallbackProblem fallbackProblem = FallbackProblem.forStatus ( responseContext.getStatus () );
            responseContext.setEntity
            (
                this.problemFactory.createEntity
                (
                    responseContext.getStatus (), fallbackProblem.getCode (), fallbackProblem.getTitle ()
                ),
                null,
                jakarta.ws.rs.core.MediaType.valueOf ( ProblemResponseFactory.PROBLEM_MEDIA_TYPE )
            );
        }

        this.logCompletion ( responseContext.getStatus () );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: logCompletion
    //
    // Description:
    //
    //   Performs the log completion operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   status (int):
    //     The status collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void logCompletion ( int status )
    {
        long durationMilliseconds = Math.max
        (
            0L,
            ( System.nanoTime () - this.requestMetadata.getStartTimeNanoseconds () ) / 1_000_000L
        );
        ObjectNode completion = JsonNodeFactory.instance.objectNode ();
        completion.put ( "severity", status >= 500 ? "ERROR" : "INFO" );
        completion.put ( "serviceVersion", ImplementationMetadata.getImplementationVersion () );
        completion.put ( "revision", System.getenv ().getOrDefault ( "K_REVISION", "local" ) );
        completion.put ( "correlationId", this.requestMetadata.getCorrelationId () );
        completion.put ( "operation", this.requestMetadata.getMethod () + " " + this.requestMetadata.getPath () );
        completion.put ( "status", status );
        completion.put ( "durationMilliseconds", durationMilliseconds );

        if ( this.requestMetadata.getModelId () != null )
        {
            completion.put ( "modelId", this.requestMetadata.getModelId () );
        }

        if ( this.requestMetadata.getEventType () != null )
        {
            completion.put ( "eventType", this.requestMetadata.getEventType () );
        }

        if ( this.requestMetadata.getActionSelected () != null )
        {
            completion.put ( "actionSelected", this.requestMetadata.getActionSelected () );
        }

        completion.set
        (
            "diagnosticCodes",
            JsonNodeFactory.instance.arrayNode ().addAll
            (
                this.requestMetadata.getDiagnosticCodes ().stream ()
                    .map ( JsonNodeFactory.instance::textNode )
                    .toList ()
            )
        );
        if ( status >= 500 )
        {
            LOGGER.error ( completion.toString () );
        }
        else
        {
            LOGGER.info ( completion.toString () );
        }
    }

    //*****************************************************************************************************************
    // Class: FallbackProblem
    //
    // Description:
    //
    //   Encapsulates fallback problem state and behavior.
    //
    //*****************************************************************************************************************

    private static final class FallbackProblem
    {
        //=============================================================================================================
        // Fields
        //=============================================================================================================

        private final String code;
        private final String title;

        //=============================================================================================================
        // Constructors
        //=============================================================================================================

        //-------------------------------------------------------------------------------------------------------------
        // Constructor 2/2: FallbackProblem
        //
        // Description:
        //
        //   Creates a new FallbackProblem instance from the supplied values and establishes its initial invariants.
        //
        // Arguments:
        //
        //   code (String):
        //     The code value supplied to this operation.
        //
        //   title (String):
        //     The title value supplied to this operation.
        //
        //-------------------------------------------------------------------------------------------------------------

        private FallbackProblem ( String code, String title )
        {
            this.code  = code;
            this.title = title;
        }

        //-------------------------------------------------------------------------------------------------------------
        // Method: forStatus
        //
        // Description:
        //
        //   Performs the for status operation using the supplied inputs and current state.
        //
        // Arguments:
        //
        //   status (int):
        //     The status collection inspected or transformed by this operation.
        //
        // Returns:
        //
        //   The for status result.
        //
        //-------------------------------------------------------------------------------------------------------------

        private static FallbackProblem forStatus ( int status )
        {

            // Return the result produced by the delegated operation.

            return switch ( status )
            {
                case 400 -> new FallbackProblem ( "malformed-request", "Request JSON is malformed" );
                case 404 -> new FallbackProblem ( "resource-not-found", "The requested resource was not found" );
                case 405 -> new FallbackProblem ( "method-not-allowed", "The request method is not allowed" );
                case 413 -> new FallbackProblem ( "request-too-large", "The request body is too large" );
                case 415 -> new FallbackProblem ( "unsupported-media-type", "The request media type is not supported" );
                default -> status >= 500
                    ? new FallbackProblem ( "internal-error", "The service could not complete the request" )
                    : new FallbackProblem ( "request-rejected", "The service rejected the request" );
            };
        }

        //=============================================================================================================
        // Accessors
        //=============================================================================================================

        //-------------------------------------------------------------------------------------------------------------
        // Method: getCode
        //
        // Description:
        //
        //   Returns code from the current model, configuration, or application state.
        //
        // Returns:
        //
        //   The requested code value.
        //
        //-------------------------------------------------------------------------------------------------------------

        private String getCode ()
        {

            // Return the code.

            return this.code;
        }

        //-------------------------------------------------------------------------------------------------------------
        // Method: getTitle
        //
        // Description:
        //
        //   Returns title from the current model, configuration, or application state.
        //
        // Returns:
        //
        //   The requested title value.
        //
        //-------------------------------------------------------------------------------------------------------------

        private String getTitle ()
        {

            // Return the title.

            return this.title;
        }
    }
}
