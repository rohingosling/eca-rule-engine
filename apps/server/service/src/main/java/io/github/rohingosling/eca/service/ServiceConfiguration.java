//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Validated HTTP-service configuration and bounded model-parser limits.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.service;

import io.github.rohingosling.eca.model.ModelLimits;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;

//*********************************************************************************************************************
// Class: ServiceConfiguration
//
// Description:
//
//   Validated HTTP-service configuration and bounded model-parser limits.
//
//*********************************************************************************************************************

@ApplicationScoped
public final class ServiceConfiguration
{
    //=================================================================================================================
    // Constants
    //=================================================================================================================

    private static final Logger      LOGGER                      = Logger.getLogger ( ServiceConfiguration.class );
    private static final Set<String> KNOWN_ENVIRONMENT_VARIABLES = Set.of
    (
        "ECA_ALLOWED_ORIGINS",
        "ECA_LOG_LEVEL",
        "ECA_MAX_ACTIONS",
        "ECA_MAX_CONDITIONS",
        "ECA_MAX_EVENTS",
        "ECA_MAX_JSON_DEPTH",
        "ECA_MAX_PARAMETERS",
        "ECA_MAX_PAYLOAD_VALUES",
        "ECA_MAX_PAYLOADS",
        "ECA_MAX_REQUEST_BYTES",
        "ECA_MAX_RULES",
        "ECA_MAX_STRING_LENGTH",
        "ECA_MODEL_PATH",
        "ECA_TRACE_ENABLED"
    );

    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final ModelLimits modelLimits;
    private final boolean traceEnabled;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/2: ServiceConfiguration
    //
    // Description:
    //
    //   Creates a new ServiceConfiguration instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   "eca.max-request-bytes" (( name =):
    //     The "eca max request bytes" value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Inject
    public ServiceConfiguration (
        @ConfigProperty ( name = "eca.max-request-bytes" ) int maximumRequestBytes,
        @ConfigProperty ( name = "eca.max-json-depth" ) int maximumJsonDepth,
        @ConfigProperty ( name = "eca.max-string-length" ) int maximumStringLength,
        @ConfigProperty ( name = "eca.max-parameters" ) int maximumParameters,
        @ConfigProperty ( name = "eca.max-payloads" ) int maximumPayloads,
        @ConfigProperty ( name = "eca.max-events" ) int maximumEvents,
        @ConfigProperty ( name = "eca.max-conditions" ) int maximumConditions,
        @ConfigProperty ( name = "eca.max-actions" ) int maximumActions,
        @ConfigProperty ( name = "eca.max-rules" ) int maximumRules,
        @ConfigProperty ( name = "eca.max-payload-values" ) int maximumPayloadValues,
        @ConfigProperty ( name = "eca.trace-enabled" ) boolean traceEnabled,
        @ConfigProperty ( name = "eca.allowed-origins" ) String allowedOrigins )
    {
        validateAllowedOrigins ( allowedOrigins );

        this.modelLimits = new ModelLimits
        (
            maximumRequestBytes,
            maximumJsonDepth,
            maximumStringLength,
            maximumParameters,
            maximumPayloads,
            maximumEvents,
            maximumConditions,
            maximumActions,
            maximumRules,
            maximumPayloadValues
        );
        this.traceEnabled = traceEnabled;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 2/2: ServiceConfiguration
    //
    // Description:
    //
    //   Creates a new ServiceConfiguration instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   maximumRequestBytes (int):
    //     The maximum request bytes collection inspected or transformed by this operation.
    //
    //   maximumJsonDepth (int):
    //     The maximum JSON depth value supplied to this operation.
    //
    //   maximumStringLength (int):
    //     The maximum string length value supplied to this operation.
    //
    //   maximumEvents (int):
    //     The maximum events collection inspected or transformed by this operation.
    //
    //   maximumConditions (int):
    //     The maximum conditions collection inspected or transformed by this operation.
    //
    //   maximumActions (int):
    //     The maximum actions collection inspected or transformed by this operation.
    //
    //   maximumRules (int):
    //     The maximum rules collection inspected or transformed by this operation.
    //
    //   maximumPayloadValues (int):
    //     The maximum payload values collection inspected or transformed by this operation.
    //
    //   traceEnabled (boolean):
    //     The trace enabled value supplied to this operation.
    //
    //   allowedOrigins (String):
    //     The allowed origins collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ServiceConfiguration (
        int maximumRequestBytes, int maximumJsonDepth, int maximumStringLength, int maximumEvents,
        int maximumConditions, int maximumActions, int maximumRules, int maximumPayloadValues,
        boolean traceEnabled, String allowedOrigins )
    {
        this
        (
            maximumRequestBytes,
            maximumJsonDepth,
            maximumStringLength,
            ModelLimits.DEFAULT_MAXIMUM_PARAMETERS,
            ModelLimits.DEFAULT_MAXIMUM_PAYLOADS,
            maximumEvents,
            maximumConditions,
            maximumActions,
            maximumRules,
            maximumPayloadValues,
            traceEnabled,
            allowedOrigins
        );
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getModelLimits
    //
    // Description:
    //
    //   Returns model limits from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested model limits value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public ModelLimits getModelLimits ()
    {

        // Return the model limits.

        return this.modelLimits;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: isTraceEnabled
    //
    // Description:
    //
    //   Determines whether is trace enabled holds for the supplied value or application state.
    //
    // Returns:
    //
    //   True when the requested condition holds; otherwise false.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public boolean isTraceEnabled ()
    {

        // Return the trace enabled.

        return this.traceEnabled;
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: warnAboutUnknownEnvironmentVariables
    //
    // Description:
    //
    //   Performs the warn about unknown environment variables operation using the supplied inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public void warnAboutUnknownEnvironmentVariables ()
    {
        System.getenv ().keySet ().stream ()
            .filter ( environmentVariable -> environmentVariable.startsWith ( "ECA_" ) )
            .filter ( environmentVariable -> !KNOWN_ENVIRONMENT_VARIABLES.contains ( environmentVariable ) )
            .sorted ()
            .forEach
            (
                environmentVariable -> LOGGER.warn
                (
                    "Unknown ECA environment variable: " + environmentVariable
                )
            );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: validateAllowedOrigins
    //
    // Description:
    //
    //   Validates allowed origins and reports deterministic diagnostics for every detected contract violation.
    //
    // Arguments:
    //
    //   allowedOrigins (String):
    //     The allowed origins collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static void validateAllowedOrigins ( String allowedOrigins )
    {
        if ( allowedOrigins.isBlank () )
        {
            throw invalidCorsOrigins ();
        }

        Arrays.stream ( allowedOrigins.split ( ",", -1 ) )
            .map ( String::trim )
            .forEach ( ServiceConfiguration::validateAllowedOrigin );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: validateAllowedOrigin
    //
    // Description:
    //
    //   Validates allowed origin and reports deterministic diagnostics for every detected contract violation.
    //
    // Arguments:
    //
    //   origin (String):
    //     The origin used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static void validateAllowedOrigin ( String origin )
    {
        URI originUri;

        try
        {
            originUri = new URI ( origin );
        }
        catch ( URISyntaxException exception )
        {
            throw invalidCorsOrigins ();
        }

        String scheme = originUri.getScheme ();
        String host = originUri.getHost ();
        int port = originUri.getPort ();
        boolean hasOnlyOriginComponents = !origin.isEmpty ()
            && !originUri.isOpaque ()
            && host != null
            && originUri.getRawAuthority () != null
            && !originUri.getRawAuthority ().endsWith ( ":" )
            && originUri.getRawUserInfo () == null
            && ( originUri.getRawPath () == null || originUri.getRawPath ().isEmpty () )
            && originUri.getRawQuery () == null
            && originUri.getRawFragment () == null
            && ( port == -1 || ( port >= 1 && port <= 65_535 ) );
        boolean supportedScheme = "https".equalsIgnoreCase ( scheme )
            || ( "http".equalsIgnoreCase ( scheme ) && host != null && isLoopbackHost ( host ) );

        if ( !hasOnlyOriginComponents || !supportedScheme )
        {
            throw invalidCorsOrigins ();
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: isLoopbackHost
    //
    // Description:
    //
    //   Determines whether is loopback host holds for the supplied value or application state.
    //
    // Arguments:
    //
    //   host (String):
    //     The host used by this operation.
    //
    // Returns:
    //
    //   True when the requested condition holds; otherwise false.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static boolean isLoopbackHost ( String host )
    {
        String normalizedHost = host.toLowerCase ( Locale.ROOT )
            .replace ( "[", "" )
            .replace ( "]", "" );

        // Return the value produced by this code path.

        return "localhost".equals ( normalizedHost )
            || isIpv4Loopback ( normalizedHost )
            || "::1".equals ( normalizedHost )
            || "0:0:0:0:0:0:0:1".equals ( normalizedHost );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: isIpv4Loopback
    //
    // Description:
    //
    //   Determines whether is ipv4 loopback holds for the supplied value or application state.
    //
    // Arguments:
    //
    //   host (String):
    //     The host used by this operation.
    //
    // Returns:
    //
    //   True when the requested condition holds; otherwise false.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static boolean isIpv4Loopback ( String host )
    {
        String[] octets = host.split ( "\\.", -1 );

        if ( octets.length != 4 || !"127".equals ( octets [ 0 ] ) )
        {

            // Return false for this code path.

            return false;
        }

        for ( String octet : octets )
        {
            try
            {
                int value = Integer.parseInt ( octet );

                if ( value < 0 || value > 255 )
                {

                    // Return false for this code path.

                    return false;
                }
            }
            catch ( NumberFormatException exception )
            {

                // Return false for this code path.

                return false;
            }
        }

        // Return true for this code path.

        return true;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: invalidCorsOrigins
    //
    // Description:
    //
    //   Verifies that invalid cors origins and fails the test when the observed behavior differs.
    //
    // Returns:
    //
    //   The invalid cors origins result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static IllegalArgumentException invalidCorsOrigins ()
    {

        // Return the newly constructed IllegalArgumentException instance.

        return new IllegalArgumentException
        (
            "CORS origins must be exact HTTPS origins, except that loopback HTTP origins are permitted."
        );
    }
}
