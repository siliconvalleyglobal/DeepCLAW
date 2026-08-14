import { DeepClawServer } from './server.js';
import { PreExecutionPolicyEngine } from '../sdk/index.js';

const HTTP_PORT = Number(process.env.PORT ?? 3000);
const WS_PORT = Number(process.env.WS_PORT ?? 3001);

const server = new DeepClawServer({
  httpPort: HTTP_PORT,
  wsPort: WS_PORT,
  policyEngine: new PreExecutionPolicyEngine(),
});

server.start();

const shutdown = () => {
  console.log('\n[DeepCLAW] Shutting down...');
  server.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
