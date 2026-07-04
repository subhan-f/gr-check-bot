const API_BASE_URL = 'https://api.2captcha.com';

async function postJson(endpoint, body) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function createTask({ apiKey, type, websiteURL, websiteKey }) {
  const data = await postJson('/createTask', {
    clientKey: apiKey,
    task: { type, websiteURL, websiteKey },
  });
  if (data.errorId !== 0) {
    throw new Error(`2Captcha createTask failed: ${data.errorDescription || data.errorCode}`);
  }
  return data.taskId;
}

async function getTaskResult({ apiKey, taskId }) {
  const data = await postJson('/getTaskResult', { clientKey: apiKey, taskId });
  if (data.errorId !== 0) {
    throw new Error(`2Captcha getTaskResult failed: ${data.errorDescription || data.errorCode}`);
  }
  return data;
}

async function solveRecaptchaV2({
  apiKey,
  websiteURL,
  websiteKey,
  pollMs = 3000,
  timeoutMs = 120000,
}) {
  if (!apiKey) throw new Error('2Captcha API key is required');

  const taskId = await createTask({
    apiKey,
    type: 'RecaptchaV2TaskProxyless',
    websiteURL,
    websiteKey,
  });

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, pollMs));
    const result = await getTaskResult({ apiKey, taskId });
    if (result.status === 'ready') return result.solution.gRecaptchaResponse;
    if (result.status === 'failed') throw new Error('2Captcha task failed');
  }
  throw new Error('2Captcha solve timed out');
}

module.exports = { solveRecaptchaV2 };
