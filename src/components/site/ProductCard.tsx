import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/queries";
import { currency, colorName } from "@/lib/format";
import { GarmentViewer } from "@/components/garment/GarmentViewer";

export function ProductCard({ product }: { product: Product }) {
  const firstColor = product.available_colors[0] ?? "#F2EFE7";
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group relative block border border-foreground/10 bg-card transition-colors hover:border-primary/50"
    >
      <div className="relative aspect-4/5 overflow-hidden bg-background">
        <GarmentViewer
          className="size-full"
          category={product.category}
          color={firstColor}
          controls={false}
        />
        <span
          className="absolute right-0 top-0 size-8 border-b border-l border-foreground/20"
          style={{ backgroundColor: firstColor }}
          title={colorName(firstColor)}
        />
      </div>
      <div className="rule-t flex items-baseline justify-between gap-3 px-4 py-3">
        <div>
          <h3 className="font-display text-base font-semibold leading-tight group-hover:text-primary">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {product.category === "hoodie" ? "Hoodie" : "T-shirt"} ·{" "}
            {product.available_colors.length} colours
          </p>
        </div>
        <p className="font-display text-base font-medium">{currency(Number(product.base_price))}</p>
      </div>
    </Link>
  );
}
