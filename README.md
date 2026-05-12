# VERDIQT — Forensic AI Bias Auditing Platform

> *Verdict + IQ + Equity* — Because every AI decision deserves a fair trial.

![VERDIQT](https://img.shields.io/badge/Powered%20by-Gemini%201.5%20Flash-blue)
![Firebase](https://img.shields.io/badge/Deployed%20on-Firebase-orange)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🔍 What is VERDIQT?

VERDIQT is a Gemini-powered forensic AI bias auditing platform that goes beyond detecting bias. It traces exactly **WHERE** in the ML pipeline bias was born, **WHO** it harms in human terms, and **HOW** to fix it — with a regulator-ready audit report.

Built for the **Google Solution Challenge 2026** — Build with AI Hackathon.

---

## 🚨 The Problem

Computer programs now make life-changing decisions — who gets a loan, a job, or medical care. When these systems learn from flawed historical data, they silently repeat and amplify the same discriminatory patterns, harming real people without anyone noticing.

**77% of AI systems deployed today have never been audited for bias.**

---

## ✅ The Solution

VERDIQT gives organizations a full **Bias Autopsy** in under 60 seconds:

| Feature | Description |
|---|---|
| 🔢 VERDIQT Score | 0-100 fairness rating — like a credit score for your AI |
| 🔬 Forensic Bias Tracer | Traces bias across all 4 ML pipeline stages |
| 👤 Human Impact Story | Real story of the person your model is failing |
| 🔄 What-If Fix Simulator | Test fixes before applying them |
| 📄 Audit Report | Regulator-ready PDF with compliance references |
| 💚 Empathy Mode | Explains rejection to affected person in plain language |

---

## 🌟 Unique Features

### 1. Forensic Bias Tracer
No other tool does this. VERDIQT traces how bias traveled and amplified through all 4 pipeline stages:
Data Collection → Data Labeling → Feature Selection → Model Training
Each stage shows contamination %, forensic evidence, and a plain-English analogy.

### 2. Human Impact Story
Gemini generates a realistic story of a fictional person from the affected group who would be wrongly rejected. Ends with:
> *"This is who your model is failing."*

### 3. Empathy Mode
Explains to an affected person — in plain language — why the AI rejected them unfairly, what their rights are, and what action they can take.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS |
| AI Engine | Google Gemini 1.5 Flash API |
| Cloud Deployment | Google Firebase Hosting |
| Dataset | UCI ML Repository — Loan Prediction Dataset |
| Build Tool | Vite |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Google Gemini API Key ([Get it here](https://makersuite.google.com/app/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/verdiqt.git
cd verdiqt

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Add your Gemini API key to `.env`:
VITE_GEMINI_API_KEY=your_gemini_api_key_here

```bash
# Run locally
npm run dev
```

Open `http://localhost:5173`

---

## ☁️ Cloud Deployment

```bash
# Build the project
npm run build

# Install Firebase CLI
npm install -g firebase-tools

# Login and deploy
firebase login
firebase init hosting
firebase deploy
```

Live at: `https://verdiqt.web.app`

---

## 📊 Real Dataset

VERDIQT uses the **UCI Loan Prediction Dataset** (614 records) for demo:

| Group | Approval Rate |
|---|---|
| Male | 69% |
| Female | 61% |
| Graduate | 70% |
| Not Graduate | 58% |
| Urban | 76% |
| Rural | 61% |

Source: [UCI ML Repository](https://archive.ics.uci.edu/ml/index.php)

---

## 📋 Compliance References

- EU AI Act — Article 10 (Data Governance)
- India Digital Personal Data Protection Act 2023
- IEEE 7003 — Algorithmic Bias Considerations

---

## 🗺️ Roadmap

- [ ] Real CSV file upload with auto column detection
- [ ] Support for Hiring, Medical, Education domains
- [ ] Direct ML model file upload (.pkl, .h5)
- [ ] Continuous weekly monitoring dashboard
- [ ] VERDIQT Certification Badge for compliant organizations
- [ ] Mobile app for compliance officers

---

## 👥 Team

Built with ❤️ for Google Solution Challenge 2026

| Role | Name |
|---|---|
| Team Lead | [Your Name] |
| Developer | [Team Member] |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

> *"VERDIQT doesn't just tell you your AI is biased — it tells you exactly where bias was born, who it is harming right now, and gives you a fix you can apply today."*

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/6301edcf-28fa-4d5b-abbe-9d1d42d316c5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
