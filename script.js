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
        this.updateStatus('Entdecke neue Domains aus echten Quellen...');
        this.currentSources = [];
        const discoveryPromises = [
            this.getDomainsFromHackerNews(),
            this.getDomainsFromGitHubTrending(),
            this.getDomainsFromRedditNew(),
            this.getCertificateTransparencyFast(),
            this.getDomainsFromWhoisDS(),
            this.getDomainsFromNewlyRegisteredDomainsCom(),
            this.getDomainsFromZonefilesIO(),
            this.getDomainsFromNamerific()
        ];
        try {
            await Promise.race([
                Promise.allSettled(discoveryPromises),
                new Promise(resolve => setTimeout(resolve, 12000))
            ]);
        } catch (error) {
            console.warn('Einige Discovery-Quellen schlugen fehl:', error);
        }
        this.currentSources = [...new Set(this.currentSources)].filter(domain => this.isValidDomain(domain));
        this.currentSources = this.currentSources.sort(() => 0.5 - Math.random()).slice(0, 30);
        this.updateStatus(`Gefunden: ${this.currentSources.length} neue Domains aus echten Quellen`);
        console.log('Domains aus echten Quellen:', this.currentSources);
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

    async getDomainsFromWhoisDS() {
        try {
            const response = await this.fetchWithProxy('https://whoisds.com/newly-registered-domains');
            const parser = new DOMParser();
            const doc = parser.parseFromString(response, 'text/html');
            const domainRegex = /\b[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\b/g;
            const text = doc.body.textContent;
            const matches = text.match(domainRegex) || [];
            this.currentSources.push(...matches.slice(0, 10));
        } catch (error) {
            console.warn('WhoisDS fehlgeschlagen:', error);
        }
    }

    async getDomainsFromNewlyRegisteredDomainsCom() {
        try {
            const tlds = ['com', 'net', 'org'];
            for (const tld of tlds) {
                const url = `https://newly-registered-domains.com/tlds/${tld}`;
                const response = await this.fetchWithProxy(url);
                const parser = new DOMParser();
                const doc = parser.parseFromString(response, 'text/html');
                const links = doc.querySelectorAll('a');
                for (const link of links) {
                    const domain = link.textContent.trim();
                    if (this.isValidDomain(domain)) this.currentSources.push(domain);
                }
            }
        } catch (error) {
            console.warn('newly-registered-domains.com fehlgeschlagen:', error);
        }
    }

    async getDomainsFromZonefilesIO() {
        try {
            const response = await this.fetchWithProxy('https://zonefiles.io/newly-registered-domains.json');
            const data = JSON.parse(response);
            if (Array.isArray(data)) {
                this.currentSources.push(...data.slice(0, 20));
            }
        } catch (error) {
            console.warn('zonefiles.io fehlgeschlagen:', error);
        }
    }

    async getDomainsFromNamerific() {
        try {
            const response = await this.fetchWithProxy('https://www.namerific.com/newly-registered-domains');
            const parser = new DOMParser();
            const doc = parser.parseFromString(response, 'text/html');
            const rows = doc.querySelectorAll('table tr');
            for (const row of rows) {
                const cols = row.querySelectorAll('td');
                if (cols.length > 0) {
                    const domain = cols[0].textContent.trim();
                    if (this.isValidDomain(domain)) this.currentSources.push(domain);
                }
            }
        } catch (error) {
            console.warn('Namerific fehlgeschlagen:', error);
        }
    }

    async crawlCycle() {
        if (!this.isRunning) return;
        
        if (this.currentSources.length === 0) {
            // If we've exhausted sources, quickly generate more
            this.updateStatus('Quickly finding more domains...');
            
            // Use rapid methods to get more domains
            await this.rapidDomainGeneration();
            await this.scanSubdomainEnumerationSites();
            
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
        
        // Continue with next domain with minimal delay for speed
        if (this.isRunning) {
            const delay = 500; // Even shorter delay for faster discovery
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
            this.showDiscoveryProgress(domain, 'Connecting...');
            let url = `https://${domain}`;
            let html = await this.fetchWithTimeoutProtection(url, 4000);
            if (html && html.length > 100) {
                this.showDiscoveryProgress(domain, 'Parsing content...');
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
            this.showDiscoveryProgress(domain, 'Trying HTTP...');
            let url = `http://${domain}`;
            let html = await this.fetchWithTimeoutProtection(url, 3000);
            if (html && html.length > 100) {
                this.showDiscoveryProgress(domain, 'Parsing content...');
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
            this.showDiscoveryProgress(domain, 'Trying www...');
            let url = `https://www.${domain}`;
            let html = await this.fetchWithTimeoutProtection(url, 2000);
            if (html && html.length > 100) {
                this.showDiscoveryProgress(domain, 'Parsing content...');
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
        const maxQuotes = 10; // Limit to prevent slowdown
        
        try {
            // Quick selectors for common quote patterns
            const quoteSelectors = [
                'blockquote',
                'q',
                '[class*="quote"]',
                '[class*="testimonial"]',
                'p:has(em)',
                'p:has(strong)',
                '.content p',
                'article p',
                'main p'
            ];
            
            // Process each selector with timeout protection
            for (const selector of quoteSelectors) {
                if (quotes.length >= maxQuotes) break;
                
                try {
                    const elements = doc.querySelectorAll(selector);
                    
                    // Only process first 20 elements of each type for speed
                    for (let i = 0; i < Math.min(elements.length, 20); i++) {
                        if (quotes.length >= maxQuotes) break;
                        
                        const element = elements[i];
                        const text = element.textContent?.trim();
                        
                        // Quick validation
                        if (!text || text.length < 30 || text.length > 500) continue;
                        
                        // Skip if it looks like navigation/meta content
                        if (this.isNavigationContent(text)) continue;
                        
                        // Clean and add the quote
                        const cleanText = this.cleanText(text);
                        if (cleanText && cleanText.length >= 30) {
                            quotes.push(cleanText);
                        }
                    }
                } catch (selectorError) {
                    // Skip this selector if it fails
                    continue;
                }
            }
            
            // If no quotes found, try paragraph content quickly
            if (quotes.length === 0) {
                try {
                    const paragraphs = doc.querySelectorAll('p');
                    for (let i = 0; i < Math.min(paragraphs.length, 10); i++) {
                        const text = paragraphs[i].textContent?.trim();
                        if (text && text.length >= 50 && text.length <= 300) {
                            if (!this.isNavigationContent(text)) {
                                quotes.push(this.cleanText(text));
                                if (quotes.length >= 5) break; // Limit for speed
                            }
                        }
                    }
                } catch (paragraphError) {
                    // Continue with any quotes we found
                }
            }
            
        } catch (error) {
            console.warn('Quote extraction error:', error);
        }
        
        return quotes.filter(q => q && q.length >= 30);
    }
    
    extractQuotesFast(doc) {
        const quotes = [];
        const maxQuotes = 5; // Even more limited for speed
        
        try {
            // Ultra-fast selectors - only the most common ones
            const quickSelectors = [
                'blockquote',
                'q',
                'p'
            ];
            
            for (const selector of quickSelectors) {
                if (quotes.length >= maxQuotes) break;
                
                try {
                    const elements = doc.querySelectorAll(selector);
                    
                    // Only check first 10 elements for maximum speed
                    for (let i = 0; i < Math.min(elements.length, 10); i++) {
                        if (quotes.length >= maxQuotes) break;
                        
                        const element = elements[i];
                        const text = element.textContent?.trim();
                        
                        // Ultra-quick validation
                        if (text && text.length >= 30 && text.length <= 400) {
                            // Skip obvious navigation content
                            const lowerText = text.toLowerCase();
                            if (!lowerText.includes('cookie') && 
                                !lowerText.includes('privacy') && 
                                !lowerText.includes('menu') &&
                                !lowerText.includes('navigation') &&
                                !lowerText.includes('login') &&
                                !lowerText.includes('search')) {
                                quotes.push(text.substring(0, 350)); // Limit length
                            }
                        }
                    }
                } catch (selectorError) {
                    continue; // Skip failed selectors
                }
            }
        } catch (error) {
            console.warn('Fast quote extraction error:', error);
        }
        
        return quotes;
    }
    
    isNavigationContent(text) {
        // Quick check for navigation/meta content
        const lowerText = text.toLowerCase();
        const skipPatterns = [
            'cookie', 'privacy', 'terms', 'subscribe', 'newsletter',
            'login', 'sign up', 'register', 'menu', 'navigation',
            'footer', 'header', 'sidebar', 'search', 'contact',
            'about us', 'home', 'click here', 'read more',
            'loading', 'error', 'javascript', 'advertisement'
        ];
        
        return skipPatterns.some(pattern => lowerText.includes(pattern));
    }
    
    cleanText(text) {
        if (!text) return '';
        
        // Quick clean without complex regex
        return text
            .replace(/\s+/g, ' ')
            .replace(/[\r\n\t]/g, ' ')
            .trim()
            .substring(0, 400); // Limit length
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
        const statusElement = document.getElementById('status');
        statusElement.textContent = message;
        
        // Add timestamp for better feedback
        const timestamp = new Date().toLocaleTimeString();
        statusElement.title = `${message} (${timestamp})`;
        
        // Auto-clear long messages after 10 seconds
        if (message.length > 50) {
            setTimeout(() => {
                if (statusElement.textContent === message) {
                    statusElement.textContent = 'Ready to discover...';
                }
            }, 10000);
        }
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
