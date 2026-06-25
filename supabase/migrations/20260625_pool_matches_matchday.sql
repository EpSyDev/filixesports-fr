-- Ajout de la colonne matchday sur pool_matches pour le groupement par journée
ALTER TABLE public.pool_matches ADD COLUMN IF NOT EXISTS matchday integer DEFAULT 1;
