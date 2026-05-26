import { useState, useEffect } from "react";
import { Play, Video } from "lucide-react";

interface VideoThumbnailProps {
  thumbnailUrl: string | null | undefined;
  caption?: string | null;
  creatorUsername?: string | null;
  tiktokId?: string | null;
  className?: string;
}

/**
 * Bulletproof video thumbnail component.
 * Pipeline: stored URL → oembed fallback → gradient placeholder
 * NEVER shows broken image or empty state.
 */
export function VideoThumbnail({ thumbnailUrl, caption, creatorUsername, tiktokId, className = "" }: VideoThumbnailProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [oembedUrl, setOembedUrl] = useState<string | null>(null);
  const [oembedFailed, setOembedFailed] = useState(false);

  // When stored thumbnail fails, try oembed API as runtime fallback
  useEffect(() => {
    if (!imgFailed || oembedUrl || oembedFailed) return;

    const id = tiktokId;
    if (!id) {
      setOembedFailed(true);
      return;
    }

    const videoUrl = creatorUsername
      ? `https://www.tiktok.com/@${creatorUsername}/video/${id}`
      : `https://www.tiktok.com/video/${id}`;

    const controller = new AbortController();
    fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`, {
      signal: controller.signal,
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.thumbnail_url) {
          setOembedUrl(data.thumbnail_url);
        } else {
          setOembedFailed(true);
        }
      })
      .catch(() => setOembedFailed(true));

    return () => controller.abort();
  }, [imgFailed, tiktokId, creatorUsername, oembedUrl, oembedFailed]);

  // Determine which URL to show
  const primaryUrl = thumbnailUrl && !imgFailed ? thumbnailUrl : null;
  const fallbackUrl = imgFailed && oembedUrl && !oembedFailed ? oembedUrl : null;
  const showImage = primaryUrl || fallbackUrl;

  if (showImage) {
    return (
      <img
        src={(primaryUrl || fallbackUrl)!}
        alt={caption || "Vídeo viral"}
        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${className}`}
        loading="lazy"
        onError={() => {
          if (primaryUrl) {
            setImgFailed(true);
          } else {
            // oembed image also failed
            setOembedFailed(true);
            setOembedUrl(null);
          }
        }}
      />
    );
  }

  // Beautiful gradient placeholder — last resort
  const hash = (creatorUsername || caption || "video").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue1 = hash % 360;
  const hue2 = (hue1 + 40) % 360;
  const initial = (creatorUsername || "V")[0].toUpperCase();

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue1}, 40%, 15%) 0%, hsl(${hue2}, 50%, 10%) 100%)`,
      }}
    >
      <div
        className="absolute w-32 h-32 rounded-full opacity-10"
        style={{ background: `hsl(${hue1}, 60%, 40%)`, top: "15%", right: "-10%" }}
      />
      <div
        className="absolute w-24 h-24 rounded-full opacity-10"
        style={{ background: `hsl(${hue2}, 60%, 40%)`, bottom: "20%", left: "-5%" }}
      />
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-3 backdrop-blur-sm"
        style={{
          background: `linear-gradient(135deg, hsl(${hue1}, 50%, 25%), hsl(${hue2}, 50%, 20%))`,
          border: `2px solid hsl(${hue1}, 50%, 35%)`,
          color: `hsl(${hue1}, 60%, 70%)`,
        }}
      >
        {initial}
      </div>
      {creatorUsername && (
        <span className="text-xs text-muted-foreground/70 font-medium">
          @{creatorUsername}
        </span>
      )}
      <Video className="w-4 h-4 text-muted-foreground/30 mt-2" />
    </div>
  );
}
