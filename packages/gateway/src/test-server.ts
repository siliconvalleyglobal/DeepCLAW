import { createServer } from 'node:http';
import { Hono } from 'hono';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok' }));

const server = createServer(async (req, res) => {
  try {
    const response = await app.fetch(req);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.statusCode = response.status;
    const body = await response.text();
    res.end(body);
  } catch (err) {
    console.error('Request error:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.listen(3000, () => {
  console.log('Test server listening on port 3000');
});
