/** @doc Settings dashboard showing credit spend and cost breakdown. */
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Cpu, TrendingUp } from "lucide-react";
import { SubShell } from "@/components/settings/SubShell";
import { supabase } from "@/integrations/supabase/client";
import { estimateCostUsd, formatCostUsd } from "@/lib/modelCosts";

interface Row {
  created_at: string;
  metadata: any;
}

interface Agg {
  totalTokens: number;
  totalCost: number;
  messages: number;
  byModel: Record<string, { tokens: number; cost: number; count: number }>;
}

function aggregate(rows: Row[]): Agg {
  const agg: Agg = { totalTokens: 0, totalCost: 0, messages: 0, byModel: {} };
  for (const r of rows) {
    const m = r.metadata || {};
    const usage = m.usage;
    const model: string = m.modelActual || m.modelLabel || "unknown";
    if (!usage) continue;
    const tokens = Number(usage.total_tokens || (Number(usage.prompt_tokens || 0) + Number(usage.completion_tokens || 0)));
    const cost = estimateCostUsd(model, usage) || 0;
    agg.totalTokens += tokens;
    agg.totalCost += cost;
    agg.messages += 1;
    if (!agg.byModel[model]) agg.byModel[model] = { tokens: 0, cost: 0, count: 0 };
    agg.byModel[model].tokens += tokens;
    agg.byModel[model].cost += cost;
    agg.byModel[model].count += 1;
  }
  return agg;
}

/**
 * Cost Dashboard — aggregates usage/cost from assistant messages metadata
 * over multiple time windows. Trust & Transparency Pro, Phase 1.
 */
export default function CostDashboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const uid = userRes?.user?.id;
        if (!uid) { setLoading(false); return; }
        const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
        const { data } = await supabase
          .from("messages")
          .select("created_at, metadata")
          .eq("user_id", uid)
          .eq("role", "assistant")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(2000);
        if (cancelled) return;
        setRows((data as any) || []);
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const windows = useMemo(() => {
    const now = Date.now();
    const inWindow = (days: number) => rows.filter((r) => new Date(r.created_at).getTime() >= now - days * 86_400_000);
    return {
      today: aggregate(inWindow(1)),
      week: aggregate(inWindow(7)),
      month: aggregate(inWindow(30)),
    };
  }, [rows]);

  const models = useMemo(() =>
    Object.entries(windows.month.byModel).sort((a, b) => b[1].cost - a[1].cost),
    [windows]);

  return (
    <SubShell title="Cost dashboard" subtitle="Estimated cost of your usage over the last 30 days. Approximate, not an official bill.">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No usage data yet.</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {(["today","week","month"] as const).map((k) => {
                const w = windows[k];
                const label = k === "today" ? "Today" : k === "week" ? "7 days" : "30 days";
                return (
                  <div key={k} className="rounded-xl border border-border bg-card p-4">
                    <div className="text-xs text-muted-foreground mb-1">{label}</div>
                    <div className="text-lg font-semibold">{formatCostUsd(w.totalCost) || "$0"}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> {w.totalTokens.toLocaleString()} tok · {w.messages} replies
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Cost by model (30 days)</h2>
              </div>
              {models.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No recorded usage.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {models.map(([model, m]) => (
                    <li key={model} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate flex items-center gap-1.5">
                          <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {model}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {m.tokens.toLocaleString()} tok · {m.count} replies
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-primary">{formatCostUsd(m.cost) || "$0"}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="mt-4 text-[11px] text-muted-foreground">
              Prices are based on average provider rates and exclude BYOK or account-specific discounts.
            </p>
          </>
        )}
    </SubShell>
  );
}
