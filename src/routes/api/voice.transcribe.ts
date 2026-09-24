import { createFileRoute } from "@tanstack/react-router";
import { requireVoiceUser } from "@/lib/voiceAuth.server";

const MAX_BYTES = 12 * 1024 * 1024;

export const Route = createFileRoute("/api/voice/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const who = await requireVoiceUser(request);
        if (who instanceof Response) return who;
        const len = Number(request.headers.get("content-length") ?? 0);
        if (len > MAX_BYTES) return Response.json({ error: "Recording too long — keep it under a minute." }, { status: 413 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return Response.json({ error: "Voice is not configured" }, { status: 500 });

        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File) || !file.size || file.size > MAX_BYTES || !file.type.startsWith("audio/")) {
          return Response.json({ error: "Invalid recording" }, { status: 400 });
        }
        const out = new FormData();
        out.append("model", "google/gemini-3.5-transcribe");
        out.append("file", file, file.name || "recording.wav");
        out.append("response_format", "json");
        out.append("stream", "true");
        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: out,
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
