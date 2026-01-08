export interface StorylineSection {
	type: 'intro' | 'context' | 'task';
	title?: string;
	text: string;
	command?: string;
	explanation?: string;
	requiredDir?: string | null;
	parameters?: { name: string; desc: string }[];
	hint?: string | null;
}

export interface Storyline {
	id: string;
	title: string;
	subtitle: string;
	phase: string;
	sections: StorylineSection[];
	toolsUsed: string[];
}

export const storylines: Record<string, Storyline> = {
	outbreak: {
		id: 'outbreak',
		title: 'Hospital Outbreak Investigation',
		subtitle: 'WGS Analysis Pipeline',
		phase: 'Phase 1: Quality Control & Assembly',
		toolsUsed: ['fastqc', 'seqkit', 'trimmomatic', 'unicycler', 'bandage'],
		sections: [
			{
				type: 'intro',
				text: `UM Medical Centre Saturday Report: 5 patients in the ICU did not respond to antibiotics, suspected to have developed antimicrobial resistance within the past 72 hours.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'context',
				text: `Samples were collected and sent for whole genome sequencing. Data has been released to you. Your task is to analyze the bacterial genomes to determine if this is an outbreak and identify the source.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'task',
				title: 'Step 1: Explore the Data',
				text: `First, let's see what sequencing data we have. Use seqkit to get statistics about the FASTQ files.`,
				command: 'seqkit stats sample_01_R1.fastq.gz sample_01_R2.fastq.gz',
				explanation: 'SeqKit provides quick statistics about sequencing files including read counts and lengths.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: 'stats', desc: 'SeqKit subcommand for sequence statistics' },
					{ name: 'sample_01_R1.fastq.gz', desc: 'Forward reads file' },
					{ name: 'sample_01_R2.fastq.gz', desc: 'Reverse reads file' }
				]
			},
			{
				type: 'task',
				title: 'Step 2: Quality Control',
				text: `Check the quality of raw sequencing data (FASTQ files).`,
				command: 'fastqc sample_01_R1.fastq.gz sample_01_R2.fastq.gz -o qc_reports/',
				explanation: 'FastQC generates quality reports for raw sequence data. Check for adapter contamination and quality drops.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: 'sample_01_R1.fastq.gz', desc: 'Input FASTQ file (forward reads)' },
					{ name: 'sample_01_R2.fastq.gz', desc: 'Input FASTQ file (reverse reads)' },
					{ name: '-o qc_reports/', desc: 'Output directory for QC reports' }
				]
			},
			{
				type: 'task',
				title: 'Step 3: Read Trimming',
				text: `Remove adapter sequences and low-quality bases from reads.`,
				command: 'trimmomatic PE -phred33 sample_01_R1.fastq.gz sample_01_R2.fastq.gz trimmed/sample_01_R1_paired.fq.gz trimmed/sample_01_R1_unpaired.fq.gz trimmed/sample_01_R2_paired.fq.gz trimmed/sample_01_R2_unpaired.fq.gz ILLUMINACLIP:TruSeq3-PE.fa:2:30:10 SLIDINGWINDOW:4:15 MINLEN:36',
				explanation: 'Trimmomatic cleans reads by removing adapters and trimming poor-quality bases',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: 'PE', desc: 'Paired-end mode (R1 + R2 reads)' },
					{ name: '-phred33', desc: 'Quality score encoding (standard Illumina)' },
					{ name: 'ILLUMINACLIP:TruSeq3-PE.fa:2:30:10', desc: 'Remove Illumina adapters' },
					{ name: 'SLIDINGWINDOW:4:15', desc: 'Cut when 4bp window average quality < 15' },
					{ name: 'MINLEN:36', desc: 'Drop reads shorter than 36bp' }
				]
			},
			{
				type: 'task',
				title: 'Step 4: Genome Assembly',
				text: `Assemble cleaned reads into contiguous sequences (contigs).`,
				command: 'unicycler -1 trimmed/sample_01_R1_paired.fq.gz -2 trimmed/sample_01_R2_paired.fq.gz -o assembly/',
				explanation: 'Unicycler assembles bacterial genomes and can circularize chromosomes and plasmids',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '-1', desc: 'Forward reads (R1) input file' },
					{ name: '-2', desc: 'Reverse reads (R2) input file' },
					{ name: '-o assembly/', desc: 'Output directory for assembly results' }
				]
			},
			{
				type: 'task',
				title: 'Step 5: Visualize Assembly Graph',
				text: `Visualize the assembly graph to understand genome structure.`,
				command: 'bandage image assembly/assembly.gfa assembly/assembly_graph.png',
				explanation: 'Bandage creates visual representations of assembly graphs, showing how contigs connect',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: 'image', desc: 'Bandage command to generate image output' },
					{ name: 'assembly/assembly.gfa', desc: 'Input assembly graph file (GFA format)' },
					{ name: 'assembly/assembly_graph.png', desc: 'Output image file' }
				]
			}
		]
	},
	amr: {
		id: 'amr',
		title: 'AMR Surveillance',
		subtitle: 'Antimicrobial Resistance Detection',
		phase: 'Phase 2: Quality Assessment & AMR Analysis',
		toolsUsed: ['quast', 'checkm', 'confindr', 'abricate', 'mlst'],
		sections: [
			{
				type: 'intro',
				text: `The microbiology department has flagged several isolates showing resistance to last-line antibiotics. Public health authorities need a comprehensive AMR profile to guide treatment protocols.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'context',
				text: `You have been provided with assembled genome sequences from the suspected resistant isolates. Your task is to assess assembly quality and screen for antimicrobial resistance genes.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'task',
				title: 'Step 1: Assess Assembly Quality',
				text: `Evaluate the quality of the genome assembly using QUAST.`,
				command: 'quast assembly/assembly.fasta -o quast_results/',
				explanation: 'QUAST calculates assembly metrics like N50, total length, and contig counts.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: 'assembly/assembly.fasta', desc: 'Input assembly file' },
					{ name: '-o quast_results/', desc: 'Output directory for QUAST report' }
				]
			},
			{
				type: 'task',
				title: 'Step 2: Check Assembly Completeness',
				text: `Verify genome completeness and contamination using CheckM.`,
				command: 'checkm lineage_wf assembly/ checkm_results/ -x fasta',
				explanation: 'CheckM uses marker genes to estimate completeness and contamination of genome assemblies.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: 'lineage_wf', desc: 'Full CheckM workflow' },
					{ name: 'assembly/', desc: 'Directory containing assembly files' },
					{ name: 'checkm_results/', desc: 'Output directory' },
					{ name: '-x fasta', desc: 'File extension of assemblies' }
				]
			},
			{
				type: 'task',
				title: 'Step 3: Check for Contamination',
				text: `Use ConFindr to detect inter-species contamination in the samples.`,
				command: 'confindr -i reads/ -o confindr_results/',
				explanation: 'ConFindr identifies contamination by analyzing rMLST genes for mixed alleles.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '-i reads/', desc: 'Input directory with FASTQ files' },
					{ name: '-o confindr_results/', desc: 'Output directory for results' }
				]
			},
			{
				type: 'task',
				title: 'Step 4: Screen for AMR Genes',
				text: `Screen the assembly for antimicrobial resistance genes using ABRicate.`,
				command: 'abricate --db ncbi assembly/assembly.fasta > abricate_results/amr_report.tsv',
				explanation: 'ABRicate screens assemblies against curated databases of resistance genes.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '--db ncbi', desc: 'Use NCBI AMRFinderPlus database' },
					{ name: 'assembly/assembly.fasta', desc: 'Input assembly file' },
					{ name: '> amr_report.tsv', desc: 'Output TSV file' }
				]
			},
			{
				type: 'task',
				title: 'Step 5: Determine Sequence Type',
				text: `Identify the multilocus sequence type (MLST) of the isolate.`,
				command: 'mlst assembly/assembly.fasta > mlst_results/mlst_report.tsv',
				explanation: 'MLST assigns sequence types based on allelic profiles of housekeeping genes.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: 'assembly/assembly.fasta', desc: 'Input assembly file' },
					{ name: '> mlst_report.tsv', desc: 'Output TSV file' }
				]
			}
		]
	},
	plasmid: {
		id: 'plasmid',
		title: 'Plasmid Tracking',
		subtitle: 'Mobile Genetic Element Analysis',
		phase: 'Phase 3: Plasmid Detection & Characterization',
		toolsUsed: ['prokka', 'bakta', 'mob_suite', 'platon'],
		sections: [
			{
				type: 'intro',
				text: `Epidemiologists have noted that resistance genes are spreading rapidly between different bacterial species in the hospital. This suggests plasmid-mediated horizontal gene transfer.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'context',
				text: `You need to identify and characterize plasmids in the outbreak isolates to understand how resistance is spreading. This involves annotation and plasmid-specific analysis tools.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'task',
				title: 'Step 1: Genome Annotation',
				text: `Annotate the genome to identify genes, including potential resistance determinants.`,
				command: 'prokka --outdir prokka_results/ --prefix sample_01 assembly/assembly.fasta',
				explanation: 'Prokka rapidly annotates bacterial genomes, identifying CDS, tRNA, and rRNA features.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '--outdir prokka_results/', desc: 'Output directory' },
					{ name: '--prefix sample_01', desc: 'Output file prefix' },
					{ name: 'assembly/assembly.fasta', desc: 'Input assembly file' }
				]
			},
			{
				type: 'task',
				title: 'Step 2: Detailed Annotation with Bakta',
				text: `Get more detailed annotations using Bakta's comprehensive database.`,
				command: 'bakta assembly/assembly.fasta --db /databases/bakta/db --output bakta_results/',
				explanation: 'Bakta provides rich annotations with functional predictions and database cross-references.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: 'assembly/assembly.fasta', desc: 'Input assembly file' },
					{ name: '--db /databases/bakta/db', desc: 'Path to Bakta database' },
					{ name: '--output bakta_results/', desc: 'Output directory' }
				]
			},
			{
				type: 'task',
				title: 'Step 3: Plasmid Identification with MOB-suite',
				text: `Reconstruct and type plasmids using MOB-suite.`,
				command: 'mob_recon -i assembly/assembly.fasta -o mob_suite_results/',
				explanation: 'MOB-suite reconstructs plasmids and identifies replicon types and mobility genes.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '-i assembly/assembly.fasta', desc: 'Input assembly file' },
					{ name: '-o mob_suite_results/', desc: 'Output directory' }
				]
			},
			{
				type: 'task',
				title: 'Step 4: Confirm Plasmid Predictions with Platon',
				text: `Use Platon for additional confirmation of plasmid sequences.`,
				command: 'platon --db /databases/platon assembly/assembly.fasta -o platon_results/',
				explanation: 'Platon uses machine learning to distinguish plasmids from chromosomal sequences.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '--db /databases/platon', desc: 'Path to Platon database' },
					{ name: 'assembly/assembly.fasta', desc: 'Input assembly file' },
					{ name: '-o platon_results/', desc: 'Output directory' }
				]
			}
		]
	},
	phylogenetics: {
		id: 'phylogenetics',
		title: 'Phylogenetic Analysis',
		subtitle: 'Evolutionary Relationships & Population Structure',
		phase: 'Phase 4: Phylogenetics & Recombination',
		toolsUsed: ['snippy', 'roary', 'iqtree', 'gubbins'],
		sections: [
			{
				type: 'intro',
				text: `To understand the outbreak dynamics, we need to determine how closely related the patient isolates are and when they diverged. This requires phylogenetic analysis.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'context',
				text: `You have assembled genomes from all 5 patient isolates plus a reference strain. Build a phylogenetic tree to visualize their evolutionary relationships.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'task',
				title: 'Step 1: Variant Calling',
				text: `Call SNPs between each isolate and the reference genome using Snippy.`,
				command: 'snippy --ref reference.gbk --ctgs assembly/assembly.fasta --outdir snippy_results/',
				explanation: 'Snippy aligns contigs to a reference and identifies SNPs, insertions, and deletions.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '--ref reference.gbk', desc: 'Reference genome in GenBank format' },
					{ name: '--ctgs assembly/assembly.fasta', desc: 'Query contigs/assembly' },
					{ name: '--outdir snippy_results/', desc: 'Output directory' }
				]
			},
			{
				type: 'task',
				title: 'Step 2: Pan-genome Analysis',
				text: `Analyze the pan-genome to identify core and accessory genes.`,
				command: 'roary -f roary_results/ -e -n -v *.gff',
				explanation: 'Roary builds the pan-genome and identifies genes shared across all isolates (core) vs. unique ones.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '-f roary_results/', desc: 'Output directory' },
					{ name: '-e', desc: 'Create multiFASTA alignment of core genes' },
					{ name: '-n', desc: 'Fast core gene alignment with MAFFT' },
					{ name: '-v', desc: 'Verbose output' },
					{ name: '*.gff', desc: 'Input GFF files from Prokka' }
				]
			},
			{
				type: 'task',
				title: 'Step 3: Build Phylogenetic Tree',
				text: `Construct a maximum-likelihood phylogenetic tree using IQ-TREE.`,
				command: 'iqtree -s roary_results/core_gene_alignment.aln -m GTR+G -bb 1000 -nt AUTO',
				explanation: 'IQ-TREE builds phylogenetic trees using maximum likelihood with bootstrap support.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '-s core_gene_alignment.aln', desc: 'Input alignment file' },
					{ name: '-m GTR+G', desc: 'Nucleotide substitution model' },
					{ name: '-bb 1000', desc: 'Ultrafast bootstrap replicates' },
					{ name: '-nt AUTO', desc: 'Auto-detect optimal thread count' }
				]
			},
			{
				type: 'task',
				title: 'Step 4: Remove Recombination',
				text: `Identify and remove recombinant regions using Gubbins.`,
				command: 'run_gubbins.py -p gubbins_results/clean roary_results/core_gene_alignment.aln',
				explanation: 'Gubbins identifies recombination regions that can confound phylogenetic inference.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '-p gubbins_results/clean', desc: 'Output prefix' },
					{ name: 'core_gene_alignment.aln', desc: 'Input alignment file' }
				]
			}
		]
	},
	complete: {
		id: 'complete',
		title: 'Complete Pipeline',
		subtitle: 'Full WGS Analysis Workflow',
		phase: 'Complete Analysis: Raw Reads to Phylogeny',
		toolsUsed: ['seqkit', 'fastqc', 'trimmomatic', 'unicycler', 'bandage', 'quast', 'checkm', 'prokka', 'abricate', 'mlst', 'mob_suite', 'snippy', 'roary', 'iqtree', 'gubbins'],
		sections: [
			{
				type: 'intro',
				text: `This is a comprehensive analysis tracking a hospital outbreak from initial sequencing data to publication-ready phylogenetic analysis. You will use all available tools in the correct order.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'context',
				text: `Follow the complete pipeline to analyze bacterial whole genome sequencing data. Each step builds on the previous results.`,
				hint: null,
				requiredDir: null
			},
			// QC Steps
			{
				type: 'task',
				title: 'Step 1: Data Exploration',
				text: `Get an overview of your sequencing data.`,
				command: 'seqkit stats sample_01_R1.fastq.gz sample_01_R2.fastq.gz',
				explanation: 'Always start by understanding your input data.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: 'stats', desc: 'Generate sequence statistics' }
				]
			},
			{
				type: 'task',
				title: 'Step 2: Quality Control',
				text: `Generate quality reports for raw reads.`,
				command: 'fastqc sample_01_R1.fastq.gz sample_01_R2.fastq.gz -o qc_reports/',
				explanation: 'FastQC identifies quality issues before assembly.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '-o qc_reports/', desc: 'Output directory' }
				]
			},
			{
				type: 'task',
				title: 'Step 3: Read Trimming',
				text: `Clean the reads by removing adapters and low-quality bases.`,
				command: 'trimmomatic PE -phred33 sample_01_R1.fastq.gz sample_01_R2.fastq.gz trimmed/sample_01_R1_paired.fq.gz trimmed/sample_01_R1_unpaired.fq.gz trimmed/sample_01_R2_paired.fq.gz trimmed/sample_01_R2_unpaired.fq.gz ILLUMINACLIP:TruSeq3-PE.fa:2:30:10 SLIDINGWINDOW:4:15 MINLEN:36',
				explanation: 'Quality trimming improves assembly accuracy.',
				requiredDir: '/data/outbreak_investigation',
				parameters: []
			},
			// Assembly
			{
				type: 'task',
				title: 'Step 4: Genome Assembly',
				text: `Assemble the cleaned reads into contigs.`,
				command: 'unicycler -1 trimmed/sample_01_R1_paired.fq.gz -2 trimmed/sample_01_R2_paired.fq.gz -o assembly/',
				explanation: 'Unicycler produces high-quality bacterial assemblies.',
				requiredDir: '/data/outbreak_investigation',
				parameters: []
			},
			{
				type: 'task',
				title: 'Step 5: Visualize Assembly',
				text: `Create a visual representation of the assembly graph.`,
				command: 'bandage image assembly/assembly.gfa assembly/assembly_graph.png',
				explanation: 'Visual inspection helps identify assembly issues.',
				requiredDir: '/data/outbreak_investigation',
				parameters: []
			},
			// Assessment
			{
				type: 'task',
				title: 'Step 6: Assembly Quality Metrics',
				text: `Assess assembly quality statistics.`,
				command: 'quast assembly/assembly.fasta -o quast_results/',
				explanation: 'QUAST provides key metrics like N50 and total length.',
				requiredDir: '/data/outbreak_investigation',
				parameters: []
			},
			{
				type: 'task',
				title: 'Step 7: Genome Completeness',
				text: `Check genome completeness using marker genes.`,
				command: 'checkm lineage_wf assembly/ checkm_results/ -x fasta',
				explanation: 'High completeness (>95%) and low contamination (<5%) indicate a good assembly.',
				requiredDir: '/data/outbreak_investigation',
				parameters: []
			},
			// Annotation
			{
				type: 'task',
				title: 'Step 8: Genome Annotation',
				text: `Annotate genes in the assembly.`,
				command: 'prokka --outdir prokka_results/ --prefix sample_01 assembly/assembly.fasta',
				explanation: 'Prokka identifies CDS, tRNA, and rRNA features.',
				requiredDir: '/data/outbreak_investigation',
				parameters: []
			},
			// AMR Analysis
			{
				type: 'task',
				title: 'Step 9: AMR Gene Detection',
				text: `Screen for antimicrobial resistance genes.`,
				command: 'abricate --db ncbi assembly/assembly.fasta > abricate_results/amr_report.tsv',
				explanation: 'Identifying resistance genes guides treatment decisions.',
				requiredDir: '/data/outbreak_investigation',
				parameters: []
			},
			{
				type: 'task',
				title: 'Step 10: MLST Typing',
				text: `Determine the sequence type.`,
				command: 'mlst assembly/assembly.fasta > mlst_results/mlst_report.tsv',
				explanation: 'MLST helps track isolate lineages.',
				requiredDir: '/data/outbreak_investigation',
				parameters: []
			},
			// Plasmid Analysis
			{
				type: 'task',
				title: 'Step 11: Plasmid Detection',
				text: `Identify plasmids in the assembly.`,
				command: 'mob_recon -i assembly/assembly.fasta -o mob_suite_results/',
				explanation: 'Plasmids often carry resistance genes.',
				requiredDir: '/data/outbreak_investigation',
				parameters: []
			},
			// Phylogenetics
			{
				type: 'task',
				title: 'Step 12: Variant Calling',
				text: `Call SNPs against the reference.`,
				command: 'snippy --ref reference.gbk --ctgs assembly/assembly.fasta --outdir snippy_results/',
				explanation: 'SNPs reveal evolutionary relationships.',
				requiredDir: '/data/outbreak_investigation',
				parameters: []
			},
			{
				type: 'task',
				title: 'Step 13: Pan-genome Analysis',
				text: `Build the pan-genome across all isolates.`,
				command: 'roary -f roary_results/ -e -n -v *.gff',
				explanation: 'Pan-genome analysis identifies shared and unique genes.',
				requiredDir: '/data/outbreak_investigation',
				parameters: []
			},
			{
				type: 'task',
				title: 'Step 14: Phylogenetic Tree',
				text: `Build a phylogenetic tree from core genes.`,
				command: 'iqtree -s roary_results/core_gene_alignment.aln -m GTR+G -bb 1000 -nt AUTO',
				explanation: 'The tree shows evolutionary relationships.',
				requiredDir: '/data/outbreak_investigation',
				parameters: []
			},
			{
				type: 'task',
				title: 'Step 15: Recombination Analysis',
				text: `Remove recombination to get clean phylogeny.`,
				command: 'run_gubbins.py -p gubbins_results/clean roary_results/core_gene_alignment.aln',
				explanation: 'Recombination can confound phylogenetic analysis.',
				requiredDir: '/data/outbreak_investigation',
				parameters: []
			}
		]
	}
};

export function getStoryline(id: string): Storyline | undefined {
	return storylines[id];
}

export function getStorylinesList(): { id: string; title: string; subtitle: string }[] {
	return Object.values(storylines).map(s => ({
		id: s.id,
		title: s.title,
		subtitle: s.subtitle
	}));
}
