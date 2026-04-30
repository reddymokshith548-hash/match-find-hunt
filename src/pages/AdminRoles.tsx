import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Search, ShieldCheck, ShieldAlert, User as UserIcon } from "lucide-react";

type AppRole = "admin" | "moderator" | "user";

type Row = {
  user_id: string;
  email: string | null;
  name: string | null;
  roles: AppRole[];
};

const ROLE_META: Record<AppRole, { label: string; icon: typeof ShieldCheck; variant: "default" | "secondary" | "outline" }> = {
  admin: { label: "Admin", icon: ShieldCheck, variant: "default" },
  moderator: { label: "Moderator", icon: ShieldAlert, variant: "secondary" },
  user: { label: "User", icon: UserIcon, variant: "outline" },
};

export default function AdminRoles() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const fetchRows = async (q?: string) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_user_roles", {
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

  const toggleRole = async (userId: string, role: AppRole, hasRole: boolean) => {
    const key = `${userId}:${role}`;
    setBusyKey(key);
    const fn = hasRole ? "admin_revoke_role" : "admin_grant_role";
    const { error } = await supabase.rpc(fn, { _user_id: userId, _role: role });
    setBusyKey(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(hasRole ? `Revoked ${role}` : `Granted ${role}`);
    setRows((prev) =>
      prev.map((r) => {
        if (r.user_id !== userId) return r;
        const next = hasRole
          ? r.roles.filter((x) => x !== role)
          : Array.from(new Set([...r.roles, role]));
        return { ...r, roles: next };
      })
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Role Management</h1>
          <p className="text-sm text-muted-foreground">
            Promote or demote admins and moderators. Removing the last admin is blocked.
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
            <div className="p-6 text-center text-sm text-muted-foreground">No users found.</div>
          )}
          {rows.map((r) => {
            const isAdmin = r.roles.includes("admin");
            const isMod = r.roles.includes("moderator");
            const isSelf = user?.id === r.user_id;
            return (
              <div key={r.user_id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{r.name || "(no name)"}</span>
                    {isSelf && <Badge variant="outline" className="text-[10px]">You</Badge>}
                    {r.roles.length === 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        <UserIcon className="h-3 w-3 mr-1" />
                        User
                      </Badge>
                    )}
                    {r.roles.map((role) => {
                      const meta = ROLE_META[role];
                      const Icon = meta.icon;
                      return (
                        <Badge key={role} variant={meta.variant} className="text-[10px]">
                          <Icon className="h-3 w-3 mr-1" />
                          {meta.label}
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={isAdmin ? "outline" : "default"}
                    disabled={busyKey === `${r.user_id}:admin`}
                    onClick={() => toggleRole(r.user_id, "admin", isAdmin)}
                  >
                    {busyKey === `${r.user_id}:admin` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isAdmin ? "Remove Admin" : "Make Admin"}
                  </Button>
                  <Button
                    size="sm"
                    variant={isMod ? "outline" : "secondary"}
                    disabled={busyKey === `${r.user_id}:moderator`}
                    onClick={() => toggleRole(r.user_id, "moderator", isMod)}
                  >
                    {busyKey === `${r.user_id}:moderator` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isMod ? "Remove Moderator" : "Make Moderator"}
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
