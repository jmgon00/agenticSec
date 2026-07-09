import { Hero } from "@/components/sections/Hero";
import { ChatInbox } from "@/components/sections/ChatInbox";

export default function Home() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <Hero />
      <ChatInbox />
    </div>
  );
}
