"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

export function EmailSendForm({
  endpoint,
  body,
  labels,
}: {
  endpoint: string;
  body: Record<string, unknown>;
  labels: {
    email: string;
    send: string;
    sending: string;
    placeholder: string;
    sent: string;
    failed: string;
  };
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, ...body }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus("error");
        setMessage(body?.error ?? labels.failed);
        return;
      }

      setStatus("sent");
      setMessage(labels.sent);
    } catch {
      setStatus("error");
      setMessage(labels.failed);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="no-print flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`email-${endpoint}`}>
        {labels.email}
      </label>
      <input
        id={`email-${endpoint}`}
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={labels.placeholder}
        className="input num w-[240px]"
        dir="ltr"
        required
      />
      <button type="submit" className="btn btn-secondary" disabled={status === "sending"}>
        <Mail size={15} strokeWidth={1.7} aria-hidden="true" />
        {status === "sending" ? labels.sending : labels.send}
      </button>
      {message ? (
        <span
          className={status === "sent" ? "text-[13px] text-accent-ink" : "text-[13px] text-negative"}
          role="status"
        >
          {message}
        </span>
      ) : null}
    </form>
  );
}
