# AI RFP Management System (AI-RFP-MVP)

An end-to-end **AI-powered RFP management system** that helps a procurement manager go from a vague, natural-language request like:

> “We need 20 laptops, 16GB RAM, 10 monitors 27-inch, budget $50,000, delivery in 30 days…”

…to a **structured RFP**, email it to vendors, **ingest vendor proposals**, and then **compare them with AI-assisted scoring and recommendations**.

I built this to explore how LLMs can automate boring, repetitive procurement workflows without replacing the human decision-maker.

---

## ✨ Features

- **Natural-language → structured RFP**
  - Type a free-form description.
  - LLM converts it into structured JSON (items, quantities, budget, delivery, warranty, etc.).
  - Fallback heuristic parser if AI is unavailable.

- **Vendor management**
  - Add/list/delete vendors with basic contact details.
  - Store a vendor master that can be reused across RFPs.

- **RFP email sending**
  - Select vendors and send them the RFP via email (SMTP).
  - Attach the structured RFP as a JSON file so vendors or downstream systems can integrate.

- **Vendor proposal ingestion (simulated webhook)**
  - Simulate inbound vendor proposal emails via a webhook.
  - LLM parses proposal text (and optional attachment text) into structured fields:
    - line_items, total_price, currency
    - delivery_days, warranty_months, payment_terms, notes, confidence

- **Proposal comparison & recommendation**
  - For a given RFP, compare all parsed proposals on:
    - price  
    - delivery timeline  
    - warranty duration  
    - AI parsing confidence / completeness
  - Weighted scoring with a transparent formula.
  - Optional AI explanation summarizing **which vendor is recommended and why**, plus risks.

- **Modern frontend**
  - React + Tailwind, responsive layout.
  - Screens for: RFP list, RFP detail, Create RFP, Vendors, Comparison view.
  - “Simulate vendor reply” button for easy demoing of the inbound flow.

---

## 🏗 Architecture

High-level architecture:

```mermaid
flowchart LR
  subgraph Client[Frontend (React + Tailwind)]
    UI_RFP[RFP UI]
    UI_Vendors[Vendors UI]
    UI_Compare[Compare View]
  end

  subgraph Server[Backend (Node.js + Express)]
    API_RFP[/RFP Routes/]
    API_Vendors[/Vendor Routes/]
    API_Inbound[/Inbound Email Webhook/]
    Service_LLM[LLM Service]
    Service_Email[Email Service]
  end

  subgraph DB[(MongoDB Atlas)]
    RFPs[(RFPs)]
    Vendors[(Vendors)]
    Proposals[(Proposals)]
  end

  subgraph External[External Services]
    LLM[(Groq LLM)]
    SMTP[(SMTP Server)]
  end

  UI_RFP --> API_RFP
  UI_Vendors --> API_Vendors
  UI_Compare --> API_RFP

  API_RFP --> RFPs
  API_Vendors --> Vendors
  API_Inbound --> Proposals

  API_RFP --> Service_LLM
  API_Inbound --> Service_LLM

  API_RFP --> Service_Email
  Service_Email --> SMTP

  Service_LLM <---> LLM
Flow in words:

Frontend calls the RFP API to create RFPs from natural language, view them, send them, and run comparisons.

Backend persists RFPs, Vendors, and Proposals in MongoDB Atlas.

When creating RFPs or parsing proposals, the backend uses a Groq LLM wrapper with a strict “JSON-only” prompt and a fallback parser.

When sending RFPs, the backend uses SMTP to email vendors and attach structured JSON.

Vendor proposals are simulated via a webhook (/api/inbound/email), which would be the target of an inbound email provider in a production setup.

Comparison logic is deterministic (scoring function) plus an optional LLM explanation.

🧱 Tech Stack
Backend

Node.js + Express

MongoDB (Atlas)

Mongoose for models

Nodemailer for SMTP email

Groq LLM (Llama 3.3–70B) via HTTP API

Dotenv for configuration

Frontend

React (Vite)

Tailwind CSS

(Generated UI with a modern, responsive layout)

Dev / Infra

Git + GitHub

Environment-based config (.env and .env.example)

📂 Project Structure
text
Copy code
ai-rfp-mvp/
├─ backend/
│  ├─ index.js                # Express app entry, Mongo connection
│  ├─ .env.example            # Backend env template
│  └─ src/
│     ├─ models/
│     │  ├─ rfp.model.js      # RFP schema
│     │  ├─ vendor.model.js   # Vendor schema
│     │  └─ proposal.model.js # Proposal schema (parsed vendor responses)
│     ├─ routes/
│     │  ├─ rfp.routes.js     # /api/rfps
│     │  ├─ vendor.routes.js  # /api/vendors
│     │  └─ inbound.routes.js # /api/inbound/email
│     ├─ controllers/
│     │  ├─ rfp.controller.js     # create, get, send, compare
│     │  ├─ vendor.controller.js  # CRUD for vendors
│     │  └─ inbound.controller.js # inbound proposal webhook
│     └─ services/
│        ├─ llm.service.js     # Groq + fallback parsing
│        └─ email.service.js   # SMTP email sending
│
├─ frontend/
│  ├─ index.html
│  ├─ .env.example          # Frontend env template
│  └─ src/
│     ├─ main.jsx           # React entry
│     ├─ App.jsx            # App shell + routing
│     ├─ api/api.js         # API wrapper around backend endpoints
│     ├─ components/        # UI components (RFP list, detail, vendors, etc.)
│     └─ index.css          # Tailwind entry
│
└─ README.md
⚙️ Getting Started
1. Prerequisites
Node.js (v18+ recommended)

A MongoDB Atlas cluster (or local MongoDB)

SMTP credentials (Gmail App Password or another SMTP provider)

A Groq API key (or you can rely on the fallback parser)

2. Backend Setup
bash
Copy code
cd backend
cp .env.example .env
Fill in .env:

env
Copy code
DATABASE_URL=your_mongodb_connection_string
PORT=4000

GROQ_API_KEY=your_groq_key_or_leave_empty_for_fallback

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_gmail@example.com
SMTP_PASS=your_app_password

INBOUND_EMAIL_WEBHOOK_SECRET=change_me_or_ignore_for_local
Install & run:

bash
Copy code
cd backend
npm install
npm run dev
You should see:

Connected to MongoDB

Backend listening on 4000

3. Frontend Setup
bash
Copy code
cd frontend
cp .env.example .env
In frontend/.env:

env
Copy code
VITE_API_URL=http://localhost:4000
Install & run:

bash
Copy code
cd frontend
npm install
npm run dev
Visit:
👉 http://localhost:5173

🔌 API Overview
RFPs
Create RFP from natural language

http
Copy code
POST /api/rfps
Content-Type: application/json

{
  "title": "New Office Hardware RFP",
  "nl_text": "I need to procure 20 laptops with 16GB RAM and 10 monitors 27-inch..."
}
Response:

json
Copy code
{
  "rfp": {
    "_id": "…",
    "title": "New Office Hardware RFP",
    "description": "I need to procure…",
    "structured": { /* JSON extracted by LLM or fallback */ },
    "createdAt": "…"
  },
  "parsing": {
    "ok": true,
    "raw": "raw LLM text if available"
  }
}
List RFPs

http
Copy code
GET /api/rfps
Get single RFP

http
Copy code
GET /api/rfps/:id
Send RFP to vendors

http
Copy code
POST /api/rfps/:id/send
Content-Type: application/json

{
  "vendorIds": ["<vendor-id-1>", "<vendor-id-2>"],
  "message": "Please send your best quote."
}
Compare proposals

http
Copy code
GET /api/rfps/:id/compare
Response (simplified):

json
Copy code
{
  "ok": true,
  "rfpId": "…",
  "recommendations": [
    {
      "proposalId": "…",
      "vendorName": "ACME Supplies",
      "price": 42000,
      "delivery_days": 25,
      "warranty_months": 18,
      "completeness": 0.92,
      "score_components": {
        "priceScore": 95,
        "deliveryScore": 60,
        "warrantyScore": 80,
        "completenessScore": 92
      },
      "finalScore": 84
    }
  ],
  "recommended": { /* top-scoring proposal */ },
  "aiExplanation": "Vendor ACME is recommended because..."
}
Vendors
Create vendor

http
Copy code
POST /api/vendors
Content-Type: application/json

{
  "name": "ACME Supplies",
  "email": "acme@example.com",
  "contactPerson": "Ravi"
}
List vendors

http
Copy code
GET /api/vendors
Delete vendor

http
Copy code
DELETE /api/vendors/:id
Inbound vendor proposals (simulated webhook)
Simulate vendor reply (for now, done via UI or Postman)

http
Copy code
POST /api/inbound/email
Content-Type: application/json

{
  "from": "vendor1@example.com",
  "subject": "Re: RFP 692efadb88f77dcbabcb4e69",
  "body": "We can supply 30 laptops at $1200 each, total $36000. Delivery 30 days. Warranty 18 months. Payment net 30.",
  "rfpId": "692efadb88f77dcbabcb4e69"
}
Response:

json
Copy code
{
  "ok": true,
  "proposal": {
    "_id": "…",
    "vendorEmail": "vendor1@example.com",
    "parsed": {
      "line_items": [ ... ],
      "total_price": 36000,
      "delivery_days": 30,
      "warranty_months": 18,
      "payment_terms": "net 30",
      "confidence": 0.9
    }
  },
  "parseMeta": {
    "parsed": { ... },
    "summary": "Short AI summary if enabled"
  }
}
In production, this endpoint would be the target of an inbound email provider (Mailgun, SendGrid, SES, etc.).

🧠 AI Integration Details
The LLM is used in three places:

RFP creation

Natural language → structured RFP JSON.

Prompt enforces JSON-only output.

Proposal parsing

Raw vendor proposal + optional attachment text → structured fields (line items, price, delivery, warranty, payment terms).

Includes a confidence score to feed the comparison logic.

Comparison explanation (optional)

After numeric scoring is done, a short textual explanation is generated:

which vendor is recommended

what trade-offs exist

potential risks / missing info

All LLM calls have:

Timeouts to avoid hanging requests.

Fallback logic (regex-based parser) when the LLM fails or is disabled.

⚖️ Trade-offs & Design Choices
Some key decisions I made:

LLM + Fallback Parser

Why: LLMs can fail, be rate-limited, or return non-JSON.

Trade-off: Slightly more code, but much more robust in real usage.

Single-tenant, single-user design

Why: Focus on the core workflow instead of user management and multi-tenancy.

Trade-off: Not ready for multi-org SaaS yet, but easy to extend.

Simulated inbound proposals (webhook) instead of full email integration

Why: Avoids DNS, MX, and provider-specific setup for now.

Trade-off: One extra manual step for demos; in production, this would be wired to Mailgun/SendGrid.

Transparent scoring function rather than pure AI scoring

Why: Procurement teams need to justify decisions. Numeric weights make trade-offs clear.

Trade-off: Less “magic”, but more explainable and tunable.

React + Tailwind frontend

Why: Fast to build, easy to adjust design, widely understood stack.

Trade-off: No heavy design system or component library, but enough to showcase the workflow.

🚀 Future Work / Ideas
Things I would like to add next:

Real inbound email integration

Wire /api/inbound/email to a mail provider’s webhook (SendGrid, Mailgun, SES).

Verify signatures, handle attachments (PDF → text, OCR).

Vendor Portal

Simple portal where vendors can log in and submit proposals directly via form + file upload.

RFP templates & cloning

Save common patterns as templates.

One-click “clone RFP” with slight tweaks.

Analytics & dashboards

Average cycle time, savings vs. budget, vendor reliability stats.

Role-based access & multi-tenant

Separate environments for multiple organizations.

🧪 Local Demo Flow
Start backend (npm run dev in /backend)

Start frontend (npm run dev in /frontend)

Create a vendor from UI.

Create an RFP using natural language.

Send the RFP to the vendor.

Simulate vendor reply via the “simulate” UI or using Postman hitting /api/inbound/email.

Run comparison on the RFP and see:

scores per vendor

recommended vendor

optional AI explanation.
