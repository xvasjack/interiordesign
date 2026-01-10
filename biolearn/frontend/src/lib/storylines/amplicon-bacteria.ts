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
	technology: 'illumina' | 'pacbio' | 'nanopore' | 'hybrid';
	technologyLabel: string;
	dataDir: string;
	sections: StorylineSection[];
	toolsUsed: string[];
}

// ============================================
// ILLUMINA 16S AMPLICON WORKFLOW SECTIONS
// ============================================

function createAmpliconPhase1Sections(dataDir: string): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 1: Quality Control & Pre-processing',
			text: 'Assess raw sequencing data quality and prepare reads for analysis.',
			phase: 1
		},
		{
			type: 'task',
			title: 'Step 1: Explore the Data',
			text: `Check the sequencing data statistics for your amplicon samples.`,
			command: 'seqkit stats *.fastq.gz',
			explanation: 'SeqKit provides quick statistics about all sequencing files in the directory.',
			requiredDir: dataDir,
			parameters: [
				{ name: 'stats', desc: 'Generate sequence statistics' },
				{ name: '*.fastq.gz', desc: 'All compressed FASTQ files' }
			]
		},
		{
			type: 'task',
			title: 'Step 2: Quality Control',
			text: `Generate quality reports to assess read quality across all samples.`,
			command: 'fastqc *.fastq.gz -o qc_reports/ -t 4',
			explanation: 'FastQC identifies quality issues, adapter contamination, and per-base quality scores.',
			requiredDir: dataDir,
			parameters: [
				{ name: '-o qc_reports/', desc: 'Output directory' },
				{ name: '-t 4', desc: 'Number of threads' }
			]
		},
		{
			type: 'task',
			title: 'Step 3: Aggregate QC Reports',
			text: `Combine all FastQC reports into a single summary.`,
			command: 'multiqc qc_reports/ -o multiqc_output/',
			explanation: 'MultiQC aggregates results from multiple samples for easy comparison.',
			requiredDir: dataDir,
			parameters: [
				{ name: 'qc_reports/', desc: 'Input directory with FastQC reports' },
				{ name: '-o multiqc_output/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 4: Remove Primers',
			text: `Trim primer sequences from reads using Cutadapt.`,
			command: 'cutadapt -g GTGCCAGCMGCCGCGGTAA -G GGACTACHVGGGTWTCTAAT -o trimmed/{}_R1.fastq.gz -p trimmed/{}_R2.fastq.gz *_R1.fastq.gz *_R2.fastq.gz --pair-filter=any -m 50',
			explanation: 'Cutadapt removes the 515F/806R primer sequences from V4 region amplicons.',
			requiredDir: dataDir,
			parameters: [
				{ name: '-g/-G', desc: 'Forward/reverse primer sequences' },
				{ name: '-o/-p', desc: 'Output files for R1/R2' },
				{ name: '--pair-filter=any', desc: 'Discard pair if either read fails' },
				{ name: '-m 50', desc: 'Minimum length after trimming' }
			]
		},
		{
			type: 'task',
			title: 'Step 5: Import to QIIME2',
			text: `Import trimmed reads into QIIME2 format for downstream analysis.`,
			command: 'qiime tools import --type "SampleData[PairedEndSequencesWithQuality]" --input-path manifest.tsv --output-path demux.qza --input-format PairedEndFastqManifestPhred33V2',
			explanation: 'QIIME2 uses artifact files (.qza) that track data provenance.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--type', desc: 'Data type being imported' },
				{ name: '--input-path', desc: 'Manifest file listing samples' },
				{ name: '--output-path', desc: 'Output artifact file' }
			]
		},
		{
			type: 'task',
			title: 'Step 6: Visualize Quality',
			text: `Generate interactive quality plots to determine trimming parameters.`,
			command: 'qiime demux summarize --i-data demux.qza --o-visualization demux.qzv',
			explanation: 'The quality plot helps decide where to truncate reads for DADA2.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--i-data', desc: 'Input demultiplexed data' },
				{ name: '--o-visualization', desc: 'Output visualization file' }
			]
		}
	];
}

function createAmpliconPhase2Sections(dataDir: string): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 2: Denoising & ASV Generation',
			text: 'Generate Amplicon Sequence Variants (ASVs) using DADA2 denoising.',
			phase: 2
		},
		{
			type: 'task',
			title: 'Step 7: DADA2 Denoising',
			text: `Denoise reads and generate ASVs with DADA2.`,
			command: 'qiime dada2 denoise-paired --i-demultiplexed-seqs demux.qza --p-trunc-len-f 240 --p-trunc-len-r 200 --p-trim-left-f 0 --p-trim-left-r 0 --o-table table.qza --o-representative-sequences rep-seqs.qza --o-denoising-stats denoising-stats.qza --p-n-threads 4',
			explanation: 'DADA2 learns error rates and identifies true biological sequences (ASVs).',
			requiredDir: dataDir,
			parameters: [
				{ name: '--p-trunc-len-f/r', desc: 'Truncation length for forward/reverse' },
				{ name: '--o-table', desc: 'Feature (ASV) count table' },
				{ name: '--o-representative-sequences', desc: 'ASV sequences' },
				{ name: '--o-denoising-stats', desc: 'Denoising statistics' }
			]
		},
		{
			type: 'task',
			title: 'Step 8: View Denoising Stats',
			text: `Examine how many reads passed each denoising step.`,
			command: 'qiime metadata tabulate --m-input-file denoising-stats.qza --o-visualization denoising-stats.qzv',
			explanation: 'Check the percentage of reads that passed filtering, denoising, and merging.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--m-input-file', desc: 'Input denoising stats' },
				{ name: '--o-visualization', desc: 'Output visualization' }
			]
		},
		{
			type: 'task',
			title: 'Step 9: Feature Table Summary',
			text: `Summarize the ASV table to check sample depths.`,
			command: 'qiime feature-table summarize --i-table table.qza --o-visualization table.qzv --m-sample-metadata-file metadata.tsv',
			explanation: 'Shows the number of ASVs and sequences per sample for rarefaction decisions.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--i-table', desc: 'Feature table' },
				{ name: '--m-sample-metadata-file', desc: 'Sample metadata' }
			]
		},
		{
			type: 'task',
			title: 'Step 10: Visualize ASV Sequences',
			text: `View representative ASV sequences.`,
			command: 'qiime feature-table tabulate-seqs --i-data rep-seqs.qza --o-visualization rep-seqs.qzv',
			explanation: 'Shows ASV sequences for manual inspection or BLAST searching.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--i-data', desc: 'Representative sequences' },
				{ name: '--o-visualization', desc: 'Output visualization' }
			]
		}
	];
}

function createAmpliconPhase3Sections(dataDir: string): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 3: Taxonomy Assignment',
			text: 'Assign taxonomic classifications to ASVs using reference databases.',
			phase: 3
		},
		{
			type: 'task',
			title: 'Step 11: Train Classifier (if needed)',
			text: `Use a pre-trained classifier or train one for your region.`,
			command: 'qiime feature-classifier classify-sklearn --i-classifier silva-138-99-515-806-nb-classifier.qza --i-reads rep-seqs.qza --o-classification taxonomy.qza --p-n-jobs 4',
			explanation: 'The Naive Bayes classifier assigns taxonomy using the SILVA database.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--i-classifier', desc: 'Pre-trained classifier' },
				{ name: '--i-reads', desc: 'ASV sequences to classify' },
				{ name: '--o-classification', desc: 'Taxonomy assignments' },
				{ name: '--p-n-jobs', desc: 'Parallel jobs' }
			]
		},
		{
			type: 'task',
			title: 'Step 12: View Taxonomy',
			text: `Visualize the taxonomy assignments.`,
			command: 'qiime metadata tabulate --m-input-file taxonomy.qza --o-visualization taxonomy.qzv',
			explanation: 'Review taxonomic assignments and confidence scores.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--m-input-file', desc: 'Taxonomy artifact' },
				{ name: '--o-visualization', desc: 'Output visualization' }
			]
		},
		{
			type: 'task',
			title: 'Step 13: Create Taxonomy Bar Plot',
			text: `Generate interactive bar plots of taxonomic composition.`,
			command: 'qiime taxa barplot --i-table table.qza --i-taxonomy taxonomy.qza --m-metadata-file metadata.tsv --o-visualization taxa-bar-plots.qzv',
			explanation: 'Interactive bar plots show community composition at different taxonomic levels.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--i-table', desc: 'Feature table' },
				{ name: '--i-taxonomy', desc: 'Taxonomy assignments' },
				{ name: '--m-metadata-file', desc: 'Sample metadata' }
			]
		},
		{
			type: 'task',
			title: 'Step 14: Filter Mitochondria/Chloroplast',
			text: `Remove non-bacterial sequences from the dataset.`,
			command: 'qiime taxa filter-table --i-table table.qza --i-taxonomy taxonomy.qza --p-exclude mitochondria,chloroplast --o-filtered-table table-filtered.qza',
			explanation: 'Removes host-derived sequences that are not part of the microbiome.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--p-exclude', desc: 'Taxa to remove' },
				{ name: '--o-filtered-table', desc: 'Filtered feature table' }
			]
		},
		{
			type: 'task',
			title: 'Step 15: Build Phylogenetic Tree',
			text: `Generate a phylogenetic tree for diversity analyses.`,
			command: 'qiime phylogeny align-to-tree-mafft-fasttree --i-sequences rep-seqs.qza --o-alignment aligned-rep-seqs.qza --o-masked-alignment masked-aligned-rep-seqs.qza --o-tree unrooted-tree.qza --o-rooted-tree rooted-tree.qza',
			explanation: 'The phylogenetic tree is required for UniFrac distance calculations.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--i-sequences', desc: 'ASV sequences' },
				{ name: '--o-rooted-tree', desc: 'Rooted phylogenetic tree' }
			]
		}
	];
}

function createAmpliconPhase4Sections(dataDir: string): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 4: Diversity Analysis',
			text: 'Calculate alpha and beta diversity metrics to compare communities.',
			phase: 4
		},
		{
			type: 'task',
			title: 'Step 16: Core Diversity Metrics',
			text: `Calculate alpha and beta diversity metrics at appropriate sampling depth.`,
			command: 'qiime diversity core-metrics-phylogenetic --i-phylogeny rooted-tree.qza --i-table table-filtered.qza --p-sampling-depth 10000 --m-metadata-file metadata.tsv --output-dir core-metrics-results/',
			explanation: 'Calculates Shannon, Faith PD, Bray-Curtis, UniFrac, and generates PCoA plots.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--i-phylogeny', desc: 'Rooted tree for phylogenetic metrics' },
				{ name: '--p-sampling-depth', desc: 'Rarefaction depth' },
				{ name: '--output-dir', desc: 'Output directory for all metrics' }
			]
		},
		{
			type: 'task',
			title: 'Step 17: Alpha Diversity Statistics',
			text: `Test for significant differences in alpha diversity between groups.`,
			command: 'qiime diversity alpha-group-significance --i-alpha-diversity core-metrics-results/shannon_vector.qza --m-metadata-file metadata.tsv --o-visualization shannon-group-significance.qzv',
			explanation: 'Kruskal-Wallis test for differences in Shannon diversity between groups.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--i-alpha-diversity', desc: 'Alpha diversity vector' },
				{ name: '--m-metadata-file', desc: 'Sample metadata with grouping' }
			]
		},
		{
			type: 'task',
			title: 'Step 18: Beta Diversity Statistics (PERMANOVA)',
			text: `Test if community composition differs between groups.`,
			command: 'qiime diversity beta-group-significance --i-distance-matrix core-metrics-results/bray_curtis_distance_matrix.qza --m-metadata-file metadata.tsv --m-metadata-column group --o-visualization bray-curtis-group-significance.qzv --p-pairwise',
			explanation: 'PERMANOVA tests whether groups have different community compositions.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--i-distance-matrix', desc: 'Beta diversity distance matrix' },
				{ name: '--m-metadata-column', desc: 'Column to test' },
				{ name: '--p-pairwise', desc: 'Perform pairwise comparisons' }
			]
		},
		{
			type: 'task',
			title: 'Step 19: Generate PCoA Emperor Plot',
			text: `Create interactive 3D ordination plot.`,
			command: 'qiime emperor plot --i-pcoa core-metrics-results/bray_curtis_pcoa_results.qza --m-metadata-file metadata.tsv --o-visualization bray-curtis-emperor.qzv',
			explanation: 'Emperor provides interactive 3D visualization of community differences.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--i-pcoa', desc: 'PCoA results' },
				{ name: '--m-metadata-file', desc: 'Sample metadata for coloring' }
			]
		},
		{
			type: 'task',
			title: 'Step 20: Alpha Rarefaction Plot',
			text: `Check if sequencing depth was sufficient to capture diversity.`,
			command: 'qiime diversity alpha-rarefaction --i-table table-filtered.qza --i-phylogeny rooted-tree.qza --p-max-depth 20000 --m-metadata-file metadata.tsv --o-visualization alpha-rarefaction.qzv',
			explanation: 'Rarefaction curves should plateau if sequencing captured full diversity.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--p-max-depth', desc: 'Maximum rarefaction depth' },
				{ name: '--i-phylogeny', desc: 'Tree for Faith PD' }
			]
		}
	];
}

function createAmpliconPhase5Sections(dataDir: string): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 5: Differential Abundance & Reporting',
			text: 'Identify differentially abundant taxa and export results.',
			phase: 5
		},
		{
			type: 'task',
			title: 'Step 21: ANCOM Differential Abundance',
			text: `Identify taxa that differ significantly between groups.`,
			command: 'qiime composition add-pseudocount --i-table table-filtered.qza --o-composition-table comp-table.qza && qiime composition ancom --i-table comp-table.qza --m-metadata-file metadata.tsv --m-metadata-column group --o-visualization ancom-results.qzv',
			explanation: 'ANCOM identifies compositionally different taxa while handling sparsity.',
			requiredDir: dataDir,
			parameters: [
				{ name: 'add-pseudocount', desc: 'Add pseudocounts for log-ratio' },
				{ name: 'ancom', desc: 'Analysis of composition of microbiomes' }
			]
		},
		{
			type: 'task',
			title: 'Step 22: Collapse to Genus Level',
			text: `Aggregate ASVs to genus level for cleaner visualization.`,
			command: 'qiime taxa collapse --i-table table-filtered.qza --i-taxonomy taxonomy.qza --p-level 6 --o-collapsed-table table-genus.qza',
			explanation: 'Collapsing to genus level reduces noise and aids interpretation.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--p-level 6', desc: 'Taxonomic level (6=genus)' },
				{ name: '--o-collapsed-table', desc: 'Genus-level table' }
			]
		},
		{
			type: 'task',
			title: 'Step 23: Export for External Analysis',
			text: `Export data for analysis in R or other tools.`,
			command: 'qiime tools export --input-path table-filtered.qza --output-path exported/ && qiime tools export --input-path taxonomy.qza --output-path exported/ && qiime tools export --input-path rooted-tree.qza --output-path exported/',
			explanation: 'Export to BIOM, TSV, and Newick formats for use in R/phyloseq.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--input-path', desc: 'QIIME2 artifact to export' },
				{ name: '--output-path', desc: 'Export directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 24: Convert BIOM to TSV',
			text: `Convert BIOM table to human-readable format.`,
			command: 'biom convert -i exported/feature-table.biom -o exported/feature-table.tsv --to-tsv',
			explanation: 'TSV format can be opened in Excel or imported into R.',
			requiredDir: dataDir,
			parameters: [
				{ name: '-i', desc: 'Input BIOM file' },
				{ name: '-o', desc: 'Output TSV file' },
				{ name: '--to-tsv', desc: 'Convert to tab-separated format' }
			]
		}
	];
}

// ============================================
// GUT MICROBIOME SPECIFIC SECTIONS
// ============================================

function createGutMicrobiomeIntro(): StorylineSection[] {
	return [
		{
			type: 'intro',
			text: `Clinical Microbiome Study:\n\nA research team is investigating the gut microbiome differences between patients with inflammatory bowel disease (IBD) and healthy controls. Stool samples have been collected from 20 IBD patients and 20 healthy volunteers.`,
			hint: null,
			requiredDir: null
		},
		{
			type: 'image',
			title: 'Gut Microbiome Composition',
			text: 'The human gut microbiome contains trillions of bacteria that play essential roles in digestion, immune function, and overall health. Dysbiosis (microbial imbalance) is associated with various diseases.',
			imageUrl: '/images/gut_microbiome.svg',
			imageAlt: 'Illustration of diverse gut bacteria including Bacteroides, Firmicutes, and other common gut inhabitants'
		},
		{
			type: 'context',
			text: `DNA has been extracted from stool samples and the V4 region of the 16S rRNA gene was amplified and sequenced on Illumina MiSeq (2x250bp).\n\n**Study Design:**\n• 20 IBD patients (10 Crohn's disease, 10 ulcerative colitis)\n• 20 healthy controls\n• Matched for age and diet\n\n**Research Questions:**\n1. Does the gut microbiome differ between IBD patients and healthy controls?\n2. Which bacterial taxa are associated with disease?\n3. Is diversity reduced in IBD patients?`,
			hint: null,
			requiredDir: null
		}
	];
}

function createGutMicrobiomeConclusion(): StorylineSection {
	return {
		type: 'complete',
		title: 'Analysis Complete',
		text: `Congratulations! You have completed the Gut Microbiome Analysis.\n\n**Key Findings:**\n\n**Alpha Diversity:**\n• Shannon diversity significantly lower in IBD patients (p < 0.01)\n• Faith's phylogenetic diversity also reduced in IBD\n• Crohn's disease showed greater diversity loss than ulcerative colitis\n\n**Beta Diversity:**\n• Clear separation between IBD and healthy controls (PERMANOVA p < 0.001, R² = 0.23)\n• Bray-Curtis and weighted UniFrac showed consistent patterns\n\n**Differentially Abundant Taxa:**\n• Decreased in IBD: Faecalibacterium prausnitzii, Roseburia, Bifidobacterium\n• Increased in IBD: Escherichia/Shigella, Enterococcus, Ruminococcus gnavus\n\n**Clinical Implications:**\n• F. prausnitzii depletion is a hallmark of IBD\n• Loss of butyrate-producers may contribute to inflammation\n• Potential for microbiome-based diagnostics and therapeutics\n\n**Next Steps:**\n• Functional prediction (PICRUSt2)\n• Longitudinal sampling during flares\n• Correlation with clinical biomarkers (calprotectin, CRP)`
	};
}

// ============================================
// SOIL MICROBIOME SPECIFIC SECTIONS
// ============================================

function createSoilMicrobiomeIntro(): StorylineSection[] {
	return [
		{
			type: 'intro',
			text: `Agricultural Research Project:\n\nA sustainable agriculture research team is studying compost to identify beneficial bacteria that promote plant growth. They want to find natural alternatives to chemical fertilizers by understanding which microbes make compost effective.`,
			hint: null,
			requiredDir: null
		},
		{
			type: 'image',
			title: 'Compost Microbiome',
			text: 'Compost contains diverse bacterial communities that break down organic matter and produce plant-beneficial compounds. Understanding these communities can help optimize composting and identify beneficial inoculants.',
			imageUrl: '/images/compost_microbiome.svg',
			imageAlt: 'Cross-section of compost pile showing different decomposition zones and associated bacterial communities'
		},
		{
			type: 'context',
			text: `Samples have been collected from three compost types:\n• **Thermophilic compost** (high-temperature, rapid decomposition)\n• **Vermicompost** (worm-processed, nutrient-rich)\n• **Bokashi** (fermented, anaerobic process)\n\nEach compost type was sampled at 3 stages: fresh, mature (3 months), and aged (6 months).\n\n**Research Questions:**\n1. Which beneficial bacteria are enriched in each compost type?\n2. How does microbial community change during maturation?\n3. Which compost type has the highest diversity of plant growth-promoting bacteria?`,
			hint: null,
			requiredDir: null
		}
	];
}

function createSoilMicrobiomeAdditional(dataDir: string): StorylineSection[] {
	return [
		{
			type: 'task',
			title: 'Step 25: Identify Plant Growth Promoters',
			text: `Search for known plant growth-promoting bacteria (PGPB).`,
			command: 'qiime taxa filter-table --i-table table-filtered.qza --i-taxonomy taxonomy.qza --p-include "Bacillus,Pseudomonas,Azospirillum,Rhizobium,Azotobacter,Streptomyces" --o-filtered-table pgpb-table.qza',
			explanation: 'Filter for genera known to promote plant growth through nitrogen fixation, phosphate solubilization, or hormone production.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--p-include', desc: 'Taxa to include in filtered table' }
			]
		},
		{
			type: 'task',
			title: 'Step 26: PGPB Abundance Comparison',
			text: `Compare plant growth-promoting bacteria across compost types.`,
			command: 'qiime feature-table summarize --i-table pgpb-table.qza --o-visualization pgpb-summary.qzv --m-sample-metadata-file metadata.tsv',
			explanation: 'Summarize the abundance of beneficial bacteria in each compost type.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--i-table', desc: 'Filtered PGPB table' }
			]
		}
	];
}

function createSoilMicrobiomeConclusion(): StorylineSection {
	return {
		type: 'complete',
		title: 'Analysis Complete',
		text: `Congratulations! You have completed the Soil/Compost Microbiome Analysis.\n\n**Key Findings:**\n\n**Compost Type Comparison:**\n• **Thermophilic:** Highest diversity, dominated by Bacillus and Thermus\n• **Vermicompost:** Rich in Actinobacteria, especially Streptomyces\n• **Bokashi:** Unique lactic acid bacteria profile (Lactobacillus)\n\n**Maturation Effects:**\n• Fresh compost: High Proteobacteria, low diversity\n• Mature (3 mo): Peak diversity, balanced community\n• Aged (6 mo): Stable community, increased Actinobacteria\n\n**Plant Growth-Promoting Bacteria Identified:**\n• Bacillus subtilis (phosphate solubilization)\n• Pseudomonas fluorescens (biocontrol)\n• Streptomyces spp. (antifungal compounds)\n• Azospirillum brasilense (nitrogen fixation)\n\n**Recommendations:**\n• Use mature thermophilic compost for maximum PGPB diversity\n• Vermicompost best for disease suppression (high Streptomyces)\n• Bokashi ideal for quick nutrient release (fermented organics)\n\n**Potential Applications:**\n• Develop targeted microbial inoculants\n• Optimize composting conditions for specific crops\n• Create compost "quality scores" based on beneficial bacteria`
	};
}

// ============================================
// WATER CONTAMINATION SPECIFIC SECTIONS
// ============================================

function createWaterContaminationIntro(): StorylineSection[] {
	return [
		{
			type: 'intro',
			text: `URGENT - Environmental Health Investigation:\n\nA community has reported gastrointestinal illness following heavy rainfall. Water samples from the municipal water supply, nearby agricultural runoff, and a suspected contaminated well have been collected for analysis.`,
			hint: null,
			requiredDir: null
		},
		{
			type: 'image',
			title: 'Water Sampling Sites',
			text: 'Water samples collected from multiple locations help trace contamination sources. 16S rRNA sequencing can detect fecal indicator bacteria and identify potential pathogens.',
			imageUrl: '/images/water_contamination.svg',
			imageAlt: 'Map showing water sampling locations including well, treatment plant, and agricultural runoff sites'
		},
		{
			type: 'context',
			text: `Samples were collected from 5 locations:\n• **Municipal treated water** (post-treatment)\n• **Raw water intake** (pre-treatment)\n• **Agricultural runoff** (near cattle farm)\n• **Residential well** (suspected source)\n• **Reference stream** (upstream, unimpacted)\n\n**Research Questions:**\n1. Is there fecal contamination in the water supply?\n2. What is the likely source (human vs. animal)?\n3. Are there pathogenic bacteria present?\n4. How does the treatment plant affect microbial communities?`,
			hint: null,
			requiredDir: null
		}
	];
}

function createWaterContaminationAdditional(dataDir: string): StorylineSection[] {
	return [
		{
			type: 'task',
			title: 'Step 25: Detect Fecal Indicators',
			text: `Search for fecal indicator bacteria in the samples.`,
			command: 'qiime taxa filter-table --i-table table-filtered.qza --i-taxonomy taxonomy.qza --p-include "Escherichia,Enterococcus,Bacteroides,Clostridium" --o-filtered-table fecal-indicators.qza',
			explanation: 'Filter for bacteria commonly used as fecal contamination indicators.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--p-include', desc: 'Fecal indicator genera' }
			]
		},
		{
			type: 'task',
			title: 'Step 26: Source Tracking Analysis',
			text: `Use SourceTracker2 to identify contamination sources.`,
			command: 'sourcetracker2 gibbs --table-path exported/feature-table.biom --metadata-path source-metadata.tsv --output-dir sourcetracker_results/ --source-category-column SourceSink',
			explanation: 'SourceTracker uses Bayesian methods to estimate source contributions.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--table-path', desc: 'Feature table in BIOM format' },
				{ name: '--source-category-column', desc: 'Column indicating source vs sink' }
			]
		},
		{
			type: 'task',
			title: 'Step 27: Pathogen Detection',
			text: `Screen for potentially pathogenic bacteria.`,
			command: 'qiime taxa filter-table --i-table table-filtered.qza --i-taxonomy taxonomy.qza --p-include "Salmonella,Campylobacter,Vibrio,Legionella,Listeria,Yersinia" --o-filtered-table pathogens.qza',
			explanation: 'Identify sequences matching known waterborne pathogens.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--p-include', desc: 'Potential pathogen genera' }
			]
		}
	];
}

function createWaterContaminationConclusion(): StorylineSection {
	return {
		type: 'complete',
		title: 'Analysis Complete',
		text: `Congratulations! You have completed the Water Contamination Investigation.\n\n**Key Findings:**\n\n**Fecal Contamination Detected:**\n• Residential well: HIGH contamination (Bacteroides, E. coli detected)\n• Agricultural runoff: MODERATE (cattle-associated Prevotella)\n• Raw water intake: LOW (trace fecal indicators)\n• Treated water: NEGATIVE (no fecal indicators)\n\n**Source Tracking Results:**\n• Residential well: 78% cattle source, 15% human source\n• Agricultural runoff: 92% cattle source\n• Raw water: Mixed sources (infiltration from multiple points)\n\n**Pathogen Alert:**\n• Campylobacter sequences detected in residential well\n• No Salmonella or Vibrio detected\n• Legionella detected in raw water (low abundance)\n\n**Root Cause:**\nAgricultural runoff from nearby cattle farm infiltrated the residential well through a fractured aquifer zone, likely exacerbated by heavy rainfall.\n\n**Recommendations:**\n• Issue boil-water advisory for affected well\n• Test well for Campylobacter by culture\n• Assess well casing integrity\n• Install setback buffer from agricultural operations\n• Continue monitoring treated water (currently safe)\n\n**Public Health Actions:**\n• Affected residents notified\n• Alternative water supply provided\n• Well rehabilitation or replacement recommended`
	};
}

// ============================================
// STORYLINES
// ============================================

export const storylines: Record<string, Storyline> = {
	gut: {
		id: 'gut',
		title: 'Gut Microbiome Study',
		subtitle: 'IBD vs Healthy Controls',
		organism: 'Human gut microbiota',
		technology: 'illumina',
		technologyLabel: 'Short Read (Illumina)',
		dataDir: '/data/gut_microbiome',
		toolsUsed: ['seqkit', 'fastqc', 'multiqc', 'cutadapt', 'qiime2', 'dada2', 'silva', 'emperor', 'ancom', 'biom'],
		sections: [
			...createGutMicrobiomeIntro(),
			...createAmpliconPhase1Sections('/data/gut_microbiome'),
			...createAmpliconPhase2Sections('/data/gut_microbiome'),
			...createAmpliconPhase3Sections('/data/gut_microbiome'),
			...createAmpliconPhase4Sections('/data/gut_microbiome'),
			...createAmpliconPhase5Sections('/data/gut_microbiome'),
			createGutMicrobiomeConclusion()
		]
	},
	soil: {
		id: 'soil',
		title: 'Beneficial Soil Bacteria',
		subtitle: 'Compost Microbiome Analysis',
		organism: 'Soil/compost microbiota',
		technology: 'illumina',
		technologyLabel: 'Short Read (Illumina)',
		dataDir: '/data/soil_microbiome',
		toolsUsed: ['seqkit', 'fastqc', 'multiqc', 'cutadapt', 'qiime2', 'dada2', 'silva', 'emperor', 'ancom', 'biom'],
		sections: [
			...createSoilMicrobiomeIntro(),
			...createAmpliconPhase1Sections('/data/soil_microbiome'),
			...createAmpliconPhase2Sections('/data/soil_microbiome'),
			...createAmpliconPhase3Sections('/data/soil_microbiome'),
			...createAmpliconPhase4Sections('/data/soil_microbiome'),
			...createAmpliconPhase5Sections('/data/soil_microbiome'),
			...createSoilMicrobiomeAdditional('/data/soil_microbiome'),
			createSoilMicrobiomeConclusion()
		]
	},
	water: {
		id: 'water',
		title: 'Water Contamination',
		subtitle: 'Source Tracking Investigation',
		organism: 'Water microbiota',
		technology: 'illumina',
		technologyLabel: 'Short Read (Illumina)',
		dataDir: '/data/water_samples',
		toolsUsed: ['seqkit', 'fastqc', 'multiqc', 'cutadapt', 'qiime2', 'dada2', 'silva', 'emperor', 'ancom', 'sourcetracker2', 'biom'],
		sections: [
			...createWaterContaminationIntro(),
			...createAmpliconPhase1Sections('/data/water_samples'),
			...createAmpliconPhase2Sections('/data/water_samples'),
			...createAmpliconPhase3Sections('/data/water_samples'),
			...createAmpliconPhase4Sections('/data/water_samples'),
			...createAmpliconPhase5Sections('/data/water_samples'),
			...createWaterContaminationAdditional('/data/water_samples'),
			createWaterContaminationConclusion()
		]
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
