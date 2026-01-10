<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
	<!-- Header -->
	<header class="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
		<div class="mx-auto max-w-5xl px-6 py-6">
			<button onclick={() => goto('/')} class="mb-4 flex items-center gap-2 text-sm text-slate-400 hover:text-white">
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Home
			</button>
			<div class="flex items-center gap-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl shadow-lg shadow-emerald-500/20">
					🧬
				</div>
				<div>
					<h1 class="text-2xl font-bold text-white">WGS Bacteria Report Template</h1>
					<p class="text-sm text-slate-400">R/RMarkdown template for bacterial whole genome sequencing analysis</p>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="mx-auto max-w-5xl px-6 py-12">
		<!-- Prerequisites -->
		<section class="mb-12">
			<h2 class="mb-4 text-xl font-semibold text-white">Prerequisites</h2>
			<div class="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
				<pre class="overflow-x-auto text-sm text-slate-300"><code># Install required R packages
install.packages(c("rmarkdown", "knitr", "kableExtra", "ggplot2", "dplyr", "tidyr"))

# Bioconductor packages
if (!require("BiocManager", quietly = TRUE))
    install.packages("BiocManager")
BiocManager::install(c("ggtree", "pheatmap", "ape", "treeio"))

# Install tinytex for PDF generation
install.packages("tinytex")
tinytex::install_tinytex()</code></pre>
			</div>
		</section>

		<!-- Full RMarkdown Template -->
		<section class="mb-12">
			<h2 class="mb-4 text-xl font-semibold text-white">Complete RMarkdown Template</h2>
			<p class="mb-4 text-slate-400">Save this as <code class="rounded bg-slate-700 px-2 py-0.5">wgs_report.Rmd</code></p>
			<div class="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
				<pre class="overflow-x-auto text-sm text-slate-300"><code>---
title: "Bacterial WGS Analysis Report"
author: "Your Name"
date: "`r Sys.Date()`"
output:
  pdf_document:
    toc: true
    toc_depth: 3
    number_sections: true
---

```&#123;r setup, include=FALSE&#125;
knitr::opts_chunk$set(echo = FALSE, message = FALSE, warning = FALSE)
library(ggplot2)
library(dplyr)
library(kableExtra)
library(pheatmap)
library(ggtree)
library(ape)
```

# Executive Summary

This report summarizes the whole genome sequencing analysis of bacterial isolates.

# Assembly Quality

## QUAST Results

```&#123;r quast&#125;
# Read QUAST results
quast &lt;- read.delim("quast_results/report.tsv", header = TRUE)

# Display key metrics
quast %&gt;%
  select(Assembly, `Total.length`, `# contigs`, N50, `GC (%)`) %&gt;%
  kable(col.names = c("Sample", "Total Length (bp)", "Contigs", "N50", "GC%"),
        caption = "Assembly Statistics") %&gt;%
  kable_styling(bootstrap_options = c("striped", "hover"))
```

## Assembly Quality Plot

```&#123;r quast-plot, fig.width=8, fig.height=5&#125;
ggplot(quast, aes(x = Assembly, y = N50 / 1000)) +
  geom_bar(stat = "identity", fill = "#10b981") +
  labs(title = "Assembly N50 by Sample",
       x = "Sample", y = "N50 (kb)") +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
```

# Antimicrobial Resistance

## AMR Gene Detection

```&#123;r amr-table&#125;
# Read ABRicate results
amr &lt;- read.delim("abricate_results/summary.tsv", header = TRUE)

amr %&gt;%
  select(FILE, GENE, `%COVERAGE`, `%IDENTITY`, PRODUCT) %&gt;%
  kable(col.names = c("Sample", "Gene", "Coverage%", "Identity%", "Product"),
        caption = "Detected AMR Genes") %&gt;%
  kable_styling(bootstrap_options = c("striped", "hover")) %&gt;%
  scroll_box(height = "400px")
```

## AMR Heatmap

```&#123;r amr-heatmap, fig.width=10, fig.height=8&#125;
# Create presence/absence matrix
amr_matrix &lt;- amr %&gt;%
  mutate(present = 1) %&gt;%
  select(FILE, GENE, present) %&gt;%
  distinct() %&gt;%
  pivot_wider(names_from = GENE, values_from = present, values_fill = 0) %&gt;%
  column_to_rownames("FILE") %&gt;%
  as.matrix()

# Generate heatmap
pheatmap(amr_matrix,
         color = c("white", "#ef4444"),
         legend_breaks = c(0, 1),
         legend_labels = c("Absent", "Present"),
         main = "AMR Gene Presence/Absence",
         cluster_rows = TRUE,
         cluster_cols = TRUE)
```

# MLST Results

```&#123;r mlst&#125;
mlst &lt;- read.delim("mlst_results/mlst.tsv", header = FALSE,
                   col.names = c("File", "Scheme", "ST", paste0("Allele", 1:7)))

mlst %&gt;%
  select(File, Scheme, ST) %&gt;%
  kable(caption = "Multi-Locus Sequence Typing Results") %&gt;%
  kable_styling(bootstrap_options = c("striped", "hover"))
```

# Phylogenetic Analysis

```&#123;r phylo-tree, fig.width=10, fig.height=8&#125;
# Read tree file
tree &lt;- read.tree("iqtree_results/core_snps.treefile")

# Plot with ggtree
ggtree(tree, layout = "rectangular") +
  geom_tiplab(size = 3) +
  geom_nodepoint(aes(subset = !isTip), size = 2, color = "#3b82f6") +
  geom_treescale() +
  theme_tree2() +
  ggtitle("Core SNP Phylogenetic Tree")
```

# Pan-genome Analysis

```&#123;r pangenome, fig.width=8, fig.height=6&#125;
# Read Roary summary
pangenome &lt;- data.frame(
  Category = c("Core", "Soft-core", "Shell", "Cloud"),
  Genes = c(3987, 312, 489, 446)  # Replace with actual values
)

ggplot(pangenome, aes(x = "", y = Genes, fill = Category)) +
  geom_bar(stat = "identity", width = 1) +
  coord_polar("y", start = 0) +
  scale_fill_manual(values = c("#10b981", "#3b82f6", "#f59e0b", "#ef4444")) +
  labs(title = "Pan-genome Composition") +
  theme_void() +
  theme(legend.position = "right")
```

# Methods

## Bioinformatics Pipeline

1. **Quality Control**: FastQC, Trimmomatic
2. **Assembly**: Unicycler (hybrid) or SPAdes
3. **Quality Assessment**: QUAST, CheckM
4. **Annotation**: Prokka
5. **AMR Detection**: ABRicate (CARD database)
6. **MLST**: mlst
7. **Phylogenetics**: Snippy, IQ-TREE

# Session Info

```&#123;r session-info&#125;
sessionInfo()
```</code></pre>
			</div>
		</section>

		<!-- Generate PDF -->
		<section class="mb-12">
			<h2 class="mb-4 text-xl font-semibold text-white">Generate the PDF</h2>
			<div class="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
				<pre class="overflow-x-auto text-sm text-slate-300"><code># In R console
rmarkdown::render("wgs_report.Rmd")

# Or from command line
Rscript -e "rmarkdown::render('wgs_report.Rmd')"</code></pre>
			</div>
		</section>

		<!-- Tips -->
		<section>
			<h2 class="mb-4 text-xl font-semibold text-white">Tips</h2>
			<div class="space-y-4">
				<div class="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
					<span class="text-yellow-400">💡</span>
					<p class="text-sm text-slate-300">
						<strong class="text-yellow-400">File paths:</strong> Adjust the file paths in the template to match your directory structure.
					</p>
				</div>
				<div class="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
					<span class="text-emerald-400">✓</span>
					<p class="text-sm text-slate-300">
						<strong class="text-emerald-400">Customization:</strong> Add or remove sections based on your analysis. The template is modular.
					</p>
				</div>
				<div class="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
					<span class="text-blue-400">📋</span>
					<p class="text-sm text-slate-300">
						<strong class="text-blue-400">Parameters:</strong> Use YAML parameters for batch processing multiple samples with different inputs.
					</p>
				</div>
			</div>
		</section>
	</main>
</div>
