# 📰 Nimigora

**Real Journalism. Zero Humans in the Newsroom.**

Nimigora is an autonomous, AI-native newsroom that proves artificial intelligence can produce journalism worthy of the world's best publications. Every article is independently sourced, researched, written, and fact-checked entirely by an automated AI pipeline—with zero human intervention.

<img src="public/screenshot.png" alt="Nimigora Screenshot" width="100%" />

---

## ⚡ Key Features

* **100% Autonomous Pipeline:** A cron-triggered GitHub Action runs daily, discovering, writing, and publishing stories using a multi-provider LLM pipeline (Groq, Gemini, Cerebras, Mistral).
* **Radical Transparency:** Every published article includes a public "Pipeline Record" detailing the exact steps, sources, timestamps, and verification checks performed.
* **Premium Gating via Nimiq Pay:** High-quality, AI-selected exclusive stories are gated behind a Nimiq crypto paywall. Users can seamlessly subscribe using the Nimiq Mini App SDK.
* **Editorial Guardrails:** Built-in safeguards against hallucination, bias, and category drift.
* **High-Fidelity UI/UX:** A bespoke, responsive Next.js frontend with client-side instant search, dynamic date sorting, frosted glass mobile navigation, and strict typographic hierarchies.

## 🛠️ The 4-Stage Editorial Pipeline

Nimigora operates on a rigorous, four-stage background process:

1. **Source Discovery (`stage1-discovery.ts`):** Monitors 50+ top-tier RSS feeds across 6 beats. It deduplicates stories and checks against already-published articles using AI-powered story selection.
2. **Fact Extraction (`stage2-extraction.ts`):** Strips the fluff and instructs the AI to securely extract raw, structured factual claims (quotes, statistics, events) with high-confidence thresholds.
3. **Editorial Synthesis (`stage3-synthesis.ts`):** Compiles the raw facts into a structured, inverted-pyramid news article (essential news first, context later) utilizing a professional journalistic tone.
4. **Quality Review (`stage4-review.ts`):** A secondary AI review phase grades the article on bias, readability, and factual fidelity before generating the final JSON artifact. 

## 💻 Tech Stack

* **Framework:** Next.js (App Router), React, TypeScript
* **Styling:** Custom Vanilla CSS Design System (`globals.css`)
* **AI Providers:** Groq, Google AI Studio (Gemini), Cerebras, Mistral 
* **Payments:** Nimiq Pay / `@nimiq/mini-app-sdk`
* **Workflow / CI/CD:** GitHub Actions (`.github/workflows/pipeline.yml`)
* **Deployment:** Vercel

## 🚀 Running Locally

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   # Required for the AI Editorial Pipeline
   GROQ_API_KEY=your_groq_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   CEREBRAS_API_KEY=your_cerebras_api_key_here
   MISTRAL_API_KEY=your_mistral_api_key_here
   
   # You can also supply multiple keys per provider for automatic rotation (e.g., GEMINI_API_KEY_2=...)
   NEXT_PUBLIC_NIMIQ_PAYOUT_ADDRESS=your_nimiq_address_here
   ```

3. **Start the Frontend Service:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

4. **Run the AI Pipeline Manually:**
   To test the autonomous generation of new articles locally:
   ```bash
   npm run pipeline:run
   ```

## ⚖️ Ethics & Transparency
We believe transparency is not an option when the writer is a machine. Nimigora enforces a strict "no hallucination" rule where all facts trace to the original source, automated bias detection catches one-sided framing, and immediate fail-closed behaviors prevent poor-quality articles from seeing the light of day.

---
*Nimigora is an AI-native newsroom experiment. Built with editorial rigor. Powered by artificial intelligence.*
