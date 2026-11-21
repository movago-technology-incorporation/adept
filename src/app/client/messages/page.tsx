"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/portal/Shell";
import { Button, EmptyState, Textarea, cx } from "@/components/ui/kit";
import { useClientWorkspace } from "@/store/app-store";

export default function MessagesPage() {
  const { messages, addMessage } = useClientWorkspace();
  const [body, setBody] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    addMessage(body.trim(), "client");
    setBody("");
  }

  return (
    <>
      <PageHeader eyebrow="Support" title="Messages" description="A private conversation with your Adept team." />
      <div className="flex h-[calc(100vh-15rem)] min-h-[28rem] flex-col rounded-3xl bg-white">
        <div className="flex-1 space-y-3 overflow-y-auto p-5 sm:p-7">
          {messages.length === 0 ? (
            <EmptyState title="Start the conversation" body="Ask about a filing, a receipt or an appointment." />
          ) : (
            messages.map((m) => {
              const mine = m.author === "client";
              return (
                <div key={m.id} className={cx("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cx("max-w-[85%] rounded-3xl px-5 py-3.5 sm:max-w-lg", mine ? "rounded-br-lg bg-navy text-white" : "rounded-bl-lg bg-sand text-ink")}>
                    <p className="leading-relaxed whitespace-pre-line">{m.body}</p>
                    <p className={cx("mt-1.5 text-xs", mine ? "text-white/50" : "text-muted")}>
                      {mine ? "You" : "Adept"} · {m.at}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={end} />
        </div>
        <form onSubmit={onSubmit} className="flex items-end gap-3 bg-paper p-3 sm:p-4 rounded-b-3xl">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            rows={1}
            placeholder="Write a message…"
            className="max-h-40 min-h-12 resize-none bg-white"
            aria-label="Message"
          />
          <Button type="submit" disabled={!body.trim()}>
            Send
          </Button>
        </form>
      </div>
    </>
  );
}
