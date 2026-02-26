exports.handler = async function(context, event, callback) {
  const axios = require('axios');
  const response = new Twilio.Response();
  
  // Enable CORS
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.appendHeader('Content-Type', 'application/json');

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return callback(null, response);
  }

  try {
    console.log('=== Disposition Handler Called ===');
    console.log('Event:', JSON.stringify(event, null, 2));

    // Extract data
    const {
      taskSid,
      callSid,
      disposition,
      notes,
      customerPhone,
      customerName,
      agentName,
      callDuration,
      recordingUrl
    } = event;

    // Validate
    if (!disposition) {
      response.setStatusCode(400);
      response.setBody({
        success: false,
        error: 'Disposition is required'
      });
      return callback(null, response);
    }

    // Prepare payload for n8n
    const n8nPayload = {
      event: 'call_disposition',
      timestamp: new Date().toISOString(),
      taskSid: taskSid || 'N/A',
      callSid: callSid || 'N/A',
      disposition,
      notes: notes || '',
      customer: {
        name: customerName || 'Unknown',
        phone: customerPhone || 'N/A'
      },
      agent: {
        name: agentName || 'Unknown'
      },
      call: {
        duration: callDuration || 0,
        recordingUrl: recordingUrl || null
      },
      metadata: {
        source: 'twilio_flex',
        accountSid: context.ACCOUNT_SID
      }
    };

    console.log('Sending to n8n:', JSON.stringify(n8nPayload, null, 2));

    // Get n8n webhook URL
    const webhookUrl = context.N8N_DISPOSITION_WEBHOOK;
    
    if (!webhookUrl) {
      throw new Error('N8N_DISPOSITION_WEBHOOK not configured');
    }

    // Send to n8n
    const n8nResponse = await axios.post(webhookUrl, n8nPayload, {
      headers: {
        'Content-Type': 'application/json',
        // Add auth header if needed
        // 'X-Webhook-Secret': context.N8N_WEBHOOK_SECRET
      },
      timeout: 5000 // 5 second timeout
    });

    console.log('n8n Response:', n8nResponse.data);

    // Success response
    response.setBody({
      success: true,
      message: 'Disposition saved successfully',
      n8nResponse: n8nResponse.data,
      timestamp: new Date().toISOString()
    });

    callback(null, response);

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    response.setStatusCode(500);
    response.setBody({
      success: false,
      error: error.message,
      details: error.response?.data || null
    });
    
    callback(null, response);
  }
};