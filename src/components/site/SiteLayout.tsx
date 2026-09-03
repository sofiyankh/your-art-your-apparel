import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCartStore, cartCount } from "@/stores/cartStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "The shop" },
];

export function SiteLayout({ children }: { children: ReactNode }) {
  const lines = useCartStore((s) => s.lines);
  const count = cartCount(lines);
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="rule-b sticky top-0 z-40 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center gap-8 px-5">
          <Link to="/" className="font-display text-2xl font-bold leading-none tracking-tight">
            Pressworks
            <span className="text-primary">.</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-foreground/75 transition-colors hover:text-primary"
                activeProps={{ className: "text-primary font-medium" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-5 text-sm">
            {loading ? null : user ? (
              <>
                <Link to="/account" className="text-foreground/75 hover:text-primary">
                  Account
                </Link>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="text-foreground/55 hover:text-rust"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-foreground/75 hover:text-primary">
                  Sign in
                </Link>
                <Link to="/signup" className="hidden text-foreground/75 hover:text-primary sm:block">
                  Create account
                </Link>
              </>
            )}
            <Link
              to="/cart"
              className="flex items-center gap-2 border border-foreground/25 px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
            >
              <ShoppingBag className="size-4" strokeWidth={1.6} />
              <span>{count}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="rule-t mt-24 bg-card">
        <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-5 py-14 sm:grid-cols-3">
          <div>
            <p className="font-display text-xl font-bold">Pressworks</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              A small print shop. Water-based inks, blanks we'd wear ourselves, and your artwork on
              the front.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-medium">Shop</p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li>
                <Link to="/shop" className="hover:text-primary">
                  All blanks
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-primary">
                  Saved designs
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-medium">Printed to order</p>
            <p className="mt-3 text-muted-foreground">
              Every garment is pressed after you order it. Nothing sits in a warehouse.
            </p>
          </div>
        </div>
        <div className="rule-t">
          <div className="mx-auto w-full max-w-[1240px] px-5 py-5 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Pressworks — {pathname}
          </div>
        </div>
      </footer>
    </div>
  );
}
