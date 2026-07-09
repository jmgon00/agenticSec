"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "bot",
  text: "👋 Hola, soy el asistente de AgenticSec. Preguntame lo que necesites — muy pronto voy a poder responderte con IA de verdad.",
};

const MOCK_REPLY_DELAY_MS = 600;
const MOCK_REPLY_TEXT = "Próximamente vas a poder hablar con nuestro agente de IA acá 🤖";

async function getMockReply(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_REPLY_DELAY_MS));
  return MOCK_REPLY_TEXT;
}

export const ChatInbox = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }]);
    setInput("");
    setSending(true);

    const replyText = await getMockReply();
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "bot", text: replyText }]);
    setSending(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 max-w-2xl w-full mx-auto px-4 pb-4">
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "self-end bg-cyan-500 text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%]"
                : "self-start bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm px-4 py-2 max-w-[80%]"
            }
          >
            {message.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-800 pt-4">
        <div className="flex-1">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribí tu mensaje..."
          />
        </div>
        <Button type="submit" disabled={sending}>
          Enviar
        </Button>
      </form>
    </div>
  );
};
