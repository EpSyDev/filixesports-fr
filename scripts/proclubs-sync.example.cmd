@echo off
REM ============================================================
REM  Runner local Pro Clubs — Windows (a donner au membre hote)
REM
REM  1. Copiez ce fichier en "proclubs-sync.local.cmd"
REM  2. Collez le JETON fourni par l'admin apres le = ci-dessous
REM  3. Double-cliquez le .local.cmd (ou pointez le Planificateur
REM     de taches Windows dessus pour une synchro auto horaire)
REM
REM  Prerequis : Node.js installe (https://nodejs.org, version LTS)
REM  Aucune cle sensible : seul le jeton d'ingestion est necessaire.
REM ============================================================

set "PROCLUBS_INGEST_SECRET=COLLEZ_LE_JETON_ICI"

node "%~dp0proclubs-sync.mjs"

echo.
echo --- Termine. Fermeture dans 10 secondes ---
timeout /t 10 >nul
