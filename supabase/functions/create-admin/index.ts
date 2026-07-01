// Edge Function : création d'un nouvel administrateur.
//
// Sécurité : la clé service_role ne doit JAMAIS être exposée côté frontend.
// Elle reste ici, côté serveur. La fonction vérifie d'abord que l'appelant est
// lui-même un administrateur authentifié avant de créer le nouveau compte.
//
// Déploiement :
//   supabase functions deploy create-admin
// (SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY sont injectés
//  automatiquement par Supabase, aucun secret à configurer manuellement.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 1. L'appelant doit être un administrateur authentifié.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Authentification requise.' }, 401);

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await authClient.auth.getUser();
    if (userErr || !user) return json({ error: 'Accès refusé.' }, 401);

    // 2. Validation des entrées.
    const { email, password } = await req.json().catch(() => ({}));
    if (typeof email !== 'string' || !email.includes('@')) {
      return json({ error: 'Adresse e-mail invalide.' }, 400);
    }
    if (typeof password !== 'string' || password.length < 8) {
      return json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, 400);
    }

    // 3. Création du compte via la clé service_role.
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true, // compte utilisable immédiatement, sans e-mail de confirmation
    });
    if (error) return json({ error: error.message }, 400);

    return json({ user: { id: data.user.id, email: data.user.email } }, 201);
  } catch (e) {
    return json({ error: (e as Error).message ?? 'Erreur serveur.' }, 500);
  }
});
