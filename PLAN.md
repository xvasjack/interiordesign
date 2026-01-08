# Bioinformatics Learning Platform - Design Plan

## Overview

An interactive web-based platform for learning bioinformatics analysis through narrative-driven, output-first learning. Users select a sequencing category, then a story/case study, then progress through phases of increasingly deep analysis - mirroring real-world workflows.

**Key Principle**: Every command, every line of code is shown. Nothing is skipped.

---

## Target Audience

- **Skill range**: Complete beginners to advanced users
- **Background**: Lab scientists, biologists, bioinformaticians, students
- **Assumption**: No prior coding required, but platform scales to advanced users
- **End goal**: Users can independently run analysis and generate publication-ready charts

---

## Sequencing Categories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BioLearn - Choose Your Sequencing Type                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐   ┌─────────────────────────┐                 │
│  │  🧬 WHOLE GENOME        │   │  🔬 AMPLICON             │                 │
│  │     SEQUENCING (WGS)    │   │     SEQUENCING           │                 │
│  │                         │   │                          │                 │
│  │  Complete bacterial     │   │  16S rRNA, targeted      │                 │
│  │  genome analysis        │   │  gene sequencing         │                 │
│  │                         │   │                          │                 │
│  │  [5 Narratives]         │   │  [Coming Soon]           │                 │
│  │  [Enter →]              │   │                          │                 │
│  └─────────────────────────┘   └─────────────────────────┘                 │
│                                                                             │
│  ┌─────────────────────────┐   ┌─────────────────────────┐                 │
│  │  📊 RNA SEQUENCING      │   │  🦠 METAGENOMICS         │                 │
│  │     (RNA-seq)           │   │                          │                 │
│  │                         │   │  Community profiling,    │                 │
│  │  Gene expression,       │   │  functional analysis     │                 │
│  │  differential analysis  │   │                          │                 │
│  │                         │   │  [Coming Soon]           │                 │
│  │  [Coming Soon]          │   │                          │                 │
│  └─────────────────────────┘   └─────────────────────────┘                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Category Roadmap

| Category | Status | Focus |
|----------|--------|-------|
| **Whole Genome Sequencing (WGS)** | Active | Bacterial isolate analysis |
| Amplicon Sequencing | Planned | 16S/ITS community profiling |
| RNA Sequencing | Planned | Differential expression |
| Metagenomics | Planned | Shotgun community analysis |

---

## Category: Whole Genome Sequencing (WGS)

### Focus: Bacterial Isolate Analysis

Complete workflow from raw reads to publication-ready outputs:
- Quality control & preprocessing
- Contamination detection
- Assembly & annotation
- Species identification
- AMR & virulence detection
- Variant calling & phylogenetics
- Visualization & reporting

### WGS Read Modes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WGS - Select Your Sequencing Type                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐                                               │
│  │  📊 SHORT READS          │   Illumina sequencing (MiSeq, NextSeq,       │
│  │     (Illumina)           │   NovaSeq). High accuracy, 150-300bp reads.  │
│  │                          │                                               │
│  │  [5 Narratives]          │   ✓ Current Focus                            │
│  │  [Enter →]               │                                               │
│  └─────────────────────────┘                                               │
│                                                                             │
│  ┌─────────────────────────┐                                               │
│  │  🧬 LONG READS           │   Oxford Nanopore or PacBio. Lower accuracy, │
│  │     (ONT/PacBio)         │   but 10kb+ reads for complex regions.       │
│  │                          │                                               │
│  │  [Coming Soon]           │                                               │
│  └─────────────────────────┘                                               │
│                                                                             │
│  ┌─────────────────────────┐                                               │
│  │  🔀 HYBRID               │   Combine short + long reads for best of     │
│  │     (Short + Long)       │   both: accuracy + contiguity.               │
│  │                          │                                               │
│  │  [Coming Soon]           │                                               │
│  └─────────────────────────┘                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Mode | Technology | Read Length | Accuracy | Best For | Status |
|------|------------|-------------|----------|----------|--------|
| **Short Reads** | Illumina | 150-300 bp | 99.9% | Routine analysis, SNP calling | **Active** |
| Long Reads | ONT/PacBio | 10-100+ kb | 95-99% | Plasmids, repeats, structural variants | Planned |
| Hybrid | Both | Mixed | Best | Complete genomes, complex regions | Planned |

**Current Focus: Short Reads (Illumina)**

---

## UI Layout: Three-Panel Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BioLearn  [WGS]  [Narrative: Hospital Outbreak]  Phase 2/4  [User ▾]       │
├────────────────────────────────┬────────────────────────────────────────────┤
│                                │                                            │
│  TERMINAL (Black)              │  STORY PANEL (White)                       │
│  ─────────────────             │  ──────────────────                        │
│                                │                                            │
│  $ checkm lineage_wf \         │  📖 Chapter: Contamination Check           │
│      assembly/ \               │                                            │
│      checkm_output/ \          │  Before we trust our assembly, we need     │
│      -t 4 \                    │  to verify it's not contaminated with      │
│      -x fasta                  │  DNA from other organisms.                 │
│                                │                                            │
│  [Processing...]               │  ┌────────────────────────────────────┐    │
│  Completeness: 99.2%           │  │ 📋 NEXT COMMAND                    │    │
│  Contamination: 0.8%           │  │                                    │    │
│  ✓ Assembly is clean!          │  │ checkm lineage_wf \                │    │
│                                │  │   assembly/ checkm_output/ \       │    │
│  $ _                           │  │   -t 4 -x fasta         [Copy]     │    │
│                                │  └────────────────────────────────────┘    │
│                                │                                            │
├────────────────────────────────┴────────────────────────────────────────────┤
│  OUTPUT PANEL                                                               │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  CONTAMINATION CHECK RESULTS                                         │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━                                         │   │
│  │  Completeness:  ████████████████████████████████████████░░  99.2%    │   │
│  │  Contamination: █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0.8%    │   │
│  │                                                                      │   │
│  │  ✅ PASS - Assembly is high quality and uncontaminated               │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  💡 CheckM uses marker genes to assess if your assembly is complete and    │
│     free from contamination. >95% completeness and <5% contamination       │
│     is considered good quality.                                            │
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

## WGS Narratives

Users select a real-world case study:

```
┌─────────────────────────────────────────────────────────────────┐
│  Whole Genome Sequencing - Choose Your Investigation            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🏥 HOSPITAL OUTBREAK              🍔 FOOD POISONING            │
│  MRSA spreading in the ICU.        Salmonella outbreak at       │
│  Track transmission and find       a restaurant. Confirm        │
│  the source patient.               the source strain.           │
│  [Start →]                         [Start →]                    │
│                                                                  │
│  💧 WATER CONTAMINATION            🌱 ENVIRONMENTAL             │
│  E. coli in the city water.        Anthrax-like bacteria in     │
│  Trace it back to the source.      agricultural soil samples.   │
│  [Start →]                         [Start →]                    │
│                                                                  │
│  🧪 CLINICAL ISOLATE                                             │
│  A patient's wound infection.                                    │
│  Identify the pathogen and                                       │
│  check for antibiotic resistance.                                │
│  [Start →]                                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5 WGS Narratives

| # | Narrative | Organism | Learning Focus |
|---|-----------|----------|----------------|
| 1 | **Hospital Outbreak** | *MRSA* (S. aureus) | Transmission tracking, AMR, SNP phylogeny |
| 2 | **Food Poisoning** | *Salmonella enterica* | Serotyping, outbreak clustering |
| 3 | **Water Contamination** | *E. coli* | Source attribution, virulence genes |
| 4 | **Environmental** | *Bacillus* species | Environmental isolates, species ID |
| 5 | **Clinical Isolate** | *Klebsiella pneumoniae* | Clinical workflow, AMR profiling |

---

## WGS Analysis Phases

Every narrative follows 4 phases:

### Phase 1: Quality Control & Preprocessing
**Goal**: Clean, verified reads ready for analysis

| Step | Tool | Purpose | Command |
|------|------|---------|---------|
| 1.1 | **FastQC** | Raw read quality | `fastqc *.fastq.gz -o fastqc_raw/ -t 2` |
| 1.2 | **fastp** | Trim, filter, QC | See full command below |
| 1.3 | **FastQC** | Verify cleaned reads | `fastqc clean_*.fastq.gz -o fastqc_clean/ -t 2` |
| 1.4 | **MultiQC** | Aggregate reports | `multiqc . -o multiqc_report/` |

```bash
# Complete fastp command
fastp \
    -i reads_R1.fastq.gz \
    -I reads_R2.fastq.gz \
    -o clean_R1.fastq.gz \
    -O clean_R2.fastq.gz \
    --html fastp_report.html \
    --json fastp_report.json \
    --thread 4 \
    --detect_adapter_for_pe \
    --cut_front \
    --cut_tail \
    --cut_mean_quality 20 \
    --length_required 50 \
    --correction
```

**Phase 1 Outputs**: QC dashboard, before/after quality comparison

---

### Phase 2: Assembly & Contamination Check
**Goal**: High-quality, uncontaminated genome assembly

| Step | Tool | Purpose | Command |
|------|------|---------|---------|
| 2.1 | **Unicycler** | De novo assembly | See full command below |
| 2.2 | **QUAST** | Assembly statistics | `quast.py assembly.fasta -o quast_report/` |
| 2.3 | **CheckM** | Contamination check | `checkm lineage_wf assembly/ checkm_out/ -t 4 -x fasta` |
| 2.4 | **ConFindr** | Intra-species contamination | `confindr.py -i assembly/ -o confindr_out/` |

```bash
# Complete Unicycler command
unicycler \
    -1 clean_R1.fastq.gz \
    -2 clean_R2.fastq.gz \
    -o assembly/ \
    --mode normal \
    --min_fasta_length 500 \
    -t 4
```

**Why Unicycler over SPAdes?**
| Feature | Unicycler | SPAdes |
|---------|-----------|--------|
| Circular contigs | Resolves circular chromosomes & plasmids | Often leaves them linear |
| Assembly quality | Better contiguity, fewer contigs | Good but more fragmented |
| Bacterial focus | Designed specifically for bacteria | General-purpose |
| Under the hood | Uses SPAdes + Racon + Pilon polishing | Core assembler only |
| Long reads | Hybrid assembly with Nanopore/PacBio | Separate mode |

**Contamination Detection Explained**:
| Tool | What It Detects | When to Use |
|------|-----------------|-------------|
| **CheckM** | Mixed species, incomplete genomes | Always - standard QC |
| **ConFindr** | Same-species strain mixtures | When purity is critical |

**Phase 2 Outputs**: Assembly stats, contamination report, PASS/FAIL status

---

### Phase 3: Species ID, Annotation & AMR
**Goal**: Know what organism it is and what genes it has

| Step | Tool | Purpose | Command |
|------|------|---------|---------|
| 3.1 | **Kraken2** | Species identification | See full command below |
| 3.2 | **MLST** | Sequence typing | `mlst contigs.fasta > mlst_results.tsv` |
| 3.3 | **Bakta** | Genome annotation | `bakta contigs.fasta --db /db/bakta -o bakta_out/ -t 4` |
| 3.4 | **AMRFinderPlus** | AMR gene detection | `amrfinder -n contigs.fasta -o amr_results.tsv --threads 4` |
| 3.5 | **ABRicate** | Multi-database screening | See full commands below |

```bash
# Complete Kraken2 command
kraken2 \
    --db /db/kraken2_standard \
    --paired clean_R1.fastq.gz clean_R2.fastq.gz \
    --output kraken2_output.txt \
    --report kraken2_report.txt \
    --threads 4 \
    --confidence 0.1
```

#### ABRicate: Multi-Database Screening

ABRicate can screen against multiple databases. Run all to compare results:

```bash
# Screen against ALL databases
abricate --db resfinder contigs.fasta > abricate_resfinder.tsv
abricate --db card contigs.fasta > abricate_card.tsv
abricate --db ncbi contigs.fasta > abricate_ncbi.tsv
abricate --db argannot contigs.fasta > abricate_argannot.tsv
abricate --db megares contigs.fasta > abricate_megares.tsv
abricate --db vfdb contigs.fasta > abricate_vfdb.tsv
abricate --db plasmidfinder contigs.fasta > abricate_plasmidfinder.tsv
abricate --db ecoli_vf contigs.fasta > abricate_ecoli_vf.tsv

# Combine all results for comparison
abricate --summary abricate_*.tsv > abricate_summary.tsv
```

**ABRicate Databases Explained**:

| Database | Focus | Best For | Notes |
|----------|-------|----------|-------|
| **resfinder** | AMR genes | Clinical isolates | DTU database, well-curated, includes phenotype predictions |
| **card** | AMR genes + mechanisms | Research, comprehensive | Includes resistance mechanisms, ontology-based |
| **ncbi** | AMR genes | General use | NCBI AMRFinderPlus database, official reference |
| **argannot** | AMR genes | Legacy studies | Older database, good for historical comparisons |
| **megares** | AMR genes | Metagenomics | Designed for metagenomic studies, hierarchical |
| **vfdb** | Virulence factors | Pathogenicity | Virulence Factor Database - toxins, adhesins, etc. |
| **plasmidfinder** | Plasmid replicons | Plasmid typing | Identifies plasmid incompatibility groups |
| **ecoli_vf** | E. coli virulence | E. coli only | Specialized for E. coli pathotypes |

**Which database to use?**
- **Clinical/Public Health**: resfinder (curated) + vfdb (virulence)
- **Research**: card (comprehensive) + vfdb
- **Regulatory/Official**: ncbi (NCBI standard)
- **Compare all**: Run multiple and compare - different databases may catch different genes

**Phase 3 Outputs**: Species ID, MLST type, annotated genome, AMR gene tables (multiple databases), virulence genes, plasmid types

---

### Phase 4: Variant Calling, Phylogeny & Visualization
**Goal**: Understand relationships and create publication figures

| Step | Tool | Purpose | Command |
|------|------|---------|---------|
| 4.1 | **Snippy** | SNP calling vs reference | See full command below |
| 4.2 | **snippy-core** | Core genome alignment | `snippy-core --ref ref.gbk sample1/ sample2/ sample3/` |
| 4.3 | **IQ-TREE** | Phylogenetic tree | `iqtree -s core.aln -m GTR+G -bb 1000 -nt AUTO` |
| 4.4 | **R/Python** | Visualization scripts | See scripts below |

```bash
# Complete Snippy command
snippy \
    --ref reference.gbk \
    --R1 clean_R1.fastq.gz \
    --R2 clean_R2.fastq.gz \
    --outdir snippy_sample1/ \
    --cpus 4 \
    --ram 8 \
    --mincov 10 \
    --minfrac 0.9
```

**Phase 4 Outputs**: SNP table, phylogenetic tree, AMR heatmap, outbreak report

---

## Curated Tool List: Best-in-Class Only

### Selection Criteria
- Widely used in published research
- Actively maintained
- Best performance in benchmarks
- Good documentation

### The Definitive WGS Tool Stack

| Category | Tool | Why This One | Alternatives |
|----------|------|--------------|--------------|
| **Read QC** | **FastQC** | Universal standard, detailed reports | - |
| **Trimming** | **fastp** | All-in-one, fast, great reports | Trimmomatic |
| **Report Aggregation** | **MultiQC** | Combines all QC into one dashboard | - |
| **Assembly** | **Unicycler** | Best for bacteria, circular contigs, uses SPAdes+polishing | SPAdes (simpler) |
| **Assembly QC** | **QUAST** | Standard metrics (N50, contigs, etc.) | - |
| **Contamination** | **CheckM** | Industry standard, completeness + contamination | CheckM2 (newer) |
| **Contamination (reads)** | **ConFindr** | Detects intra-species mixtures | FastQ Screen |
| **Species ID** | **Kraken2** | Fast, accurate, widely used | GTDB-Tk (more accurate) |
| **MLST** | **mlst** | Simple, reliable sequence typing | PubMLST web |
| **Annotation** | **Bakta** | Modern, faster, better databases | Prokka (older) |
| **AMR Detection** | **AMRFinderPlus** | NCBI standard, curated database | - |
| **Multi-DB Screening** | **ABRicate** | 8 databases (resfinder, card, vfdb, etc.) | - |
| **Read Mapping** | **BWA-MEM2** | Faster BWA, same accuracy | Minimap2 |
| **SAM/BAM** | **Samtools** | Universal standard | - |
| **Variant Calling** | **Snippy** | All-in-one SNP pipeline for bacteria | BCFtools (manual) |
| **Phylogeny** | **IQ-TREE** | Fast, model selection, bootstrap | RAxML-NG, FastTree |
| **Visualization (R)** | **ggplot2 + ggtree** | Publication quality | - |
| **Visualization (Py)** | **matplotlib + seaborn** | Standard scientific plotting | - |

### Tool Versions (Recommended)

```bash
# Core tools
fastqc          v0.12.1
fastp           v0.23.4
multiqc         v1.21
unicycler       v0.5.0
quast           v5.2.0
checkm          v1.2.2    # or checkm2 v1.0.1
confindr        v0.8.1

# Taxonomy & Annotation
kraken2         v2.1.3
mlst            v2.23.0
bakta           v1.9.0
amrfinderplus   v3.12.8
abricate        v1.0.1    # databases: resfinder, card, ncbi, vfdb, plasmidfinder, etc.

# Variant calling & phylogeny
bwa-mem2        v2.2.1
samtools        v1.19
snippy          v4.6.0
iqtree          v2.2.6

# Visualization
R               v4.3+
python          v3.10+
```

---

## Complete Workflow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     WGS BACTERIAL ANALYSIS WORKFLOW                       │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: Quality Control                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│  │  FastQC  │───▶│  fastp   │───▶│  FastQC  │───▶│ MultiQC  │           │
│  │  (raw)   │    │ (trim)   │    │ (clean)  │    │ (report) │           │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘           │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: Assembly & Contamination Check                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│  │Unicycler │───▶│  QUAST   │───▶│  CheckM  │───▶│ ConFindr │           │
│  │(assemble)│    │ (stats)  │    │(contam.) │    │ (purity) │           │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘           │
│                                        │                                  │
│                              [PASS: <5% contamination]                    │
│                              [FAIL: Investigate or re-sequence]           │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: Identification & Annotation                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                            │
│  │ Kraken2  │    │   MLST   │    │  Bakta   │                            │
│  │(species) │    │ (typing) │    │(annotate)│                            │
│  └──────────┘    └──────────┘    └──────────┘                            │
│        │                                │                                 │
│        ▼                                ▼                                 │
│  ┌─────────────────┐    ┌─────────────────────────┐                      │
│  │  AMRFinderPlus  │    │  ABRicate (8 databases) │                      │
│  │   (AMR genes)   │    │  resfinder, card, vfdb  │                      │
│  └─────────────────┘    └─────────────────────────┘                      │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  PHASE 4: Phylogeny & Visualization                                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│  │  Snippy  │───▶│snippy-   │───▶│ IQ-TREE  │───▶│  ggtree  │           │
│  │  (SNPs)  │    │  core    │    │ (tree)   │    │  (plot)  │           │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘           │
│                                                         │                 │
│                                                         ▼                 │
│                                              ┌──────────────────┐        │
│                                              │ Publication-ready │        │
│                                              │     Figures       │        │
│                                              └──────────────────┘        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Example Scripts

### R: AMR Heatmap

```r
# amr_heatmap.R
library(tidyverse)
library(pheatmap)

# Read AMRFinderPlus output
amr <- read_tsv("amr_results.tsv")

# Create presence/absence matrix
amr_matrix <- amr %>%
  select(sample = `Protein identifier`, gene = `Gene symbol`) %>%
  mutate(present = 1) %>%
  pivot_wider(names_from = gene, values_from = present, values_fill = 0)

# Plot heatmap
pdf("amr_heatmap.pdf", width = 12, height = 8)
pheatmap(
  as.matrix(amr_matrix[-1]),
  color = c("white", "#d62728"),
  legend_breaks = c(0, 1),
  legend_labels = c("Absent", "Present"),
  main = "Antimicrobial Resistance Genes",
  fontsize = 10
)
dev.off()
```

### R: Phylogenetic Tree with ggtree

```r
# phylo_tree.R
library(ggtree)
library(treeio)

# Read IQ-TREE output
tree <- read.tree("core.aln.treefile")

# Plot tree
pdf("phylogenetic_tree.pdf", width = 10, height = 8)
ggtree(tree, layout = "rectangular") +
  geom_tiplab(size = 3) +
  geom_treescale() +
  theme_tree2() +
  ggtitle("Core Genome SNP Phylogeny")
dev.off()
```

### Python: Coverage Plot

```python
# coverage_plot.py
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Read samtools depth output
depth = pd.read_csv("depth.txt", sep="\t",
                    names=["chrom", "pos", "depth"])

# Plot coverage
plt.figure(figsize=(14, 4))
plt.fill_between(depth["pos"], depth["depth"], alpha=0.7)
plt.xlabel("Genome Position (bp)")
plt.ylabel("Read Depth")
plt.title("Genome Coverage")
plt.axhline(y=30, color="red", linestyle="--", label="30x threshold")
plt.legend()
plt.tight_layout()
plt.savefig("coverage_plot.pdf")
```

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (SvelteKit)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  3-Panel UI  │  │   xterm.js   │  │  Plotly.js   │          │
│  │   Layout     │  │  (Terminal)  │  │  (Charts)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                            │                                     │
│                     WebSocket + REST                             │
└────────────────────────────┼─────────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                     BACKEND (FastAPI)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Auth +     │  │    Redis     │  │  PostgreSQL  │          │
│  │   Sessions   │  │   (Queue)    │  │   (Users)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                            │                                     │
│  ┌─────────────────────────┴───────────────────────────┐        │
│  │           Docker Container (per user session)        │        │
│  │  All bioinfo tools pre-installed                     │        │
│  │  Isolated filesystem with sample data                │        │
│  └─────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | SvelteKit + Tailwind + xterm.js + Plotly |
| Backend | FastAPI (Python) |
| Database | PostgreSQL |
| Queue | Redis + Celery |
| Containers | Docker |
| Deploy | Railway / Fly.io |

---

## File Structure

```
biolearn/
├── frontend/
│   └── src/
│       ├── routes/
│       │   ├── +page.svelte              # Category selection
│       │   ├── wgs/
│       │   │   ├── +page.svelte          # WGS narrative selection
│       │   │   └── [narrativeId]/
│       │   │       └── [phaseId]/
│       │   │           └── +page.svelte  # 3-panel learning UI
│       │   ├── amplicon/                 # Future
│       │   └── rnaseq/                   # Future
│       └── lib/
│           └── components/
│               ├── Terminal.svelte
│               ├── StoryPanel.svelte
│               └── OutputPanel.svelte
│
├── backend/
│   └── app/
│       ├── main.py
│       ├── routers/
│       │   ├── terminal.py
│       │   ├── narratives.py
│       │   └── progress.py
│       └── services/
│           ├── docker_executor.py
│           └── output_watcher.py
│
├── docker/
│   └── bioinfo-wgs/
│       └── Dockerfile                    # All WGS tools
│
└── content/
    └── wgs/
        ├── hospital-outbreak/
        │   ├── narrative.json
        │   ├── phase1.json
        │   ├── phase2.json
        │   ├── phase3.json
        │   ├── phase4.json
        │   ├── scripts/
        │   └── data/
        ├── food-poisoning/
        ├── water-contamination/
        ├── environmental/
        └── clinical-isolate/
```

---

## Implementation Roadmap

### Phase 1: Foundation
1. Backend: FastAPI + PostgreSQL + Docker executor
2. Frontend: SvelteKit 3-panel layout + xterm.js
3. Auth: User accounts, session management

### Phase 2: First Narrative (Hospital Outbreak)
4. Content: Write all 4 phases
5. Docker: Build bioinfo-wgs container with all tools
6. UI: Command cards, output viewers

### Phase 3: Remaining Narratives
7. Food Poisoning narrative
8. Water Contamination narrative
9. Environmental narrative
10. Clinical Isolate narrative

### Phase 4: Polish & Future Categories
11. Performance optimization
12. Deploy to production
13. Plan Amplicon Sequencing category

---

## Summary

| Aspect | Choice |
|--------|--------|
| **Focus** | WGS bacterial analysis (first category) |
| **Narratives** | 5 real-world stories |
| **Tools** | Best-in-class only, widely used |
| **Contamination** | CheckM + ConFindr |
| **AMR** | AMRFinderPlus (NCBI standard) |
| **Phylogeny** | Snippy + IQ-TREE |
| **Visualization** | R (ggplot2/ggtree) + Python (matplotlib) |

---

## Next Steps

1. Does this category structure work?
2. Tool selection looks good?
3. Ready to start building?
