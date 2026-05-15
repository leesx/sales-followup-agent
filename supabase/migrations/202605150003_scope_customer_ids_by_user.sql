alter table public.followups drop constraint if exists followups_customer_id_fkey;
alter table public.tasks drop constraint if exists tasks_customer_id_fkey;
alter table public.tasks drop constraint if exists tasks_source_followup_id_fkey;
alter table public.stage_overrides drop constraint if exists stage_overrides_customer_id_fkey;
alter table public.stage_history drop constraint if exists stage_history_customer_id_fkey;
alter table public.stage_history drop constraint if exists stage_history_source_followup_id_fkey;

alter table public.stage_overrides drop constraint if exists stage_overrides_pkey;
alter table public.customers drop constraint if exists customers_pkey;

alter table public.customers add primary key (user_id, id);
alter table public.stage_overrides add primary key (user_id, customer_id);

alter table public.followups
  add constraint followups_customer_fkey
  foreign key (user_id, customer_id)
  references public.customers(user_id, id)
  on delete cascade;

alter table public.tasks
  add constraint tasks_customer_fkey
  foreign key (user_id, customer_id)
  references public.customers(user_id, id)
  on delete cascade;

alter table public.stage_overrides
  add constraint stage_overrides_customer_fkey
  foreign key (user_id, customer_id)
  references public.customers(user_id, id)
  on delete cascade;

alter table public.stage_history
  add constraint stage_history_customer_fkey
  foreign key (user_id, customer_id)
  references public.customers(user_id, id)
  on delete cascade;
