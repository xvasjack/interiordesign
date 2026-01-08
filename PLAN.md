# Bioinformatics Learning Platform - Design Plan

## Overview

An interactive web-based platform for learning bioinformatics through coding, featuring a split-screen interface with a terminal emulator (left) and guided story/lessons (right).

---

## Why Website Over Desktop Software?

| Factor | Website | Desktop App |
|--------|---------|-------------|
| **Accessibility** | Works instantly in browser | Requires download/install |
| **Cross-platform** | Any OS with a browser | Need separate builds |
| **Updates** | Deploy once, everyone gets it | Users must update manually |
| **Onboarding** | Zero friction start | Installation barrier |
| **Backend execution** | Can run real bioinformatics tools server-side | Complex local setup |
| **Collaboration** | Easy to share progress/links | Harder to implement |
| **Maintenance** | Single codebase | Multiple platform builds |

**Recommendation: Web application**

---

## Core Concept

```
┌─────────────────────────────────────────────────────────────────┐
│  BioinfoLearn                                    [Progress: 40%]│
├───────────────────────────┬─────────────────────────────────────┤
│                           │                                     │
│  $ blastp -query seq.fa   │  Chapter 3: Sequence Alignment      │
│  -db nr -out results.txt  │                                     │
│                           │  Now that you have your protein     │
│  Processing...            │  sequence, let's search for         │
│  Found 42 matches         │  similar sequences in the database. │
│                           │                                     │
│  $ _                      │  Type the BLAST command shown       │
│                           │  below to search:                   │
│                           │                                     │
│  [Terminal - Black BG]    │  ```                                │
│                           │  blastp -query seq.fa -db nr        │
│                           │  ```                                │
│                           │                                     │
│                           │  [Story Panel - White BG]           │
│                           │                                     │
│                           │  [ Next → ]                         │
├───────────────────────────┴─────────────────────────────────────┤
│  Hint: BLAST compares sequences against a database              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Features

### Phase 1: MVP
- [ ] Split-screen layout (resizable divider)
- [ ] Terminal emulator with command history
- [ ] Story/lesson panel with markdown rendering
- [ ] Lesson progression system
- [ ] Command validation (check if user typed correct command)
- [ ] Basic bioinformatics commands (simulated or real backend)

### Phase 2: Enhanced Learning
- [ ] User accounts & progress saving
- [ ] Multiple lesson tracks (DNA analysis, protein structure, etc.)
- [ ] Interactive visualizations (sequence alignments, phylogenetic trees)
- [ ] Code hints and auto-complete
- [ ] Achievement system

### Phase 3: Advanced
- [ ] Real backend execution (Docker containers with bioinfo tools)
- [ ] Upload own data for analysis
- [ ] Community lessons/challenges
- [ ] Collaborative learning sessions

---

## Technical Architecture

### Option A: Simple (Recommended for MVP)
```
Frontend Only (Static Site)
├── React/Vue/Svelte
├── xterm.js (terminal emulator)
├── Simulated command responses
└── Lessons stored as JSON/Markdown
```
**Pros**: Easy to deploy (GitHub Pages, Netlify), no server costs
**Cons**: Can't run real bioinformatics tools

### Option B: Full Stack
```
Frontend                    Backend
├── React/Next.js          ├── Node.js/Python
├── xterm.js               ├── WebSocket connection
└── API calls              ├── Docker containers
                           └── Real bioinfo tools (BLAST, etc.)
```
**Pros**: Real tool execution, persistent progress
**Cons**: Server costs, more complex

### Recommended Tech Stack (Option A for MVP)
| Component | Technology | Why |
|-----------|------------|-----|
| Framework | **Next.js** (React) | SSR, easy routing, great DX |
| Terminal | **xterm.js** | Industry standard, looks real |
| Styling | **Tailwind CSS** | Fast development, responsive |
| State | **Zustand** or Context | Lightweight state management |
| Content | **MDX** | Markdown + React components |
| Deploy | **Vercel** | Free tier, instant deploys |

---

## Lesson Structure (JSON Schema)

```json
{
  "lessonId": "blast-intro",
  "title": "Introduction to BLAST",
  "chapters": [
    {
      "id": "ch1",
      "story": "BLAST (Basic Local Alignment Search Tool) is...",
      "expectedCommand": "blastp -help",
      "simulatedOutput": "USAGE: blastp [-h] [-help]...",
      "hints": ["Try using the -help flag"],
      "nextChapter": "ch2"
    }
  ]
}
```

---

## Simulated Commands for MVP

Since real bioinformatics tools need backend infrastructure, MVP can simulate:

| Command | Simulated Behavior |
|---------|-------------------|
| `ls` | Show lesson-specific files |
| `cat sequence.fa` | Display pre-defined sequence |
| `blastp -query ...` | Return pre-computed results |
| `clustalw ...` | Show alignment output |
| `grep`, `awk`, `head`, `tail` | Basic text processing |

---

## Learning Tracks (Content Ideas)

1. **Intro to Bioinformatics**
   - What is bioinformatics?
   - File formats (FASTA, FASTQ, GenBank)
   - Basic sequence manipulation

2. **Sequence Analysis**
   - BLAST searches
   - Multiple sequence alignment
   - Motif finding

3. **Genomics**
   - Read mapping
   - Variant calling
   - Genome assembly basics

4. **Phylogenetics**
   - Building phylogenetic trees
   - Tree visualization

5. **Structural Biology**
   - PDB format
   - Protein structure prediction

---

## File Structure (Proposed)

```
bioinfolearn/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── page.tsx            # Home/landing
│   │   ├── learn/
│   │   │   └── [lessonId]/
│   │   │       └── page.tsx    # Lesson view
│   │   └── layout.tsx
│   ├── components/
│   │   ├── Terminal/
│   │   │   ├── Terminal.tsx    # xterm.js wrapper
│   │   │   └── commands.ts     # Command handlers
│   │   ├── StoryPanel/
│   │   │   └── StoryPanel.tsx  # Right-side content
│   │   ├── SplitView/
│   │   │   └── SplitView.tsx   # Resizable split layout
│   │   └── LessonNav/
│   │       └── LessonNav.tsx   # Progress/navigation
│   ├── lessons/
│   │   ├── intro/
│   │   │   └── lesson.json
│   │   └── blast/
│   │       └── lesson.json
│   ├── lib/
│   │   ├── terminal/
│   │   │   └── simulator.ts    # Fake command execution
│   │   └── lessons/
│   │       └── loader.ts       # Load lesson content
│   └── styles/
│       └── globals.css
├── public/
│   └── assets/                 # Images, sample files
├── package.json
├── tailwind.config.js
└── README.md
```

---

## Implementation Steps

### Step 1: Project Setup
- Initialize Next.js project with TypeScript
- Configure Tailwind CSS
- Set up basic routing

### Step 2: Core Layout
- Create resizable split-view component
- Terminal panel (left, black background)
- Story panel (right, white background)

### Step 3: Terminal Integration
- Integrate xterm.js
- Create command input handling
- Build command simulator with bioinformatics responses

### Step 4: Lesson System
- Design lesson JSON schema
- Build lesson loader
- Create story panel with markdown rendering
- Implement progress tracking (localStorage)

### Step 5: First Lesson
- Write "Introduction to Bioinformatics" content
- Add simulated commands for lesson
- Test full flow

### Step 6: Polish & Deploy
- Add responsive design
- Implement keyboard shortcuts
- Deploy to Vercel

---

## Questions to Consider

1. **Target audience**: Complete beginners or some coding experience?
2. **Scope**: Just terminal commands, or also Python/R scripting?
3. **Authentication**: Anonymous progress or user accounts?
4. **Real execution**: Is backend execution needed, or is simulation enough?
5. **Content**: Will you create lessons, or allow community contributions?

---

## Next Steps

Please review this plan and let me know:

1. Does the overall approach look good?
2. Which tech stack option do you prefer (A: simple/simulated or B: full backend)?
3. Any features to add/remove from the MVP?
4. Should I proceed with scaffolding the project?
