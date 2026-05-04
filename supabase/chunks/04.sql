-- Part 4 of 7. Run in order.


create policy "classes_select_own_teacher_or_admin"
on public.classes for select
to authenticated
using (
  teacher_id = auth.uid()
  or id is not distinct from public.current_profile_class_id()
  or public.current_profile_role() = 'admin'
);


create policy "classes_admin_insert"
on public.classes for insert
to authenticated
with check (public.current_profile_role() = 'admin');


create policy "classes_teacher_update_own_or_admin"
on public.classes for update
to authenticated
using (teacher_id = auth.uid() or public.current_profile_role() = 'admin')
with check (teacher_id = auth.uid() or public.current_profile_role() = 'admin');


create policy "profiles_select_own_or_class"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or public.current_profile_role() = 'admin'
  or (
    public.current_profile_role() = 'teacher'
    and class_id is not distinct from public.current_profile_class_id()
  )
);


create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());


create policy "profiles_update_own_limited"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));


create policy "profiles_teacher_manage_class"
on public.profiles for update
to authenticated
using (
  public.current_profile_role() in ('teacher', 'admin')
  and class_id is not distinct from public.current_profile_class_id()
)
with check (
  public.current_profile_role() in ('teacher', 'admin')
  and class_id is not distinct from public.current_profile_class_id()
);


create policy "stats_select_own_or_class"
on public.game_stats for select
to authenticated
using (user_id = auth.uid() or public.same_class(user_id) or public.current_profile_role() = 'admin');


create policy "stats_insert_own"
on public.game_stats for insert
to authenticated
with check (user_id = auth.uid());
