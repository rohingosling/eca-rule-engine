//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Read-only test access to the shared language-neutral contract manifest and fixture documents.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

//*********************************************************************************************************************
// Class: ContractFixtureRepository
//
// Description:
//
//   Read-only test access to the shared language-neutral contract manifest and fixture documents.
//
//*********************************************************************************************************************

final class ContractFixtureRepository
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final Path contractsDirectory;
    private final ObjectMapper objectMapper;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: ContractFixtureRepository
    //
    // Description:
    //
    //   Creates a new ContractFixtureRepository instance from the supplied values and establishes its initial
    //   invariants.
    //
    // Arguments:
    //
    //   objectMapper (ObjectMapper):
    //     The object mapper collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    ContractFixtureRepository ( ObjectMapper objectMapper )
    {
        String configuredDirectory = System.getProperty ( "contracts.directory" );

        if ( configuredDirectory == null || configuredDirectory.isBlank () )
        {
            throw new IllegalStateException ( "The contracts.directory test property is not configured." );
        }

        this.contractsDirectory = Path.of ( configuredDirectory ).toAbsolutePath ().normalize ();
        this.objectMapper       = objectMapper;
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: readManifest
    //
    // Description:
    //
    //   Reads the supplied representation and returns its normalized in-memory form.
    //
    // Returns:
    //
    //   The read manifest result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    JsonNode readManifest () throws IOException
    {

        // Return the result produced by the delegated operation.

        return this.readJson ( this.resolve ( "conformance/manifest.json" ) );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: readJson
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
    //   The read JSON result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    JsonNode readJson ( Path path ) throws IOException
    {

        // Return the result produced by the delegated operation.

        return this.objectMapper.readTree ( Files.readString ( path, StandardCharsets.UTF_8 ) );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: readText
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
    //   The read text result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    String readText ( String relativePath ) throws IOException
    {

        // Return the result produced by the delegated operation.

        return Files.readString ( this.resolve ( relativePath ), StandardCharsets.UTF_8 );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: readText
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
    //   The read text result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    String readText ( Path path ) throws IOException
    {

        // Return the result produced by the delegated operation.

        return Files.readString ( path, StandardCharsets.UTF_8 );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: resolve
    //
    // Description:
    //
    //   Resolves the supplied values using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   relativePath (String):
    //     The relative path used by this operation.
    //
    // Returns:
    //
    //   The resolve result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    Path resolve ( String relativePath )
    {
        Path resolvedPath = this.contractsDirectory.resolve ( relativePath ).normalize ();

        if ( !resolvedPath.startsWith ( this.contractsDirectory ) )
        {
            throw new IllegalArgumentException ( "Fixture path escapes the contract directory." );
        }

        // Return the resolved path.

        return resolvedPath;
    }
}
