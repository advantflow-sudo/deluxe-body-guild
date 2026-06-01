import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionLabel } from "@/components/deluxe/ui";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface Measurement {
  measured_on: string;
  weight_kg: number | null;
  waist_cm: number | null;
}
interface Photo {
  id: string;
  storage_path: string;
  taken_on: string;
  url?: string;
}

export function BodyTimeline({ userId }: { userId: string }) {
  const [meas, setMeas] = useState<Measurement[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: m }, { data: p }] = await Promise.all([
        supabase
          .from("body_measurements")
          .select("measured_on,weight_kg,waist_cm")
          .eq("user_id", userId)
          .order("measured_on", { ascending: true }),
        supabase
          .from("progress_photos")
          .select("id,storage_path,taken_on")
          .eq("user_id", userId)
          .order("taken_on", { ascending: true }),
      ]);
      if (m) setMeas(m as Measurement[]);
      if (p) {
        const withUrls = await Promise.all(
          (p as Photo[]).map(async (ph) => {
            const { data } = await supabase.storage
              .from("progress-photos")
              .createSignedUrl(ph.storage_path, 60 * 60);
            return { ...ph, url: data?.signedUrl };
          }),
        );
        setPhotos(withUrls);
      }
    })();
  }, [userId]);

  const first = meas.find((m) => m.weight_kg != null);
  const last = [...meas].reverse().find((m) => m.weight_kg != null);
  const startW = first?.weight_kg ?? null;
  const currentW = last?.weight_kg ?? null;
  const delta =
    startW != null && currentW != null ? Math.round((currentW - startW) * 10) / 10 : null;
  const days =
    first && last
      ? Math.max(
          0,
          Math.round(
            (new Date(last.measured_on).getTime() - new Date(first.measured_on).getTime()) /
              86_400_000,
          ),
        )
      : 0;

  if (meas.length === 0 && photos.length === 0) {
    return (
      <div className="border border-gold/15 bg-deluxe-forest/20 p-5">
        <SectionLabel>Body Transformation</SectionLabel>
        <p className="mt-3 text-xs text-muted-foreground">
          Log measurements and upload progress photos to start building your timeline.
        </p>
      </div>
    );
  }

  const TrendIcon = delta == null ? Minus : delta < 0 ? ArrowDown : delta > 0 ? ArrowUp : Minus;
  const trendLabel =
    delta == null ? "—" : delta === 0 ? "Stable" : `${delta > 0 ? "+" : ""}${delta} kg`;

  return (
    <div className="border border-gold/15 bg-deluxe-forest/20 p-5">
      <SectionLabel>Body Transformation</SectionLabel>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Stat label="Start" value={startW ? `${startW} kg` : "—"} />
        <Stat label="Current" value={currentW ? `${currentW} kg` : "—"} />
        <Stat
          label={`${days || 0} days`}
          value={
            <span className="inline-flex items-center gap-1">
              <TrendIcon className="h-4 w-4" />
              {trendLabel}
            </span>
          }
        />
      </div>

      {photos.length > 0 && (
        <>
          <div className="mt-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Photo timeline
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {photos.map((p) => (
              <figure key={p.id} className="shrink-0">
                <div className="h-32 w-24 overflow-hidden border border-gold/20 bg-deluxe-black">
                  {p.url && (
                    <img
                      src={p.url}
                      alt={`Progress ${p.taken_on}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <figcaption className="mt-1 text-center text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  {new Date(p.taken_on).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}

      {photos.length >= 2 && (
        <div className="mt-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Before vs Now
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <ComparePhoto label="Before" photo={photos[0]} />
            <ComparePhoto label="Now" photo={photos[photos.length - 1]} />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border border-gold/10 px-2 py-3">
      <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg text-gold">{value}</div>
    </div>
  );
}

function ComparePhoto({ label, photo }: { label: string; photo: Photo }) {
  return (
    <figure>
      <div className="aspect-[3/4] overflow-hidden border border-gold/20 bg-deluxe-black">
        {photo.url && (
          <img src={photo.url} alt={label} loading="lazy" className="h-full w-full object-cover" />
        )}
      </div>
      <figcaption className="mt-2 text-center text-[10px] uppercase tracking-[0.22em] text-gold">
        {label} · {new Date(photo.taken_on).toLocaleDateString()}
      </figcaption>
    </figure>
  );
}
