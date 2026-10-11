// AI providers for the chat assistant. Two wire formats cover almost everything:
//   • "anthropic" – Claude Messages API
//   • "openai"    – the OpenAI-style /chat/completions API, also spoken by DeepSeek, Gemini, Groq, Mistral, OpenRouter, Azure/Ollama/vLLM…
// API keys are read ONLY from environment variables (never stored in the database or sent to the browser).
// Model names change often: override per provider with <NAME>_MODEL, or set "AI model" in Admin → Settings.
const PRESETS = {
  anthropic:  { label: 'Claude (Anthropic)',         type: 'anthropic', keyEnv: 'ANTHROPIC_API_KEY',  base: 'https://api.anthropic.com',                              model: 'claude-haiku-4-5-20251001' },
  openai:     { label: 'OpenAI (ChatGPT models)',    type: 'openai',    keyEnv: 'OPENAI_API_KEY',     base: 'https://api.openai.com/v1',                              model: 'gpt-4o-mini', tokenParam: 'max_completion_tokens', maxTokens: 1500 },
  deepseek:   { label: 'DeepSeek',                   type: 'openai',    keyEnv: 'DEEPSEEK_API_KEY',   base: 'https://api.deepseek.com',                               model: 'deepseek-v4-flash' },
  gemini:     { label: 'Google Gemini',              type: 'openai',    keyEnv: 'GEMINI_API_KEY',     base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-flash-latest' },
  groq:       { label: 'Groq',                       type: 'openai',    keyEnv: 'GROQ_API_KEY',       base: 'https://api.groq.com/openai/v1',                         model: 'llama-3.3-70b-versatile' },
  mistral:    { label: 'Mistral',                    type: 'openai',    keyEnv: 'MISTRAL_API_KEY',    base: 'https://api.mistral.ai/v1',                              model: 'mistral-small-latest' },
  openrouter: { label: 'OpenRouter (many models)',   type: 'openai',    keyEnv: 'OPENROUTER_API_KEY', base: 'https://openrouter.ai/api/v1',                           model: 'openai/gpt-4o-mini' },
  custom:     { label: 'Custom OpenAI-compatible',   type: 'openai',    keyEnv: 'AI_API_KEY', baseEnv: 'AI_BASE_URL', modelEnv: 'AI_MODEL', base: '', model: '' },
};
const ORDER = ['anthropic', 'openai', 'deepseek', 'gemini', 'groq', 'mistral', 'openrouter', 'custom'];

const env = n => (process.env[n] || '').trim();
const U = id => id.toUpperCase();
const baseOf = id => (env(PRESETS[id].baseEnv || `${U(id)}_BASE_URL`) || PRESETS[id].base || '').replace(/\/$/, '');
const keyOf = id => env(PRESETS[id].keyEnv);
const modelOf = (id, override) => (override || env(PRESETS[id].modelEnv || `${U(id)}_MODEL`) || PRESETS[id].model || '').trim();
const isConfigured = id => id === 'custom' ? !!baseOf(id) : !!keyOf(id); // custom servers (Ollama…) may not need a key

// Which providers to try, in order. First = the admin's choice (or CHAT_PROVIDER, or the first with a key).
function plan(settings = {}) {
  const ready = ORDER.filter(isConfigured);
  const want = settings.chatProvider && settings.chatProvider !== 'auto' ? settings.chatProvider : env('CHAT_PROVIDER');
  const first = ready.includes(want) ? want : ready[0];
  const ordered = first ? [first, ...ready.filter(x => x !== first)] : [];
  return ordered.map((id, i) => ({ id, label: PRESETS[id].label, model: modelOf(id, i === 0 ? (settings.chatModel || env('CHAT_MODEL')) : '') }));
}

function status(settings = {}) {
  const active = plan(settings)[0];
  return ORDER.map(id => ({
    id, label: PRESETS[id].label, configured: isConfigured(id),
    keyEnv: PRESETS[id].keyEnv, model: modelOf(id, active?.id === id ? (settings.chatModel || env('CHAT_MODEL')) : ''),
    active: active?.id === id,
  }));
}

const redact = s => {
  let out = String(s);
  for (const id of ORDER) { const k = keyOf(id); if (k && k.length > 5) out = out.split(k).join('***'); }
  return out.replace(/(sk-|AIza|gsk_)[A-Za-z0-9_-]{8,}/g, '***').slice(0, 300);
};

async function call(step, system, messages) {
  const p = PRESETS[step.id], base = baseOf(step.id), key = keyOf(step.id);
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    if (p.type === 'anthropic') {
      const r = await fetch(`${base}/v1/messages`, {
        method: 'POST', signal: ctrl.signal,
        headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: step.model, max_tokens: 500, system, messages }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
      const j = await r.json();
      return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim() || (() => { throw new Error('empty reply'); })();
    }
    const body = { model: step.model, messages: [{ role: 'system', content: system }, ...messages] };
    body[p.tokenParam || 'max_tokens'] = p.maxTokens || 600;
    const r = await fetch(`${base}/chat/completions`, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'content-type': 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    let text = j.choices?.[0]?.message?.content;
    if (Array.isArray(text)) text = text.map(x => x.text || '').join('');
    text = String(text || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim(); // some reasoning models inline their thoughts
    if (!text) throw new Error('empty reply (the model may have used its whole token budget thinking — try a non-reasoning model)');
    return text;
  } finally { clearTimeout(timer); }
}

module.exports = { PRESETS, ORDER, plan, status, call, redact, isConfigured };
