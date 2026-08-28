DO $$
DECLARE _base text := 'https://project--eba2b5b6-0e26-42b9-b5c5-a2b72735fe8e.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobname) FROM cron.job WHERE jobname = 'mission-reminder-hourly';

  PERFORM cron.schedule('mission-reminder-hourly','5 * * * *', format($job$
    SELECT net.http_post(url:=%L, headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret', current_setting('app.cron_secret', true)), body:='{}'::jsonb);
  $job$, _base || '/api/public/hooks/mission-reminder'));
END $$;