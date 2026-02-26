const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ASAP Roadworthys Functions',
    timestamp: new Date().toISOString(),
  });
});

app.post('/disposition-handler', async (req, res) => {
  try {
    const {
      taskSid,
      callSid,
      disposition,
      notes,
      customerPhone,
      customerName,
      agentName,
      callDuration,
      recordingUrl,
    } = req.body || {};

    if (!disposition) {
      return res.status(400).json({
        success: false,
        error: 'Disposition is required',
      });
    }

    const webhookUrl = process.env.N8N_DISPOSITION_WEBHOOK;
    if (!webhookUrl) {
      return res.status(500).json({
        success: false,
        error: 'N8N_DISPOSITION_WEBHOOK not configured',
      });
    }

    const n8nPayload = {
      event: 'call_disposition',
      timestamp: new Date().toISOString(),
      taskSid: taskSid || 'N/A',
      callSid: callSid || 'N/A',
      disposition,
      notes: notes || '',
      customer: {
        name: customerName || 'Unknown',
        phone: customerPhone || 'N/A',
      },
      agent: {
        name: agentName || 'Unknown',
      },
      call: {
        duration: callDuration || 0,
        recordingUrl: recordingUrl || null,
      },
      metadata: {
        source: 'twilio_flex',
        accountSid: process.env.ACCOUNT_SID || null,
      },
    };

    const n8nResponse = await axios.post(webhookUrl, n8nPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return res.json({
      success: true,
      message: 'Disposition saved successfully',
      n8nResponse: n8nResponse.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || null,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
