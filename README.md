# Random Radar 🔍

**Entdecke frische Inhalte aus dem unerforschten Web**

Random Radar ist ein experimentelles Web-Discovery-Tool, das nach neu registrierten Domains und Websites sucht, um frische Inhalte zu finden, bevor sie in großen Suchmaschinen erscheinen. Es überwacht Certificate Transparency Logs, verfolgt kürzlich registrierte Domains und erkundet die versteckten Ecken des Webs.

## 🌟 Features

- **Frische Inhalte-Entdeckung**: Finde Websites, bevor sie in Suchergebnissen erscheinen
- **Intelligente Inhalts-Extraktion**: Extrahiert automatisch interessante Zitate und Textschnipsel
- **Client-seitige Verarbeitung**: Alle Crawls passieren in Ihrem Browser für maximale Privatsphäre
- **Moderne UI**: Schöne, responsive Oberfläche mit Echtzeit-Updates
- **GitHub Pages bereit**: Einfache Bereitstellung auf GitHub Pages für kostenloses Hosting

## 🚀 Live Demo

Besuchen Sie die Live-Demo unter: [https://yourusername.github.io/randomradar](https://yourusername.github.io/randomradar)

## 🔧 Wie es funktioniert

### Domain-Discovery-Methoden

Random Radar verwendet mehrere Strategien, um neue Websites zu entdecken:

#### Certificate Transparency Logs
- Überwacht SSL-Zertifikat-Ausstellung durch Services wie crt.sh
- Identifiziert Domains, die kürzlich Zertifikate erhalten haben
- Filtert nach Domains, die in den letzten 24 Stunden ausgestellt wurden

#### Trend-basierte Discovery
- **Hacker News**: Analysiert neue Geschichten für Startup-Links
- **GitHub Trending**: Sucht nach Repository-Homepages neuer Projekte
- **Reddit**: Durchsucht relevante Subreddits nach neuen Website-Submissions

#### Intelligente Filterung
- Fokussiert auf Domains mit modernen TLDs (.ai, .app, .dev, .tech, .io)
- Bevorzugt Domains mit zeitbezogenen Mustern (2025, "new", "beta")
- Filtert bekannte Subdomains und Service-Domains heraus

### Content-Extraktion

```javascript
// Beispiel der Quote-Extraktion
extractQuotesFast(doc) {
    const quotes = [];
    const selectors = ['blockquote', 'q', 'p'];
    
    for (const selector of selectors) {
        const elements = doc.querySelectorAll(selector);
        for (const element of elements) {
            const text = element.textContent?.trim();
            if (text && text.length >= 30 && text.length <= 400) {
                if (!this.isNavigationContent(text)) {
                    quotes.push(text);
                }
            }
        }
    }
    return quotes;
}
```

### Performance-Optimierungen

- **Timeout-Schutz**: Alle Netzwerk-Anfragen haben strikte Timeouts
- **CORS-Proxy-Fallbacks**: Mehrere Proxy-Services für maximale Erreichbarkeit
- **Parallele Verarbeitung**: Discovery-Methoden laufen parallel
- **Intelligente Priorisierung**: Bevorzugt Zitate mit Anführungszeichen
- **Memory-Management**: HTML-Größe begrenzt, DOM-Parsing optimiert

## 🛠 Technologie-Stack

- **Frontend**: Vanilla JavaScript (ES6+), CSS3, HTML5
- **APIs**: Certificate Transparency (crt.sh), Hacker News API, GitHub API, Reddit API
- **CORS-Handling**: Mehrere Proxy-Services für Cross-Origin-Anfragen
- **Hosting**: Statische Dateien, kompatibel mit GitHub Pages, Netlify, Vercel

## 📦 Installation

### Lokale Entwicklung

1. **Repository klonen**
```bash
git clone https://github.com/yourusername/randomradar.git
cd randomradar
```

2. **Lokalen Server starten**
```bash
# Mit Python
python -m http.server 8000

# Mit Node.js (npx)
npx serve

# Mit PHP
php -S localhost:8000
```

3. **Browser öffnen**
```
http://localhost:8000
```

## 🎯 Verwendung

### Grundlegende Bedienung

1. **"Entdeckung starten" klicken** - Startet den Discovery-Prozess
2. **Warten** - Das Tool durchsucht verschiedene Quellen nach neuen Domains
3. **Ergebnisse betrachten** - Gefundene Zitate erscheinen in Echtzeit
4. **Links folgen** - Klicken Sie auf Domain-Namen, um Websites zu besuchen

### Erweiterte Features

- **Automatisches Speichern**: Entdeckungen werden lokal gespeichert
- **Echtzeit-Updates**: Neue Funde erscheinen sofort
- **Responsive Design**: Funktioniert auf Desktop und Mobile
- **About-Modal**: Detaillierte Informationen über das Tool

## 📁 Code-Struktur

```
randomradar/
├── index.html          # Haupt-HTML-Datei
├── script.js           # Kern-JavaScript-Logik
├── styles.css          # CSS-Styling
├── README.md           # Diese Datei
└── LICENSE             # MIT-Lizenz
```

### Haupt-Komponenten

#### `RandomRadar` Klasse
- **Constructor**: Initialisierung und Event-Binding
- **Discovery-Methoden**: Domain-Suche aus verschiedenen Quellen
- **Crawling-Engine**: Website-Besuch und Content-Extraktion
- **UI-Management**: Echtzeit-Updates und Fortschrittsanzeigen

#### Key-Methoden
```javascript
// Hauptentdeckung
async discoverNewDomains()

// Domain-spezifische Suche
async getDomainsFromHackerNews()
async getDomainsFromGitHubTrending()
async getCertificateTransparencyFast()

// Content-Verarbeitung
async crawlDomain(domain)
async parseContentWithTimeout(html, domain)
extractQuotesFast(doc)
```

## ⚠️ Beschränkungen

### Technische Herausforderungen

1. **CORS-Beschränkungen**
   - Browser blockieren Cross-Origin-Anfragen
   - Lösung: Mehrere CORS-Proxy-Services

2. **Rate-Limiting**
   - APIs begrenzen Anfragen pro Minute
   - Lösung: Intelligente Delays und Fallbacks

3. **"Neue Domains" sind schwer zu finden**
   - Echte Domain-Registrierungs-Feeds sind kommerziell
   - Certificate Transparency blockt oft automatisierte Anfragen
   - Lösung: Trend-basierte Discovery als Alternative

### Was Sie tatsächlich erhalten

- **Mix aus potenziell neuen und interessanten bestehenden Websites**
- **Echtzeit-Content-Discovery und Zitat-Extraktion**
- **Vielfältige Inhalte aus verschiedenen Kategorien**
- **Spannende Erkundung von Web-Inhalten**

## 🔒 Datenschutz & Ethik

- **Client-seitige Verarbeitung**: Alle Daten bleiben in Ihrem Browser
- **Respektvolle Crawling**: Rate-Limits und Timeouts
- **Keine Datenspeicherung**: Keine Server-seitige Datensammlung
- **Open Source**: Vollständig transparenter Code

## 🤝 Mitwirken

Beiträge sind willkommen! Hier ist wie:

1. **Fork** das Repository
2. **Erstellen** Sie einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** Ihre Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. **Push** zum Branch (`git push origin feature/AmazingFeature`)
5. **Öffnen** Sie eine Pull Request

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz - siehe [LICENSE](LICENSE) Datei für Details.

## 🙏 Danksagungen

- **Certificate Transparency Logs** für öffentliche SSL-Daten
- **Hacker News API** für Startup-Discovery
- **GitHub API** für Trending-Repositories
- **Reddit API** für Community-Content
- **CORS-Proxy-Services** für Cross-Origin-Unterstützung

---

**Random Radar** - Entdecke das unerforschte Web! 🔍✨
