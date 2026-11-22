export default async () => Response.json({ ok: true, configured: !!process.env.OPENAI_API_KEY });
