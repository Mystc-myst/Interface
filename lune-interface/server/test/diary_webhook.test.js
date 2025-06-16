// lune-interface/server/test/diary_webhook.test.js
const request = require('supertest');
const app = require('../server'); // Assuming server.js exports the app

// Mock console.log to capture output
let consoleOutput = [];
const originalConsoleLog = console.log;

// Custom implementation of console.log to capture specific logs
console.log = (message, ...optionalParams) => {
  // Store the formatted message
  const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);
  consoleOutput.push(formattedMessage);

  // Call the original console.log to ensure messages are still printed to the actual console
  originalConsoleLog(message, ...optionalParams);
};


describe('POST /diary endpoint', () => {
  let server;

  beforeAll((done) => {
    // Instead of app.listen, we use the app instance with supertest's agent
    // If the app wasn't already listening (due to require.main check),
    // supertest handles making requests to it.
    // If you need to explicitly start and stop a server for some reason:
    // server = app.listen(0, done); // Listen on a random free port for testing
    // For typical supertest usage with an exported app, explicit listen/close isn't always needed
    // if supertest can directly use the app object.
    // However, if 'app' itself is the server instance from app.listen(), then it needs closing.
    // Since our app is just the express app, and not server = app.listen(), this is simpler.
    done();
  });

  beforeEach(() => {
    consoleOutput = []; // Reset output before each test
  });

  afterAll((done) => {
    console.log = originalConsoleLog; // Restore original console.log
    // if (server) {
    //   server.close(done);
    // } else {
    //   done();
    // }
    done(); // Assuming supertest handles server lifecycle or no explicit server was started by test
  });

  it('should attempt to send data to n8n webhook and return the entry', async () => {
    const diaryText = 'Test entry for n8n webhook';

    const response = await request(app)
      .post('/diary')
      .send({ text: diaryText })
      .expect(201);

    // Basic check for Jest's toBe (this environment might not run Jest, but the logic is the same)
    if (response.body.text !== diaryText) {
        throw new Error(`Expected response body text to be "${diaryText}" but got "${response.body.text}"`);
    }

    // Check console output for the webhook log
    const webhookLogFound = consoleOutput.some(log =>
      typeof log === 'string' && log.includes('Sending data to n8n webhook:')
    );

    if (!webhookLogFound) {
        originalConsoleLog("Console output during test:", consoleOutput); // Log what was captured for debugging
        throw new Error('Expected webhook log message not found in console output.');
    }
  });
});
