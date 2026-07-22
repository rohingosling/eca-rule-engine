//---------------------------------------------------------------------------------------------------------------------
// Project: ECA Rule Engine
// Version: 1.0
// Date:    2022
// Author:  Rohin Gosling
//
// Description:
//
//   Request-scoped correlation, timing, and non-sensitive completion-log metadata.
//
// TODO:
//
//   1. None.
//
//---------------------------------------------------------------------------------------------------------------------

package io.github.rohingosling.eca.service;

import jakarta.enterprise.context.RequestScoped;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

//*********************************************************************************************************************
// Class: RequestMetadata
//
// Description:
//
//   Request-scoped correlation, timing, and non-sensitive completion-log metadata.
//
//*********************************************************************************************************************

@RequestScoped
public class RequestMetadata
{
    //=================================================================================================================
    // Fields
    //=================================================================================================================

    private String correlationId;
    private String method;
    private String path;
    private long startTimeNanoseconds;
    private String modelId;
    private String eventType;
    private Boolean actionSelected;
    private List<String> diagnosticCodes = Collections.emptyList ();

    //=================================================================================================================
    // Accessors
    //=================================================================================================================

    //=================================================================================================================
    // Mutators
    //=================================================================================================================

    //=================================================================================================================
    // Methods
    //=================================================================================================================

    //-----------------------------------------------------------------------------------------------------------------
    // Method: begin
    //
    // Description:
    //
    //   Performs the begin operation using the supplied inputs and current state.
    //
    // Arguments:
    //
    //   correlationId (String):
    //     The stable correlation ID used to locate the corresponding model element.
    //
    //   method (String):
    //     The method used by this operation.
    //
    //   path (String):
    //     The path used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public void begin ( String correlationId, String method, String path )
    {
        this.correlationId        = correlationId;
        this.method               = method;
        this.path                 = path;
        this.startTimeNanoseconds = System.nanoTime ();
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getCorrelationId
    //
    // Description:
    //
    //   Returns correlation ID from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested correlation ID value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String getCorrelationId ()
    {

        // Return the correlation id.

        return this.correlationId;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getMethod
    //
    // Description:
    //
    //   Returns method from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested method value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String getMethod ()
    {

        // Return the method.

        return this.method;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getPath
    //
    // Description:
    //
    //   Returns path from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested path value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String getPath ()
    {

        // Return the path.

        return this.path;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getStartTimeNanoseconds
    //
    // Description:
    //
    //   Returns start time nanoseconds from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested start time nanoseconds value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public long getStartTimeNanoseconds ()
    {

        // Return the start time nanoseconds.

        return this.startTimeNanoseconds;
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

    public String getModelId ()
    {

        // Return the model id.

        return this.modelId;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: setModelId
    //
    // Description:
    //
    //   Updates model ID while preserving the surrounding state invariants.
    //
    // Arguments:
    //
    //   modelId (String):
    //     The stable model ID used to locate the corresponding model element.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public void setModelId ( String modelId )
    {
        this.modelId = modelId;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getEventType
    //
    // Description:
    //
    //   Returns event type from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested event type value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public String getEventType ()
    {

        // Return the event type.

        return this.eventType;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: setEventType
    //
    // Description:
    //
    //   Updates event type while preserving the surrounding state invariants.
    //
    // Arguments:
    //
    //   eventType (String):
    //     The event type used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public void setEventType ( String eventType )
    {
        this.eventType = eventType;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getActionSelected
    //
    // Description:
    //
    //   Returns action selected from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested action selected value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public Boolean getActionSelected ()
    {

        // Return the action selected.

        return this.actionSelected;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: setActionSelected
    //
    // Description:
    //
    //   Updates action selected while preserving the surrounding state invariants.
    //
    // Arguments:
    //
    //   actionSelected (boolean):
    //     The action selected used by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public void setActionSelected ( boolean actionSelected )
    {
        this.actionSelected = actionSelected;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: getDiagnosticCodes
    //
    // Description:
    //
    //   Returns diagnostic codes from the current model, configuration, or application state.
    //
    // Returns:
    //
    //   The requested diagnostic codes value.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public List<String> getDiagnosticCodes ()
    {

        // Return the diagnostic codes.

        return this.diagnosticCodes;
    }

    //-----------------------------------------------------------------------------------------------------------------
    // Method: setDiagnosticCodes
    //
    // Description:
    //
    //   Updates diagnostic codes while preserving the surrounding state invariants.
    //
    // Arguments:
    //
    //   diagnosticCodes (List<String>):
    //     The diagnostic codes collection inspected or transformed by this operation.
    //
    //-----------------------------------------------------------------------------------------------------------------

    public void setDiagnosticCodes ( List<String> diagnosticCodes )
    {
        this.diagnosticCodes = Collections.unmodifiableList ( new ArrayList<> ( diagnosticCodes ) );
    }
}
