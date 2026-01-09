export interface StorylineSection {
	type: 'intro' | 'context' | 'task' | 'phase' | 'complete';
	title?: string;
	text: string;
	command?: string;
	explanation?: string;
	requiredDir?: string | null;
	parameters?: { name: string; desc: string }[];
	hint?: string | null;
	phase?: number;
}

export interface Storyline {
	id: string;
	title: string;
	subtitle: string;
	organism: string;
	sections: StorylineSection[];
	toolsUsed: string[];
}

// Helper to create standard phase sections
function createPhase1Sections(): StorylineSection[] {
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
				{ name: 'SLIDINGWINDOW:4:15', desc: 'Cut when 4bp window quality < 15' }
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

function createPhase2Sections(): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 2: Quality Assessment & Analysis',
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
			title: 'Step 8: AMR Screening',
			text: `Screen for antimicrobial resistance genes.`,
			command: 'abricate --db ncbi assembly/assembly.fasta -o abricate_results/',
			explanation: 'ABRicate identifies resistance genes from databases.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--db ncbi', desc: 'Use NCBI database' }
			]
		},
		{
			type: 'task',
			title: 'Step 9: MLST Typing',
			text: `Determine the sequence type.`,
			command: 'mlst assembly/assembly.fasta -o mlst_results/',
			explanation: 'MLST assigns sequence types for epidemiological tracking.',
			requiredDir: '/data/outbreak_investigation',
			parameters: []
		}
	];
}

function createPhase3Sections(): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 3: Annotation & Plasmid Analysis',
			text: 'Annotate genes and identify mobile genetic elements.',
			phase: 3
		},
		{
			type: 'task',
			title: 'Step 10: Genome Annotation',
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
			title: 'Step 11: Detailed Annotation',
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
			title: 'Step 12: Plasmid Detection',
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
			title: 'Step 13: Confirm Plasmids',
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

function createPhase4Sections(): StorylineSection[] {
	return [
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
				{ name: '--ctgs', desc: 'Query contigs' }
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
				{ name: '-e', desc: 'Create core gene alignment' },
				{ name: '-n', desc: 'Fast alignment with MAFFT' }
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
				{ name: '-m GTR+G', desc: 'Substitution model' },
				{ name: '-bb 1000', desc: 'Bootstrap replicates' }
			]
		},
		{
			type: 'task',
			title: 'Step 17: Recombination Analysis',
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

export const storylines: Record<string, Storyline> = {
	hospital: {
		id: 'hospital',
		title: 'Hospital Outbreak Investigation',
		subtitle: 'Antimicrobial Resistance in ICU',
		organism: 'Klebsiella pneumoniae',
		toolsUsed: ['seqkit', 'fastqc', 'trimmomatic', 'unicycler', 'bandage', 'quast', 'checkm', 'abricate', 'mlst', 'prokka', 'bakta', 'mob_recon', 'platon', 'snippy', 'roary', 'iqtree', 'gubbins'],
		sections: [
			{
				type: 'intro',
				text: `URGENT - UM Medical Centre Saturday Report:\n\n5 patients in the ICU did not respond to last-line antibiotics. All patients developed severe infections within the past 72 hours. Infection control suspects a nosocomial outbreak.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'context',
				text: `Samples from all 5 patients have been sequenced using Illumina NovaSeq. Initial culture identified Klebsiella pneumoniae from all samples. Your task: Determine if this is a clonal outbreak, identify the resistance mechanisms, and trace the source.`,
				hint: null,
				requiredDir: null
			},
			...createPhase1Sections(),
			...createPhase2Sections(),
			...createPhase3Sections(),
			...createPhase4Sections(),
			...createPhase5Placeholder(),
			{
				type: 'complete',
				title: 'Analysis Complete',
				text: `Congratulations! You have completed the Hospital Outbreak Investigation.\n\nKey findings:\n- Identified clonal outbreak (ST258 K. pneumoniae)\n- Detected carbapenemase genes (blaKPC-2, blaNDM-1)\n- Located resistance genes on conjugative plasmid\n- Phylogenetic analysis confirmed recent transmission`
			}
		]
	},
	plant: {
		id: 'plant',
		title: 'Plant Pathogen Investigation',
		subtitle: 'Citrus Canker Outbreak',
		organism: 'Xanthomonas citri',
		toolsUsed: ['seqkit', 'fastqc', 'trimmomatic', 'unicycler', 'bandage', 'quast', 'checkm', 'abricate', 'mlst', 'prokka', 'bakta', 'mob_recon', 'platon', 'snippy', 'roary', 'iqtree', 'gubbins'],
		sections: [
			{
				type: 'intro',
				text: `ALERT - Department of Agriculture:\n\nMultiple citrus orchards in the region are showing symptoms of citrus canker. Lesions on leaves, stems, and fruit are spreading rapidly. Quarantine measures have been implemented.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'context',
				text: `Isolates from 6 affected orchards have been collected and sequenced. The suspected pathogen is Xanthomonas citri pv. citri. Your task: Confirm the pathogen identity, determine if it's a single introduction or multiple events, and identify potential virulence factors.`,
				hint: null,
				requiredDir: null
			},
			...createPhase1Sections(),
			...createPhase2Sections(),
			...createPhase3Sections(),
			...createPhase4Sections(),
			...createPhase5Placeholder(),
			{
				type: 'complete',
				title: 'Analysis Complete',
				text: `Congratulations! You have completed the Plant Pathogen Investigation.\n\nKey findings:\n- Confirmed Xanthomonas citri pv. citri\n- Single introduction event (clonal population)\n- Identified Type III secretion system effectors\n- Source traced to imported plant material`
			}
		]
	},
	fish: {
		id: 'fish',
		title: 'Fish Mortality Event',
		subtitle: 'Suspected Vibrio Outbreak',
		organism: 'Vibrio vulnificus',
		toolsUsed: ['seqkit', 'fastqc', 'trimmomatic', 'unicycler', 'bandage', 'quast', 'checkm', 'abricate', 'mlst', 'prokka', 'bakta', 'mob_recon', 'platon', 'snippy', 'roary', 'iqtree', 'gubbins'],
		sections: [
			{
				type: 'intro',
				text: `EMERGENCY - Fisheries Department Report:\n\nMass fish mortality event in coastal aquaculture facilities. Over 50,000 fish have died in the past week. Preliminary tests suggest bacterial infection. Water temperatures have been unusually high.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'context',
				text: `Samples from dead fish and water have been collected from 4 affected facilities. Initial Gram staining shows curved Gram-negative rods, suggesting Vibrio species. Your task: Identify the causative agent, assess virulence potential, and determine if environmental conditions contributed to the outbreak.`,
				hint: null,
				requiredDir: null
			},
			...createPhase1Sections(),
			...createPhase2Sections(),
			...createPhase3Sections(),
			...createPhase4Sections(),
			...createPhase5Placeholder(),
			{
				type: 'complete',
				title: 'Analysis Complete',
				text: `Congratulations! You have completed the Fish Mortality Investigation.\n\nKey findings:\n- Identified Vibrio vulnificus (biotype 2)\n- Detected virulence genes (rtxA, vvhA, vcgC)\n- Temperature-sensitive virulence regulation\n- Recommended water temperature monitoring`
			}
		]
	},
	foodborne: {
		id: 'foodborne',
		title: 'Food Poisoning Outbreak',
		subtitle: 'Restaurant-Associated Illness',
		organism: 'Salmonella enterica',
		toolsUsed: ['seqkit', 'fastqc', 'trimmomatic', 'unicycler', 'bandage', 'quast', 'checkm', 'abricate', 'mlst', 'prokka', 'bakta', 'mob_recon', 'platon', 'snippy', 'roary', 'iqtree', 'gubbins'],
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
			...createPhase1Sections(),
			...createPhase2Sections(),
			...createPhase3Sections(),
			...createPhase4Sections(),
			...createPhase5Placeholder(),
			{
				type: 'complete',
				title: 'Analysis Complete',
				text: `Congratulations! You have completed the Food Poisoning Investigation.\n\nKey findings:\n- Confirmed Salmonella enterica serovar Enteritidis\n- All patient isolates clonal (linked outbreak)\n- Source traced to contaminated eggs\n- Detected multidrug resistance (ASSuT pattern)`
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
