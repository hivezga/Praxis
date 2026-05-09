"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Modal } from "@/components/shared/Modal";
import { useGame, useParty } from "@/lib/store";

/**
 * Shown to peers when the host signals it's leaving (or after the connection
 * has dropped past reconnect retries). Two paths: take over the game as the
 * new host, or wait — most useful if the host just refreshed and will be back.
 */
export function HostLeavingModal() {
  const router = useRouter();
  const party = useParty();
  const promote = useGame((s) => s.promoteToHost);
  const dismiss = useGame((s) => s.dismissHostLeaving);
  const leave = useGame((s) => s.leaveRoom);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open =
    party.role === "peer" &&
    (party.hostLeavingPending || party.transport === "disconnected");

  if (!open) return null;

  async function takeOver() {
    setBusy(true);
    setError(null);
    try {
      const code = await promote();
      if (code) {
        router.replace("/play/lobby");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't promote — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={dismiss}
      title="Host left the game"
      widthClass="max-w-md"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <button
            type="button"
            className="btn btn-ghost text-xs"
            onClick={() => {
              leave();
              router.replace("/");
            }}
            disabled={busy}
          >
            Leave room
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn"
              onClick={dismiss}
              disabled={busy}
            >
              Wait
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={takeOver}
              disabled={busy}
            >
              {busy ? "Promoting…" : "Take over as host"}
            </button>
          </div>
        </div>
      }
    >
      <p className="font-serif text-sm leading-relaxed text-inkSoft">
        The connection to the host has dropped. You can take over with the last
        state Praxis received from the host — your friends will need to rejoin
        with the new room code.
      </p>
      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-md border border-danger/30 bg-danger/15 px-3 py-2 font-serif text-xs italic text-danger"
        >
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
