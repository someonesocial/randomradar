# Random Radar - Website Discovery Crawler

**Live Demo:** [https://yourusername.github.io/randomradar](https://yourusername.github.io/randomradar)

Eine fortschrittliche Web-Crawler-Anwendung, die neue Websites entdeckt, die noch nicht von Google indexiert sind, und interessante Zitate/Snippets von ihnen sammelt.

## 🚀 Was macht Random Radar?

Random Radar ist ein innovatives Tool, das **Certificate Transparency Logs** nutzt, um brandneue Websites zu entdecken, bevor sie von Suchmaschinen indexiert werden. Es sammelt automatisch interessante Zitate und Textschnipsel von diesen frischen Websites.

### 🎯 Hauptfunktionen

- **🔐 Certificate Transparency Discovery**: Nutzt öffentliche CT-Logs um neue SSL-Zertifikate zu finden
- **📝 Intelligente Zitat-Extraktion**: Extrahiert aussagekräftige Textschnipsel von neuen Websites  
- **🎨 Moderne Web-UI**: Schöne, responsive Benutzeroberfläche mit Live-Updates
- **⚡ Echtzeit-Statistiken**: Verfolgt gefundene Zitate und entdeckte Websites
- **🤖 Automatische Filterung**: Filtert irrelevante Inhalte wie Cookies, Fehlermeldungen, etc.

## � Wie funktioniert es?

### Certificate Transparency - Die beste Methode

**Warum Certificate Transparency Logs?**
- Alle neuen HTTPS-Websites erhalten SSL-Zertifikate
- Diese werden in öffentlichen CT-Logs protokolliert
- Neue Domains erscheinen dort VOR Suchmaschinen
- Perfekt für das Entdecken frischer, unindexierter Inhalte

### Der Discovery-Prozess

1. **📋 CT-Logs abfragen** - Suche nach neuen SSL-Zertifikaten der letzten 24h
2. **🌐 Websites crawlen** - Besuche neue Domains und lade Inhalte
3. **🔍 Zitate extrahieren** - Finde interessante Textpassagen mit intelligenten Algorithmen
4. **✨ Präsentieren** - Zeige Zitate mit direkten Links zu den Quellseiten

## 📁 Projekt-Struktur

```
randomradar/
├── index.html              # GitHub Pages Version (statisch)
├── app.py                  # Flask Backend (für lokale Entwicklung)
├── templates/
│   └── index.html         # Flask Template
├── requirements.txt        # Python Abhängigkeiten
└── README.md              # Diese Datei
```

## 🌐 GitHub Pages Deployment

Diese Version ist optimiert für GitHub Pages und läuft vollständig im Browser:

### Deployment-Schritte:

1. **Repository erstellen**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/randomradar.git
   git push -u origin main
   ```

2. **GitHub Pages aktivieren**:
   - Gehe zu Repository Settings
   - Scrolle zu "Pages"
   - Wähle "Deploy from a branch"
   - Branch: `main`, Folder: `/ (root)`
   - Speichern

3. **Live-URL**: `https://yourusername.github.io/randomradar`

### GitHub Pages Features:
- ✅ Vollständig statisch (kein Server erforderlich)
- ✅ Kostenlos und automatisch aktualisiert
- ✅ HTTPS standardmäßig aktiviert
- ✅ Responsive Design für alle Geräte
- ✅ Demo-Modus mit Beispieldaten

## 🛠 Lokale Entwicklung

Für die vollständige Funktionalität mit echtem Certificate Transparency Crawling:

### Installation:
```bash
pip install -r requirements.txt
python app.py
```

### Lokale Features:
- 🔥 Echtes Certificate Transparency Crawling
- 🔥 SQLite-Datenbank für Persistenz
- 🔥 Paralleles Crawling mit ThreadPoolExecutor
- 🔥 Live-Updates alle 60 Sekunden

## 🎯 Technische Details

### Certificate Transparency API:
- **Endpoint**: `https://crt.sh/?output=json&q=%.com`
- **Abfrage**: Neue Zertifikate der letzten 24 Stunden
- **Filterung**: Gültige Domain-Namen ohne Wildcards

### Zitat-Extraktion:
- **Regex-Patterns** für verschiedene Anführungszeichen
- **Qualitäts-Filter** gegen Werbung und technische Inhalte
- **Längen-Validierung** für aussagekräftige Snippets

### Performance:
- **Paralleles Crawling** mit 5 Worker-Threads
- **Timeout-Schutz** gegen hängende Anfragen
- **Intelligente Filterung** für bessere Qualität

## 🔧 Konfiguration

### GitHub Pages Version:
- Alle Einstellungen in `index.html` JavaScript-Bereich
- Demo-Daten in `demoQuotes` Array
- UI-Anpassungen über CSS-Variablen

### Flask Version:
- `limit` Parameter für CT-Log-Abfragen
- `max_workers` für paralleles Crawling
- `quote_patterns` für Extraktion

## � Demo-Daten

Die GitHub Pages Version enthält realistische Beispieldaten von:
- Tech-Startups und Entwickler-Blogs
- Datenschutz und Sicherheits-Websites
- AI und Zukunftstechnologie-Inhalte
- Nachhaltigkeit und Green-Tech

## � Rechtliche Hinweise

- **Respektiert robots.txt** in der Produktions-Version
- **Verwendet realistische User-Agents**
- **Timeouts** vermeiden Server-Überlastung
- **Nur öffentlich zugängliche Inhalte**

## 🌟 Zukunft

Geplante Erweiterungen:
- 🔮 Integration mit Passive DNS-Datenbanken
- 🔮 Erweiterte NLP für bessere Zitat-Qualität
- 🔮 Sentiment-Analyse der gefundenen Inhalte
- 🔮 Export-Funktionen für Datenanalyse
- 🔮 Browser-Extension für echtes Real-Time-Crawling

## 🤝 Beitragen

Contributions sind willkommen! Bitte:
1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Committe deine Änderungen
4. Push zum Branch
5. Öffne eine Pull Request

## 📄 Lizenz

MIT License - siehe LICENSE Datei für Details.

---

**Erstellt mit ❤️ für die Entdeckung des unbekannten Webs**