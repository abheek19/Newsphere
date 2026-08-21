/**
 * Little Joys - Node.js Server
 * Alternative Express runner for Render or Node.js runtime environments.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Little Joys Node Server',
    n8n_integration: 'active',
    timestamp: new Date().toISOString()
  });
});

// N8N Query Form Proxy
app.post('/api/n8n/query', async (req, res) => {
  const { name, email, phone, category, message, webhookUrl } = req.body;
  const ticketId = `LJ-${Date.now()}`;
  let forwarded = false;
  let n8nResponse = null;

  if (webhookUrl && (webhookUrl.startsWith('http://') || webhookUrl.startsWith('https://'))) {
    try {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          timestamp: new Date().toISOString(),
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          query_category: category,
          message,
          source: 'Little Joys Web Portal'
        })
      });
      n8nResponse = await resp.text();
      forwarded = true;
    } catch (err) {
      console.warn('[Node Proxy] N8N Query forward error:', err.message);
    }
  }

  res.json({
    success: true,
    ticket_id: ticketId,
    timestamp: new Date().toISOString(),
    forwarded_to_n8n: forwarded,
    submitted_data: { name, email, phone, category, message },
    confirmation: `Thank you ${name || 'Valued Customer'}! Your query regarding '${category}' has been logged (ID: ${ticketId}).`
  });
});

// N8N AI Chatbot Proxy
app.post('/api/n8n/chat', async (req, res) => {
  const { message, sessionId, webhookUrl } = req.body;
  let reply = "Hello from Little Joys! Little Things Big Joys! How may we assist your home & living today?";
  let forwarded = false;

  if (webhookUrl && (webhookUrl.startsWith('http://') || webhookUrl.startsWith('https://'))) {
    try {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatInput: message, sessionId })
      });
      const data = await resp.json();
      reply = data.output || data.response || data.message || JSON.stringify(data);
      forwarded = true;
    } catch (err) {
      console.warn('[Node Proxy] N8N Chatbot forward error:', err.message);
    }
  }

  res.json({
    success: true,
    reply,
    forwarded_to_n8n: forwarded,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
});

// Serve frontend SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌿 Little Joys Node Server running on http://localhost:${PORT}`);
});
