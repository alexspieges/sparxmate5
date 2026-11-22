import OpenAI from "openai";

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: "The AI is not configured yet. Add OPENAI_API_KEY in Netlify site environment variables." }, { status: 503 });
  try {
    const body = await req.json();
    const { question = "", subject = "Mixed science", level = "GCSE Year 10", mode = "Explain step by step", imageData } = body || {};
    if (typeof question !== "string" || question.length > 10000) return Response.json({ error: "Question text is invalid or too long." }, { status: 400 });
    const content = [{ type: "input_text", text: `Subject: ${subject}\nLevel: ${level}\nHelp style: ${mode}\n\nQuestion or extra context:\n${question || "(Please read the attached screenshot and identify the science question.)"}` }];
    if (imageData) {
      if (typeof imageData !== "string" || !/^data:image\/(png|jpeg|webp);base64,/.test(imageData)) return Response.json({ error: "Please upload a PNG, JPG or WEBP image." }, { status: 400 });
      content.push({ type: "input_image", image_url: imageData, detail: "high" });
    }
    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      instructions: "You are SparxMate, a friendly GCSE science tutor. Read the attached question image if supplied. If the image is unclear, say exactly what is unreadable rather than inventing details. Give a clear explanation at the stated school level. Use headings: What the question is asking; Step-by-step explanation; Suggested answer; Quick check. For calculations show formula, substitution, units and final answer. For multiple choice, explain why the selected option is correct. If the student asked for a hint, give a hint without revealing the full answer. Keep the suggested answer concise and scientifically accurate. The student must review and submit their own work.",
      input: [{ role: "user", content }]
    });
    const answer = response.output_text || "I couldn't produce an explanation. Try a clearer screenshot or paste the question.";
    const match = answer.match(/Suggested answer\s*[:\-]?\s*([\s\S]*?)(?=\n(?:Quick check|$))/i);
    return Response.json({ answer, suggestedAnswer: match?.[1]?.trim() || answer });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "AI request failed. Check the API key and model setting." }, { status: 500 });
  }
};
