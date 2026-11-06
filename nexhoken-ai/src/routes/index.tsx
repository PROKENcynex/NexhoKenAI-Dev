import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import kenFace from "@/assets/ken-logo.png";
import { ensureThread } from "@/lib/threads";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEXHOKEN AI — chat and talk with Ken" },
      { name: "description", content: "Ken is a customizable AI assistant you can type or talk to — and it talks back." },
      { property: "og:title", content: "NEXHOKEN AI — chat and talk with Ken" },
      { property: "og:description", content: "Ken is a customizable AI assistant you can type or talk to — and it talks back." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = ensureThread();
    navigate({ to: "/chat/$threadId", params: { threadId: t.id }, replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <img src={kenFace} alt="Ken" width={96} height={96} className="size-24 animate-pulse" />
    </div>
  );
}
