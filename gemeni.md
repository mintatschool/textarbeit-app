# GitHub Push Rules

## Netlify Build Prevention
Alle Pushes zu GitHub sollen **ohne** Auslösung des Netlify-Buildprozesses erfolgen.

### Umsetzung
Verwende in der Commit-Nachricht immer den Tag `[skip ci]` oder `[netlify skip]`.

Beispiel:
`git commit -m "Update feature XYZ [skip ci]"`

## Sprachregel

> [!IMPORTANT]
> **Antworte IMMER auf Deutsch.**
> Diese Regel gilt für alle Erklärungen, Kommentare und Interaktionen, sofern nicht explizit etwas anderes angefordert wird.
