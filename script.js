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
            'https://yacdn.org/proxy/',
            'https://cors.iamnd.net/proxy/',
            'https://crossorigin.me/',
            'https://jsonp.afeld.me/?url='
        ];
        this.currentProxyIndex = 0;
        this.proxyFailures = new Map(); // Track proxy failures
        this.foundQuotes = new Set(); // Track unique quotes to avoid duplicates
        this.processedDomains = new Set(); // Track domains we've already found quotes from
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
        this.updateStatus('Discovering domains from various sources...');
        this.currentSources = []; // Clear previous sources
        
        // Since real-time new domain discovery is limited by CORS and API restrictions,
        // we'll use a hybrid approach that combines:
        // 1. Some reliable sources that work
        // 2. Trending/generated domains
        // 3. Curated list of interesting sites
        
        const discoveryPromises = [
            this.getReliableContentSources(),
            this.getTrendingDomains(),
            this.getGeneratedDomains(),
            this.tryRealNewDomains() // This will attempt real new domains but may fail
        ];
        
        // Wait for all methods to complete
        try {
            await Promise.allSettled(discoveryPromises);
        } catch (error) {
            console.warn('Some discovery methods failed:', error);
        }
        
        // Remove duplicates and ensure we have domains
        this.currentSources = [...new Set(this.currentSources)];
        
        // If we don't have enough domains, add more reliable ones
        if (this.currentSources.length < 10) {
            this.currentSources.push(...this.getBackupDomains());
            this.currentSources = [...new Set(this.currentSources)];
        }
        
        // Shuffle for variety
        this.currentSources = this.currentSources.sort(() => 0.5 - Math.random());
        
        // Limit to prevent overwhelming
        this.currentSources = this.currentSources.slice(0, 30);
        
        this.updateStatus(`Found ${this.currentSources.length} domains to explore (mix of new and interesting sites)`);
        console.log('Domains to explore:', this.currentSources);
    }

    async getReliableContentSources() {
        // These are sites that definitely have content and are accessible
        const reliableSources = [
            'quotes.toscrape.com',
            'httpbin.org',
            'jsonplaceholder.typicode.com',
            'dummyjson.com',
            'reqres.in',
            'postman-echo.com',
            'httpstat.us',
            'randomuser.me',
            'lorem-picsum.photos',
            'api.github.com',
            'dog.ceo',
            'cat-fact.herokuapp.com',
            'official-joke-api.appspot.com',
            'icanhazdadjoke.com',
            'uselessfacts.jsph.pl'
        ];
        
        this.currentSources.push(...reliableSources);
        console.log(`Added ${reliableSources.length} reliable content sources`);
    }

    async tryRealNewDomains() {
        // This will attempt to get real new domains, but won't break if it fails
        try {
            // Try a simplified approach to get some real new domains
            await this.getRealNewDomainsSimplified();
        } catch (error) {
            console.warn('Real new domain discovery failed (expected due to CORS limitations):', error);
            // This is expected to fail often, so we don't treat it as a critical error
        }
    }

    async getRealNewDomainsSimplified() {
        // Try to get some real new domains using a more reliable method
        try {
            // Try Certificate Transparency with a simpler approach
            const response = await this.fetchWithProxy('https://crt.sh/?q=%25&output=json&exclude=expired');
            const data = JSON.parse(response);
            
            if (data && Array.isArray(data)) {
                // Get recent certificates (last few days)
                const recentDomains = data
                    .filter(cert => {
                        const issueDate = new Date(cert.not_before);
                        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
                        return issueDate > threeDaysAgo;
                    })
                    .map(cert => cert.name_value.split('\n')[0])
                    .filter(domain => this.isValidNewDomain(domain))
                    .slice(0, 10);
                
                this.currentSources.push(...recentDomains);
                console.log(`Found ${recentDomains.length} potentially new domains from Certificate Transparency`);
            }
        } catch (error) {
            console.warn('Certificate transparency failed:', error);
        }
    }

    isValidNewDomain(domain) {
        return domain && 
               !domain.includes('*') && 
               !domain.includes('localhost') &&
               !domain.includes('test') &&
               !domain.includes('staging') &&
               !domain.includes('dev.') &&
               !domain.includes('api.') &&
               !domain.includes('cdn.') &&
               !domain.includes('mail.') &&
               !domain.includes('ns.') &&
               !domain.includes('mx.') &&
               !domain.includes('ftp.') &&
               !domain.startsWith('www.') &&
               domain.includes('.') &&
               domain.length > 4 &&
               domain.length < 50 &&
               !domain.includes(' ') &&
               (domain.endsWith('.com') || domain.endsWith('.org') || 
                domain.endsWith('.net') || domain.endsWith('.io') || 
                domain.endsWith('.ai') || domain.endsWith('.tech') ||
                domain.endsWith('.dev') || domain.endsWith('.app'));
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
        
        // Generate domains from different categories for diversity
        const categories = this.getDiverseCategories();
        
        categories.forEach(category => {
            const categoryDomains = this.generateCategoryDomains(category);
            this.currentSources.push(...categoryDomains);
        });
        
        // Also add some well-known sites that might have interesting content
        const knownSites = [
            'quotegarden.com', 'brainyquote.com', 'goodreads.com',
            'medium.com', 'dev.to', 'hackernoon.com', 'techcrunch.com',
            'theverge.com', 'arstechnica.com', 'reddit.com', 'news.ycombinator.com',
            'philosophynow.org', 'brainpickings.org', 'ted.com'
        ];
        
        // Add a few random known sites for guaranteed content
        const randomKnownSites = knownSites.sort(() => 0.5 - Math.random()).slice(0, 5);
        this.currentSources.push(...randomKnownSites);
        
        console.log(`Generated ${this.currentSources.length} domains from various categories`);
    }

    getDiverseCategories() {
        return [
            {
                name: 'Technology',
                prefixes: ['tech', 'digital', 'cyber', 'smart', 'ai', 'ml', 'quantum', 'nano'],
                suffixes: ['solutions', 'systems', 'platform', 'hub', 'lab', 'core', 'net', 'pro']
            },
            {
                name: 'Creative',
                prefixes: ['art', 'design', 'creative', 'pixel', 'studio', 'craft', 'vision', 'inspire'],
                suffixes: ['works', 'studio', 'gallery', 'space', 'lab', 'house', 'collective', 'zone']
            },
            {
                name: 'Business',
                prefixes: ['biz', 'corp', 'enterprise', 'global', 'prime', 'elite', 'pro', 'expert'],
                suffixes: ['solutions', 'services', 'group', 'ventures', 'consulting', 'agency', 'firm', 'partners']
            },
            {
                name: 'Lifestyle',
                prefixes: ['life', 'living', 'wellness', 'health', 'fit', 'zen', 'pure', 'fresh'],
                suffixes: ['hub', 'center', 'zone', 'space', 'life', 'world', 'guide', 'tips']
            },
            {
                name: 'Education',
                prefixes: ['edu', 'learn', 'study', 'smart', 'brain', 'mind', 'know', 'wise'],
                suffixes: ['academy', 'institute', 'university', 'college', 'school', 'campus', 'portal', 'hub']
            },
            {
                name: 'News & Media',
                prefixes: ['news', 'media', 'press', 'daily', 'times', 'post', 'herald', 'voice'],
                suffixes: ['today', 'now', 'daily', 'times', 'post', 'news', 'report', 'wire']
            }
        ];
    }

    generateCategoryDomains(category) {
        const domains = [];
        const tlds = ['.com', '.net', '.org', '.io', '.tech', '.dev', '.app', '.co', '.ai', '.me'];
        
        // Generate 3-5 domains per category
        for (let i = 0; i < 4; i++) {
            const prefix = category.prefixes[Math.floor(Math.random() * category.prefixes.length)];
            const suffix = category.suffixes[Math.floor(Math.random() * category.suffixes.length)];
            const tld = tlds[Math.floor(Math.random() * tlds.length)];
            
            let domain;
            if (Math.random() > 0.6) {
                // Add numbers sometimes
                const randomNum = Math.floor(Math.random() * 99) + 1;
                domain = `${prefix}${randomNum}${tld}`;
            } else if (Math.random() > 0.3) {
                // Combine prefix and suffix
                domain = `${prefix}${suffix}${tld}`;
            } else {
                // Use year or current date
                const currentYear = new Date().getFullYear();
                domain = `${prefix}${currentYear}${tld}`;
            }
            
            if (this.isValidDomain(domain)) {
                domains.push(domain);
            }
        }
        
        return domains;
    }

    async crawlCycle() {
        if (!this.isRunning) return;
        
        if (this.currentSources.length === 0) {
            // If we've exhausted sources, generate more diverse domains
            this.updateStatus('Generating more diverse domains to explore...');
            this.generateRandomDomains();
            
            // Also add some backup domains if we still don't have enough
            if (this.currentSources.length < 5) {
                const backupDomains = this.getBackupDomains();
                this.currentSources.push(...backupDomains);
            }
            
            this.currentSources = [...new Set(this.currentSources)];
            
            // If we still don't have sources, stop
            if (this.currentSources.length === 0) {
                this.updateStatus('No more domains to explore. Discovery complete!');
                this.stopCrawling();
                return;
            }
        }
        
        const domain = this.currentSources.shift();
        this.updateStatus(`Exploring ${domain}... (${this.discoveries.length} quotes found)`);
        
        try {
            await this.crawlDomain(domain);
        } catch (error) {
            console.warn(`Failed to crawl ${domain}:`, error);
            this.removeDiscoveryProgress(domain);
        }
        
        // Continue with next domain after a shorter delay for better real-time feel
        if (this.isRunning) {
            const delay = 800; // Fixed shorter delay for better real-time experience
            setTimeout(() => this.crawlCycle(), delay);
        }
    }

    async getGeneratedDomains() {
        // Generate domains that are likely to exist and have content
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        // Categories of domains that are more likely to exist
        const domainCategories = {
            tech: {
                prefixes: ['tech', 'digital', 'cyber', 'smart', 'ai', 'dev', 'code', 'web'],
                suffixes: ['hub', 'lab', 'studio', 'space', 'zone', 'pro', 'net', 'io']
            },
            business: {
                prefixes: ['biz', 'pro', 'expert', 'elite', 'prime', 'global', 'local'],
                suffixes: ['solutions', 'services', 'group', 'agency', 'firm', 'co']
            },
            creative: {
                prefixes: ['art', 'design', 'creative', 'pixel', 'craft', 'studio'],
                suffixes: ['works', 'gallery', 'house', 'space', 'lab', 'zone']
            },
            news: {
                prefixes: ['news', 'daily', 'times', 'post', 'herald', 'voice'],
                suffixes: ['today', 'now', 'report', 'wire', 'feed', 'live']
            }
        };
        
        const tlds = ['.com', '.org', '.net', '.io', '.tech', '.dev', '.co'];
        const generatedDomains = [];
        
        // Generate domains from each category
        Object.entries(domainCategories).forEach(([category, data]) => {
            for (let i = 0; i < 3; i++) {
                const prefix = data.prefixes[Math.floor(Math.random() * data.prefixes.length)];
                const suffix = data.suffixes[Math.floor(Math.random() * data.suffixes.length)];
                const tld = tlds[Math.floor(Math.random() * tlds.length)];
                
                let domain;
                const rand = Math.random();
                
                if (rand > 0.7) {
                    // Add year
                    domain = `${prefix}${currentYear}${tld}`;
                } else if (rand > 0.4) {
                    // Combine prefix and suffix
                    domain = `${prefix}${suffix}${tld}`;
                } else {
                    // Add small number
                    const num = Math.floor(Math.random() * 99) + 1;
                    domain = `${prefix}${num}${tld}`;
                }
                
                if (this.isValidDomain(domain)) {
                    generatedDomains.push(domain);
                }
            }
        });
        
        this.currentSources.push(...generatedDomains);
        console.log(`Generated ${generatedDomains.length} potential domains`);
    }

    getBackupDomains() {
        // These are domains that definitely exist and have interesting content
        return [
            'httpbin.org',
            'quotes.toscrape.com',
            'dummyjson.com',
            'jsonplaceholder.typicode.com',
            'reqres.in',
            'postman-echo.com',
            'httpstat.us',
            'randomuser.me',
            'dog.ceo',
            'cat-fact.herokuapp.com',
            'official-joke-api.appspot.com',
            'icanhazdadjoke.com',
            'uselessfacts.jsph.pl',
            'api.github.com',
            'lorem-picsum.photos',
            'api.quotable.io',
            'zenquotes.io',
            'api.adviceslip.com',
            'api.chucknorris.io',
            'api.kanye.rest'
        ];
    }

    async crawlDomain(domain) {
        try {
            // Show immediate feedback that we're trying this domain
            this.showDiscoveryProgress(domain, 'Connecting...');
            
            // First try HTTPS
            let url = `https://${domain}`;
            let html = await this.fetchWithProxy(url);
            
            if (html && html.length > 100) {
                this.showDiscoveryProgress(domain, 'Parsing content...');
                const contents = this.parseContentRealTime(html, domain);
                
                // Only show one quote from this domain
                if (contents.length > 0 && !this.processedDomains.has(domain)) {
                    const content = contents[0]; // Take only the first quote
                    if (content && !this.foundQuotes.has(content.quote)) {
                        this.foundQuotes.add(content.quote);
                        this.processedDomains.add(domain);
                        this.addDiscoveryRealTime(content);
                    }
                }
                
                console.log(`Successfully crawled ${domain} via HTTPS`);
                return;
            }
        } catch (error) {
            console.warn(`HTTPS failed for ${domain}:`, error);
        }
        
        try {
            // If HTTPS fails, try HTTP
            this.showDiscoveryProgress(domain, 'Trying HTTP...');
            let url = `http://${domain}`;
            let html = await this.fetchWithProxy(url);
            
            if (html && html.length > 100) {
                this.showDiscoveryProgress(domain, 'Parsing content...');
                const contents = this.parseContentRealTime(html, domain);
                
                // Only show one quote from this domain
                if (contents.length > 0 && !this.processedDomains.has(domain)) {
                    const content = contents[0]; // Take only the first quote
                    if (content && !this.foundQuotes.has(content.quote)) {
                        this.foundQuotes.add(content.quote);
                        this.processedDomains.add(domain);
                        this.addDiscoveryRealTime(content);
                    }
                }
                
                console.log(`Successfully crawled ${domain} via HTTP`);
                return;
            }
        } catch (httpError) {
            console.warn(`Both HTTPS and HTTP failed for ${domain}:`, httpError);
        }
        
        // If domain doesn't work, try with www prefix
        try {
            this.showDiscoveryProgress(domain, 'Trying www...');
            let url = `https://www.${domain}`;
            let html = await this.fetchWithProxy(url);
            
            if (html && html.length > 100) {
                this.showDiscoveryProgress(domain, 'Parsing content...');
                const contents = this.parseContentRealTime(html, domain);
                
                // Only show one quote from this domain
                if (contents.length > 0 && !this.processedDomains.has(domain)) {
                    const content = contents[0]; // Take only the first quote
                    if (content && !this.foundQuotes.has(content.quote)) {
                        this.foundQuotes.add(content.quote);
                        this.processedDomains.add(domain);
                        this.addDiscoveryRealTime(content);
                    }
                }
                
                console.log(`Successfully crawled www.${domain} via HTTPS`);
                return;
            }
        } catch (wwwError) {
            console.warn(`www.${domain} also failed:`, wwwError);
        }
        
        // Remove progress indicator if all methods failed
        this.removeDiscoveryProgress(domain);
    }

    showDiscoveryProgress(domain, status) {
        const container = document.getElementById('discoveries');
        const progressId = `progress-${domain.replace(/\./g, '-')}`;
        
        // Remove existing progress for this domain
        const existingProgress = document.getElementById(progressId);
        if (existingProgress) {
            existingProgress.remove();
        }
        
        // Add new progress indicator
        const progressElement = document.createElement('div');
        progressElement.id = progressId;
        progressElement.className = 'discovery-progress';
        progressElement.innerHTML = `
            <div class="progress-content">
                <div class="progress-spinner"></div>
                <span class="progress-domain">${domain}</span>
                <span class="progress-status">${status}</span>
            </div>
        `;
        
        container.insertBefore(progressElement, container.firstChild);
    }

    removeDiscoveryProgress(domain) {
        const progressId = `progress-${domain.replace(/\./g, '-')}`;
        const progressElement = document.getElementById(progressId);
        if (progressElement) {
            progressElement.remove();
        }
    }

    parseContentRealTime(html, domain) {
        // Create a DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract title
        const title = doc.querySelector('title')?.textContent?.trim() || 'Untitled';
        
        // Extract meta description
        const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        
        // Extract quotes/snippets and prioritize them
        const quotes = this.extractQuotes(doc);
        
        if (quotes.length === 0) {
            return []; // No interesting content found
        }
        
        // Prioritize quotes: longer ones that look more like actual quotes
        const prioritizedQuotes = quotes.sort((a, b) => {
            // Prefer quotes with quotation marks
            const aHasQuotes = a.includes('"') || a.includes('"') || a.includes('"');
            const bHasQuotes = b.includes('"') || b.includes('"') || b.includes('"');
            
            if (aHasQuotes && !bHasQuotes) return -1;
            if (!aHasQuotes && bHasQuotes) return 1;
            
            // Prefer longer quotes (but not too long)
            const aScore = a.length > 50 && a.length < 200 ? a.length : a.length * 0.5;
            const bScore = b.length > 50 && b.length < 200 ? b.length : b.length * 0.5;
            
            return bScore - aScore;
        });
        
        // Return only the best quote for this domain
        const bestQuote = prioritizedQuotes[0];
        
        return [{
            domain,
            title,
            description: metaDesc,
            quote: bestQuote,
            timestamp: new Date(),
            url: `https://${domain}`
        }];
    }

    addDiscoveryRealTime(content) {
        // Remove progress indicator for this domain
        this.removeDiscoveryProgress(content.domain);
        
        // Add to discoveries
        this.discoveries.unshift(content);
        
        // Create and animate in the new discovery
        const container = document.getElementById('discoveries');
        const discoveryElement = document.createElement('div');
        discoveryElement.className = 'discovery discovery-new';
        discoveryElement.innerHTML = `
            <div class="discovery-header">
                <a href="${content.url}" target="_blank" class="discovery-url">${content.domain}</a>
                <span class="discovery-time">${this.formatTime(content.timestamp)}</span>
            </div>
            <h3 style="margin-bottom: 10px; color: #2d3748;">${content.title}</h3>
            ${content.description ? `<p style="color: #718096; margin-bottom: 15px;">${content.description}</p>` : ''}
            <div class="discovery-quote">"${content.quote}"</div>
            <div class="discovery-meta">
                <span class="discovery-tag">Fresh Content</span>
                <span class="discovery-tag">Quote Length: ${content.quote.length} chars</span>
            </div>
        `;
        
        container.insertBefore(discoveryElement, container.firstChild);
        
        // Animate the element in
        setTimeout(() => {
            discoveryElement.classList.remove('discovery-new');
        }, 100);
        
        // Limit displayed discoveries to prevent performance issues
        const discoveries = container.querySelectorAll('.discovery');
        if (discoveries.length > 20) {
            discoveries[discoveries.length - 1].remove();
        }
        
        this.saveDiscoveries();
        this.updateStatus(`Found quote from ${content.domain} - "${content.quote.substring(0, 50)}..."`);
    }

    async fetchWithProxy(url) {
        let lastError;
        
        // Try direct fetch first (for same-origin requests)
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                signal: AbortSignal.timeout(8000) // 8 second timeout
            });
            
            if (response.ok) {
                return await response.text();
            }
        } catch (directError) {
            // Direct fetch failed, try proxies
            console.log('Direct fetch failed, trying proxies...');
        }
        
        // Try each proxy until one works or all fail
        for (let i = 0; i < this.corsProxies.length; i++) {
            const proxy = this.corsProxies[this.currentProxyIndex];
            
            // Skip proxies that have failed recently
            if (this.proxyFailures.has(proxy)) {
                const failureTime = this.proxyFailures.get(proxy);
                if (Date.now() - failureTime < 30000) { // Skip for 30 seconds
                    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.corsProxies.length;
                    continue;
                }
            }
            
            try {
                const proxyUrl = proxy + encodeURIComponent(url);
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    },
                    signal: AbortSignal.timeout(10000) // 10 second timeout
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
        
        // Look for blockquotes first (highest priority)
        const blockquotes = doc.querySelectorAll('blockquote');
        blockquotes.forEach(bq => {
            const text = bq.textContent.trim();
            if (text.length > 20 && text.length < 500) {
                quotes.push(text);
            }
        });
        
        // Look for quote elements
        const quoteElements = doc.querySelectorAll('q, cite, .quote, .quotation');
        quoteElements.forEach(q => {
            const text = q.textContent.trim();
            if (text.length > 15 && text.length < 400) {
                quotes.push(text);
            }
        });
        
        // Look for headings that might be quotes or interesting statements
        const headings = doc.querySelectorAll('h1, h2, h3, h4');
        headings.forEach(h => {
            const text = h.textContent.trim();
            if (text.length > 20 && text.length < 200 && 
                (text.includes('?') || text.includes('!') || text.includes(':') || text.includes('"'))) {
                quotes.push(text);
            }
        });
        
        // Look for paragraphs with interesting content
        const paragraphs = doc.querySelectorAll('p');
        paragraphs.forEach(p => {
            const text = p.textContent.trim();
            if (text.length > 50 && text.length < 300) {
                // Check if it looks like a quote or interesting statement
                if (text.includes('"') || text.includes('"') || text.includes('"') || 
                    text.includes('—') || text.includes('–') || text.includes('...') ||
                    text.match(/^[A-Z][^.!?]*[.!?]$/) || 
                    text.includes('said') || text.includes('stated') || 
                    text.includes('according to') || text.includes('believe') ||
                    text.match(/\b(think|feel|believe|consider|argue|suggest|claim|assert)\b/i)) {
                    quotes.push(text);
                }
            }
        });
        
        // Look for article content
        const articles = doc.querySelectorAll('article p, .content p, .post p, .entry p, .article p');
        articles.forEach(p => {
            const text = p.textContent.trim();
            if (text.length > 30 && text.length < 250) {
                quotes.push(text);
            }
        });
        
        // Look for list items that might contain quotes
        const listItems = doc.querySelectorAll('li');
        listItems.forEach(li => {
            const text = li.textContent.trim();
            if (text.length > 25 && text.length < 200 && 
                (text.includes('"') || text.includes('—') || text.includes(':'))) {
                quotes.push(text);
            }
        });
        
        // Look for emphasized text
        const emphasized = doc.querySelectorAll('em, strong, b, i');
        emphasized.forEach(em => {
            const text = em.textContent.trim();
            if (text.length > 20 && text.length < 150) {
                quotes.push(text);
            }
        });
        
        // Look for div elements that might contain quotes
        const divs = doc.querySelectorAll('div.quote, div.excerpt, div.highlight, div.summary');
        divs.forEach(div => {
            const text = div.textContent.trim();
            if (text.length > 20 && text.length < 400) {
                quotes.push(text);
            }
        });
        
        // Remove duplicates and clean up
        const uniqueQuotes = [...new Set(quotes)]
            .filter(quote => {
                // Filter out common non-quote content
                const lowerQuote = quote.toLowerCase();
                return !lowerQuote.includes('cookie') &&
                       !lowerQuote.includes('privacy policy') &&
                       !lowerQuote.includes('terms of service') &&
                       !lowerQuote.includes('copyright') &&
                       !lowerQuote.includes('all rights reserved') &&
                       !lowerQuote.includes('404') &&
                       !lowerQuote.includes('error') &&
                       !lowerQuote.includes('loading') &&
                       !lowerQuote.includes('please wait') &&
                       !lowerQuote.includes('click here') &&
                       !lowerQuote.includes('read more') &&
                       !lowerQuote.includes('subscribe') &&
                       !lowerQuote.includes('sign up') &&
                       !lowerQuote.includes('log in') &&
                       !lowerQuote.includes('home') &&
                       !lowerQuote.includes('about') &&
                       !lowerQuote.includes('contact') &&
                       !lowerQuote.includes('menu') &&
                       !lowerQuote.includes('navigation') &&
                       !lowerQuote.includes('javascript') &&
                       !lowerQuote.includes('css') &&
                       !lowerQuote.includes('html') &&
                       !lowerQuote.includes('function') &&
                       !lowerQuote.includes('var ') &&
                       !lowerQuote.includes('const ') &&
                       !lowerQuote.includes('let ') &&
                       !lowerQuote.includes('</') &&
                       !lowerQuote.includes('{}') &&
                       !lowerQuote.includes('[]') &&
                       quote.length > 15 &&
                       quote.length < 400;
            })
            .slice(0, 10); // Get top 10 candidates for sorting
        
        return uniqueQuotes;
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
        <p>Random Radar is a web discovery tool that explores various websites to find interesting content and quotes.</p>
        
        <h3>How it works:</h3>
        <ul>
            <li><strong>Mixed Discovery:</strong> Combines multiple approaches to find websites</li>
            <li><strong>Certificate Transparency:</strong> Attempts to monitor SSL certificate logs (when possible)</li>
            <li><strong>Curated Sources:</strong> Includes reliable websites known to have interesting content</li>
            <li><strong>Generated Domains:</strong> Creates domain combinations based on current trends</li>
            <li><strong>Content Extraction:</strong> Analyzes websites to extract quotes and snippets in real-time</li>
        </ul>
        
        <h3>Technical Limitations:</h3>
        <p><strong>Why "newly registered" domains are difficult to find:</strong></p>
        <ul>
            <li>Certificate Transparency APIs often block automated requests</li>
            <li>Browser CORS restrictions prevent direct access to many APIs</li>
            <li>Most "new domain" services require API keys or subscriptions</li>
            <li>Real-time domain registration feeds are typically commercial services</li>
        </ul>
        
        <h3>What you actually get:</h3>
        <ul>
            <li>A mix of potentially new and existing interesting websites</li>
            <li>Real-time content discovery and quote extraction</li>
            <li>Diverse content from various categories and sources</li>
            <li>An engaging exploration of web content</li>
        </ul>
        
        <h3>Privacy & Ethics:</h3>
        <p>This tool respects websites and rate limits requests. All processing happens client-side in your browser for privacy.</p>
        
        <p><em>This is an experimental tool for educational purposes. Results may vary due to technical limitations.</em></p>
    `;
    
    modal.style.display = 'block';
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.randomRadar = new RandomRadar();
});

// Real-time domain discovery - no demo data needed
// The application will discover actual domains when started
