# Random Radar 🔍

**Discover fresh content from the unexplored web**

Random Radar is an experimental web discovery tool that finds and showcases content from newly created websites before they appear in major search engines. It monitors certificate transparency logs, tracks recently registered domains, and explores the web's hidden corners to bring you fresh, unique content.

## 🌟 Features

- **Fresh Content Discovery**: Find websites before they appear in search results
- **Smart Content Extraction**: Automatically extract interesting quotes and snippets
- **Client-side Processing**: All crawling happens in your browser for privacy
- **Modern UI**: Beautiful, responsive interface with real-time updates
- **GitHub Pages Ready**: Deploy easily to GitHub Pages for free hosting

## 🚀 Live Demo

Visit the live demo at: [https://yourusername.github.io/randomradar](https://yourusername.github.io/randomradar)

## 📋 Table of Contents

- [How It Works](#how-it-works)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Code Structure](#code-structure)
- [Deployment](#deployment)
- [Limitations](#limitations)
- [Contributing](#contributing)
- [License](#license)

## 🔧 How It Works

### 1. Domain Discovery Methods

Random Radar uses multiple strategies to discover new websites:

#### Certificate Transparency Logs
- Monitors SSL certificate issuance through services like crt.sh
- Identifies domains that have recently obtained certificates
- Filters for domains issued in the last 24 hours

#### Recently Registered Domains
- Queries domain registration feeds
- Tracks newly registered domains across popular TLDs
- Focuses on domains that haven't been indexed yet

#### Random Generation (Demo)
- Generates potential domain names using common patterns
- Useful for demonstration when APIs are unavailable

### 2. Content Extraction Process

```javascript
// Example of content extraction logic
parseContent(html, domain) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract title and meta description
    const title = doc.querySelector('title')?.textContent?.trim();
    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content');
    
    // Find interesting quotes and snippets
    const quotes = this.extractQuotes(doc);
    
    return {
        domain,
        title,
        description: metaDesc,
        quote: quotes[Math.floor(Math.random() * quotes.length)],
        timestamp: new Date(),
        url: `https://${domain}`
    };
}
```

### 3. Quote Extraction Algorithm

The system looks for content in multiple ways:

1. **Blockquotes**: Direct quote elements
2. **Paragraphs**: Well-formed sentences between 50-300 characters
3. **Article Content**: Content within article, .content, or .post elements
4. **Pattern Matching**: Text that looks like quotes or interesting statements

## 🛠 Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Styling**: CSS Grid, Flexbox, CSS Variables
- **APIs**: Certificate Transparency (crt.sh), Domain Registration feeds
- **Storage**: Local Storage for persistence
- **Deployment**: GitHub Pages compatible

## 📦 Installation

1. **Clone the repository**:
```bash
git clone https://github.com/yourusername/randomradar.git
cd randomradar
```

2. **Serve locally** (optional):
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

3. **Open in browser**:
```
http://localhost:8000
```

## 🎯 Usage

### Basic Usage

1. **Start Discovery**: Click "Start Discovering" to begin finding new websites
2. **View Results**: Discovered content appears in real-time below
3. **Explore Links**: Click on domain names to visit the discovered websites
4. **Stop/Resume**: Use the stop button to pause discovery

### Advanced Configuration

You can modify the discovery parameters in `script.js`:

```javascript
// Adjust crawling speed
setTimeout(() => this.crawlCycle(), 2000); // 2 second delay

// Modify quote length limits
if (text.length > 50 && text.length < 300) {
    // Content filtering logic
}

// Configure CORS proxies
this.corsProxies = [
    'https://cors-anywhere.herokuapp.com/',
    'https://api.allorigins.win/raw?url=',
    // Add more proxies as needed
];
```

## 📁 Code Structure

```
randomradar/
├── index.html          # Main HTML structure
├── styles.css          # Styling and responsive design
├── script.js           # Core application logic
├── README.md           # This file
└── .gitignore          # Git ignore file
```

### Key Components

#### RandomRadar Class (`script.js`)
- **Constructor**: Initializes the application
- **Domain Discovery**: Methods for finding new domains
- **Content Crawling**: Web scraping and content extraction
- **UI Management**: Real-time updates and user interaction

#### Styling (`styles.css`)
- **Modern Design**: Gradient backgrounds, rounded corners, shadows
- **Responsive Layout**: Mobile-first approach with CSS Grid
- **Animations**: Smooth transitions and hover effects

#### HTML Structure (`index.html`)
- **Semantic Markup**: Proper HTML5 elements
- **Accessibility**: ARIA labels and proper heading hierarchy
- **Modal System**: For detailed content viewing

## 🚀 Deployment

### GitHub Pages Deployment

1. **Push to GitHub**:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Enable GitHub Pages**:
   - Go to repository Settings
   - Navigate to Pages section
   - Set source to "Deploy from a branch"
   - Select "main" branch and root folder
   - Click Save

3. **Access your site**:
   - Your site will be available at `https://yourusername.github.io/randomradar`

### Custom Domain (Optional)

Add a `CNAME` file to the repository root:
```
yourdomain.com
```

## ⚠️ Limitations

### CORS Restrictions
- Client-side requests are limited by CORS policies
- Relies on public proxy services which may be unreliable
- Some websites may block proxy requests

### Rate Limiting
- Intentionally rate-limited to be respectful
- May miss rapidly changing content
- Proxy services may have their own limits

### Content Detection
- Relies on HTML structure for content extraction
- May miss content loaded via JavaScript
- Quality of extracted quotes varies

### Legal and Ethical Considerations
- Respects robots.txt files
- Implements reasonable rate limiting
- Only extracts small snippets for fair use

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/randomradar.git
cd randomradar

# Create a new branch
git checkout -b feature/new-feature

# Make your changes and test locally
python -m http.server 8000

# Commit and push
git add .
git commit -m "Description of changes"
git push origin feature/new-feature
```

## 🛡️ Privacy & Ethics

- **No Data Collection**: All processing happens client-side
- **Respectful Crawling**: Implements delays and respects robots.txt
- **Fair Use**: Only extracts small snippets for discovery purposes
- **Transparency**: Open source code for full transparency

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Certificate Transparency initiative for providing public logs
- CORS proxy services for enabling client-side requests
- Open source community for tools and inspiration

## 📞 Support

If you encounter issues or have questions:

1. Check the [Issues](https://github.com/yourusername/randomradar/issues) page
2. Create a new issue with detailed information
3. Include browser console logs if applicable

## 🔮 Future Enhancements

- **Machine Learning**: Better content quality scoring
- **WebRTC**: Peer-to-peer domain sharing
- **Browser Extension**: Dedicated browser extension version
- **API Integration**: More domain discovery sources
- **Advanced Filtering**: Content categorization and filtering

---

**⚡ Start discovering the unexplored web today!**
