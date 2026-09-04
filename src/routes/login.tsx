import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Sign in — Pressworks" },
    { name: "description", content: "Sign in to manage your Pressworks designs and orders." },
    { property: "og:title", content: "Sign in — Pressworks" },
    { property: "og:description", content: "Access your saved designs and orders." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    void navigate({ to: "/account" });
  }
  return <SiteLayout><section className="mx-auto max-w-md px-5 py-20">
    <h1 className="text-4xl font-semibold">Sign in</h1>
    <p className="mt-3 text-sm text-muted-foreground">Your orders and saved artwork are kept with your account.</p>
    <Button variant="outline" className="mt-8 w-full" onClick={() => lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })}>Continue with Google</Button>
    <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm">Email<Input className="mt-2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="block text-sm">Password<Input className="mt-2" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <Button className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
    </form>
    <p className="mt-6 text-sm text-muted-foreground">New here? <Link to="/signup" className="text-primary hover:underline">Create an account</Link></p>
  </section></SiteLayout>;
}