# Bioinformatics Learning Platform - Design Plan

## Overview

An interactive web-based platform for learning bacterial WGS (Whole Genome Sequencing) analysis through a narrative-driven, output-first approach. Split-screen interface with real terminal (left) and guided story (right).

---

## Target Audience

- **Skill range**: Complete beginners to advanced users
- **Background**: Lab scientists, biologists, bioinformaticians, students
- **Assumption**: No prior coding required, but platform scales to advanced users
- **End goal**: Users can independently run WGS analysis and generate publication-ready charts

---

## Why Website Over Desktop Software?

| Factor | Website | Desktop App |
|--------|---------|-------------|
| **Accessibility** | Works instantly in browser | Requires download/install |
| **Cross-platform** | Any OS with a browser | Need separate builds |
| **Updates** | Deploy once, everyone gets it | Users must update manually |
| **Backend execution** | Run real tools server-side | Complex local setup |
| **User accounts** | Easy authentication | More complex |

**Recommendation: Web application with real backend execution**

---

## 🎯 Unique Learning Philosophy: "Output-First"

### The Problem with Traditional Tutorials
- Start with theory → users lose interest
- Build up slowly → takes forever to see results
- Focus on commands → miss the "why"

### Our Approach: **See It, Then Build It**

```
Traditional:  Theory → Commands → Practice → Output (boring, slow)

Our Way:     OUTPUT → "How did we get here?" → Guided rebuild → Mastery
```

**Core Principle**: Show the final chart/result FIRST, then reverse-engineer it together.

---

## 🔬 The Narrative: "Outbreak Investigation"

### Story Hook
> *"A mysterious disease outbreak has been reported in a rural farming community.
> Soil samples have been collected and sequenced. Your mission: Identify the
> pathogen and trace its origin using WGS analysis."*

Each mode builds on this narrative:
- **Mode 1**: Process the raw sequencing data (is it usable?)
- **Mode 2**: Identify what's in the sample (what organism?)
- **Mode 3**: Visualize findings (show the evidence)
- **Mode 4**: Deep analysis (trace the outbreak source)

---

## 📊 Mode Structure (Output-First)

### Mode 1: Data Quality Check
**Final Output Shown First**: QC report (FastQC HTML)

```
┌─────────────────────────────────────────────────────────────────┐
│ "Here's what a clean QC report looks like. Let's create one."  │
│                                                                 │
│  [Shows: FastQC quality chart - good vs bad example]            │
│                                                                 │
│  "Your raw data just arrived from the sequencer. Let's check    │
│   if it's good enough to identify our mystery pathogen..."      │
└─────────────────────────────────────────────────────────────────┘
```

**Commands learned**: `fastqc`, `fastp`, `multiqc`
**Output**: Quality report showing if data is usable

---

### Mode 2: Species Identification
**Final Output Shown First**: Kraken2 species classification chart

```
┌─────────────────────────────────────────────────────────────────┐
│ "Look - this chart shows the bacteria found in the sample.      │
│  See that spike? That's our suspect. Let's find it ourselves."  │
│                                                                 │
│  [Shows: Krona visualization with species breakdown]            │
└─────────────────────────────────────────────────────────────────┘
```

**Commands learned**: `kraken2`, `bracken`, assembly basics
**Output**: "It's *Bacillus anthracis*" (or teaching organism)

---

### Mode 3: Visualization & Reporting
**Final Output Shown First**: Publication-ready figures

```
┌─────────────────────────────────────────────────────────────────┐
│ "This figure went into a real research paper. You'll make one." │
│                                                                 │
│  [Shows: Phylogenetic tree, abundance chart, genome coverage]   │
└─────────────────────────────────────────────────────────────────┘
```

**Skills learned**: R/Python plotting, ggplot2, matplotlib
**Output**: Charts ready for presentations/papers

---

### Mode 4: Advanced Analysis
**Final Output Shown First**: Outbreak transmission diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ "This diagram traced an outbreak to a single contaminated well. │
│  By the end of this module, you'll create your own."            │
│                                                                 │
│  [Shows: SNP phylogeny, transmission network, timeline]         │
└─────────────────────────────────────────────────────────────────┘
```

**Skills learned**: Variant calling, SNP analysis, phylogenetics
**Output**: Complete outbreak report

---

## 💡 Unique Learning Accelerators

### 1. **"Show Me First" Pattern**
Every lesson starts with the OUTPUT, not the command.

```
┌──────────────────────────┬────────────────────────────────────┐
│  Terminal                │  Story Panel                       │
│                          │                                    │
│  (waiting...)            │  🎯 YOUR GOAL                      │
│                          │  ━━━━━━━━━━━━                      │
│                          │  [Interactive QC Chart Preview]    │
│                          │                                    │
│                          │  This chart shows sequence quality │
│                          │  across your reads. Green = good.  │
│                          │                                    │
│                          │  Ready to create this? Let's go.   │
│                          │  ─────────────────────────────     │
│                          │  Step 1 of 4: Run FastQC           │
└──────────────────────────┴────────────────────────────────────┘
```

### 2. **"Smart Copy" System**
For beginners - one click copies command, but forces them to PRESS ENTER.

```
┌──────────────────────────┬────────────────────────────────────┐
│  $ fastqc sample.fastq   │  📋 COMMAND                        │
│    ↑                     │  ━━━━━━━━━━                        │
│    (pasted, blinking)    │  fastqc sample.fastq    [📋 Copy]  │
│                          │                                    │
│                          │  ✨ Command copied! Now press      │
│                          │  ENTER to run it and watch what    │
│                          │  happens...                        │
└──────────────────────────┴────────────────────────────────────┘
```

### 3. **"What Just Happened?" Explainer**
After each command, auto-explain the output.

```
┌──────────────────────────┬────────────────────────────────────┐
│  $ fastqc sample.fastq   │  ✅ COMMAND COMPLETE               │
│  Started analysis...     │  ━━━━━━━━━━━━━━━━━━                │
│  Analysis complete for   │                                    │
│  sample.fastq            │  📁 Files created:                 │
│  $                       │  • sample_fastqc.html (report)     │
│                          │  • sample_fastqc.zip (data)        │
│                          │                                    │
│                          │  🔍 What this did:                 │
│                          │  Scanned 1.2M reads and checked    │
│                          │  quality scores, GC content, and   │
│                          │  adapter contamination.            │
│                          │                                    │
│                          │  [ View Report → ]                 │
└──────────────────────────┴────────────────────────────────────┘
```

### 4. **"Checkpoint Saves"**
Auto-save after each output milestone. Users can resume anytime.

```
Mode 1: ████████░░ 80%
        ✓ FastQC complete
        ✓ Trimming complete
        → MultiQC report (current)
        ○ Summary
```

### 5. **"Difficulty Fade"**
Same command, less hand-holding over time.

```
First time:   [📋 Copy] fastqc sample.fastq    (full command shown)
Second time:  [💡 Hint] fastqc ______          (fill in the blank)
Third time:   "Run FastQC on the reads"        (figure it out)
```

### 6. **Live Output Panel**
Charts render live as data processes (not just at the end).

```
┌──────────────────────────┬────────────────────────────────────┐
│  $ kraken2 --db bacteria │  📊 LIVE RESULTS                   │
│    --report kreport.txt  │  ━━━━━━━━━━━━━━                    │
│    sample.fastq          │                                    │
│                          │  [Pie chart building in real-time] │
│  Processing: 45%...      │                                    │
│  ████████░░░░░░░░        │  Bacillus: 67% ████████            │
│                          │  E. coli:  23% ███                 │
│                          │  Other:    10% █                   │
│                          │                                    │
│                          │  🔴 Pathogen detected!             │
└──────────────────────────┴────────────────────────────────────┘
```

---

## Technical Architecture

### Architecture: Full Stack with Real Tools

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   SvelteKit  │  │   xterm.js   │  │  Chart.js/   │          │
│  │   (Fast,     │  │  (Terminal)  │  │  D3.js       │          │
│  │    Light)    │  │              │  │  (Charts)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                            │                                     │
│                     WebSocket + REST                             │
└────────────────────────────┼─────────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                        BACKEND                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   FastAPI    │  │   Redis      │  │  PostgreSQL  │          │
│  │  (Python,    │  │  (Sessions,  │  │  (Users,     │          │
│  │   async)     │  │   Queue)     │  │   Progress)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                            │                                     │
│  ┌─────────────────────────┴───────────────────────────┐        │
│  │              Docker Container Pool                   │        │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │        │
│  │  │ FastQC  │ │ Kraken2 │ │ BWA/    │ │ R/Python│   │        │
│  │  │         │ │ Bracken │ │ Samtools│ │ Plotting│   │        │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │        │
│  └─────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────┘
```

### Recommended Tech Stack (Lightweight but Powerful)

| Layer | Technology | Why |
|-------|------------|-----|
| **Frontend** | **SvelteKit** | Faster than React, smaller bundle, less boilerplate |
| **Terminal** | **xterm.js** | Industry standard, WebSocket support |
| **Styling** | **Tailwind CSS** | Rapid development |
| **Charts** | **Chart.js** or **Plotly.js** | Interactive, scientific charts |
| **Backend** | **FastAPI (Python)** | Async, fast, already Python ecosystem for bioinfo |
| **Auth** | **Auth.js** (formerly NextAuth) | Simple, secure |
| **Database** | **PostgreSQL** | User accounts, progress tracking |
| **Cache/Queue** | **Redis** | Session management, job queue |
| **Containers** | **Docker** | Isolated bioinfo tool execution |
| **Deploy** | **Railway** or **Fly.io** | Affordable, Docker-friendly |

### Why SvelteKit over Next.js?
- **60% smaller bundle** = faster load
- **Less boilerplate** = faster development
- **Built-in transitions** = smoother UX
- **Simpler state management** = less complexity

---

## Lesson Structure (JSON Schema)

```json
{
  "modeId": "mode-1-qc",
  "title": "Data Quality Control",
  "narrative": {
    "hook": "Raw sequencing data has arrived from the outbreak site...",
    "context": "Before we can identify the pathogen, we need to verify data quality."
  },
  "goalOutput": {
    "type": "image",
    "preview": "/previews/fastqc-report.png",
    "description": "A quality report showing your data is ready for analysis"
  },
  "steps": [
    {
      "id": "step-1",
      "title": "Run FastQC",
      "story": "Let's scan the raw reads for quality issues...",
      "command": {
        "full": "fastqc outbreak_sample.fastq.gz",
        "hints": ["fastqc ______", "Run FastQC on the sample"],
        "explanation": "FastQC analyzes sequence quality, GC content, and adapter contamination"
      },
      "output": {
        "files": ["outbreak_sample_fastqc.html", "outbreak_sample_fastqc.zip"],
        "livePreview": true
      },
      "checkpoint": true
    }
  ]
}
```

---

## Bioinformatics Tools (Real Execution)

### Mode 1: Quality Control
| Tool | Purpose | Output |
|------|---------|--------|
| `fastqc` | Raw read quality | HTML report |
| `fastp` | Trim adapters, filter | Cleaned FASTQ |
| `multiqc` | Aggregate reports | Summary dashboard |

### Mode 2: Species Identification
| Tool | Purpose | Output |
|------|---------|--------|
| `kraken2` | Taxonomic classification | Species list |
| `bracken` | Abundance estimation | Abundance table |
| `krona` | Interactive visualization | Krona HTML chart |

### Mode 3: Visualization (Scripting)
| Tool | Purpose | Output |
|------|---------|--------|
| `R + ggplot2` | Publication charts | PNG/PDF figures |
| `Python + matplotlib` | Custom plots | PNG/PDF figures |
| `Plotly` | Interactive charts | HTML widgets |

### Mode 4: Advanced Analysis
| Tool | Purpose | Output |
|------|---------|--------|
| `bwa` + `samtools` | Read mapping | BAM file |
| `bcftools` | Variant calling | VCF file |
| `snippy` | SNP detection | SNP table |
| `iqtree` / `fasttree` | Phylogenetics | Newick tree |
| `ggtree` (R) | Tree visualization | Phylogenetic figure |

---

## File Structure (Proposed)

```
wgs-learn/
├── frontend/                    # SvelteKit app
│   ├── src/
│   │   ├── routes/
│   │   │   ├── +page.svelte           # Landing page
│   │   │   ├── +layout.svelte         # App layout
│   │   │   ├── auth/
│   │   │   │   ├── login/+page.svelte
│   │   │   │   └── register/+page.svelte
│   │   │   └── learn/
│   │   │       └── [modeId]/
│   │   │           └── +page.svelte   # Learning interface
│   │   ├── lib/
│   │   │   ├── components/
│   │   │   │   ├── Terminal.svelte    # xterm.js wrapper
│   │   │   │   ├── StoryPanel.svelte  # Narrative panel
│   │   │   │   ├── SplitView.svelte   # Resizable layout
│   │   │   │   ├── OutputPreview.svelte # Goal visualization
│   │   │   │   ├── ProgressBar.svelte
│   │   │   │   └── LiveChart.svelte   # Real-time results
│   │   │   ├── stores/
│   │   │   │   ├── user.ts            # Auth state
│   │   │   │   ├── progress.ts        # Learning progress
│   │   │   │   └── terminal.ts        # Terminal state
│   │   │   └── api/
│   │   │       └── client.ts          # Backend API client
│   │   └── app.css
│   ├── static/
│   │   └── previews/                  # Goal output images
│   ├── package.json
│   ├── svelte.config.js
│   └── tailwind.config.js
│
├── backend/                     # FastAPI server
│   ├── app/
│   │   ├── main.py                    # FastAPI app
│   │   ├── routers/
│   │   │   ├── auth.py                # Login/register
│   │   │   ├── terminal.py            # WebSocket for terminal
│   │   │   ├── progress.py            # Save/load progress
│   │   │   └── lessons.py             # Lesson content API
│   │   ├── services/
│   │   │   ├── docker_executor.py     # Run bioinfo tools
│   │   │   ├── session_manager.py     # User containers
│   │   │   └── output_parser.py       # Parse tool outputs
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   └── progress.py
│   │   └── core/
│   │       ├── config.py
│   │       └── security.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker/                      # Bioinfo tool containers
│   ├── base-bioinfo/
│   │   └── Dockerfile               # FastQC, fastp, multiqc
│   ├── taxonomy/
│   │   └── Dockerfile               # Kraken2, bracken, krona
│   ├── mapping/
│   │   └── Dockerfile               # BWA, samtools, bcftools
│   └── visualization/
│       └── Dockerfile               # R, ggplot2, Python, matplotlib
│
├── content/                     # Lesson content
│   ├── modes/
│   │   ├── mode-1-qc/
│   │   │   ├── lesson.json
│   │   │   └── data/
│   │   │       └── outbreak_sample.fastq.gz
│   │   ├── mode-2-species/
│   │   │   └── lesson.json
│   │   ├── mode-3-charts/
│   │   │   └── lesson.json
│   │   └── mode-4-advanced/
│   │       └── lesson.json
│   └── narratives/
│       └── outbreak-story.md
│
├── docker-compose.yml
└── README.md
```

---

## Implementation Steps

### Phase 1: Foundation (Core Infrastructure)
1. **Backend Setup**
   - Initialize FastAPI project
   - Set up PostgreSQL database
   - Create user authentication (register/login)
   - Basic Docker executor for running commands

2. **Frontend Setup**
   - Initialize SvelteKit project with Tailwind
   - Create split-view layout component
   - Integrate xterm.js terminal
   - WebSocket connection to backend

3. **Terminal Connection**
   - Real terminal execution via Docker
   - Stream output to frontend in real-time
   - File system isolation per user session

### Phase 2: Mode 1 - Quality Control
4. **Content: Mode 1**
   - Create outbreak narrative introduction
   - Write step-by-step QC lesson (fastqc, fastp, multiqc)
   - Prepare sample FASTQ data
   - Create goal output previews

5. **Features: Mode 1**
   - "Show Me First" output preview
   - Smart Copy command system
   - "What Just Happened?" explainer
   - Checkpoint/progress saving
   - HTML report viewer in right panel

### Phase 3: Mode 2 - Species ID
6. **Content: Mode 2**
   - Species identification lesson (kraken2, bracken)
   - Krona visualization integration
   - Continue outbreak narrative

7. **Features: Mode 2**
   - Live chart building during analysis
   - Interactive Krona viewer embed
   - Species identification reveal moment

### Phase 4: Mode 3 - Visualization
8. **Content: Mode 3**
   - R/Python scripting introduction
   - ggplot2 / matplotlib tutorials
   - Creating publication figures

9. **Features: Mode 3**
   - Code editor (Monaco) in terminal panel
   - Live plot preview as code runs
   - Export charts as PNG/PDF

### Phase 5: Mode 4 - Advanced Analysis
10. **Content: Mode 4**
    - Variant calling workflow
    - Phylogenetic analysis
    - Outbreak transmission inference

11. **Features: Mode 4**
    - SNP heatmap visualization
    - Interactive phylogenetic tree
    - Complete outbreak report generation

### Phase 6: Polish & Launch
12. **UX Improvements**
    - Difficulty fade system
    - Achievement/completion badges
    - Mobile responsiveness
    - Performance optimization

13. **Deploy**
    - Deploy to Railway/Fly.io
    - Set up CI/CD
    - Monitoring and logging

---

## Summary: What Makes This Unique?

| Feature | Traditional Tutorials | This Platform |
|---------|----------------------|---------------|
| Starting point | Theory & commands | Final output shown first |
| Motivation | "Trust me, this matters" | "See what you'll create" |
| Narrative | None | Outbreak investigation story |
| Skill levels | Separate tracks | Same track, fading assistance |
| Tool execution | Simulated / local install | Real tools, zero setup |
| Progress | Manual tracking | Auto-checkpoints |
| Output | Text results | Live charts & visualizations |

---

## Next Steps

**Questions for you:**

1. Does the "Output-First" approach resonate? (Show result → rebuild it)
2. Happy with outbreak investigation narrative, or prefer different story?
3. SvelteKit + FastAPI stack OK, or strong preference for something else?
4. Ready to start building Phase 1?
