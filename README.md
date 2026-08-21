# 🌿 UrbanNest Lifestyle Store — Hackathon Project

> **"Little Things. Beautiful Living."**  
> A complete, modern, responsive digital presence for an offline lifestyle boutique featuring **N8N.io Webhook Query Form Integration**, **N8N.io AI Chatbot Assistant**, and **Render Cloud Deployment**.

---

## 📌 1. Project Overview & Problem Statement

### The Problem
**UrbanNest Lifestyle Store** is a traditional neighborhood boutique selling curated home décor, bespoke gifts, aesthetic stationery, lifestyle accessories, and small household essentials. While having a dedicated in-person following, the store previously lacked any online presence, limiting its customer reach and forcing staff to manually handle all repetitive inquiries (store hours, delivery policies, catalog questions, custom gift curation, and bulk corporate orders).

### The Solution
We designed and engineered a full-fledged, commercial-grade digital commerce platform for UrbanNest that:
1. **Digitally Showcases the Store**: High-end landing page highlighting the boutique's heritage, curated catalog, and unique value proposition.
2. **Automates Customer Inquiries via N8N.io**: Real-time Query Form integrated directly into an N8N automation pipeline for prioritized processing, ticket logging, and payload transparency.
3. **Provides 24/7 AI Assistance via N8N Chatbot**: Floating AI conversational concierge answering FAQs on timings, store location, delivery, custom gift hampers, and product recommendations.
4. **Delivers an E-Commerce Ready Experience**: Interactive search, category filtering, slide-over shopping cart, promo coupon system (`URBAN10`), simulated checkout, and an interactive AI Gift & Lifestyle Matcher quiz.

---

## 👥 2. Team Member Contributions

| Team Member | Core Responsibilities | Key Contributions |
| :--- | :--- | :--- |
| **Member 1 (UI/UX & Frontend)** | UI/UX Design & Landing Page | Design system tokens, typography hierarchy, dark/light theme switcher, responsive layout, animations, product cards, testimonials & location sections. |
| **Member 2 (Web Development)** | Full-Stack Development & Cart | Interactive catalog search & filtering, LocalStorage shopping cart, coupon validation (`URBAN10`, `WELCOME20`), checkout simulation, Python/Express backend server. |
| **Member 3 (AI & Automation)** | N8N Integrations, Chatbot & Deploy | N8N Query Form webhook pipeline, N8N AI Chatbot workflow templates, payload inspector, Render deployment config (`render.yaml`), and documentation. |

---

## 🛠️ 3. Technology Stack

- **Frontend**:
  - Semantic HTML5 & Vanilla CSS3 (Custom Design System with CSS variables, Glassmorphism, Dark/Light theme).
  - Vanilla Modern JavaScript ES6+ (Modular architecture, state-managed Cart, Catalog Search/Filter, AI Recommender).
  - Typography: Google Fonts (*Playfair Display* for artisanal serif headlines + *Plus Jakarta Sans* for UI clarity).
- **Backend / Webhook Proxy**:
  - Python 3 Standard Library HTTP Server (`app.py`) & Node.js Express (`server.js`) — zero external runtime dependencies required.
  - Proxy endpoints (`/api/n8n/query`, `/api/n8n/chat`) handling CORS-safe webhook forwarding to N8N cloud or local instances.
- **Workflow Automation & AI**:
  - **N8N.io**: Webhook Triggers, JSON Data Transformation, Condition Routing, and AI Agent response nodes.
- **Cloud Deployment**:
  - **Render**: Configured for automated continuous deployment via `render.yaml` Blueprint or Web Service.

---

## ⚡ 4. N8N.io Integration Guide

Pre-configured workflow JSON files are located in the [`n8n-workflows/`](./n8n-workflows/) directory:

### Workflow 1: Query Form Automation (`n8n-workflows/query-form-workflow.json`)
1. **Webhook Trigger**: Listens for `POST` submissions on path `/webhook/urbannest-query`.
2. **Process Query Data (Set Node)**: Extracts `customer_name`, `customer_email`, `customer_phone`, `query_category`, `message`, assigns a priority (`URGENT` for Bulk Orders, `STANDARD` for others), and generates a timestamp.
3. **Respond to Webhook**: Returns a formatted JSON confirmation with ticket ID and estimated response time.

### Workflow 2: AI Chatbot Assistant (`n8n-workflows/ai-chatbot-workflow.json`)
1. **Webhook Trigger**: Listens for `POST` messages on path `/webhook/urbannest-chat`.
2. **FAQ Router & AI Processing**: Analyzes customer queries regarding store timings, boutique location, delivery radius, products, discounts, and custom orders.
3. **Respond to Webhook**: Returns contextual response formatted in rich markdown.

### How to Connect Your Own N8N Instance:
1. Open your N8N instance (Cloud or Self-hosted).
2. Click **Add Workflow** ➔ **Import from JSON** and select either file from `./n8n-workflows/`.
3. Activate the workflow and copy the **Production / Test Webhook URL**.
4. In the UrbanNest website, click the **⚙️ Configure N8N Webhooks** button (in the Query Form section or bottom bar) and paste your URLs!

---

## 🚀 5. Local Setup & Running the Project

### Option A: Running with Python (Recommended & Zero-Install)
```bash
# Clone the repository
git clone <your-repo-url>
cd "AIML Training"

# Start the server (runs on Python 3 Standard Library)
python3 app.py
```
Open [http://localhost:3000](http://localhost:3000) in your browser!

### Option B: Running with Node.js
```bash
npm install
npm start
```

---

## ☁️ 6. Deployment on Render

This project is 100% prepared for **Render** deployment with zero configuration needed.

### Steps to Deploy on Render:
1. Push your project code to a **GitHub** or **GitLab** repository.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** ➔ **Web Service**.
4. Connect your GitHub repository.
5. Configure the build & runtime settings:
   - **Name**: `urbannest-lifestyle-store`
   - **Runtime**: `Python 3` (or `Node`)
   - **Build Command**: *(leave empty)*
   - **Start Command**: `python3 app.py` (or `node server.js`)
6. Click **Deploy Web Service**.
7. Render will provide a live, publicly accessible URL (e.g. `https://urbannest-lifestyle-store.onrender.com`).

*(Alternatively, use the included [`render.yaml`](./render.yaml) for 1-Click Blueprint deployment!)*

---

## 🌟 7. Implemented Features & Bonus Checklist

| Requirement / Bonus Feature | Status | Details |
| :--- | :---: | :--- |
| **Hero Section** | ✅ | Tagline, description, CTAs, live stats counter, floating badges. |
| **About the Shop** | ✅ | Heritage story, artisan values, visual mosaic, sustainable pillars. |
| **Featured Products** | ✅ | Real product images, descriptions, prices, categories, tags. |
| **Why Choose Us** | ✅ | 4 clear value proposition cards with modern iconography. |
| **N8N Query Form Integration** | ✅ | Name, email, phone, category radio pills, message, live payload inspector. |
| **N8N AI Chatbot Widget** | ✅ | Floating toggle, preset FAQ chips, typing indicator, markdown formatting. |
| **Responsive Design** | ✅ | Fluid layouts optimized for Mobile, Tablet, and Desktop. |
| **Product Search & Category Filter (Bonus)** | ✅ | Real-time search bar + 6 category filter pills + price sorting. |
| **Shopping Bag & Cart UI (Bonus)** | ✅ | Slide-over drawer, quantity updates, removal, subtotal & free shipping math. |
| **Promo Code Engine (Bonus)** | ✅ | Apply `URBAN10` for 10% off or `WELCOME20` for 20% off. |
| **Simulated Checkout (Bonus)** | ✅ | Interactive receipt modal with order confirmation. |
| **AI Gift Matcher Quiz (Bonus)** | ✅ | 3-step recommendation engine matching vibe, budget, and recipient. |
| **Customer Testimonials (Bonus)** | ✅ | Verified local reviews with 5-star ratings and customer tags. |
| **Physical Store Locator & Hours (Bonus)**| ✅ | Live "Open Now" badge, timings, map preview, and directions. |
| **WhatsApp Direct Connect (Bonus)** | ✅ | 1-click floating WhatsApp button with pre-filled inquiry text. |
| **Dark / Light Mode Toggle (Bonus)** | ✅ | Persistent theme switcher with custom CSS variables. |
| **Product Quick View Modal (Bonus)** | ✅ | Pop-up modal with detailed dimensions, materials, and batch info. |

---

## 🔮 8. Future Roadmap

1. **Stripe / Payment Gateway Integration**: Real-time payment processing for direct online transactions.
2. **Inventory Sync**: Bi-directional webhook syncing shop inventory with the offline POS system.
3. **Customer Accounts & Order History**: User login with saved delivery addresses and wishlist.
4. **Augmented Reality (AR) Preview**: 3D view of vases and table mirrors in customer living rooms.

---

## 📄 License
MIT License © 2026 UrbanNest Lifestyle Store.
