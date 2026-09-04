import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [
    { title: "Create account — Pressworks" },
    { name: "description", content: "Create a Pressworks account for private artwork and order tracking." },
    { property: "og:title", content: "Create account — Pressworks" },
    { property: "og:description", content: "Save your artwork and track custom garment orders." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: Signup,
});
function Signup() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);const {error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+"/account"}});setBusy(false);if(error)return toast.error(error.message);toast.success("Check your email to finish creating your account");}
  return <SiteLayout><section className="mx-auto max-w-md px-5 py-20"><h1 className="text-4xl font-semibold">Create account</h1><p className="mt-3 text-sm text-muted-foreground">Keep your artwork private and return to unfinished designs.</p><form onSubmit={submit} className="mt-8 space-y-4"><label className="block text-sm">Email<Input className="mt-2" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)}/></label><label className="block text-sm">Password<Input className="mt-2" type="password" minLength={8} required value={password} onChange={(e)=>setPassword(e.target.value)}/></label><Button className="w-full" disabled={busy}>{busy?"Creating account…":"Create account"}</Button></form><p className="mt-6 text-sm text-muted-foreground">Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></p></section></SiteLayout>;
}