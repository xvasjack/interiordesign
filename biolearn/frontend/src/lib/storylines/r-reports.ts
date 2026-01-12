export interface StorylineSection {
	type: 'intro' | 'context' | 'task' | 'phase' | 'complete' | 'alert' | 'decision' | 'image';
	title?: string;
	text: string;
	command?: string;
	explanation?: string;
	requiredDir?: string | null;
	parameters?: { name: string; desc: string }[];
	hint?: string | null;
	phase?: number;
	imageUrl?: string;
	imageAlt?: string;
	options?: { id: string; label: string; description: string }[];
}

export interface Storyline {
	id: string;
	title: string;
	subtitle: string;
	organism: string;
	technology: 'illumina' | 'pacbio' | 'nanopore' | 'hybrid' | 'r-report';
	technologyLabel: string;
	dataDir: string;
	sections: StorylineSection[];
	toolsUsed: string[];
}

// ============================================
// WGS BACTERIA REPORT STORYLINE
// ============================================

const wgsBacteriaReportSections: StorylineSection[] = [
	{
		type: 'intro',
		text: `Creating Publication-Ready WGS Report:\n\nYou have completed a bacterial whole genome sequencing analysis and need to generate a professional PDF report summarizing your findings for publication or clinical reporting.`,
		hint: null,
		requiredDir: null
	},
	{
		type: 'context',
		text: `This tutorial will guide you through creating an R Markdown report that includes:\n\n• Assembly quality statistics (QUAST)\n• AMR gene heatmaps\n• Phylogenetic tree visualization\n• MLST results table\n• Pan-genome composition\n\nWe'll build the report step by step, learning each visualization technique.`,
		hint: null,
		requiredDir: null
	},
	// Phase 1: Setup
	{
		type: 'phase',
		title: 'Phase 1: Environment Setup',
		text: 'Install and load the required R packages for report generation.',
		phase: 1
	},
	{
		type: 'task',
		title: 'Step 1: Install Required Packages',
		text: `Install the R packages needed for WGS report generation.`,
		command: `Rscript -e "install.packages(c('rmarkdown', 'knitr', 'kableExtra', 'ggplot2', 'dplyr', 'tidyr', 'pheatmap', 'RColorBrewer'), repos='https://cran.r-project.org')"`,
		explanation: 'Installing core packages: rmarkdown for report generation, kableExtra for tables, ggplot2 for plots, pheatmap for heatmaps.',
		requiredDir: '/data/wgs_report',
		parameters: [
			{ name: 'rmarkdown', desc: 'R Markdown document generation' },
			{ name: 'kableExtra', desc: 'Enhanced table formatting' },
			{ name: 'pheatmap', desc: 'Pretty heatmaps' },
			{ name: 'ggplot2', desc: 'Grammar of graphics plotting' }
		]
	},
	{
		type: 'task',
		title: 'Step 2: Install Bioconductor Packages',
		text: `Install ggtree for phylogenetic tree visualization.`,
		command: `Rscript -e "if (!require('BiocManager', quietly=TRUE)) install.packages('BiocManager'); BiocManager::install(c('ggtree', 'ape', 'treeio'))"`,
		explanation: 'ggtree is a Bioconductor package for phylogenetic tree visualization with ggplot2 grammar.',
		requiredDir: '/data/wgs_report',
		parameters: [
			{ name: 'ggtree', desc: 'Phylogenetic tree visualization' },
			{ name: 'ape', desc: 'Phylogenetic analysis' },
			{ name: 'treeio', desc: 'Tree file I/O' }
		]
	},
	{
		type: 'task',
		title: 'Step 3: Install TinyTeX for PDF',
		text: `Install TinyTeX for PDF compilation.`,
		command: `Rscript -e "install.packages('tinytex'); tinytex::install_tinytex()"`,
		explanation: 'TinyTeX is a lightweight LaTeX distribution required to compile R Markdown to PDF.',
		requiredDir: '/data/wgs_report',
		parameters: [
			{ name: 'tinytex', desc: 'Lightweight LaTeX for PDF generation' }
		]
	},
	// Phase 2: Data Loading
	{
		type: 'phase',
		title: 'Phase 2: Load and Prepare Data',
		text: 'Load your analysis results into R for visualization.',
		phase: 2
	},
	{
		type: 'task',
		title: 'Step 4: Load QUAST Results',
		text: `Read the QUAST assembly statistics into R.`,
		command: `Rscript -e "quast <- read.delim('quast_results/report.tsv', header=TRUE); print(head(quast))"`,
		explanation: 'QUAST output is tab-delimited. We load it as a data frame for table generation.',
		requiredDir: '/data/wgs_report',
		parameters: [
			{ name: 'read.delim()', desc: 'Read tab-separated file' },
			{ name: 'header=TRUE', desc: 'First row contains column names' }
		]
	},
	{
		type: 'task',
		title: 'Step 5: Load AMR Results',
		text: `Read ABRicate AMR gene detection results.`,
		command: `Rscript -e "amr <- read.delim('abricate_results/summary.tsv', header=TRUE); print(table(amr\\$GENE))"`,
		explanation: 'ABRicate summary contains gene names, coverage, and identity for each sample.',
		requiredDir: '/data/wgs_report',
		parameters: [
			{ name: 'summary.tsv', desc: 'ABRicate combined results' },
			{ name: 'table()', desc: 'Count occurrences of each gene' }
		]
	},
	{
		type: 'task',
		title: 'Step 6: Load Phylogenetic Tree',
		text: `Read the Newick format phylogenetic tree.`,
		command: `Rscript -e "library(ape); tree <- read.tree('iqtree_results/core_snps.treefile'); print(tree)"`,
		explanation: 'The tree file from IQ-TREE is in Newick format, readable by the ape package.',
		requiredDir: '/data/wgs_report',
		parameters: [
			{ name: 'read.tree()', desc: 'Parse Newick tree format' },
			{ name: '.treefile', desc: 'IQ-TREE output tree' }
		]
	},
	// Phase 3: Tables
	{
		type: 'phase',
		title: 'Phase 3: Generate Tables',
		text: 'Create formatted tables for the report.',
		phase: 3
	},
	{
		type: 'task',
		title: 'Step 7: Assembly Statistics Table',
		text: `Create a formatted QUAST statistics table.`,
		command: `Rscript -e "library(kableExtra); quast <- read.delim('quast_results/report.tsv'); quast %>% select(Assembly, Total.length, N50, GC....) %>% kable(col.names=c('Sample', 'Length', 'N50', 'GC%'), caption='Assembly Statistics') %>% kable_styling(bootstrap_options=c('striped', 'hover'))"`,
		explanation: 'kableExtra creates publication-quality HTML/PDF tables with styling options.',
		requiredDir: '/data/wgs_report',
		parameters: [
			{ name: 'kable()', desc: 'Create table from data frame' },
			{ name: 'kable_styling()', desc: 'Apply visual styling' },
			{ name: 'bootstrap_options', desc: 'Striped rows, hover highlight' }
		]
	},
	{
		type: 'task',
		title: 'Step 8: MLST Results Table',
		text: `Create a table of MLST sequence types.`,
		command: `Rscript -e "library(kableExtra); mlst <- read.delim('mlst_results/mlst.tsv', header=FALSE, col.names=c('File','Scheme','ST',paste0('Allele',1:7))); mlst %>% select(File, Scheme, ST) %>% kable(caption='MLST Results') %>% kable_styling()"`,
		explanation: 'MLST output shows the sequence type (ST) and allele profile for each isolate.',
		requiredDir: '/data/wgs_report',
		parameters: [
			{ name: 'col.names', desc: 'Manually specify column names' },
			{ name: 'ST', desc: 'Sequence Type identifier' }
		]
	},
	// Phase 4: Visualizations
	{
		type: 'phase',
		title: 'Phase 4: Create Visualizations',
		text: 'Generate plots and figures for the report.',
		phase: 4
	},
	{
		type: 'task',
		title: 'Step 9: AMR Heatmap',
		text: `Create a presence/absence heatmap of AMR genes.`,
		command: `Rscript -e "library(pheatmap); library(tidyr); amr <- read.delim('abricate_results/summary.tsv'); amr_matrix <- amr %>% mutate(present=1) %>% select(FILE, GENE, present) %>% distinct() %>% pivot_wider(names_from=GENE, values_from=present, values_fill=0) %>% column_to_rownames('FILE') %>% as.matrix(); pheatmap(amr_matrix, color=c('white','#ef4444'), legend_breaks=c(0,1), legend_labels=c('Absent','Present'), main='AMR Gene Presence/Absence')"`,
		explanation: 'pheatmap creates clustered heatmaps. We convert gene presence to a binary matrix.',
		requiredDir: '/data/wgs_report',
		parameters: [
			{ name: 'pivot_wider()', desc: 'Reshape data to wide format' },
			{ name: 'pheatmap()', desc: 'Generate clustered heatmap' },
			{ name: 'color', desc: 'White=absent, Red=present' }
		]
	},
	{
		type: 'task',
		title: 'Step 10: Phylogenetic Tree Plot',
		text: `Visualize the phylogenetic tree with ggtree.`,
		command: `Rscript -e "library(ggtree); library(ape); tree <- read.tree('iqtree_results/core_snps.treefile'); ggtree(tree, layout='rectangular') + geom_tiplab(size=3) + geom_treescale() + theme_tree2() + ggtitle('Core SNP Phylogeny')"`,
		explanation: 'ggtree uses ggplot2 grammar to create customizable phylogenetic trees.',
		requiredDir: '/data/wgs_report',
		parameters: [
			{ name: 'layout', desc: 'Tree layout style (rectangular, circular)' },
			{ name: 'geom_tiplab()', desc: 'Add sample labels to tips' },
			{ name: 'geom_treescale()', desc: 'Add scale bar' }
		]
	},
	{
		type: 'task',
		title: 'Step 11: Assembly Quality Bar Plot',
		text: `Create a bar plot of N50 values.`,
		command: `Rscript -e "library(ggplot2); quast <- read.delim('quast_results/report.tsv'); ggplot(quast, aes(x=Assembly, y=N50/1000)) + geom_bar(stat='identity', fill='#10b981') + labs(title='Assembly N50', x='Sample', y='N50 (kb)') + theme_minimal() + theme(axis.text.x=element_text(angle=45, hjust=1))"`,
		explanation: 'ggplot2 creates publication-quality plots with customizable themes.',
		requiredDir: '/data/wgs_report',
		parameters: [
			{ name: 'geom_bar()', desc: 'Bar plot geometry' },
			{ name: 'stat="identity"', desc: 'Use actual values, not counts' },
			{ name: 'theme_minimal()', desc: 'Clean minimal theme' }
		]
	},
	{
		type: 'task',
		title: 'Step 12: Pan-genome Pie Chart',
		text: `Create a pie chart of pan-genome composition.`,
		command: `Rscript -e "library(ggplot2); pangenome <- data.frame(Category=c('Core','Soft-core','Shell','Cloud'), Genes=c(3987,312,489,446)); ggplot(pangenome, aes(x='', y=Genes, fill=Category)) + geom_bar(stat='identity', width=1) + coord_polar('y') + scale_fill_manual(values=c('#10b981','#3b82f6','#f59e0b','#ef4444')) + labs(title='Pan-genome Composition') + theme_void()"`,
		explanation: 'Pie charts in ggplot2 are bar charts with polar coordinates.',
		requiredDir: '/data/wgs_report',
		parameters: [
			{ name: 'coord_polar()', desc: 'Convert to polar coordinates' },
			{ name: 'Core genes', desc: 'Present in all isolates' },
			{ name: 'Cloud genes', desc: 'Present in <15% of isolates' }
		]
	},
	// Phase 5: Generate Report
	{
		type: 'phase',
		title: 'Phase 5: Compile PDF Report',
		text: 'Combine all elements into a final PDF report.',
		phase: 5
	},
	{
		type: 'task',
		title: 'Step 13: Create R Markdown Document',
		text: `Write the R Markdown file with all sections.`,
		command: `cat > wgs_report.Rmd << 'EOF'
---
title: "Bacterial WGS Analysis Report"
author: "BioLearn"
date: "\`r Sys.Date()\`"
output: pdf_document
---

\`\`\`{r setup, include=FALSE}
knitr::opts_chunk$set(echo=FALSE, message=FALSE, warning=FALSE)
library(ggplot2); library(dplyr); library(kableExtra)
library(pheatmap); library(ggtree); library(ape)
\`\`\`

# Assembly Quality
\`\`\`{r}
quast <- read.delim("quast_results/report.tsv")
quast %>% select(Assembly, Total.length, N50, GC....) %>%
  kable(caption="Assembly Statistics") %>% kable_styling()
\`\`\`

# AMR Genes
\`\`\`{r, fig.height=6}
# AMR heatmap code here
\`\`\`

# Phylogenetic Tree
\`\`\`{r, fig.height=8}
tree <- read.tree("iqtree_results/core_snps.treefile")
ggtree(tree) + geom_tiplab() + theme_tree2()
\`\`\`
EOF`,
		explanation: 'R Markdown combines narrative text with executable R code chunks.',
		requiredDir: '/data/wgs_report',
		parameters: [
			{ name: 'YAML header', desc: 'Document metadata and output format' },
			{ name: '```{r}', desc: 'R code chunk' },
			{ name: 'include=FALSE', desc: 'Run but hide output' }
		]
	},
	{
		type: 'task',
		title: 'Step 14: Render PDF Report',
		text: `Compile the R Markdown to PDF.`,
		command: `Rscript -e "rmarkdown::render('wgs_report.Rmd')"`,
		explanation: 'rmarkdown::render() converts .Rmd to the specified output format (PDF, HTML, Word).',
		requiredDir: '/data/wgs_report',
		parameters: [
			{ name: 'render()', desc: 'Compile R Markdown document' },
			{ name: 'Output', desc: 'wgs_report.pdf' }
		]
	},
	{
		type: 'complete',
		title: 'Report Generation Complete',
		text: `Congratulations! You have created a WGS bacteria PDF report.\n\n**Report Contents:**\n• Assembly quality statistics table\n• AMR gene presence/absence heatmap\n• Phylogenetic tree visualization\n• MLST results table\n• Pan-genome composition chart\n\n**Key Packages Learned:**\n• rmarkdown - Document generation\n• kableExtra - Publication tables\n• ggplot2 - Grammar of graphics\n• pheatmap - Clustered heatmaps\n• ggtree - Phylogenetic trees\n\n**Output:** wgs_report.pdf\n\n**Next Steps:**\n• Customize the template for your data\n• Add additional analyses as needed\n• Use parameterized reports for batch processing`
	}
];

// ============================================
// AMPLICON/16S REPORT STORYLINE
// ============================================

const ampliconReportSections: StorylineSection[] = [
	{
		type: 'intro',
		text: `Creating 16S Microbiome Report:\n\nYou have completed a 16S rRNA amplicon sequencing analysis and need to generate a comprehensive PDF report summarizing the microbiome findings.`,
		hint: null,
		requiredDir: null
	},
	{
		type: 'context',
		text: `This tutorial will guide you through creating an R Markdown report that includes:\n\n• Alpha diversity plots and statistics\n• Beta diversity PCoA ordination\n• Taxonomic composition bar plots\n• Differential abundance results\n• Core microbiome analysis\n\nWe'll use phyloseq and related packages for microbiome-specific visualizations.`,
		hint: null,
		requiredDir: null
	},
	// Phase 1: Setup
	{
		type: 'phase',
		title: 'Phase 1: Environment Setup',
		text: 'Install and load packages for microbiome analysis and reporting.',
		phase: 1
	},
	{
		type: 'task',
		title: 'Step 1: Install CRAN Packages',
		text: `Install core R packages for report generation.`,
		command: `Rscript -e "install.packages(c('rmarkdown', 'knitr', 'kableExtra', 'ggplot2', 'dplyr', 'tidyr', 'vegan', 'RColorBrewer'), repos='https://cran.r-project.org')"`,
		explanation: 'vegan is essential for ecological diversity analyses (Shannon, Simpson, PERMANOVA).',
		requiredDir: '/data/amplicon_report',
		parameters: [
			{ name: 'vegan', desc: 'Community ecology analyses' },
			{ name: 'ggplot2', desc: 'Plotting framework' },
			{ name: 'kableExtra', desc: 'Table formatting' }
		]
	},
	{
		type: 'task',
		title: 'Step 2: Install Bioconductor Packages',
		text: `Install phyloseq and DESeq2 for microbiome analysis.`,
		command: `Rscript -e "if (!require('BiocManager', quietly=TRUE)) install.packages('BiocManager'); BiocManager::install(c('phyloseq', 'DESeq2', 'microbiome'))"`,
		explanation: 'phyloseq is the standard R package for microbiome data analysis and visualization.',
		requiredDir: '/data/amplicon_report',
		parameters: [
			{ name: 'phyloseq', desc: 'Microbiome data handling' },
			{ name: 'DESeq2', desc: 'Differential abundance testing' },
			{ name: 'microbiome', desc: 'Extended microbiome analyses' }
		]
	},
	{
		type: 'task',
		title: 'Step 3: Install TinyTeX',
		text: `Install TinyTeX for PDF generation.`,
		command: `Rscript -e "install.packages('tinytex'); tinytex::install_tinytex()"`,
		explanation: 'TinyTeX provides the LaTeX backend needed for PDF compilation.',
		requiredDir: '/data/amplicon_report',
		parameters: [
			{ name: 'tinytex', desc: 'Lightweight LaTeX distribution' }
		]
	},
	// Phase 2: Data Loading
	{
		type: 'phase',
		title: 'Phase 2: Load Microbiome Data',
		text: 'Import your QIIME2 or phyloseq data into R.',
		phase: 2
	},
	{
		type: 'task',
		title: 'Step 4: Load Phyloseq Object',
		text: `Load the phyloseq object containing OTU/ASV data.`,
		command: `Rscript -e "library(phyloseq); ps <- readRDS('phyloseq_object.rds'); print(ps)"`,
		explanation: 'phyloseq objects contain OTU table, taxonomy, sample data, and optionally a tree.',
		requiredDir: '/data/amplicon_report',
		parameters: [
			{ name: 'readRDS()', desc: 'Load R serialized object' },
			{ name: 'phyloseq object', desc: 'Contains all microbiome data components' }
		]
	},
	{
		type: 'task',
		title: 'Step 5: Explore Sample Data',
		text: `View the sample metadata.`,
		command: `Rscript -e "library(phyloseq); ps <- readRDS('phyloseq_object.rds'); sample_data(ps) %>% head()"`,
		explanation: 'Sample data contains experimental metadata like treatment groups, timepoints, etc.',
		requiredDir: '/data/amplicon_report',
		parameters: [
			{ name: 'sample_data()', desc: 'Extract sample metadata' },
			{ name: 'Group column', desc: 'Used for comparisons' }
		]
	},
	// Phase 3: Diversity Tables
	{
		type: 'phase',
		title: 'Phase 3: Diversity Statistics',
		text: 'Calculate and display diversity metrics.',
		phase: 3
	},
	{
		type: 'task',
		title: 'Step 6: Alpha Diversity Table',
		text: `Calculate alpha diversity metrics.`,
		command: `Rscript -e "library(phyloseq); library(kableExtra); ps <- readRDS('phyloseq_object.rds'); alpha_div <- estimate_richness(ps, measures=c('Observed','Shannon','Simpson','Chao1')); alpha_div %>% head() %>% kable(caption='Alpha Diversity Metrics', digits=2) %>% kable_styling()"`,
		explanation: 'estimate_richness() calculates multiple alpha diversity indices per sample.',
		requiredDir: '/data/amplicon_report',
		parameters: [
			{ name: 'Observed', desc: 'Number of observed ASVs' },
			{ name: 'Shannon', desc: 'Shannon diversity index' },
			{ name: 'Simpson', desc: 'Simpson diversity index' },
			{ name: 'Chao1', desc: 'Richness estimator' }
		]
	},
	{
		type: 'task',
		title: 'Step 7: PERMANOVA Statistics',
		text: `Test for differences between groups using PERMANOVA.`,
		command: `Rscript -e "library(phyloseq); library(vegan); ps <- readRDS('phyloseq_object.rds'); bray <- phyloseq::distance(ps, method='bray'); permanova <- adonis2(bray ~ Group, data=as(sample_data(ps),'data.frame')); print(permanova)"`,
		explanation: 'PERMANOVA tests whether groups have significantly different community compositions.',
		requiredDir: '/data/amplicon_report',
		parameters: [
			{ name: 'adonis2()', desc: 'PERMANOVA test' },
			{ name: 'bray', desc: 'Bray-Curtis dissimilarity' },
			{ name: 'R²', desc: 'Variance explained by grouping' }
		]
	},
	// Phase 4: Visualizations
	{
		type: 'phase',
		title: 'Phase 4: Create Visualizations',
		text: 'Generate microbiome-specific plots.',
		phase: 4
	},
	{
		type: 'task',
		title: 'Step 8: Alpha Diversity Box Plot',
		text: `Create box plots of Shannon diversity by group.`,
		command: `Rscript -e "library(phyloseq); library(ggplot2); ps <- readRDS('phyloseq_object.rds'); alpha <- estimate_richness(ps, measures='Shannon'); alpha\\$Group <- sample_data(ps)\\$Group; ggplot(alpha, aes(x=Group, y=Shannon, fill=Group)) + geom_boxplot(alpha=0.7) + geom_jitter(width=0.2) + labs(title='Shannon Diversity by Group') + theme_minimal()"`,
		explanation: 'Box plots show the distribution of diversity across sample groups.',
		requiredDir: '/data/amplicon_report',
		parameters: [
			{ name: 'geom_boxplot()', desc: 'Box and whisker plot' },
			{ name: 'geom_jitter()', desc: 'Show individual points' },
			{ name: 'alpha=0.7', desc: 'Slight transparency' }
		]
	},
	{
		type: 'task',
		title: 'Step 9: PCoA Ordination Plot',
		text: `Create a PCoA plot of beta diversity.`,
		command: `Rscript -e "library(phyloseq); library(ggplot2); ps <- readRDS('phyloseq_object.rds'); ord <- ordinate(ps, method='PCoA', distance='bray'); plot_ordination(ps, ord, color='Group') + geom_point(size=4, alpha=0.8) + stat_ellipse(level=0.95) + labs(title='PCoA of Bray-Curtis Distances') + theme_minimal()"`,
		explanation: 'PCoA (Principal Coordinates Analysis) visualizes sample similarity in 2D space.',
		requiredDir: '/data/amplicon_report',
		parameters: [
			{ name: 'ordinate()', desc: 'Perform ordination' },
			{ name: 'plot_ordination()', desc: 'phyloseq plotting function' },
			{ name: 'stat_ellipse()', desc: '95% confidence ellipses' }
		]
	},
	{
		type: 'task',
		title: 'Step 10: Taxonomic Bar Plot',
		text: `Create a stacked bar plot of phylum-level composition.`,
		command: `Rscript -e "library(phyloseq); library(ggplot2); ps <- readRDS('phyloseq_object.rds'); ps_phylum <- tax_glom(ps, taxrank='Phylum'); ps_rel <- transform_sample_counts(ps_phylum, function(x) x/sum(x)*100); plot_bar(ps_rel, fill='Phylum') + labs(title='Phylum-level Composition', y='Relative Abundance (%)') + theme_minimal()"`,
		explanation: 'tax_glom() aggregates to a taxonomic level; transform converts to relative abundance.',
		requiredDir: '/data/amplicon_report',
		parameters: [
			{ name: 'tax_glom()', desc: 'Aggregate to taxonomic level' },
			{ name: 'transform_sample_counts()', desc: 'Convert to relative abundance' },
			{ name: 'plot_bar()', desc: 'Stacked bar plot' }
		]
	},
	{
		type: 'task',
		title: 'Step 11: Genus Heatmap',
		text: `Create a heatmap of top genera.`,
		command: `Rscript -e "library(phyloseq); library(pheatmap); ps <- readRDS('phyloseq_object.rds'); ps_genus <- tax_glom(ps, 'Genus'); top20 <- names(sort(taxa_sums(ps_genus), decreasing=TRUE)[1:20]); ps_top <- prune_taxa(top20, ps_genus); mat <- as.matrix(otu_table(ps_top)); pheatmap(log10(mat+1), main='Top 20 Genera', fontsize_row=8)"`,
		explanation: 'Heatmaps show abundance patterns across samples for the most abundant taxa.',
		requiredDir: '/data/amplicon_report',
		parameters: [
			{ name: 'prune_taxa()', desc: 'Subset to specific taxa' },
			{ name: 'log10(mat+1)', desc: 'Log transform for visualization' },
			{ name: 'pheatmap()', desc: 'Clustered heatmap' }
		]
	},
	// Phase 5: Generate Report
	{
		type: 'phase',
		title: 'Phase 5: Compile PDF Report',
		text: 'Combine all elements into a final PDF report.',
		phase: 5
	},
	{
		type: 'task',
		title: 'Step 12: Create R Markdown Document',
		text: `Write the R Markdown file with all microbiome analyses.`,
		command: `cat > microbiome_report.Rmd << 'EOF'
---
title: "16S Microbiome Analysis Report"
author: "BioLearn"
date: "\`r Sys.Date()\`"
output: pdf_document
---

\`\`\`{r setup, include=FALSE}
knitr::opts_chunk$set(echo=FALSE, message=FALSE, warning=FALSE)
library(phyloseq); library(ggplot2); library(vegan)
library(kableExtra); library(pheatmap)
ps <- readRDS("phyloseq_object.rds")
\`\`\`

# Alpha Diversity
\`\`\`{r}
alpha <- estimate_richness(ps, measures=c("Shannon","Simpson","Chao1"))
alpha %>% kable(caption="Alpha Diversity", digits=2) %>% kable_styling()
\`\`\`

# Beta Diversity
\`\`\`{r, fig.height=6}
ord <- ordinate(ps, "PCoA", "bray")
plot_ordination(ps, ord, color="Group") + stat_ellipse()
\`\`\`

# Taxonomic Composition
\`\`\`{r, fig.height=6}
ps_phylum <- tax_glom(ps, "Phylum")
plot_bar(ps_phylum, fill="Phylum") + theme_minimal()
\`\`\`
EOF`,
		explanation: 'The R Markdown document loads data once in setup chunk and reuses throughout.',
		requiredDir: '/data/amplicon_report',
		parameters: [
			{ name: 'setup chunk', desc: 'Load libraries and data once' },
			{ name: 'fig.height', desc: 'Control figure dimensions' }
		]
	},
	{
		type: 'task',
		title: 'Step 13: Render PDF Report',
		text: `Compile the microbiome report to PDF.`,
		command: `Rscript -e "rmarkdown::render('microbiome_report.Rmd')"`,
		explanation: 'The render function executes all code chunks and compiles to PDF.',
		requiredDir: '/data/amplicon_report',
		parameters: [
			{ name: 'render()', desc: 'Compile R Markdown' },
			{ name: 'Output', desc: 'microbiome_report.pdf' }
		]
	},
	{
		type: 'complete',
		title: 'Report Generation Complete',
		text: `Congratulations! You have created a 16S microbiome PDF report.\n\n**Report Contents:**\n• Alpha diversity statistics table\n• Shannon diversity box plots\n• PCoA ordination with group ellipses\n• Taxonomic composition bar plots\n• Top genera heatmap\n\n**Key Packages Learned:**\n• phyloseq - Microbiome data handling\n• vegan - Ecological statistics\n• DESeq2 - Differential abundance\n• ggplot2 - Visualization\n• pheatmap - Heatmaps\n\n**Output:** microbiome_report.pdf\n\n**Next Steps:**\n• Add PERMANOVA results table\n• Include differential abundance analysis\n• Add rarefaction curves`
	}
];

// ============================================
// RNA-SEQ REPORT STORYLINE
// ============================================

const rnaseqReportSections: StorylineSection[] = [
	{
		type: 'intro',
		text: `Creating RNA-Seq Differential Expression Report:\n\nYou have completed an RNA-seq analysis and need to generate a publication-ready PDF report summarizing the differential expression findings.`,
		hint: null,
		requiredDir: null
	},
	{
		type: 'context',
		text: `This tutorial will guide you through creating an R Markdown report that includes:\n\n• Sample QC and PCA plots\n• Differential expression statistics\n• Volcano plots\n• Expression heatmaps\n• Pathway enrichment analysis\n\nWe'll use DESeq2 and related Bioconductor packages.`,
		hint: null,
		requiredDir: null
	},
	// Phase 1: Setup
	{
		type: 'phase',
		title: 'Phase 1: Environment Setup',
		text: 'Install and load packages for RNA-seq analysis and reporting.',
		phase: 1
	},
	{
		type: 'task',
		title: 'Step 1: Install CRAN Packages',
		text: `Install core R packages for visualization and reporting.`,
		command: `Rscript -e "install.packages(c('rmarkdown', 'knitr', 'kableExtra', 'ggplot2', 'dplyr', 'tidyr', 'pheatmap', 'RColorBrewer', 'ggrepel'), repos='https://cran.r-project.org')"`,
		explanation: 'ggrepel helps avoid overlapping labels in plots like volcano plots.',
		requiredDir: '/data/rnaseq_report',
		parameters: [
			{ name: 'ggrepel', desc: 'Non-overlapping labels' },
			{ name: 'pheatmap', desc: 'Expression heatmaps' },
			{ name: 'RColorBrewer', desc: 'Color palettes' }
		]
	},
	{
		type: 'task',
		title: 'Step 2: Install Bioconductor Packages',
		text: `Install DESeq2 and pathway analysis packages.`,
		command: `Rscript -e "if (!require('BiocManager', quietly=TRUE)) install.packages('BiocManager'); BiocManager::install(c('DESeq2', 'EnhancedVolcano', 'clusterProfiler', 'org.Hs.eg.db', 'enrichplot'))"`,
		explanation: 'DESeq2 is the gold standard for RNA-seq differential expression; clusterProfiler for pathway analysis.',
		requiredDir: '/data/rnaseq_report',
		parameters: [
			{ name: 'DESeq2', desc: 'Differential expression analysis' },
			{ name: 'EnhancedVolcano', desc: 'Publication volcano plots' },
			{ name: 'clusterProfiler', desc: 'GO/KEGG enrichment' },
			{ name: 'org.Hs.eg.db', desc: 'Human gene annotations' }
		]
	},
	{
		type: 'task',
		title: 'Step 3: Install TinyTeX',
		text: `Install TinyTeX for PDF compilation.`,
		command: `Rscript -e "install.packages('tinytex'); tinytex::install_tinytex()"`,
		explanation: 'Required for R Markdown to PDF conversion.',
		requiredDir: '/data/rnaseq_report',
		parameters: [
			{ name: 'tinytex', desc: 'LaTeX for PDF generation' }
		]
	},
	// Phase 2: Data Loading
	{
		type: 'phase',
		title: 'Phase 2: Load Expression Data',
		text: 'Import count matrix and sample information.',
		phase: 2
	},
	{
		type: 'task',
		title: 'Step 4: Load Count Matrix',
		text: `Read the gene expression count matrix.`,
		command: `Rscript -e "counts <- read.csv('counts_matrix.csv', row.names=1); print(dim(counts)); print(head(counts[,1:4]))"`,
		explanation: 'Count matrix has genes as rows and samples as columns.',
		requiredDir: '/data/rnaseq_report',
		parameters: [
			{ name: 'row.names=1', desc: 'First column as gene IDs' },
			{ name: 'dim()', desc: 'Check matrix dimensions' }
		]
	},
	{
		type: 'task',
		title: 'Step 5: Load Sample Metadata',
		text: `Read the sample information file.`,
		command: `Rscript -e "coldata <- read.csv('sample_info.csv', row.names=1); print(coldata); print(table(coldata\\$condition))"`,
		explanation: 'Sample info must have a condition column for differential expression.',
		requiredDir: '/data/rnaseq_report',
		parameters: [
			{ name: 'condition', desc: 'Treatment vs Control groups' },
			{ name: 'table()', desc: 'Count samples per group' }
		]
	},
	{
		type: 'task',
		title: 'Step 6: Create DESeq2 Object',
		text: `Create the DESeqDataSet object for analysis.`,
		command: `Rscript -e "library(DESeq2); counts <- read.csv('counts_matrix.csv', row.names=1); coldata <- read.csv('sample_info.csv', row.names=1); dds <- DESeqDataSetFromMatrix(countData=counts, colData=coldata, design=~condition); print(dds)"`,
		explanation: 'DESeqDataSet combines counts, metadata, and experimental design.',
		requiredDir: '/data/rnaseq_report',
		parameters: [
			{ name: 'DESeqDataSetFromMatrix()', desc: 'Create DESeq2 object' },
			{ name: 'design=~condition', desc: 'Model formula' }
		]
	},
	// Phase 3: QC and Statistics
	{
		type: 'phase',
		title: 'Phase 3: QC and Differential Expression',
		text: 'Perform quality control and run DESeq2.',
		phase: 3
	},
	{
		type: 'task',
		title: 'Step 7: Run DESeq2 Analysis',
		text: `Perform differential expression analysis.`,
		command: `Rscript -e "library(DESeq2); counts <- read.csv('counts_matrix.csv', row.names=1); coldata <- read.csv('sample_info.csv', row.names=1); dds <- DESeqDataSetFromMatrix(countData=counts, colData=coldata, design=~condition); dds <- DESeq(dds); res <- results(dds); summary(res)"`,
		explanation: 'DESeq() performs normalization, dispersion estimation, and statistical testing.',
		requiredDir: '/data/rnaseq_report',
		parameters: [
			{ name: 'DESeq()', desc: 'Run full analysis pipeline' },
			{ name: 'results()', desc: 'Extract results table' },
			{ name: 'summary()', desc: 'Show up/down regulated counts' }
		]
	},
	{
		type: 'task',
		title: 'Step 8: Results Summary Table',
		text: `Create a summary table of significant genes.`,
		command: `Rscript -e "library(DESeq2); library(kableExtra); # ... load data and run DESeq2 ...; res_df <- as.data.frame(res) %>% filter(!is.na(padj)) %>% arrange(padj) %>% head(20); res_df %>% select(baseMean, log2FoldChange, padj) %>% kable(caption='Top 20 DE Genes', digits=c(1,2,4)) %>% kable_styling()"`,
		explanation: 'Filter for significant genes and display top results.',
		requiredDir: '/data/rnaseq_report',
		parameters: [
			{ name: 'padj', desc: 'Adjusted p-value (BH correction)' },
			{ name: 'log2FoldChange', desc: 'Effect size' },
			{ name: 'baseMean', desc: 'Average expression level' }
		]
	},
	// Phase 4: Visualizations
	{
		type: 'phase',
		title: 'Phase 4: Create Visualizations',
		text: 'Generate RNA-seq specific plots.',
		phase: 4
	},
	{
		type: 'task',
		title: 'Step 9: PCA Plot',
		text: `Create a PCA plot of sample relationships.`,
		command: `Rscript -e "library(DESeq2); library(ggplot2); # ... create dds ...; vsd <- vst(dds, blind=FALSE); pcaData <- plotPCA(vsd, intgroup='condition', returnData=TRUE); percentVar <- round(100*attr(pcaData,'percentVar')); ggplot(pcaData, aes(PC1, PC2, color=condition)) + geom_point(size=4) + xlab(paste0('PC1: ',percentVar[1],'%')) + ylab(paste0('PC2: ',percentVar[2],'%')) + theme_minimal()"`,
		explanation: 'PCA shows sample clustering and potential batch effects.',
		requiredDir: '/data/rnaseq_report',
		parameters: [
			{ name: 'vst()', desc: 'Variance stabilizing transformation' },
			{ name: 'plotPCA()', desc: 'DESeq2 PCA function' },
			{ name: 'percentVar', desc: 'Variance explained by each PC' }
		]
	},
	{
		type: 'task',
		title: 'Step 10: Volcano Plot',
		text: `Create a volcano plot of differential expression.`,
		command: `Rscript -e "library(EnhancedVolcano); # ... get res ...; EnhancedVolcano(res, lab=rownames(res), x='log2FoldChange', y='padj', title='Treatment vs Control', pCutoff=0.05, FCcutoff=1, pointSize=2.0, labSize=3.0)"`,
		explanation: 'Volcano plots show significance vs fold change for all genes.',
		requiredDir: '/data/rnaseq_report',
		parameters: [
			{ name: 'EnhancedVolcano()', desc: 'Publication-ready volcano plot' },
			{ name: 'pCutoff', desc: 'Significance threshold' },
			{ name: 'FCcutoff', desc: 'Fold change threshold' }
		]
	},
	{
		type: 'task',
		title: 'Step 11: Expression Heatmap',
		text: `Create a heatmap of top variable genes.`,
		command: `Rscript -e "library(DESeq2); library(pheatmap); # ... create vsd ...; topVarGenes <- head(order(rowVars(assay(vsd)), decreasing=TRUE), 50); mat <- assay(vsd)[topVarGenes,]; mat <- mat - rowMeans(mat); pheatmap(mat, annotation_col=coldata['condition'], color=colorRampPalette(c('blue','white','red'))(100), main='Top 50 Variable Genes')"`,
		explanation: 'Heatmaps show expression patterns across samples for variable genes.',
		requiredDir: '/data/rnaseq_report',
		parameters: [
			{ name: 'rowVars()', desc: 'Calculate row variance' },
			{ name: 'annotation_col', desc: 'Add sample annotations' },
			{ name: 'mat - rowMeans(mat)', desc: 'Center rows' }
		]
	},
	{
		type: 'task',
		title: 'Step 12: GO Enrichment Plot',
		text: `Perform and visualize GO enrichment analysis.`,
		command: `Rscript -e "library(clusterProfiler); library(org.Hs.eg.db); # Get significant genes ...; ego <- enrichGO(gene=sig_genes, OrgDb=org.Hs.eg.db, ont='BP', pAdjustMethod='BH', pvalueCutoff=0.05, readable=TRUE); dotplot(ego, showCategory=15, title='GO Biological Process')"`,
		explanation: 'GO enrichment identifies overrepresented biological processes.',
		requiredDir: '/data/rnaseq_report',
		parameters: [
			{ name: 'enrichGO()', desc: 'GO enrichment analysis' },
			{ name: 'ont="BP"', desc: 'Biological Process ontology' },
			{ name: 'dotplot()', desc: 'Visualization of enrichment' }
		]
	},
	// Phase 5: Generate Report
	{
		type: 'phase',
		title: 'Phase 5: Compile PDF Report',
		text: 'Combine all elements into a final PDF report.',
		phase: 5
	},
	{
		type: 'task',
		title: 'Step 13: Create R Markdown Document',
		text: `Write the R Markdown file for RNA-seq report.`,
		command: `cat > rnaseq_report.Rmd << 'EOF'
---
title: "RNA-Seq Differential Expression Report"
author: "BioLearn"
date: "\`r Sys.Date()\`"
output: pdf_document
---

\`\`\`{r setup, include=FALSE}
knitr::opts_chunk$set(echo=FALSE, message=FALSE, warning=FALSE)
library(DESeq2); library(ggplot2); library(pheatmap)
library(EnhancedVolcano); library(kableExtra)
counts <- read.csv("counts_matrix.csv", row.names=1)
coldata <- read.csv("sample_info.csv", row.names=1)
dds <- DESeqDataSetFromMatrix(counts, coldata, ~condition)
dds <- DESeq(dds); res <- results(dds)
\`\`\`

# Sample QC
\`\`\`{r, fig.height=5}
vsd <- vst(dds, blind=FALSE)
plotPCA(vsd, intgroup="condition")
\`\`\`

# Differential Expression
\`\`\`{r}
summary(res)
\`\`\`

# Volcano Plot
\`\`\`{r, fig.height=6}
EnhancedVolcano(res, lab=rownames(res), x='log2FoldChange', y='padj')
\`\`\`

# Expression Heatmap
\`\`\`{r, fig.height=8}
topGenes <- head(order(rowVars(assay(vsd)), decreasing=TRUE), 30)
pheatmap(assay(vsd)[topGenes,])
\`\`\`
EOF`,
		explanation: 'The setup chunk runs DESeq2 once; results are reused in subsequent chunks.',
		requiredDir: '/data/rnaseq_report',
		parameters: [
			{ name: 'setup chunk', desc: 'Run analysis once' },
			{ name: 'Subsequent chunks', desc: 'Use pre-computed results' }
		]
	},
	{
		type: 'task',
		title: 'Step 14: Render PDF Report',
		text: `Compile the RNA-seq report to PDF.`,
		command: `Rscript -e "rmarkdown::render('rnaseq_report.Rmd')"`,
		explanation: 'Rendering executes all chunks and compiles to the specified output format.',
		requiredDir: '/data/rnaseq_report',
		parameters: [
			{ name: 'render()', desc: 'Compile R Markdown' },
			{ name: 'Output', desc: 'rnaseq_report.pdf' }
		]
	},
	{
		type: 'complete',
		title: 'Report Generation Complete',
		text: `Congratulations! You have created an RNA-seq PDF report.\n\n**Report Contents:**\n• Sample PCA plot\n• Differential expression summary\n• Volcano plot\n• Expression heatmap\n• GO enrichment analysis\n\n**Key Packages Learned:**\n• DESeq2 - Differential expression\n• EnhancedVolcano - Volcano plots\n• clusterProfiler - Pathway enrichment\n• pheatmap - Expression heatmaps\n\n**Output:** rnaseq_report.pdf\n\n**Next Steps:**\n• Add KEGG pathway analysis\n• Include MA plot\n• Add gene-level expression profiles`
	}
];

// ============================================
// STORYLINES EXPORT
// ============================================

export const storylines: Record<string, Storyline> = {
	'wgs-bacteria': {
		id: 'wgs-bacteria',
		title: 'WGS Bacteria Report',
		subtitle: 'Assembly, AMR & Phylogenetics',
		organism: 'Bacterial genomes',
		technology: 'r-report',
		technologyLabel: 'R/RMarkdown',
		dataDir: '/data/wgs_report',
		toolsUsed: ['Rscript', 'rmarkdown', 'ggplot2', 'pheatmap', 'ggtree', 'kableExtra'],
		sections: wgsBacteriaReportSections
	},
	'amplicon': {
		id: 'amplicon',
		title: '16S/Amplicon Report',
		subtitle: 'Diversity & Composition',
		organism: 'Microbiome',
		technology: 'r-report',
		technologyLabel: 'R/RMarkdown',
		dataDir: '/data/amplicon_report',
		toolsUsed: ['Rscript', 'rmarkdown', 'phyloseq', 'vegan', 'ggplot2', 'pheatmap'],
		sections: ampliconReportSections
	},
	'rnaseq': {
		id: 'rnaseq',
		title: 'RNA-Seq Report',
		subtitle: 'Differential Expression',
		organism: 'Transcriptome',
		technology: 'r-report',
		technologyLabel: 'R/RMarkdown',
		dataDir: '/data/rnaseq_report',
		toolsUsed: ['Rscript', 'rmarkdown', 'DESeq2', 'EnhancedVolcano', 'clusterProfiler', 'pheatmap'],
		sections: rnaseqReportSections
	}
};

export function getStoryline(id: string): Storyline | undefined {
	return storylines[id];
}

export function getStorylinesList(): { id: string; title: string; subtitle: string; technology: string; technologyLabel: string }[] {
	return Object.values(storylines).map(s => ({
		id: s.id,
		title: s.title,
		subtitle: s.subtitle,
		technology: s.technology,
		technologyLabel: s.technologyLabel
	}));
}
