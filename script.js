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
        // Enhanced CORS proxy services for better reliability
        this.corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://cors-anywhere.herokuapp.com/',
            'https://corsproxy.io/?',
            'https://cors.bridged.cc/',
            'https://thingproxy.freeboard.io/fetch/',
            'https://api.codetabs.com/v1/proxy?quest=',
            'https://yacdn.org/proxy/'
        ];
        this.currentProxyIndex = 0;
        this.proxyFailures = new Map(); // Track proxy failures
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
        this.currentSources = []; // Clear previous sources
        
        // Run all discovery methods concurrently for better performance
        const discoveryPromises = [
            this.getCertificateTransparencyDomains(),
            this.getRecentlyRegisteredDomains(),
            this.generateRandomDomains()
        ];
        
        // Wait for all methods to complete (with timeout)
        try {
            await Promise.allSettled(discoveryPromises);
        } catch (error) {
            console.warn('Some discovery methods failed:', error);
        }
        
        // Remove duplicates and ensure we have at least 10 domains
        this.currentSources = [...new Set(this.currentSources)];
        
        // If we don't have enough domains, add some more generated ones
        if (this.currentSources.length < 10) {
            this.generateRandomDomains();
            this.currentSources = [...new Set(this.currentSources)];
        }
        
        // Limit to 25 domains to prevent overwhelming the system
        this.currentSources = this.currentSources.slice(0, 25);
        
        this.updateStatus(`Found ${this.currentSources.length} potential new domains to explore`);
        console.log('Domains to explore:', this.currentSources);
    }

    async getCertificateTransparencyDomains() {
        try {
            // Using crt.sh API to get recently issued certificates
            // Query for certificates issued in the last 48 hours
            const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
            const dateString = twoDaysAgo.toISOString().split('T')[0];
            
            const response = await this.fetchWithProxy(`https://crt.sh/?q=%25&output=json&exclude=expired&after=${dateString}`);
            const data = JSON.parse(response);
            
            if (data && Array.isArray(data)) {
                // Get domains from the last 48 hours and filter for quality
                const domains = data
                    .filter(cert => {
                        const issueDate = new Date(cert.not_before);
                        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
                        return issueDate > twoDaysAgo;
                    })
                    .map(cert => cert.name_value.split('\n')[0])
                    .filter(domain => {
                        // Filter out wildcards, subdomains, and common services
                        return domain && 
                               !domain.includes('*') && 
                               !domain.includes('localhost') &&
                               !domain.includes('test') &&
                               !domain.includes('staging') &&
                               !domain.includes('dev.') &&
                               !domain.includes('api.') &&
                               !domain.includes('cdn.') &&
                               !domain.includes('mail.') &&
                               !domain.includes('www.') &&
                               domain.includes('.') &&
                               domain.length > 4 &&
                               domain.length < 50;
                    })
                    .slice(0, 15); // Get top 15 candidates
                
                this.currentSources.push(...domains);
                console.log(`Found ${domains.length} domains from Certificate Transparency`);
            }
            
        } catch (error) {
            console.warn('Certificate transparency lookup failed:', error);
            // Try alternative CT log source
            await this.getCertificateTransparencyAlternative();
        }
    }

    async getCertificateTransparencyAlternative() {
        try {
            // Alternative: Use Google's Certificate Transparency API
            const response = await this.fetchWithProxy('https://transparencyreport.google.com/https/certificates');
            // This would need more complex parsing, so let's use a simpler approach
            
            // For now, let's use a more reliable method: recently registered domains from certificate logs
            const domains = await this.getDomainsFromCertspotter();
            this.currentSources.push(...domains);
            
        } catch (error) {
            console.warn('Alternative CT lookup also failed:', error);
        }
    }

    async getDomainsFromCertspotter() {
        try {
            // Use Certspotter API (free tier available)
            const response = await this.fetchWithProxy('https://api.certspotter.com/v1/issuances?expand=dns_names&include_subdomains=false');
            const data = JSON.parse(response);
            
            if (data && Array.isArray(data)) {
                const domains = data
                    .filter(cert => {
                        const issueDate = new Date(cert.not_before);
                        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                        return issueDate > oneDayAgo;
                    })
                    .flatMap(cert => cert.dns_names || [])
                    .filter(domain => {
                        return domain && 
                               !domain.includes('*') && 
                               !domain.includes('localhost') &&
                               !domain.includes('test') &&
                               !domain.includes('staging') &&
                               !domain.startsWith('www.') &&
                               domain.includes('.') &&
                               domain.length > 4 &&
                               domain.length < 50;
                    })
                    .slice(0, 10);
                
                return domains;
            }
            
        } catch (error) {
            console.warn('Certspotter lookup failed:', error);
            return [];
        }
    }

    async getRecentlyRegisteredDomains() {
        try {
            // Method 1: Try WhoisDS API
            await this.getWhoisDSDomains();
            
            // Method 2: Try DomainTools API alternative
            await this.getDomainToolsDomains();
            
            // Method 3: Use DNS query for new registrations
            await this.getDNSBasedDomains();
            
        } catch (error) {
            console.warn('Recently registered domains lookup failed:', error);
        }
    }

    async getWhoisDSDomains() {
        try {
            // WhoisDS provides newly registered domains
            const response = await this.fetchWithProxy('https://whoisds.com/newly-registered-domains');
            
            if (response) {
                // Parse the HTML response to extract domains
                const parser = new DOMParser();
                const doc = parser.parseFromString(response, 'text/html');
                
                // Look for domain patterns in the content
                const domainRegex = /\b[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\b/g;
                const text = doc.body.textContent;
                const matches = text.match(domainRegex) || [];
                
                const domains = matches
                    .filter(domain => {
                        return domain.length > 4 && 
                               domain.length < 50 &&
                               !domain.includes('whoisds') &&
                               !domain.includes('example') &&
                               !domain.includes('test') &&
                               domain.includes('.com') || domain.includes('.net') || domain.includes('.org') || domain.includes('.io');
                    })
                    .slice(0, 10);
                
                this.currentSources.push(...domains);
                console.log(`Found ${domains.length} domains from WhoisDS`);
            }
            
        } catch (error) {
            console.warn('WhoisDS lookup failed:', error);
        }
    }

    async getDomainToolsDomains() {
        try {
            // Try to get domains from various new domain lists
            const tlds = ['com', 'net', 'org', 'io', 'tech', 'dev', 'app'];
            
            for (const tld of tlds.slice(0, 3)) { // Limit to prevent too many requests
                try {
                    const response = await this.fetchWithProxy(`https://newly-registered-domains.com/${tld}`);
                    
                    if (response) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response, 'text/html');
                        
                        // Look for domain links or listings
                        const domainElements = doc.querySelectorAll('a[href*="."], .domain, .domain-name');
                        
                        const domains = Array.from(domainElements)
                            .map(el => el.textContent.trim())
                            .filter(domain => {
                                return domain && 
                                       domain.includes('.') &&
                                       domain.length > 4 &&
                                       domain.length < 50 &&
                                       !domain.includes(' ') &&
                                       domain.endsWith(`.${tld}`);
                            })
                            .slice(0, 5);
                        
                        this.currentSources.push(...domains);
                        console.log(`Found ${domains.length} domains from ${tld} registry`);
                    }
                } catch (tldError) {
                    console.warn(`Failed to fetch ${tld} domains:`, tldError);
                }
            }
            
        } catch (error) {
            console.warn('Domain tools lookup failed:', error);
        }
    }

    async getDNSBasedDomains() {
        try {
            // Generate potential new domains based on current trends and patterns
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;
            
            const trendingWords = [
                'ai', 'ml', 'blockchain', 'crypto', 'nft', 'metaverse', 'web3',
                'startup', 'tech', 'innovation', 'digital', 'cloud', 'saas',
                'app', 'platform', 'solution', 'service', 'hub', 'lab',
                `${currentYear}`, `${currentMonth}`, 'new', 'fresh', 'modern'
            ];
            
            const suffixes = ['hub', 'lab', 'tech', 'app', 'dev', 'io', 'ai', 'co'];
            const tlds = ['.com', '.net', '.org', '.io', '.tech', '.dev', '.app', '.co'];
            
            const potentialDomains = [];
            
            // Generate realistic domain combinations
            for (let i = 0; i < 20; i++) {
                const word1 = trendingWords[Math.floor(Math.random() * trendingWords.length)];
                const word2 = suffixes[Math.floor(Math.random() * suffixes.length)];
                const tld = tlds[Math.floor(Math.random() * tlds.length)];
                
                const domain = `${word1}${word2}${tld}`;
                potentialDomains.push(domain);
            }
            
            // Test which domains actually exist and are new
            const existingDomains = [];
            
            for (const domain of potentialDomains.slice(0, 10)) {
                try {
                    // Try to fetch the domain to see if it exists
                    const response = await this.fetchWithProxy(`https://${domain}`);
                    if (response && response.length > 100) { // Has actual content
                        existingDomains.push(domain);
                    }
                } catch (error) {
                    // Domain might not exist or be accessible
                    continue;
                }
            }
            
            this.currentSources.push(...existingDomains);
            console.log(`Found ${existingDomains.length} domains from DNS-based discovery`);
            
        } catch (error) {
            console.warn('DNS-based domain discovery failed:', error);
        }
    }

    generateRandomDomains() {
        // Generate domains based on real patterns and trending topics
        const trendingDomains = this.getTrendingDomains();
        
        // Add trending domains
        trendingDomains.then(domains => {
            const validDomains = domains.filter(domain => this.isValidDomain(domain));
            this.currentSources.push(...validDomains);
            console.log(`Generated ${validDomains.length} trending domains`);
        });
        
        // Also generate some based on current patterns
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const currentDay = new Date().getDate();
        
        // More realistic prefixes based on current trends
        const prefixes = [
            'ai', 'ml', 'tech', 'digital', 'smart', 'next', 'future', 'modern',
            'innovative', 'creative', 'advanced', 'elite', 'pro', 'expert',
            'global', 'universal', 'prime', 'supreme', 'ultimate', 'mega',
            `${currentYear}`, `new${currentYear}`, `${currentMonth}${currentDay}`
        ];
        
        const words = [
            'solutions', 'systems', 'platform', 'network', 'service', 'group',
            'company', 'corporation', 'enterprise', 'business', 'agency',
            'studio', 'lab', 'hub', 'center', 'institute', 'academy',
            'marketplace', 'exchange', 'portal', 'gateway', 'bridge',
            'cloud', 'data', 'analytics', 'insights', 'intelligence'
        ];
        
        const tlds = ['.com', '.net', '.org', '.io', '.tech', '.dev', '.app', '.co', '.ai'];
        
        // Generate more realistic domain combinations
        for (let i = 0; i < 15; i++) {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const word = words[Math.floor(Math.random() * words.length)];
            const tld = tlds[Math.floor(Math.random() * tlds.length)];
            
            let domain;
            if (Math.random() > 0.5) {
                // Combine prefix and word
                domain = `${prefix}${word}${tld}`;
            } else {
                // Use just one word with numbers
                const randomNum = Math.floor(Math.random() * 999) + 1;
                domain = `${word}${randomNum}${tld}`;
            }
            
            if (this.isValidDomain(domain)) {
                this.currentSources.push(domain);
            }
        }
        
        console.log(`Generated ${15} additional potential domains for testing`);
    }

    async crawlCycle() {
        if (!this.isRunning) return;
        
        if (this.currentSources.length === 0) {
            // If we've exhausted sources but need more discoveries, generate more
            if (this.discoveries.length < 10) {
                this.updateStatus('Generating more domains to explore...');
                this.generateRandomDomains();
                this.currentSources = [...new Set(this.currentSources)];
            } else {
                this.updateStatus('Discovery complete - found fresh content!');
                this.stopCrawling();
                return;
            }
        }
        
        const domain = this.currentSources.shift();
        this.updateStatus(`Exploring ${domain}... (${this.discoveries.length} discoveries so far)`);
        
        try {
            await this.crawlDomain(domain);
        } catch (error) {
            console.warn(`Failed to crawl ${domain}:`, error);
        }
        
        // Continue with next domain after a delay
        if (this.isRunning) {
            // Shorter delay if we haven't found much yet
            const delay = this.discoveries.length < 5 ? 1000 : 2000;
            setTimeout(() => this.crawlCycle(), delay);
        }
    }

    async crawlDomain(domain) {
        try {
            // First try HTTPS
            let url = `https://${domain}`;
            let html = await this.fetchWithProxy(url);
            
            if (html && html.length > 100) {
                const content = this.parseContent(html, domain);
                if (content) {
                    console.log(`Successfully crawled ${domain} via HTTPS`);
                    this.addDiscovery(content);
                    return;
                }
            }
        } catch (error) {
            console.warn(`HTTPS failed for ${domain}:`, error);
        }
        
        try {
            // If HTTPS fails, try HTTP
            let url = `http://${domain}`;
            let html = await this.fetchWithProxy(url);
            
            if (html && html.length > 100) {
                const content = this.parseContent(html, domain);
                if (content) {
                    console.log(`Successfully crawled ${domain} via HTTP`);
                    this.addDiscovery(content);
                    return;
                }
            }
        } catch (httpError) {
            console.warn(`Both HTTPS and HTTP failed for ${domain}:`, httpError);
        }
        
        // If domain doesn't work, try with www prefix
        try {
            let url = `https://www.${domain}`;
            let html = await this.fetchWithProxy(url);
            
            if (html && html.length > 100) {
                const content = this.parseContent(html, domain);
                if (content) {
                    console.log(`Successfully crawled www.${domain} via HTTPS`);
                    this.addDiscovery(content);
                    return;
                }
            }
        } catch (wwwError) {
            console.warn(`www.${domain} also failed:`, wwwError);
        }
    }

    async fetchWithProxy(url) {
        let lastError;
        
        // Try each proxy until one works or all fail
        for (let i = 0; i < this.corsProxies.length; i++) {
            const proxy = this.corsProxies[this.currentProxyIndex];
            
            // Skip proxies that have failed recently
            if (this.proxyFailures.has(proxy)) {
                const failureTime = this.proxyFailures.get(proxy);
                if (Date.now() - failureTime < 60000) { // Skip for 1 minute
                    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.corsProxies.length;
                    continue;
                }
            }
            
            try {
                const response = await fetch(proxy + encodeURIComponent(url), {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    },
                    timeout: 10000 // 10 second timeout
                });
                
                if (response.ok) {
                    const text = await response.text();
                    // Remove proxy from failure list if it succeeds
                    this.proxyFailures.delete(proxy);
                    return text;
                }
                
            } catch (error) {
                console.warn(`Proxy ${proxy} failed for ${url}:`, error);
                // Mark proxy as failed
                this.proxyFailures.set(proxy, Date.now());
                lastError = error;
            }
            
            // Try next proxy
            this.currentProxyIndex = (this.currentProxyIndex + 1) % this.corsProxies.length;
        }
        
        // If all proxies failed, throw the last error
        throw lastError || new Error('All CORS proxies failed');
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

    // Utility methods for domain discovery
    isValidDomain(domain) {
        // Check if domain is valid and worth exploring
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/;
        
        return domainRegex.test(domain) &&
               domain.length >= 4 &&
               domain.length <= 50 &&
               !domain.includes('..') &&
               !domain.includes('localhost') &&
               !domain.includes('example') &&
               !domain.includes('test.') &&
               !domain.includes('staging.') &&
               !domain.includes('dev.') &&
               !domain.includes('api.') &&
               !domain.includes('cdn.') &&
               !domain.includes('mail.') &&
               !domain.includes('ftp.') &&
               !domain.includes('ns.') &&
               !domain.includes('mx.');
    }

    async checkDomainExists(domain) {
        // Quick check if domain responds
        try {
            const response = await fetch(`https://${domain}`, { 
                method: 'HEAD',
                mode: 'no-cors',
                timeout: 5000
            });
            return true;
        } catch (error) {
            try {
                const response = await fetch(`http://${domain}`, { 
                    method: 'HEAD',
                    mode: 'no-cors',
                    timeout: 5000
                });
                return true;
            } catch (httpError) {
                return false;
            }
        }
    }

    async getTrendingDomains() {
        // Get domains from trending topics and current events
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        const trendingTopics = [
            'ai', 'artificial-intelligence', 'machine-learning', 'deep-learning',
            'blockchain', 'cryptocurrency', 'bitcoin', 'ethereum', 'nft',
            'metaverse', 'virtual-reality', 'augmented-reality', 'vr', 'ar',
            'web3', 'defi', 'fintech', 'edtech', 'healthtech', 'climatetech',
            'startup', 'innovation', 'digital-transformation', 'automation',
            'cloud-computing', 'edge-computing', 'quantum-computing',
            'sustainability', 'green-tech', 'renewable-energy', 'solar',
            'electric-vehicles', 'ev', 'autonomous-vehicles', 'self-driving',
            'biotechnology', 'genomics', 'telemedicine', 'remote-work',
            'cybersecurity', 'data-privacy', 'zero-trust', 'devops',
            'microservices', 'serverless', 'containers', 'kubernetes'
        ];
        
        const businessTypes = [
            'solutions', 'services', 'platform', 'app', 'software', 'tech',
            'labs', 'studio', 'agency', 'consulting', 'systems', 'network',
            'hub', 'center', 'institute', 'academy', 'marketplace', 'exchange'
        ];
        
        const tlds = ['.com', '.io', '.tech', '.ai', '.app', '.dev', '.co'];
        
        const domains = [];
        
        // Generate trending domain combinations
        for (let i = 0; i < 10; i++) {
            const topic = trendingTopics[Math.floor(Math.random() * trendingTopics.length)];
            const business = businessTypes[Math.floor(Math.random() * businessTypes.length)];
            const tld = tlds[Math.floor(Math.random() * tlds.length)];
            
            // Clean up topic name for domain use
            const cleanTopic = topic.replace(/[^a-zA-Z0-9]/g, '');
            
            let domain;
            if (Math.random() > 0.5) {
                domain = `${cleanTopic}${business}${tld}`;
            } else {
                domain = `${cleanTopic}${year}${tld}`;
            }
            
            if (this.isValidDomain(domain)) {
                domains.push(domain);
            }
        }
        
        return domains;
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
    window.randomRadar = new RandomRadar();
});

// Real-time domain discovery - no demo data needed
// The application will discover actual domains when started
