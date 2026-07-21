import app from './app';
import dotenv from 'dotenv';
import path from 'path';

// Try to load env file from project root or server folder
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Tamupay API Server started successfully`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/health`);
  console.log(`=========================================`);
});
