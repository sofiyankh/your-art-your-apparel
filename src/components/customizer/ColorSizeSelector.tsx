import { useCustomizerStore } from "@/stores/customizerStore";
import { SIZES, colorName } from "@/lib/format";

export function ColorSizeSelector({ colors }: { colors: string[] }) {
  const { color, size, setColor, setSize } = useCustomizerStore();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-workshop-foreground">Garment</h2>
        <p className="mt-1 text-xs text-workshop-foreground/55">{colorName(color)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              title={colorName(c)}
              aria-label={colorName(c)}
              className={`size-9 border ${color === c ? "border-primary ring-1 ring-primary" : "border-workshop-border"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm text-workshop-foreground/80">Size</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`min-w-10 border px-2.5 py-1.5 text-sm ${
                size === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-workshop-border text-workshop-foreground/80 hover:border-primary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
