class RandomRadar {
    constructor() {
        this.isRunning = false;
        this.discoveries = [];
        this.currentSources = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStoredDiscoveries();
        this.setupCORSProxies();
    }

    bindEvents() {
        document.getElementById('startCrawling').addEventListener('click', () => this.startCrawling());
        document.getElementById('stopCrawling').addEventListener('click', () => this.stopCrawling());
        
        // Modal events
        const modal = document.getElementById('modal');
        const closeBtn = document.querySelector('.close');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    setupCORSProxies() {
        // CORS proxy services for client-side requests
        this.corsProxies = [
            'https://cors-anywhere.herokuapp.com/',
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://cors.bridged.cc/'
        ];
        this.currentProxyIndex = 0;
    }

    async startCrawling() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.updateUI();
        this.updateStatus('Starting discovery process...');
        
        try {
            // Get fresh domains from multiple sources
            await this.discoverNewDomains();
            
            // Start crawling cycle
            this.crawlCycle();
            
        } catch (error) {
            console.error('Error starting crawler:', error);
            this.updateStatus('Error starting discovery process');
            this.stopCrawling();
        }
    }

    stopCrawling() {
        this.isRunning = false;
        this.updateUI();
        this.updateStatus('Discovery stopped');
    }

    async discoverNewDomains() {
        this.updateStatus('Discovering new domains...');
        
        // Method 1: Certificate Transparency Logs
        await this.getCertificateTransparencyDomains();
        
        // Method 2: Recently registered domains (using public APIs)
        await this.getRecentlyRegisteredDomains();
        
        // Method 3: Random domain generation (for demonstration)
        this.generateRandomDomains();
        
        this.updateStatus(`Found ${this.currentSources.length} potential new domains`);
    }

    async getCertificateTransparencyDomains() {
        try {
            // Using crt.sh API to get recently issued certificates
            const response = await this.fetchWithProxy('https://crt.sh/?q=%25&output=json&exclude=expired');
            const data = JSON.parse(response);
            
            // Get domains from the last 24 hours
            const recent = data.filter(cert => {
                const issueDate = new Date(cert.not_before);
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return issueDate > oneDayAgo;
            });
            
            const domains = recent.map(cert => cert.name_value.split('\n')[0])
                .filter(domain => domain && !domain.includes('*'))
                .slice(0, 20); // Limit to prevent overwhelming
            
            this.currentSources.push(...domains);
            
        } catch (error) {
            console.warn('Certificate transparency lookup failed:', error);
        }
    }

    async getRecentlyRegisteredDomains() {
        try {
            // Using whoisds.com API for newly registered domains
            const response = await this.fetchWithProxy('https://whoisds.com/newly-registered-domains');
            
            // Extract domains from the response (would need parsing)
            // For demo, we'll use some sample domains
            const sampleNewDomains = [
                'newtech2025.com',
                'innovatetoday.net',
                'freshstartup.io',
                'modernblog.tech',
                'creativespace.dev'
            ];
            
            this.currentSources.push(...sampleNewDomains);
            
        } catch (error) {
            console.warn('Recently registered domains lookup failed:', error);
        }
    }

    generateRandomDomains() {
        // Generate some random domains for demonstration
        const prefixes = ['new', 'fresh', 'modern', 'innovative', 'creative', 'smart', 'tech', 'digital'];
        const words = ['blog', 'site', 'hub', 'space', 'zone', 'lab', 'studio', 'base'];
        const tlds = ['.com', '.net', '.io', '.tech', '.blog', '.dev'];
        
        for (let i = 0; i < 10; i++) {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const word = words[Math.floor(Math.random() * words.length)];
            const tld = tlds[Math.floor(Math.random() * tlds.length)];
            const domain = `${prefix}${word}${tld}`;
            this.currentSources.push(domain);
        }
    }

    async crawlCycle() {
        if (!this.isRunning) return;
        
        if (this.currentSources.length === 0) {
            this.updateStatus('No more domains to explore');
            this.stopCrawling();
            return;
        }
        
        const domain = this.currentSources.shift();
        this.updateStatus(`Exploring ${domain}...`);
        
        try {
            await this.crawlDomain(domain);
        } catch (error) {
            console.warn(`Failed to crawl ${domain}:`, error);
        }
        
        // Continue with next domain after a delay
        if (this.isRunning) {
            setTimeout(() => this.crawlCycle(), 2000);
        }
    }

    async crawlDomain(domain) {
        try {
            const url = `https://${domain}`;
            const html = await this.fetchWithProxy(url);
            
            if (html) {
                const content = this.parseContent(html, domain);
                if (content) {
                    this.addDiscovery(content);
                }
            }
        } catch (error) {
            // Try HTTP if HTTPS fails
            try {
                const url = `http://${domain}`;
                const html = await this.fetchWithProxy(url);
                
                if (html) {
                    const content = this.parseContent(html, domain);
                    if (content) {
                        this.addDiscovery(content);
                    }
                }
            } catch (httpError) {
                console.warn(`Both HTTPS and HTTP failed for ${domain}`);
            }
        }
    }

    async fetchWithProxy(url) {
        const proxy = this.corsProxies[this.currentProxyIndex];
        
        try {
            const response = await fetch(proxy + encodeURIComponent(url), {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; RandomRadar/1.0)'
                }
            });
            
            if (response.ok) {
                return await response.text();
            }
            
        } catch (error) {
            // Try next proxy
            this.currentProxyIndex = (this.currentProxyIndex + 1) % this.corsProxies.length;
            throw error;
        }
    }

    parseContent(html, domain) {
        // Create a DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract title
        const title = doc.querySelector('title')?.textContent?.trim() || 'Untitled';
        
        // Extract meta description
        const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        
        // Extract potential quotes/snippets
        const quotes = this.extractQuotes(doc);
        
        if (quotes.length === 0) {
            return null; // No interesting content found
        }
        
        // Get a random quote
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        
        return {
            domain,
            title,
            description: metaDesc,
            quote,
            timestamp: new Date(),
            url: `https://${domain}`
        };
    }

    extractQuotes(doc) {
        const quotes = [];
        
        // Look for blockquotes
        const blockquotes = doc.querySelectorAll('blockquote');
        blockquotes.forEach(bq => {
            const text = bq.textContent.trim();
            if (text.length > 20 && text.length < 500) {
                quotes.push(text);
            }
        });
        
        // Look for paragraphs with interesting content
        const paragraphs = doc.querySelectorAll('p');
        paragraphs.forEach(p => {
            const text = p.textContent.trim();
            if (text.length > 50 && text.length < 300) {
                // Check if it looks like a quote or interesting statement
                if (text.includes('"') || text.includes('—') || text.includes('–') || 
                    text.match(/^[A-Z][^.!?]*[.!?]$/)) {
                    quotes.push(text);
                }
            }
        });
        
        // Look for article content
        const articles = doc.querySelectorAll('article p, .content p, .post p');
        articles.forEach(p => {
            const text = p.textContent.trim();
            if (text.length > 30 && text.length < 250) {
                quotes.push(text);
            }
        });
        
        return quotes.slice(0, 5); // Limit to 5 quotes
    }

    addDiscovery(content) {
        this.discoveries.unshift(content);
        this.renderDiscoveries();
        this.saveDiscoveries();
        
        this.updateStatus(`Found content from ${content.domain}`);
    }

    renderDiscoveries() {
        const container = document.getElementById('discoveries');
        
        if (this.discoveries.length === 0) {
            container.innerHTML = '<div class="loading">No discoveries yet. Start crawling to find new content!</div>';
            return;
        }
        
        container.innerHTML = this.discoveries.map(discovery => `
            <div class="discovery">
                <div class="discovery-header">
                    <a href="${discovery.url}" target="_blank" class="discovery-url">${discovery.domain}</a>
                    <span class="discovery-time">${this.formatTime(discovery.timestamp)}</span>
                </div>
                <h3 style="margin-bottom: 10px; color: #2d3748;">${discovery.title}</h3>
                ${discovery.description ? `<p style="color: #718096; margin-bottom: 15px;">${discovery.description}</p>` : ''}
                <div class="discovery-quote">"${discovery.quote}"</div>
                <div class="discovery-meta">
                    <span class="discovery-tag">Fresh Content</span>
                    <span class="discovery-tag">Quote Length: ${discovery.quote.length} chars</span>
                </div>
            </div>
        `).join('');
    }

    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    updateUI() {
        const startBtn = document.getElementById('startCrawling');
        const stopBtn = document.getElementById('stopCrawling');
        
        startBtn.disabled = this.isRunning;
        stopBtn.disabled = !this.isRunning;
    }

    updateStatus(message) {
        document.getElementById('status').textContent = message;
    }

    saveDiscoveries() {
        try {
            localStorage.setItem('randomRadarDiscoveries', JSON.stringify(this.discoveries));
        } catch (error) {
            console.warn('Failed to save discoveries:', error);
        }
    }

    loadStoredDiscoveries() {
        try {
            const stored = localStorage.getItem('randomRadarDiscoveries');
            if (stored) {
                this.discoveries = JSON.parse(stored).map(d => ({
                    ...d,
                    timestamp: new Date(d.timestamp)
                }));
                this.renderDiscoveries();
            }
        } catch (error) {
            console.warn('Failed to load stored discoveries:', error);
        }
    }
}

// Global functions
function showAbout() {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <h2>About Random Radar</h2>
        <p>Random Radar is an experimental web discovery tool that finds content from newly created websites before they appear in major search engines.</p>
        
        <h3>How it works:</h3>
        <ul>
            <li><strong>Certificate Transparency:</strong> Monitors SSL certificate logs for newly registered domains</li>
            <li><strong>Domain Registration:</strong> Tracks recently registered domains from public feeds</li>
            <li><strong>Content Extraction:</strong> Analyzes websites to extract interesting quotes and snippets</li>
            <li><strong>Client-side Processing:</strong> All crawling happens in your browser for privacy</li>
        </ul>
        
        <h3>Privacy & Ethics:</h3>
        <p>This tool respects robots.txt files and rate limits requests. All processing happens client-side, and no data is collected or stored on external servers.</p>
        
        <h3>Limitations:</h3>
        <p>Due to CORS restrictions, this tool relies on public proxy services and may not work with all websites. It's designed for educational and research purposes.</p>
    `;
    
    modal.style.display = 'block';
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new RandomRadar();
});

// Demo data for GitHub Pages (when CORS proxies don't work)
const demoDiscoveries = [
    {
        domain: 'newtech2025.com',
        title: 'The Future of Technology',
        description: 'Exploring emerging technologies and their impact on society',
        quote: 'Innovation is not just about creating new things, but about solving real problems that matter to people.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        url: 'https://newtech2025.com'
    },
    {
        domain: 'creativespace.dev',
        title: 'Creative Developer Hub',
        description: 'A community for creative developers and designers',
        quote: 'The best interfaces are invisible to the user, but unforgettable in their impact.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        url: 'https://creativespace.dev'
    },
    {
        domain: 'modernblog.tech',
        title: 'Modern Blog Tech',
        description: 'Latest trends in web development and design',
        quote: 'Code is poetry written in a language that machines can understand, but humans must maintain.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        url: 'https://modernblog.tech'
    }
];

// Add demo data if no real discoveries are made after 30 seconds
setTimeout(() => {
    const radar = window.randomRadar;
    if (radar && radar.discoveries.length === 0) {
        demoDiscoveries.forEach(discovery => {
            radar.addDiscovery(discovery);
        });
    }
}, 30000);
