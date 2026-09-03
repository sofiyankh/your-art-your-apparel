import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { GarmentViewer } from "@/components/garment/GarmentViewer";
import { productQuery } from "@/lib/queries";
import { currency, colorName, SIZES } from "@/lib/format";
import { useCartStore } from "@/stores/cartStore";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Garment detail — Pressworks" },
      {
        name: "description",
        content: "Choose a fabric colour and size, then customize the garment with your own artwork.",
      },
      { property: "og:title", content: "Garment detail — Pressworks" },
      {
        property: "og:description",
        content: "Choose a fabric colour and size, then add your own artwork.",
      },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: product, isLoading } = useQuery(productQuery(id));
  const add = useCartStore((s) => s.add);
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState("M");

  if (isLoading) {
    return (
      <SiteLayout>
        <p className="mx-auto max-w-[1240px] px-5 py-24 text-muted-foreground">Loading garment…</p>
      </SiteLayout>
    );
  }

  if (!product) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-[1240px] px-5 py-24">
          <h1 className="font-display text-3xl font-bold">We can't find that garment</h1>
          <Link to="/shop" className="mt-4 inline-block text-primary hover:underline">
            Back to the shop
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const activeColor = color ?? product.available_colors[0] ?? "#F2EFE7";

  return (
    <SiteLayout>
      <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-5 py-12 lg:grid-cols-[minmax(0,58%)_minmax(0,42%)]">
        <div className="canvas-weave h-[420px] border border-foreground/20 bg-card sm:h-[600px]">
          <GarmentViewer className="size-full" category={product.category} color={activeColor} />
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            {product.category === "hoodie" ? "Hoodie" : "T-shirt"}
          </p>
          <h1 className="mt-1 font-display text-5xl font-bold leading-none">{product.name}</h1>
          <p className="mt-4 font-display text-3xl font-bold">
            {currency(Number(product.base_price))}
          </p>
          <p className="mt-4 leading-relaxed text-foreground/80">{product.description}</p>

          <div className="rule-t mt-8 pt-6">
            <p className="text-sm font-medium">Fabric colour</p>
            <p className="mt-1 text-sm text-muted-foreground">{colorName(activeColor)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.available_colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  title={colorName(c)}
                  aria-label={colorName(c)}
                  className={`size-10 border ${activeColor === c ? "border-primary ring-1 ring-primary" : "border-foreground/25"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="rule-t mt-6 pt-6">
            <p className="text-sm font-medium">Size</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`min-w-11 border px-3 py-2 text-sm ${
                    size === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-foreground/25 hover:border-primary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              to="/customize/$productId"
              params={{ productId: product.id }}
              search={{ color: activeColor, size }}
              className="bg-primary px-6 py-3.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Customize this
            </Link>
            <button
              onClick={() => {
                add({
                  productId: product.id,
                  productName: product.name,
                  designId: null,
                  size,
                  color: activeColor,
                  quantity: 1,
                  unitPrice: Number(product.base_price),
                  previewUrl: null,
                });
                toast.success("Added to your cart");
                navigate({ to: "/cart" });
              }}
              className="border border-foreground/30 px-6 py-3.5 text-sm transition-colors hover:border-primary hover:text-primary"
            >
              Buy as-is
            </button>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
