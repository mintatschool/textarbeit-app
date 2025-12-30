# Textarbeit - Digitale Lernhilfe-App

Eine moderne Web-App für digitale Textarbeit und Lesehilfe, speziell entwickelt für den Einsatz im Unterricht.

## Features

### Text-Ansicht & Bearbeitung
- Anpassbare Schriftgröße (16-80px)
- Silbenanzeige (Bögen/Boxen)
- Wortabstand und Zeilenhöhe einstellbar
- Text-Highlighting und Ausblenden
- Paragraphen-Erhaltung

### Übungen

#### Silben
- **Silbenteppich**: Interaktives Silben-Lesen mit Timer
- **Silben-Puzzle**: Drag & Drop Silben zu Wörtern

#### Wörter
- **Treppenwörter**: Stufenweise Buchstabenaufbau
- **Schüttelwörter**: Word Cloud mit Worttrennung
- **Wörter trennen**: Korrektur-Übung für Silbentrennung
- **Liste**: Spaltenbasierte Wortlisten

#### Sätze
- **Schüttelsatz**: Wörter innerhalb von Sätzen sortieren

#### Text
- **Satzpuzzle**: Sätze in richtige Reihenfolge bringen
- **Textpuzzle**: Absätze ordnen

### Weitere Funktionen
- QR-Code Export/Import (offline-fähig)
- JSON Export/Import
- Zustandsspeicherung
- Responsive Design für Tablets
- Touch-optimierte Drag & Drop Unterstützung

## Installation

```bash
npm install
npm run dev
```

## Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Silbentrennung**: Hypher + hyphenation.de
- **QR-Codes**: QRious + html5-qrcode
- **Touch Support**: mobile-drag-drop

## Entwicklung

```bash
# Development Server
npm run dev

# Production Build
npm run build

# Preview Production Build
npm run preview
```

## Lizenz

Dieses Projekt wurde entwickelt für den Einsatz im Bildungsbereich.
