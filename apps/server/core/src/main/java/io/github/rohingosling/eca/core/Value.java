//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Immutable, technology-neutral representation of the finite JSON value domain used by the mathematical evaluator.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

//*********************************************************************************************************************
// Class: Value
//
// Description:
//
//   Immutable, technology-neutral representation of the finite JSON value domain used by the mathematical evaluator.
//
//*********************************************************************************************************************

public final class Value
{
    //=================================================================================================================
    // User Defined Data Types
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Enum: Type
    //
    // Description:
    //
    //   Enumerates the supported type values.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public enum Type
    {
        NULL,
        BOOLEAN,
        NUMBER,
        STRING,
        ARRAY,
        OBJECT
    }

    //=================================================================================================================
    // Constants
    //=================================================================================================================

    private static final Value NULL_VALUE = new Value ( Type.NULL, null );

    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private final Type type;
    private final Object value;

    //=================================================================================================================
    // Constructors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Constructor 1/1: Value
    //
    // Description:
    //
    //   Creates a new Value instance from the supplied values and establishes its initial invariants.
    //
    // Arguments:
    //
    //   type (Type):
    //     The type value supplied to this operation.
    //
    //   value (Object):
    //     The value supplied to this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private Value ( Type type, Object value )
    {
        this.type  = Objects.requireNonNull ( type, "type" );
        this.value = value;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: nullValue
    //
    // Description:
    //
    //   Creates a null value representation from the supplied input while preserving the value-domain invariants.
    //
    // Returns:
    //
    //   The resulting null value representation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static Value nullValue ()
    {

        // Return the null value.

        return NULL_VALUE;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: booleanValue
    //
    // Description:
    //
    //   Creates a boolean value representation from the supplied input while preserving the value-domain invariants.
    //
    // Arguments:
    //
    //   value (boolean):
    //     The value used by this operation.
    //
    // Returns:
    //
    //   The resulting boolean value representation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static Value booleanValue ( boolean value )
    {

        // Return the newly constructed Value instance.

        return new Value ( Type.BOOLEAN, value );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: numberValue
    //
    // Description:
    //
    //   Creates a number value representation from the supplied input while preserving the value-domain invariants.
    //
    // Arguments:
    //
    //   value (BigDecimal):
    //     The value used by this operation.
    //
    // Returns:
    //
    //   The resulting number value representation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static Value numberValue ( BigDecimal value )
    {

        // Return the newly constructed Value instance.

        return new Value ( Type.NUMBER, Objects.requireNonNull ( value, "value" ) );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: numberValue
    //
    // Description:
    //
    //   Creates a number value representation from the supplied input while preserving the value-domain invariants.
    //
    // Arguments:
    //
    //   value (long):
    //     The value used by this operation.
    //
    // Returns:
    //
    //   The resulting number value representation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static Value numberValue ( long value )
    {

        // Return the result produced by the delegated operation.

        return numberValue ( BigDecimal.valueOf ( value ) );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: stringValue
    //
    // Description:
    //
    //   Creates a string value representation from the supplied input while preserving the value-domain invariants.
    //
    // Arguments:
    //
    //   value (String):
    //     The value used by this operation.
    //
    // Returns:
    //
    //   The resulting string value representation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static Value stringValue ( String value )
    {

        // Return the newly constructed Value instance.

        return new Value ( Type.STRING, Objects.requireNonNull ( value, "value" ) );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: arrayValue
    //
    // Description:
    //
    //   Creates an array value representation from the supplied input while preserving the value-domain invariants.
    //
    // Arguments:
    //
    //   values (List<Value>):
    //     The values collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The resulting array value representation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static Value arrayValue ( List<Value> values )
    {
        Objects.requireNonNull ( values, "values" );

        // Return the newly constructed Value instance.

        return new Value ( Type.ARRAY, Collections.unmodifiableList ( new ArrayList<> ( values ) ) );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: objectValue
    //
    // Description:
    //
    //   Creates an object value representation from the supplied input while preserving the value-domain invariants.
    //
    // Arguments:
    //
    //   values (Map<String, Value>):
    //     The values collection inspected or transformed by this operation.
    //
    // Returns:
    //
    //   The resulting object value representation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public static Value objectValue ( Map<String, Value> values )
    {
        Objects.requireNonNull ( values, "values" );

        // Return the newly constructed Value instance.

        return new Value ( Type.OBJECT, Collections.unmodifiableMap ( new LinkedHashMap<> ( values ) ) );
    }

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getType
    //
    // Description:
    //
    //   Returns type from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested type value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Type getType ()
    {

        // Return the type.

        return this.type;
    }

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: asBoolean
    //
    // Description:
    //
    //   Performs the as boolean operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The as boolean result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public boolean asBoolean ()
    {
        this.requireType ( Type.BOOLEAN );

        // Return the value produced by this code path.

        return ( Boolean ) this.value;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: asNumber
    //
    // Description:
    //
    //   Performs the as number operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The as number result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public BigDecimal asNumber ()
    {
        this.requireType ( Type.NUMBER );

        // Return the value produced by this code path.

        return ( BigDecimal ) this.value;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: asString
    //
    // Description:
    //
    //   Performs the as string operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The as string result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String asString ()
    {
        this.requireType ( Type.STRING );

        // Return the value produced by this code path.

        return ( String ) this.value;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: asArray
    //
    // Description:
    //
    //   Performs the as array operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The as array result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @SuppressWarnings ( "unchecked" )
    public List<Value> asArray ()
    {
        this.requireType ( Type.ARRAY );

        // Return the value produced by this code path.

        return ( List<Value> ) this.value;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: asObject
    //
    // Description:
    //
    //   Performs the as object operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The as object result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @SuppressWarnings ( "unchecked" )
    public Map<String, Value> asObject ()
    {
        this.requireType ( Type.OBJECT );

        // Return the value produced by this code path.

        return ( Map<String, Value> ) this.value;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: requireType
    //
    // Description:
    //
    //   Performs the require type operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   expectedType (Type):
    //     The expected type used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    private void requireType ( Type expectedType )
    {
        if ( this.type != expectedType )
        {
            throw new IllegalStateException ( "Expected value type " + expectedType + " but found " + this.type + "." );
        }
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: equals
    //
    // Description:
    //
    //   Determines whether equals holds for the supplied value or application state.
    //
    // Arguments:
    //
    //   otherObject (Object):
    //     The other object used by this operation.
    //
    // Returns:
    //
    //   True when the requested condition holds; otherwise false.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Override
    public boolean equals ( Object otherObject )
    {
        if ( this == otherObject )
        {

            // Return true for this code path.

            return true;
        }

        if ( !( otherObject instanceof Value ) )
        {

            // Return false for this code path.

            return false;
        }

        Value otherValue = ( Value ) otherObject;

        if ( this.type != otherValue.type )
        {

            // Return false for this code path.

            return false;
        }

        if ( this.type == Type.NUMBER )
        {

            // Return the result produced by the delegated operation.

            return this.asNumber ().compareTo ( otherValue.asNumber () ) == 0;
        }

        // Return the result produced by the delegated operation.

        return Objects.equals ( this.value, otherValue.value );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: hashCode
    //
    // Description:
    //
    //   Determines whether hash code holds for the supplied value or application state.
    //
    // Returns:
    //
    //   True when the requested condition holds; otherwise false.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Override
    public int hashCode ()
    {
        Object normalizedValue = this.type == Type.NUMBER ? this.asNumber ().stripTrailingZeros () : this.value;

        // Return the result produced by the delegated operation.

        return Objects.hash ( this.type, normalizedValue );
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: toString
    //
    // Description:
    //
    //   Performs the to string operation using the supplied inputs and current state.
    //
    // Returns:
    //
    //   The to string result.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Override
    public String toString ()
    {

        // Return the value selected by the evaluated condition.

        return this.type == Type.NULL ? "null" : String.valueOf ( this.value );
    }
}
