import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const port = 3001;

app.use(cors());

app.post('/api/assemblyai', async (req, res) => {
  try {
    const response = await fetch(`https://streaming.assemblyai.com/v3/token?expires_in_seconds=600`, {
      method: 'GET',
      headers: {
        'Authorization': process.env.ASSEMBLYAI_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AssemblyAI API Response Status:', response.status);
      console.error('AssemblyAI API Response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(errorData.error || `Failed to get temporary token from AssemblyAI (${response.status})`);
    }

    const data = await response.json();
    res.status(200).json({ token: data.token });
  } catch (error) {
    console.error('Error creating AssemblyAI token:', error);
    res.status(500).json({ error: 'Failed to create AssemblyAI token' });
  }
});

app.listen(port, () => {
  console.log(`AssemblyAI token server listening at http://localhost:${port}`);
});
