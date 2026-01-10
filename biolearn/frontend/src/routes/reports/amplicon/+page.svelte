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
				<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-2xl shadow-lg shadow-purple-500/20">
					🦠
				</div>
				<div>
					<h1 class="text-2xl font-bold text-white">16S/Amplicon Report Template</h1>
					<p class="text-sm text-slate-400">R/RMarkdown template for microbiome and amplicon sequencing analysis</p>
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
install.packages(c("rmarkdown", "knitr", "kableExtra", "ggplot2", "dplyr", "tidyr", "vegan"))

# Bioconductor packages
if (!require("BiocManager", quietly = TRUE))
    install.packages("BiocManager")
BiocManager::install(c("phyloseq", "DESeq2", "microbiome", "ComplexHeatmap"))

# Install tinytex for PDF generation
install.packages("tinytex")
tinytex::install_tinytex()</code></pre>
			</div>
		</section>

		<!-- Full RMarkdown Template -->
		<section class="mb-12">
			<h2 class="mb-4 text-xl font-semibold text-white">Complete RMarkdown Template</h2>
			<p class="mb-4 text-slate-400">Save this as <code class="rounded bg-slate-700 px-2 py-0.5">amplicon_report.Rmd</code></p>
			<div class="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
				<pre class="overflow-x-auto text-sm text-slate-300"><code>---
title: "16S rRNA Microbiome Analysis Report"
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
library(phyloseq)
library(ggplot2)
library(dplyr)
library(tidyr)
library(vegan)
library(kableExtra)
library(microbiome)
```

# Executive Summary

This report presents the analysis of 16S rRNA gene sequencing data for microbiome characterization.

# Data Overview

```&#123;r load-data&#125;
# Load phyloseq object (from QIIME2, DADA2, or mothur)
# ps <- readRDS("phyloseq_object.rds")

# Example: Create sample phyloseq for demonstration
# Replace with your actual data loading code
```

## Sample Summary

```&#123;r sample-summary&#125;
# Sample data summary
sample_data(ps) %>%
  as.data.frame() %>%
  group_by(Group) %>%
  summarise(
    n = n(),
    `Mean Reads` = mean(TotalReads),
    `SD Reads` = sd(TotalReads)
  ) %>%
  kable(caption = "Sample Summary by Group") %>%
  kable_styling(bootstrap_options = c("striped", "hover"))
```

# Alpha Diversity

Alpha diversity measures the diversity within each sample.

## Diversity Metrics

```&#123;r alpha-diversity, fig.width=10, fig.height=6&#125;
# Calculate alpha diversity metrics
alpha_div <- estimate_richness(ps, measures = c("Observed", "Shannon", "Simpson", "Chao1"))
alpha_div$SampleID <- rownames(alpha_div)
alpha_div <- merge(alpha_div, sample_data(ps), by.x = "SampleID", by.y = "row.names")

# Plot Shannon diversity
ggplot(alpha_div, aes(x = Group, y = Shannon, fill = Group)) +
  geom_boxplot(alpha = 0.7) +
  geom_jitter(width = 0.2, alpha = 0.5) +
  labs(title = "Shannon Diversity by Group",
       x = "Group", y = "Shannon Index") +
  theme_minimal() +
  theme(legend.position = "none")
```

## Statistical Test

```&#123;r alpha-stats&#125;
# Kruskal-Wallis test for Shannon diversity
kruskal_result <- kruskal.test(Shannon ~ Group, data = alpha_div)

data.frame(
  Test = "Kruskal-Wallis",
  Metric = "Shannon",
  Statistic = round(kruskal_result$statistic, 3),
  `P-value` = format.pval(kruskal_result$p.value, digits = 3)
) %>%
  kable(caption = "Alpha Diversity Statistical Test") %>%
  kable_styling(bootstrap_options = c("striped", "hover"))
```

# Beta Diversity

Beta diversity measures the diversity between samples.

## PCoA Ordination

```&#123;r beta-diversity, fig.width=10, fig.height=8&#125;
# Calculate Bray-Curtis distance
bray_dist <- phyloseq::distance(ps, method = "bray")

# PCoA ordination
pcoa <- ordinate(ps, method = "PCoA", distance = bray_dist)

# Plot
plot_ordination(ps, pcoa, color = "Group") +
  geom_point(size = 4, alpha = 0.7) +
  stat_ellipse(level = 0.95) +
  labs(title = "PCoA of Bray-Curtis Distances") +
  theme_minimal()
```

## PERMANOVA Test

```&#123;r permanova&#125;
# PERMANOVA test
set.seed(123)
permanova <- adonis2(bray_dist ~ Group, data = as(sample_data(ps), "data.frame"))

permanova %>%
  as.data.frame() %>%
  kable(caption = "PERMANOVA Results", digits = 4) %>%
  kable_styling(bootstrap_options = c("striped", "hover"))
```

# Taxonomic Composition

## Phylum-level Bar Plot

```&#123;r taxonomy-phylum, fig.width=12, fig.height=6&#125;
# Aggregate to phylum level
ps_phylum <- tax_glom(ps, taxrank = "Phylum")
ps_phylum_rel <- transform_sample_counts(ps_phylum, function(x) x / sum(x) * 100)

# Melt for plotting
phylum_df <- psmelt(ps_phylum_rel)

# Plot
ggplot(phylum_df, aes(x = Sample, y = Abundance, fill = Phylum)) +
  geom_bar(stat = "identity") +
  facet_wrap(~Group, scales = "free_x") +
  labs(title = "Phylum-level Relative Abundance",
       x = "Sample", y = "Relative Abundance (%)") +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 90, hjust = 1, vjust = 0.5),
        legend.position = "bottom")
```

## Genus-level Heatmap

```&#123;r taxonomy-heatmap, fig.width=12, fig.height=10&#125;
# Top 20 genera
ps_genus <- tax_glom(ps, taxrank = "Genus")
top20 <- names(sort(taxa_sums(ps_genus), decreasing = TRUE)[1:20])
ps_top20 <- prune_taxa(top20, ps_genus)

# Transform to relative abundance
ps_top20_rel <- transform_sample_counts(ps_top20, function(x) x / sum(x) * 100)

# Create heatmap
plot_heatmap(ps_top20_rel, taxa.label = "Genus", sample.label = "SampleID",
             low = "white", high = "#7c3aed", na.value = "white") +
  labs(title = "Top 20 Genera Heatmap") +
  theme(axis.text.x = element_text(angle = 90, hjust = 1))
```

# Differential Abundance

```&#123;r differential-abundance&#125;
# Using DESeq2 for differential abundance
library(DESeq2)

# Convert to DESeq2 object
diagdds <- phyloseq_to_deseq2(ps, ~ Group)
diagdds <- DESeq(diagdds, test = "Wald", fitType = "parametric")

# Get results
res <- results(diagdds, cooksCutoff = FALSE)
res_df <- as.data.frame(res) %>%
  filter(!is.na(padj)) %>%
  arrange(padj) %>%
  head(20)

res_df %>%
  select(baseMean, log2FoldChange, pvalue, padj) %>%
  kable(caption = "Top Differentially Abundant Taxa (DESeq2)",
        digits = c(1, 2, 4, 4)) %>%
  kable_styling(bootstrap_options = c("striped", "hover")) %>%
  scroll_box(height = "400px")
```

# Core Microbiome

```&#123;r core-microbiome, fig.width=10, fig.height=6&#125;
# Identify core microbiome (present in >50% of samples at >0.1% abundance)
core_taxa <- core_members(ps, detection = 0.001, prevalence = 0.5)

cat("Number of core taxa:", length(core_taxa), "\n")

# Plot core abundance
core_ps <- prune_taxa(core_taxa, ps)
core_ps_rel <- transform_sample_counts(core_ps, function(x) x / sum(x) * 100)

plot_bar(core_ps_rel, fill = "Genus") +
  labs(title = "Core Microbiome Composition",
       y = "Relative Abundance (%)") +
  theme_minimal()
```

# Methods

## Bioinformatics Pipeline

1. **Demultiplexing**: Samples separated by barcode
2. **Quality Filtering**: DADA2/QIIME2 quality control
3. **Denoising**: DADA2 ASV inference
4. **Taxonomy Assignment**: SILVA/Greengenes database
5. **Phylogenetic Tree**: FastTree
6. **Statistical Analysis**: phyloseq, vegan, DESeq2

## Parameters

- Forward primer: 515F (5'-GTGCCAGCMGCCGCGGTAA-3')
- Reverse primer: 806R (5'-GGACTACHVGGGTWTCTAAT-3')
- Target region: V4 (16S rRNA)
- Minimum read quality: Q30
- Minimum read length: 250 bp

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
rmarkdown::render("amplicon_report.Rmd")

# Or from command line
Rscript -e "rmarkdown::render('amplicon_report.Rmd')"</code></pre>
			</div>
		</section>

		<!-- Tips -->
		<section>
			<h2 class="mb-4 text-xl font-semibold text-white">Tips</h2>
			<div class="space-y-4">
				<div class="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
					<span class="text-yellow-400">💡</span>
					<p class="text-sm text-slate-300">
						<strong class="text-yellow-400">Data format:</strong> This template expects a phyloseq object. You can import from QIIME2 (.qza), DADA2, or mothur outputs.
					</p>
				</div>
				<div class="flex items-start gap-3 rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
					<span class="text-purple-400">🔬</span>
					<p class="text-sm text-slate-300">
						<strong class="text-purple-400">Rarefaction:</strong> Consider rarefying samples for diversity analyses to account for uneven sequencing depth.
					</p>
				</div>
				<div class="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
					<span class="text-emerald-400">✓</span>
					<p class="text-sm text-slate-300">
						<strong class="text-emerald-400">Multiple testing:</strong> Always use adjusted p-values (padj) for differential abundance to control false discovery rate.
					</p>
				</div>
			</div>
		</section>
	</main>
</div>
