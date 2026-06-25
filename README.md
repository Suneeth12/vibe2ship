# Vibe2Ship Hackathon — Community Hero: Hyperlocal Problem Solver

A modern, hyperlocal civic issue reporting and resolution platform. Residents can report infrastructure problems (potholes, water leaks, broken streetlights) via photo/video uploads, which are automatically categorized, prioritized, and routed to city departments by a multi-agent AI pipeline. Features real-time maps, community verification via consensus, and gamification.

## 📂 Repository Structure

The project is structured as follows:

```text
/
├── client/                 # React (Vite) frontend application
│   ├── src/                # Frontend source code
│   └── package.json        # Frontend dependencies & scripts
├── server/                 # Node.js (Express) backend server
│   ├── src/                # Backend source code
│   └── package.json        # Backend dependencies & scripts
├── docs/                   # Specifications, architecture, and threat models
│   ├── PRD.md              # Product Requirements Document
│   ├── FEATURES.md         # Detailed feature specifications
│   ├── ARCHITECTURE.md     # Authoritative system architecture & Firestore rules
│   ├── BACKEND.md          # Server contracts, middleware, and AI prompts
│   ├── FRONTEND.md         # Client architecture, security, and styling tokens
│   ├── DESIGN.md           # Visual design system & guidelines
│   ├── DESIGN_BRIEF.md     # Design constraints & brand rules
│   ├── TECH_STACK.md       # Technical dependencies & package versions
│   ├── WORKFLOW.md         # End-to-end user journeys & checkpoints
│   ├── VERIFICATION.md     # Hackathon evaluation criteria mapping
│   ├── THREAT_MODEL.md     # STRIDE + PASTA security threat analysis
│   ├── SECURITY_AUDIT.md   # Resolution reports of security findings
│   └── implementation_plan.md # Master timeline, milestones, & premortem
├── MEMORY.md               # Active project memory & key decisions
└── README.md               # Root documentation index (this file)
```

## 📖 Documentation Index

For detailed implementation specs and architectural design decisions, please refer to the documents in the `docs/` directory:

1. **Product Requirements & Scope:**
   - [Product Requirements Document (PRD)](docs/PRD.md)
   - [Features Deep Dive](docs/FEATURES.md)
   - [End-to-End Workflows & User Journeys](docs/WORKFLOW.md)
2. **System Architecture & Design:**
   - [System Architecture Specification](docs/ARCHITECTURE.md)
   - [Backend API & Agents Contract](docs/BACKEND.md)
   - [Frontend Architecture & Sanitization](docs/FRONTEND.md)
3. **Visual Design & Aesthetics:**
   - [Visual Design System Guidelines](docs/DESIGN.md)
   - [Brand Design Constraints](docs/DESIGN_BRIEF.md)
4. **Security & Verification:**
   - [STRIDE + PASTA Threat Model](docs/THREAT_MODEL.md)
   - [Security Audit Resolution Report](docs/SECURITY_AUDIT.md)
   - [Verification & Evaluation Plan](docs/VERIFICATION.md)
5. **Technical Setup:**
   - [Tech Stack Details & Key Setup](docs/TECH_STACK.md)
   - [Master Implementation Plan](docs/implementation_plan.md)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- npm or yarn
- Firebase Project setup

### Installation & Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Suneeth12/vibe2ship.git
   cd vibe2ship
   ```

2. **Configure environment variables:**
   - Create a `.env` file in `/client` (see [TECH_STACK.md](docs/TECH_STACK.md) for details).
   - Create a `.env` file in `/server` (see [TECH_STACK.md](docs/TECH_STACK.md) for details).

3. **Install dependencies and start client:**
   ```bash
   cd client
   npm install
   npm run dev
   ```
   The client will run at `http://localhost:5173`.

4. **Install dependencies and start server:**
   ```bash
   cd ../server
   npm install
   npm run dev
   ```
   The server will run at `http://localhost:5000`.
