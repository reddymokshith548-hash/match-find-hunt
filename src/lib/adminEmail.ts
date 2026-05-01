import { supabase } from "@/integrations/supabase/client";

export type AdminEmailTemplate = "pro_upgrade" | "role_granted" | "role_revoked";

export async function sendAdminEmail(args: {
  template: AdminEmailTemplate;
  to: string;
  data?: { name?: string; role?: string };
  preview?: boolean;
}) {
  const { data, error } = await supabase.functions.invoke("send-app-email", {
    body: args,
  });
  if (error) throw error;
  return data as
    | { ok: true; id?: string; skipped?: string }
    | { ok: true; preview: true; subject: string; html: string };
}