import express from 'express';

const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
  console.log('--- RECEIVED WEBHOOK ---');
  console.log('Payload:', JSON.stringify(req.body, null, 2));
  console.log('-------------------------');
  res.status(200).send('OK');
});

const PORT = 9999;
app.listen(PORT, () => {
  console.log(`Webhook listener running on http://localhost:${PORT}/webhook`);
});
