import { ReactNode } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { Loader2, Crown, ShieldCheck, LogOut, Settings, Bell, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { supabase } from "@/integrations/supabase/client";

const tabs = [
  { to: "/admin/plans", label: "Plans", icon: Crown },
  { to: "/admin/roles", label: "Roles", icon: ShieldCheck },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/security", label: "Security", icon: ShieldAlert },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, authLoading, isAdmin } = useAdminGuard();
  const location = useLocation();

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-semibold">Admin Console</span>
          </div>
          <div className="flex items-center gap-1">
            {tabs.map((t) => {
              const active = location.pathname === t.to;
              const Icon = t.icon;
              return (
                <Link key={t.to} to={t.to}>
                  <Button size="sm" variant={active ? "default" : "ghost"} className="gap-1.5">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.label}</span>
                  </Button>
                </Link>
              );
            })}
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/admin/login";
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
