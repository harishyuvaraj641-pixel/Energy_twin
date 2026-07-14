import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// In-memory logs for system tracking
const chatHistory: any[] = [];

// API Route: NVIDIA NIM Proxy
app.post('/api/chat', async (req, res) => {
  const { messages, model } = req.body;
  const apiKey = process.env.VITE_NVIDIA_NIM_API_KEY;

  if (!apiKey) {
    return res.status(401).json({
      error: 'NVIDIA NIM API key is not configured on the server.',
    });
  }

  try {
    const selectedModel = model || 'meta/llama-3.1-8b-instruct';
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    chatHistory.push({
      timestamp: new Date(),
      prompt: messages[messages.length - 1]?.content,
      response: data.choices?.[0]?.message?.content,
    });

    res.json(data);
  } catch (error: any) {
    console.error('Server proxy error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// API Route: Server Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      supabase: process.env.VITE_SUPABASE_URL ? 'configured' : 'missing',
      nvidia_nim: process.env.VITE_NVIDIA_NIM_API_KEY ? 'configured' : 'missing',
      cesium_ion: process.env.VITE_CESIUM_ION_TOKEN ? 'configured' : 'missing',
    },
    chatbotLogs: chatHistory.length,
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Smart City Backend Server running on http://localhost:${PORT}`);
});
