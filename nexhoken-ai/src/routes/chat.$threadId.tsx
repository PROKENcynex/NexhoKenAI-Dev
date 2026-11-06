import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { KenApp } from "@/components/ken/KenApp";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Chat with Ken" },
      { name: "description", content: "Your conversation with Ken, the AI assistant that listens and speaks." },
      { property: "og:title", content: "Chat with Ken" },
      { property: "og:description", content: "Your conversation with Ken, the AI assistant that listens and speaks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = Route.useParams();
  return (
    <ClientOnly fallback={<div className="min-h-screen bg-background" />}>
      <KenApp threadId={threadId} />
    </ClientOnly>
  );
}
