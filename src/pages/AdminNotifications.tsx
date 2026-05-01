import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  MousePointerClick,
  Eye,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Save,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

type StatRow = {
  kind: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  open_rate: number | null;
  click_rate: number | null;
  conversion_rate: number | null;
};

type SeriesRow = {
  day: string;
  kind: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
};

const RANGES: { label: string; days: number }[] = [
  { label: "24h", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export default function AdminNotifications() {
  const [tab, setTab] = useState<"analytics" | "templates">("analytics");
  const [rangeDays, setRangeDays] = useState(7);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [series, setSeries] = useState<SeriesRow[]>([]);
  const [loading, setLoading] = useState(true);

  const sinceIso = useMemo(
    () => new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString(),
    [rangeDays],
  );

  const loadStats = async () => {
    setLoading(true);
    const [s1, s2] = await Promise.all([
      supabase.rpc("admin_notification_email_stats", { _kind: null, _since: sinceIso }),
      supabase.rpc("admin_notification_email_timeseries", { _since: sinceIso }),
    ]);
    if (s1.error) toast.error(s1.error.message);
    if (s2.error) toast.error(s2.error.message);
    setStats((s1.data ?? []) as StatRow[]);
    setSeries((s2.data ?? []) as SeriesRow[]);
    setLoading(false);
  };

  useEffect(() => {
    if (tab === "analytics") void loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, sinceIso]);

  // Aggregate totals
  const totals = useMemo(() => {
    const t = { sent: 0, opened: 0, clicked: 0, converted: 0 };
    for (const r of stats) {
      t.sent += r.sent;
      t.opened += r.opened;
      t.clicked += r.clicked;
      t.converted += r.converted;
    }
    const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);
    return {
      ...t,
      open_rate: pct(t.opened, t.sent),
      click_rate: pct(t.clicked, t.sent),
      conv_rate: pct(t.converted, t.sent),
    };
  }, [stats]);

  // Reshape series for chart: one row per day with separate fields per kind
  const chartData = useMemo(() => {
    const map = new Map<string, any>();
    for (const r of series) {
      const day = r.day;
      if (!map.has(day)) map.set(day, { day });
      const obj = map.get(day);
      obj[`${r.kind}_sent`] = r.sent;
      obj[`${r.kind}_opened`] = r.opened;
      obj[`${r.kind}_clicked`] = r.clicked;
      obj[`${r.kind}_converted`] = r.converted;
    }
    return Array.from(map.values()).sort((a, b) => a.day.localeCompare(b.day));
  }, [series]);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Monitor delivery, engagement and conversion of match & message emails — and preview templates.
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4 mt-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1 border rounded-md p-1">
                {RANGES.map((r) => (
                  <Button
                    key={r.days}
                    size="sm"
                    variant={rangeDays === r.days ? "default" : "ghost"}
                    onClick={() => setRangeDays(r.days)}
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
              <Button size="sm" variant="outline" onClick={loadStats}>
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={Mail} label="Sent" value={totals.sent} />
                  <StatCard
                    icon={Eye}
                    label="Opened"
                    value={totals.opened}
                    sub={`${totals.open_rate}% open rate`}
                  />
                  <StatCard
                    icon={MousePointerClick}
                    label="Clicked"
                    value={totals.clicked}
                    sub={`${totals.click_rate}% click rate`}
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="Converted (24h)"
                    value={totals.converted}
                    sub={`${totals.conv_rate}% conversion`}
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Per template</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b">
                          <th className="py-2 font-medium">Template</th>
                          <th className="py-2 font-medium text-right">Sent</th>
                          <th className="py-2 font-medium text-right">Opened</th>
                          <th className="py-2 font-medium text-right">Clicked</th>
                          <th className="py-2 font-medium text-right">Converted (24h)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-muted-foreground">
                              No notification emails in this period.
                            </td>
                          </tr>
                        )}
                        {stats.map((r) => (
                          <tr key={r.kind} className="border-b last:border-0">
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                {r.kind === "new_match" ? (
                                  <Sparkles className="h-4 w-4 text-primary" />
                                ) : (
                                  <MessageSquare className="h-4 w-4 text-primary" />
                                )}
                                <span className="font-medium">
                                  {r.kind === "new_match" ? "New match" : "New message"}
                                </span>
                                <Badge variant="outline" className="text-[10px]">
                                  {r.kind}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-2 text-right">{r.sent}</td>
                            <td className="py-2 text-right">
                              {r.opened}{" "}
                              <span className="text-xs text-muted-foreground">
                                ({r.open_rate ?? 0}%)
                              </span>
                            </td>
                            <td className="py-2 text-right">
                              {r.clicked}{" "}
                              <span className="text-xs text-muted-foreground">
                                ({r.click_rate ?? 0}%)
                              </span>
                            </td>
                            <td className="py-2 text-right">
                              {r.converted}{" "}
                              <span className="text-xs text-muted-foreground">
                                ({r.conversion_rate ?? 0}%)
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Daily trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              background: "hsl(var(--popover))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: 8,
                              fontSize: 12,
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Line type="monotone" dataKey="new_match_sent" name="Match sent" stroke="#6366f1" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="new_match_converted" name="Match converted" stroke="#22c55e" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                          <Line type="monotone" dataKey="new_message_sent" name="Message sent" stroke="#f59e0b" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="new_message_converted" name="Message converted" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Conversion = recipient accepted a connection (match) or sent a chat message (message) within 24h of the email.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <NotificationTemplatesPreview />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

const DEFAULT_MATCH_SUBJECT = "🤝 New co-founder match on Lexach ({{score}}%)";
const DEFAULT_MESSAGE_SUBJECT = "💬 New message from {{sender_name}} on Lexach";

const DEFAULT_MATCH_HTML = `<p>Hi {{recipient_name}},</p>
<p>You just matched with <strong>{{other_name}}</strong> on Lexach with a <strong>{{score}}% compatibility score</strong>.</p>
<p>Open your dashboard to view their profile, see your compatibility breakdown, and start a connection.</p>
<p><a href="{{cta_url}}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;">Open Lexach</a></p>
{{tracking_pixel}}`;

const DEFAULT_MESSAGE_HTML = `<p>Hi {{recipient_name}},</p>
<p><strong>{{sender_name}}</strong> just sent you a message:</p>
<blockquote style="margin:14px 0;padding:12px 16px;border-left:3px solid #6366f1;background:#f8fafc;color:#334155;border-radius:4px;">{{snippet}}</blockquote>
<p>Reply right from your Lexach inbox.</p>
<p><a href="{{cta_url}}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;">Open chat</a></p>
{{tracking_pixel}}`;

function defaultsFor(kind: "new_match" | "new_message") {
  return kind === "new_match"
    ? { subject: DEFAULT_MATCH_SUBJECT, html: DEFAULT_MATCH_HTML }
    : { subject: DEFAULT_MESSAGE_SUBJECT, html: DEFAULT_MESSAGE_HTML };
}

function NotificationTemplatesPreview() {
  const [kind, setKind] = useState<"new_match" | "new_message">("new_match");

  // Sample data
  const [recipientName, setRecipientName] = useState("Alex");
  const [otherName, setOtherName] = useState("Jordan Lee");
  const [senderName, setSenderName] = useState("Jordan Lee");
  const [snippet, setSnippet] = useState("Hey! Loved your bio — mind sharing more about your traction so far?");
  const [score, setScore] = useState(87);

  // Editable template (subject + html)
  const [draftSubject, setDraftSubject] = useState("");
  const [draftHtml, setDraftHtml] = useState("");
  const [savedSubject, setSavedSubject] = useState<string | null>(null);
  const [savedHtml, setSavedHtml] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [savingTpl, setSavingTpl] = useState(false);

  // Preview output
  const [html, setHtml] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);

  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);

  const sample = () =>
    kind === "new_match"
      ? { recipient_name: recipientName, other_name: otherName, score }
      : { recipient_name: recipientName, sender_name: senderName, snippet };

  const buildOverride = () => {
    if (!editing) return undefined;
    if (!draftSubject.trim() || !draftHtml.trim()) return undefined;
    return { subject: draftSubject, html: draftHtml };
  };

  const renderPreview = async () => {
    setLoading(true);
    setHtml("");
    const { data, error } = await supabase.functions.invoke("send-notification-email", {
      body: {
        kind,
        mode: "preview",
        recipient_user_id: null,
        payload: {},
        sample: sample(),
        override: buildOverride(),
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Preview failed — check edge function logs");
      return;
    }
    if (data?.preview) {
      setHtml(data.html);
      setSubject(data.subject);
    }
  };

  const loadTemplate = async (k: "new_match" | "new_message") => {
    const { data } = await supabase
      .from("email_templates")
      .select("subject,html")
      .eq("kind", k)
      .maybeSingle();
    if (data) {
      setSavedSubject(data.subject);
      setSavedHtml(data.html);
      setDraftSubject(data.subject);
      setDraftHtml(data.html);
    } else {
      const d = defaultsFor(k);
      setSavedSubject(null);
      setSavedHtml(null);
      setDraftSubject(d.subject);
      setDraftHtml(d.html);
    }
  };

  const saveTemplate = async () => {
    if (!draftSubject.trim() || !draftHtml.trim()) {
      toast.error("Subject and HTML are required");
      return;
    }
    setSavingTpl(true);
    const { error } = await supabase
      .from("email_templates")
      .upsert({ kind, subject: draftSubject, html: draftHtml }, { onConflict: "kind" });
    setSavingTpl(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSavedSubject(draftSubject);
    setSavedHtml(draftHtml);
    toast.success("Template saved — live for next email");
    void renderPreview();
  };

  const resetToDefault = async () => {
    const d = defaultsFor(kind);
    setDraftSubject(d.subject);
    setDraftHtml(d.html);
    if (savedSubject !== null) {
      const { error } = await supabase.from("email_templates").delete().eq("kind", kind);
      if (error) {
        toast.error(error.message);
        return;
      }
      setSavedSubject(null);
      setSavedHtml(null);
      toast.success("Reverted to default template");
    }
    void renderPreview();
  };

  const sendTest = async () => {
    const email = testEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid test email");
      return;
    }
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-notification-email", {
      body: {
        kind,
        mode: "test",
        test_email: email,
        recipient_user_id: null,
        payload: {},
        sample: sample(),
        override: buildOverride(),
      },
    });
    setSending(false);
    if (error || !data?.ok) {
      toast.error("Test send failed — check edge function logs");
      return;
    }
    toast.success(`Test email sent to ${email}`);
  };

  useEffect(() => {
    void loadTemplate(kind).then(() => renderPreview());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const isCustom = savedSubject !== null;
  const dirty =
    editing &&
    (draftSubject !== (savedSubject ?? defaultsFor(kind).subject) ||
      draftHtml !== (savedHtml ?? defaultsFor(kind).html));

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-4">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={kind === "new_match" ? "default" : "outline"}
                onClick={() => {
                  setEditing(false);
                  setKind("new_match");
                }}
                className="gap-1"
              >
                <Sparkles className="h-3.5 w-3.5" /> Match
              </Button>
              <Button
                size="sm"
                variant={kind === "new_message" ? "default" : "outline"}
                onClick={() => {
                  setEditing(false);
                  setKind("new_message");
                }}
                className="gap-1"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Message
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Status:</span>
              {isCustom ? (
                <Badge variant="default" className="text-[10px]">Custom</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">Default</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sample data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Recipient name</Label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
            </div>

            {kind === "new_match" ? (
              <>
                <div>
                  <Label>Other founder name</Label>
                  <Input value={otherName} onChange={(e) => setOtherName(e.target.value)} />
                </div>
                <div>
                  <Label>Compatibility score: {score}%</Label>
                  <Slider
                    value={[score]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(v) => setScore(v[0])}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label>Sender name</Label>
                  <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                </div>
                <div>
                  <Label>Message snippet</Label>
                  <Input value={snippet} onChange={(e) => setSnippet(e.target.value)} />
                </div>
              </>
            )}

            <Button onClick={renderPreview} disabled={loading} size="sm" className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Re-render preview"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="your@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              type="email"
            />
            <Button onClick={sendTest} disabled={sending || !testEmail.trim()} size="sm" className="w-full gap-1">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send test email
            </Button>
            <p className="text-[11px] text-muted-foreground">
              While editing, the test uses your unsaved draft. Otherwise the saved/default template.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base flex items-center gap-2 truncate">
            <span className="truncate">{subject || "Preview"}</span>
            <Badge variant="outline">{kind}</Badge>
            {dirty && <Badge className="text-[10px]">Unsaved</Badge>}
          </CardTitle>
          <div className="flex gap-2">
            {!editing ? (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1">
                Edit template
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDraftSubject(savedSubject ?? defaultsFor(kind).subject);
                    setDraftHtml(savedHtml ?? defaultsFor(kind).html);
                    setEditing(false);
                    void renderPreview();
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" variant="outline" onClick={resetToDefault} className="gap-1">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
                <Button size="sm" onClick={saveTemplate} disabled={savingTpl} className="gap-1">
                  {savingTpl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-muted/30">
          {editing ? (
            <div className="p-4 space-y-3 bg-background">
              <div>
                <Label>Subject line</Label>
                <Input
                  value={draftSubject}
                  onChange={(e) => setDraftSubject(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>HTML body</Label>
                  <Button size="sm" variant="ghost" onClick={renderPreview} className="text-xs h-7">
                    <Eye className="h-3.5 w-3.5 mr-1" /> Refresh preview
                  </Button>
                </div>
                <Textarea
                  value={draftHtml}
                  onChange={(e) => setDraftHtml(e.target.value)}
                  rows={16}
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground mt-2">
                  Available variables:{" "}
                  <code>{`{{recipient_name}}`}</code>, <code>{`{{other_name}}`}</code>,{" "}
                  <code>{`{{sender_name}}`}</code>, <code>{`{{snippet}}`}</code>,{" "}
                  <code>{`{{score}}`}</code>, <code>{`{{cta_url}}`}</code>,{" "}
                  <code>{`{{app_url}}`}</code>, <code>{`{{tracking_pixel}}`}</code>.
                </p>
              </div>
              <div className="border-t pt-3">
                <div className="text-xs text-muted-foreground mb-2">Live preview</div>
                <iframe
                  title="Draft preview"
                  className="w-full bg-white border rounded-md"
                  style={{ height: 480, border: "1px solid hsl(var(--border))" }}
                  srcDoc={html}
                />
              </div>
            </div>
          ) : loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <iframe
              title="Notification email preview"
              className="w-full bg-white"
              style={{ height: 720, border: 0 }}
              srcDoc={html}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}