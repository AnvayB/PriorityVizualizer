import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedTask {
  title: string;
  description?: string;
  dueDate?: string;
  high_priority: boolean;
}

interface ParsedSubsection {
  title: string;
  tasks: ParsedTask[];
}

interface ParsedSection {
  title: string;
  matchedExistingId?: string;
  subsections: ParsedSubsection[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const form = await req.formData();
    const audioFile = form.get("audio") as File | null;
    const existingSectionsJson = form.get("existingSections") as string | null;
    const today = (form.get("today") as string | null) ?? new Date().toISOString().split("T")[0];

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // --- Step 1: Transcribe with Whisper ---
    const whisperForm = new FormData();
    whisperForm.append("file", audioFile, "audio.webm");
    whisperForm.append("model", "whisper-1");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: whisperForm,
    });

    if (!whisperRes.ok) {
      const err = await whisperRes.text();
      return new Response(JSON.stringify({ error: `Whisper error: ${err}` }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { text: transcript } = await whisperRes.json();

    // --- Step 2: Parse with GPT-4o ---
    const existingSections: { id: string; title: string }[] = existingSectionsJson
      ? JSON.parse(existingSectionsJson)
      : [];

    const existingList = existingSections.length > 0
      ? `The user's existing sections are: ${existingSections.map((s) => `"${s.title}" (id: ${s.id})`).join(", ")}.`
      : "The user has no existing sections yet.";

    const systemPrompt = `You are a task extraction assistant. The user will describe their week or upcoming tasks in natural language. Your job is to parse this into a structured hierarchy of sections, subsections, and tasks.

Rules:
1. Group related tasks under logical sections (e.g., "Work", "School", "Personal").
2. ${existingList} If a spoken topic clearly matches an existing section (fuzzy/semantic match), set matchedExistingId to that section's id. Otherwise leave it undefined.
3. Each section should have at least one subsection (e.g., "Work" → "Projects", "Meetings").
4. Task titles MUST be ≤15 characters (for chart display). If the natural phrase is longer, create a short title AND put the full phrase as the description.
5. If the user implies urgency ("urgent", "ASAP", "critical", "important", "must", "need to"), set high_priority: true.
6. Resolve relative dates using today's date (${today}). Return dates as ISO strings (YYYY-MM-DD). If no date is mentioned for a task, omit dueDate.
7. Today is ${today}.

Return ONLY valid JSON in this exact shape, no markdown, no explanation:
{
  "sections": [
    {
      "title": "string",
      "matchedExistingId": "string or omit if new",
      "subsections": [
        {
          "title": "string",
          "tasks": [
            {
              "title": "string (≤15 chars)",
              "description": "string or omit",
              "dueDate": "YYYY-MM-DD or omit",
              "high_priority": boolean
            }
          ]
        }
      ]
    }
  ]
}`;

    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
      }),
    });

    if (!gptRes.ok) {
      const err = await gptRes.text();
      return new Response(JSON.stringify({ error: `GPT error: ${err}` }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const gptData = await gptRes.json();
    let rawJson = gptData.choices[0].message.content.trim();

    // Strip markdown code fences if present (e.g. ```json ... ```)
    rawJson = rawJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let parsed: { sections: ParsedSection[] };
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      return new Response(JSON.stringify({ error: `Failed to parse GPT response: ${rawJson.slice(0, 200)}` }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ transcript, sections: parsed.sections }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
