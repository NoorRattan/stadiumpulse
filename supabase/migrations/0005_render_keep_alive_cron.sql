-- Supabase Cron is the reliable primary scheduler for the Render warm-up
-- path. GitHub Actions remains a best-effort fallback because scheduled runs
-- may be delayed or dropped during periods of scheduler load.
create extension if not exists pg_net;
create extension if not exists pg_cron;

select cron.schedule(
  'stadiumpulse-render-keep-alive',
  '*/10 * * * *',
  $job$
    select
      net.http_get(
        url := 'https://stadiumpulse-d7js.onrender.com/health',
        headers := '{"User-Agent":"StadiumPulse-Keep-Alive/1.0"}'::jsonb,
        timeout_milliseconds := 60000
      ) as health_request_id,
      net.http_get(
        url := 'https://stadiumpulse-d7js.onrender.com/api/demo',
        headers := '{"User-Agent":"StadiumPulse-Keep-Alive/1.0"}'::jsonb,
        timeout_milliseconds := 60000
      ) as demo_request_id;
  $job$
);
