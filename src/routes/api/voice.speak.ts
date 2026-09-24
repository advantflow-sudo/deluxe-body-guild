import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireVoiceUser } from "@/lib/voiceAuth.server";

const Body = z.object({ text: z.string().min(1).max(4000) });

export const Route = createFileRoute("/api/voice/speak")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const who = await requireVoiceUser(request);
        if (who instanceof Response) return who;
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return Response.json({ error: "Voice is not configured" }, { status: 500 });
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Invalid text" }, { status: 400 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-tts-preview",
            contents: [{ role: "user", parts: [{ text: `Say in a warm, confident, encouraging personal-trainer voice: ${parsed.data.text}` }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
            },
            stream_format: "sse",
          }),
        });
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("content-type") ?? "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
          },
        });
      },
    },
  },
});
