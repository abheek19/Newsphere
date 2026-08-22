#!/usr/bin/env python3
"""
NewsSphere / Apex Chronicle - Python Production Server
Serves static assets, provides REST API endpoints, Google Sheets CSV proxy, and N8N webhook receiver.
"""

import http.server
import socketserver
import os
import json
import urllib.request
import urllib.parse
import urllib.error
import mimetypes
import re
from datetime import datetime

PORT = int(os.environ.get("PORT", 3000))
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")

# Mime types
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("application/json", ".json")

# In-memory news cache
NEWS_DATABASE = []

def load_default_articles():
    global NEWS_DATABASE
    json_path = os.path.join(PUBLIC_DIR, "data", "news-default.json")
    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                NEWS_DATABASE = json.load(f)
                print(f"[Python Server] Successfully loaded {len(NEWS_DATABASE)} default news articles.")
        except Exception as e:
            print(f"[Python Server] Failed to load {json_path}: {e}")

load_default_articles()


class NewsSphereHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Cache-Control", "no-cache, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Healthcheck
        if path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "healthy",
                "service": "NewsSphere Python Server",
                "total_articles": len(NEWS_DATABASE),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }).encode("utf-8"))
            return

        # News REST API
        if path == "/api/news":
            category = query.get("category", ["all"])[0]
            search_query = query.get("q", [""])[0].lower().strip()
            
            results = list(NEWS_DATABASE)
            if category and category != "all":
                results = [a for a in results if category.lower() in a.get("Category", "").lower()]
            
            if search_query:
                results = [
                    a for a in results if (
                        search_query in a.get("Headline", "").lower() or
                        search_query in a.get("Author", "").lower() or
                        search_query in a.get("Category", "").lower()
                    )
                ]

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "total": len(results),
                "articles": results
            }).encode("utf-8"))
            return

        # Google Sheets Proxy
        if path == "/api/sync/sheet":
            sheet_url = query.get("url", [""])[0]
            if not sheet_url:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing 'url' parameter"}).encode("utf-8"))
                return

            try:
                req = urllib.request.Request(
                    sheet_url,
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    csv_data = response.read().decode("utf-8", errors="replace")
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "url": sheet_url,
                    "csv": csv_data
                }).encode("utf-8"))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Failed to fetch Google Sheet: {str(e)}"}).encode("utf-8"))
                return

        # Static assets
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else ""

        # N8N Inbound Webhook
        if path == "/api/webhook/news":
            try:
                payload = json.loads(body) if body else {}
                items = payload if isinstance(payload, list) else payload.get("articles", [payload])
                added = 0
                for item in items:
                    obj = item.get("json", item)
                    if obj.get("Headline") or obj.get("headline"):
                        NEWS_DATABASE.insert(0, {
                            "id": f"webhook-{int(datetime.utcnow().timestamp())}-{added}",
                            "Headline": obj.get("Headline") or obj.get("headline"),
                            "Image URL": obj.get("Image URL") or obj.get("imageUrl") or "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
                            "Author": obj.get("Author") or obj.get("author") or "N8N News Desk",
                            "Article URL": obj.get("Article URL") or obj.get("articleUrl") or "#",
                            "Category": obj.get("Category") or obj.get("category") or "General News",
                            "Date": obj.get("Date") or datetime.utcnow().strftime("%Y-%m-%d"),
                            "Summary": obj.get("Summary") or obj.get("Headline") or "",
                            "Source": "N8N Webhook"
                        })
                        added += 1

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "added": added,
                    "total": len(NEWS_DATABASE)
                }).encode("utf-8"))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
                return

        self.send_response(404)
        self.end_headers()


def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), NewsSphereHandler) as httpd:
        print(f"🌐 NewsSphere Python Server running on port {PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            httpd.server_close()

if __name__ == "__main__":
    run_server()
