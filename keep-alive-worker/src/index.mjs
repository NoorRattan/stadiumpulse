// Cloudflare invokes only the scheduled handler; no public HTTP route is exposed.
async function requireOk(response, label) {
  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status}.`);
  }
  return response;
}

async function verifyDemo(response) {
  await requireOk(response, "Database-backed demo");
  const payload = await response.json();
  if (payload.databaseStatus !== "connected") {
    throw new Error("Database-backed demo did not report a connected database.");
  }
}

export default {
  async scheduled(_controller, env) {
    const requestOptions = {
      headers: { "User-Agent": "StadiumPulse-Keep-Alive/1.0" },
    };
    const [healthResponse, demoResponse] = await Promise.all([
      fetch(env.HEALTH_URL, requestOptions),
      fetch(env.DEMO_URL, requestOptions),
    ]);

    await requireOk(healthResponse, "Backend health");
    await verifyDemo(demoResponse);
  },
};
