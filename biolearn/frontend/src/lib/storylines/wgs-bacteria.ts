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
	technology: 'illumina' | 'pacbio' | 'hybrid';
	sections: StorylineSection[];
	toolsUsed: string[];
}

// ============================================
// ILLUMINA WORKFLOW SECTIONS
// ============================================

function createIlluminaPhase1Sections(): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 1: Quality Control & Assembly',
			text: 'Assess raw sequencing data quality and assemble the genome.',
			phase: 1
		},
		{
			type: 'task',
			title: 'Step 1: Explore the Data',
			text: `Check the sequencing data statistics.`,
			command: 'seqkit stats sample_01_R1.fastq.gz sample_01_R2.fastq.gz',
			explanation: 'SeqKit provides quick statistics about sequencing files.',
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
			text: `Remove adapters and low-quality bases.`,
			command: 'trimmomatic PE -phred33 sample_01_R1.fastq.gz sample_01_R2.fastq.gz trimmed/sample_01_R1_paired.fq.gz trimmed/sample_01_R1_unpaired.fq.gz trimmed/sample_01_R2_paired.fq.gz trimmed/sample_01_R2_unpaired.fq.gz ILLUMINACLIP:TruSeq3-PE.fa:2:30:10 SLIDINGWINDOW:4:15 MINLEN:36',
			explanation: 'Trimmomatic removes adapter contamination and low quality bases.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: 'PE', desc: 'Paired-end mode' },
				{ name: '-phred33', desc: 'Quality encoding' },
				{ name: 'ILLUMINACLIP:...', desc: 'Adapter trimming' },
				{ name: 'SLIDINGWINDOW:4:15', desc: 'Quality trimming' },
				{ name: 'MINLEN:36', desc: 'Minimum length' }
			]
		},
		{
			type: 'task',
			title: 'Step 4: Genome Assembly',
			text: `Assemble cleaned reads into contigs.`,
			command: 'unicycler -1 trimmed/sample_01_R1_paired.fq.gz -2 trimmed/sample_01_R2_paired.fq.gz -o assembly/',
			explanation: 'Unicycler produces high-quality bacterial assemblies.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-1/-2', desc: 'Forward/reverse reads' },
				{ name: '-o assembly/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 5: Visualize Assembly',
			text: `Create a visual representation of the assembly graph.`,
			command: 'bandage image assembly/assembly.gfa assembly/assembly_graph.png',
			explanation: 'Bandage visualizes assembly graphs to identify structure.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: 'image', desc: 'Generate image output' },
				{ name: 'assembly.gfa', desc: 'Input GFA file' }
			]
		}
	];
}

function createIlluminaPhase2Sections(): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 2: Quality Assessment & Screening',
			text: 'Evaluate assembly quality and screen for key markers.',
			phase: 2
		},
		{
			type: 'task',
			title: 'Step 6: Assembly Quality',
			text: `Assess assembly quality metrics.`,
			command: 'quast assembly/assembly.fasta -o quast_results/',
			explanation: 'QUAST calculates N50, total length, and other metrics.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-o quast_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 7: Genome Completeness',
			text: `Check genome completeness using marker genes.`,
			command: 'checkm lineage_wf assembly/ checkm_results/ -x fasta',
			explanation: 'CheckM estimates completeness and contamination.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: 'lineage_wf', desc: 'Full CheckM workflow' },
				{ name: '-x fasta', desc: 'File extension' }
			]
		},
		{
			type: 'task',
			title: 'Step 8: BUSCO Assessment',
			text: `Validate completeness with universal single-copy orthologs.`,
			command: 'busco -i assembly/assembly.fasta -o busco_results/ -m genome -l bacteria_odb10',
			explanation: 'BUSCO checks for conserved genes expected in all bacteria.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-m genome', desc: 'Genome mode' },
				{ name: '-l bacteria_odb10', desc: 'Bacteria database' }
			]
		},
		{
			type: 'task',
			title: 'Step 9: AMR Screening',
			text: `Screen for antimicrobial resistance genes.`,
			command: 'abricate --db ncbi assembly/assembly.fasta -o abricate_results/',
			explanation: 'ABRicate identifies resistance genes from databases.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--db ncbi', desc: 'Use NCBI database' },
				{ name: '-o abricate_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 10: MLST Typing',
			text: `Determine the sequence type.`,
			command: 'mlst assembly/assembly.fasta -o mlst_results/',
			explanation: 'MLST assigns sequence types for epidemiological tracking.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-o mlst_results/', desc: 'Output directory' }
			]
		}
	];
}

function createIlluminaPhase3Sections(): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 3: Annotation & Plasmid Analysis',
			text: 'Annotate genes and identify mobile genetic elements.',
			phase: 3
		},
		{
			type: 'task',
			title: 'Step 11: Genome Annotation',
			text: `Annotate genes in the assembly.`,
			command: 'prokka --outdir prokka_results/ --prefix sample_01 assembly/assembly.fasta',
			explanation: 'Prokka identifies CDS, tRNA, and rRNA features.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--outdir prokka_results/', desc: 'Output directory' },
				{ name: '--prefix sample_01', desc: 'Output file prefix' }
			]
		},
		{
			type: 'task',
			title: 'Step 12: Detailed Annotation',
			text: `Get comprehensive annotations with Bakta.`,
			command: 'bakta assembly/assembly.fasta --output bakta_results/',
			explanation: 'Bakta provides rich functional annotations.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--output bakta_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 13: Plasmid Detection',
			text: `Identify and characterize plasmids.`,
			command: 'mob_recon -i assembly/assembly.fasta -o mob_recon_results/',
			explanation: 'MOB-suite reconstructs plasmids and identifies replicon types.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-i', desc: 'Input assembly' },
				{ name: '-o mob_recon_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 14: Plasmid Typing',
			text: `Identify plasmid replicon types.`,
			command: 'plasmidfinder -i assembly/assembly.fasta -o plasmidfinder_results/',
			explanation: 'PlasmidFinder detects plasmid replicons for typing.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-i', desc: 'Input assembly' },
				{ name: '-o plasmidfinder_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 15: Confirm Plasmids',
			text: `Verify plasmid predictions with Platon.`,
			command: 'platon assembly/assembly.fasta -o platon_results/',
			explanation: 'Platon uses ML to distinguish plasmids from chromosomes.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-o platon_results/', desc: 'Output directory' }
			]
		}
	];
}

function createIlluminaPhase4Sections(): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 4: Phylogenetics',
			text: 'Build evolutionary trees and analyze population structure.',
			phase: 4
		},
		{
			type: 'task',
			title: 'Step 16: Variant Calling',
			text: `Call SNPs against the reference genome.`,
			command: 'snippy --ref reference.gbk --ctgs assembly/assembly.fasta --outdir snippy_results/',
			explanation: 'Snippy identifies SNPs, insertions, and deletions.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--ref reference.gbk', desc: 'Reference genome' },
				{ name: '--ctgs assembly/assembly.fasta', desc: 'Query contigs' },
				{ name: '--outdir snippy_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 17: Pan-genome Analysis',
			text: `Analyze the pan-genome across isolates.`,
			command: 'roary -f roary_results/ -e -n -v prokka_results/*.gff',
			explanation: 'Roary identifies core and accessory genes.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-f roary_results/', desc: 'Output directory' },
				{ name: '-e', desc: 'Create core gene alignment' },
				{ name: '-n', desc: 'Fast alignment with MAFFT' },
				{ name: '-v', desc: 'Verbose output' }
			]
		},
		{
			type: 'task',
			title: 'Step 18: Phylogenetic Tree',
			text: `Build a maximum-likelihood phylogenetic tree.`,
			command: 'iqtree -s roary_results/core_gene_alignment.aln -m GTR+G -bb 1000 -nt AUTO',
			explanation: 'IQ-TREE builds phylogenetic trees with bootstrap support.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-s roary_results/core_gene_alignment.aln', desc: 'Input alignment' },
				{ name: '-m GTR+G', desc: 'Substitution model' },
				{ name: '-bb 1000', desc: 'Bootstrap replicates' },
				{ name: '-nt AUTO', desc: 'Auto-detect threads' }
			]
		},
		{
			type: 'task',
			title: 'Step 19: Recombination Analysis',
			text: `Remove recombination for cleaner phylogeny.`,
			command: 'run_gubbins.py -p gubbins_results/clean roary_results/core_gene_alignment.aln',
			explanation: 'Gubbins identifies recombination regions.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-p gubbins_results/clean', desc: 'Output prefix' }
			]
		}
	];
}

// Hospital-specific additional tools
function createHospitalAdditionalTools(): StorylineSection[] {
	return [
		{
			type: 'task',
			title: 'Step 20: Detailed Resistance Analysis',
			text: `Get detailed resistance gene information.`,
			command: 'resfinder -i assembly/assembly.fasta -o resfinder_results/ -db_res',
			explanation: 'ResFinder provides detailed resistance gene annotations.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-db_res', desc: 'Use resistance database' }
			]
		},
		{
			type: 'task',
			title: 'Step 21: Integron Detection',
			text: `Find integrons carrying resistance cassettes.`,
			command: 'integron_finder assembly/assembly.fasta --outdir integron_results/',
			explanation: 'IntegronFinder detects integrons that often carry AMR genes.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--outdir integron_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 22: IS Element Detection',
			text: `Identify insertion sequences for transmission tracking.`,
			command: 'isescan --seqfile assembly/assembly.fasta --output isescan_results/',
			explanation: 'ISEScan finds IS elements that facilitate gene mobility.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--seqfile', desc: 'Input assembly' },
				{ name: '--output isescan_results/', desc: 'Output directory' }
			]
		}
	];
}

// Foodborne-specific additional tools
function createFoodborneAdditionalTools(): StorylineSection[] {
	return [
		{
			type: 'task',
			title: 'Step 20: Detailed Resistance Analysis',
			text: `Get detailed resistance gene information.`,
			command: 'resfinder -i assembly/assembly.fasta -o resfinder_results/ -db_res',
			explanation: 'ResFinder provides detailed resistance gene annotations.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-db_res', desc: 'Use resistance database' }
			]
		},
		{
			type: 'task',
			title: 'Step 21: Virulence Factor Screening',
			text: `Screen for virulence factors.`,
			command: 'virulencefinder -i assembly/assembly.fasta -o virulencefinder_results/',
			explanation: 'VirulenceFinder identifies pathogenicity factors.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-i', desc: 'Input assembly' },
				{ name: '-o virulencefinder_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 22: Integron Detection',
			text: `Find integrons carrying resistance cassettes.`,
			command: 'integron_finder assembly/assembly.fasta --outdir integron_results/',
			explanation: 'IntegronFinder detects integrons that often carry AMR genes.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--outdir integron_results/', desc: 'Output directory' }
			]
		}
	];
}

// Plant-specific additional tools
function createPlantAdditionalTools(): StorylineSection[] {
	return [
		{
			type: 'task',
			title: 'Step 20: Virulence Factor Screening',
			text: `Screen for Type III effectors and other virulence factors.`,
			command: 'virulencefinder -i assembly/assembly.fasta -o virulencefinder_results/',
			explanation: 'VirulenceFinder identifies pathogenicity factors.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-i', desc: 'Input assembly' },
				{ name: '-o virulencefinder_results/', desc: 'Output directory' }
			]
		}
	];
}

// Fish-specific additional tools
function createFishAdditionalTools(): StorylineSection[] {
	return [
		{
			type: 'task',
			title: 'Step 20: Virulence Factor Screening',
			text: `Screen for Vibrio virulence factors.`,
			command: 'virulencefinder -i assembly/assembly.fasta -o virulencefinder_results/',
			explanation: 'VirulenceFinder identifies toxins and virulence genes.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-i', desc: 'Input assembly' },
				{ name: '-o virulencefinder_results/', desc: 'Output directory' }
			]
		}
	];
}

function createPhase5Placeholder(): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 5: Reporting (Coming Soon)',
			text: 'Generate publication-ready reports and visualizations using R.',
			phase: 5
		},
		{
			type: 'context',
			text: `Phase 5 will include:\n- R/RMarkdown report generation\n- Publication-quality figures with ggplot2\n- Interactive visualizations with ggtree\n- Automated report templates\n\nThis phase is currently under development.`
		}
	];
}

// ============================================
// PACBIO HYBRID ASSEMBLY SECTIONS (for Fish)
// ============================================

function createPacBioHybridSections(): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 1B: PacBio Hybrid Assembly',
			text: 'Use PacBio long reads to resolve the fragmented assembly.',
			phase: 1
		},
		{
			type: 'context',
			text: `You have received PacBio HiFi reads for hybrid assembly. Long reads can span repetitive regions that caused the Illumina assembly to fragment.`
		},
		{
			type: 'task',
			title: 'Step H1: Long-read Quality Check',
			text: `Assess PacBio read quality and length distribution.`,
			command: 'NanoPlot --fastq sample_01_pacbio.fastq.gz -o nanoplot_results/',
			explanation: 'NanoPlot works with both Nanopore and PacBio reads.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--fastq', desc: 'Input FASTQ file' },
				{ name: '-o nanoplot_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step H2: Filter Long Reads',
			text: `Filter reads by quality and length.`,
			command: 'filtlong --min_length 5000 --min_mean_q 20 sample_01_pacbio.fastq.gz > filtered/sample_01_filtered.fastq.gz',
			explanation: 'Filtlong removes low-quality and short reads.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--min_length 5000', desc: 'Minimum read length' },
				{ name: '--min_mean_q 20', desc: 'Minimum quality score' }
			]
		},
		{
			type: 'task',
			title: 'Step H3: Hybrid Assembly',
			text: `Create hybrid assembly combining short and long reads.`,
			command: 'unicycler -1 trimmed/sample_01_R1_paired.fq.gz -2 trimmed/sample_01_R2_paired.fq.gz -l filtered/sample_01_filtered.fastq.gz -o hybrid_assembly/',
			explanation: 'Unicycler uses long reads to bridge gaps in short-read assembly.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-1/-2', desc: 'Illumina paired reads' },
				{ name: '-l', desc: 'Long reads (PacBio)' },
				{ name: '-o hybrid_assembly/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step H4: Visualize Hybrid Assembly',
			text: `Visualize the improved assembly graph.`,
			command: 'bandage image hybrid_assembly/assembly.gfa hybrid_assembly/assembly_graph.png',
			explanation: 'Check if hybrid assembly resolved circular chromosomes.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: 'image', desc: 'Generate image output' }
			]
		},
		{
			type: 'task',
			title: 'Step H5: Verify Assembly Quality',
			text: `Check if hybrid assembly is complete.`,
			command: 'quast hybrid_assembly/assembly.fasta -o hybrid_quast_results/',
			explanation: 'Verify N50 improvement and contig count reduction.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-o hybrid_quast_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'context',
			text: `✅ Hybrid assembly successful!\n\nResults:\n- 2 circular contigs (Chromosome I: 3.2 Mb, Chromosome II: 1.9 Mb)\n- N50 improved from 180 kb to 3.2 Mb\n- Assembly is now complete\n\nContinuing analysis with the improved assembly...`
		}
	];
}

// ============================================
// STORYLINES
// ============================================

export const storylines: Record<string, Storyline> = {
	hospital: {
		id: 'hospital',
		title: 'Hospital Outbreak Investigation',
		subtitle: 'Antimicrobial Resistance in ICU',
		organism: 'Klebsiella pneumoniae',
		technology: 'illumina',
		toolsUsed: ['seqkit', 'fastqc', 'trimmomatic', 'unicycler', 'bandage', 'quast', 'checkm', 'busco', 'abricate', 'mlst', 'prokka', 'bakta', 'mob_recon', 'plasmidfinder', 'platon', 'snippy', 'roary', 'iqtree', 'gubbins', 'resfinder', 'integron_finder', 'isescan'],
		sections: [
			{
				type: 'intro',
				text: `3 patients in the ICU did not respond to last-line antibiotics. All patients developed severe infections within the past 72 hours.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'context',
				text: `Samples from all 3 patients have been sequenced using Illumina NovaSeq. Initial culture identified Klebsiella pneumoniae. Your task: Determine if this is a clonal outbreak, identify the resistance mechanisms, and trace the source.`,
				hint: null,
				requiredDir: null
			},
			...createIlluminaPhase1Sections(),
			...createIlluminaPhase2Sections(),
			...createIlluminaPhase3Sections(),
			...createIlluminaPhase4Sections(),
			...createHospitalAdditionalTools(),
			...createPhase5Placeholder(),
			{
				type: 'complete',
				title: 'Analysis Complete',
				text: `Congratulations! You have completed the Hospital Outbreak Investigation.\n\n**Assembly Result:** Complete genome - 1 circular chromosome (5.3 Mb) + 2 plasmids (pKPC-250kb, pNDM-85kb)\n\n**Key findings:**\n• Identified clonal outbreak (ST258 K. pneumoniae)\n• Detected carbapenemase genes (blaKPC-2, blaNDM-1)\n• Located resistance genes on conjugative plasmids\n• Phylogenetic analysis confirmed recent transmission\n\n**Understanding the phylogenetic result:**\nThe phylogenetic tree showed all 3 patient isolates clustered together with only 3-5 SNP differences. In bacteria, approximately 1-2 SNPs accumulate per genome per year. Finding <5 SNPs between isolates indicates they shared a common ancestor within weeks—confirming direct patient-to-patient transmission or a common environmental source within the ICU.`
			}
		]
	},
	plant: {
		id: 'plant',
		title: 'Plant Pathogen Investigation',
		subtitle: 'Citrus Canker Outbreak',
		organism: 'Xanthomonas citri',
		technology: 'illumina',
		toolsUsed: ['seqkit', 'fastqc', 'trimmomatic', 'unicycler', 'bandage', 'quast', 'checkm', 'busco', 'abricate', 'mlst', 'prokka', 'bakta', 'mob_recon', 'plasmidfinder', 'platon', 'snippy', 'roary', 'iqtree', 'gubbins', 'virulencefinder'],
		sections: [
			{
				type: 'intro',
				text: `ALERT - Department of Agriculture:\n\nMultiple citrus orchards in the region are showing symptoms of citrus canker. Lesions on leaves, stems, and fruit are spreading rapidly. Quarantine measures have been implemented.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'image',
				title: 'Disease Symptoms',
				text: 'Citrus canker lesions on infected orange fruit and leaves. Note the raised, corky lesions with characteristic yellow halos - a hallmark of Xanthomonas citri infection.',
				imageUrl: '/images/citrus_canker.jpg',
				imageAlt: 'Citrus canker lesions showing raised brown/tan lesions with yellow halos on orange fruit and leaves'
			},
			{
				type: 'context',
				text: `Isolates from 6 affected orchards have been collected and sequenced. The suspected pathogen is Xanthomonas citri pv. citri. Your task: Confirm the pathogen identity, determine if it's a single introduction or multiple events, and identify potential virulence factors.`,
				hint: null,
				requiredDir: null
			},
			...createIlluminaPhase1Sections(),
			...createIlluminaPhase2Sections(),
			...createIlluminaPhase3Sections(),
			...createIlluminaPhase4Sections(),
			...createPlantAdditionalTools(),
			...createPhase5Placeholder(),
			{
				type: 'complete',
				title: 'Analysis Complete',
				text: `Congratulations! You have completed the Plant Pathogen Investigation.\n\n**Assembly Result:** Complete genome - 1 circular chromosome (5.1 Mb) + 1 plasmid (pXAC64-64kb)\n\n**Key findings:**\n• Confirmed Xanthomonas citri pv. citri\n• Single introduction event (clonal population across all orchards)\n• Identified Type III secretion system effectors (xopAD, xopE, avrBs2)\n• Copper resistance genes detected on plasmid pXAC64\n• Source traced to imported plant material from Southeast Asia`
			}
		]
	},
	fish: {
		id: 'fish',
		title: 'Fish Mortality Event',
		subtitle: 'Suspected Vibrio Outbreak',
		organism: 'Vibrio vulnificus',
		technology: 'illumina',
		toolsUsed: ['seqkit', 'fastqc', 'trimmomatic', 'unicycler', 'bandage', 'quast', 'checkm', 'busco', 'abricate', 'mlst', 'prokka', 'bakta', 'mob_recon', 'plasmidfinder', 'platon', 'snippy', 'roary', 'iqtree', 'gubbins', 'virulencefinder', 'NanoPlot', 'filtlong'],
		sections: [
			{
				type: 'intro',
				text: `EMERGENCY - Fisheries Department Report:\n\nMass fish mortality event in coastal aquaculture facilities. Over 50,000 fish have died in the past week. Preliminary tests suggest bacterial infection. Water temperatures have been unusually high.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'image',
				title: 'Affected Fish',
				text: 'Fish showing clinical signs of Vibrio infection including skin ulcerations, hemorrhaging around fins, and necrotic lesions. These symptoms are characteristic of vibriosis in aquaculture settings.',
				imageUrl: '/images/vibrio_fish.jpg',
				imageAlt: 'Affected fish showing skin ulcerations, hemorrhaging, and necrotic lesions typical of Vibrio infection'
			},
			{
				type: 'context',
				text: `Samples from dead fish and water have been collected from 4 affected facilities. Initial Gram staining shows curved Gram-negative rods, suggesting Vibrio species. Your task: Identify the causative agent, assess virulence potential, and determine if environmental conditions contributed to the outbreak.`,
				hint: null,
				requiredDir: null
			},
			// Phase 1: QC & Assembly (Illumina)
			{
				type: 'phase',
				title: 'Phase 1: Quality Control & Assembly',
				text: 'Assess raw sequencing data quality and assemble the genome.',
				phase: 1
			},
			{
				type: 'task',
				title: 'Step 1: Explore the Data',
				text: `Check the sequencing data statistics.`,
				command: 'seqkit stats sample_01_R1.fastq.gz sample_01_R2.fastq.gz',
				explanation: 'SeqKit provides quick statistics about sequencing files.',
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
				text: `Remove adapters and low-quality bases.`,
				command: 'trimmomatic PE -phred33 sample_01_R1.fastq.gz sample_01_R2.fastq.gz trimmed/sample_01_R1_paired.fq.gz trimmed/sample_01_R1_unpaired.fq.gz trimmed/sample_01_R2_paired.fq.gz trimmed/sample_01_R2_unpaired.fq.gz ILLUMINACLIP:TruSeq3-PE.fa:2:30:10 SLIDINGWINDOW:4:15 MINLEN:36',
				explanation: 'Trimmomatic removes adapter contamination and low quality bases.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: 'PE', desc: 'Paired-end mode' },
					{ name: '-phred33', desc: 'Quality encoding' },
					{ name: 'ILLUMINACLIP:...', desc: 'Adapter trimming' },
					{ name: 'SLIDINGWINDOW:4:15', desc: 'Quality trimming' },
					{ name: 'MINLEN:36', desc: 'Minimum length' }
				]
			},
			{
				type: 'task',
				title: 'Step 4: Genome Assembly',
				text: `Assemble cleaned reads into contigs.`,
				command: 'unicycler -1 trimmed/sample_01_R1_paired.fq.gz -2 trimmed/sample_01_R2_paired.fq.gz -o assembly/',
				explanation: 'Unicycler produces high-quality bacterial assemblies.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '-1/-2', desc: 'Forward/reverse reads' },
					{ name: '-o assembly/', desc: 'Output directory' }
				]
			},
			{
				type: 'task',
				title: 'Step 5: Visualize Assembly',
				text: `Create a visual representation of the assembly graph.`,
				command: 'bandage image assembly/assembly.gfa assembly/assembly_graph.png',
				explanation: 'Bandage visualizes assembly graphs to identify structure.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: 'image', desc: 'Generate image output' },
					{ name: 'assembly.gfa', desc: 'Input GFA file' }
				]
			},
			// ALERT: Fragmented assembly
			{
				type: 'alert',
				title: '⚠️ Assembly Quality Warning',
				text: `**Problem Detected:** Your Illumina assembly produced 15 contigs instead of the expected 2 circular chromosomes.\n\n**Why this happened:** Vibrio vulnificus has two chromosomes with repetitive regions that short Illumina reads (150 bp) cannot span. This causes the assembler to break at these repeat boundaries.\n\n**Assembly Statistics:**\n• Contigs: 15 (expected: 2)\n• N50: 180 kb (expected: ~3 Mb)\n• Total size: 5.0 Mb (correct)\n• Largest contig: 450 kb\n\nThis fragmented assembly can still identify the pathogen, but plasmid detection and complete genome analysis will be unreliable.`
			},
			// Decision point
			{
				type: 'decision',
				title: 'Choose How to Proceed',
				text: `Your Illumina assembly is fragmented. How would you like to proceed?`,
				options: [
					{
						id: 'continue',
						label: 'Continue with Fragmented Assembly',
						description: 'Proceed with current assembly. Results will have caveats but pathogen ID is still possible.'
					},
					{
						id: 'hybrid',
						label: 'Perform Hybrid Assembly (PacBio)',
						description: 'Use additional PacBio HiFi long reads to resolve the assembly into complete chromosomes.'
					},
					{
						id: 'stop',
						label: 'Stop Analysis',
						description: 'End the analysis here and report preliminary findings only.'
					}
				]
			},
			// Continue path context
			{
				type: 'context',
				text: `**Continuing with fragmented assembly...**\n\nNote: Some analyses may be incomplete due to the fragmented assembly. Plasmid detection and IS element analysis may give unreliable results. However, we can still:\n• Identify the pathogen species\n• Detect major virulence genes\n• Perform MLST typing\n• Build a preliminary phylogeny`
			},
			// Phase 2
			{
				type: 'phase',
				title: 'Phase 2: Quality Assessment & Screening',
				text: 'Evaluate assembly quality and screen for key markers.',
				phase: 2
			},
			{
				type: 'task',
				title: 'Step 6: Assembly Quality',
				text: `Assess assembly quality metrics.`,
				command: 'quast assembly/assembly.fasta -o quast_results/',
				explanation: 'QUAST calculates N50, total length, and other metrics.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '-o quast_results/', desc: 'Output directory' }
				]
			},
			{
				type: 'task',
				title: 'Step 7: Genome Completeness',
				text: `Check genome completeness using marker genes.`,
				command: 'checkm lineage_wf assembly/ checkm_results/ -x fasta',
				explanation: 'CheckM estimates completeness and contamination.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: 'lineage_wf', desc: 'Full CheckM workflow' },
					{ name: '-x fasta', desc: 'File extension' }
				]
			},
			{
				type: 'task',
				title: 'Step 8: BUSCO Assessment',
				text: `Validate completeness with universal single-copy orthologs.`,
				command: 'busco -i assembly/assembly.fasta -o busco_results/ -m genome -l bacteria_odb10',
				explanation: 'BUSCO checks for conserved genes expected in all bacteria.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '-m genome', desc: 'Genome mode' },
					{ name: '-l bacteria_odb10', desc: 'Bacteria database' }
				]
			},
			{
				type: 'task',
				title: 'Step 9: AMR Screening',
				text: `Screen for antimicrobial resistance genes.`,
				command: 'abricate --db ncbi assembly/assembly.fasta -o abricate_results/',
				explanation: 'ABRicate identifies resistance genes from databases.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '--db ncbi', desc: 'Use NCBI database' },
					{ name: '-o abricate_results/', desc: 'Output directory' }
				]
			},
			{
				type: 'task',
				title: 'Step 10: MLST Typing',
				text: `Determine the sequence type.`,
				command: 'mlst assembly/assembly.fasta -o mlst_results/',
				explanation: 'MLST assigns sequence types for epidemiological tracking.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '-o mlst_results/', desc: 'Output directory' }
				]
			},
			// Phase 3: Annotation
			{
				type: 'phase',
				title: 'Phase 3: Annotation & Plasmid Analysis',
				text: 'Annotate genes and identify mobile genetic elements.',
				phase: 3
			},
			{
				type: 'task',
				title: 'Step 11: Genome Annotation',
				text: `Annotate genes in the assembly.`,
				command: 'prokka --outdir prokka_results/ --prefix sample_01 assembly/assembly.fasta',
				explanation: 'Prokka identifies CDS, tRNA, and rRNA features.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '--outdir prokka_results/', desc: 'Output directory' },
					{ name: '--prefix sample_01', desc: 'Output file prefix' }
				]
			},
			{
				type: 'task',
				title: 'Step 12: Detailed Annotation',
				text: `Get comprehensive annotations with Bakta.`,
				command: 'bakta assembly/assembly.fasta --output bakta_results/',
				explanation: 'Bakta provides rich functional annotations.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '--output bakta_results/', desc: 'Output directory' }
				]
			},
			{
				type: 'task',
				title: 'Step 13: Virulence Factor Screening',
				text: `Screen for Vibrio virulence factors.`,
				command: 'virulencefinder -i assembly/assembly.fasta -o virulencefinder_results/',
				explanation: 'VirulenceFinder identifies toxins and virulence genes.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '-i', desc: 'Input assembly' },
					{ name: '-o virulencefinder_results/', desc: 'Output directory' }
				]
			},
			// Phase 4
			{
				type: 'phase',
				title: 'Phase 4: Phylogenetics',
				text: 'Build evolutionary trees and analyze population structure.',
				phase: 4
			},
			{
				type: 'task',
				title: 'Step 14: Variant Calling',
				text: `Call SNPs against the reference genome.`,
				command: 'snippy --ref reference.gbk --ctgs assembly/assembly.fasta --outdir snippy_results/',
				explanation: 'Snippy identifies SNPs, insertions, and deletions.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '--ref reference.gbk', desc: 'Reference genome' },
					{ name: '--ctgs assembly/assembly.fasta', desc: 'Query contigs' },
					{ name: '--outdir snippy_results/', desc: 'Output directory' }
				]
			},
			{
				type: 'task',
				title: 'Step 15: Pan-genome Analysis',
				text: `Analyze the pan-genome across isolates.`,
				command: 'roary -f roary_results/ -e -n -v prokka_results/*.gff',
				explanation: 'Roary identifies core and accessory genes.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '-f roary_results/', desc: 'Output directory' },
					{ name: '-e', desc: 'Create core gene alignment' },
					{ name: '-n', desc: 'Fast alignment with MAFFT' },
					{ name: '-v', desc: 'Verbose output' }
				]
			},
			{
				type: 'task',
				title: 'Step 16: Phylogenetic Tree',
				text: `Build a maximum-likelihood phylogenetic tree.`,
				command: 'iqtree -s roary_results/core_gene_alignment.aln -m GTR+G -bb 1000 -nt AUTO',
				explanation: 'IQ-TREE builds phylogenetic trees with bootstrap support.',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '-s roary_results/core_gene_alignment.aln', desc: 'Input alignment' },
					{ name: '-m GTR+G', desc: 'Substitution model' },
					{ name: '-bb 1000', desc: 'Bootstrap replicates' },
					{ name: '-nt AUTO', desc: 'Auto-detect threads' }
				]
			},
			...createPhase5Placeholder(),
			{
				type: 'complete',
				title: 'Analysis Complete (Preliminary)',
				text: `You have completed the Fish Mortality Investigation with a fragmented assembly.\n\n**Assembly Result:** Incomplete - 15 contigs (fragmented due to repetitive regions)\n\n**Key findings:**\n• Identified Vibrio vulnificus (biotype 2)\n• Detected virulence genes: rtxA (cytotoxin), vvhA (hemolysin), vcgC (virulence correlated gene)\n• MLST: ST117 (associated with clinical infections)\n• Temperature-sensitive virulence regulation likely triggered by elevated water temps\n\n**Recommendations:**\n• For complete genome: Perform hybrid assembly with PacBio long reads\n• Implement water temperature monitoring (<25°C)\n• Consider prophylactic measures during warm months\n\n⚠️ Note: Plasmid analysis was limited due to fragmented assembly. Complete genome would provide more definitive results.`
			}
		]
	},
	foodborne: {
		id: 'foodborne',
		title: 'Food Poisoning Outbreak',
		subtitle: 'Restaurant-Associated Illness',
		organism: 'Salmonella enterica',
		technology: 'illumina',
		toolsUsed: ['seqkit', 'fastqc', 'trimmomatic', 'unicycler', 'bandage', 'quast', 'checkm', 'busco', 'abricate', 'mlst', 'prokka', 'bakta', 'mob_recon', 'plasmidfinder', 'platon', 'snippy', 'roary', 'iqtree', 'gubbins', 'resfinder', 'virulencefinder', 'integron_finder'],
		sections: [
			{
				type: 'intro',
				text: `URGENT - Public Health Alert:\n\n23 people have reported gastroenteritis symptoms after eating at the same restaurant. 4 patients have been hospitalized. Health inspectors have collected samples from patients and the restaurant kitchen.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'context',
				text: `Stool samples from 8 patients and environmental swabs from the restaurant have been cultured and sequenced. Preliminary culture identified Salmonella. Your task: Confirm the outbreak, link patient isolates to a food source, and assess antibiotic resistance.`,
				hint: null,
				requiredDir: null
			},
			...createIlluminaPhase1Sections(),
			...createIlluminaPhase2Sections(),
			...createIlluminaPhase3Sections(),
			...createIlluminaPhase4Sections(),
			...createFoodborneAdditionalTools(),
			...createPhase5Placeholder(),
			{
				type: 'complete',
				title: 'Analysis Complete',
				text: `Congratulations! You have completed the Food Poisoning Investigation.\n\n**Assembly Result:** Complete genome - 1 circular chromosome (4.8 Mb), no plasmids detected\n\n**Key findings:**\n• Confirmed Salmonella enterica serovar Enteritidis (ST11)\n• All 8 patient isolates clonal (<3 SNP differences) - confirmed linked outbreak\n• Source traced to contaminated eggs from the restaurant kitchen\n• Detected Salmonella Genomic Island 1 (SGI-1) with multidrug resistance\n• ASSuT resistance pattern: Ampicillin, Streptomycin, Sulfonamides, Tetracycline\n• No plasmid-mediated resistance - all AMR genes chromosomally encoded\n\n**Public Health Actions:**\n• Restaurant temporarily closed for sanitation\n• Egg supplier traced and notified\n• Patient antibiotic therapy adjusted based on resistance profile`
			}
		]
	}
};

export function getStoryline(id: string): Storyline | undefined {
	return storylines[id];
}

export function getStorylinesList(): { id: string; title: string; subtitle: string; technology: string }[] {
	return Object.values(storylines).map(s => ({
		id: s.id,
		title: s.title,
		subtitle: s.subtitle,
		technology: s.technology
	}));
}
