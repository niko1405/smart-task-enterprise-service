# Smart Task API – Bruno Collection

## Voraussetzungen

1. [Bruno](https://www.usebruno.com/) installiert
2. Docker-Services laufen: `docker compose up -d postgres mailpit backend`
3. Backend erreichbar unter `http://localhost:3000`
4. Mailpit (Email-Postfach) unter `http://localhost:8025`

## Collection öffnen

In Bruno: **Open Collection** → diesen `bruno/`-Ordner auswählen.

## Environment setzen

Oben rechts in Bruno: Environment **local** auswählen.

## Empfohlene Reihenfolge

```
1. Health Check               → Backend-Verfügbarkeit prüfen
2. Register User              → Token wird automatisch gespeichert
3. Login                      → (alternativ zu Register)
4. Eigenes Profil abrufen     → Token-Test
5. Task erstellen             → taskId wird automatisch gespeichert
6. Alle Tasks abrufen         → Übersicht
7. Tasks filtern / suchen     → Filter testen
8. Task per ID abrufen        → Einzelabruf
9. Task aktualisieren         → Felder ändern
10. Task abschliessen (DONE)  → Email in Mailpit prüfen!
11. Task löschen              → Cleanup
```

## Automatische Variablen

| Variable  | Gesetzt durch             | Verwendet in              |
|-----------|---------------------------|---------------------------|
| `token`   | Register / Login          | Alle Auth-geschützten APIs |
| `taskId`  | Task erstellen            | Get, Update, Delete Task  |
| `userId`  | Register / Login          | (informativ)              |

## Hinweis zum Email-Test

Nach **"Task abschliessen (DONE)"** erscheint eine Email-Benachrichtigung in Mailpit:
→ `http://localhost:8025`
