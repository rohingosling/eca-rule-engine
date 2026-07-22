//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Boundary and compatibility tests for every contract version 1.0 predicate.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.core;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

//*********************************************************************************************************************
// Class: BuiltInPredicateTest
//
// Description:
//
//   Boundary and compatibility tests for every contract version 1.0 predicate.
//
//*********************************************************************************************************************

class BuiltInPredicateTest
{
    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: equalityUsesJsonStructureAndMathematicalNumberValues
    //
    // Description:
    //
    //   Performs the equality uses JSON structure and mathematical number values operation using the supplied inputs
    //   and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void equalityUsesJsonStructureAndMathematicalNumberValues ()
    {
        Map<String, Value> firstObject = new LinkedHashMap<> ();
        firstObject.put ( "first", Value.numberValue ( new BigDecimal ( "1.0" ) ) );
        firstObject.put ( "second", Value.booleanValue ( true ) );

        Map<String, Value> secondObject = new LinkedHashMap<> ();
        secondObject.put ( "second", Value.booleanValue ( true ) );
        secondObject.put ( "first", Value.numberValue ( new BigDecimal ( "1" ) ) );

        assertThat
        (
            BuiltInPredicate.EQUALS.evaluate
            (
                Value.objectValue ( firstObject ), Value.objectValue ( secondObject )
            )
        ).isTrue ();
        assertThat
        (
            BuiltInPredicate.NOT_EQUALS.evaluate
            (
                Value.arrayValue ( Arrays.asList ( Value.numberValue ( 1 ), Value.numberValue ( 2 ) ) ),
                Value.arrayValue ( Arrays.asList ( Value.numberValue ( 2 ), Value.numberValue ( 1 ) ) )
            )
        ).isTrue ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: orderingRequiresLikeNumbersOrStrings
    //
    // Description:
    //
    //   Performs the ordering requires like numbers or strings operation using the supplied inputs and current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void orderingRequiresLikeNumbersOrStrings ()
    {
        assertThat
        (
            BuiltInPredicate.GREATER_THAN.evaluate ( Value.numberValue ( 12 ), Value.numberValue ( 10 ) )
        ).isTrue ();
        assertThat
        (
            BuiltInPredicate.GREATER_THAN_OR_EQUAL.evaluate ( Value.numberValue ( 10 ), Value.numberValue ( 10 ) )
        ).isTrue ();
        assertThat
        (
            BuiltInPredicate.LESS_THAN.evaluate ( Value.stringValue ( "alpha" ), Value.stringValue ( "beta" ) )
        ).isTrue ();
        assertThat
        (
            BuiltInPredicate.LESS_THAN_OR_EQUAL.evaluate ( Value.stringValue ( "beta" ), Value.stringValue ( "beta" ) )
        ).isTrue ();
        assertThat
        (
            BuiltInPredicate.GREATER_THAN.evaluate ( Value.numberValue ( 12 ), Value.stringValue ( "10" ) )
        ).isFalse ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: stringOrderingUsesUnicodeCodePoints
    //
    // Description:
    //
    //   Verifies that string ordering uses unicode code points and fails the test when the observed behavior differs.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void stringOrderingUsesUnicodeCodePoints ()
    {
        String supplementaryCodePoint = "\uD800\uDC00";
        String basicMultilingualPlaneCodePoint = "\uE000";

        assertThat
        (
            BuiltInPredicate.GREATER_THAN.evaluate
            (
                Value.stringValue ( supplementaryCodePoint ),
                Value.stringValue ( basicMultilingualPlaneCodePoint )
            )
        ).isTrue ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: containsSupportsArrayMembershipAndStringSubstrings
    //
    // Description:
    //
    //   Performs the contains supports array membership and string substrings operation using the supplied inputs and
    //   current state.
    //
    //-----------------------------------------------------------------------------------------------------------------

    @Test
    void containsSupportsArrayMembershipAndStringSubstrings ()
    {
        assertThat
        (
            BuiltInPredicate.CONTAINS.evaluate
            (
                Value.arrayValue ( Arrays.asList ( Value.stringValue ( "alpha" ), Value.numberValue ( 2 ) ) ),
                Value.numberValue ( new BigDecimal ( "2.0" ) )
            )
        ).isTrue ();
        assertThat
        (
            BuiltInPredicate.CONTAINS.evaluate ( Value.stringValue ( "stateless" ), Value.stringValue ( "less" ) )
        ).isTrue ();
        assertThat
        (
            BuiltInPredicate.CONTAINS.evaluate ( Value.numberValue ( 1 ), Value.numberValue ( 1 ) )
        ).isFalse ();
    }
}
