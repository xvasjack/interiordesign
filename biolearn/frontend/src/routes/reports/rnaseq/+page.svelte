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
				<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl shadow-lg shadow-blue-500/20">
					📊
				</div>
				<div>
					<h1 class="text-2xl font-bold text-white">RNA-Seq Report Template</h1>
					<p class="text-sm text-slate-400">R/RMarkdown template for differential gene expression analysis</p>
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
install.packages(c("rmarkdown", "knitr", "kableExtra", "ggplot2", "dplyr", "tidyr", "pheatmap", "RColorBrewer"))

# Bioconductor packages
if (!require("BiocManager", quietly = TRUE))
    install.packages("BiocManager")
BiocManager::install(c("DESeq2", "EnhancedVolcano", "clusterProfiler", "org.Hs.eg.db", "enrichplot", "AnnotationDbi"))

# Install tinytex for PDF generation
install.packages("tinytex")
tinytex::install_tinytex()</code></pre>
			</div>
		</section>

		<!-- Full RMarkdown Template -->
		<section class="mb-12">
			<h2 class="mb-4 text-xl font-semibold text-white">Complete RMarkdown Template</h2>
			<p class="mb-4 text-slate-400">Save this as <code class="rounded bg-slate-700 px-2 py-0.5">rnaseq_report.Rmd</code></p>
			<div class="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
				<pre class="overflow-x-auto text-sm text-slate-300"><code>---
title: "RNA-Seq Differential Expression Analysis Report"
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
library(DESeq2)
library(ggplot2)
library(dplyr)
library(tidyr)
library(pheatmap)
library(RColorBrewer)
library(EnhancedVolcano)
library(clusterProfiler)
library(org.Hs.eg.db)
library(kableExtra)
```

# Executive Summary

This report presents differential gene expression analysis from RNA-seq data, comparing experimental conditions to identify significantly regulated genes and enriched biological pathways.

# Data Overview

```&#123;r load-data&#125;
# Load count matrix and sample information
# counts <- read.csv("counts_matrix.csv", row.names = 1)
# coldata <- read.csv("sample_info.csv", row.names = 1)

# Example: Create DESeq2 object
# dds <- DESeqDataSetFromMatrix(countData = counts,
#                               colData = coldata,
#                               design = ~ condition)
```

## Sample Summary

```&#123;r sample-summary&#125;
# Display sample information
coldata %>%
  group_by(condition) %>%
  summarise(
    n = n(),
    `Total Reads (M)` = mean(total_reads / 1e6),
    `Mapped %` = mean(mapped_percent)
  ) %>%
  kable(caption = "Sample Summary by Condition") %>%
  kable_styling(bootstrap_options = c("striped", "hover"))
```

# Quality Control

## Library Size Distribution

```&#123;r library-size, fig.width=10, fig.height=5&#125;
# Plot library sizes
lib_sizes <- data.frame(
  Sample = colnames(counts),
  Reads = colSums(counts) / 1e6
)
lib_sizes <- merge(lib_sizes, coldata, by.x = "Sample", by.y = "row.names")

ggplot(lib_sizes, aes(x = Sample, y = Reads, fill = condition)) +
  geom_bar(stat = "identity") +
  labs(title = "Library Size Distribution",
       x = "Sample", y = "Total Reads (millions)") +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1)) +
  scale_fill_brewer(palette = "Set1")
```

## PCA Plot

```&#123;r pca-plot, fig.width=8, fig.height=6&#125;
# Variance stabilizing transformation
vsd <- vst(dds, blind = FALSE)

# PCA
pcaData <- plotPCA(vsd, intgroup = "condition", returnData = TRUE)
percentVar <- round(100 * attr(pcaData, "percentVar"))

ggplot(pcaData, aes(x = PC1, y = PC2, color = condition)) +
  geom_point(size = 4, alpha = 0.8) +
  stat_ellipse(level = 0.95) +
  xlab(paste0("PC1: ", percentVar[1], "% variance")) +
  ylab(paste0("PC2: ", percentVar[2], "% variance")) +
  labs(title = "PCA of Samples") +
  theme_minimal() +
  scale_color_brewer(palette = "Set1")
```

## Sample Correlation Heatmap

```&#123;r correlation-heatmap, fig.width=8, fig.height=8&#125;
# Sample distance matrix
sampleDists <- dist(t(assay(vsd)))
sampleDistMatrix <- as.matrix(sampleDists)

# Annotation
annotation_col <- data.frame(
  Condition = coldata$condition,
  row.names = rownames(coldata)
)

pheatmap(sampleDistMatrix,
         clustering_distance_rows = sampleDists,
         clustering_distance_cols = sampleDists,
         annotation_col = annotation_col,
         color = colorRampPalette(rev(brewer.pal(9, "Blues")))(100),
         main = "Sample Distance Heatmap")
```

# Differential Expression Analysis

```&#123;r deseq2-analysis&#125;
# Run DESeq2
dds <- DESeq(dds)
res <- results(dds, contrast = c("condition", "treatment", "control"))
res <- res[order(res$padj), ]

# Summary
summary(res)
```

## Results Summary

```&#123;r de-summary&#125;
# Count significant genes
sig_up <- sum(res$padj < 0.05 & res$log2FoldChange > 1, na.rm = TRUE)
sig_down <- sum(res$padj < 0.05 & res$log2FoldChange < -1, na.rm = TRUE)

data.frame(
  Category = c("Total Genes", "Upregulated (padj<0.05, LFC>1)",
               "Downregulated (padj<0.05, LFC<-1)", "Not Significant"),
  Count = c(nrow(res), sig_up, sig_down, nrow(res) - sig_up - sig_down)
) %>%
  kable(caption = "Differential Expression Summary") %>%
  kable_styling(bootstrap_options = c("striped", "hover"))
```

## Volcano Plot

```&#123;r volcano-plot, fig.width=10, fig.height=8&#125;
EnhancedVolcano(res,
    lab = rownames(res),
    x = 'log2FoldChange',
    y = 'padj',
    title = 'Differential Expression: Treatment vs Control',
    pCutoff = 0.05,
    FCcutoff = 1,
    pointSize = 2.0,
    labSize = 3.0,
    col = c('grey', 'grey', 'grey', '#ef4444'),
    colAlpha = 0.6,
    legendPosition = 'right',
    legendLabSize = 12,
    legendIconSize = 4.0)
```

## MA Plot

```&#123;r ma-plot, fig.width=10, fig.height=6&#125;
plotMA(res, ylim = c(-5, 5), main = "MA Plot: Log2 Fold Change vs Mean Expression")
```

## Top Differentially Expressed Genes

```&#123;r top-genes&#125;
# Top 20 genes by adjusted p-value
res_df <- as.data.frame(res) %>%
  filter(!is.na(padj)) %>%
  arrange(padj) %>%
  head(20)

res_df %>%
  select(baseMean, log2FoldChange, pvalue, padj) %>%
  mutate(
    baseMean = round(baseMean, 1),
    log2FoldChange = round(log2FoldChange, 2),
    pvalue = format.pval(pvalue, digits = 2),
    padj = format.pval(padj, digits = 2)
  ) %>%
  kable(caption = "Top 20 Differentially Expressed Genes",
        col.names = c("Base Mean", "Log2 FC", "P-value", "Adjusted P")) %>%
  kable_styling(bootstrap_options = c("striped", "hover")) %>%
  scroll_box(height = "400px")
```

# Expression Heatmap

```&#123;r expression-heatmap, fig.width=10, fig.height=12&#125;
# Select top 50 genes by variance
topVarGenes <- head(order(rowVars(assay(vsd)), decreasing = TRUE), 50)
mat <- assay(vsd)[topVarGenes, ]
mat <- mat - rowMeans(mat)  # Center rows

# Annotation
annotation_col <- data.frame(
  Condition = coldata$condition,
  row.names = rownames(coldata)
)

pheatmap(mat,
         annotation_col = annotation_col,
         cluster_rows = TRUE,
         cluster_cols = TRUE,
         show_rownames = TRUE,
         fontsize_row = 8,
         color = colorRampPalette(c("#3b82f6", "white", "#ef4444"))(100),
         main = "Top 50 Variable Genes")
```

# Pathway Enrichment Analysis

## GO Enrichment

```&#123;r go-enrichment, fig.width=10, fig.height=8&#125;
# Get significant genes
sig_genes <- rownames(res)[which(res$padj < 0.05 & abs(res$log2FoldChange) > 1)]

# Convert to Entrez IDs (assuming rownames are gene symbols)
entrez_ids <- mapIds(org.Hs.eg.db,
                     keys = sig_genes,
                     column = "ENTREZID",
                     keytype = "SYMBOL",
                     multiVals = "first")
entrez_ids <- na.omit(entrez_ids)

# GO enrichment
ego <- enrichGO(gene = entrez_ids,
                OrgDb = org.Hs.eg.db,
                ont = "BP",
                pAdjustMethod = "BH",
                pvalueCutoff = 0.05,
                readable = TRUE)

# Plot
dotplot(ego, showCategory = 15, title = "GO Biological Process Enrichment")
```

## GO Terms Table

```&#123;r go-table&#125;
ego_df <- as.data.frame(ego) %>%
  head(15) %>%
  select(Description, GeneRatio, pvalue, p.adjust, Count)

ego_df %>%
  mutate(
    pvalue = format.pval(pvalue, digits = 2),
    p.adjust = format.pval(p.adjust, digits = 2)
  ) %>%
  kable(caption = "Top 15 Enriched GO Terms (Biological Process)",
        col.names = c("GO Term", "Gene Ratio", "P-value", "Adj. P", "Count")) %>%
  kable_styling(bootstrap_options = c("striped", "hover")) %>%
  scroll_box(height = "400px")
```

## KEGG Pathway Enrichment

```&#123;r kegg-enrichment, fig.width=10, fig.height=8&#125;
# KEGG enrichment
ekegg <- enrichKEGG(gene = entrez_ids,
                    organism = 'hsa',
                    pvalueCutoff = 0.05)

# Plot
dotplot(ekegg, showCategory = 15, title = "KEGG Pathway Enrichment")
```

## Gene Set Enrichment Network

```&#123;r enrichment-network, fig.width=12, fig.height=10&#125;
# Create enrichment map
emapplot(pairwise_termsim(ego), showCategory = 20)
```

# Gene Expression Profiles

```&#123;r gene-profiles, fig.width=10, fig.height=6&#125;
# Plot expression of top 6 genes
top6 <- rownames(res_df)[1:6]

# Get normalized counts
norm_counts <- counts(dds, normalized = TRUE)

# Prepare data for plotting
plot_data <- data.frame(
  Sample = rep(colnames(norm_counts), length(top6)),
  Gene = rep(top6, each = ncol(norm_counts)),
  Expression = as.vector(t(norm_counts[top6, ]))
)
plot_data <- merge(plot_data, coldata, by.x = "Sample", by.y = "row.names")

ggplot(plot_data, aes(x = condition, y = log2(Expression + 1), fill = condition)) +
  geom_boxplot(alpha = 0.7) +
  geom_jitter(width = 0.2, alpha = 0.5) +
  facet_wrap(~Gene, scales = "free_y") +
  labs(title = "Expression of Top Differentially Expressed Genes",
       x = "Condition", y = "Log2(Normalized Counts + 1)") +
  theme_minimal() +
  theme(legend.position = "none") +
  scale_fill_brewer(palette = "Set1")
```

# Methods

## Bioinformatics Pipeline

1. **Quality Control**: FastQC for raw read assessment
2. **Trimming**: Trimmomatic/fastp for adapter removal
3. **Alignment**: STAR or HISAT2 to reference genome
4. **Quantification**: featureCounts or HTSeq
5. **Normalization**: DESeq2 median-of-ratios
6. **Differential Expression**: DESeq2 negative binomial model
7. **Pathway Analysis**: clusterProfiler for GO/KEGG enrichment

## Statistical Thresholds

- Adjusted p-value cutoff: 0.05 (Benjamini-Hochberg)
- Log2 fold change cutoff: |1| (2-fold change)
- Minimum count filter: 10 reads across samples

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
rmarkdown::render("rnaseq_report.Rmd")

# Or from command line
Rscript -e "rmarkdown::render('rnaseq_report.Rmd')"</code></pre>
			</div>
		</section>

		<!-- Tips -->
		<section>
			<h2 class="mb-4 text-xl font-semibold text-white">Tips</h2>
			<div class="space-y-4">
				<div class="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
					<span class="text-yellow-400">💡</span>
					<p class="text-sm text-slate-300">
						<strong class="text-yellow-400">Input format:</strong> This template expects a count matrix (genes x samples) and a sample metadata file with condition information.
					</p>
				</div>
				<div class="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
					<span class="text-blue-400">📋</span>
					<p class="text-sm text-slate-300">
						<strong class="text-blue-400">Organism database:</strong> Change <code class="rounded bg-slate-700 px-1">org.Hs.eg.db</code> to your organism (e.g., <code class="rounded bg-slate-700 px-1">org.Mm.eg.db</code> for mouse).
					</p>
				</div>
				<div class="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
					<span class="text-emerald-400">✓</span>
					<p class="text-sm text-slate-300">
						<strong class="text-emerald-400">Batch effects:</strong> If you have batch effects, include batch in the DESeq2 design formula: <code class="rounded bg-slate-700 px-1">~ batch + condition</code>.
					</p>
				</div>
				<div class="flex items-start gap-3 rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
					<span class="text-purple-400">🔬</span>
					<p class="text-sm text-slate-300">
						<strong class="text-purple-400">Low counts:</strong> Filter out low-expressed genes before analysis. A common threshold is keeping genes with at least 10 counts in a minimum number of samples.
					</p>
				</div>
			</div>
		</section>
	</main>
</div>
