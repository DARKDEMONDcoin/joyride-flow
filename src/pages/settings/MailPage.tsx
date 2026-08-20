/** @doc Mail — Megsy inbox + mail settings (addresses, approved senders). */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, MailPlus, MoreHorizontal } from "lucide-react";
import { goBackOr } from "@/lib/navigation";
import { supabase } from "@/integrations/supabase/client";

const KEY = "megsy.mail.v1";

interface MailState {
  workEmails: string[];
  senders: string[];
}

const load = (): MailState => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { workEmails: raw.workEmails ?? [], senders: raw.senders ?? [] };
  } catch {
    return { workEmails: [], senders: [] };
  }
};
const persist = (s: MailState) => localStorage.setItem(KEY, JSON.stringify(s));

export default function MailPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"inbox" | "settings">("inbox");
  const [state, setState] = useState<MailState>({ workEmails: [], senders: [] });
  const [dialog, setDialog] = useState<null | "sender" | "work">(null);
  const [draft, setDraft] = useState("");
  const [account, setAccount] = useState("");

  useEffect(() => {
    setState(load());
    supabase.auth.getUser().then(({ data }) => setAccount(data.user?.email ?? ""));
  }, []);

  const megsyAddress = useMemo(() => {
    const handle = (account.split("@")[0] || "user").replace(/[^a-z0-9._-]/gi, "").toLowerCase();
    return `${handle}@megsy.bot`;
  }, [account]);
  const agentAddress = useMemo(() => megsyAddress.replace("@", "-agent@"), [megsyAddress]);

  const save = (next: MailState) => {
    setState(next);
    persist(next);
  };

  const confirmDialog = () => {
    const v = draft.trim();
    if (!v) return;
    if (dialog === "sender") save({ ...state, senders: [...state.senders, v] });
    if (dialog === "work") save({ ...state, workEmails: [...state.workEmails, v] });
    setDraft("");
    setDialog(null);
  };

  const removeSender = (v: string) => save({ ...state, senders: state.senders.filter((s) => s !== v) });
  const removeWork = (v: string) => save({ ...state, workEmails: state.workEmails.filter((s) => s !== v) });

  return (
    <div className="ml-root" dir="ltr">
      <style>{mlCss}</style>
      <div className="ml-screen">
        <header className="ml-top">
          <button type="button" className="ml-iconbtn" aria-label="Back" onClick={() => goBackOr(navigate, "/settings")}>
            <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          </button>
          <h1 className="ml-title">Mail Megsy</h1>
          <span className="ml-iconbtn ml-ghost">
            <ChevronRight className="w-5 h-5" strokeWidth={2} />
          </span>
        </header>

        <section className="ml-hero ml-rise">
          <span className="ml-hero-icon">
            <MailPlus className="w-5 h-5" strokeWidth={1.8} />
          </span>
          <h2 className="ml-hero-title">Mail Megsy</h2>
          <p className="ml-hero-desc">
            Send an email to create a task. CC others to collaborate on the result.
          </p>
          <a className="ml-link" href="https://help.megsyai.com" target="_blank" rel="noreferrer">
            Learn more
          </a>
        </section>

        <div className="ml-tabs" role="tablist">
          {(["inbox", "settings"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              className={`ml-tab ${tab === k ? "is-active" : ""}`}
              onClick={() => setTab(k)}
            >
              {k === "inbox" ? "Inbox" : "Settings"}
            </button>
          ))}
        </div>

        <main className="ml-body">
          {tab === "inbox" ? (
            <div className="ml-empty ml-rise">
              <MailPlus className="ml-empty-icon" strokeWidth={1.3} />
              <p className="ml-empty-text">No emails yet</p>
            </div>
          ) : (
            <div className="ml-rise">
              <p className="ml-label">Megsy email</p>
              <div className="ml-card">
                <div className="ml-row">
                  <span className="ml-row-text">{megsyAddress}</span>
                  <MoreHorizontal className="ml-row-more" />
                </div>
              </div>
              <p className="ml-hint">Only messages from these addresses can create tasks.</p>

              <p className="ml-label">Work email</p>
              <div className="ml-card">
                <div className="ml-row">
                  <span className="ml-row-text">{agentAddress}</span>
                  <MoreHorizontal className="ml-row-more" />
                </div>
                {state.workEmails.map((e) => (
                  <div key={e} className="ml-row">
                    <span className="ml-row-text">{e}</span>
                    <button type="button" className="ml-remove" onClick={() => removeWork(e)}>
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" className="ml-row ml-action" onClick={() => setDialog("work")}>
                  Add work email
                </button>
              </div>
              <p className="ml-hint">
                Dedicate email addresses and instructions to handle different tasks.
              </p>

              <p className="ml-label">Approved senders</p>
              <div className="ml-card">
                {state.senders.map((e) => (
                  <div key={e} className="ml-row">
                    <span className="ml-row-text">{e}</span>
                    <button type="button" className="ml-remove" onClick={() => removeSender(e)}>
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" className="ml-row ml-action" onClick={() => setDialog("sender")}>
                  Add approved sender
                </button>
              </div>
              <p className="ml-hint">Only mail sent from these addresses can create tasks.</p>
            </div>
          )}
        </main>
      </div>

      {dialog && (
        <div className="ml-overlay" role="dialog" aria-modal="true">
          <div className="ml-dialog">
            <h3 className="ml-dialog-title">
              {dialog === "sender" ? "Add approved sender" : "Add work email"}
            </h3>
            <p className="ml-dialog-desc">
              {dialog === "sender"
                ? "Only messages from these addresses can create tasks."
                : "Use a dedicated address for a specific kind of task."}
            </p>
            <input
              className="ml-input"
              type="email"
              autoFocus
              placeholder="name@example.com"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="ml-dialog-actions">
              <button
                type="button"
                className="ml-btn"
                onClick={() => {
                  setDialog(null);
                  setDraft("");
                }}
              >
                Cancel
              </button>
              <button type="button" className="ml-btn ml-btn-primary" onClick={confirmDialog} disabled={!draft.trim()}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const mlCss = `
.ml-root {
  min-height: 100dvh; background: var(--mn-bg); color: var(--mn-fg);
  display: flex; justify-content: center;
  font-family: -apple-system, "SF Pro Display", Inter, "Segoe UI", Roboto, sans-serif;
}
.ml-screen { width: 100%; max-width: 420px; padding-bottom: 32px; }
.ml-top {
  position: sticky; top: 0; z-index: 5; background: var(--mn-bg);
  display: flex; align-items: center; justify-content: space-between;
  padding: calc(env(safe-area-inset-top, 0px) + 8px) 8px 8px;
}
.ml-iconbtn {
  width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: 0; color: var(--mn-fg); cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.ml-ghost { color: var(--mn-faint); pointer-events: none; }
.ml-title { font-size: 15px; font-weight: 600; margin: 0; }
.ml-hero {
  margin: 6px 12px 12px; background: var(--mn-card); border-radius: 16px; padding: 16px;
  display: flex; flex-direction: column; gap: 6px;
}
.ml-hero-icon {
  width: 42px; height: 42px; border-radius: 12px; background: var(--mn-seg-active);
  display: inline-flex; align-items: center; justify-content: center; color: var(--mn-fg-strong); margin-bottom: 6px;
}
.ml-hero-title { margin: 0; font-size: 16px; font-weight: 600; }
.ml-hero-desc { margin: 0; font-size: 12.5px; line-height: 1.5; color: var(--mn-muted); }
.ml-link { font-size: 12.5px; color: #3b82f6; text-decoration: none; }
.ml-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; margin: 4px 12px 10px; background: var(--mn-seg); border-radius: 10px; padding: 3px; }
.ml-tab { border: 0; background: transparent; color: var(--mn-muted); font-size: 12.5px; font-weight: 500; padding: 7px 0; border-radius: 8px; cursor: pointer; }
.ml-tab.is-active { background: var(--mn-seg-active); color: var(--mn-seg-active-fg); }
.ml-body { padding: 2px 12px 24px; }
.ml-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 22vh 0 0; }
.ml-empty-icon { width: 36px; height: 36px; color: var(--mn-faint); }
.ml-empty-text { margin: 0; color: var(--mn-muted); font-size: 12.5px; }
.ml-label { margin: 16px 4px 7px; font-size: 11.5px; color: var(--mn-muted); }
.ml-card { background: var(--mn-card); border-radius: 14px; padding: 0 12px; }
.ml-row {
  width: 100%; display: flex; align-items: center; gap: 10px; padding: 12px 0;
  border: 0; border-bottom: 1px solid var(--mn-sep); background: transparent; color: inherit;
  font-size: 13.5px; text-align: left; font-family: inherit;
}
.ml-card > .ml-row:last-child { border-bottom: 0; }
.ml-row-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ml-row-more { width: 16px; height: 16px; color: var(--mn-faint); }
.ml-action { color: #3b82f6; cursor: pointer; justify-content: flex-start; }
.ml-remove { background: transparent; border: 0; color: var(--mn-muted); font-size: 12px; cursor: pointer; }
.ml-hint { margin: 6px 4px 0; font-size: 11px; color: var(--mn-faint); line-height: 1.5; }

.ml-overlay { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; padding: 20px; }
.ml-dialog {
  width: 100%; max-width: 340px; background: var(--mn-card); border-radius: 18px; padding: 18px 16px 14px;
  animation: ml-pop .2s cubic-bezier(.22,.61,.36,1) both;
}
.ml-dialog-title { margin: 0 0 6px; font-size: 15px; font-weight: 600; }
.ml-dialog-desc { margin: 0 0 12px; font-size: 12.5px; color: var(--mn-muted); line-height: 1.5; }
.ml-input {
  width: 100%; background: var(--mn-seg-active); border: 0; border-radius: 12px; color: var(--mn-fg);
  font-size: 13.5px; padding: 12px; outline: none; font-family: inherit;
}
.ml-input::placeholder { color: var(--mn-faint); }
.ml-dialog-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
.ml-btn {
  height: 42px; border: 0; border-radius: 12px; background: var(--mn-seg-active); color: var(--mn-fg);
  font-size: 13.5px; font-weight: 500; cursor: pointer; font-family: inherit;
}
.ml-btn-primary { background: var(--mn-cta-bg); color: var(--mn-cta-fg); }
.ml-btn:disabled { opacity: .5; cursor: default; }
.ml-rise { animation: ml-rise .3s cubic-bezier(.22,.61,.36,1) both; }
@keyframes ml-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes ml-pop { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .ml-rise, .ml-dialog { animation: none; } }
`;
