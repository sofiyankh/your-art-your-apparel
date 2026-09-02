import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { NEXT_STATUSES, type OrderStatus } from "@/lib/format";

const statuses = [
  "pending_payment",
  "paid",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

async function assertAdmin(supabase: {
  rpc: (fn: "is_admin") => Promise<{ data: unknown; error: { message: string } | null }>;
}) {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) throw new Error(error.message);
  if (data !== true) throw new Error("Forbidden");
}

/** Admin-only: move an order forward through the lifecycle. */
export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ orderId: z.string().uuid(), status: z.enum(statuses) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await assertAdmin(supabase as never);

    const { data: current, error } = await supabase
      .from("orders")
      .select("status")
      .eq("id", data.orderId)
      .single();
    if (error) throw new Error(error.message);

    const allowed = NEXT_STATUSES[current.status as OrderStatus];
    if (!allowed.includes(data.status as OrderStatus)) {
      throw new Error(`An order that is ${current.status} cannot move to ${data.status}.`);
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.orderId);
    if (updateError) throw new Error(updateError.message);
    return { ok: true };
  });

/** Admin-only: grant or revoke the admin role. Roles live in their own table. */
export const setAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), isAdmin: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase as never);

    if (data.userId === userId && !data.isAdmin) {
      throw new Error("You cannot remove your own admin access.");
    }

    if (data.isAdmin) {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional().default(""),
  category: z.enum(["tshirt", "hoodie"]),
  base_price: z.number().min(0).max(10000),
  available_colors: z.array(z.string().min(1).max(32)).max(12),
  model_glb_url: z.string().max(400).optional().default(""),
  is_active: z.boolean().default(true),
});

/** Admin-only product create/update. */
export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await assertAdmin(supabase as never);

    const row = {
      name: data.name,
      description: data.description,
      category: data.category,
      base_price: data.base_price,
      available_colors: data.available_colors,
      model_glb_url: data.model_glb_url || null,
      is_active: data.is_active,
    };

    if (data.id) {
      const { error } = await supabase.from("products").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await supabase
      .from("products")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await assertAdmin(supabase as never);
    const { error } = await supabase.from("products").update({ is_active: false }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
