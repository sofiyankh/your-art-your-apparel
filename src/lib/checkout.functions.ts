import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const lineSchema = z.object({
  productId: z.string().uuid(),
  designId: z.string().uuid().nullable(),
  size: z.string().min(1).max(8),
  color: z.string().min(1).max(32),
  quantity: z.number().int().min(1).max(50),
});

const checkoutSchema = z.object({
  lines: z.array(lineSchema).min(1).max(50),
  shipping: z.object({
    full_name: z.string().min(1).max(120),
    line1: z.string().min(1).max(160),
    line2: z.string().max(160).optional().default(""),
    city: z.string().min(1).max(80),
    postal_code: z.string().min(1).max(24),
    country: z.string().min(1).max(80),
  }),
});

/**
 * Creates the order. Prices are recomputed from the `products` table — a
 * client-supplied price is never trusted.
 */
export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const productIds = [...new Set(data.lines.map((l) => l.productId))];
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id, base_price, is_active")
      .in("id", productIds);
    if (productError) throw new Error(productError.message);

    const priceById = new Map(
      (products ?? []).filter((p) => p.is_active).map((p) => [p.id, Number(p.base_price)]),
    );
    if (priceById.size !== productIds.length) {
      throw new Error("One of these products is no longer available.");
    }

    // Designs must belong to the buyer; RLS already scopes this read.
    const designIds = data.lines.map((l) => l.designId).filter((v): v is string => !!v);
    if (designIds.length) {
      const { data: designs, error: designError } = await supabase
        .from("designs")
        .select("id")
        .in("id", designIds);
      if (designError) throw new Error(designError.message);
      if ((designs ?? []).length !== new Set(designIds).size) {
        throw new Error("One of these designs could not be found.");
      }
    }

    const items = data.lines.map((line) => ({
      product_id: line.productId,
      design_id: line.designId,
      size: line.size,
      color: line.color,
      quantity: line.quantity,
      unit_price: priceById.get(line.productId)!,
    }));
    const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total,
        status: "pending_payment",
        shipping_address: data.shipping,
      })
      .select("id, order_number, total")
      .single();
    if (orderError) throw new Error(orderError.message);

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(items.map((i) => ({ ...i, order_id: order.id })));
    if (itemsError) throw new Error(itemsError.message);

    return { orderId: order.id, orderNumber: order.order_number, total: Number(order.total) };
  });
