from flask import Flask, render_template, jsonify
import requests
import json
import random
import time
from datetime import datetime, timedelta
import re
from urllib.parse import urljoin, urlparse
import sqlite3
import threading
from bs4 import BeautifulSoup
import ssl
import socket
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging

# Logging konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

class WebsiteDiscoverer:
    def __init__(self):
        self.discovered_sites = []
        self.quotes_db = 'quotes.db'
        self.init_database()
        self.ct_logs_endpoints = [
            'https://crt.sh/?output=json&q=%.com',
            'https://crt.sh/?output=json&q=%.org',
            'https://crt.sh/?output=json&q=%.net'
        ]
        
    def init_database(self):
        """Datenbank für Zitate initialisieren"""
        conn = sqlite3.connect(self.quotes_db)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS quotes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                website TEXT NOT NULL,
                quote TEXT NOT NULL,
                discovered_at TEXT NOT NULL,
                is_new INTEGER DEFAULT 1
            )
        ''')
        conn.commit()
        conn.close()
        
    def discover_from_certificate_transparency(self, limit=50):
        """Entdecke neue Websites aus Certificate Transparency Logs"""
        new_domains = set()
        
        try:
            # Abfrage der letzten 24 Stunden
            yesterday = datetime.now() - timedelta(days=1)
            url = f"https://crt.sh/?output=json&q=%.com&after={yesterday.strftime('%Y-%m-%d')}"
            
            logger.info(f"Anfrage an Certificate Transparency: {url}")
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                certificates = response.json()
                logger.info(f"Gefunden {len(certificates)} Zertifikate")
                
                for cert in certificates[:limit]:
                    domain = cert.get('name_value', '')
                    if domain and not domain.startswith('*.'):
                        # Bereinige Domain-Namen
                        domain = domain.strip().lower()
                        if self.is_valid_domain(domain):
                            new_domains.add(domain)
                            
        except Exception as e:
            logger.error(f"Fehler beim Abrufen der Certificate Transparency Logs: {e}")
            
        return list(new_domains)
    
    def is_valid_domain(self, domain):
        """Prüfe ob Domain gültig ist"""
        if not domain or len(domain) < 4:
            return False
        if domain.count('.') < 1:
            return False
        if any(char in domain for char in ['/', '\\', ' ', '\n', '\t']):
            return False
        return True
    
    def discover_from_dns_enumeration(self):
        """Entdecke Websites durch DNS-Enumeration"""
        common_subdomains = ['www', 'blog', 'news', 'shop', 'store', 'api', 'app']
        common_tlds = ['.com', '.org', '.net', '.io', '.co']
        
        new_domains = []
        
        # Generiere zufällige Domain-Namen
        for _ in range(20):
            base_name = ''.join(random.choices('abcdefghijklmnopqrstuvwxyz', k=random.randint(5, 10)))
            tld = random.choice(common_tlds)
            domain = f"{base_name}{tld}"
            
            if self.check_domain_exists(domain):
                new_domains.append(domain)
                
        return new_domains
    
    def check_domain_exists(self, domain):
        """Prüfe ob Domain existiert"""
        try:
            socket.gethostbyname(domain)
            return True
        except socket.gaierror:
            return False
    
    def extract_quotes_from_website(self, url):
        """Extrahiere Zitate von einer Website"""
        quotes = []
        
        try:
            # Stelle sicher, dass URL mit http/https beginnt
            if not url.startswith(('http://', 'https://')):
                url = f'https://{url}'
                
            logger.info(f"Crawling Website: {url}")
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=15, verify=False)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Entferne Skripte und Styles
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Finde potenzielle Zitate
            text_content = soup.get_text()
            
            # Suche nach Zitaten in verschiedenen Formaten
            quote_patterns = [
                r'"([^"]{20,200})"',  # Text in Anführungszeichen
                r'„([^"]{20,200})"',  # Deutsche Anführungszeichen
                r"'([^']{20,200})'",  # Einfache Anführungszeichen
                r'[.!?]\s+([A-Z][^.!?]{20,200}[.!?])',  # Sätze
            ]
            
            for pattern in quote_patterns:
                matches = re.findall(pattern, text_content, re.DOTALL)
                for match in matches:
                    quote = match.strip()
                    if len(quote) > 20 and self.is_good_quote(quote):
                        quotes.append(quote)
                        if len(quotes) >= 5:  # Maximal 5 Zitate pro Website
                            break
                if quotes:
                    break
                    
        except Exception as e:
            logger.error(f"Fehler beim Crawlen von {url}: {e}")
            
        return quotes
    
    def is_good_quote(self, quote):
        """Prüfe ob Zitat gut ist"""
        # Filtere schlechte Zitate aus
        bad_indicators = [
            'cookie', 'privacy', 'terms', 'conditions', 'javascript',
            'error', '404', 'not found', 'loading', 'click here',
            'menu', 'navigation', 'footer', 'header', 'sidebar'
        ]
        
        quote_lower = quote.lower()
        for indicator in bad_indicators:
            if indicator in quote_lower:
                return False
                
        # Prüfe auf minimale Qualität
        if len(quote.split()) < 5:
            return False
            
        return True
    
    def save_quote(self, website, quote):
        """Speichere Zitat in Datenbank"""
        conn = sqlite3.connect(self.quotes_db)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO quotes (website, quote, discovered_at)
            VALUES (?, ?, ?)
        ''', (website, quote, datetime.now().isoformat()))
        conn.commit()
        conn.close()
    
    def get_recent_quotes(self, limit=10):
        """Hole aktuelle Zitate aus Datenbank"""
        conn = sqlite3.connect(self.quotes_db)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT website, quote, discovered_at 
            FROM quotes 
            ORDER BY discovered_at DESC 
            LIMIT ?
        ''', (limit,))
        quotes = cursor.fetchall()
        conn.close()
        return quotes
    
    def discover_and_crawl(self):
        """Hauptmethode zum Entdecken und Crawlen"""
        logger.info("Starte Website-Entdeckung...")
        
        # Entdecke neue Domains
        new_domains = self.discover_from_certificate_transparency(limit=30)
        
        # Fallback auf DNS-Enumeration wenn CT nicht funktioniert
        if not new_domains:
            new_domains = self.discover_from_dns_enumeration()
            
        logger.info(f"Gefunden {len(new_domains)} neue Domains")
        
        # Crawle Websites parallel
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_domain = {
                executor.submit(self.extract_quotes_from_website, domain): domain 
                for domain in new_domains[:10]  # Limitiere auf 10 Domains
            }
            
            for future in as_completed(future_to_domain):
                domain = future_to_domain[future]
                try:
                    quotes = future.result()
                    if quotes:
                        # Speichere bestes Zitat
                        best_quote = max(quotes, key=len)
                        self.save_quote(domain, best_quote)
                        logger.info(f"Zitat gespeichert von {domain}")
                except Exception as e:
                    logger.error(f"Fehler beim Verarbeiten von {domain}: {e}")

# Globale Instanz
discoverer = WebsiteDiscoverer()

@app.route('/')
def index():
    """Hauptseite"""
    quotes = discoverer.get_recent_quotes(limit=20)
    return render_template('index.html', quotes=quotes)

@app.route('/api/discover')
def api_discover():
    """API Endpoint zum Starten der Entdeckung"""
    def run_discovery():
        discoverer.discover_and_crawl()
    
    # Starte Entdeckung in separatem Thread
    threading.Thread(target=run_discovery, daemon=True).start()
    
    return jsonify({
        'status': 'started',
        'message': 'Website-Entdeckung gestartet'
    })

@app.route('/api/quotes')
def api_quotes():
    """API Endpoint für aktuelle Zitate"""
    quotes = discoverer.get_recent_quotes(limit=20)
    return jsonify([{
        'website': quote[0],
        'quote': quote[1],
        'discovered_at': quote[2]
    } for quote in quotes])

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
