let cachedUrl;

function getN8nWebhookUrl() {
  if (cachedUrl) {
    return cachedUrl;
  }
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    console.error('N8N_WEBHOOK_URL environment variable is required but was not set.');
    process.exit(1);
  }
  cachedUrl = url;
  return cachedUrl;
}

module.exports = { getN8nWebhookUrl };
