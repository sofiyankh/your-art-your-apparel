import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Design = Database["public"]["Tables"]["designs"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

export const productsQuery = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

export const allProductsQuery = () =>
  queryOptions({
    queryKey: ["products", "all"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase.from("products").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

export const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["product", id],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const myDesignsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["designs", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Design[]> => {
      const { data, error } = await supabase
        .from("designs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const designQuery = (id: string | null) =>
  queryOptions({
    queryKey: ["design", id],
    enabled: !!id,
    queryFn: async (): Promise<Design | null> => {
      const { data, error } = await supabase
        .from("designs")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export type OrderWithItems = Order & {
  order_items: (OrderItem & { products: { name: string } | null })[];
};

export const myOrdersQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["orders", userId],
    enabled: !!userId,
    queryFn: async (): Promise<OrderWithItems[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrderWithItems[];
    },
  });

export const orderQuery = (id: string) =>
  queryOptions({
    queryKey: ["order", id],
    queryFn: async (): Promise<OrderWithItems | null> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name))")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as OrderWithItems | null;
    },
  });

/** Admin: every order, newest first. RLS lets admins read all rows. */
export const adminOrdersQuery = () =>
  queryOptions({
    queryKey: ["admin", "orders"],
    queryFn: async (): Promise<OrderWithItems[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrderWithItems[];
    },
  });

export const adminDesignsQuery = () =>
  queryOptions({
    queryKey: ["admin", "designs"],
    queryFn: async (): Promise<(Design & { products: { name: string } | null })[]> => {
      const { data, error } = await supabase
        .from("designs")
        .select("*, products(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Design & { products: { name: string } | null })[];
    },
  });

export const adminProfilesQuery = () =>
  queryOptions({
    queryKey: ["admin", "profiles"],
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles, error: roleError }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (error) throw error;
      if (roleError) throw roleError;
      const adminIds = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
      return (profiles ?? []).map((p) => ({ ...p, isAdmin: adminIds.has(p.id) }));
    },
  });

/** Private bucket: artwork is only ever reachable through a short-lived signed URL. */
export async function signedDesignUrl(path: string, seconds = 3600) {
  const { data, error } = await supabase.storage.from("designs").createSignedUrl(path, seconds);
  if (error) return null;
  return data.signedUrl;
}
