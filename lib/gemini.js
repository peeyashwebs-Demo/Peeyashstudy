// AI engine: Gemini free tier first, Groq as automatic fallback on quota errors.

const GEMINI_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

async function callGemini(model, prompt, { json = false } = {}) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
      ...(json ? { responseMimeType: "application/json" } : {})
    }
  };
  // exponential backoff on 429/503
  let delay = 1000;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(GEMINI_URL(model), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
    if (res.status === 429 || res.status === 503) {
      if (attempt === 3) throw new Error("gemini_quota");
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    const err = await res.text();
    throw new Error(`gemini_error_${res.status}: ${err.slice(0, 200)}`);
  }
}

async function callGroq(prompt, { json = false } = {}) {
  if (!process.env.GROQ_API_KEY) throw new Error("no_fallback");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      ...(json ? { response_format: { type: "json_object" } } : {})
    })
  });
  if (!res.ok) throw new Error("groq_error_" + res.status);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

// quality = smart breakdowns & draft review; fast = quizzes, summaries, chat
export async function ai(prompt, { tier = "fast", json = false } = {}) {
  const model = tier === "quality" ? "gemini-2.5-flash" : "gemini-2.5-flash-lite";
  try {
    return await callGemini(model, prompt, { json });
  } catch (e) {
    if (String(e.message).startsWith("gemini_quota")) {
      return await callGroq(prompt, { json });
    }
    throw e;
  }
}

export function parseJsonLoose(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(cleaned.slice(start, end + 1));
}
