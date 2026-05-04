import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl || '', serviceRoleKey || '', {
  auth: { persistSession: false },
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: 'Missing Supabase server environment variables.' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    if (body.action === 'bootstrap-admin') return bootstrapAdmin();

    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) return json(401, { error: 'Missing auth token.' });

    const { data: authData, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !authData.user) return json(401, { error: 'Invalid auth token.' });

    const requester = await getProfile(authData.user.id);
    if (!requester || requester.locked) return json(403, { error: 'Account is not allowed.' });

    if (body.action === 'create-teacher') return createTeacher(requester, body);
    if (body.action === 'reset-teacher-password') return resetTeacherPassword(requester, body);
    if (body.action === 'delete-teacher') return deleteTeacher(requester, body);
    if (body.action === 'create-student') return createStudent(requester, body);
    if (body.action === 'update-student') return updateStudentAccount(requester, body);
    if (body.action === 'reset-student-pin') return resetStudentPin(requester, body);
    if (body.action === 'delete-student') return deleteStudent(requester, body);

    return json(400, { error: 'Unknown action.' });
  } catch (error) {
    return json(500, { error: error.message });
  }
}

async function bootstrapAdmin() {
  const username = 'admin';
  const password = 'LDBBadmin1007~';
  const email = usernameToAuthEmail(username);

  const { count, error: countError } = await adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin');
  if (countError) throw countError;
  if (count && count > 0) return json(200, { created: false });

  const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'Admin', role: 'admin', username },
  });
  if (userError && !userError.message?.toLowerCase().includes('already')) throw userError;

  let userId = userData?.user?.id;
  if (!userId) {
    const existing = await findUserByEmail(email);
    userId = existing?.id;
  }
  if (!userId) throw new Error('Could not create or find admin auth user.');

  const { error: profileError } = await adminClient.from('profiles').upsert({
    id: userId,
    name: 'Admin',
    role: 'admin',
    username,
    login_email: email,
    locked: false,
  });
  if (profileError) throw profileError;

  return json(200, { created: true });
}

async function createTeacher(requester, body) {
  requireRole(requester, ['admin']);
  const username = cleanUsername(body.username);
  const email = usernameToAuthEmail(username);
  const name = cleanName(body.name);
  const className = cleanName(body.className || `${name}'s Class`);
  const classCode = cleanCode(body.classCode || makeClassCode());
  const temporaryPassword = body.password || body.temporaryPassword || makeTemporaryPassword();

  const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { name, role: 'teacher' },
  });
  if (userError) throw userError;

  const userId = userData.user.id;
  const { error: initialProfileError } = await adminClient.from('profiles').upsert({
    id: userId,
    name,
    role: 'teacher',
    username,
    login_email: email,
    locked: false,
  });
  if (initialProfileError) throw initialProfileError;

  const { data: classRow, error: classError } = await adminClient
    .from('classes')
    .insert({ name: className, code: classCode, teacher_id: userId })
    .select()
    .single();
  if (classError) throw classError;

  const { error: profileError } = await adminClient.from('profiles').update({ class_id: classRow.id }).eq('id', userId);
  if (profileError) throw profileError;

  return json(200, { teacherId: userId, username, classCode, temporaryPassword });
}

async function resetTeacherPassword(requester, body) {
  requireRole(requester, ['admin']);
  const teacher = await getProfile(body.teacherId);
  if (teacher?.role !== 'teacher') return json(404, { error: 'Teacher not found.' });
  const temporaryPassword = body.temporaryPassword || makeTemporaryPassword();
  const { error } = await adminClient.auth.admin.updateUserById(teacher.id, { password: temporaryPassword });
  if (error) throw error;
  return json(200, { temporaryPassword });
}

async function deleteTeacher(requester, body) {
  requireRole(requester, ['admin']);
  const teacher = await getProfile(body.teacherId);
  if (teacher?.role !== 'teacher') return json(404, { error: 'Teacher not found.' });
  const { error } = await adminClient.auth.admin.deleteUser(teacher.id);
  if (error) throw error;
  return json(200, { deleted: true });
}

async function createStudent(requester, body) {
  requireRole(requester, ['teacher', 'admin']);
  const name = cleanName(body.name);
  const username = cleanUsername(body.username);
  const pin = cleanStudentPassword(body.password || body.pin || makePin());
  const classId = body.classId || requester.class_id;
  await assertCanManageClass(requester, classId);

  const loginEmail = usernameToAuthEmail(username);
  const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
    email: loginEmail,
    password: pin,
    email_confirm: true,
    user_metadata: { name, role: 'student' },
  });
  if (userError) throw userError;

  const userId = userData.user.id;
  const { error: profileError } = await adminClient.from('profiles').upsert({
    id: userId,
    name,
    role: 'student',
    class_id: classId,
    avatar: body.avatar || 'Astra',
    username,
    pin,
    login_email: loginEmail,
    locked: false,
  });
  if (profileError) throw profileError;

  return json(200, { studentId: userId, username, pin });
}

async function updateStudentAccount(requester, body) {
  requireRole(requester, ['teacher', 'admin']);
  const student = await getProfile(body.studentId);
  if (student?.role !== 'student') return json(404, { error: 'Student not found.' });
  await assertCanManageClass(requester, student.class_id);

  const patch = {};
  if (body.name) patch.name = cleanName(body.name);
  if (body.avatar) patch.avatar = body.avatar;
  if (typeof body.locked === 'boolean') patch.locked = body.locked;

  const { data, error } = await adminClient.from('profiles').update(patch).eq('id', student.id).select().single();
  if (error) throw error;
  return json(200, { student: data });
}

async function resetStudentPin(requester, body) {
  requireRole(requester, ['teacher', 'admin']);
  const student = await getProfile(body.studentId);
  if (student?.role !== 'student') return json(404, { error: 'Student not found.' });
  await assertCanManageClass(requester, student.class_id);
  const pin = cleanPin(body.pin || makePin());
  const { error: authError } = await adminClient.auth.admin.updateUserById(student.id, { password: pin });
  if (authError) throw authError;
  const { error: profileError } = await adminClient.from('profiles').update({ pin }).eq('id', student.id);
  if (profileError) throw profileError;
  return json(200, { pin });
}

async function deleteStudent(requester, body) {
  requireRole(requester, ['teacher', 'admin']);
  const student = await getProfile(body.studentId);
  if (student?.role !== 'student') return json(404, { error: 'Student not found.' });
  await assertCanManageClass(requester, student.class_id);
  const { error } = await adminClient.auth.admin.deleteUser(student.id);
  if (error) throw error;
  return json(200, { deleted: true });
}

async function getProfile(id) {
  const { data, error } = await adminClient.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

async function assertCanManageClass(requester, classId) {
  if (requester.role === 'admin') return;
  if (requester.class_id !== classId) {
    throw new Error('You can only manage your own class.');
  }
}

function requireRole(profile, roles) {
  if (!roles.includes(profile.role)) {
    throw new Error('You do not have permission for this action.');
  }
}

async function findUserByEmail(email) {
  let page = 1;
  while (page < 20) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((user) => user.email === email);
    if (found || data.users.length < 100) return found;
    page += 1;
  }
  return null;
}

function cleanUsername(username) {
  const value = String(username || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  if (value.length < 3) throw new Error('Username must be at least 3 letters or numbers.');
  return value;
}

function usernameToAuthEmail(username) {
  return `${cleanUsername(username)}@classcard.app`;
}

function cleanName(name) {
  const value = String(name || '').trim();
  if (value.length < 2) throw new Error('Name is required.');
  return value;
}

function cleanPin(pin) {
  const value = String(pin || '').trim();
  if (!/^\d{6}$/.test(value)) throw new Error('Student PIN must be 6 digits.');
  return value;
}

function cleanStudentPassword(password) {
  return cleanPin(password);
}

function cleanCode(code) {
  const value = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (value.length < 4) throw new Error('Class code must be at least 4 letters or numbers.');
  return value;
}

function makePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function makeClassCode() {
  return `ART${Math.floor(1000 + Math.random() * 9000)}`;
}

function makeTemporaryPassword() {
  return `Temp${Math.floor(100000 + Math.random() * 900000)}!`;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
