import { supabase } from './supabase';

export async function signInWithMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) throw error;
}

export async function upsertProfile(profile) {
  const { data, error } = await supabase.from('profiles').upsert(profile).select().single();
  if (error) throw error;
  return data;
}

export async function getStats(userId) {
  const { data, error } = await supabase.from('game_stats').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listCards(userId) {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return withSignedImages(data ?? [], 'cards');
}

export async function listDrawings(userId) {
  let query = supabase.from('drawings').select('*, profiles(name)').order('created_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return withSignedImages(data ?? [], 'drawings');
}

export async function uploadImage(bucket, path, fileOrBlob) {
  const { error } = await supabase.storage.from(bucket).upload(path, fileOrBlob, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function saveDrawing(userId, imagePath) {
  const { data, error } = await supabase.from('drawings').insert({ user_id: userId, image_url: imagePath }).select().single();
  if (error) throw error;
  return withSignedImage(data, 'drawings');
}

export async function createCard(card) {
  const { data, error } = await supabase.from('cards').insert(card).select().single();
  if (error) throw error;
  return withSignedImage(data, 'cards');
}

export async function getDeck(userId) {
  const { data, error } = await supabase.from('decks').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveDeck(userId, cards, name = 'Main Deck') {
  const { data, error } = await supabase
    .from('decks')
    .upsert({ user_id: userId, name, cards: cards.slice(0, 5).map((card) => card.id), updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listDeckCards(userId) {
  const deck = await getDeck(userId);
  if (!deck?.cards?.length) return [];
  const { data, error } = await supabase.from('cards').select('*').in('id', deck.cards);
  if (error) throw error;
  const signedCards = await withSignedImages(data ?? [], 'cards');
  const byId = new Map(signedCards.map((card) => [card.id, card]));
  return deck.cards.map((id) => byId.get(id)).filter(Boolean);
}

export async function listClassStudents() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, game_stats(*)')
    .eq('role', 'student')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function updateStudent(id, patch) {
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function giveCoins(userId, currentCoins, amount) {
  const { data, error } = await supabase
    .from('game_stats')
    .update({ coins: Math.max(0, currentCoins + amount) })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function applyBattleResult(result) {
  const { error } = await supabase.rpc('apply_battle_result', { result });
  if (error) throw error;
}

async function withSignedImages(rows, bucket) {
  return Promise.all(rows.map((row) => withSignedImage(row, bucket)));
}

async function withSignedImage(row, bucket) {
  if (!row?.image_url || row.image_url.startsWith('http')) return row;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(row.image_url, 60 * 60);
  if (error) throw error;
  return { ...row, image_url: data.signedUrl, image_path: row.image_url };
}
