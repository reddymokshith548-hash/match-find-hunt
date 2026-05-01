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
import { toast } from "sonner";
import { Loader2, Mail, MousePointerClick, Eye, TrendingUp, MessageSquare, Sparkles } from "lucide-react";
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

function NotificationTemplatesPreview() {
  const [kind, setKind] = useState<"new_match" | "new_message">("new_match");
  const [recipientName, setRecipientName] = useState("Alex");
  const [otherName, setOtherName] = useState("Jordan Lee");
  const [senderName, setSenderName] = useState("Jordan Lee");
  const [snippet, setSnippet] = useState("Hey! Loved your bio — mind sharing more about your traction so far?");
  const [score, setScore] = useState(87);

  const [html, setHtml] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);

  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);

  const renderPreview = async () => {
    setLoading(true);
    setHtml("");
    const sample =
      kind === "new_match"
        ? { recipient_name: recipientName, other_name: otherName, score }
        : { recipient_name: recipientName, sender_name: senderName, snippet };
    const { data, error } = await supabase.functions.invoke("send-notification-email", {
      body: { kind, mode: "preview", recipient_user_id: null, payload: {}, sample },
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

  const sendTest = async () => {
    const email = testEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid test email");
      return;
    }
    setSending(true);
    const sample =
      kind === "new_match"
        ? { recipient_name: recipientName, other_name: otherName, score }
        : { recipient_name: recipientName, sender_name: senderName, snippet };
    const { data, error } = await supabase.functions.invoke("send-notification-email", {
      body: { kind, mode: "test", test_email: email, recipient_user_id: null, payload: {}, sample },
    });
    setSending(false);
    if (error || !data?.ok) {
      toast.error("Test send failed — check edge function logs");
      return;
    }
    toast.success(`Test email sent to ${email}`);
  };

  useEffect(() => {
    void renderPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-4">
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
                onClick={() => setKind("new_match")}
                className="gap-1"
              >
                <Sparkles className="h-3.5 w-3.5" /> Match
              </Button>
              <Button
                size="sm"
                variant={kind === "new_message" ? "default" : "outline"}
                onClick={() => setKind("new_message")}
                className="gap-1"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Message
              </Button>
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
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Send test email
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Uses the current sender configured in Email Settings.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-base flex items-center justify-between gap-2">
            <span className="truncate">{subject || "Preview"}</span>
            <Badge variant="outline">{kind}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 bg-muted/30">
          {loading ? (
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