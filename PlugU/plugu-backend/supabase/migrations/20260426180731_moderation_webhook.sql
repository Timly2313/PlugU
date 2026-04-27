create or replace function public.trigger_moderation_on_insert()
returns trigger
language plpgsql
security definer
as $$
begin
  perform
    net.http_post(
      url     := 'https://ijfvlpcmizlerdtzqkul.supabase.co/functions/v1/moderate-content',
      body    := jsonb_build_object('record', row_to_json(NEW)),
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZnZscGNtaXpsZXJkdHpxa3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNTQ5NzcsImV4cCI6MjA5MjczMDk3N30.PZIQkCNUrXTsU9ENUa5QRxE55gHyL4xWdLwx83U314I'
      )
    );
  return NEW;
end;
$$;