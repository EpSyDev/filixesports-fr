' Lanceur silencieux pour la tache planifiee "KOTIYA - Sync Pro Clubs".
' Execute proclubs-sync.local.cmd en fenetre cachee (0), sans attendre.
' Aucune donnee sensible ici : la cle reste dans le .local.cmd (gitignore).
Set sh = CreateObject("WScript.Shell")
scriptDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))
sh.Run """" & scriptDir & "proclubs-sync.local.cmd""", 0, False
