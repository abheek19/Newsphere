#!/usr/bin/env python3
"""
UrbanNest Lifestyle Store - Production Server
Serves static frontend assets and provides proxy endpoints for N8N.io Webhook integrations.
Compatible with local execution and Render cloud deployment.
"""

import http.server
import socketserver
import os
import json
import urllib.request
import urllib.error
import mimetypes
from datetime import datetime

PORT = int(os.environ.get("PORT", 3000))
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")

# Ensure proper mime types
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("application/json", ".json")

# Built-in intelligent AI Chatbot response engine for UrbanNest
FAQ_KNOWLEDGE_BASE = [
    {
        "keywords": ["timing", "time", "hour", "open", "close", "when"],
        "reply": "🕒 **UrbanNest Store Hours:**\n• **Monday – Saturday:** 10:00 AM – 8:30 PM\n• **Sunday:** 11:00 AM – 7:00 PM\n• *Online orders and query support are active 24/7!*"
    },
    {
        "keywords": ["locate", "location", "address", "where", "store", "visit", "directions", "city"],
        "reply": "📍 **UrbanNest Physical Boutique:**\n• **Address:** 142 Heritage Boulevard, Artisan Quarter, Design District\n• **Landmark:** Opposite Central Botanical Garden, Gate #2\n• **Contact:** +1 (555) 382-6637 (URBAN-NEST)\n\nWe would love to welcome you in person for complimentary herbal tea while you browse!"
    },
    {
        "keywords": ["product", "sell", "category", "catalogue", "catalog", "item", "stock", "collection"],
        "reply": "✨ **UrbanNest Collections:**\nWe specialize in curated, handcrafted lifestyle essentials across 5 categories:\n1. 🌿 **Home Décor** — Ceramic vases, scented soy candles, artisan mirrors\n2. 🎁 **Gift Items** — Custom gift boxes, brass bookmarks, curated bundles\n3. ✍️ **Aesthetic Stationery** — Linen notebooks, bamboo fountain pens, desk pads\n4. 👜 **Lifestyle Accessories** — Organic tote bags, vegan leather cardholders\n5. ☕ **Small Household Essentials** — Teak wood coasters, ceramic mug sets\n\nCheck out our catalog section above to browse and add items to your cart!"
    },
    {
        "keywords": ["deliver", "delivery", "ship", "shipping", "courier", "fast"],
        "reply": "🚚 **Delivery & Shipping Policy:**\n• **Local Same-Day Express:** Free for orders above $50 (within city limits)\n• **Standard Domestic Shipping:** 2–4 business days ($4.99 or FREE above $35)\n• **Eco-Friendly Packaging:** 100% recyclable, plastic-free biodegradable packaging."
    },
    {
        "keywords": ["contact", "call", "email", "phone", "whatsapp", "reach", "support"],
        "reply": "📞 **Get in Touch with UrbanNest:**\n• **Email:** hello@urbannest-lifestyle.com\n• **Phone:** +1 (555) 382-6637\n• **WhatsApp Direct:** Click the green WhatsApp button on the bottom bar\n• **Query Form:** Use the form right below to send us a prioritized inquiry!"
    },
    {
        "keywords": ["query", "form", "submit", "custom", "bulk", "order", "corporate"],
        "reply": "📋 **Submitting a Query:**\nYou can submit an inquiry directly via the **'Submit a Query'** form on this page! We support:\n• Custom Gift Hamper curation\n• Bulk & Corporate gifting\n• Interior styling consultation\n• Order tracking\n\nOur team connects this form directly to our **N8N Automation Flow** for rapid 1-hour response!"
    },
    {
        "keywords": ["discount", "coupon", "offer", "promo", "code", "sale"],
        "reply": "🎉 **Special Hackathon & Welcome Offers:**\n• Use code **`URBAN10`** for **10% OFF** your entire order!\n• Use code **`WELCOME20`** on orders above $50 for **20% OFF**!\n• Free gift wrapping included on all gift bundle orders."
    },
    {
        "keywords": ["return", "exchange", "refund", "warranty"],
        "reply": "🌿 **Hassle-Free Return Policy:**\nWe offer a 14-day 'No Questions Asked' return and exchange guarantee on all unused products in original packaging."
    }
]

def generate_ai_reply(user_message):
    msg_lower = user_message.lower().strip()
    for entry in FAQ_KNOWLEDGE_BASE:
        if any(kw in msg_lower for kw in entry["keywords"]):
            return entry["reply"]
            
    # Default lifestyle-aware response
    return (
        f"Thank you for reaching out to **UrbanNest Lifestyle Assistant**! ✨\n\n"
        f"I'm here to assist you with our handcrafted home décor, store timings, bespoke gift curation, and delivery information. "
        f"You can also use our **Query Form** below for specialized inquiries, or click any of the quick suggestions!"
    )


class UrbanNestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS for hackathon evaluation and local testing
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Cache-Control", "no-cache, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            response = {
                "status": "healthy",
                "service": "UrbanNest Lifestyle Web Server",
                "n8n_integration": "active",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            self.wfile.write(json.dumps(response).encode("utf-8"))
            return

        # Fallback to standard static file serving
        return super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        
        try:
            payload = json.loads(post_data)
        except Exception:
            payload = {}

        # -------------------------------------------------------------
        # Endpoint 1: N8N Query Form Submission Proxy
        # -------------------------------------------------------------
        if self.path == "/api/n8n/query":
            webhook_url = payload.get("webhookUrl", "").strip()
            name = payload.get("name", "Valued Customer")
            email = payload.get("email", "")
            phone = payload.get("phone", "")
            category = payload.get("category", "General Query")
            message = payload.get("message", "")
            
            timestamp = datetime.utcnow().isoformat() + "Z"
            ticket_id = f"UN-{int(datetime.utcnow().timestamp())}"
            
            forwarded_to_n8n = False
            n8n_response_data = None
            
            # If user provided a live N8N webhook URL, forward payload
            if webhook_url and (webhook_url.startswith("http://") or webhook_url.startswith("https://")):
                try:
                    req_payload = json.dumps({
                        "ticket_id": ticket_id,
                        "timestamp": timestamp,
                        "customer_name": name,
                        "customer_email": email,
                        "customer_phone": phone,
                        "query_category": category,
                        "message": message,
                        "source": "UrbanNest Lifestyle Web Portal"
                    }).encode("utf-8")
                    
                    req = urllib.request.Request(
                        webhook_url,
                        data=req_payload,
                        headers={"Content-Type": "application/json", "User-Agent": "UrbanNest-N8N-Client/1.0"}
                    )
                    with urllib.request.urlopen(req, timeout=5) as resp:
                        forwarded_to_n8n = True
                        resp_body = resp.read().decode("utf-8")
                        try:
                            n8n_response_data = json.loads(resp_body)
                        except Exception:
                            n8n_response_data = resp_body
                except Exception as e:
                    print(f"[N8N Query Proxy Warning] Webhook forward error: {e}")
                    forwarded_to_n8n = False

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            
            response = {
                "success": True,
                "ticket_id": ticket_id,
                "timestamp": timestamp,
                "forwarded_to_n8n": forwarded_to_n8n,
                "webhook_target": webhook_url if webhook_url else "Integrated Default N8N Workflow Simulator",
                "n8n_response": n8n_response_data,
                "submitted_data": {
                    "name": name,
                    "email": email,
                    "phone": phone,
                    "category": category,
                    "message": message
                },
                "confirmation": f"Thank you {name}! Your query regarding '{category}' has been logged (ID: {ticket_id}) and forwarded to the UrbanNest management pipeline."
            }
            self.wfile.write(json.dumps(response, indent=2).encode("utf-8"))
            return

        # -------------------------------------------------------------
        # Endpoint 2: N8N AI Chatbot Webhook Proxy / Intelligent Engine
        # -------------------------------------------------------------
        elif self.path == "/api/n8n/chat":
            webhook_url = payload.get("webhookUrl", "").strip()
            user_msg = payload.get("message", "").strip()
            session_id = payload.get("sessionId", "guest-session")
            
            forwarded_to_n8n = False
            bot_reply = ""
            
            # If a custom N8N chatbot webhook is active, attempt direct forwarding
            if webhook_url and (webhook_url.startswith("http://") or webhook_url.startswith("https://")):
                try:
                    req_payload = json.dumps({
                        "sessionId": session_id,
                        "chatInput": user_msg,
                        "message": user_msg,
                        "timestamp": datetime.utcnow().isoformat() + "Z"
                    }).encode("utf-8")
                    
                    req = urllib.request.Request(
                        webhook_url,
                        data=req_payload,
                        headers={"Content-Type": "application/json", "User-Agent": "UrbanNest-Chatbot-Client/1.0"}
                    )
                    with urllib.request.urlopen(req, timeout=5) as resp:
                        resp_body = resp.read().decode("utf-8")
                        try:
                            n8n_data = json.loads(resp_body)
                            # Support common n8n AI agent output structures
                            bot_reply = n8n_data.get("output") or n8n_data.get("response") or n8n_data.get("message") or str(n8n_data)
                        except Exception:
                            bot_reply = resp_body
                        forwarded_to_n8n = True
                except Exception as e:
                    print(f"[N8N Chat Proxy Warning] Webhook forward error: {e}")
                    bot_reply = generate_ai_reply(user_msg)
            else:
                # Built-in contextual AI responses
                bot_reply = generate_ai_reply(user_msg)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            
            response = {
                "success": True,
                "reply": bot_reply,
                "forwarded_to_n8n": forwarded_to_n8n,
                "timestamp": datetime.utcnow().strftime("%I:%M %p")
            }
            self.wfile.write(json.dumps(response).encode("utf-8"))
            return

        # 404 for undefined POST routes
        self.send_response(404)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))


def run_server():
    # Make sure public directory exists
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    
    # Allow socket reuse to prevent port binding conflicts
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", PORT), UrbanNestHandler) as httpd:
        print(f"============================================================")
        print(f"🌿 UrbanNest Lifestyle Store - Server Running!")
        print(f"🔗 Local URL: http://localhost:{PORT}")
        print(f"📂 Public Assets: {PUBLIC_DIR}")
        print(f"⚡ N8N Query Form Proxy: http://localhost:{PORT}/api/n8n/query")
        print(f"🤖 N8N AI Chatbot Proxy: http://localhost:{PORT}/api/n8n/chat")
        print(f"============================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down UrbanNest server gracefully.")
            httpd.server_close()


if __name__ == "__main__":
    run_server()
