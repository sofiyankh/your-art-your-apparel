import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Chip } from "@/components/site/Chip";
import { productsQuery } from "@/lib/queries";
import { colorName } from "@/lib/format";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop blanks — Pressworks" },
      {
        name: "description",
        content:
          "Heavyweight tees and brushed fleece hoodies, ready for your artwork. Filter by garment type and fabric colour.",
      },
      { property: "og:title", content: "Shop blanks — Pressworks" },
      {
        property: "og:description",
        content: "Heavyweight tees and brushed fleece hoodies, ready for your artwork.",
      },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { data: products, isLoading } = useQuery(productsQuery());
  const [category, setCategory] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);

  const colors = useMemo(
    () => [...new Set((products ?? []).flatMap((p) => p.available_colors))],
    [products],
  );

  const filtered = (products ?? []).filter(
    (p) =>
      (!category || p.category === category) && (!color || p.available_colors.includes(color)),
  );

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-[1240px] px-5 py-12">
        <h1 className="font-display text-5xl font-bold">The blanks</h1>
        <p className="mt-3 max-w-xl text-foreground/75">
          Every one of these can be printed with your own artwork, or bought plain.
        </p>

        <div className="rule-t rule-b mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-muted-foreground">Garment</span>
            <Chip active={!category} onClick={() => setCategory(null)}>
              Everything
            </Chip>
            <Chip active={category === "tshirt"} onClick={() => setCategory("tshirt")}>
              T-shirts
            </Chip>
            <Chip active={category === "hoodie"} onClick={() => setCategory("hoodie")}>
              Hoodies
            </Chip>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-muted-foreground">Fabric</span>
            <Chip active={!color} onClick={() => setColor(null)}>
              Any
            </Chip>
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                title={colorName(c)}
                aria-label={colorName(c)}
                className={`size-8 border ${color === c ? "border-primary ring-1 ring-primary" : "border-foreground/25"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="py-16 text-muted-foreground">Pulling blanks off the shelf…</p>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-muted-foreground">
            Nothing matches that combination. Try clearing a filter.
          </p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
