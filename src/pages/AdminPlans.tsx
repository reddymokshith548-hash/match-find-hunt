import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Search, Crown, User as UserIcon } from "lucide-react";

type Row = {
  user_id: string;
  email: string | null;
  name: string | null;
  plan: "free" | "pro" | string;
  status: string | null;
  current_period_end: string | null;
};

export default function AdminPlans() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRows = async (q?: string) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_user_plans", {
      _search: q && q.trim() ? q.trim() : null,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data as Row[]) ?? []);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const setPlan = async (userId: string, plan: "free" | "pro") => {
    setUpdatingId(userId);
    const { error } = await supabase.rpc("admin_set_user_plan", {
      _user_id: userId,
      _plan: plan,
    });
    setUpdatingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Plan updated to ${plan.toUpperCase()}`);
    setRows((prev) =>
      prev.map((r) => (r.user_id === userId ? { ...r, plan } : r))
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Beta — Plan Management</h1>
          <p className="text-sm text-muted-foreground">
            Toggle Pro / Free for any account.
          </p>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            fetchRows(search);
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>

        <div className="border rounded-lg divide-y">
          {rows.length === 0 && !loading && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No users found.
            </div>
          )}
          {rows.map((r) => {
            const isPro = r.plan === "pro";
            return (
              <div
                key={r.user_id}
                className="p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {r.name || "(no name)"}
                    </span>
                    <Badge
                      variant={isPro ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {isPro ? (
                        <>
                          <Crown className="h-3 w-3 mr-1" />
                          PRO
                        </>
                      ) : (
                        <>
                          <UserIcon className="h-3 w-3 mr-1" />
                          FREE
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.email}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={isPro ? "outline" : "default"}
                    disabled={updatingId === r.user_id || isPro}
                    onClick={() => setPlan(r.user_id, "pro")}
                  >
                    Make Pro
                  </Button>
                  <Button
                    size="sm"
                    variant={!isPro ? "outline" : "secondary"}
                    disabled={updatingId === r.user_id || !isPro}
                    onClick={() => setPlan(r.user_id, "free")}
                  >
                    Make Free
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}