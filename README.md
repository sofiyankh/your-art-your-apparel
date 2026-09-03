# Your Art, Your Apparel

# Custom apparel site — design & technical spec

A print-on-demand storefront where the core moment is a customer's own artwork becoming a real garment. The design language should feel like a small print shop / atelier, not a generic SaaS dashboard — the customer's uploaded art is the color and personality on the page, so the UI itself stays quiet and material-driven (canvas, ink, thread) rather than loud.

---

## 1. Theme / design system

**Concept**: "Print shop atelier." Warm, tactile, unbleached-canvas neutrals with a single confident ink accent — like a screen-printer's studio, not a tech dashboard. Sharp, small-radius corners and hairline borders instead of soft shadows and pill buttons. The customizer screen doubles as the visual centerpiece: full-bleed 3D viewport, minimal chrome around it.

**Color palette**
| Role | Hex | Use |
|---|---|---|
| Canvas | `#F2EFE7` | Page background — unbleached cotton tone |
| Ink (primary accent) | `#22314F` | Buttons, links, active states, headline accents |
| Rust (secondary accent) | `#A8461F` | Sparingly — sale badges, destructive actions' opposite (use ink for primary CTAs) |
| Near-black text | `#211E19` | Body text, borders |
| Workshop dark | `#1C1A16` | Background for the 3D customizer and admin panel (a deliberately different "mode" from the storefront) |
| Thread (success) | `#5C6B3C` | Order confirmed, in-stock states |

**Typography**
- Display / headlines / product names: a condensed, slightly industrial grotesque (e.g. Barlow Condensed or Archivo Expanded at bold weight) — evokes garment tags and stencils.
- Body / UI text: a plain neutral grotesque (e.g. Inter or Work Sans), regular and medium weights only.
- No all-caps labels throughout the UI — reserve caps for the rare moment it's earned (e.g. a size chip: S / M / L). No tracked-out eyebrow labels above headings.

**Layout**
- Left-aligned text, asymmetric hero (product photography or the live 3D viewer takes ~60% of the width, copy sits beside it — not centered).
- Product cards: photo-forward, sharp corners (`4px` radius), 1px hairline border, no drop shadows, no gradient washes. A small color-swatch tab in one corner indicates fabric color, like a fabric swatch card.
- One deliberate motion moment: when a design is confirmed in the customizer, a single orchestrated transition (garment settles into final position, subtle scale/fade) — not hover animations scattered across every card.

---

## 2. Frontend architecture

**Stack**: React, `react-three-fiber` + `@react-three/drei` (3D viewer), TanStack Query (server state — products, cart, orders), Zustand (local ephemeral state — the customizer's live transform values), Supabase client SDK, Stripe Checkout.

**Route map**

Storefront:
- `/` — home
- `/shop` — catalog (filter by garment type, color)
- `/product/:id` — detail; choose base color/size, then "Customize" or "Buy as-is"
- `/customize/:productId` — the 3D customizer (see below)
- `/cart`
- `/checkout`
- `/order-confirmation/:orderId`
- `/account` — order history, saved designs
- `/login`, `/signup`

Admin (role-gated, separate layout):
- `/admin` — overview (recent orders, quick stats)
- `/admin/products` — CRUD
- `/admin/orders` — list, detail, status updates
- `/admin/users` — list, role management
- `/admin/designs` — view/moderate uploaded designs if needed

**State management approach**
- Server state (products, cart contents, orders) → TanStack Query, backed directly by Supabase queries. This gives you caching/refetching for free and keeps the customizer decoupled from network state.
- Customizer transform state (position, rotation, scale, selected color) → a local Zustand store, scoped to the customizer route. It should stay ephemeral — nothing hits the database until the user hits "Save design," so dragging/scaling stays instant with no network chatter.

**The customizer screen — component breakdown**
- `CustomizerCanvas` — `react-three-fiber` `

`, `OrbitControls`, the garment GLB, and a `` projecting the uploaded image onto the mesh.
- `UploadPanel` — drag-and-drop image upload; client-side checks for file type, size (cap ~10MB), and a soft warning if resolution is too low for a clean print.
- `TransformControls` — sliders/drag handles bound to the Zustand store for position, scale, rotation.
- `ColorSizeSelector` — base garment color and size, independent from the print itself.
- `SaveBar` — confirm → persists the design to the `designs` table → routes to cart.

---

## 3. Backend logic

**Data model** (Postgres via Supabase)
- `users` — role: `admin` / `customer` (Supabase Auth covers credentials)
- `products` — name, category (tshirt/hoodie), base_price, available_colors, model_glb_url
- `designs` — user_id, product_id, uploaded_image_url, position_x/y/z, rotation, scale, preview_thumbnail_url
- `orders` — user_id, status, total, shipping info
- `order_items` — order_id, design_id, quantity, size, color

Storing the raw transform values (not just a flattened preview image) matters: it's what lets you regenerate a clean, high-resolution print file later, since the live 3D viewport render isn't production quality.

**Edge functions** (server-side logic that can't live in the client)
- `create-checkout-session` — builds a Stripe Checkout session; must recompute the price server-side from the `products` table rather than trusting whatever the client sends.
- `stripe-webhook` — handles payment confirmation, flips order status `pending_payment → paid`.
- `process-upload` — validates/resizes the uploaded image server-side before it becomes the official print asset, so the client never fully controls the final print file.
- `generate-print-file` (later phase) — renders a high-res flattened version of the design from the stored image + transform values, for the production team.

**Order lifecycle**
`pending_payment → paid → in_production → shipped → delivered`, with a `cancelled`/`refunded` branch. The Stripe webhook drives the first transition automatically; admin drives the rest manually from `/admin/orders`.

**RLS policy summary**
- `products` — public read, admin-only write.
- `designs` — owner reads/writes their own; admin reads all.
- `orders` / `order_items` — owner reads their own; admin reads/writes all.
- `users` — user reads/updates own profile; only admin can change the `role` column.

**Security notes worth building in from the start**
- Never trust a client-supplied price at checkout — always recompute from `products`.
- Validate uploaded images server-side (type, size, dimensions), not just in the browser.
- Store uploaded images in a private bucket with signed URLs, not a public bucket — designs may contain personal or copyrighted artwork customers don't want publicly indexable.
- Rate-limit uploads per user to prevent abuse.

---

## Build order (recap)

1. Storefront skeleton — catalog, product detail, cart, Stripe checkout, order history — with a static, non-customizable product first.
2. 3D viewer only — load the GLB, orbit controls, color/size switching. Confirms the rendering pipeline before adding upload complexity.
3. Upload + decal placement — the core novel feature; budget the most time here.
4. Save/confirm → cart → order, wired into the flow from step 1.
5. Admin dashboard, once the customer-side data model has settled.

---

## 4. Customizer implementation sketch

```tsx
// Customizer.tsx — core 3D customization surface
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Decal, useTexture, useGLTF } from '@react-three/drei'
import { useCustomizerStore } from './customizerStore'

function Garment() {
  const { nodes, materials } = useGLTF('/models/tshirt.glb')
  const { imageUrl, position, rotation, scale, color } = useCustomizerStore()
  const texture = imageUrl ? useTexture(imageUrl) : null

  return (
    
      
      {texture && (
        
          
        
      )}
    
  )
}

export function CustomizerCanvas() {
  return (
    


      
      
      
      
    


  )
}
```

```ts
// customizerStore.ts — Zustand store for live transform state
import { create } from 'zustand'

type CustomizerState = {
  imageUrl: string | null
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  color: string
  setImage: (url: string) => void
  setPosition: (p: [number, number, number]) => void
  setRotation: (r: [number, number, number]) => void
  setScale: (s: number) => void
  setColor: (c: string) => void
  reset: () => void
}

export const useCustomizerStore = create((set) => ({
  imageUrl: null,
  position: [0, 0, 0.05],
  rotation: [0, 0, 0],
  scale: 0.3,
  color: '#F2EFE7',
  setImage: (url) => set({ imageUrl: url }),
  setPosition: (position) => set({ position }),
  setRotation: (rotation) => set({ rotation }),
  setScale: (scale) => set({ scale }),
  setColor: (color) => set({ color }),
  reset: () => set({ imageUrl: null, position: [0, 0, 0.05], rotation: [0, 0, 0], scale: 0.3 }),
}))
```

`TransformControls` sliders call `setPosition` / `setRotation` / `setScale` directly on drag — the `Decal` re-renders instantly since it reads straight from the store, with no network round-trip. Only "Save design" writes `imageUrl` + the transform values to the `designs` table.

---

## 5. Database schema (SQL)

```sql
create type user_role as enum ('customer', 'admin');
create type order_status as enum ('pending_payment', 'paid', 'in_production', 'shipped', 'delivered', 'cancelled', 'refunded');

create table profiles (
  id uuid primary key references auth.users(id),
  role user_role not null default 'customer',
  full_name text,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('tshirt', 'hoodie')),
  base_price numeric(10,2) not null,
  available_colors text[] not null default '{}',
  model_glb_url text not null,
  created_at timestamptz not null default now()
);

create table designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  product_id uuid not null references products(id),
  uploaded_image_url text not null,
  position_x numeric not null,
  position_y numeric not null,
  position_z numeric not null,
  rotation numeric not null default 0,
  scale numeric not null default 0.3,
  preview_thumbnail_url text,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  status order_status not null default 'pending_payment',
  total numeric(10,2) not null,
  shipping_address jsonb not null,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  design_id uuid references designs(id),
  quantity int not null default 1,
  size text not null,
  color text not null
);

-- Row Level Security
alter table designs enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table products enable row level security;

create policy "public read products" on products for select using (true);
create policy "admin write products" on products for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "owner read/write own designs" on designs for all using (user_id = auth.uid());
create policy "admin read all designs" on designs for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "owner read own orders" on orders for select using (user_id = auth.uid());
create policy "admin read/write all orders" on orders for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
```

The `exists (select 1 from profiles where id = auth.uid() and role = 'admin')` check is the pattern reused across every admin policy — it's worth writing as a Postgres function (`is_admin()`) once you have more than two or three tables, rather than repeating the subquery.

---

## 6. Page-by-page details

**Home** — Hero is asymmetric: copy block left ("Print what you make."), a slow-rotating 3D garment preview or a short loop of a real print in progress on the right — not a centered banner. Below the fold, 3–4 real customer designs as social proof rather than stock lifestyle photography. Single CTA: "Start designing" → `/shop`.

**Shop** — Chip-style filters (garment type, color) rather than dropdowns. Grid of product cards: sharp 4px corners, hairline border, small color-swatch tab in one corner.

**Product detail** — Left: product photography or idle 3D view. Right: color/size selector, price, two CTAs — "Customize this" (primary, ink) and "Buy as-is" (secondary, quieter).

**Customizer** — Empty upload state reads "Drop your art here," not "No file selected." Save button reads "Save design" (active voice, matches what happens next), not "Submit."

**Cart** — Each `order_item` shows its `preview_thumbnail_url`, a quantity stepper, and an "Edit design" link that reopens the customizer with that design's stored image and transform values re-loaded into the Zustand store.

**Checkout** — Hands off to Stripe Checkout; button reads "Continue to payment."

**Order confirmation** — Order number, thread-green accent, plain next-step copy ("We'll email you when it ships") — no filler congratulations copy.

**Account** — Order history as status chips matching the lifecycle stages; a separate "Saved designs" gallery for `designs` rows not yet attached to an order, so someone can pick up a design they didn't finish ordering.

**Admin overview** — Recent orders table and a few operational numbers (orders today, revenue this week) — no vanity metrics.

**Admin products** — Table plus a create/edit form: name, category, price, available colors, GLB model upload.

**Admin orders** — Sortable by status; clicking a row shows items, shipping address, and a status dropdown that only allows moving forward through the lifecycle (or branching to cancelled/refunded).

**Admin users** — Table with a role toggle (customer/admin) — the one control genuinely gated to admins only, front and back.# Custom apparel site — design & technical spec

A print-on-demand storefront where the core moment is a customer's own artwork becoming a real garment. The design language should feel like a small print shop / atelier, not a generic SaaS dashboard — the customer's uploaded art is the color and personality on the page, so the UI itself stays quiet and material-driven (canvas, ink, thread) rather than loud.

---

## 1. Theme / design system

**Concept**: "Print shop atelier." Warm, tactile, unbleached-canvas neutrals with a single confident ink accent — like a screen-printer's studio, not a tech dashboard. Sharp, small-radius corners and hairline borders instead of soft shadows and pill buttons. The customizer screen doubles as the visual centerpiece: full-bleed 3D viewport, minimal chrome around it.

**Color palette**
| Role | Hex | Use |
|---|---|---|
| Canvas | `#F2EFE7` | Page background — unbleached cotton tone |
| Ink (primary accent) | `#22314F` | Buttons, links, active states, headline accents |
| Rust (secondary accent) | `#A8461F` | Sparingly — sale badges, destructive actions' opposite (use ink for primary CTAs) |
| Near-black text | `#211E19` | Body text, borders |
| Workshop dark | `#1C1A16` | Background for the 3D customizer and admin panel (a deliberately different "mode" from the storefront) |
| Thread (success) | `#5C6B3C` | Order confirmed, in-stock states |

**Typography**
- Display / headlines / product names: a condensed, slightly industrial grotesque (e.g. Barlow Condensed or Archivo Expanded at bold weight) — evokes garment tags and stencils.
- Body / UI text: a plain neutral grotesque (e.g. Inter or Work Sans), regular and medium weights only.
- No all-caps labels throughout the UI — reserve caps for the rare moment it's earned (e.g. a size chip: S / M / L). No tracked-out eyebrow labels above headings.

**Layout**
- Left-aligned text, asymmetric hero (product photography or the live 3D viewer takes ~60% of the width, copy sits beside it — not centered).
- Product cards: photo-forward, sharp corners (`4px` radius), 1px hairline border, no drop shadows, no gradient washes. A small color-swatch tab in one corner indicates fabric color, like a fabric swatch card.
- One deliberate motion moment: when a design is confirmed in the customizer, a single orchestrated transition (garment settles into final position, subtle scale/fade) — not hover animations scattered across every card.

---

## 2. Frontend architecture

**Stack**: React, `react-three-fiber` + `@react-three/drei` (3D viewer), TanStack Query (server state — products, cart, orders), Zustand (local ephemeral state — the customizer's live transform values), Supabase client SDK, Stripe Checkout.

**Route map**

Storefront:
- `/` — home
- `/shop` — catalog (filter by garment type, color)
- `/product/:id` — detail; choose base color/size, then "Customize" or "Buy as-is"
- `/customize/:productId` — the 3D customizer (see below)
- `/cart`
- `/checkout`
- `/order-confirmation/:orderId`
- `/account` — order history, saved designs
- `/login`, `/signup`

Admin (role-gated, separate layout):
- `/admin` — overview (recent orders, quick stats)
- `/admin/products` — CRUD
- `/admin/orders` — list, detail, status updates
- `/admin/users` — list, role management
- `/admin/designs` — view/moderate uploaded designs if needed

**State management approach**
- Server state (products, cart contents, orders) → TanStack Query, backed directly by Supabase queries. This gives you caching/refetching for free and keeps the customizer decoupled from network state.
- Customizer transform state (position, rotation, scale, selected color) → a local Zustand store, scoped to the customizer route. It should stay ephemeral — nothing hits the database until the user hits "Save design," so dragging/scaling stays instant with no network chatter.

**The customizer screen — component breakdown**
- `CustomizerCanvas` — `react-three-fiber` `

`, `OrbitControls`, the garment GLB, and a `` projecting the uploaded image onto the mesh.
- `UploadPanel` — drag-and-drop image upload; client-side checks for file type, size (cap ~10MB), and a soft warning if resolution is too low for a clean print.
- `TransformControls` — sliders/drag handles bound to the Zustand store for position, scale, rotation.
- `ColorSizeSelector` — base garment color and size, independent from the print itself.
- `SaveBar` — confirm → persists the design to the `designs` table → routes to cart.

---

## 3. Backend logic

**Data model** (Postgres via Supabase)
- `users` — role: `admin` / `customer` (Supabase Auth covers credentials)
- `products` — name, category (tshirt/hoodie), base_price, available_colors, model_glb_url
- `designs` — user_id, product_id, uploaded_image_url, position_x/y/z, rotation, scale, preview_thumbnail_url
- `orders` — user_id, status, total, shipping info
- `order_items` — order_id, design_id, quantity, size, color

Storing the raw transform values (not just a flattened preview image) matters: it's what lets you regenerate a clean, high-resolution print file later, since the live 3D viewport render isn't production quality.

**Edge functions** (server-side logic that can't live in the client)
- `create-checkout-session` — builds a Stripe Checkout session; must recompute the price server-side from the `products` table rather than trusting whatever the client sends.
- `stripe-webhook` — handles payment confirmation, flips order status `pending_payment → paid`.
- `process-upload` — validates/resizes the uploaded image server-side before it becomes the official print asset, so the client never fully controls the final print file.
- `generate-print-file` (later phase) — renders a high-res flattened version of the design from the stored image + transform values, for the production team.

**Order lifecycle**
`pending_payment → paid → in_production → shipped → delivered`, with a `cancelled`/`refunded` branch. The Stripe webhook drives the first transition automatically; admin drives the rest manually from `/admin/orders`.

**RLS policy summary**
- `products` — public read, admin-only write.
- `designs` — owner reads/writes their own; admin reads all.
- `orders` / `order_items` — owner reads their own; admin reads/writes all.
- `users` — user reads/updates own profile; only admin can change the `role` column.

**Security notes worth building in from the start**
- Never trust a client-supplied price at checkout — always recompute from `products`.
- Validate uploaded images server-side (type, size, dimensions), not just in the browser.
- Store uploaded images in a private bucket with signed URLs, not a public bucket — designs may contain personal or copyrighted artwork customers don't want publicly indexable.
- Rate-limit uploads per user to prevent abuse.

---

## Build order (recap)

1. Storefront skeleton — catalog, product detail, cart, Stripe checkout, order history — with a static, non-customizable product first.
2. 3D viewer only — load the GLB, orbit controls, color/size switching. Confirms the rendering pipeline before adding upload complexity.
3. Upload + decal placement — the core novel feature; budget the most time here.
4. Save/confirm → cart → order, wired into the flow from step 1.
5. Admin dashboard, once the customer-side data model has settled.

---

## 4. Customizer implementation sketch

```tsx
// Customizer.tsx — core 3D customization surface
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Decal, useTexture, useGLTF } from '@react-three/drei'
import { useCustomizerStore } from './customizerStore'

function Garment() {
  const { nodes, materials } = useGLTF('/models/tshirt.glb')
  const { imageUrl, position, rotation, scale, color } = useCustomizerStore()
  const texture = imageUrl ? useTexture(imageUrl) : null

  return (
    
      
      {texture && (
        
          
        
      )}
    
  )
}

export function CustomizerCanvas() {
  return (
    


      
      
      
      
    


  )
}
```

```ts
// customizerStore.ts — Zustand store for live transform state
import { create } from 'zustand'

type CustomizerState = {
  imageUrl: string | null
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  color: string
  setImage: (url: string) => void
  setPosition: (p: [number, number, number]) => void
  setRotation: (r: [number, number, number]) => void
  setScale: (s: number) => void
  setColor: (c: string) => void
  reset: () => void
}

export const useCustomizerStore = create((set) => ({
  imageUrl: null,
  position: [0, 0, 0.05],
  rotation: [0, 0, 0],
  scale: 0.3,
  color: '#F2EFE7',
  setImage: (url) => set({ imageUrl: url }),
  setPosition: (position) => set({ position }),
  setRotation: (rotation) => set({ rotation }),
  setScale: (scale) => set({ scale }),
  setColor: (color) => set({ color }),
  reset: () => set({ imageUrl: null, position: [0, 0, 0.05], rotation: [0, 0, 0], scale: 0.3 }),
}))
```

`TransformControls` sliders call `setPosition` / `setRotation` / `setScale` directly on drag — the `Decal` re-renders instantly since it reads straight from the store, with no network round-trip. Only "Save design" writes `imageUrl` + the transform values to the `designs` table.

---

## 5. Database schema (SQL)

```sql
create type user_role as enum ('customer', 'admin');
create type order_status as enum ('pending_payment', 'paid', 'in_production', 'shipped', 'delivered', 'cancelled', 'refunded');

create table profiles (
  id uuid primary key references auth.users(id),
  role user_role not null default 'customer',
  full_name text,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('tshirt', 'hoodie')),
  base_price numeric(10,2) not null,
  available_colors text[] not null default '{}',
  model_glb_url text not null,
  created_at timestamptz not null default now()
);

create table designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  product_id uuid not null references products(id),
  uploaded_image_url text not null,
  position_x numeric not null,
  position_y numeric not null,
  position_z numeric not null,
  rotation numeric not null default 0,
  scale numeric not null default 0.3,
  preview_thumbnail_url text,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  status order_status not null default 'pending_payment',
  total numeric(10,2) not null,
  shipping_address jsonb not null,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  design_id uuid references designs(id),
  quantity int not null default 1,
  size text not null,
  color text not null
);

-- Row Level Security
alter table designs enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table products enable row level security;

create policy "public read products" on products for select using (true);
create policy "admin write products" on products for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "owner read/write own designs" on designs for all using (user_id = auth.uid());
create policy "admin read all designs" on designs for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "owner read own orders" on orders for select using (user_id = auth.uid());
create policy "admin read/write all orders" on orders for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
```

The `exists (select 1 from profiles where id = auth.uid() and role = 'admin')` check is the pattern reused across every admin policy — it's worth writing as a Postgres function (`is_admin()`) once you have more than two or three tables, rather than repeating the subquery.

---

## 6. Page-by-page details

**Home** — Hero is asymmetric: copy block left ("Print what you make."), a slow-rotating 3D garment preview or a short loop of a real print in progress on the right — not a centered banner. Below the fold, 3–4 real customer designs as social proof rather than stock lifestyle photography. Single CTA: "Start designing" → `/shop`.

**Shop** — Chip-style filters (garment type, color) rather than dropdowns. Grid of product cards: sharp 4px corners, hairline border, small color-swatch tab in one corner.

**Product detail** — Left: product photography or idle 3D view. Right: color/size selector, price, two CTAs — "Customize this" (primary, ink) and "Buy as-is" (secondary, quieter).

**Customizer** — Empty upload state reads "Drop your art here," not "No file selected." Save button reads "Save design" (active voice, matches what happens next), not "Submit."

**Cart** — Each `order_item` shows its `preview_thumbnail_url`, a quantity stepper, and an "Edit design" link that reopens the customizer with that design's stored image and transform values re-loaded into the Zustand store.

**Checkout** — Hands off to Stripe Checkout; button reads "Continue to payment."

**Order confirmation** — Order number, thread-green accent, plain next-step copy ("We'll email you when it ships") — no filler congratulations copy.

**Account** — Order history as status chips matching the lifecycle stages; a separate "Saved designs" gallery for `designs` rows not yet attached to an order, so someone can pick up a design they didn't finish ordering.

**Admin overview** — Recent orders table and a few operational numbers (orders today, revenue this week) — no vanity metrics.

**Admin products** — Table plus a create/edit form: name, category, price, available colors, GLB model upload.

**Admin orders** — Sortable by status; clicking a row shows items, shipping address, and a status dropdown that only allows moving forward through the lifecycle (or branching to cancelled/refunded).

**Admin users** — Table with a role toggle (customer/admin) — the one control genuinely gated to admins only, front and back.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4880548c-1075-4c86-9e7a-afc2d8e38183).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
