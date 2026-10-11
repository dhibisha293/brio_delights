import { useState, useRef, useEffect } from "react";
import { X, Send, Bot } from "lucide-react";
import { askAI } from "../api";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "ai", content: "Hi! I'm Brio AI. How can I help you with your bakery today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await askAI(userMessage.content);
      const aiMessage: Message = { id: (Date.now() + 1).toString(), role: "ai", content: response.response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: "ai", content: `Error: ${error.message}` };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fab ${isOpen ? "hidden" : ""}`}
        aria-label="Ask the assistant"
        type="button"
      >
        <svg className="icon">
          <use href="#i-chat" />
        </svg>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[500px] max-h-[80vh] w-[350px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-lav-200/50 sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between bg-lav-600 p-4 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-5 w-5" />
              </div>
              <h3 className="font-semibold tracking-wide">Brio AI Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-lav-100 hover:bg-lav-500 hover:text-white focus:outline-none"
              aria-label="Close Chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-lav-50/30 p-4">
            <div className="flex flex-col gap-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`relative max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      msg.role === "user"
                        ? "bg-lav-600 text-white rounded-br-none"
                        : "bg-white text-lav-900 border border-lav-100 rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="relative max-w-[85%] rounded-2xl rounded-bl-none border border-lav-100 bg-white px-4 py-3 text-sm text-lav-500 shadow-sm">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-lav-400 [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-lav-400 [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-lav-400"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="border-t border-lav-100 bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Brio AI..."
                className="flex-1 rounded-xl border border-lav-200 bg-lav-50/50 px-4 py-2.5 text-sm text-lav-900 outline-none transition-colors placeholder:text-lav-400 focus:border-lav-400 focus:bg-white focus:ring-1 focus:ring-lav-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lav-600 text-white shadow-sm transition-colors hover:bg-lav-700 focus:outline-none disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
