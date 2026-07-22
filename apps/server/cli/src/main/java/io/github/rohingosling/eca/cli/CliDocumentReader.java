//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Reads bounded UTF-8 documents from files or standard input without closing the process input stream.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.cli;

import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Objects;

//*********************************************************************************************************************
// Class: CliDocumentReader
//
// Description:
//
//   Reads bounded UTF-8 documents from files or standard input without closing the process input stream.
//
//*********************************************************************************************************************

final class CliDocumentReader
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final InputStream standardInput;
    private final int maximumBytes;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: CliDocumentReader
    //
    // Description:
    //
    //   Creates a new CliDocumentReader instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   standardInput (InputStream):
    //     The standard input value supplied to this operation.
    //
    //   maximumBytes (int):
    //     The maximum bytes collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    CliDocumentReader ( InputStream standardInput, int maximumBytes )
    {
        this.standardInput = Objects.requireNonNull ( standardInput, "standardInput" );
        this.maximumBytes  = maximumBytes;
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: read
    //
    // Description:
    //
    //   Reads the supplied representation and returns its normalized in-memory form.
    //
    // Arguments:
    //
    //   source (String):
    //     The source used by this operation.
    //
    // Returns:
    //
    //   The read result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    String read ( String source ) throws CliInputException
    {
        if ( "-".equals ( source ) )
        {

            // Return the result produced by the delegated operation.

            return this.decode ( this.readBytes ( this.standardInput, "standard input" ), "standard input" );
        }

        Path path;

        try
        {
            path = Path.of ( source );
        }
        catch ( InvalidPathException exception )
        {
            throw new CliInputException ( CliExitCode.CONFIGURATION_ERROR, "The input path is invalid." );
        }

        try ( InputStream inputStream = Files.newInputStream ( path, StandardOpenOption.READ ) )
        {

            // Return the result produced by the delegated operation.

            return this.decode ( this.readBytes ( inputStream, "the input file" ), "the input file" );
        }
        catch ( IOException exception )
        {
            throw new CliInputException
            (
                CliExitCode.CONFIGURATION_ERROR,
                "The input file could not be read."
            );
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: readBytes
    //
    // Description:
    //
    //   Reads the supplied representation and returns its normalized in-memory form.
    //
    // Arguments:
    //
    //   inputStream (InputStream):
    //     The input stream used by this operation.
    //
    //   sourceName (String):
    //     The source name used by this operation.
    //
    // Returns:
    //
    //   The read bytes result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private byte[] readBytes ( InputStream inputStream, String sourceName ) throws CliInputException
    {
        try
        {
            byte[] bytes = inputStream.readNBytes ( this.maximumBytes + 1 );

            if ( bytes.length > this.maximumBytes )
            {
                throw new CliInputException
                (
                    CliExitCode.INVALID_JSON,
                    "The JSON document from " + sourceName + " exceeds the configured byte limit."
                );
            }

            // Return the bytes.

            return bytes;
        }
        catch ( IOException exception )
        {
            throw new CliInputException
            (
                CliExitCode.CONFIGURATION_ERROR,
                "The JSON document from " + sourceName + " could not be read."
            );
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: decode
    //
    // Description:
    //
    //   Performs the decode operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   bytes (byte[]):
    //     The bytes collection inspected or transformed by this operation.
    //
    //   sourceName (String):
    //     The source name used by this operation.
    //
    // Returns:
    //
    //   The decode result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private String decode ( byte[] bytes, String sourceName ) throws CliInputException
    {
        try
        {

            // Return the result produced by the delegated operation.

            return StandardCharsets.UTF_8.newDecoder ()
                .onMalformedInput ( CodingErrorAction.REPORT )
                .onUnmappableCharacter ( CodingErrorAction.REPORT )
                .decode ( ByteBuffer.wrap ( bytes ) )
                .toString ();
        }
        catch ( CharacterCodingException exception )
        {
            throw new CliInputException
            (
                CliExitCode.INVALID_JSON,
                "The JSON document from " + sourceName + " is not valid UTF-8."
            );
        }
    }
}
