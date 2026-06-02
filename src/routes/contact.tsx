import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { GoldButton } from "@/components/deluxe/ui";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Deluxe Fitness" },
      {
        name: "description",
        content:
          "Get in touch with Deluxe Fitness — partnerships, press, member support and gym contracts.",
      },
      { property: "og:title", content: "Contact — Deluxe Fitness" },
      {
        property: "og:description",
        content:
          "Reach the Deluxe Fitness team — partnerships, press, gym contracts and member support.",
      },
    ],
  }),
  component: Page,
});

const schema = z.object({
  name: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  subject: z.string().trim().min(1, "Required").max(150),
  message: z.string().trim().min(1, "Required").max(1000),
});

function Page() {
  const [status, setStatus] = useState<null | "ok" | "err">(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      setStatus("err");
      return;
    }
    setErrors({});
    setStatus("ok");
    e.currentTarget.reset();
  };

  return (
    <PageShell>
      <PageHero
        eyebrow="Contact"
        title="LET'S"
        highlight="TALK."
        body="Partnerships, gym contracts, press or member support — we read every message."
      />

      <section className="bg-deluxe-black py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[1fr_1.3fr]">
          <aside className="space-y-6">
            {[
              { Icon: Mail, label: "Email", value: "hello@deluxefitness.app" },
              { Icon: Phone, label: "Phone", value: "+44 (0) 20 0000 0000" },
              { Icon: MapPin, label: "Studio", value: "London · United Kingdom" },
            ].map(({ Icon, label, value }) => (
              <div
                key={label}
                className="luxury-card flex items-start gap-4 p-6"
              >
                <Icon className="mt-1 h-5 w-5 text-gold" strokeWidth={1.5} />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    {label}
                  </div>
                  <div className="mt-1 text-base text-foreground">{value}</div>
                </div>
              </div>
            ))}
          </aside>

          <form onSubmit={submit} className="luxury-card space-y-5 p-8">
            <Field name="name" label="Full Name" error={errors.name} />
            <Field
              name="email"
              type="email"
              label="Email"
              error={errors.email}
            />
            <Field name="subject" label="Subject" error={errors.subject} />
            <Field
              name="message"
              label="Message"
              error={errors.message}
              textarea
            />
            <div className="flex items-center justify-between gap-4 pt-2">
              <GoldButton type="submit">
                <Send className="h-4 w-4" /> Send Message
              </GoldButton>
              {status === "ok" && (
                <p className="text-xs text-gold">
                  Sent. We'll be in touch shortly.
                </p>
              )}
              {status === "err" && (
                <p className="text-xs text-destructive-foreground">
                  Please fix the highlighted fields.
                </p>
              )}
            </div>
          </form>
        </div>
      </section>
    </PageShell>
  );
}

function Field({
  name,
  label,
  type = "text",
  textarea,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  textarea?: boolean;
  error?: string;
}) {
  const cls =
    "w-full border border-gold/20 bg-deluxe-black px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none";
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-2">
        {textarea ? (
          <textarea name={name} rows={5} className={cls} maxLength={1000} />
        ) : (
          <input name={name} type={type} className={cls} maxLength={255} />
        )}
      </div>
      {error && <p className="mt-1 text-[11px] text-destructive-foreground/80">{error}</p>}
    </label>
  );
}
