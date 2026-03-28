process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Temporary flag to allow AWS self-signed certs
import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.timeout = Number(process.env.API_TIMEOUT) || 600000; // 10 minutes timeout for long-running AI requests
