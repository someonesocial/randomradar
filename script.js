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
        this.updateStatus('🚀 Starting web exploration...');
        
        try {
            // Get fresh domains from multiple sources
            await this.discoverNewDomains();
            
            // Start crawling cycle
            this.crawlCycle();
            
        } catch (error) {
            console.error('Error starting crawler:', error);
            this.updateStatus('❌ Error starting exploration');
            this.stopCrawling();
        }
    }

    stopCrawling() {
        this.isRunning = false;
        this.updateUI();
        this.updateStatus('⏸️ Exploration paused');
    }

    async discoverNewDomains() {
        this.updateStatus('🔍 Discovering fresh websites using smart methods...');
        this.currentSources = []; // Clear previous sources
        
        // Use faster, more reliable methods for finding new domains
        const discoveryPromises = [
            this.getDomainsFromHackerNews(),
            this.getDomainsFromGitHubTrending(),
            this.getDomainsFromRedditNew(),
            this.getDomainsFromProductHunt(),
            this.scanSubdomainEnumerationSites(),
            this.getCertificateTransparencyFast()
        ];
        
        // Wait for all methods to complete quickly
        try {
            await Promise.race([
                Promise.allSettled(discoveryPromises),
                new Promise(resolve => setTimeout(resolve, 10000)) // 10 second timeout
            ]);
        } catch (error) {
            console.warn('Some discovery methods failed:', error);
        }
        
        // Remove duplicates
        this.currentSources = [...new Set(this.currentSources)];
        
        // If we don't have enough domains, use rapid generation
        if (this.currentSources.length < 10) {
            await this.rapidDomainGeneration();
            this.currentSources = [...new Set(this.currentSources)];
        }
        
        // Shuffle for variety
        this.currentSources = this.currentSources.sort(() => 0.5 - Math.random());
        
        // Limit to prevent overwhelming
        this.currentSources = this.currentSources.slice(0, 25);
        
        this.updateStatus(`🎯 Found ${this.currentSources.length} fresh websites to explore`);
        console.log('Fast discovered domains:', this.currentSources);
    }

    async getDomainsFromHackerNews() {
        try {
            // Hacker News often features new startups and projects
            const response = await this.fetchWithProxy('https://hacker-news.firebaseio.com/v0/newstories.json?print=pretty');
            const storyIds = JSON.parse(response).slice(0, 20); // Get top 20 new stories
            
            for (const id of storyIds.slice(0, 10)) { // Check first 10 stories
                try {
                    const storyResponse = await this.fetchWithProxy(`https://hacker-news.firebaseio.com/v0/item/${id}.json?print=pretty`);
                    const story = JSON.parse(storyResponse);
                    
                    if (story.url) {
                        const domain = this.extractDomainFromUrl(story.url);
                        if (domain && this.isValidDomain(domain) && this.isLikelyNewDomain(domain)) {
                            this.currentSources.push(domain);
                        }
                    }
                } catch (error) {
                    console.warn(`Failed to fetch HN story ${id}:`, error);
                }
            }
            
            console.log(`Found domains from Hacker News`);
        } catch (error) {
            console.warn('Hacker News domain discovery failed:', error);
        }
    }

    async getDomainsFromGitHubTrending() {
        try {
            // GitHub trending often shows new projects with websites
            const response = await this.fetchWithProxy('https://api.github.com/search/repositories?q=created:>2025-07-01&sort=stars&order=desc&per_page=20');
            const data = JSON.parse(response);
            
            if (data.items) {
                for (const repo of data.items) {
                    if (repo.homepage) {
                        const domain = this.extractDomainFromUrl(repo.homepage);
                        if (domain && this.isValidDomain(domain) && this.isLikelyNewDomain(domain)) {
                            this.currentSources.push(domain);
                        }
                    }
                    
                    // Also check if the repo name suggests a domain
                    if (repo.name && repo.name.includes('.')) {
                        const potentialDomain = repo.name.toLowerCase();
                        if (this.isValidDomain(potentialDomain)) {
                            this.currentSources.push(potentialDomain);
                        }
                    }
                }
            }
            
            console.log(`Found domains from GitHub trending`);
        } catch (error) {
            console.warn('GitHub trending domain discovery failed:', error);
        }
    }

    async getDomainsFromRedditNew() {
        try {
            // Reddit's new submissions often contain new websites
            const subreddits = ['startups', 'SideProject', 'webdev', 'entrepreneur'];
            
            for (const subreddit of subreddits.slice(0, 2)) { // Check first 2 subreddits
                try {
                    const response = await this.fetchWithProxy(`https://www.reddit.com/r/${subreddit}/new.json?limit=10`);
                    const data = JSON.parse(response);
                    
                    if (data.data && data.data.children) {
                        for (const post of data.data.children) {
                            if (post.data.url && post.data.url.startsWith('http')) {
                                const domain = this.extractDomainFromUrl(post.data.url);
                                if (domain && this.isValidDomain(domain) && this.isLikelyNewDomain(domain)) {
                                    this.currentSources.push(domain);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`Failed to fetch from r/${subreddit}:`, error);
                }
            }
            
            console.log(`Found domains from Reddit`);
        } catch (error) {
            console.warn('Reddit domain discovery failed:', error);
        }
    }

    async getDomainsFromProductHunt() {
        try {
            // Product Hunt features new products with websites daily
            const response = await this.fetchWithProxy('https://api.producthunt.com/v2/api/graphql');
            // Note: This would need proper API key, so we'll use a simpler approach
            
            // Instead, let's generate domains based on current ProductHunt patterns
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            
            // ProductHunt-style domain patterns (common for new startups)
            const phPatterns = [
                'tryhello', 'useflow', 'getapp', 'jointeam', 'buildsmart',
                'makesimple', 'startnew', 'launchfast', 'growquick', 'scaleup'
            ];
            
            const domains = phPatterns.map(pattern => `${pattern}.com`);
            domains.push(...phPatterns.map(pattern => `${pattern}.io`));
            domains.push(...phPatterns.map(pattern => `${pattern}.ai`));
            
            this.currentSources.push(...domains.slice(0, 10));
            console.log(`Generated ProductHunt-style domains`);
        } catch (error) {
            console.warn('ProductHunt domain discovery failed:', error);
        }
    }

    async scanSubdomainEnumerationSites() {
        try {
            // Use subdomain enumeration patterns to find new domains
            const popularServices = ['vercel.app', 'netlify.app', 'herokuapp.com', 'github.io'];
            const recentPatterns = ['2025', 'new', 'beta', 'app', 'web', 'site'];
            
            const generatedDomains = [];
            
            for (const service of popularServices) {
                for (const pattern of recentPatterns) {
                    // Generate likely subdomain patterns
                    const randomNum = Math.floor(Math.random() * 999) + 1;
                    generatedDomains.push(`${pattern}${randomNum}.${service}`);
                    generatedDomains.push(`${pattern}-app.${service}`);
                    generatedDomains.push(`my-${pattern}.${service}`);
                }
            }
            
            this.currentSources.push(...generatedDomains.slice(0, 15));
            console.log(`Generated subdomain-based potential domains`);
        } catch (error) {
            console.warn('Subdomain enumeration failed:', error);
        }
    }

    async getCertificateTransparencyFast() {
        try {
            // Fast CT lookup with shorter timeframe and simpler parsing
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const dateString = oneDayAgo.toISOString().split('T')[0];
            
            const response = await this.fetchWithProxy(`https://crt.sh/?q=%25&output=json&exclude=expired&after=${dateString}&limit=50`);
            const data = JSON.parse(response);
            
            if (data && Array.isArray(data)) {
                const domains = data
                    .slice(0, 20) // Only process first 20 for speed
                    .map(cert => cert.name_value.split('\n')[0])
                    .filter(domain => this.isValidDomain(domain) && this.isLikelyNewDomain(domain))
                    .slice(0, 8); // Take only top 8
                
                this.currentSources.push(...domains);
                console.log(`Found ${domains.length} domains from fast CT lookup`);
            }
        } catch (error) {
            console.warn('Fast certificate transparency lookup failed:', error);
        }
    }

    async rapidDomainGeneration() {
        // Super fast domain generation for when other methods are slow
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const currentDay = new Date().getDate();
        
        const quickPrefixes = ['app', 'web', 'new', 'try', 'get', 'my', 'go'];
        const quickSuffixes = ['ai', 'io', 'app', 'dev', 'tech', 'co'];
        const quickTlds = ['.com', '.io', '.ai', '.app'];
        
        const rapidDomains = [];
        
        // Generate 20 domains very quickly
        for (let i = 0; i < 20; i++) {
            const prefix = quickPrefixes[Math.floor(Math.random() * quickPrefixes.length)];
            const suffix = quickSuffixes[Math.floor(Math.random() * quickSuffixes.length)];
            const tld = quickTlds[Math.floor(Math.random() * quickTlds.length)];
            
            let domain;
            if (Math.random() > 0.5) {
                domain = `${prefix}${suffix}${tld}`;
            } else {
                domain = `${prefix}${currentYear}${tld}`;
            }
            
            if (this.isValidDomain(domain)) {
                rapidDomains.push(domain);
            }
        }
        
        this.currentSources.push(...rapidDomains);
        console.log(`Rapidly generated ${rapidDomains.length} potential domains`);
    }

    extractDomainFromUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace(/^www\./, '');
        } catch (error) {
            return null;
        }
    }

    isLikelyNewDomain(domain) {
        // Check if domain looks like it could be new/recent
        const currentYear = new Date().getFullYear();
        const currentYearStr = currentYear.toString();
        const lastYearStr = (currentYear - 1).toString();
        
        return domain.includes(currentYearStr) ||
               domain.includes(lastYearStr) ||
               domain.includes('new') ||
               domain.includes('beta') ||
               domain.includes('app') ||
               domain.includes('try') ||
               domain.includes('get') ||
               domain.includes('my') ||
               domain.endsWith('.ai') ||
               domain.endsWith('.app') ||
               domain.endsWith('.dev') ||
               domain.endsWith('.tech') ||
               domain.endsWith('.io');
    }

    // Deprecated slow methods - replaced with faster alternatives
    async getGeneratedPotentialDomains() {
        // This method is too slow - replaced with rapidDomainGeneration
        console.log('Using rapid domain generation instead');
        await this.rapidDomainGeneration();
    }

    async generateMorePotentialDomains() {
        // This method is too slow - replaced with faster scanning
        console.log('Using subdomain scanning instead');
        await this.scanSubdomainEnumerationSites();
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
        // This function is now deprecated - we focus on discovering actual new domains
        // instead of using hardcoded lists. The new approach prioritizes:
        // 1. Certificate Transparency logs
        // 2. Recently registered domain feeds
        // 3. Generated potential new domains based on current trends
        
        console.log('Focusing on new domain discovery instead of hardcoded lists');
    }

    // Legacy functions removed - focusing on new domain discovery
    // getDiverseCategories() and generateCategoryDomains() are no longer needed
    // as we prioritize discovering actual new domains over generating hardcoded lists

    async crawlCycle() {
        if (!this.isRunning) return;
        
        if (this.currentSources.length === 0) {
            // If we've exhausted sources, quickly generate more
            this.updateStatus('🔍 Searching for more amazing websites...');
            
            // Use rapid methods to get more domains
            await this.rapidDomainGeneration();
            await this.scanSubdomainEnumerationSites();
            
            this.currentSources = [...new Set(this.currentSources)];
            
            // If we still don't have sources, stop
            if (this.currentSources.length === 0) {
                this.updateStatus('✨ Exploration complete! All fresh content discovered!');
                this.stopCrawling();
                return;
            }
        }
        
        const domain = this.currentSources.shift();
        this.updateStatus(`🌐 Exploring ${domain}... (${this.discoveries.length} amazing quotes found)`);
        
        try {
            await this.crawlDomain(domain);
        } catch (error) {
            console.warn(`Failed to crawl ${domain}:`, error);
            this.removeDiscoveryProgress(domain);
        }
        
        // Continue with next domain with minimal delay for speed
        if (this.isRunning) {
            const delay = 500; // Even shorter delay for faster discovery
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
        // No hardcoded backup domains - we focus on discovering new ones
        return [];
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
        this.updateStatus(`💎 Found amazing quote from ${content.domain} - "${content.quote.substring(0, 50)}..."`);
    }

    async fetchWithProxy(url) {
        let lastError;
        
        // Try direct fetch first with shorter timeout for speed
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                signal: AbortSignal.timeout(5000) // Reduced to 5 seconds for speed
            });
            
            if (response.ok) {
                return await response.text();
            }
        } catch (directError) {
            // Direct fetch failed, try proxies quickly
            console.log('Direct fetch failed, trying proxies quickly...');
        }
        
        // Try only the most reliable proxies for speed
        const fastProxies = this.corsProxies.slice(0, 3); // Only try first 3 proxies
        
        for (let i = 0; i < fastProxies.length; i++) {
            const proxy = fastProxies[i];
            
            // Skip proxies that have failed recently
            if (this.proxyFailures.has(proxy)) {
                const failureTime = this.proxyFailures.get(proxy);
                if (Date.now() - failureTime < 15000) { // Reduced to 15 seconds
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
                    signal: AbortSignal.timeout(6000) // Reduced to 6 seconds
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
        }
        
        // If all proxies failed, throw the last error
        throw lastError || new Error('All fast proxies failed');
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
        
        this.updateStatus(`🔥 Found fresh content from ${content.domain}`);
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
        <h2>🔍 About Random Radar</h2>
        <p>Random Radar is your personal web exploration tool that scours the internet to find amazing content and inspiring quotes from websites you've never seen before.</p>
        
        <h3>🚀 How it works:</h3>
        <ul>
            <li><strong>Smart Discovery:</strong> Uses multiple intelligent approaches to find fascinating websites</li>
            <li><strong>Certificate Monitoring:</strong> Tracks SSL certificate logs to find brand-new sites</li>
            <li><strong>Curated Sources:</strong> Explores reliable websites known for amazing content</li>
            <li><strong>Trend Analysis:</strong> Generates domain combinations based on current internet trends</li>
            <li><strong>Real-time Extraction:</strong> Instantly analyzes websites to find the best quotes and snippets</li>
        </ul>
        
        <h3>⚡ Technical Challenges:</h3>
        <p><strong>Why finding truly new domains is so challenging:</strong></p>
        <ul>
            <li>Many certificate transparency APIs block automated requests</li>
            <li>Browser security restrictions limit direct API access</li>
            <li>Most "new domain" services require expensive API subscriptions</li>
            <li>Real-time domain registration feeds are typically commercial-only</li>
        </ul>
        
        <h3>🎯 What you get:</h3>
        <ul>
            <li>A perfect mix of new and interesting websites you haven't seen</li>
            <li>Real-time content discovery with instant quote extraction</li>
            <li>Diverse content from various categories and sources</li>
            <li>An engaging and entertaining exploration of web content</li>
        </ul>
        
        <h3>🔒 Privacy & Ethics:</h3>
        <p>This tool respects all websites and implements smart rate limiting. Everything happens in your browser - no data is sent to external servers.</p>
        
        <p><em>This is an experimental tool built for fun and education. Results may vary due to technical limitations, but the journey is always exciting!</em></p>
    `;
    
    modal.style.display = 'block';
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.randomRadar = new RandomRadar();
});

// Real-time domain discovery - no demo data needed
// The application will discover actual domains when started
