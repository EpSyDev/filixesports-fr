-- Fonction de création d'un administrateur, appelable depuis le dashboard.
--
-- Sécurité :
--   * SECURITY DEFINER : s'exécute avec les droits du propriétaire, mais on
--     vérifie d'abord que l'appelant est authentifié (auth.uid() non nul).
--   * Droit d'exécution réservé au rôle "authenticated" (jamais "anon").
--
-- Un compte créé ici est immédiatement utilisable (email confirmé).

create extension if not exists pgcrypto;

create or replace function public.create_admin(new_email text, new_password text)
returns json
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  clean_email text := lower(trim(new_email));
  new_user_id uuid := gen_random_uuid();
begin
  -- Seul un administrateur déjà connecté peut en créer un autre.
  if auth.uid() is null then
    raise exception 'Non autorisé';
  end if;

  if clean_email is null or position('@' in clean_email) = 0 then
    raise exception 'Adresse e-mail invalide';
  end if;

  if new_password is null or length(new_password) < 8 then
    raise exception 'Le mot de passe doit contenir au moins 8 caractères';
  end if;

  if exists (select 1 from auth.users where email = clean_email) then
    raise exception 'Un compte existe déjà avec cet e-mail';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    new_user_id, 'authenticated', 'authenticated',
    clean_email,
    crypt(new_password, gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), new_user_id, new_user_id::text,
    json_build_object('sub', new_user_id::text, 'email', clean_email)::jsonb,
    'email', now(), now(), now()
  );

  return json_build_object('id', new_user_id, 'email', clean_email);
end;
$$;

revoke all on function public.create_admin(text, text) from public, anon;
grant execute on function public.create_admin(text, text) to authenticated;
