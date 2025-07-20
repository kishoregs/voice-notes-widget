import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const port = 3001;

// Enable CORS
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AssemblyAI token endpoint
app.post('/api/assemblyai', async (req, res) => {
  console.log('Token request received at:', new Date().toISOString());
  
  // Validate API key
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    console.log('ERROR: No API key found in environment');
    return res.status(500).json({ error: 'No API key configured' });
  }
  
  console.log('API key found, length:', apiKey.length);
  
  try {
    console.log('Making request to AssemblyAI...');
    
    const response = await fetch('https://streaming.assemblyai.com/v3/token?expires_in_seconds=600', {
      method: 'GET',
      headers: {
        'Authorization': apiKey,
      },
    });
    
    console.log('AssemblyAI response status:', response.status);
    console.log('AssemblyAI response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('AssemblyAI error response:', errorText);
      return res.status(500).json({ 
        error: `AssemblyAI API error: ${response.status}`,
        details: errorText 
      });
    }
    
    const data = await response.json();
    console.log('Token received successfully, length:', data.token?.length || 0);
    
    // Return the token
    res.json({ token: data.token });
    
  } catch (error) {
    console.log('Exception caught:', error.name, error.message);
    console.log('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`AssemblyAI token server running on http://localhost:${port}`);
  console.log('Environment check:');
  console.log('- API Key present:', process.env.ASSEMBLYAI_API_KEY ? 'Yes' : 'No');
  console.log('- Node.js version:', process.version);
});
