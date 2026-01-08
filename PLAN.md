# Bioinformatics Learning Platform - Design Plan

## Overview

An interactive web-based platform for learning bacterial WGS (Whole Genome Sequencing) analysis through narrative-driven, output-first learning. Users select a story/case study, then progress through phases of increasingly deep analysis - mirroring real-world bioinformatics workflows.

**Key Principle**: Every command, every line of code is shown. Nothing is skipped.

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

## UI Layout: Three-Panel Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WGS Learn    [Narrative: Soil Outbreak]    Phase 2/4    [User ▾]          │
├────────────────────────────────┬────────────────────────────────────────────┤
│                                │                                            │
│  TERMINAL (Black)              │  STORY PANEL (White)                       │
│  ─────────────────             │  ──────────────────                        │
│                                │                                            │
│  $ fastp \                     │  📖 Chapter: Quality Control               │
│      -i reads_R1.fastq.gz \    │                                            │
│      -I reads_R2.fastq.gz \    │  The sequencing facility just sent your    │
│      -o clean_R1.fastq.gz \    │  data. Before we can identify the          │
│      -O clean_R2.fastq.gz \    │  pathogen, we need to ensure the reads     │
│      --html qc_report.html \   │  are high quality.                         │
│      --json qc_report.json \   │                                            │
│      --thread 4                │  ┌────────────────────────────────────┐    │
│                                │  │ 📋 NEXT COMMAND                    │    │
│  Read1 before filtering:       │  │                                    │    │
│  total reads: 1234567          │  │ fastp \                            │    │
│  total bases: 185185050        │  │   -i reads_R1.fastq.gz \           │    │
│  Q30 bases: 176426298(95.27%)  │  │   -I reads_R2.fastq.gz \           │    │
│                                │  │   -o clean_R1.fastq.gz \           │    │
│  $ _                           │  │   ...                    [Copy]    │    │
│                                │  └────────────────────────────────────┘    │
│                                │                                            │
├────────────────────────────────┴────────────────────────────────────────────┤
│  OUTPUT PANEL                                                               │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ QC Report       │  │ Read Quality    │  │ Adapter Content │             │
│  │ [View HTML →]   │  │ [Chart]         │  │ [Chart]         │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
│  💡 What this did: Removed low-quality reads and adapter sequences.        │
│     Input: 1,234,567 reads → Output: 1,189,234 reads (96.3% retained)      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Panel Responsibilities

| Panel | Purpose | Content |
|-------|---------|---------|
| **Terminal (Left)** | User types/runs commands | Real bash, complete scripts, command history |
| **Story (Right)** | Narrative + guidance | Story context, next command to type, explanation |
| **Output (Bottom)** | Results & visualizations | Charts, reports, file previews, "what just happened" |

---

## Narrative-Based Learning Structure

### Users Select a Narrative (Story)

Instead of abstract "modes" or "levels", users choose a real-world case study:

```
┌─────────────────────────────────────────────────────────────────┐
│  Choose Your Investigation                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🌱 SOIL OUTBREAK                        🦠 GUT MICROBIOME      │
│  A farming community reports             A patient with          │
│  mysterious illness. Trace the           recurring infections.   │
│  pathogen in soil samples.               Analyze their gut       │
│  [Start →]                               bacteria.               │
│                                          [Start →]               │
│                                                                  │
│  💧 WATER CONTAMINATION                  🏥 HOSPITAL OUTBREAK   │
│  E. coli detected in the                 MRSA spreading in       │
│  city water supply. Find                 the ICU. Track the      │
│  the source.                             transmission chain.     │
│  [Start →]                               [Start →]               │
│                                                                  │
│  🍔 FOOD POISONING                                               │
│  Salmonella outbreak linked                                      │
│  to a restaurant. Confirm                                        │
│  the source strain.                                              │
│  [Start →]                                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5 Narrative Storylines

| # | Narrative | Organism Focus | Unique Analysis |
|---|-----------|----------------|-----------------|
| 1 | **Soil Outbreak** | Environmental bacteria, *Bacillus* | Soil metagenomics, environmental sampling |
| 2 | **Gut Microbiome** | Mixed community, *Enterococcus*, *Bacteroides* | Diversity analysis, dysbiosis |
| 3 | **Water Contamination** | *E. coli*, coliforms | Source tracking, contamination mapping |
| 4 | **Hospital Outbreak** | *MRSA*, *Klebsiella* | Transmission networks, AMR genes |
| 5 | **Food Poisoning** | *Salmonella*, *Listeria* | Serotyping, outbreak cluster analysis |

---

## Phases Within Each Narrative

Every narrative follows the same 4-phase structure (but with story-specific data):

### Phase 1: Basic Processing (QC & Preprocessing)
**Goal**: Clean, quality-checked reads ready for analysis

| Step | Tool | Command (Complete) | Output |
|------|------|-------------------|--------|
| 1.1 | Check raw quality | `fastqc reads_R1.fastq.gz reads_R2.fastq.gz -o fastqc_raw/` | HTML reports |
| 1.2 | Trim & filter | `fastp -i reads_R1.fastq.gz -I reads_R2.fastq.gz -o clean_R1.fastq.gz -O clean_R2.fastq.gz --html fastp_report.html --json fastp_report.json --thread 4 --detect_adapter_for_pe --cut_front --cut_tail --cut_mean_quality 20 --length_required 50` | Cleaned FASTQ, reports |
| 1.3 | Verify clean quality | `fastqc clean_R1.fastq.gz clean_R2.fastq.gz -o fastqc_clean/` | HTML reports |
| 1.4 | Aggregate reports | `multiqc fastqc_raw/ fastqc_clean/ fastp_report.json -o multiqc_report/` | Summary dashboard |

**Phase 1 Outputs**: QC dashboard, before/after comparison charts

---

### Phase 2: Deep Analysis

| Step | Tool | Purpose | Command (Complete) |
|------|------|---------|-------------------|
| **Assembly** |
| 2.1 | SPAdes/SKESA | Assemble genome | `spades.py -1 clean_R1.fastq.gz -2 clean_R2.fastq.gz -o assembly/ --careful -t 4` |
| 2.2 | QUAST | Assembly QC | `quast.py assembly/contigs.fasta -o quast_report/` |
| **Species ID** |
| 2.3 | Kraken2 | Taxonomic classification | `kraken2 --db /db/kraken2_standard --paired clean_R1.fastq.gz clean_R2.fastq.gz --output kraken2_output.txt --report kraken2_report.txt --threads 4` |
| 2.4 | Bracken | Abundance estimation | `bracken -d /db/kraken2_standard -i kraken2_report.txt -o bracken_output.txt -r 150 -l S` |
| 2.5 | Krona | Visualization | `ktImportTaxonomy -q 2 -t 3 kraken2_output.txt -o krona_chart.html` |
| **Annotation** |
| 2.6 | Bakta | Genome annotation | `bakta assembly/contigs.fasta --db /db/bakta --output bakta_results/ --threads 4` |
| 2.7 | Prokka (alt) | Genome annotation | `prokka assembly/contigs.fasta --outdir prokka_results/ --prefix sample --cpus 4` |
| **AMR & Virulence** |
| 2.8 | ABRicate | AMR gene detection | `abricate --db resfinder assembly/contigs.fasta > abricate_amr.tsv` |
| 2.9 | ABRicate | Virulence genes | `abricate --db vfdb assembly/contigs.fasta > abricate_virulence.tsv` |
| **Variant Calling** |
| 2.10 | BWA | Index reference | `bwa index reference.fasta` |
| 2.11 | BWA | Map reads | `bwa mem -t 4 reference.fasta clean_R1.fastq.gz clean_R2.fastq.gz \| samtools sort -o aligned.bam` |
| 2.12 | Samtools | Index BAM | `samtools index aligned.bam` |
| 2.13 | BCFtools | Call variants | `bcftools mpileup -f reference.fasta aligned.bam \| bcftools call -mv -Oz -o variants.vcf.gz` |
| 2.14 | SnpEff | Annotate variants | `snpeff -v organism_db variants.vcf.gz > annotated_variants.vcf` |

**Phase 2 Outputs**: Species ID chart, annotated genome, AMR gene table, variant list

---

### Phase 3: Visualization & Charts (Scripting)

Users learn to create publication-ready figures using R and Python:

| Step | Language | Purpose | Script (Complete) |
|------|----------|---------|-------------------|
| 3.1 | R | AMR heatmap | See full script below |
| 3.2 | R | Abundance bar chart | See full script below |
| 3.3 | Python | Coverage plot | See full script below |
| 3.4 | R | Phylogenetic tree | See full script below |

#### Example: Complete R Script for AMR Heatmap

```r
# amr_heatmap.R
# Creates a heatmap of antimicrobial resistance genes

# Load libraries
library(tidyverse)
library(pheatmap)
library(RColorBrewer)

# Read ABRicate output
amr_data <- read_tsv("abricate_amr.tsv", col_names = c(
  "file", "sequence", "start", "end", "strand",
  "gene", "coverage", "identity", "database",
  "accession", "product", "resistance"
))

# Create presence/absence matrix
amr_matrix <- amr_data %>%
  mutate(present = 1) %>%
  select(gene, present) %>%
  distinct() %>%
  pivot_wider(names_from = gene, values_from = present, values_fill = 0)

# Generate heatmap
pdf("amr_heatmap.pdf", width = 10, height = 8)
pheatmap(
  as.matrix(amr_matrix),
  color = c("white", "#E41A1C"),
  legend_breaks = c(0, 1),
  legend_labels = c("Absent", "Present"),
  main = "Antimicrobial Resistance Genes Detected",
  fontsize = 12,
  border_color = "grey60"
)
dev.off()

print("Heatmap saved to amr_heatmap.pdf")
```

**Phase 3 Outputs**: Publication-ready PDF figures, interactive HTML charts

---

### Phase 4: Advanced Analysis & Reporting

| Step | Tool | Purpose | Command/Script |
|------|------|---------|----------------|
| 4.1 | Snippy | SNP calling vs reference | `snippy --ref reference.gbk --R1 clean_R1.fastq.gz --R2 clean_R2.fastq.gz --outdir snippy_results/ --cpus 4` |
| 4.2 | Snippy-core | Core SNP alignment | `snippy-core --ref reference.gbk snippy_results/` |
| 4.3 | IQ-TREE | Phylogenetic tree | `iqtree -s core.aln -m GTR+G -bb 1000 -nt AUTO` |
| 4.4 | R (ggtree) | Tree visualization | See script below |
| 4.5 | R Markdown | Final report | Knit complete analysis report |

#### Outbreak Transmission Analysis (Narrative-specific)

```r
# transmission_network.R
# Visualize outbreak transmission based on SNP distances

library(tidyverse)
library(igraph)
library(ggraph)

# Load SNP distance matrix
snp_dist <- read_tsv("core.dist.tab")

# Create network (edges where SNP distance < 10)
edges <- snp_dist %>%
  pivot_longer(-1, names_to = "sample2", values_to = "snps") %>%
  rename(sample1 = 1) %>%
  filter(snps > 0, snps < 10)

# Build graph
g <- graph_from_data_frame(edges, directed = FALSE)

# Plot transmission network
pdf("transmission_network.pdf", width = 12, height = 10)
ggraph(g, layout = "fr") +
  geom_edge_link(aes(width = 1/snps), alpha = 0.5, color = "grey40") +
  geom_node_point(size = 8, color = "#3182bd") +
  geom_node_text(aes(label = name), repel = TRUE) +
  theme_void() +
  labs(title = "Outbreak Transmission Network",
       subtitle = "Edges connect samples with < 10 SNP differences")
dev.off()
```

**Phase 4 Outputs**: Phylogenetic tree, transmission network, complete outbreak report

---

## Bioinformatics Tools: Complete List

### Tool Fit Considerations (Real-World Selection)

| Category | Recommended Tool | Alternatives | Why This One |
|----------|-----------------|--------------|--------------|
| **QC** | fastp | Trimmomatic, cutadapt | Faster, all-in-one, great reports |
| **Assembly** | SPAdes | SKESA, Unicycler | Gold standard for bacterial genomes |
| **Species ID** | Kraken2 + Bracken | GTDB-Tk, Centrifuge | Fast, accurate, good visualization |
| **Annotation** | Bakta | Prokka, PGAP | Modern, better database, faster |
| **AMR** | ABRicate | AMRFinderPlus, CARD-RGI | Simple, multi-database, scriptable |
| **Mapping** | BWA-MEM | Bowtie2, Minimap2 | Standard for short reads |
| **Variants** | BCFtools | GATK, FreeBayes | Lightweight, accurate for bacteria |
| **Phylogeny** | IQ-TREE | RAxML, FastTree | Modern, fast, model selection |
| **Viz (R)** | ggplot2 + ggtree | base R, lattice | Publication quality, flexible |
| **Viz (Py)** | matplotlib + seaborn | plotly, bokeh | Standard, widely used |

### Docker Container Organization

```
┌────────────────────────────────────────────────────────────────┐
│  bioinfo-base                                                   │
│  FastQC, fastp, MultiQC, basic utils                           │
├────────────────────────────────────────────────────────────────┤
│  bioinfo-assembly                                               │
│  SPAdes, SKESA, QUAST, Unicycler                               │
├────────────────────────────────────────────────────────────────┤
│  bioinfo-taxonomy                                               │
│  Kraken2, Bracken, Krona, GTDB-Tk                              │
├────────────────────────────────────────────────────────────────┤
│  bioinfo-annotation                                             │
│  Bakta, Prokka, ABRicate, AMRFinderPlus                        │
├────────────────────────────────────────────────────────────────┤
│  bioinfo-mapping                                                │
│  BWA, Bowtie2, Samtools, BCFtools, SnpEff                      │
├────────────────────────────────────────────────────────────────┤
│  bioinfo-phylogeny                                              │
│  Snippy, IQ-TREE, FastTree, Gubbins                            │
├────────────────────────────────────────────────────────────────┤
│  bioinfo-viz                                                    │
│  R (tidyverse, ggplot2, ggtree, pheatmap)                      │
│  Python (matplotlib, seaborn, pandas, biopython)               │
└────────────────────────────────────────────────────────────────┘
```

---

## Complete Script Coverage Philosophy

### Every Line Shown

Traditional tutorials:
```
"Run FastQC on your reads"
$ fastqc reads.fastq
```

**Our approach**:
```
$ fastqc \
    reads_R1.fastq.gz \
    reads_R2.fastq.gz \
    --outdir fastqc_results/ \
    --threads 4 \
    --noextract

# Explanation for each flag:
# --outdir      : Where to save reports
# --threads     : Use 4 CPU cores (faster)
# --noextract   : Don't unzip the results
```

### Why Complete Scripts Matter

1. **Copy-paste works** - Users can take scripts directly to their own work
2. **No hidden magic** - Everything is explicit
3. **Real-world ready** - Same commands work in actual pipelines
4. **Learn flags** - Understand what each option does
5. **Debug-friendly** - When things break, users know what was run

---

## Technical Architecture

### Architecture: Full Stack with Real Tools

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   SvelteKit  │  │   xterm.js   │  │  Plotly.js   │          │
│  │   (3 panels) │  │  (Terminal)  │  │  (Charts)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                            │                                     │
│                     WebSocket + REST                             │
└────────────────────────────┼─────────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                        BACKEND                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   FastAPI    │  │   Redis      │  │  PostgreSQL  │          │
│  │  (Python)    │  │  (Queue)     │  │  (Users)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                            │                                     │
│  ┌─────────────────────────┴───────────────────────────┐        │
│  │         Docker Container Pool (per user)             │        │
│  │  All bioinfo tools installed, isolated filesystem    │        │
│  └─────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────┘
```

### Recommended Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Frontend** | **SvelteKit** | Lightweight, fast, great for 3-panel layout |
| **Terminal** | **xterm.js** | Industry standard, WebSocket support |
| **Styling** | **Tailwind CSS** | Rapid development |
| **Charts** | **Plotly.js** | Interactive scientific charts |
| **Backend** | **FastAPI (Python)** | Async, Python bioinfo ecosystem |
| **Auth** | **Auth.js** | Simple authentication |
| **Database** | **PostgreSQL** | User accounts, progress tracking |
| **Queue** | **Redis + Celery** | Job management for long-running tools |
| **Containers** | **Docker** | Isolated tool execution |
| **Deploy** | **Railway / Fly.io** | Docker-friendly, affordable |

---

## File Structure

```
wgs-learn/
├── frontend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── +page.svelte              # Landing: narrative selection
│   │   │   ├── +layout.svelte
│   │   │   ├── auth/
│   │   │   │   ├── login/+page.svelte
│   │   │   │   └── register/+page.svelte
│   │   │   └── learn/
│   │   │       └── [narrativeId]/
│   │   │           └── [phaseId]/
│   │   │               └── +page.svelte  # 3-panel learning interface
│   │   ├── lib/
│   │   │   ├── components/
│   │   │   │   ├── Terminal.svelte       # xterm.js (left panel)
│   │   │   │   ├── StoryPanel.svelte     # Narrative + commands (right)
│   │   │   │   ├── OutputPanel.svelte    # Results & charts (bottom)
│   │   │   │   ├── ThreePanelLayout.svelte
│   │   │   │   ├── CommandCard.svelte    # Copyable command block
│   │   │   │   ├── OutputViewer.svelte   # HTML/chart/file viewer
│   │   │   │   └── ProgressTracker.svelte
│   │   │   ├── stores/
│   │   │   │   ├── user.ts
│   │   │   │   ├── narrative.ts          # Current story state
│   │   │   │   └── terminal.ts
│   │   │   └── api/
│   │   │       └── client.ts
│   │   └── app.css
│   ├── static/
│   │   └── previews/                     # Goal output images
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── terminal.py               # WebSocket terminal
│   │   │   ├── narratives.py             # Narrative content API
│   │   │   └── progress.py
│   │   ├── services/
│   │   │   ├── docker_executor.py        # Run tools in containers
│   │   │   ├── output_watcher.py         # Detect new output files
│   │   │   └── session_manager.py
│   │   └── models/
│   │       ├── user.py
│   │       └── progress.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker/
│   ├── bioinfo-base/Dockerfile
│   ├── bioinfo-assembly/Dockerfile
│   ├── bioinfo-taxonomy/Dockerfile
│   ├── bioinfo-annotation/Dockerfile
│   ├── bioinfo-mapping/Dockerfile
│   ├── bioinfo-phylogeny/Dockerfile
│   └── bioinfo-viz/Dockerfile
│
├── content/
│   ├── narratives/
│   │   ├── soil-outbreak/
│   │   │   ├── narrative.json            # Story metadata
│   │   │   ├── phase1.json               # Steps, commands, explanations
│   │   │   ├── phase2.json
│   │   │   ├── phase3.json
│   │   │   ├── phase4.json
│   │   │   ├── scripts/                  # Complete R/Python scripts
│   │   │   │   ├── amr_heatmap.R
│   │   │   │   ├── abundance_plot.R
│   │   │   │   └── transmission_network.R
│   │   │   └── data/
│   │   │       ├── reads_R1.fastq.gz
│   │   │       ├── reads_R2.fastq.gz
│   │   │       └── reference.fasta
│   │   ├── gut-microbiome/
│   │   ├── water-contamination/
│   │   ├── hospital-outbreak/
│   │   └── food-poisoning/
│   └── shared/
│       ├── commands.json                 # Shared command definitions
│       └── explanations.json             # Tool explanations
│
├── docker-compose.yml
└── README.md
```

---

## Narrative Content Schema

### narrative.json
```json
{
  "id": "soil-outbreak",
  "title": "Soil Outbreak Investigation",
  "description": "A farming community reports mysterious illness. Trace the pathogen in soil samples.",
  "icon": "🌱",
  "organism": "Bacillus cereus",
  "difficulty": "beginner-friendly",
  "estimatedTime": "4-6 hours",
  "phases": [
    {
      "id": "phase1",
      "title": "Quality Control",
      "description": "Prepare raw sequencing data for analysis",
      "steps": 4
    },
    {
      "id": "phase2",
      "title": "Deep Analysis",
      "description": "Species ID, annotation, AMR detection, variants",
      "steps": 14
    },
    {
      "id": "phase3",
      "title": "Visualization",
      "description": "Create publication-ready charts with R/Python",
      "steps": 4
    },
    {
      "id": "phase4",
      "title": "Outbreak Report",
      "description": "Phylogenetics, transmission analysis, final report",
      "steps": 5
    }
  ]
}
```

### phase1.json (example step)
```json
{
  "phaseId": "phase1",
  "title": "Quality Control",
  "steps": [
    {
      "id": "step-1-1",
      "title": "Check Raw Read Quality",
      "story": {
        "text": "The sequencing facility just sent your data from the soil samples. Before we can hunt for pathogens, we need to make sure the data is good quality. Low-quality reads can lead to false results.",
        "narrativeHook": "You open the email from the sequencing core. Two files attached: reads_R1.fastq.gz and reads_R2.fastq.gz. Time to see what we're working with..."
      },
      "command": {
        "tool": "fastqc",
        "full": "fastqc reads_R1.fastq.gz reads_R2.fastq.gz --outdir fastqc_raw/ --threads 2",
        "breakdown": [
          { "part": "fastqc", "explanation": "The tool for quality control of sequencing data" },
          { "part": "reads_R1.fastq.gz reads_R2.fastq.gz", "explanation": "Input files (forward and reverse reads)" },
          { "part": "--outdir fastqc_raw/", "explanation": "Save reports to this folder" },
          { "part": "--threads 2", "explanation": "Use 2 CPU cores for faster processing" }
        ]
      },
      "expectedOutput": {
        "files": ["fastqc_raw/reads_R1_fastqc.html", "fastqc_raw/reads_R2_fastqc.html"],
        "display": "html",
        "successIndicator": "Analysis complete"
      },
      "explanation": {
        "whatHappened": "FastQC scanned 1.2 million reads and generated quality reports.",
        "keyMetrics": ["Per-base quality scores", "GC content", "Adapter contamination", "Sequence duplication"],
        "nextStep": "If quality looks good (mostly green), we proceed. If not, we'll trim the bad parts."
      }
    }
  ]
}
```

---

## Implementation Phases

### Phase 1: Foundation
1. Backend: FastAPI + PostgreSQL + Docker executor
2. Frontend: SvelteKit 3-panel layout + xterm.js
3. Terminal: Real execution via Docker containers
4. Auth: User registration, login, session management

### Phase 2: First Narrative (Soil Outbreak)
5. Content: Write complete Phase 1-4 for soil outbreak
6. Scripts: Create all R/Python visualization scripts
7. Data: Prepare sample FASTQ files
8. UI: Command cards, output viewers, progress tracking

### Phase 3: Additional Narratives
9. Add Gut Microbiome narrative
10. Add Water Contamination narrative
11. Add Hospital Outbreak narrative
12. Add Food Poisoning narrative

### Phase 4: Polish
13. Difficulty fade system
14. Mobile responsiveness
15. Performance optimization
16. Deploy to production

---

## Summary: What Makes This Platform Unique?

| Feature | Traditional Tutorials | This Platform |
|---------|----------------------|---------------|
| Structure | Levels/modules | Story-driven narratives |
| Starting point | Theory | Output shown first |
| Commands | Simplified examples | Complete, production-ready |
| Scripts | Snippets | Full scripts, copy-paste ready |
| Tool selection | Whatever | Real-world best practices |
| Execution | Simulated/local | Real tools, cloud-hosted |
| Output | Screenshots | Live, interactive charts |

---

## Next Steps

1. Does the 3-panel layout (terminal / story / output) work?
2. Are the 5 narratives good starting points?
3. Should I start scaffolding the project?
