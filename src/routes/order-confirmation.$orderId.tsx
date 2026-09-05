import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { orderQuery } from "@/lib/queries";
export const Route=createFileRoute("/order-confirmation/$orderId")({head:()=>({meta:[{title:"Order received — Pressworks"},{name:"description",content:"Your Pressworks order has been received."},{property:"og:title",content:"Order received — Pressworks"},{property:"og:description",content:"Your custom garment order is being prepared."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),component:Confirmation});
function Confirmation(){const {orderId}=Route.useParams();const {data:order}=useQuery(orderQuery(orderId));return <SiteLayout><section className="mx-auto max-w-xl px-5 py-24"><div className="flex size-12 items-center justify-center bg-thread text-thread-foreground"><Check/></div><h1 className="mt-7 text-4xl font-semibold">Order received</h1><p className="mt-4 text-muted-foreground">Order {order?.order_number??"—"}</p><p className="mt-8 text-lg">We'll email you when it ships.</p><Button asChild variant="outline" className="mt-10"><Link to="/account">View your orders</Link></Button></section></SiteLayout>}