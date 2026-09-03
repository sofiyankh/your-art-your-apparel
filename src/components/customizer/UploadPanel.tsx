import { useRef, useState } from "react";
import { UploadCloud, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCustomizerStore } from "@/stores/customizerStore";

const MAX_BYTES = 10 * 1024 * 1024;
const OK_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MIN_PIXELS = 1200;

export function UploadPanel({ userId }: { userId: string | null }) {
  const { imageUrl, setImage } = useCustomizerStore();
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!OK_TYPES.includes(file.type)) {
      toast.error("That file type won't print. Use PNG, JPG, WEBP or SVG.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("That file is over 10MB. Export it a little smaller.");
      return;
    }
    if (!userId) {
      toast.error("Sign in first so we can keep your artwork with your account.");
      return;
    }

    setWarning(null);
    const localUrl = URL.createObjectURL(file);

    // Soft resolution warning — the shop can still print it, it just won't be crisp.
    if (file.type !== "image/svg+xml") {
      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 0, h: 0 });
        img.src = localUrl;
      });
      if (dims.w && Math.max(dims.w, dims.h) < MIN_PIXELS) {
        setWarning(
          `That file is ${dims.w}×${dims.h}px. It will print a little soft — ${MIN_PIXELS}px on the long edge is our sweet spot.`,
        );
      }
    }

    setBusy(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("designs")
      .upload(path, file, { contentType: file.type, upsert: false });
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    setImage(localUrl, path);
    toast.success("Artwork loaded onto the garment");
  }

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-workshop-foreground">Your artwork</h2>
      {imageUrl ? (
        <div className="mt-3 flex items-center gap-3 border border-workshop-border bg-workshop p-3">
          <img
            src={imageUrl}
            alt="Your uploaded artwork"
            className="size-16 border border-workshop-border object-contain"
          />
          <div className="min-w-0 flex-1 text-xs text-workshop-foreground/70">
            Loaded and stored privately. Only you and the print team can see it.
          </div>
          <button
            onClick={() => setImage(null, null)}
            className="text-workshop-foreground/60 transition-colors hover:text-rust"
            aria-label="Remove artwork"
          >
            <Trash2 className="size-4" strokeWidth={1.6} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
          className={`mt-3 flex w-full flex-col items-center gap-2 border border-dashed px-4 py-10 text-center transition-colors ${
            dragging ? "border-primary bg-primary/10" : "border-workshop-border"
          }`}
        >
          <UploadCloud className="size-6 text-workshop-foreground/60" strokeWidth={1.5} />
          <span className="font-display text-lg font-bold text-workshop-foreground">
            {busy ? "Uploading…" : "Drop your art here"}
          </span>
          <span className="text-xs text-workshop-foreground/60">
            PNG, JPG, WEBP or SVG · up to 10MB
          </span>
        </button>
      )}
      {warning ? <p className="mt-2 text-xs text-rust">{warning}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept={OK_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
