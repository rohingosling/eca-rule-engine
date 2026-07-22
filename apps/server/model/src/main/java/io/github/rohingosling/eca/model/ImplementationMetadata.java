//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Exposes implementation and contract versions generated from the Maven parent build configuration.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.model;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

//*********************************************************************************************************************
// Class: ImplementationMetadata
//
// Description:
//
//   Exposes implementation and contract versions generated from the Maven parent build configuration.
//
//*********************************************************************************************************************

public final class ImplementationMetadata
{
    //=================================================================================================================
    // Constants
    //=================================================================================================================

    private static final String RESOURCE_NAME = "/eca-version.properties";
    private static final Properties PROPERTIES = loadProperties ();

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: ImplementationMetadata
    //
    // Description:
    //
    //   Creates a new ImplementationMetadata instance from the supplied values and establishes its initial invariants.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private ImplementationMetadata ()
    {
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getImplementationVersion
    //
    // Description:
    //
    //   Returns implementation version from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested implementation version value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static String getImplementationVersion ()
    {

        // Return the result produced by the delegated operation.

        return getRequiredProperty ( "implementation.version" );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getContractVersion
    //
    // Description:
    //
    //   Returns contract version from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested contract version value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static String getContractVersion ()
    {

        // Return the result produced by the delegated operation.

        return getRequiredProperty ( "contract.version" );
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: loadProperties
    //
    // Description:
    //
    //   Loads properties using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The load properties result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static Properties loadProperties ()
    {
        try ( InputStream inputStream = ImplementationMetadata.class.getResourceAsStream ( RESOURCE_NAME ) )
        {
            if ( inputStream == null )
            {
                throw new IllegalStateException ( "The implementation metadata resource is missing." );
            }

            Properties properties = new Properties ();
            properties.load ( inputStream );

            // Return the properties.

            return properties;
        }
        catch ( IOException exception )
        {
            throw new IllegalStateException ( "The implementation metadata resource could not be read.", exception );
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getRequiredProperty
    //
    // Description:
    //
    //   Returns required property from the current model, configuration, or application state.
    //
    // Arguments:
    //
    //   propertyName (String):
    //     The property name used by this operation.
    //
    // Returns:
    //
    //   The requested required property value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private static String getRequiredProperty ( String propertyName )
    {
        String propertyValue = PROPERTIES.getProperty ( propertyName );

        if ( propertyValue == null || propertyValue.isBlank () )
        {
            throw new IllegalStateException ( "The implementation metadata property is missing: " + propertyName );
        }

        // Return the property value.

        return propertyValue;
    }
}
