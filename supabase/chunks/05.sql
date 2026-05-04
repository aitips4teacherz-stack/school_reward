-- Part 5 of 7. Run in order.


create policy "stats_update_own_or_teacher"
on public.game_stats for update
to authenticated
using (
  user_id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (public.current_profile_role() in ('teacher', 'admin') and public.same_class(user_id))
)
with check (
  user_id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (public.current_profile_role() in ('teacher', 'admin') and public.same_class(user_id))
);


create policy "cards_select_own_or_teacher_class"
on public.cards for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (public.current_profile_role() in ('teacher', 'admin') and public.same_class(user_id))
);


create policy "cards_insert_own_or_teacher_class"
on public.cards for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (public.current_profile_role() in ('teacher', 'admin') and public.same_class(user_id))
);


create policy "cards_update_own_or_teacher_class"
on public.cards for update
to authenticated
using (
  user_id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (public.current_profile_role() in ('teacher', 'admin') and public.same_class(user_id))
)
with check (
  user_id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (public.current_profile_role() in ('teacher', 'admin') and public.same_class(user_id))
);


create policy "decks_select_own_or_teacher_class"
on public.decks for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (public.current_profile_role() in ('teacher', 'admin') and public.same_class(user_id))
);


create policy "decks_upsert_own"
on public.decks for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());


create policy "drawings_select_own_or_teacher_class"
on public.drawings for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (public.current_profile_role() in ('teacher', 'admin') and public.same_class(user_id))
);


create policy "drawings_insert_own"
on public.drawings for insert
to authenticated
with check (user_id = auth.uid());
