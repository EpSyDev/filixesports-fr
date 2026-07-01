# Synchronisation des stats Pro Clubs — guide de l'hôte

Ce dossier contient le petit programme qui va chercher les stats du club
**Kotiya FC** sur l'API EA et les envoie sur le site KOTIYA FC.

> **Pourquoi sur ta machine ?** EA bloque les serveurs/hébergeurs (IP datacenter).
> Seule une connexion « maison » (résidentielle) est acceptée. Il faut donc un
> ordinateur souvent allumé pour lancer la synchro régulièrement.

## Ce dont tu as besoin

1. **Node.js** — installe la version **LTS** depuis <https://nodejs.org> (suivant, suivant, terminer).
2. Les fichiers de ce dossier `scripts/` (déjà récupérés avec le projet).
3. Le **jeton** que l'admin t'a communiqué (une longue suite de caractères).

Tu n'as **aucune clé sensible** à manipuler : juste ce jeton.

## Installation

### Windows
1. Copie `proclubs-sync.example.cmd` → renomme la copie en **`proclubs-sync.local.cmd`**.
2. Ouvre-la, remplace `COLLEZ_LE_JETON_ICI` par le jeton fourni, enregistre.
3. **Double-clique** dessus : une console affiche `✅ Sync OK — Kotiya FC ...`.
4. **Automatiser** (optionnel) : Planificateur de tâches → *Créer une tâche de base*
   → déclencheur *Quotidien*/répétition *toutes les heures* → action *Démarrer un
   programme* → sélectionne `proclubs-sync.local.cmd`.

### Mac / Linux
1. Copie `proclubs-sync.example.sh` → **`proclubs-sync.local.sh`**, colle le jeton.
2. `chmod +x proclubs-sync.local.sh` puis `./proclubs-sync.local.sh` → `✅ Sync OK`.
3. **Automatiser** avec cron (`crontab -e`), toutes les heures :
   ```
   0 * * * * /chemin/vers/scripts/proclubs-sync.local.sh >> /tmp/proclubs.log 2>&1
   ```

## Bon à savoir
- La synchro ne tourne que **quand l'ordinateur est allumé**. Éteint = les stats
  restent figées jusqu'au prochain lancement (rien ne casse).
- Tu peux forcer une mise à jour à tout moment en relançant le script.
- Le jeton ne donne accès qu'aux stats Pro Clubs. En cas de souci, l'admin le
  change en une ligne et te redonne le nouveau.
