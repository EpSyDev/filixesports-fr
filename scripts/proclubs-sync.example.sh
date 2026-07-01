#!/usr/bin/env bash
# ============================================================
#  Runner local Pro Clubs — Mac / Linux (a donner au membre hote)
#
#  1. Copiez ce fichier en "proclubs-sync.local.sh"
#  2. Collez le JETON fourni par l'admin ci-dessous
#  3. Rendez-le executable :  chmod +x proclubs-sync.local.sh
#  4. Lancez-le, ou ajoutez-le a cron (voir README-proclubs.md)
#
#  Prerequis : Node.js installe (https://nodejs.org, version LTS)
# ============================================================

export PROCLUBS_INGEST_SECRET="COLLEZ_LE_JETON_ICI"

node "$(dirname "$0")/proclubs-sync.mjs"
