@echo off
REM ============================================================
REM  Runner local de synchronisation Pro Clubs (Windows)
REM
REM  1. Copiez ce fichier en "proclubs-sync.local.cmd"
REM     (le .local.cmd est ignore par git, il contiendra vos cles)
REM  2. Remplacez les deux valeurs ci-dessous par les votres :
REM       - SUPABASE_URL              : Supabase > Settings > API > Project URL
REM       - SUPABASE_SERVICE_ROLE_KEY : Supabase > Settings > API > service_role
REM  3. Double-cliquez le .local.cmd pour lancer une synchro,
REM     ou pointez le Planificateur de taches Windows dessus.
REM ============================================================

set "SUPABASE_URL=https://VOTRE-PROJET.supabase.co"
set "SUPABASE_SERVICE_ROLE_KEY=VOTRE_CLE_SERVICE_ROLE"
set "PROCLUBS_CLUB_ID=907897"
set "PROCLUBS_PLATFORM=common-gen5"

node "%~dp0proclubs-sync.mjs"

echo.
echo --- Termine. Fermeture dans 8 secondes ---
timeout /t 8 >nul
