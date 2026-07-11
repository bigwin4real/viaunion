async function checkSupabase(env) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      Range: "0-0"
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase health check failed with status ${response.status}`);
  }
}

export default {
  async fetch(request, env) {
    await checkSupabase(env);
    return new Response("Supabase is active.", {
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(checkSupabase(env));
  }
};
