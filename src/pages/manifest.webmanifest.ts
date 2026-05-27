import type { APIRoute } from "astro";
import { webManifest } from "@/data/site-meta";

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(webManifest), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
