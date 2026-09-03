import { useCustomizerStore } from "@/stores/customizerStore";

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm text-workshop-foreground/80">
        {label}
        <span className="text-xs text-workshop-foreground/50">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-1 w-full cursor-pointer appearance-none bg-workshop-border accent-primary"
      />
    </label>
  );
}

/** Sliders write straight to the Zustand store, so the decal updates instantly. */
export function TransformPanel() {
  const { position, rotation, scale, setPosition, setRotation, setScale } = useCustomizerStore();

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold text-workshop-foreground">Placement</h2>
      <Slider
        label="Across"
        value={position[0]}
        min={-0.5}
        max={0.5}
        step={0.005}
        display={position[0].toFixed(2)}
        onChange={(v) => setPosition([v, position[1], position[2]])}
      />
      <Slider
        label="Up and down"
        value={position[1]}
        min={-0.7}
        max={0.6}
        step={0.005}
        display={position[1].toFixed(2)}
        onChange={(v) => setPosition([position[0], v, position[2]])}
      />
      <Slider
        label="Size"
        value={scale}
        min={0.08}
        max={0.85}
        step={0.005}
        display={`${Math.round(scale * 100)}%`}
        onChange={setScale}
      />
      <Slider
        label="Rotation"
        value={rotation}
        min={-Math.PI}
        max={Math.PI}
        step={0.01}
        display={`${Math.round((rotation * 180) / Math.PI)}°`}
        onChange={setRotation}
      />
      <button
        onClick={() => {
          setPosition([0, 0.1, 0.05]);
          setRotation(0);
          setScale(0.3);
        }}
        className="text-xs text-workshop-foreground/60 underline-offset-2 hover:text-workshop-foreground hover:underline"
      >
        Re-centre the artwork
      </button>
    </div>
  );
}
