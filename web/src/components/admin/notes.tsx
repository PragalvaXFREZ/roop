/*
 * Internal notes on an order or a customer. Customers do not see these notes.
 * The list shows the newest note first.
 */
"use client";

import { useState } from "react";
import { api, type Note } from "@/lib/api";
import { button, input, when } from "./ui";

type Props = {
  notes: Note[];
  /* The API path that adds a note, for example /api/admin/orders/3/notes. */
  path: string;
  onAdd: (note: Note) => void;
};

export function Notes({ notes, path, onAdd }: Props) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onAdd(await api<Note>(path, { method: "POST", body: JSON.stringify({ body }) }));
      setBody("");
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  return (
    <section>
      <h2 className="mb-2 font-semibold">Internal notes</h2>
      <form onSubmit={add} className="mb-3 space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={3}
          placeholder="Write a note for staff"
          className={input}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button disabled={busy || !body.trim()} className={button}>
          Add note
        </button>
      </form>
      {notes.length === 0 ? (
        <p className="text-sm text-muted">No notes yet.</p>
      ) : (
        <ul className="divide-y divide-line rounded border border-line bg-surface text-sm">
          {notes.map((n) => (
            <li key={n.id} className="px-3 py-2">
              <p className="whitespace-pre-wrap">{n.body}</p>
              <p className="mt-1 text-muted">
                {n.admin.name}, {when(n.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
