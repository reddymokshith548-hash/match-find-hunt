import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type SecurityEvent = {
  id: string;
  event_type: string;
  severity: "info" | "warning" | "critical";
  user_id: string | null;
  ip_hash: string | null;
  path: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export default function AdminSecurityEvents() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "warning" | "critical">("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_security_events", {
      _limit: 300,
      _severity: filter === "all" ? null : filter,
    });
    if (!error && data) setEvents(data as SecurityEvent[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const counts = {
    total: events.length,
    warning: events.filter((e) => e.severity === "warning").length,
    critical: events.filter((e) => e.severity === "critical").length,
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Security Events</h1>
          </div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total (shown)</div><div className="text-2xl font-semibold">{counts.total}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Warnings</div><div className="text-2xl font-semibold text-amber-600">{counts.warning}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Critical</div><div className="text-2xl font-semibold text-destructive">{counts.critical}</div></CardContent></Card>
        </div>

        <div className="flex gap-2">
          {(["all", "warning", "critical"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Recent events</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : events.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">No events recorded.</div>
            ) : (
              <div className="divide-y">
                {events.map((e) => (
                  <div key={e.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm">{e.event_type}</span>
                        <Badge variant={e.severity === "critical" ? "destructive" : e.severity === "warning" ? "secondary" : "outline"}>
                          {e.severity}
                        </Badge>
                        {e.user_id && <span className="text-xs text-muted-foreground font-mono truncate">{e.user_id.slice(0, 8)}…</span>}
                      </div>
                      {Object.keys(e.details || {}).length > 0 && (
                        <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap break-all">{JSON.stringify(e.details, null, 0)}</pre>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}