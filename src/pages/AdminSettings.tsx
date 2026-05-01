import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Trash2, Plus, Eye, Mail } from "lucide-react";
import { sendAdminEmail, AdminEmailTemplate } from "@/lib/adminEmail";

type Settings = {
  enabled: boolean;
  from_name: string;
  from_email: string;
  app_url: string;
};

type Recipient = {
  id: string;
  email: string;
  label: string | null;
  kind: "cc" | "bcc";
};

const TEMPLATES: { value: AdminEmailTemplate; label: string }[] = [
  { value: "pro_upgrade", label: "Pro upgrade — Beta launch" },
  { value: "role_granted", label: "Role granted" },
  { value: "role_revoked", label: "Role revoked" },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newKind, setNewKind] = useState<"cc" | "bcc">("cc");

  const [previewTpl, setPreviewTpl] = useState<AdminEmailTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewSubject, setPreviewSubject] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = async () => {
    const [s, r] = await Promise.all([
      supabase.from("email_settings").select("*").eq("id", true).maybeSingle(),
      supabase.from("email_recipients").select("*").order("created_at"),
    ]);
    if (s.data) setSettings(s.data as Settings);
    if (r.data) setRecipients(r.data as Recipient[]);
  };

  useEffect(() => {
    load();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("email_settings")
      .update({
        enabled: settings.enabled,
        from_name: settings.from_name,
        from_email: settings.from_email,
        app_url: settings.app_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", true);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Settings saved");
  };

  const addRecipient = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email");
      return;
    }
    const { data, error } = await supabase
      .from("email_recipients")
      .insert({ email, kind: newKind })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setRecipients((p) => [...p, data as Recipient]);
    setNewEmail("");
    toast.success("Recipient added");
  };

  const removeRecipient = async (id: string) => {
    const { error } = await supabase.from("email_recipients").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRecipients((p) => p.filter((r) => r.id !== id));
  };

  const openPreview = async (tpl: AdminEmailTemplate) => {
    setPreviewTpl(tpl);
    setPreviewLoading(true);
    setPreviewHtml("");
    try {
      const res = await sendAdminEmail({
        template: tpl,
        to: "preview@example.com",
        data: { name: "Alex", role: "moderator" },
        preview: true,
      });
      if ("preview" in res && res.preview) {
        setPreviewHtml(res.html);
        setPreviewSubject(res.subject);
      }
    } catch (e) {
      toast.error("Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  if (!settings) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Email Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage notification recipients, sender details, and preview templates.
          </p>
        </div>

        {/* Sending toggle + sender */}
        <section className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email sending
              </div>
              <p className="text-xs text-muted-foreground">
                When off, no plan/role notifications are sent.
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>From name</Label>
              <Input
                value={settings.from_name}
                onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
              />
            </div>
            <div>
              <Label>From email</Label>
              <Input
                value={settings.from_email}
                onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Use <code>onboarding@resend.dev</code> for testing. To send from your own
                domain, verify it in Resend (SPF + DKIM) — vercel.app subdomains can't be verified.
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label>App URL (used in email links)</Label>
              <Input
                value={settings.app_url}
                onChange={(e) => setSettings({ ...settings, app_url: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save settings"}
            </Button>
          </div>
        </section>

        {/* Recipients */}
        <section className="border rounded-lg p-4 space-y-3">
          <div>
            <div className="font-semibold">Notification recipients</div>
            <p className="text-xs text-muted-foreground">
              These addresses receive a copy of every plan/role notification.
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="email@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <select
              className="border rounded-md px-2 text-sm bg-background"
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as "cc" | "bcc")}
            >
              <option value="cc">CC</option>
              <option value="bcc">BCC</option>
            </select>
            <Button onClick={addRecipient} size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>

          <div className="divide-y border rounded-md">
            {recipients.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No recipients added.
              </div>
            )}
            {recipients.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="uppercase text-[10px]">
                    {r.kind}
                  </Badge>
                  <span className="text-sm truncate">{r.email}</span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeRecipient(r.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Templates preview */}
        <section className="border rounded-lg p-4 space-y-3">
          <div>
            <div className="font-semibold">Email templates</div>
            <p className="text-xs text-muted-foreground">
              Preview the rendered HTML for each notification.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-2">
            {TEMPLATES.map((t) => (
              <Button
                key={t.value}
                variant="outline"
                className="justify-start gap-2 h-auto py-3"
                onClick={() => openPreview(t.value)}
              >
                <Eye className="h-4 w-4 shrink-0" />
                <span className="text-left text-sm">{t.label}</span>
              </Button>
            ))}
          </div>
        </section>
      </div>

      <Dialog open={!!previewTpl} onOpenChange={(o) => !o && setPreviewTpl(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewSubject || "Preview"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-md bg-muted/30">
            {previewLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <iframe
                title="Email preview"
                className="w-full min-h-[500px] bg-white"
                srcDoc={previewHtml}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}