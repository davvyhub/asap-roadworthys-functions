import React, { useState } from 'react';
import { withTaskContext } from '@twilio/flex-ui';

const getDispositionEndpoint = () => {
  const configuredUrl = window?.appConfig?.asapRoadworthys?.dispositionHandlerUrl;
  if (configuredUrl) {
    return configuredUrl;
  }
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:3000/disposition-handler';
  }
  return 'https://REPLACE_WITH_YOUR_RAILWAY_DOMAIN/disposition-handler';
};

const CallDispositionPanel = ({ task }) => {
  const [disposition, setDisposition] = useState('');
  const [notes, setNotes] = useState('');

  const dispositions = [
    'Booking created',
    'Quote given',
    'Reschedule',
    'Cancellation',
    'No-show',
    'Complaint',
    'Upsell',
    'General enquiry'
  ];

  const handleSave = async () => {
    if (!disposition) {
      alert('Please select a disposition');
      return;
    }

    // Show loading state
    const saveButton = document.querySelector('button');
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = 'Saving...';
    }

    try {
      console.log('=== SAVING DISPOSITION ===');

      // Get task attributes
      const taskAttributes = task?.attributes || {};

      // Prepare the payload
      const payload = {
        taskSid: task?.sid || 'TEST-SID',
        callSid: task?.attributes?.call_sid || task?.attributes?.conference?.sid || 'N/A',
        disposition,
        notes,
        customerPhone: taskAttributes.from || taskAttributes.outbound_to || 'N/A',
        customerName: taskAttributes.name || taskAttributes.customers?.name || 'Unknown',
        agentName: task?.workerName || 'Agent',
        callDuration: task?.age || 0,
        recordingUrl: null // Will be populated later
      };

      console.log('Payload:', JSON.stringify(payload, null, 2));

      const functionUrl = getDispositionEndpoint();

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log('Function response:', result);

      if (result.success) {
        alert(`✅ Disposition saved successfully!\n\nDisposition: ${disposition}\nSynced to n8n`);

        // Clear the form
        setDisposition('');
        setNotes('');
      } else {
        alert(`❌ Error: ${result.error}`);
      }

    } catch (error) {
      console.error('Error calling function:', error);
      alert(`❌ Error saving disposition: ${error.message}`);
    } finally {
      // Reset button state
      const saveButton = document.querySelector('button');
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = disposition ? 'Save Disposition & Sync to CRM' : 'Select Disposition First';
      }
    }
  };

  // Show test mode if no task is active
  const isTestMode = !task || !task.sid;

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#ffffff',
      height: '100%',
      overflow: 'auto'
    }}>
      {isTestMode && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          padding: '10px',
          marginBottom: '20px',
          borderRadius: '4px'
        }}>
          <strong>⚠️ TEST MODE:</strong> No active task. Make a call to test with real data.
        </div>
      )}

      <h2 style={{ 
        marginTop: 0,
        color: '#1976d2',
        borderBottom: '2px solid #1976d2',
        paddingBottom: '10px'
      }}>
        Call Disposition (Required)
      </h2>
      
      {/* Task Info */}
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '10px', 
        marginBottom: '20px',
        borderRadius: '4px'
      }}>
        <p style={{ margin: '5px 0' }}>
          <strong>Customer:</strong> {task?.attributes?.name || 'Test Customer'}
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Phone:</strong> {task?.attributes?.from || '+1234567890'}
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Call SID:</strong> {task?.sid || 'TEST-SID-12345'}
        </p>
      </div>

      {/* Disposition Dropdown */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          Select Disposition *
        </label>
        <select 
          value={disposition}
          onChange={(e) => setDisposition(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '12px', 
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white'
          }}
        >
          <option value="">-- Select Disposition --</option>
          {dispositions.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Add any additional notes about this call..."
          style={{ 
            width: '100%', 
            padding: '12px', 
            fontSize: '14px',
            border: '2px solid #ddd',
            borderRadius: '4px',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Save Button */}
      <button 
        onClick={handleSave}
        disabled={!disposition}
        style={{
          width: '100%',
          padding: '15px',
          backgroundColor: disposition ? '#1976d2' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: disposition ? 'pointer' : 'not-allowed',
          fontSize: '16px',
          fontWeight: 'bold',
          transition: 'background-color 0.3s'
        }}
        onMouseOver={(e) => {
          if (disposition) e.target.style.backgroundColor = '#1565c0';
        }}
        onMouseOut={(e) => {
          if (disposition) e.target.style.backgroundColor = '#1976d2';
        }}
      >
        {disposition ? 'Save Disposition & Sync to CRM' : 'Select Disposition First'}
      </button>
    </div>
  );
};

export default withTaskContext(CallDispositionPanel);
