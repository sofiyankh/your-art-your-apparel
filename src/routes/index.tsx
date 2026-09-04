import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { GarmentViewer } from "@/components/garment/GarmentViewer";
import { ProductCard } from "@/components/site/ProductCard";
import { productsQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pressworks — Custom garments made to order" },
      {
        name: "description",
        content:
          "A small screen-printing shop. Upload your artwork, place it on a heavyweight blank in 3D, and we press it to order.",
      },
      { property: "og:title", content: "Pressworks — Custom garments made to order" },
      {
        property: "og:description",
        content: "Upload your artwork, place it in 3D, and we press it to order.",
      },
    ],
  }),
  component: Home,
});

const STEPS = [
  {
    n: "01",
    title: "Pick a blank",
    body: "Heavyweight tees and brushed fleece hoodies, in five shop colours.",
  },
  {
    n: "02",
    title: "Place your art",
    body: "Drop in a file and move it around the garment in 3D until it sits right.",
  },
  {
    n: "03",
    title: "We press it",
    body: "Water-based inks, pressed to order in the shop. Nothing sits in a warehouse.",
  },
];

function Home() {
  const { data: products } = useQuery(productsQuery());
  const featured = (products ?? []).slice(0, 3);

  return (
    <SiteLayout>
      {/* Asymmetric hero: copy left, live garment right */}
      <section className="rule-b">
        <div className="mx-auto grid w-full max-w-[1240px] items-center gap-10 px-5 py-16 lg:grid-cols-[minmax(0,38%)_minmax(0,62%)] lg:py-24">
          <div>
            <p className="text-sm text-muted-foreground">Made to order</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] sm:text-6xl">
              Your art,
              <br />
              on a garment
              <br />
              worth keeping.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/80">
              Bring a drawing, a photograph, a logo you sketched at 2am. Place it on the garment
              yourself, then we press it in the shop — one at a time, on blanks worth keeping.
            </p>
            <Link
              to="/shop"
              className="mt-8 inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start designing
              <ArrowRight className="size-4" strokeWidth={1.8} />
            </Link>
            <dl className="rule-t mt-12 grid grid-cols-3 gap-4 pt-6 text-sm">
              <div>
                <dt className="text-muted-foreground">Blanks</dt>
                <dd className="font-display text-2xl font-bold">240gsm</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Inks</dt>
                <dd className="font-display text-2xl font-bold">Water-based</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pressed in</dt>
                <dd className="font-display text-2xl font-bold">3 days</dd>
              </div>
            </dl>
          </div>
          <div className="relative h-[380px] border border-foreground/10 bg-card sm:h-[520px]">
            <GarmentViewer
              className="size-full"
              category="tshirt"
              color="#F2EFE7"
              controls={false}
              spin
            />
            <p className="absolute bottom-4 left-4 text-xs text-muted-foreground">
              Heavyweight Cotton Tee — natural canvas
            </p>
          </div>
        </div>
      </section>

      <section className="rule-b">
        <div className="mx-auto grid w-full max-w-[1240px] gap-8 px-5 py-14 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n} className="border-l border-foreground/20 pl-4">
              <p className="font-display text-sm font-bold text-primary">{step.n}</p>
              <h2 className="mt-1 font-display text-2xl font-bold">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/75">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mx-auto w-full max-w-[1240px] px-5 py-14">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-3xl font-bold">Blanks we keep in stock</h2>
            <Link to="/shop" className="text-sm text-primary hover:underline">
              See all
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
