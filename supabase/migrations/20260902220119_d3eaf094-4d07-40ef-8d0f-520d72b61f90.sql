create type public.app_role as enum ('customer','admin');
create type public.order_status as enum ('pending_payment','paid','in_production','shipped','delivered','cancelled','refunded');

create table public.profiles (
  id uuid primary key,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin')
$$;

create policy "profiles own read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles own insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles own update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "roles own read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "roles admin write" on public.user_roles for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text,
  category text not null check (category in ('tshirt','hoodie')),
  base_price numeric(10,2) not null,
  available_colors text[] not null default '{}',
  model_glb_url text,
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products public read" on public.products for select using (true);
create policy "products admin write" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  product_id uuid not null references public.products(id) on delete cascade,
  uploaded_image_path text not null,
  position_x numeric not null default 0,
  position_y numeric not null default 0,
  position_z numeric not null default 0.05,
  rotation numeric not null default 0,
  scale numeric not null default 0.3,
  garment_color text not null default '#F2EFE7',
  preview_thumbnail_url text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.designs to authenticated;
grant all on public.designs to service_role;
alter table public.designs enable row level security;
create policy "designs owner all" on public.designs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "designs admin read" on public.designs for select to authenticated using (public.is_admin());

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  order_number text not null unique default 'PW-' || upper(substr(md5(random()::text), 1, 8)),
  status public.order_status not null default 'pending_payment',
  total numeric(10,2) not null default 0,
  shipping_address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders owner read" on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "orders owner insert" on public.orders for insert to authenticated with check (user_id = auth.uid());
create policy "orders admin write" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  design_id uuid references public.designs(id) on delete set null,
  quantity int not null default 1 check (quantity > 0),
  size text not null,
  color text not null,
  unit_price numeric(10,2) not null default 0
);
grant select, insert, update, delete on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "order items owner read" on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
);
create policy "order items owner insert" on public.order_items for insert to authenticated with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

insert into public.products (name, slug, description, category, base_price, available_colors, model_glb_url, is_active) values
('Heavyweight Cotton Tee', 'heavyweight-cotton-tee', 'A 240gsm ringspun cotton tee with a boxy fit and taped shoulders. Prints crisp, washes soft.', 'tshirt', 32.00, '{"#F2EFE7","#211E19","#22314F","#A8461F","#5C6B3C"}', '/models/tshirt.glb', true),
('Studio Pocket Tee', 'studio-pocket-tee', 'Mid-weight tee with a stitched chest pocket. Our everyday blank for single-colour prints.', 'tshirt', 28.00, '{"#F2EFE7","#211E19","#22314F"}', '/models/tshirt.glb', true),
('Workshop Hoodie', 'workshop-hoodie', 'Brushed-back fleece hoodie, 400gsm, with a double-layer hood and ribbed cuffs.', 'hoodie', 68.00, '{"#211E19","#22314F","#5C6B3C","#F2EFE7"}', '/models/hoodie.glb', true),
('Dropline Hoodie', 'dropline-hoodie', 'Relaxed hoodie cut for oversized front prints. Garment-dyed, so no two are identical.', 'hoodie', 74.00, '{"#A8461F","#211E19","#F2EFE7"}', '/models/hoodie.glb', true);