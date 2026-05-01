import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { sendAdminEmail } from "@/lib/adminEmail";
import {
  Loader2,
  Search,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  History,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

type AppRole = "admin" | "moderator" | "user";

type Row = {
  user_id: string;
  email: string | null;
  name: string | null;
  roles: AppRole[];
};

type AuditRow = {
  id: string;
  created_at: string;
  action: "granted" | "revoked";
  role: AppRole;
  actor_user_id: string;
  actor_email: string | null;
  actor_name: string | null;
  target_user_id: string;
  target_email: string | null;
  target_name: string | null;
};

const ROLE_META: Record<
  AppRole,
  { label: string; icon: typeof ShieldCheck; variant: "default" | "secondary" | "outline" }
> = {
  admin: { label: "Admin", icon: ShieldCheck, variant: "default" },
  moderator: { label: "Moderator", icon: ShieldAlert, variant: "secondary" },
  user: { label: "User", icon: UserIcon, variant: "outline" },
};

type PendingAction = {
  userId: string;
  userLabel: string;
  role: "admin" | "moderator";
  hasRole: boolean;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function AdminRoles() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

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

  const fetchAudit = async () => {
    setAuditLoading(true);
    const { data, error } = await supabase.rpc("admin_list_audit_log", { _limit: 100 });
    setAuditLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAudit((data as AuditRow[]) ?? []);
  };

  useEffect(() => {
    fetchRows();
    fetchAudit();
  }, []);

  const performToggle = async (p: PendingAction) => {
    const key = `${p.userId}:${p.role}`;
    setBusyKey(key);
    const target = rows.find((r) => r.user_id === p.userId);
    const fn = p.hasRole ? "admin_revoke_role" : "admin_grant_role";
    const { error } = await supabase.rpc(fn, { _user_id: p.userId, _role: p.role });
    setBusyKey(null);
    setPending(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(p.hasRole ? `Revoked ${p.role}` : `Granted ${p.role}`);
    setRows((prev) =>
      prev.map((r) => {
        if (r.user_id !== p.userId) return r;
        const next = p.hasRole
          ? r.roles.filter((x) => x !== p.role)
          : (Array.from(new Set([...r.roles, p.role])) as AppRole[]);
        return { ...r, roles: next };
      })
    );
    fetchAudit();

    // Notify the user of the role change
    if (target?.email) {
      try {
        await sendAdminEmail({
          template: p.hasRole ? "role_revoked" : "role_granted",
          to: target.email,
          data: { name: target.name ?? undefined, role: p.role },
        });
      } catch {
        toast.error("Role updated, but notification email failed");
      }
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
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
            const label = r.name || r.email || "(unknown)";
            return (
              <div
                key={r.user_id}
                className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{r.name || "(no name)"}</span>
                    {isSelf && (
                      <Badge variant="outline" className="text-[10px]">
                        You
                      </Badge>
                    )}
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
                    onClick={() =>
                      setPending({
                        userId: r.user_id,
                        userLabel: label,
                        role: "admin",
                        hasRole: isAdmin,
                      })
                    }
                  >
                    {busyKey === `${r.user_id}:admin` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isAdmin ? (
                      "Remove Admin"
                    ) : (
                      "Make Admin"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant={isMod ? "outline" : "secondary"}
                    disabled={busyKey === `${r.user_id}:moderator`}
                    onClick={() =>
                      setPending({
                        userId: r.user_id,
                        userLabel: label,
                        role: "moderator",
                        hasRole: isMod,
                      })
                    }
                  >
                    {busyKey === `${r.user_id}:moderator` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isMod ? (
                      "Remove Moderator"
                    ) : (
                      "Make Moderator"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Audit log */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Audit Log</h2>
            </div>
            <Button size="sm" variant="ghost" onClick={fetchAudit} disabled={auditLoading}>
              {auditLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
          <div className="border rounded-lg divide-y">
            {audit.length === 0 && !auditLoading && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No role changes recorded yet.
              </div>
            )}
            {audit.map((a) => {
              const granted = a.action === "granted";
              const Icon = granted ? ArrowUpRight : ArrowDownRight;
              const meta = ROLE_META[a.role];
              return (
                <div key={a.id} className="p-3 flex items-start gap-3 text-sm">
                  <div
                    className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                      granted ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium truncate">
                        {a.actor_name || a.actor_email || "Unknown admin"}
                      </span>
                      <span className="text-muted-foreground">
                        {granted ? "granted" : "revoked"}
                      </span>
                      <Badge variant={meta.variant} className="text-[10px]">
                        {meta.label}
                      </Badge>
                      <span className="text-muted-foreground">
                        {granted ? "to" : "from"}
                      </span>
                      <span className="font-medium truncate">
                        {a.target_name || a.target_email || "unknown user"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {timeAgo(a.created_at)} · {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.hasRole ? "Revoke" : "Grant"} {pending?.role} role?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.hasRole ? (
                <>
                  This will remove the <strong>{pending?.role}</strong> role from{" "}
                  <strong>{pending?.userLabel}</strong>. They will lose access to{" "}
                  {pending?.role === "admin"
                    ? "the admin console and all admin actions"
                    : "moderator privileges"}{" "}
                  immediately.
                </>
              ) : (
                <>
                  This will grant the <strong>{pending?.role}</strong> role to{" "}
                  <strong>{pending?.userLabel}</strong>.{" "}
                  {pending?.role === "admin"
                    ? "Admins can manage plans, roles, and view the audit log."
                    : "Moderators get elevated privileges across the app."}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => pending && performToggle(pending)}>
              {pending?.hasRole ? "Revoke" : "Grant"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
