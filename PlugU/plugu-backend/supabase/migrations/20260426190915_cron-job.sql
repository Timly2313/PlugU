-- Enable pg_net in the extensions schema
create extension if not exists pg_net with schema extensions;

-- Recreate the function with the correct schema prefix
create or replace function public.retry_stuck_moderation()
returns void
language plpgsql
security definer
as $$
declare
  stuck_row record;
  project_url text := 'https://ijfvlpcmizlerdtzqkul.supabase.co';
  anon_key    text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZnZscGNtaXpsZXJkdHpxa3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNTQ5NzcsImV4cCI6MjA5MjczMDk3N30.PZIQkCNUrXTsU9ENUa5QRxE55gHyL4xWdLwx83U314I';
begin
  for stuck_row in
    select *
    from public.moderation_queue
    where ai_moderation_status = 'pending'
      and created_at < now() - interval '3 minutes'
      and coalesce(retry_count, 0) < 5
  loop
    raise log 'Retrying moderation for queue id: % (content_id: %)',
      stuck_row.id, stuck_row.content_id;

    perform extensions.http_post(
      url     := project_url || '/functions/v1/moderate_content',
      body    := jsonb_build_object('record', row_to_json(stuck_row)),
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || anon_key
      )
    );

    update public.moderation_queue
    set retry_count = coalesce(retry_count, 0) + 1
    where id = stuck_row.id;

  end loop;
end;
$$;