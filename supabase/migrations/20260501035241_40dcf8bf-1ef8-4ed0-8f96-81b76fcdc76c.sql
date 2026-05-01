-- 1) Email events table for self-hosted open/click tracking
CREATE TABLE IF NOT EXISTS public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  user_id uuid,
  kind text NOT NULL,                -- notification kind: 'new_match' | 'new_message'
  event_type text NOT NULL,          -- 'open' | 'click'
  ref_id uuid,                       -- match_id or connection_id
  url text,                          -- destination url for click events
  user_agent text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_events_message_id ON public.email_events(message_id);
CREATE INDEX IF NOT EXISTS idx_email_events_user_kind_created ON public.email_events(user_id, kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON public.email_events(event_type);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email events"
  ON public.email_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Add message_id column to email_send_log to correlate sends with events
ALTER TABLE public.email_send_log
  ADD COLUMN IF NOT EXISTS message_id uuid;

CREATE INDEX IF NOT EXISTS idx_email_send_log_message_id ON public.email_send_log(message_id);
CREATE INDEX IF NOT EXISTS idx_email_send_log_user_kind_sent ON public.email_send_log(user_id, kind, sent_at DESC);

-- 3) Allow admins to read email_send_log for analytics
DROP POLICY IF EXISTS "Admins can view email send log" ON public.email_send_log;
CREATE POLICY "Admins can view email send log"
  ON public.email_send_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4) Analytics RPC: notification email stats with 24h conversion to chat / connection
CREATE OR REPLACE FUNCTION public.admin_notification_email_stats(
  _kind text DEFAULT NULL,
  _since timestamptz DEFAULT (now() - interval '30 days')
)
RETURNS TABLE(
  kind text,
  sent bigint,
  opened bigint,
  clicked bigint,
  converted bigint,
  open_rate numeric,
  click_rate numeric,
  conversion_rate numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  WITH sends AS (
    SELECT l.kind, l.user_id, l.ref_id, l.message_id, l.sent_at
    FROM public.email_send_log l
    WHERE l.sent_at >= _since
      AND (_kind IS NULL OR l.kind = _kind)
  ),
  per_send AS (
    SELECT
      s.kind,
      s.message_id,
      EXISTS (
        SELECT 1 FROM public.email_events e
        WHERE e.message_id = s.message_id AND e.event_type = 'open'
      ) AS opened,
      EXISTS (
        SELECT 1 FROM public.email_events e
        WHERE e.message_id = s.message_id AND e.event_type = 'click'
      ) AS clicked,
      CASE
        WHEN s.kind = 'new_message' AND s.ref_id IS NOT NULL THEN EXISTS (
          SELECT 1 FROM public.messages m
          JOIN public.profiles p ON p.id = m.sender_id
          WHERE m.connection_id = s.ref_id
            AND p.user_id = s.user_id
            AND m.created_at > s.sent_at
            AND m.created_at <= s.sent_at + interval '24 hours'
        )
        WHEN s.kind = 'new_match' AND s.ref_id IS NOT NULL THEN EXISTS (
          SELECT 1 FROM public.connections c
          JOIN public.profiles p ON p.id = c.user1_id OR p.id = c.user2_id
          WHERE p.user_id = s.user_id
            AND c.status = 'accepted'
            AND c.created_at > s.sent_at
            AND c.created_at <= s.sent_at + interval '24 hours'
        )
        ELSE false
      END AS converted
    FROM sends s
    WHERE s.message_id IS NOT NULL
  )
  SELECT
    p.kind,
    count(*)::bigint AS sent,
    count(*) FILTER (WHERE p.opened)::bigint AS opened,
    count(*) FILTER (WHERE p.clicked)::bigint AS clicked,
    count(*) FILTER (WHERE p.converted)::bigint AS converted,
    ROUND(100.0 * count(*) FILTER (WHERE p.opened) / NULLIF(count(*),0), 1) AS open_rate,
    ROUND(100.0 * count(*) FILTER (WHERE p.clicked) / NULLIF(count(*),0), 1) AS click_rate,
    ROUND(100.0 * count(*) FILTER (WHERE p.converted) / NULLIF(count(*),0), 1) AS conversion_rate
  FROM per_send p
  GROUP BY p.kind
  ORDER BY p.kind;
END;
$$;

-- 5) Daily timeseries for charting
CREATE OR REPLACE FUNCTION public.admin_notification_email_timeseries(
  _since timestamptz DEFAULT (now() - interval '14 days')
)
RETURNS TABLE(
  day date,
  kind text,
  sent bigint,
  opened bigint,
  clicked bigint,
  converted bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  WITH sends AS (
    SELECT l.kind, l.user_id, l.ref_id, l.message_id, l.sent_at,
           (l.sent_at AT TIME ZONE 'utc')::date AS day
    FROM public.email_send_log l
    WHERE l.sent_at >= _since AND l.message_id IS NOT NULL
  ),
  per_send AS (
    SELECT s.day, s.kind, s.message_id,
      EXISTS (SELECT 1 FROM public.email_events e WHERE e.message_id = s.message_id AND e.event_type = 'open') AS opened,
      EXISTS (SELECT 1 FROM public.email_events e WHERE e.message_id = s.message_id AND e.event_type = 'click') AS clicked,
      CASE
        WHEN s.kind = 'new_message' AND s.ref_id IS NOT NULL THEN EXISTS (
          SELECT 1 FROM public.messages m
          JOIN public.profiles p ON p.id = m.sender_id
          WHERE m.connection_id = s.ref_id AND p.user_id = s.user_id
            AND m.created_at > s.sent_at AND m.created_at <= s.sent_at + interval '24 hours'
        )
        WHEN s.kind = 'new_match' AND s.ref_id IS NOT NULL THEN EXISTS (
          SELECT 1 FROM public.connections c
          JOIN public.profiles p ON p.id = c.user1_id OR p.id = c.user2_id
          WHERE p.user_id = s.user_id AND c.status = 'accepted'
            AND c.created_at > s.sent_at AND c.created_at <= s.sent_at + interval '24 hours'
        )
        ELSE false
      END AS converted
    FROM sends s
  )
  SELECT
    p.day, p.kind,
    count(*)::bigint AS sent,
    count(*) FILTER (WHERE p.opened)::bigint AS opened,
    count(*) FILTER (WHERE p.clicked)::bigint AS clicked,
    count(*) FILTER (WHERE p.converted)::bigint AS converted
  FROM per_send p
  GROUP BY p.day, p.kind
  ORDER BY p.day ASC, p.kind ASC;
END;
$$;
