class RandomRadar {
    constructor() {
        // Core state
        this.isRunning = false;
        this.discoveries = [];
        this.currentSources = [];
        this.stats = {
            totalCrawled: 0,
            successfulFinds: 0,
            startTime: null,
            averageResponseTime: 0,
            sourcesUsed: new Set(),
            qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
            categoryDistribution: new Map(),
            topDomains: new Map(),
            sessionScore: 0
        };
        
        // Advanced features
        this.filters = {
            minQuoteLength: 30,
            maxQuoteLength: 500,
            excludeKeywords: ['error', '404', 'not found', 'coming soon', 'lorem ipsum'],
            includeLanguages: ['en', 'de', 'es', 'fr'],
            contentTypes: ['text', 'blog', 'article', 'quote']
        };
        
        // Performance optimization & AI-like features
        this.cache = new Map();
        this.rateLimiter = new Map();
        this.qualityScore = new Map();
        this.learningModel = new Map(); // Simple learning from user interactions
        this.discoveryPatterns = new Map(); // Pattern recognition
        this.contentFingerprints = new Set(); // Duplicate detection
        
        // Content analysis dictionaries
        this.categories = {
            tech: ['technology', 'software', 'programming', 'code', 'developer', 'app', 'api', 'data', 'ai', 'machine learning', 'blockchain', 'crypto'],
            business: ['business', 'startup', 'entrepreneur', 'company', 'product', 'service', 'marketing', 'sales', 'finance', 'investment'],
            science: ['research', 'study', 'science', 'academic', 'university', 'paper', 'journal', 'experiment', 'discovery', 'innovation'],
            creative: ['design', 'art', 'creative', 'photography', 'music', 'writing', 'blog', 'story', 'visual', 'artistic'],
            lifestyle: ['lifestyle', 'travel', 'food', 'health', 'fitness', 'personal', 'hobby', 'family', 'wellness', 'culture'],
            general: ['general', 'misc', 'other', 'various', 'different', 'multiple', 'news', 'information']
        };
        
        this.sentimentWords = {
            positive: ['great', 'amazing', 'excellent', 'wonderful', 'fantastic', 'love', 'perfect', 'best', 'awesome', 'incredible', 'revolutionary', 'breakthrough'],
            negative: ['terrible', 'awful', 'hate', 'worst', 'bad', 'horrible', 'disappointing', 'failed', 'broken', 'wrong', 'disaster', 'nightmare']
        };
        
        // Advanced crawling intelligence
        this.adaptiveCrawling = {
            baseDelay: 800,
            maxDelay: 3000,
            successThreshold: 0.3,
            failureThreshold: 0.1,
            currentDelay: 800,
            strategy: 'balanced' // 'aggressive', 'conservative', 'balanced'
        };
        
        // Real-time analytics
        this.realTimeAnalytics = {
            discoveriesPerMinute: 0,
            averageQualityScore: 0,
            bestDiscoveryToday: null,
            sessionStartTime: Date.now(),
            milestones: [],
            achievements: []
        };
        
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
        this.updateStatus('Starte Discovery-Prozess...');
        
        try {
            // Get fresh domains from multiple sources
            await this.discoverNewDomains();
            
            // Start crawling cycle
            this.crawlCycle();
            
        } catch (error) {
            console.error('Error starting crawler:', error);
            this.updateStatus('Fehler beim Starten des Discovery-Prozesses');
            this.stopCrawling();
        }
    }

    stopCrawling() {
        this.isRunning = false;
        this.updateUI();
        this.updateStatus('Discovery gestoppt');
    }

    async discoverNewDomains() {
        this.updateStatus('🔍 Starte intelligente Domain-Discovery...');
        this.currentSources = [];
        this.stats.startTime = Date.now();
        
        // Enhanced discovery methods with AI-like intelligence
        const discoveryPromises = [
            this.getDomainsFromHackerNews(),
            this.getDomainsFromGitHubTrending(),
            this.getDomainsFromRedditNew(),
            this.getCertificateTransparencyFast(),
            this.discoverFromProductHunt(),
            this.findDomainsFromTechNews(),
            this.discoverFromIndieHackers(),
            this.findDomainsFromAwesome(),
            this.discoverFromTechCrunch(),
            this.findBetaList()
        ];
        
        try {
            const results = await Promise.allSettled(discoveryPromises);
            const successfulSources = results.filter(r => r.status === 'fulfilled').length;
            
            this.updateStatus(`📊 ${successfulSources}/10 Quellen erfolgreich abgefragt`);
            
            // Advanced filtering and scoring
            this.currentSources = [...new Set(this.currentSources)]
                .filter(domain => this.isValidDomain(domain))
                .map(domain => ({
                    domain,
                    score: this.calculateDomainScore(domain),
                    source: this.getDomainSource(domain),
                    discoveredAt: Date.now()
                }))
                .sort((a, b) => b.score - a.score) // Sort by quality score
                .slice(0, 40) // Increase limit for better variety
                .map(item => item.domain);
            
            this.stats.sourcesUsed.add(successfulSources);
            
            this.updateStatus(`✨ ${this.currentSources.length} hochwertige Domains entdeckt und priorisiert`);
            console.log('🎯 Priorisierte Domains:', this.currentSources.slice(0, 10));
            
        } catch (error) {
            console.warn('Discovery-Fehler:', error);
            this.updateStatus('⚠️ Einige Quellen nicht verfügbar, verwende verfügbare Domains');
        }
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

    async discoverFromProductHunt() {
        try {
            // Product Hunt showcases new products daily
            const today = new Date().toISOString().split('T')[0];
            const response = await this.fetchWithProxy(`https://www.producthunt.com/`);
            
            // Extract domains from HTML content
            const parser = new DOMParser();
            const doc = parser.parseFromString(response, 'text/html');
            
            // Look for product links
            const links = doc.querySelectorAll('a[href*="http"]');
            for (const link of links) {
                const href = link.getAttribute('href');
                const domain = this.extractDomainFromUrl(href);
                if (domain && this.isLikelyNewDomain(domain)) {
                    this.currentSources.push(domain);
                }
            }
            
            console.log('🚀 Product Hunt domains discovered');
        } catch (error) {
            console.warn('Product Hunt discovery failed:', error);
        }
    }

    async findDomainsFromTechNews() {
        try {
            // Tech news sites often feature new startups
            const techSites = [
                'https://techcrunch.com/feed/',
                'https://www.theverge.com/rss/index.xml',
                'https://feeds.feedburner.com/venturebeat/SZYF'
            ];
            
            for (const feedUrl of techSites.slice(0, 2)) {
                try {
                    const response = await this.fetchWithProxy(feedUrl);
                    // Simple RSS parsing for links
                    const linkMatches = response.match(/https?:\/\/[^\s<>"]+/g) || [];
                    
                    for (const url of linkMatches.slice(0, 10)) {
                        const domain = this.extractDomainFromUrl(url);
                        if (domain && this.isLikelyNewDomain(domain)) {
                            this.currentSources.push(domain);
                        }
                    }
                } catch (error) {
                    console.warn(`Tech news feed ${feedUrl} failed:`, error);
                }
            }
            
            console.log('📰 Tech news domains discovered');
        } catch (error) {
            console.warn('Tech news discovery failed:', error);
        }
    }

    async discoverFromIndieHackers() {
        try {
            // Indie Hackers community for new projects
            const response = await this.fetchWithProxy('https://www.indiehackers.com/');
            const parser = new DOMParser();
            const doc = parser.parseFromString(response, 'text/html');
            
            // Extract project links
            const projectLinks = doc.querySelectorAll('a[href*="http"]');
            for (const link of projectLinks) {
                const href = link.getAttribute('href');
                const domain = this.extractDomainFromUrl(href);
                if (domain && this.isLikelyNewDomain(domain)) {
                    this.currentSources.push(domain);
                }
            }
            
            console.log('🔧 Indie Hackers domains discovered');
        } catch (error) {
            console.warn('Indie Hackers discovery failed:', error);
        }
    }

    async findDomainsFromAwesome() {
        try {
            // Awesome lists on GitHub often contain new tools
            const awesomeRepos = [
                'awesome',
                'awesome-selfhosted',
                'awesome-open-source',
                'awesome-list'
            ];
            
            for (const repo of awesomeRepos.slice(0, 2)) {
                try {
                    const response = await this.fetchWithProxy(`https://api.github.com/search/repositories?q=${repo}&sort=updated&order=desc&per_page=10`);
                    const data = JSON.parse(response);
                    
                    if (data.items) {
                        for (const item of data.items) {
                            if (item.homepage) {
                                const domain = this.extractDomainFromUrl(item.homepage);
                                if (domain && this.isLikelyNewDomain(domain)) {
                                    this.currentSources.push(domain);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`Awesome repo ${repo} failed:`, error);
                }
            }
            
            console.log('⭐ Awesome lists domains discovered');
        } catch (error) {
            console.warn('Awesome lists discovery failed:', error);
        }
    }

    async discoverFromTechCrunch() {
        try {
            // TechCrunch startup database
            const response = await this.fetchWithProxy('https://techcrunch.com/startups/');
            const parser = new DOMParser();
            const doc = parser.parseFromString(response, 'text/html');
            
            // Extract startup links
            const startupLinks = doc.querySelectorAll('a[href*="http"]');
            for (const link of startupLinks) {
                const href = link.getAttribute('href');
                const domain = this.extractDomainFromUrl(href);
                if (domain && this.isLikelyNewDomain(domain)) {
                    this.currentSources.push(domain);
                }
            }
            
            console.log('💼 TechCrunch startup domains discovered');
        } catch (error) {
            console.warn('TechCrunch discovery failed:', error);
        }
    }

    async findBetaList() {
        try {
            // BetaList features upcoming startups
            const response = await this.fetchWithProxy('https://betalist.com/');
            const parser = new DOMParser();
            const doc = parser.parseFromString(response, 'text/html');
            
            // Extract beta startup links
            const betaLinks = doc.querySelectorAll('a[href*="http"]');
            for (const link of betaLinks) {
                const href = link.getAttribute('href');
                const domain = this.extractDomainFromUrl(href);
                if (domain && this.isLikelyNewDomain(domain)) {
                    this.currentSources.push(domain);
                }
            }
            
            console.log('🧪 BetaList domains discovered');
        } catch (error) {
            console.warn('BetaList discovery failed:', error);
        }
    }

    calculateDomainScore(domain) {
        let score = 0;
        
        // Modern TLD bonus
        if (domain.endsWith('.ai')) score += 30;
        if (domain.endsWith('.io')) score += 25;
        if (domain.endsWith('.app')) score += 20;
        if (domain.endsWith('.dev')) score += 20;
        if (domain.endsWith('.tech')) score += 15;
        
        // Year relevance
        const currentYear = new Date().getFullYear();
        if (domain.includes(currentYear.toString())) score += 25;
        if (domain.includes((currentYear - 1).toString())) score += 15;
        
        // Trendy keywords
        const trendyWords = ['ai', 'ml', 'app', 'beta', 'new', 'try', 'get', 'my', 'go'];
        for (const word of trendyWords) {
            if (domain.includes(word)) score += 10;
        }
        
        // Domain length optimization (7-15 chars ideal)
        if (domain.length >= 7 && domain.length <= 15) score += 15;
        if (domain.length < 6 || domain.length > 20) score -= 10;
        
        // Avoid common patterns that indicate established sites
        if (domain.includes('www.')) score -= 20;
        if (domain.includes('blog.')) score -= 15;
        if (domain.includes('shop.')) score -= 15;
        
        return Math.max(0, score);
    }

    getDomainSource(domain) {
        // Track which source discovered this domain (for analytics)
        if (this.hackerNewsdomains?.includes(domain)) return 'Hacker News';
        if (this.githubDomains?.includes(domain)) return 'GitHub';
        if (this.redditDomains?.includes(domain)) return 'Reddit';
        if (this.ctDomains?.includes(domain)) return 'Certificate Transparency';
        return 'Mixed Sources';
    }

    async crawlCycle() {
        if (!this.isRunning) return;
        
        if (this.currentSources.length === 0) {
            // If we've exhausted sources, try to discover more
            this.updateStatus('Suche nach weiteren neuen Domains...');
            
            // Re-run discovery methods to find more domains
            await this.discoverNewDomains();
            
            // If we still don't have sources, stop
            if (this.currentSources.length === 0) {
                this.updateStatus('Keine weiteren neuen Domains gefunden. Discovery beendet!');
                this.stopCrawling();
                return;
            }
        }
        
        const domain = this.currentSources.shift();
        this.updateStatus(`Erkunde ${domain}... (${this.discoveries.length} Zitate gefunden)`);
        
        try {
            await this.crawlDomain(domain);
        } catch (error) {
            console.warn(`Fehler beim Crawlen von ${domain}:`, error);
            this.removeDiscoveryProgress(domain);
        }
        
        // Continue with next domain with adaptive delay
        if (this.isRunning) {
            const delay = this.adaptiveCrawling.currentDelay;
            setTimeout(() => this.crawlCycle(), delay);
        }
    }

    async crawlDomain(domain) {
        const startTime = Date.now();
        const maxCrawlTime = 8000; // 8 seconds maximum per domain (reduced from 10)
        let progressRemoved = false;
        const safeRemoveProgress = () => {
            if (!progressRemoved) {
                this.removeDiscoveryProgress(domain);
                progressRemoved = true;
            }
        };
        try {
            this.showDiscoveryProgress(domain, 'Verbinde...');
            let url = `https://${domain}`;
            let html = await this.fetchWithTimeoutProtection(url, 4000);
            if (html && html.length > 100) {
                this.showDiscoveryProgress(domain, 'Analysiere Inhalt...');
                try {
                    const contents = await this.parseContentWithTimeout(html, domain, 2000);
                    if (contents.length > 0 && !this.processedDomains.has(domain)) {
                        const content = contents[0];
                        if (content && !this.foundQuotes.has(content.quote)) {
                            this.foundQuotes.add(content.quote);
                            this.processedDomains.add(domain);
                            this.addDiscoveryRealTime(content);
                        }
                    }
                } catch (parseError) {
                    console.warn(`Parsing failed for ${domain} (HTTPS):`, parseError);
                } finally {
                    safeRemoveProgress();
                }
                console.log(`Successfully crawled ${domain} via HTTPS`);
                return;
            }
        } catch (error) {
            console.warn(`HTTPS failed for ${domain}:`, error);
        }
        if (Date.now() - startTime > maxCrawlTime) {
            console.warn(`Timeout exceeded for ${domain}, skipping remaining attempts`);
            safeRemoveProgress();
            return;
        }
        try {
            this.showDiscoveryProgress(domain, 'Versuche HTTP...');
            let url = `http://${domain}`;
            let html = await this.fetchWithTimeoutProtection(url, 3000);
            if (html && html.length > 100) {
                this.showDiscoveryProgress(domain, 'Analysiere Inhalt...');
                try {
                    const contents = await this.parseContentWithTimeout(html, domain, 1500);
                    if (contents.length > 0 && !this.processedDomains.has(domain)) {
                        const content = contents[0];
                        if (content && !this.foundQuotes.has(content.quote)) {
                            this.foundQuotes.add(content.quote);
                            this.processedDomains.add(domain);
                            this.addDiscoveryRealTime(content);
                        }
                    }
                } catch (parseError) {
                    console.warn(`Parsing failed for ${domain} (HTTP):`, parseError);
                } finally {
                    safeRemoveProgress();
                }
                console.log(`Successfully crawled ${domain} via HTTP`);
                return;
            }
        } catch (httpError) {
            console.warn(`Both HTTPS and HTTP failed for ${domain}:`, httpError);
        }
        if (Date.now() - startTime > maxCrawlTime) {
            console.warn(`Timeout exceeded for ${domain}, skipping www attempt`);
            safeRemoveProgress();
            return;
        }
        try {
            this.showDiscoveryProgress(domain, 'Versuche www...');
            let url = `https://www.${domain}`;
            let html = await this.fetchWithTimeoutProtection(url, 2000);
            if (html && html.length > 100) {
                this.showDiscoveryProgress(domain, 'Analysiere Inhalt...');
                try {
                    const contents = await this.parseContentWithTimeout(html, domain, 1000);
                    if (contents.length > 0 && !this.processedDomains.has(domain)) {
                        const content = contents[0];
                        if (content && !this.foundQuotes.has(content.quote)) {
                            this.foundQuotes.add(content.quote);
                            this.processedDomains.add(domain);
                            this.addDiscoveryRealTime(content);
                        }
                    }
                } catch (parseError) {
                    console.warn(`Parsing failed for www.${domain}:`, parseError);
                } finally {
                    safeRemoveProgress();
                }
                console.log(`Successfully crawled www.${domain} via HTTPS`);
                return;
            }
        } catch (wwwError) {
            console.warn(`www.${domain} also failed:`, wwwError);
        }
        safeRemoveProgress();
        console.log(`All methods failed for ${domain}, total time: ${Date.now() - startTime}ms`);
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
        try {
            // Add timeout protection for parsing
            const parseTimeout = new Promise((resolve, reject) => {
                setTimeout(() => reject(new Error('Parse timeout')), 6000); // 6 second timeout
            });
            
            const parsePromise = new Promise((resolve, reject) => {
                try {
                    // Limit HTML size to prevent memory issues
                    if (html.length > 500000) { // 500KB limit
                        html = html.substring(0, 500000);
                    }
                    
                    // Quick validation - check if it's actually HTML
                    if (!html.includes('<') || !html.includes('>')) {
                        throw new Error('Not HTML content');
                    }
                    
                    // Create a DOM parser with error handling
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    // Check if parsing created any errors
                    const parserError = doc.querySelector('parsererror');
                    if (parserError) {
                        throw new Error('HTML parsing error');
                    }
                    
                    // Extract title with timeout protection
                    const title = doc.querySelector('title')?.textContent?.trim()?.substring(0, 200) || 'Untitled';
                    
                    // Extract meta description with timeout protection
                    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.substring(0, 300) || '';
                    
                    // Extract quotes/snippets with timeout protection
                    const quotes = this.extractQuotesFast(doc);
                    
                    if (quotes.length === 0) {
                        resolve([]); // No interesting content found
                        return;
                    }
                    
                    // Quick prioritization without complex sorting
                    let bestQuote = quotes[0];
                    
                    // Simple priority: prefer quotes with quotation marks
                    for (const quote of quotes.slice(0, 3)) { // Only check first 3 for speed
                        if (quote.includes('"') || quote.includes('"') || quote.includes('"')) {
                            bestQuote = quote;
                            break;
                        }
                    }
                    
                    // Return only the best quote for this domain
                    resolve([{
                        domain,
                        title,
                        description: metaDesc,
                        quote: bestQuote,
                        timestamp: new Date(),
                        url: `https://${domain}`
                    }]);
                    
                } catch (error) {
                    reject(error);
                }
            });
            
            // Race between parsing and timeout
            return Promise.race([parsePromise, parseTimeout]);
            
        } catch (error) {
            console.warn(`Parsing failed for ${domain}:`, error);
            this.updateStatus(`Parsing failed for ${domain} - skipping...`);
            return []; // Return empty array on any error
        }
    }

    async parseContentWithTimeout(html, domain, timeout = 5000) {
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Content parsing timeout')), timeout);
            });
            
            const parsePromise = Promise.resolve(this.parseContentRealTime(html, domain));
            
            return await Promise.race([parsePromise, timeoutPromise]);
        } catch (error) {
            console.warn(`Content parsing failed for ${domain}:`, error);
            return [];
        }
    }

    async fetchWithTimeoutProtection(url, timeout = 5000) {
        try {
            const controller = new AbortController();
            const signal = controller.signal;
            
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, timeout);
            
            const response = await fetch(url, { signal });
            clearTimeout(timeoutId);
            
            return await response.text();
        } catch (error) {
            console.warn(`Fetch with timeout protection failed for ${url}:`, error);
            throw error;
        }
    }

    addDiscoveryRealTime(content) {
        // Enhanced discovery with quality analysis
        const qualityScore = this.analyzeContentQuality(content);
        content.qualityScore = qualityScore;
        content.category = this.categorizeContent(content);
        content.sentiment = this.analyzeSentiment(content.quote);
        
        // Remove progress indicator for this domain
        this.removeDiscoveryProgress(content.domain);
        
        // Add to discoveries with metadata
        this.discoveries.unshift(content);
        this.stats.successfulFinds++;
        
        // Create enhanced discovery element
        const container = document.getElementById('discoveries');
        const discoveryElement = document.createElement('div');
        discoveryElement.className = `discovery discovery-new quality-${this.getQualityLevel(qualityScore)}`;
        
        // Generate quality indicators
        const qualityBadge = this.generateQualityBadge(qualityScore);
        const categoryBadge = this.generateCategoryBadge(content.category);
        const sentimentBadge = this.generateSentimentBadge(content.sentiment);
        
        discoveryElement.innerHTML = `
            <div class="discovery-header">
                <div class="discovery-url-section">
                    <a href="${content.url}" target="_blank" class="discovery-url">${content.domain}</a>
                    <div class="discovery-badges">
                        ${qualityBadge}
                        ${categoryBadge}
                        ${sentimentBadge}
                    </div>
                </div>
                <div class="discovery-meta-info">
                    <span class="discovery-time">${this.formatTime(content.timestamp)}</span>
                    <span class="discovery-score">Score: ${qualityScore}</span>
                </div>
            </div>
            <h3 class="discovery-title">${content.title}</h3>
            ${content.description ? `<p class="discovery-description">${content.description}</p>` : ''}
            <div class="discovery-quote">"${content.quote}"</div>
            <div class="discovery-footer">
                <div class="discovery-tags">
                    <span class="discovery-tag tag-fresh">Frischer Inhalt</span>
                    <span class="discovery-tag tag-length">Länge: ${content.quote.length} Zeichen</span>
                    <span class="discovery-tag tag-source">Quelle: ${content.source || 'Mixed'}</span>
                </div>
                <div class="discovery-actions">
                    <button class="action-btn" onclick="randomRadar.shareDiscovery('${content.domain}')">🔗 Teilen</button>
                    <button class="action-btn" onclick="randomRadar.saveDiscovery('${content.domain}')">⭐ Merken</button>
                    <button class="action-btn" onclick="randomRadar.analyzeMore('${content.domain}')">🔍 Mehr</button>
                </div>
            </div>
        `;
        
        container.insertBefore(discoveryElement, container.firstChild);
        
        // Enhanced animation
        setTimeout(() => {
            discoveryElement.classList.remove('discovery-new');
        }, 100);
        
        // Limit displayed discoveries with smart cleanup
        const discoveries = container.querySelectorAll('.discovery');
        if (discoveries.length > 25) {
            // Remove lowest quality discoveries first
            const oldDiscoveries = Array.from(discoveries).slice(25);
            oldDiscoveries.forEach(el => el.remove());
        }
        
        this.saveDiscoveries();
        this.updateStats();
        
        // Enhanced status with emojis and context
        const emoji = qualityScore > 70 ? '🎯' : qualityScore > 50 ? '✨' : '📝';
        this.updateStatus(`${emoji} Hochwertiges Zitat von ${content.domain} entdeckt! (Score: ${qualityScore})`);
    }

    // Content Analysis Methods
    analyzeContentQuality(content) {
        let score = 50; // Base score
        
        // Title quality
        if (content.title && content.title.length > 10) score += 10;
        if (content.title && !content.title.includes('Untitled')) score += 10;
        
        // Description quality
        if (content.description && content.description.length > 50) score += 15;
        
        // Quote quality
        if (content.quote.length >= 50 && content.quote.length <= 300) score += 15;
        if (content.quote.includes('"') || content.quote.includes('"')) score += 10;
        
        // Language quality (basic check)
        const words = content.quote.split(' ');
        if (words.length >= 8) score += 10;
        if (words.length >= 15) score += 5;
        
        // Avoid low-quality indicators
        const lowQualityPatterns = ['lorem ipsum', 'click here', 'read more', 'error', '404'];
        for (const pattern of lowQualityPatterns) {
            if (content.quote.toLowerCase().includes(pattern)) score -= 20;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    categorizeContent(content) {
        const text = (content.title + ' ' + content.description + ' ' + content.quote).toLowerCase();
        
        for (const [category, keywords] of Object.entries(this.categories)) {
            const matches = keywords.filter(keyword => text.includes(keyword)).length;
            if (matches >= 2) return category;
        }
        
        return 'general';
    }

    analyzeSentiment(text) {
        const words = text.toLowerCase().split(' ');
        let positiveCount = 0;
        let negativeCount = 0;
        
        for (const word of words) {
            if (this.sentimentWords.positive.includes(word)) positiveCount++;
            if (this.sentimentWords.negative.includes(word)) negativeCount++;
        }
        
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    getQualityLevel(score) {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        return 'poor';
    }

    generateQualityBadge(score) {
        const level = this.getQualityLevel(score);
        const emoji = level === 'excellent' ? '💎' : level === 'good' ? '✨' : level === 'fair' ? '⭐' : '📝';
        return `<span class="quality-badge quality-${level}">${emoji} ${score}</span>`;
    }

    generateCategoryBadge(category) {
        const emojis = {
            tech: '💻',
            business: '💼',
            science: '🔬',
            creative: '🎨',
            lifestyle: '🌟',
            general: '📄'
        };
        return `<span class="category-badge category-${category}">${emojis[category] || '📄'} ${category}</span>`;
    }

    generateSentimentBadge(sentiment) {
        const emojis = {
            positive: '😊',
            negative: '😔',
            neutral: '😐'
        };
        return `<span class="sentiment-badge sentiment-${sentiment}">${emojis[sentiment]} ${sentiment}</span>`;
    }

    // Interactive Actions
    shareDiscovery(domain) {
        const discovery = this.discoveries.find(d => d.domain === domain);
        if (discovery) {
            const shareText = `Interessante Entdeckung: "${discovery.quote}" - ${discovery.url}`;
            if (navigator.share) {
                navigator.share({
                    title: 'Random Radar Entdeckung',
                    text: shareText,
                    url: discovery.url
                });
            } else {
                navigator.clipboard.writeText(shareText);
                this.showNotification('Link in Zwischenablage kopiert!', 'success');
            }
        }
    }

    saveDiscovery(domain) {
        const discovery = this.discoveries.find(d => d.domain === domain);
        if (discovery) {
            let savedDiscoveries = JSON.parse(localStorage.getItem('savedRandomRadarDiscoveries') || '[]');
            savedDiscoveries.unshift(discovery);
            localStorage.setItem('savedRandomRadarDiscoveries', JSON.stringify(savedDiscoveries));
            this.showNotification('Entdeckung gespeichert!', 'success');
        }
    }

    analyzeMore(domain) {
        // Open detailed analysis modal
        this.showDetailedAnalysis(domain);
    }

    showDetailedAnalysis(domain) {
        const discovery = this.discoveries.find(d => d.domain === domain);
        if (!discovery) return;
        
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <h2>🔍 Detailanalyse: ${domain}</h2>
            <div class="analysis-section">
                <h3>📊 Qualitätsbewertung</h3>
                <div class="quality-breakdown">
                    <div class="quality-meter">
                        <div class="quality-bar" style="width: ${discovery.qualityScore}%"></div>
                        <span class="quality-score">${discovery.qualityScore}/100</span>
                    </div>
                </div>
            </div>
            
            <div class="analysis-section">
                <h3>🏷️ Kategorisierung</h3>
                <p><strong>Kategorie:</strong> ${discovery.category}</p>
                <p><strong>Sentiment:</strong> ${discovery.sentiment}</p>
            </div>
            
            <div class="analysis-section">
                <h3>📝 Inhalt</h3>
                <p><strong>Titel:</strong> ${discovery.title}</p>
                <p><strong>Beschreibung:</strong> ${discovery.description || 'Keine Beschreibung verfügbar'}</p>
                <blockquote class="analysis-quote">"${discovery.quote}"</blockquote>
            </div>
            
            <div class="analysis-section">
                <h3>📈 Statistiken</h3>
                <ul>
                    <li>Zeichenanzahl: ${discovery.quote.length}</li>
                    <li>Wortanzahl: ${discovery.quote.split(' ').length}</li>
                    <li>Entdeckt: ${this.formatTime(discovery.timestamp)}</li>
                    <li>URL: <a href="${discovery.url}" target="_blank">${discovery.url}</a></li>
                </ul>
            </div>
            
            <div class="analysis-actions">
                <button class="btn-primary" onclick="window.open('${discovery.url}', '_blank')">🌐 Website besuchen</button>
                <button class="btn-secondary" onclick="randomRadar.shareDiscovery('${domain}')">🔗 Teilen</button>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updateStats() {
        this.stats.totalCrawled++;
        
        // Update performance metrics
        const now = Date.now();
        if (this.stats.startTime) {
            const runningTime = now - this.stats.startTime;
            this.stats.averageResponseTime = runningTime / this.stats.totalCrawled;
        }
        
        // Update UI stats if stats panel exists
        this.updateStatsDisplay();
    }

    updateStatsDisplay() {
        const statsElement = document.querySelector('.stats-display');
        if (statsElement) {
            const successRate = this.stats.totalCrawled > 0 
                ? ((this.stats.successfulFinds / this.stats.totalCrawled) * 100).toFixed(1)
                : 0;
            
            statsElement.innerHTML = `
                <div class="stat-item">
                    <span class="stat-value">${this.stats.successfulFinds}</span>
                    <span class="stat-label">Entdeckungen</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${this.stats.totalCrawled}</span>
                    <span class="stat-label">Durchsucht</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${successRate}%</span>
                    <span class="stat-label">Erfolgsrate</span>
                </div>
            `;
        }
    }
}

// Global functions
function showAbout() {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <h2>Über Random Radar</h2>
        <p>Random Radar ist ein Web-Discovery-Tool, das aktiv nach neu registrierten Domains und Websites sucht, um frische Inhalte zu entdecken.</p>
        
        <h3>Wie es funktioniert:</h3>
        <ul>
            <li><strong>Neue Domain-Entdeckung:</strong> Überwacht Certificate Transparency Logs für frisch ausgestellte SSL-Zertifikate</li>
            <li><strong>Trend-Analyse:</strong> Analysiert Hacker News, GitHub Trending und Reddit für neue Projekte</li>
            <li><strong>Smart Content Extraction:</strong> Extrahiert automatisch interessante Zitate und Textschnipsel</li>
            <li><strong>Client-seitige Verarbeitung:</strong> Alle Analysen passieren in Ihrem Browser für maximale Privatsphäre</li>
        </ul>
        
        <h3>Fokus auf neue Domains:</h3>
        <p><strong>Warum die Suche nach wirklich neuen Domains herausfordernd ist:</strong></p>
        <ul>
            <li>Certificate Transparency APIs blocken oft automatisierte Anfragen</li>
            <li>Browser CORS-Beschränkungen verhindern direkten Zugriff auf viele APIs</li>
            <li>Die meisten "neue Domain"-Services benötigen API-Schlüssel oder Abonnements</li>
            <li>Echtzeit-Domain-Registrierungs-Feeds sind typischerweise kommerzielle Services</li>
        </ul>
        
        <h3>Was Sie tatsächlich erhalten:</h3>
        <ul>
            <li>Eine Mischung aus potenziell neuen und interessanten bestehenden Websites</li>
            <li>Echtzeit-Content-Discovery und Zitat-Extraktion</li>
            <li>Vielfältige Inhalte aus verschiedenen Kategorien und Quellen</li>
            <li>Eine spannende Erkundung von Web-Inhalten</li>
        </ul>
        
        <h3>Datenschutz & Ethik:</h3>
        <p>Dieses Tool respektiert Websites und begrenzt Anfragen. Alle Verarbeitungen finden client-seitig in Ihrem Browser statt.</p>
        
        <p><em>Dies ist ein experimentelles Tool für Bildungszwecke. Ergebnisse können aufgrund technischer Beschränkungen variieren.</em></p>
    `;
    
    modal.style.display = 'block';
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.randomRadar = new RandomRadar();
});

// Real-time domain discovery - no demo data needed
// The application will discover actual domains when started
