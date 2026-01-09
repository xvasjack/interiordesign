<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { outputData, terminalState, toolExecutionTimes, allowedCommands, blockedCommands, bioTools, executedCommands, executedSteps, currentDirectory, stopSignal } from '$lib/stores/terminal';
	import { get } from 'svelte/store';

	let terminalContainer: HTMLDivElement;
	let terminal: any;
	let fitAddon: any;
	let resizeObserver: ResizeObserver;
	let commandBuffer = '';
	let stopUnsubscribe: () => void;
	let cursorPosition = 0;  // Track cursor position for left/right arrow
	let isExecuting = false;
	let currentDir = '/data/outbreak_investigation';

	// Command history for arrow up/down
	let commandHistoryList: string[] = [];
	let historyIndex = -1;
	let savedCurrentBuffer = '';

	// Allowed commands for dropdown display
	const allowedCommandsList = [
		'ls', 'cd', 'pwd', 'cat', 'head', 'tail', 'clear', 'help'
	];

	// Track which tools have been run for dynamic filesystem
	let executedToolsList: string[] = [];
	executedCommands.subscribe(cmds => executedToolsList = cmds);

	// Base filesystem - sequencing data files exist at start (from sequencer)
	const baseFilesystem: Record<string, string[]> = {
		'/data/outbreak_investigation': [
			'sample_01_R1.fastq.gz', 'sample_01_R2.fastq.gz',
			'sample_02_R1.fastq.gz', 'sample_02_R2.fastq.gz',
			'sample_03_R1.fastq.gz', 'sample_03_R2.fastq.gz'
		]
	};

	// Files created by each tool
	const toolCreatedFiles: Record<string, Record<string, string[]>> = {
		'fastqc': {
			'/data/outbreak_investigation': ['qc_reports/'],
			'/data/outbreak_investigation/qc_reports': [
				'sample_01_R1_fastqc.html', 'sample_01_R1_fastqc.zip',
				'sample_01_R2_fastqc.html', 'sample_01_R2_fastqc.zip'
			]
		},
		'trimmomatic': {
			'/data/outbreak_investigation': ['trimmed/'],
			'/data/outbreak_investigation/trimmed': [
				'sample_01_R1_paired.fq.gz', 'sample_01_R2_paired.fq.gz',
				'sample_01_R1_unpaired.fq.gz', 'sample_01_R2_unpaired.fq.gz'
			]
		},
		'unicycler': {
			'/data/outbreak_investigation': ['assembly/'],
			'/data/outbreak_investigation/assembly': [
				'assembly.fasta', 'assembly.gfa', 'unicycler.log'
			]
		},
		'bandage': {
			'/data/outbreak_investigation/assembly': [
				'assembly_graph.png'
			]
		},
		'prokka': {
			'/data/outbreak_investigation': ['annotation/'],
			'/data/outbreak_investigation/annotation': [
				'sample_01.gff', 'sample_01.gbk', 'sample_01.fna',
				'sample_01.faa', 'sample_01.ffn', 'sample_01.txt'
			]
		},
		'abricate': {
			'/data/outbreak_investigation': ['results/'],
			'/data/outbreak_investigation/results': [
				'amr_report.tsv', 'amr_summary.txt'
			]
		},
		'quast': {
			'/data/outbreak_investigation/assembly': [
				'quast_report.html', 'quast_report.tsv'
			]
		},
		'checkm': {
			'/data/outbreak_investigation': ['checkm_results/'],
			'/data/outbreak_investigation/checkm_results': [
				'checkm_report.tsv', 'lineage.ms', 'storage/'
			]
		},
		'confindr': {
			'/data/outbreak_investigation': ['confindr_results/'],
			'/data/outbreak_investigation/confindr_results': [
				'confindr_report.csv', 'confindr_log.txt'
			]
		},
		'bakta': {
			'/data/outbreak_investigation': ['bakta_results/'],
			'/data/outbreak_investigation/bakta_results': [
				'sample_01.gff3', 'sample_01.gbff', 'sample_01.fna',
				'sample_01.faa', 'sample_01.tsv', 'sample_01.json'
			]
		},
		'mlst': {
			'/data/outbreak_investigation': ['mlst_results/'],
			'/data/outbreak_investigation/mlst_results': [
				'mlst_report.tsv'
			]
		},
		// Phase 3: Plasmid Analysis
		'mob_recon': {
			'/data/outbreak_investigation': ['mob_recon_results/'],
			'/data/outbreak_investigation/mob_recon_results': [
				'plasmid_report.tsv', 'chromosome.fasta', 'plasmid_AA001.fasta',
				'mobtyper_results.txt', 'contig_report.txt'
			]
		},
		'platon': {
			'/data/outbreak_investigation': ['platon_results/'],
			'/data/outbreak_investigation/platon_results': [
				'plasmid_predictions.tsv', 'plasmid_sequences.fasta',
				'chromosome_sequences.fasta', 'platon.log'
			]
		},
		// Phase 4: Phylogenetics
		'snippy': {
			'/data/outbreak_investigation': ['snippy_results/'],
			'/data/outbreak_investigation/snippy_results': [
				'snps.vcf', 'snps.tab', 'snps.aligned.fa',
				'snps.consensus.fa', 'snps.log'
			]
		},
		'roary': {
			'/data/outbreak_investigation': ['roary_results/'],
			'/data/outbreak_investigation/roary_results': [
				'gene_presence_absence.csv', 'core_gene_alignment.aln',
				'pan_genome_reference.fa', 'summary_statistics.txt'
			]
		},
		'iqtree': {
			'/data/outbreak_investigation': ['iqtree_results/'],
			'/data/outbreak_investigation/iqtree_results': [
				'core_alignment.treefile', 'core_alignment.iqtree',
				'core_alignment.log', 'core_alignment.contree'
			]
		},
		'gubbins': {
			'/data/outbreak_investigation': ['gubbins_results/'],
			'/data/outbreak_investigation/gubbins_results': [
				'recombination_predictions.gff', 'clean.core.aln',
				'clean.final_tree.tre', 'clean.summary.txt'
			]
		}
	};

	// Get dynamic filesystem based on executed commands
	function getFilesystem(): Record<string, string[]> {
		const fs: Record<string, string[]> = {};

		// Start with base filesystem
		for (const [path, files] of Object.entries(baseFilesystem)) {
			fs[path] = [...files];
		}

		// Add files from executed tools
		for (const tool of executedToolsList) {
			const created = toolCreatedFiles[tool];
			if (created) {
				for (const [path, files] of Object.entries(created)) {
					if (!fs[path]) fs[path] = [];
					for (const file of files) {
						if (!fs[path].includes(file)) {
							fs[path].push(file);
						}
					}
				}
			}
		}

		return fs;
	}

	// Generate dynamic tool output based on input file
	function getToolOutput(tool: string, args: string[], fullCmd: string): any {
		// Extract input file from command
		const inputFile = args.find(a => a.endsWith('.fastq.gz') || a.endsWith('.fq.gz')) || 'sample_01_R1.fastq.gz';
		const isR2 = inputFile.includes('R2');
		const sampleMatch = inputFile.match(/sample_(\d+)/);
		const sampleNum = sampleMatch ? sampleMatch[1] : '01';
		const sampleName = `sample_${sampleNum}`;

		// Different stats for different samples/reads
		const baseReads = 2456789;
		const sampleVariation = parseInt(sampleNum) * 12345;
		const totalReads = baseReads + (sampleVariation % 50000);
		const gcContent = isR2 ? 51.8 : 52.3;
		const adapterPercent = isR2 ? 2.8 : 3.2;

		const outputs: Record<string, any> = {
			'seqkit': {
				output: `\x1b[32m[INFO]\x1b[0m Processing ${inputFile}...
file                      format  type   num_seqs      sum_len  min_len  avg_len  max_len
${inputFile.padEnd(25)} FASTQ   DNA    ${totalReads.toLocaleString()}  ${(totalReads * 150).toLocaleString()}      150      150      150

\x1b[32m[INFO]\x1b[0m Summary Statistics:
  Total reads:     ${totalReads.toLocaleString()}
  Total bases:     ${(totalReads * 150).toLocaleString()}
  GC content:      ${gcContent}%
  Q20 bases:       97.2%
  Q30 bases:       93.8%
`,
				summary: {
					'File': inputFile,
					'Total Reads': totalReads.toLocaleString(),
					'Total Bases': `${(totalReads * 150 / 1000000).toFixed(1)} Mb`,
					'Read Length': '150 bp',
					'GC Content': `${gcContent}%`,
					'Q20 Bases': '97.2%',
					'Q30 Bases': '93.8%'
				},
				files: [{ name: 'seqkit_stats.txt', type: 'txt', size: '1.2 KB' }]
			},
			'fastqc': {
				output: `Started analysis of ${inputFile}
Approx 5% complete for ${inputFile}
Approx 15% complete for ${inputFile}
Approx 30% complete for ${inputFile}
Approx 50% complete for ${inputFile}
Approx 70% complete for ${inputFile}
Approx 85% complete for ${inputFile}
Approx 95% complete for ${inputFile}
Analysis complete for ${inputFile}
`,
				summary: {
					'File': inputFile,
					'Total Sequences': totalReads.toLocaleString(),
					'Sequence Length': '150 bp',
					'GC Content': `${gcContent}%`,
					'Per Base Quality': 'PASS',
					'Adapter Content': `WARNING (${adapterPercent}%)`,
					'Overall Quality': 'PASS'
				},
				chartData: {
					title: `Per Base Sequence Quality - ${inputFile}`,
					positions: Array.from({ length: 150 }, (_, i) => i + 1),
					scores: Array.from({ length: 150 }, (_, i) => {
						const base = isR2 ? 31 : 32;
						const seed = (i * 7 + parseInt(sampleNum) * 13) % 100;
						return base + (seed / 100) * 6 - (i > 130 ? (i - 130) * 0.3 : 0);
					}),
					xLabel: 'Position in read (bp)',
					yLabel: 'Quality Score (Phred)'
				},
				files: [
					{ name: `${sampleName}_${isR2 ? 'R2' : 'R1'}_fastqc.html`, type: 'html', size: '245 KB' },
					{ name: `${sampleName}_${isR2 ? 'R2' : 'R1'}_fastqc.zip`, type: 'zip', size: '1.2 MB' }
				]
			},
			'trimmomatic': {
				// Fixed math: 2,456,789 = 2,394,012 + 34,567 + 19,876 + 8,334 = 2,456,789 ✓
				output: `TrimmomaticPE: Started with arguments:
 -phred33 ${sampleName}_R1.fastq.gz ${sampleName}_R2.fastq.gz ...
Using PrefixPair: 'TACACTCTTTCCCTACACGACGCTCTTCCGATCT' and 'GTGACTGGAGTTCAGACGTGTGCTCTTCCGATCT'
ILLUMINACLIP: Using 1 prefix pairs, 2 forward/reverse sequences
Quality encoding detected as phred33
Input Read Pairs: 2,456,789
  Both Surviving: 2,394,012 (97.44%)
  Forward Only Surviving: 34,567 (1.41%)
  Reverse Only Surviving: 19,876 (0.81%)
  Dropped: 8,334 (0.34%)
TrimmomaticPE: Completed successfully
`,
				summary: {
					'Input Reads': '2,456,789 pairs',
					'Both Surviving': '2,394,012 (97.44%)',
					'Forward Only': '34,567 (1.41%)',
					'Reverse Only': '19,876 (0.81%)',
					'Dropped': '8,334 (0.34%)'
				},
				chartData: {
					title: 'Trimmomatic Read Retention',
					x: ['Both Surviving', 'Forward Only', 'Reverse Only', 'Dropped'],
					y: [2394012, 34567, 19876, 8334],
					type: 'bar',
					xLabel: 'Read Category',
					yLabel: 'Number of Reads'
				},
				files: [
					{ name: `${sampleName}_R1_paired.fq.gz`, type: 'fastq', size: '342 MB' },
					{ name: `${sampleName}_R2_paired.fq.gz`, type: 'fastq', size: '341 MB' },
					{ name: `${sampleName}_R1_unpaired.fq.gz`, type: 'fastq', size: '4.8 MB' },
					{ name: `${sampleName}_R2_unpaired.fq.gz`, type: 'fastq', size: '2.7 MB' }
				]
			},
			'unicycler': {
				output: `
\x1b[1;32m _    _       _                  _
| |  | |     (_)                | |
| |  | |_ __  _  ___ _   _  ____| | ___ _ __
| |  | | '_ \\| |/ __| | | |/ __| |/ _ \\ '__|
| |__| | | | | | (__| |_| | (__| |  __/ |
 \\____/|_| |_|_|\\___|\\__, |\\___|_|\\___|_|
                      __/ |
                     |___/\x1b[0m

Starting Unicycler v0.5.0

\x1b[36mChecking dependencies...\x1b[0m
  SPAdes: 3.15.5 ✓
  Racon: 1.5.0 ✓
  Bowtie2: 2.4.5 ✓
  Samtools: 1.17 ✓

\x1b[36mLoading reads...\x1b[0m
  Forward reads: 2,394,012
  Reverse reads: 2,394,012

\x1b[36mPerforming SPAdes assembly...\x1b[0m
  k=27: 1,234 contigs
  k=47: 856 contigs
  k=63: 423 contigs
  k=77: 245 contigs
  k=89: 128 contigs
  k=99: 67 contigs

\x1b[36mBuilding assembly graph...\x1b[0m
  Nodes: 847
  Edges: 1,203

\x1b[36mRotating circular sequences...\x1b[0m
  \x1b[32mChromosome: circularized (4,892,156 bp)\x1b[0m
  \x1b[32mPlasmid 1: circularized (95,234 bp)\x1b[0m

\x1b[36mPolishing assembly...\x1b[0m
  Round 1: 23 corrections
  Round 2: 3 corrections
  Round 3: 0 corrections

\x1b[1;32mAssembly complete!\x1b[0m

Final assembly:
  Contigs: 2
  Total length: 4,987,390 bp
  Largest contig: 4,892,156 bp
  N50: 4,892,156 bp
  GC content: 52.3%

\x1b[33mTip: Use 'bandage image assembly.gfa assembly_graph.png' to visualize the assembly graph\x1b[0m
`,
				summary: {
					'Total Contigs': '2',
					'Total Length': '4,987,390 bp',
					'Largest Contig': '4,892,156 bp',
					'N50': '4,892,156 bp',
					'GC Content': '52.3%',
					'Circular': '2 (chromosome + plasmid)'
				},
				chartData: {
					title: 'Contig Length Distribution',
					x: ['Chromosome', 'Plasmid_1'],
					y: [4892156, 95234],
					type: 'bar',
					xLabel: 'Contig',
					yLabel: 'Length (bp)'
				},
				files: [
					{ name: 'assembly.fasta', type: 'fasta', size: '4.8 MB' },
					{ name: 'assembly.gfa', type: 'gfa', size: '12 MB' },
					{ name: 'unicycler.log', type: 'log', size: '156 KB' }
				]
			},
			'bandage': {
				output: `\x1b[36mBandage v0.8.1\x1b[0m
Loading assembly graph: assembly.gfa
  Nodes loaded: 847
  Edges loaded: 1,203

\x1b[36mGenerating visualization...\x1b[0m
  Layout algorithm: Force-directed
  Node coloring: By depth

\x1b[32m✓ Graph visualization saved\x1b[0m
  Output: assembly_graph.png (2048x2048 px)

\x1b[33mGraph Statistics:\x1b[0m
  Connected components: 2
  Largest component: Chromosome (4.89 Mb)
  Circular contigs: 2
  Dead ends: 0
`,
				summary: {
					'Nodes': '847',
					'Edges': '1,203',
					'Components': '2',
					'Circular Contigs': '2',
					'Dead Ends': '0',
					'Layout': 'Force-directed',
					'Quality': 'Excellent (complete circular genome)'
				},
				chartData: {
					title: 'Assembly Graph Visualization',
					type: 'assemblyGraph',
					components: [
						{ name: 'Chromosome', size: 4892156, circular: true, color: '#3b82f6' },
						{ name: 'Plasmid 1', size: 95234, circular: true, color: '#10b981' }
					],
					graphStats: {
						totalNodes: 847,
						totalEdges: 1203,
						circular: 2,
						deadEnds: 0,
						quality: 'excellent'
					}
				},
				files: [
					{ name: 'assembly_graph.png', type: 'png', size: '1.8 MB' }
				]
			},
			'quast': {
				output: `\x1b[36mQUAST v5.2.0\x1b[0m
[2024-01-15 11:00:00] INFO: Starting QUAST analysis

\x1b[36mAnalyzing assembly: assembly/assembly.fasta\x1b[0m
  Contigs: 2
  Total length: 4,987,390 bp

\x1b[36mCalculating assembly metrics...\x1b[0m
  N50: 4,892,156 bp
  L50: 1
  GC content: 52.3%
  Largest contig: 4,892,156 bp

\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m
\x1b[1;32m  ASSEMBLY QUALITY REPORT\x1b[0m
\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m

  Assembly:           assembly
  # contigs:          2
  Largest contig:     4,892,156 bp
  Total length:       4,987,390 bp
  GC (%):             52.3
  N50:                4,892,156 bp
  L50:                1

\x1b[32m✓ Assembly quality: EXCELLENT\x1b[0m
\x1b[33mNote: N50 close to expected genome size indicates high contiguity\x1b[0m
`,
				summary: {
					'Contigs': '2',
					'Total Length': '4,987,390 bp',
					'Largest Contig': '4,892,156 bp',
					'N50': '4,892,156 bp',
					'L50': '1',
					'GC Content': '52.3%',
					'Quality': 'EXCELLENT'
				},
				chartData: {
					title: 'Assembly Quality Metrics',
					x: ['Total Length', 'Largest Contig', 'N50'],
					y: [4987390, 4892156, 4892156],
					type: 'bar',
					xLabel: 'Metric',
					yLabel: 'Length (bp)'
				},
				files: [
					{ name: 'quast_report.html', type: 'html', size: '156 KB' },
					{ name: 'quast_report.tsv', type: 'tsv', size: '2.3 KB' }
				]
			},
			'prokka': {
				output: `\x1b[36mProkka v1.14.6\x1b[0m
[2024-01-15 11:15:00] INFO: Starting annotation

\x1b[36mInput:\x1b[0m
  Assembly: assembly/assembly.fasta
  Contigs: 2
  Total length: 4,987,390 bp

\x1b[36mRunning annotation pipeline...\x1b[0m
  tRNA detection (Aragorn): 86 tRNAs found
  rRNA detection (Barrnap): 22 rRNAs found
  CDS prediction (Prodigal): 4,523 CDSs predicted

\x1b[36mFunctional annotation...\x1b[0m
  Running BLASTP against UniProt...
  Assigning protein functions...
  Identifying signal peptides...

\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m
\x1b[1;32m  ANNOTATION SUMMARY\x1b[0m
\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m

  Organism:         Escherichia coli sample_01
  Features:
    - CDS: 4,523
    - tRNA: 86
    - rRNA: 22
    - tmRNA: 1
    - misc_RNA: 12

  Hypothetical proteins: 487 (10.8%)
  Proteins with function: 4,036 (89.2%)

\x1b[33mOutput files written to: annotation/\x1b[0m
`,
				summary: {
					'Total Features': '4,644',
					'CDS': '4,523',
					'tRNA': '86',
					'rRNA': '22',
					'tmRNA': '1',
					'misc_RNA': '12',
					'Functional Annotation': '89.2%',
					'Hypothetical': '10.8%'
				},
				chartData: {
					title: 'Genome Annotation Summary',
					x: ['CDS', 'tRNA', 'rRNA', 'Other'],
					y: [4523, 86, 22, 13],
					type: 'bar',
					xLabel: 'Feature Type',
					yLabel: 'Count'
				},
				files: [
					{ name: 'sample_01.gff', type: 'gff', size: '2.5 MB' },
					{ name: 'sample_01.gbk', type: 'gbk', size: '7.8 MB' },
					{ name: 'sample_01.txt', type: 'txt', size: '1.2 KB' }
				]
			},
			'abricate': {
				output: `\x1b[36mABRicate v1.0.1\x1b[0m
[2024-01-15 11:25:00] INFO: Starting AMR gene screening

\x1b[36mUsing database: NCBI AMRFinderPlus\x1b[0m
  Sequences: 5,386 resistance genes
  Last updated: 2024-01-10

\x1b[36mScanning assembly...\x1b[0m
  Input: assembly/assembly.fasta
  Contigs: 2

\x1b[36mResults:\x1b[0m
  Genes found: 2 AMR genes

\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m
\x1b[1;32m  ANTIMICROBIAL RESISTANCE GENES DETECTED\x1b[0m
\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m

  \x1b[31m1. blaCTX-M-15\x1b[0m
     Location: chromosome, 123456-124789
     Identity: 99.89%
     Resistance: Cephalosporins (ESBL)

  \x1b[31m2. tet(A)\x1b[0m
     Location: plasmid_1, 12345-13567
     Identity: 100.00%
     Resistance: Tetracycline

\x1b[33m⚠ WARNING: ESBL-producing organism detected\x1b[0m
\x1b[33mRecommendation: Confirm with phenotypic testing\x1b[0m
`,
				summary: {
					'AMR Genes Found': '2',
					'Database': 'NCBI AMRFinderPlus',
					'Gene 1': 'blaCTX-M-15 (99.89%)',
					'Gene 2': 'tet(A) (100.00%)',
					'Resistance': 'Cephalosporins, Tetracycline',
					'Clinical Alert': 'ESBL detected'
				},
				chartData: {
					title: 'AMR Gene Distribution',
					x: ['blaCTX-M-15', 'tet(A)'],
					y: [99.89, 100.00],
					type: 'bar',
					xLabel: 'Gene',
					yLabel: 'Identity (%)'
				},
				files: [
					{ name: 'amr_report.tsv', type: 'tsv', size: '1.8 KB' },
					{ name: 'amr_summary.txt', type: 'txt', size: '856 B' }
				]
			},
			'checkm': {
				output: `\x1b[36mCheckM v1.2.2\x1b[0m
[2024-01-15 11:30:00] INFO: Running CheckM lineage workflow

\x1b[36mPlacing bins in reference genome tree...\x1b[0m
  Identifying marker genes: Done
  Aligning marker genes: Done
  Placing bins in tree: Done

\x1b[36mAnalyzing bins...\x1b[0m
  Bin: assembly
  Lineage: Bacteria > Proteobacteria > Gammaproteobacteria > Enterobacterales
  Marker lineage: f__Enterobacteriaceae

\x1b[36mCalculating genome statistics...\x1b[0m
  Genome size: 4,987,390 bp
  # contigs: 2
  N50: 4,892,156 bp
  GC: 52.3%

\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m
\x1b[1;32m  QUALITY ASSESSMENT RESULTS\x1b[0m
\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m

  \x1b[32mCompleteness:    99.45%\x1b[0m  (Near complete)
  \x1b[32mContamination:   0.28%\x1b[0m   (Low contamination)
  \x1b[32mStrain heterog.: 0.00%\x1b[0m

  Quality tier: \x1b[1;32mHIGH-QUALITY DRAFT\x1b[0m
  MIMAG standard: \x1b[32mMeets high-quality criteria\x1b[0m

\x1b[33mTip: Completeness >90% and Contamination <5% indicates a high-quality genome\x1b[0m
`,
				summary: {
					'Completeness': '99.45%',
					'Contamination': '0.28%',
					'Strain Heterogeneity': '0.00%',
					'Lineage': 'f__Enterobacteriaceae',
					'Marker Genes': '104/104 found',
					'Quality': 'HIGH-QUALITY DRAFT',
					'MIMAG Standard': 'High-quality'
				},
				chartData: {
					title: 'Genome Quality Assessment',
					x: ['Completeness', 'Contamination', 'Strain Heterog.'],
					y: [99.45, 0.28, 0],
					type: 'bar',
					xLabel: 'Metric',
					yLabel: 'Percentage (%)'
				},
				files: [
					{ name: 'checkm_report.tsv', type: 'tsv', size: '2.3 KB' }
				]
			},
			'confindr': {
				output: `\x1b[36mConFindr v0.8.0\x1b[0m
[2024-01-15 11:35:00] INFO: Starting contamination detection

\x1b[36mAnalyzing sample: sample_01\x1b[0m
  Database: Enterobacteriaceae rMLST
  Method: rMLST gene analysis

\x1b[36mExtracting rMLST genes...\x1b[0m
  BACT000001: Found (1 copy)
  BACT000002: Found (1 copy)
  BACT000003: Found (1 copy)
  ...
  Total rMLST genes: 53/53

\x1b[36mChecking for multiple alleles...\x1b[0m
  Genes with single allele: 53
  Genes with multiple alleles: 0

\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m
\x1b[1;32m  CONTAMINATION DETECTION RESULTS\x1b[0m
\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m

  Sample: sample_01
  \x1b[32mContamination Status: CLEAN\x1b[0m

  Evidence:
    - No multi-allelic genes detected
    - Single genus detected: Escherichia
    - All rMLST genes present with single copies

  \x1b[32m✓ No intra-species contamination detected\x1b[0m
  \x1b[32m✓ No inter-species contamination detected\x1b[0m

\x1b[33mNote: Sample appears to be a pure isolate suitable for downstream analysis\x1b[0m
`,
				summary: {
					'Sample': 'sample_01',
					'Status': 'CLEAN (No contamination)',
					'Genus Detected': 'Escherichia',
					'rMLST Genes': '53/53 found',
					'Multi-allelic Genes': '0',
					'Intra-species Contam.': 'Not detected',
					'Inter-species Contam.': 'Not detected'
				},
				chartData: {
					title: 'Contamination Analysis',
					x: ['rMLST Genes Found', 'Single-allele Genes', 'Multi-allele Genes'],
					y: [53, 53, 0],
					type: 'bar',
					xLabel: 'Category',
					yLabel: 'Gene Count'
				},
				files: [
					{ name: 'confindr_report.csv', type: 'csv', size: '1.1 KB' },
					{ name: 'confindr_log.txt', type: 'txt', size: '4.5 KB' }
				]
			},
			'bakta': {
				output: `\x1b[36mBakta v1.8.2\x1b[0m
[2024-01-15 11:40:00] INFO: Starting annotation

\x1b[36mInput:\x1b[0m
  Assembly: assembly/assembly.fasta
  Contigs: 2
  Total length: 4,987,390 bp

\x1b[36mRunning annotation pipeline...\x1b[0m
  tRNA detection (tRNAscan-SE): 86 tRNAs found
  tmRNA detection: 1 tmRNA found
  rRNA detection (Infernal): 22 rRNAs found
  ncRNA detection: 89 ncRNAs found
  CRISPR detection: 2 CRISPR arrays found
  CDS prediction (Prodigal): 4,623 CDSs predicted

\x1b[36mFunctional annotation...\x1b[0m
  UniProt matches: 4,102 (88.7%)
  COG assignments: 3,856 (83.4%)
  KEGG orthologs: 2,934 (63.5%)
  Pfam domains: 3,678 (79.6%)

\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m
\x1b[1;32m  ANNOTATION SUMMARY\x1b[0m
\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m

  Features annotated: 4,823
    - CDS: 4,623
    - tRNA: 86
    - rRNA: 22
    - tmRNA: 1
    - ncRNA: 89
    - CRISPR: 2

  Hypothetical proteins: 521 (11.3%)
  Proteins with function: 4,102 (88.7%)

\x1b[33mOutput files written to: bakta_results/\x1b[0m
`,
				summary: {
					'Total Features': '4,823',
					'CDS': '4,623',
					'tRNA': '86',
					'rRNA': '22',
					'ncRNA': '89',
					'CRISPR Arrays': '2',
					'Functional Annotation': '88.7%',
					'Hypothetical': '11.3%'
				},
				chartData: {
					title: 'Genome Annotation Summary',
					x: ['CDS', 'tRNA', 'rRNA', 'ncRNA', 'Other'],
					y: [4623, 86, 22, 89, 3],
					type: 'bar',
					xLabel: 'Feature Type',
					yLabel: 'Count'
				},
				files: [
					{ name: 'sample_01.gff3', type: 'gff', size: '2.8 MB' },
					{ name: 'sample_01.gbff', type: 'gbk', size: '8.4 MB' },
					{ name: 'sample_01.faa', type: 'faa', size: '1.6 MB' },
					{ name: 'sample_01.tsv', type: 'tsv', size: '890 KB' }
				]
			},
			'mlst': {
				output: `\x1b[36mmlst v2.23.0\x1b[0m
[2024-01-15 11:45:00] INFO: Scanning for MLST alleles

\x1b[36mInput:\x1b[0m
  Assembly: assembly/assembly.fasta

\x1b[36mScheme detection...\x1b[0m
  Best match: Escherichia coli #1 (Achtman)

\x1b[36mAllele identification...\x1b[0m
  adk:   10  (exact match)
  fumC:  11  (exact match)
  gyrB:  4   (exact match)
  icd:   8   (exact match)
  mdh:   8   (exact match)
  purA:  8   (exact match)
  recA:  2   (exact match)

\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m
\x1b[1;32m  MLST RESULTS\x1b[0m
\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m

  Scheme: \x1b[36mescherichia_coli_achtman\x1b[0m

  \x1b[1;33mSequence Type: ST131\x1b[0m

  Allelic Profile:
    adk(10) fumC(11) gyrB(4) icd(8) mdh(8) purA(8) recA(2)

  \x1b[31m⚠ ST131 is a high-risk pandemic clone associated with:\x1b[0m
    - Extended-spectrum beta-lactamase (ESBL) production
    - Fluoroquinolone resistance
    - Extraintestinal pathogenic E. coli (ExPEC)
    - Urinary tract infections
    - Bloodstream infections

\x1b[33mRecommendation: Further antimicrobial susceptibility testing advised\x1b[0m
`,
				summary: {
					'Scheme': 'E. coli (Achtman)',
					'Sequence Type': 'ST131',
					'adk': '10',
					'fumC': '11',
					'gyrB': '4',
					'icd': '8',
					'mdh': '8',
					'purA': '8',
					'recA': '2',
					'Clinical Significance': 'High-risk clone'
				},
				chartData: {
					title: 'MLST Allelic Profile',
					x: ['adk', 'fumC', 'gyrB', 'icd', 'mdh', 'purA', 'recA'],
					y: [10, 11, 4, 8, 8, 8, 2],
					type: 'bar',
					xLabel: 'Locus',
					yLabel: 'Allele Number'
				},
				files: [
					{ name: 'mlst_report.tsv', type: 'tsv', size: '512 B' }
				]
			},
			// Phase 3: Plasmid Analysis
			'mob_recon': {
				output: `\x1b[36mMOB-suite v3.1.4\x1b[0m
[2024-01-15 12:00:00] INFO: Starting plasmid reconstruction

\x1b[36mInput:\x1b[0m
  Assembly: assembly/assembly.fasta
  Contigs: 2

\x1b[36mRunning MOB-recon...\x1b[0m
  Identifying plasmid-associated sequences...
  Clustering contigs by mobility markers...
  Reconstructing plasmid replicons...

\x1b[36mRunning MOB-typer...\x1b[0m
  Typing plasmid replicons...
  Identifying mobility genes...
  Detecting relaxases and mate-pair formation genes...

\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m
\x1b[1;32m  PLASMID RECONSTRUCTION RESULTS\x1b[0m
\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m

  Chromosome: 1 (4,892,156 bp)
  Plasmids detected: 1

  \x1b[33mPlasmid AA001:\x1b[0m
    Size: 95,234 bp
    Replicon type: IncFIB(K), IncFII(K)
    Mobility: Conjugative
    Relaxase type: MOBF
    Mate-pair formation: MPF_F
    Predicted host: Klebsiella/Escherichia

\x1b[31m⚠ This plasmid carries AMR genes:\x1b[0m
    - blaCTX-M-15 (ESBL)
    - tet(A) (Tetracycline resistance)

\x1b[33mNote: IncF plasmids are highly transmissible in clinical settings\x1b[0m
`,
				summary: {
					'Chromosome': '1 (4.89 Mb)',
					'Plasmids Found': '1',
					'Plasmid Size': '95,234 bp',
					'Replicon Type': 'IncFIB(K), IncFII(K)',
					'Mobility': 'Conjugative',
					'Relaxase': 'MOBF',
					'AMR Genes on Plasmid': '2'
				},
				chartData: {
					title: 'Genome Composition',
					x: ['Chromosome', 'Plasmid AA001'],
					y: [4892156, 95234],
					type: 'bar',
					xLabel: 'Replicon',
					yLabel: 'Size (bp)'
				},
				files: [
					{ name: 'plasmid_report.tsv', type: 'tsv', size: '2.1 KB' },
					{ name: 'chromosome.fasta', type: 'fasta', size: '4.7 MB' },
					{ name: 'plasmid_AA001.fasta', type: 'fasta', size: '92 KB' },
					{ name: 'mobtyper_results.txt', type: 'txt', size: '1.5 KB' }
				]
			},
			'platon': {
				output: `\x1b[36mPlaton v1.6.0\x1b[0m
[2024-01-15 12:10:00] INFO: Starting plasmid detection

\x1b[36mInput:\x1b[0m
  Assembly: assembly/assembly.fasta
  Contigs: 2

\x1b[36mClassifying contigs...\x1b[0m
  Using machine learning model: gradient boosting
  Analyzing sequence features:
    - Replication proteins
    - Mobilization proteins
    - Conjugation genes
    - Plasmid-specific markers

\x1b[36mFeature detection:\x1b[0m
  contig_1: Chromosome markers detected
  contig_2: Plasmid markers detected (score: 0.987)

\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m
\x1b[1;32m  PLASMID DETECTION RESULTS\x1b[0m
\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m

  Classification Summary:
    Chromosomal contigs: 1 (4,892,156 bp)
    Plasmid contigs: 1 (95,234 bp)

  \x1b[33mPlasmid contig_2:\x1b[0m
    Confidence: 98.7%
    Replication genes: repA, repB
    Mobilization genes: mobA, mobC
    Conjugation: traI, traD, traM

\x1b[32m✓ High confidence plasmid prediction\x1b[0m
`,
				summary: {
					'Chromosomal Contigs': '1',
					'Plasmid Contigs': '1',
					'Confidence': '98.7%',
					'Replication Genes': 'repA, repB',
					'Mobilization': 'mobA, mobC',
					'Conjugation': 'traI, traD, traM'
				},
				chartData: {
					title: 'Plasmid Prediction Confidence',
					x: ['contig_1 (Chromosome)', 'contig_2 (Plasmid)'],
					y: [2.3, 98.7],
					type: 'bar',
					xLabel: 'Contig',
					yLabel: 'Plasmid Score (%)'
				},
				files: [
					{ name: 'plasmid_predictions.tsv', type: 'tsv', size: '1.2 KB' },
					{ name: 'plasmid_sequences.fasta', type: 'fasta', size: '92 KB' },
					{ name: 'chromosome_sequences.fasta', type: 'fasta', size: '4.7 MB' }
				]
			},
			// Phase 4: Phylogenetics
			'snippy': {
				output: `\x1b[36mSnippy v4.6.0\x1b[0m
[2024-01-15 12:20:00] INFO: Starting variant calling

\x1b[36mReference:\x1b[0m
  Genome: reference.fasta (E. coli K-12 MG1655)
  Size: 4,641,652 bp

\x1b[36mReads:\x1b[0m
  R1: sample_01_R1_paired.fq.gz
  R2: sample_01_R2_paired.fq.gz

\x1b[36mAlignment (BWA-MEM)...\x1b[0m
  Reads mapped: 2,389,456 (99.8%)
  Mean coverage: 77.3x
  Median coverage: 76x

\x1b[36mVariant calling (Freebayes)...\x1b[0m
  Processing regions...
  Calling variants...
  Filtering low-quality variants...

\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m
\x1b[1;32m  VARIANT CALLING RESULTS\x1b[0m
\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m

  Total variants: 1,247
    SNPs: 1,189 (95.3%)
    Insertions: 32 (2.6%)
    Deletions: 26 (2.1%)

  Variant density: 0.27 per kb
  Transition/Transversion: 2.34

  \x1b[33mCore genome SNPs: 1,156\x1b[0m
  (used for phylogenetic analysis)

\x1b[32m✓ Consensus sequence generated\x1b[0m
`,
				summary: {
					'Reference': 'E. coli K-12 MG1655',
					'Coverage': '77.3x',
					'Total Variants': '1,247',
					'SNPs': '1,189',
					'Insertions': '32',
					'Deletions': '26',
					'Core SNPs': '1,156',
					'Ti/Tv Ratio': '2.34'
				},
				chartData: {
					title: 'Variant Types Distribution',
					x: ['SNPs', 'Insertions', 'Deletions'],
					y: [1189, 32, 26],
					type: 'bar',
					xLabel: 'Variant Type',
					yLabel: 'Count'
				},
				files: [
					{ name: 'snps.vcf', type: 'vcf', size: '156 KB' },
					{ name: 'snps.tab', type: 'tsv', size: '89 KB' },
					{ name: 'snps.aligned.fa', type: 'fasta', size: '4.5 MB' },
					{ name: 'snps.consensus.fa', type: 'fasta', size: '4.5 MB' }
				]
			},
			'roary': {
				output: `\x1b[36mRoary v3.13.0\x1b[0m
[2024-01-15 12:30:00] INFO: Starting pan-genome analysis

\x1b[36mInput GFF files:\x1b[0m
  - sample_01.gff (4,523 genes)
  - sample_02.gff (4,498 genes)
  - sample_03.gff (4,512 genes)
  - reference.gff (4,489 genes)

\x1b[36mClustering genes...\x1b[0m
  Identity threshold: 95%
  Using CD-HIT for clustering...
  Paralog splitting enabled...

\x1b[36mBuilding pan-genome...\x1b[0m
  Identifying core genes (99-100% presence)...
  Identifying soft-core genes (95-99%)...
  Identifying shell genes (15-95%)...
  Identifying cloud genes (0-15%)...

\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m
\x1b[1;32m  PAN-GENOME ANALYSIS RESULTS\x1b[0m
\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m

  Total genes in pan-genome: 5,234

  \x1b[32mCore genes:      3,987 (76.2%)\x1b[0m
  Soft-core genes:   312 (6.0%)
  Shell genes:       489 (9.3%)
  \x1b[31mCloud genes:       446 (8.5%)\x1b[0m

  Core genome alignment: 3,456,789 bp
  Informative sites: 12,345

\x1b[33mTip: Core gene alignment can be used for phylogenetic analysis\x1b[0m
`,
				summary: {
					'Isolates Analyzed': '4',
					'Total Pan-genome': '5,234 genes',
					'Core Genes': '3,987 (76.2%)',
					'Soft-core': '312 (6.0%)',
					'Shell': '489 (9.3%)',
					'Cloud': '446 (8.5%)',
					'Core Alignment': '3.46 Mb'
				},
				chartData: {
					title: 'Pan-genome Composition',
					x: ['Core', 'Soft-core', 'Shell', 'Cloud'],
					y: [3987, 312, 489, 446],
					type: 'bar',
					xLabel: 'Gene Category',
					yLabel: 'Number of Genes'
				},
				files: [
					{ name: 'gene_presence_absence.csv', type: 'csv', size: '2.3 MB' },
					{ name: 'core_gene_alignment.aln', type: 'aln', size: '3.5 MB' },
					{ name: 'pan_genome_reference.fa', type: 'fasta', size: '5.2 MB' },
					{ name: 'summary_statistics.txt', type: 'txt', size: '1.8 KB' }
				]
			},
			'iqtree': {
				output: `\x1b[36mIQ-TREE v2.2.0\x1b[0m
[2024-01-15 12:45:00] INFO: Starting phylogenetic analysis

\x1b[36mInput alignment:\x1b[0m
  File: core_gene_alignment.aln
  Sequences: 4
  Sites: 3,456,789
  Informative sites: 12,345

\x1b[36mModel selection (ModelFinder)...\x1b[0m
  Testing 88 DNA models...
  Best model: GTR+F+I+G4 (BIC: 45678.234)

\x1b[36mTree inference...\x1b[0m
  Initial tree: NJ
  Optimization: Maximum likelihood
  Log-likelihood: -22345.678

\x1b[36mBranch support (UFBoot)...\x1b[0m
  Replicates: 1000
  Calculating bootstrap values...

\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m
\x1b[1;32m  PHYLOGENETIC ANALYSIS RESULTS\x1b[0m
\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m

  Best-fit model: GTR+F+I+G4
  Log-likelihood: -22345.678
  Tree length: 0.0234

  \x1b[33mTree topology:\x1b[0m
  ((sample_01:0.0012,sample_02:0.0008)100:0.0045,
   (sample_03:0.0023,reference:0.0089)98:0.0034);

  Bootstrap support:
    All nodes: ≥98%

\x1b[32m✓ Phylogenetic tree saved to: core_alignment.treefile\x1b[0m
\x1b[33mTip: Visualize tree with FigTree or iTOL\x1b[0m
`,
				summary: {
					'Sequences': '4',
					'Alignment Length': '3,456,789 bp',
					'Best Model': 'GTR+F+I+G4',
					'Log-likelihood': '-22345.678',
					'Bootstrap Replicates': '1000',
					'Min Bootstrap': '98%',
					'Tree Format': 'Newick'
				},
				chartData: {
					title: 'Branch Lengths (substitutions/site)',
					x: ['sample_01', 'sample_02', 'sample_03', 'reference'],
					y: [0.0012, 0.0008, 0.0023, 0.0089],
					type: 'bar',
					xLabel: 'Sample',
					yLabel: 'Branch Length'
				},
				files: [
					{ name: 'core_alignment.treefile', type: 'nwk', size: '256 B' },
					{ name: 'core_alignment.iqtree', type: 'txt', size: '12 KB' },
					{ name: 'core_alignment.log', type: 'log', size: '45 KB' }
				]
			},
			'gubbins': {
				output: `\x1b[36mGubbins v3.3.0\x1b[0m
[2024-01-15 13:00:00] INFO: Starting recombination detection

\x1b[36mInput:\x1b[0m
  Alignment: core_gene_alignment.aln
  Sequences: 4
  Length: 3,456,789 bp

\x1b[36mIterative recombination detection...\x1b[0m

  Iteration 1:
    Building tree (RAxML)...
    Detecting recombination (Gubbins)...
    Recombinant regions: 23
    Masked sites: 45,678

  Iteration 2:
    Rebuilding tree...
    Re-detecting recombination...
    Recombinant regions: 21
    Masked sites: 43,234

  Iteration 3:
    Converged! No new recombination detected.

\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m
\x1b[1;32m  RECOMBINATION ANALYSIS RESULTS\x1b[0m
\x1b[1;32m═══════════════════════════════════════════════════════════\x1b[0m

  Total recombinant regions: 21
  Total bases affected: 43,234 (1.25%)

  \x1b[33mRecombination hotspots:\x1b[0m
    - Region 1: 234,567-245,678 (11 kb) - \x1b[31mHigh density\x1b[0m
    - Region 2: 567,890-578,901 (11 kb)
    - Region 3: 1,234,567-1,239,012 (4.4 kb)
    ... (18 more regions)

  Clean alignment: 3,413,555 bp (98.75%)
  SNPs after removing recombination: 10,234

\x1b[32m✓ Recombination-free tree generated\x1b[0m
\x1b[33mNote: Use clean.final_tree.tre for outbreak analysis\x1b[0m
`,
				summary: {
					'Input Sequences': '4',
					'Recombinant Regions': '21',
					'Bases Affected': '43,234 (1.25%)',
					'Clean Alignment': '3.41 Mb',
					'SNPs (clean)': '10,234',
					'Iterations': '3',
					'Status': 'Converged'
				},
				chartData: {
					title: 'Recombination Impact',
					x: ['Original Sites', 'Recombinant Sites', 'Clean Sites'],
					y: [3456789, 43234, 3413555],
					type: 'bar',
					xLabel: 'Category',
					yLabel: 'Base Pairs'
				},
				files: [
					{ name: 'recombination_predictions.gff', type: 'gff', size: '8.5 KB' },
					{ name: 'clean.core.aln', type: 'aln', size: '3.4 MB' },
					{ name: 'clean.final_tree.tre', type: 'nwk', size: '312 B' },
					{ name: 'clean.summary.txt', type: 'txt', size: '2.1 KB' }
				]
			}
		};

		return outputs[tool] || null;
	}

	const terminalOptions = {
		theme: {
			background: '#1e1e1e',
			foreground: '#d4d4d4',
			cursor: '#d4d4d4',
			cursorAccent: '#1e1e1e',
			selectionBackground: '#264f78',
			black: '#1e1e1e',
			red: '#f44747',
			green: '#4ec9b0',
			yellow: '#dcdcaa',
			blue: '#569cd6',
			magenta: '#c586c0',
			cyan: '#9cdcfe',
			white: '#d4d4d4',
			brightBlack: '#808080',
			brightRed: '#f44747',
			brightGreen: '#4ec9b0',
			brightYellow: '#dcdcaa',
			brightBlue: '#569cd6',
			brightMagenta: '#c586c0',
			brightCyan: '#9cdcfe',
			brightWhite: '#ffffff'
		},
		fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
		fontSize: 14,
		lineHeight: 1.2,
		cursorBlink: true,
		cursorStyle: 'block' as const,
		scrollback: 10000
	};

	function writePrompt() {
		const shortDir = currentDir.replace('/data/outbreak_investigation', '~');
		terminal.write(`\r\n\x1b[32mbiolearn\x1b[0m:\x1b[34m${shortDir}\x1b[0m$ `);
	}

	function clearLine() {
		// Clear current line
		const len = commandBuffer.length;
		for (let i = 0; i < len; i++) {
			terminal.write('\b \b');
		}
	}

	function handleInput(data: string) {
		// Handle Ctrl+C first - needs to work even during execution
		if (data === '\x03') {
			if (isExecuting) {
				// Cancel the running tool
				isExecuting = false;
			} else {
				// Not executing - show ^C and new prompt
				terminal.write('^C');
				terminal.write('\r\n');
				commandBuffer = '';
				cursorPosition = 0;
				historyIndex = -1;
				writePrompt();
			}
			return;
		}

		if (isExecuting) return;

		// Handle Enter
		if (data === '\r') {
			terminal.write('\r\n');
			if (commandBuffer.trim()) {
				// Add to history
				commandHistoryList.push(commandBuffer.trim());
				historyIndex = -1;
				savedCurrentBuffer = '';
				executeCommand(commandBuffer.trim());
			} else {
				writePrompt();
			}
			commandBuffer = '';
			cursorPosition = 0;
		}
		// Handle Backspace
		else if (data === '\x7f') {
			if (cursorPosition > 0) {
				// Delete character before cursor
				commandBuffer = commandBuffer.slice(0, cursorPosition - 1) + commandBuffer.slice(cursorPosition);
				cursorPosition--;
				// Redraw line from cursor position
				terminal.write('\b');
				terminal.write(commandBuffer.slice(cursorPosition) + ' ');
				// Move cursor back to position
				for (let i = 0; i <= commandBuffer.length - cursorPosition; i++) {
					terminal.write('\b');
				}
			}
		}
		// Handle Ctrl+L (clear screen)
		else if (data === '\x0c') {
			terminal.clear();
			writePrompt();
			terminal.write(commandBuffer);
			cursorPosition = commandBuffer.length;
		}
		// Handle Tab autocomplete
		else if (data === '\t') {
			handleTabComplete();
		}
		// Handle Arrow keys (escape sequences)
		else if (data === '\x1b[A') {
			// Arrow Up - previous command
			if (commandHistoryList.length > 0) {
				if (historyIndex === -1) {
					savedCurrentBuffer = commandBuffer;
					historyIndex = commandHistoryList.length - 1;
				} else if (historyIndex > 0) {
					historyIndex--;
				}
				clearLine();
				commandBuffer = commandHistoryList[historyIndex];
				cursorPosition = commandBuffer.length;
				terminal.write(commandBuffer);
			}
		}
		else if (data === '\x1b[B') {
			// Arrow Down - next command
			if (historyIndex !== -1) {
				if (historyIndex < commandHistoryList.length - 1) {
					historyIndex++;
					clearLine();
					commandBuffer = commandHistoryList[historyIndex];
					cursorPosition = commandBuffer.length;
					terminal.write(commandBuffer);
				} else {
					historyIndex = -1;
					clearLine();
					commandBuffer = savedCurrentBuffer;
					cursorPosition = commandBuffer.length;
					terminal.write(commandBuffer);
				}
			}
		}
		// Arrow Left - move cursor left
		else if (data === '\x1b[D') {
			if (cursorPosition > 0) {
				cursorPosition--;
				terminal.write('\x1b[D');  // Move cursor left
			}
		}
		// Arrow Right - move cursor right
		else if (data === '\x1b[C') {
			if (cursorPosition < commandBuffer.length) {
				cursorPosition++;
				terminal.write('\x1b[C');  // Move cursor right
			}
		}
		// Regular characters (handles both single chars and paste)
		else if (data >= ' ' || data.length > 1) {
			// Filter out control characters for pasted text
			const cleanData = data.split('').filter(c => c >= ' ' || c === '\t').join('');
			if (cleanData.length === 0) return;

			// Insert characters at cursor position
			commandBuffer = commandBuffer.slice(0, cursorPosition) + cleanData + commandBuffer.slice(cursorPosition);
			cursorPosition += cleanData.length;
			// Write from old cursor position to end
			terminal.write(commandBuffer.slice(cursorPosition - cleanData.length));
			// Move cursor back to correct position
			for (let i = 0; i < commandBuffer.length - cursorPosition; i++) {
				terminal.write('\b');
			}
		}
	}

	function handleTabComplete() {
		const parts = commandBuffer.split(/\s+/);
		const lastPart = parts[parts.length - 1] || '';
		const command = parts[0] || '';

		// Don't allow tab completion for non-existent commands
		const validCommands = [...allowedCommandsList, ...Array.from(bioTools)];
		if (parts.length > 1 && !validCommands.includes(command)) {
			return; // Don't tab complete for invalid commands
		}

		// Get current filesystem
		const filesystem = getFilesystem();

		// Handle subdirectory paths (e.g., trimmed/sample)
		let searchDir = currentDir;
		let searchPrefix = lastPart;
		let pathPrefix = '';

		if (lastPart.includes('/')) {
			const lastSlash = lastPart.lastIndexOf('/');
			const dirPart = lastPart.slice(0, lastSlash);
			searchPrefix = lastPart.slice(lastSlash + 1);
			pathPrefix = dirPart + '/';

			// Resolve the directory path
			if (dirPart.startsWith('/')) {
				searchDir = dirPart;
			} else {
				searchDir = `${currentDir}/${dirPart}`.replace(/\/+/g, '/');
			}
		}

		const files = filesystem[searchDir] || [];

		// Find matches
		const matches = files.filter(f => f.startsWith(searchPrefix));

		if (matches.length === 0) {
			return; // No matches
		} else if (matches.length === 1) {
			// Single match - complete it
			const completion = matches[0].slice(searchPrefix.length);
			commandBuffer += completion;
			cursorPosition += completion.length;
			terminal.write(completion);
		} else {
			// Multiple matches - show them
			terminal.write('\r\n');
			const formatted = matches.map(f => {
				if (f.endsWith('/')) return `\x1b[34m${f}\x1b[0m`;
				if (f.endsWith('.gz') || f.endsWith('.fastq') || f.endsWith('.fasta')) return `\x1b[32m${f}\x1b[0m`;
				return f;
			});
			terminal.writeln(formatted.join('  '));
			writePrompt();
			terminal.write(commandBuffer);
			cursorPosition = commandBuffer.length;

			// Find common prefix
			const commonPrefix = findCommonPrefix(matches);
			if (commonPrefix.length > searchPrefix.length) {
				const completion = commonPrefix.slice(searchPrefix.length);
				commandBuffer += completion;
				cursorPosition += completion.length;
				terminal.write(completion);
			}
		}
	}

	function findCommonPrefix(strings: string[]): string {
		if (strings.length === 0) return '';
		let prefix = strings[0];
		for (let i = 1; i < strings.length; i++) {
			while (!strings[i].startsWith(prefix)) {
				prefix = prefix.slice(0, -1);
			}
		}
		return prefix;
	}

	// Valid files for each tool - must match exactly
	const validToolFiles: Record<string, string[]> = {
		'fastqc': [
			'sample_01_R1.fastq.gz', 'sample_01_R2.fastq.gz',
			'sample_02_R1.fastq.gz', 'sample_02_R2.fastq.gz',
			'sample_03_R1.fastq.gz', 'sample_03_R2.fastq.gz'
		],
		'seqkit': [
			'sample_01_R1.fastq.gz', 'sample_01_R2.fastq.gz',
			'sample_02_R1.fastq.gz', 'sample_02_R2.fastq.gz',
			'sample_03_R1.fastq.gz', 'sample_03_R2.fastq.gz'
		],
		'trimmomatic': [
			'sample_01_R1.fastq.gz', 'sample_01_R2.fastq.gz'
		],
		'unicycler': [
			'trimmed/sample_01_R1_paired.fq.gz', 'trimmed/sample_01_R2_paired.fq.gz'
		],
		'bandage': ['assembly/assembly.gfa'],
		'prokka': ['assembly/assembly.fasta'],
		'abricate': ['assembly/assembly.fasta'],
		'quast': ['assembly/assembly.fasta'],
		'checkm': ['assembly/'],
		'confindr': ['assembly/assembly.fasta'],
		'bakta': ['assembly/assembly.fasta'],
		'mlst': ['assembly/assembly.fasta'],
		// Phase 3: Plasmid Analysis
		'mob_recon': ['assembly/assembly.fasta'],
		'platon': ['assembly/assembly.fasta'],
		// Phase 4: Phylogenetics
		'snippy': ['trimmed/sample_01_R1_paired.fq.gz', 'trimmed/sample_01_R2_paired.fq.gz'],
		'roary': ['annotation/'],
		'iqtree': ['roary_results/core_gene_alignment.aln'],
		'gubbins': ['roary_results/core_gene_alignment.aln']
	};

	// Tool requirements: directory
	const toolRequirements: Record<string, { dir: string }> = {
		'fastqc': { dir: '/data/outbreak_investigation' },
		'seqkit': { dir: '/data/outbreak_investigation' },
		'trimmomatic': { dir: '/data/outbreak_investigation' },
		'unicycler': { dir: '/data/outbreak_investigation' },
		'bandage': { dir: '/data/outbreak_investigation' },
		'prokka': { dir: '/data/outbreak_investigation' },
		'abricate': { dir: '/data/outbreak_investigation' },
		'quast': { dir: '/data/outbreak_investigation' },
		'checkm': { dir: '/data/outbreak_investigation' },
		'confindr': { dir: '/data/outbreak_investigation' },
		'bakta': { dir: '/data/outbreak_investigation' },
		'mlst': { dir: '/data/outbreak_investigation' },
		// Phase 3
		'mob_recon': { dir: '/data/outbreak_investigation' },
		'platon': { dir: '/data/outbreak_investigation' },
		// Phase 4
		'snippy': { dir: '/data/outbreak_investigation' },
		'roary': { dir: '/data/outbreak_investigation' },
		'iqtree': { dir: '/data/outbreak_investigation' },
		'gubbins': { dir: '/data/outbreak_investigation' }
	};

	// Check if file is valid for a tool
	function isValidFileForTool(tool: string, filename: string): boolean {
		const validFiles = validToolFiles[tool];
		if (!validFiles) return true;
		return validFiles.some(f => f === filename || f.endsWith(filename) || filename.endsWith(f.split('/').pop() || ''));
	}

	async function executeCommand(cmd: string) {
		const parts = cmd.trim().split(/\s+/);
		const command = parts[0];
		const args = parts.slice(1);

		// Check for blocked commands (including less/more)
		if (blockedCommands.has(command) || command === 'less' || command === 'more') {
			if (command === 'less' || command === 'more') {
				terminal.writeln(`\x1b[31mbash: ${command}: command not available\x1b[0m`);
				terminal.writeln(`\x1b[90mUse 'head' or 'cat' to view files instead.\x1b[0m`);
			} else {
				terminal.writeln(`\x1b[31mbash: ${command}: Operation not permitted\x1b[0m`);
				terminal.writeln(`\x1b[90mThis is a learning environment. Modifying files is disabled.\x1b[0m`);
			}
			writePrompt();
			return;
		}

		// Handle built-in commands
		if (command === 'help') {
			showHelp();
			writePrompt();
			return;
		}

		if (command === 'clear') {
			terminal.clear();
			writePrompt();
			return;
		}

		if (command === 'pwd') {
			terminal.writeln(currentDir);
			writePrompt();
			return;
		}

		if (command === 'ls') {
			handleLs(args);
			writePrompt();
			return;
		}

		if (command === 'cd') {
			handleCd(args);
			writePrompt();
			return;
		}

		if (command === 'cat' || command === 'head' || command === 'tail') {
			handleFileView(command, args);
			writePrompt();
			return;
		}

		// Handle bioinformatics tools - require proper arguments and correct directory/files
		if (bioTools.has(command)) {
			const req = toolRequirements[command];

			// Check directory requirement
			if (req && currentDir !== req.dir) {
				const shortDir = req.dir.replace('/data/outbreak_investigation', '~');
				terminal.writeln(`\x1b[31mError: ${command} must be run from ${shortDir}\x1b[0m`);
				terminal.writeln(`\x1b[90mCurrent directory: ${currentDir.replace('/data/outbreak_investigation', '~')}\x1b[0m`);
				terminal.writeln(`\x1b[90mUse 'cd ${shortDir}' to navigate there first.\x1b[0m`);
				writePrompt();
				return;
			}

			// Check command has proper arguments
			if (command === 'fastqc') {
				// Check for input file
				const inputFile = args.find(a => a.endsWith('.fastq.gz'));
				if (!inputFile) {
					terminal.writeln(`\x1b[31mError: Missing input file\x1b[0m`);
					terminal.writeln(`\x1b[31mUsage: fastqc <input.fastq.gz> -o <output_dir>\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: fastqc sample_01_R1.fastq.gz -o qc_reports/\x1b[0m`);
					writePrompt();
					return;
				}
				// Check file is valid for this tool
				if (!isValidFileForTool('fastqc', inputFile)) {
					terminal.writeln(`\x1b[31mError: '${inputFile}' is not a valid input for fastqc\x1b[0m`);
					terminal.writeln(`\x1b[90mFastQC requires raw sequencing files: sample_01_R1.fastq.gz, sample_01_R2.fastq.gz, etc.\x1b[0m`);
					writePrompt();
					return;
				}
				// Check for -o flag with output directory
				const oIndex = args.indexOf('-o');
				if (oIndex === -1 || !args[oIndex + 1]) {
					terminal.writeln(`\x1b[31mError: Missing output directory\x1b[0m`);
					terminal.writeln(`\x1b[31mUsage: fastqc <input.fastq.gz> -o <output_dir>\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: fastqc sample_01_R1.fastq.gz -o qc_reports/\x1b[0m`);
					writePrompt();
					return;
				}
				// Check for exact folder name
				const outputDir = args[oIndex + 1].replace(/\/$/, ''); // Remove trailing slash
				if (outputDir !== 'qc_reports') {
					terminal.writeln(`\x1b[31mError: Invalid output directory '${args[oIndex + 1]}'\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use the exact folder name: qc_reports\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: fastqc sample_01_R1.fastq.gz -o qc_reports/\x1b[0m`);
					writePrompt();
					return;
				}
			}

			if (command === 'trimmomatic') {
				if (args.length < 5) {
					terminal.writeln(`\x1b[31mUsage: trimmomatic PE -phred33 <R1.fq.gz> <R2.fq.gz> <output_files...> <options>\x1b[0m`);
					terminal.writeln(`\x1b[90mThis tool requires paired-end input files and trimming parameters.\x1b[0m`);
					writePrompt();
					return;
				}
				// Check PE mode and paired files
				if (!args.includes('PE')) {
					terminal.writeln(`\x1b[31mError: Trimmomatic requires 'PE' mode for paired-end reads\x1b[0m`);
					writePrompt();
					return;
				}
				// Check output files are in trimmed/ folder
				const outputFiles = args.filter(a => a.includes('_paired.fq.gz') || a.includes('_unpaired.fq.gz'));
				if (outputFiles.length === 0) {
					terminal.writeln(`\x1b[31mError: Missing output files\x1b[0m`);
					terminal.writeln(`\x1b[90mOutput files should be: trimmed/sample_01_R1_paired.fq.gz, trimmed/sample_01_R1_unpaired.fq.gz, etc.\x1b[0m`);
					writePrompt();
					return;
				}
				const invalidOutput = outputFiles.find(f => !f.startsWith('trimmed/'));
				if (invalidOutput) {
					terminal.writeln(`\x1b[31mError: Invalid output path '${invalidOutput}'\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, output files must be in the 'trimmed/' folder\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: trimmed/sample_01_R1_paired.fq.gz\x1b[0m`);
					writePrompt();
					return;
				}
			}

			if (command === 'unicycler') {
				if (!args.includes('-1') || !args.includes('-2')) {
					terminal.writeln(`\x1b[31mUsage: unicycler -1 <R1_paired.fq.gz> -2 <R2_paired.fq.gz> -o <output_dir>\x1b[0m`);
					terminal.writeln(`\x1b[90mThis tool requires paired-end trimmed reads from the trimmed/ folder.\x1b[0m`);
					writePrompt();
					return;
				}
				// Check that input files are trimmed paired files
				const r1Idx = args.indexOf('-1');
				const r2Idx = args.indexOf('-2');
				const r1File = args[r1Idx + 1];
				const r2File = args[r2Idx + 1];
				// Check files are valid for unicycler
				if (!r1File || !isValidFileForTool('unicycler', r1File)) {
					terminal.writeln(`\x1b[31mError: '${r1File || 'missing'}' is not a valid input for unicycler\x1b[0m`);
					terminal.writeln(`\x1b[90mUnicycler requires: trimmed/sample_01_R1_paired.fq.gz\x1b[0m`);
					writePrompt();
					return;
				}
				if (!r2File || !isValidFileForTool('unicycler', r2File)) {
					terminal.writeln(`\x1b[31mError: '${r2File || 'missing'}' is not a valid input for unicycler\x1b[0m`);
					terminal.writeln(`\x1b[90mUnicycler requires: trimmed/sample_01_R2_paired.fq.gz\x1b[0m`);
					writePrompt();
					return;
				}
				// Check -o flag
				if (!args.includes('-o')) {
					terminal.writeln(`\x1b[31mError: Missing output directory\x1b[0m`);
					terminal.writeln(`\x1b[31mUsage: unicycler -1 <R1_paired.fq.gz> -2 <R2_paired.fq.gz> -o <output_dir>\x1b[0m`);
					writePrompt();
					return;
				}
				// Enforce exact output directory name
				const oIdx = args.indexOf('-o');
				const outDir = args[oIdx + 1]?.replace(/\/$/, '');
				if (outDir !== 'assembly') {
					terminal.writeln(`\x1b[31mError: Invalid output directory '${args[oIdx + 1] || 'missing'}'\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use the exact folder name: assembly\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: unicycler -1 trimmed/sample_01_R1_paired.fq.gz -2 trimmed/sample_01_R2_paired.fq.gz -o assembly\x1b[0m`);
					writePrompt();
					return;
				}
			}

			if (command === 'bandage') {
				if (!args.includes('image')) {
					terminal.writeln(`\x1b[31mUsage: bandage image assembly/assembly.gfa assembly/assembly_graph.png\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: bandage image assembly/assembly.gfa assembly/assembly_graph.png\x1b[0m`);
					writePrompt();
					return;
				}
				// Check GFA file
				const gfaFile = args.find(a => a.endsWith('.gfa'));
				if (!gfaFile) {
					terminal.writeln(`\x1b[31mError: Missing .gfa file\x1b[0m`);
					terminal.writeln(`\x1b[31mUsage: bandage image assembly/assembly.gfa assembly/assembly_graph.png\x1b[0m`);
					writePrompt();
					return;
				}
				if (!isValidFileForTool('bandage', gfaFile)) {
					terminal.writeln(`\x1b[31mError: '${gfaFile}' is not a valid input for bandage\x1b[0m`);
					terminal.writeln(`\x1b[90mBandage requires: assembly/assembly.gfa (from unicycler output)\x1b[0m`);
					writePrompt();
					return;
				}
				// Check PNG output
				const pngFile = args.find(a => a.endsWith('.png'));
				if (!pngFile) {
					terminal.writeln(`\x1b[31mError: Missing output .png file\x1b[0m`);
					terminal.writeln(`\x1b[31mUsage: bandage image assembly/assembly.gfa assembly/assembly_graph.png\x1b[0m`);
					writePrompt();
					return;
				}
				// Enforce exact output file name (must be in assembly/ folder)
				if (pngFile !== 'assembly/assembly_graph.png') {
					terminal.writeln(`\x1b[31mError: Invalid output file name '${pngFile}'\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: assembly/assembly_graph.png\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: bandage image assembly/assembly.gfa assembly/assembly_graph.png\x1b[0m`);
					writePrompt();
					return;
				}
			}

			if (command === 'quast') {
				// Check for input file
				const inputFile = args.find(a => a.endsWith('.fasta'));
				if (!inputFile) {
					terminal.writeln(`\x1b[31mError: Missing input assembly file\x1b[0m`);
					terminal.writeln(`\x1b[31mUsage: quast assembly/assembly.fasta -o assembly\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: quast assembly/assembly.fasta -o assembly\x1b[0m`);
					writePrompt();
					return;
				}
				if (!isValidFileForTool('quast', inputFile)) {
					terminal.writeln(`\x1b[31mError: '${inputFile}' is not a valid input for quast\x1b[0m`);
					terminal.writeln(`\x1b[90mQuast requires: assembly/assembly.fasta\x1b[0m`);
					writePrompt();
					return;
				}
			}

			if (command === 'prokka') {
				// Prokka: prokka assembly/assembly.fasta --outdir annotation --prefix sample_01
				const inputFile = args.find(a => a.endsWith('.fasta'));
				if (!inputFile) {
					terminal.writeln(`\x1b[31mError: Missing input assembly file\x1b[0m`);
					terminal.writeln(`\x1b[31mUsage: prokka assembly/assembly.fasta --outdir annotation --prefix sample_01\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: prokka assembly/assembly.fasta --outdir annotation --prefix sample_01\x1b[0m`);
					writePrompt();
					return;
				}
				if (!isValidFileForTool('prokka', inputFile)) {
					terminal.writeln(`\x1b[31mError: '${inputFile}' is not a valid input for prokka\x1b[0m`);
					terminal.writeln(`\x1b[90mProkka requires: assembly/assembly.fasta\x1b[0m`);
					writePrompt();
					return;
				}
				// Check output directory
				if (!args.includes('--outdir')) {
					terminal.writeln(`\x1b[31mError: Missing output directory (--outdir flag)\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: --outdir annotation\x1b[0m`);
					writePrompt();
					return;
				}
				const oIdx = args.indexOf('--outdir');
				const outDir = args[oIdx + 1]?.replace(/\/$/, '');
				if (outDir !== 'annotation') {
					terminal.writeln(`\x1b[31mError: Invalid output directory '${args[oIdx + 1] || 'missing'}'\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: annotation\x1b[0m`);
					writePrompt();
					return;
				}
			}

			if (command === 'abricate') {
				// Abricate: abricate assembly/assembly.fasta --db ncbi > results/amr_report.tsv
				const inputFile = args.find(a => a.endsWith('.fasta'));
				if (!inputFile) {
					terminal.writeln(`\x1b[31mError: Missing input assembly file\x1b[0m`);
					terminal.writeln(`\x1b[31mUsage: abricate assembly/assembly.fasta --db ncbi --output results/amr_report.tsv\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: abricate assembly/assembly.fasta --db ncbi --output results/amr_report.tsv\x1b[0m`);
					writePrompt();
					return;
				}
				if (!isValidFileForTool('abricate', inputFile)) {
					terminal.writeln(`\x1b[31mError: '${inputFile}' is not a valid input for abricate\x1b[0m`);
					terminal.writeln(`\x1b[90mABRicate requires: assembly/assembly.fasta\x1b[0m`);
					writePrompt();
					return;
				}
				// Check database
				if (!args.includes('--db')) {
					terminal.writeln(`\x1b[31mError: Missing database (--db flag)\x1b[0m`);
					terminal.writeln(`\x1b[90mAvailable databases: ncbi, card, resfinder, vfdb\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: abricate assembly/assembly.fasta --db ncbi --output results/amr_report.tsv\x1b[0m`);
					writePrompt();
					return;
				}
				// Check output
				if (!args.includes('--output') && !args.includes('-o')) {
					terminal.writeln(`\x1b[31mError: Missing output file (--output flag)\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: --output results/amr_report.tsv\x1b[0m`);
					writePrompt();
					return;
				}
				const oIdx = args.includes('--output') ? args.indexOf('--output') : args.indexOf('-o');
				const outFile = args[oIdx + 1];
				if (!outFile || !outFile.startsWith('results/')) {
					terminal.writeln(`\x1b[31mError: Invalid output path '${outFile || 'missing'}'\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, output must be in 'results/' folder\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: --output results/amr_report.tsv\x1b[0m`);
					writePrompt();
					return;
				}
			}

			if (command === 'checkm') {
				// CheckM: checkm lineage_wf assembly/ checkm_results/
				if (!args.includes('lineage_wf')) {
					terminal.writeln(`\x1b[31mUsage: checkm lineage_wf assembly/ checkm_results/\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: checkm lineage_wf assembly/ checkm_results/\x1b[0m`);
					writePrompt();
					return;
				}
				// Check input directory
				const inputDir = args.find(a => a === 'assembly/' || a === 'assembly');
				if (!inputDir) {
					terminal.writeln(`\x1b[31mError: Missing input assembly directory\x1b[0m`);
					terminal.writeln(`\x1b[31mUsage: checkm lineage_wf assembly/ checkm_results/\x1b[0m`);
					writePrompt();
					return;
				}
				// Check output directory
				const outDir = args.find(a => a.includes('checkm'));
				if (!outDir) {
					terminal.writeln(`\x1b[31mError: Missing output directory\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: checkm_results/\x1b[0m`);
					writePrompt();
					return;
				}
				if (outDir !== 'checkm_results/' && outDir !== 'checkm_results') {
					terminal.writeln(`\x1b[31mError: Invalid output directory '${outDir}'\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: checkm_results/\x1b[0m`);
					writePrompt();
					return;
				}
			}

			if (command === 'confindr') {
				// ConFindr: confindr -i assembly/assembly.fasta -o confindr_results/
				if (!args.includes('-i')) {
					terminal.writeln(`\x1b[31mUsage: confindr -i assembly/assembly.fasta -o confindr_results/\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: confindr -i assembly/assembly.fasta -o confindr_results/\x1b[0m`);
					writePrompt();
					return;
				}
				// Check input file
				const iIdx = args.indexOf('-i');
				const inputFile = args[iIdx + 1];
				if (!inputFile || !isValidFileForTool('confindr', inputFile)) {
					terminal.writeln(`\x1b[31mError: Invalid or missing input file\x1b[0m`);
					terminal.writeln(`\x1b[90mConFindr requires: assembly/assembly.fasta\x1b[0m`);
					writePrompt();
					return;
				}
				// Check output directory
				if (!args.includes('-o')) {
					terminal.writeln(`\x1b[31mError: Missing output directory (-o flag)\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: -o confindr_results/\x1b[0m`);
					writePrompt();
					return;
				}
				const oIdx = args.indexOf('-o');
				const outDir = args[oIdx + 1]?.replace(/\/$/, '');
				if (outDir !== 'confindr_results') {
					terminal.writeln(`\x1b[31mError: Invalid output directory '${args[oIdx + 1] || 'missing'}'\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: confindr_results/\x1b[0m`);
					writePrompt();
					return;
				}
			}

			if (command === 'bakta') {
				// Bakta: bakta assembly/assembly.fasta --output bakta_results/
				const inputFile = args.find(a => a.endsWith('.fasta'));
				if (!inputFile) {
					terminal.writeln(`\x1b[31mError: Missing input assembly file\x1b[0m`);
					terminal.writeln(`\x1b[31mUsage: bakta assembly/assembly.fasta --output bakta_results/\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: bakta assembly/assembly.fasta --output bakta_results/\x1b[0m`);
					writePrompt();
					return;
				}
				if (!isValidFileForTool('bakta', inputFile)) {
					terminal.writeln(`\x1b[31mError: '${inputFile}' is not a valid input for bakta\x1b[0m`);
					terminal.writeln(`\x1b[90mBakta requires: assembly/assembly.fasta\x1b[0m`);
					writePrompt();
					return;
				}
				// Check output directory
				if (!args.includes('--output') && !args.includes('-o')) {
					terminal.writeln(`\x1b[31mError: Missing output directory (--output flag)\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: --output bakta_results/\x1b[0m`);
					writePrompt();
					return;
				}
				const oIdx = args.includes('--output') ? args.indexOf('--output') : args.indexOf('-o');
				const outDir = args[oIdx + 1]?.replace(/\/$/, '');
				if (outDir !== 'bakta_results') {
					terminal.writeln(`\x1b[31mError: Invalid output directory '${args[oIdx + 1] || 'missing'}'\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: bakta_results/\x1b[0m`);
					writePrompt();
					return;
				}
			}

			if (command === 'mlst') {
				// MLST: mlst assembly/assembly.fasta > mlst_results/mlst_report.tsv
				const inputFile = args.find(a => a.endsWith('.fasta'));
				if (!inputFile) {
					terminal.writeln(`\x1b[31mError: Missing input assembly file\x1b[0m`);
					terminal.writeln(`\x1b[31mUsage: mlst assembly/assembly.fasta --output mlst_results/\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: mlst assembly/assembly.fasta --output mlst_results/\x1b[0m`);
					writePrompt();
					return;
				}
				if (!isValidFileForTool('mlst', inputFile)) {
					terminal.writeln(`\x1b[31mError: '${inputFile}' is not a valid input for mlst\x1b[0m`);
					terminal.writeln(`\x1b[90mMLST requires: assembly/assembly.fasta\x1b[0m`);
					writePrompt();
					return;
				}
				// Check output directory
				if (!args.includes('--output') && !args.includes('-o')) {
					terminal.writeln(`\x1b[31mError: Missing output directory (--output flag)\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: --output mlst_results/\x1b[0m`);
					writePrompt();
					return;
				}
				const oIdx = args.includes('--output') ? args.indexOf('--output') : args.indexOf('-o');
				const outDir = args[oIdx + 1]?.replace(/\/$/, '');
				if (outDir !== 'mlst_results') {
					terminal.writeln(`\x1b[31mError: Invalid output directory '${args[oIdx + 1] || 'missing'}'\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: mlst_results/\x1b[0m`);
					writePrompt();
					return;
				}
			}

			// Phase 3: Plasmid Analysis
			if (command === 'mob_recon') {
				// MOB-suite: mob_recon -i assembly/assembly.fasta -o mob_recon_results/
				const inputFile = args.find(a => a.endsWith('.fasta'));
				if (!inputFile) {
					terminal.writeln(`\x1b[31mError: Missing input assembly file\x1b[0m`);
					terminal.writeln(`\x1b[31mUsage: mob_recon -i assembly/assembly.fasta -o mob_recon_results/\x1b[0m`);
					writePrompt();
					return;
				}
				if (!isValidFileForTool('mob_recon', inputFile)) {
					terminal.writeln(`\x1b[31mError: '${inputFile}' is not a valid input for mob_recon\x1b[0m`);
					terminal.writeln(`\x1b[90mMOB-suite requires: assembly/assembly.fasta\x1b[0m`);
					writePrompt();
					return;
				}
				if (!args.includes('-o')) {
					terminal.writeln(`\x1b[31mError: Missing output directory (-o flag)\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: -o mob_recon_results/\x1b[0m`);
					writePrompt();
					return;
				}
				const oIdx = args.indexOf('-o');
				const outDir = args[oIdx + 1]?.replace(/\/$/, '');
				if (outDir !== 'mob_recon_results') {
					terminal.writeln(`\x1b[31mError: Invalid output directory '${args[oIdx + 1] || 'missing'}'\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: mob_recon_results/\x1b[0m`);
					writePrompt();
					return;
				}
			}

			if (command === 'platon') {
				// Platon: platon assembly/assembly.fasta --output platon_results/
				const inputFile = args.find(a => a.endsWith('.fasta'));
				if (!inputFile) {
					terminal.writeln(`\x1b[31mError: Missing input assembly file\x1b[0m`);
					terminal.writeln(`\x1b[31mUsage: platon assembly/assembly.fasta --output platon_results/\x1b[0m`);
					writePrompt();
					return;
				}
				if (!isValidFileForTool('platon', inputFile)) {
					terminal.writeln(`\x1b[31mError: '${inputFile}' is not a valid input for platon\x1b[0m`);
					terminal.writeln(`\x1b[90mPlaton requires: assembly/assembly.fasta\x1b[0m`);
					writePrompt();
					return;
				}
				if (!args.includes('--output') && !args.includes('-o')) {
					terminal.writeln(`\x1b[31mError: Missing output directory (--output flag)\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: --output platon_results/\x1b[0m`);
					writePrompt();
					return;
				}
				const oIdx = args.includes('--output') ? args.indexOf('--output') : args.indexOf('-o');
				const outDir = args[oIdx + 1]?.replace(/\/$/, '');
				if (outDir !== 'platon_results') {
					terminal.writeln(`\x1b[31mError: Invalid output directory '${args[oIdx + 1] || 'missing'}'\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: platon_results/\x1b[0m`);
					writePrompt();
					return;
				}
			}

			// Phase 4: Phylogenetics
			if (command === 'snippy') {
				// Snippy: snippy --ref reference.fasta --R1 trimmed/sample_01_R1_paired.fq.gz --R2 trimmed/sample_01_R2_paired.fq.gz --outdir snippy_results/
				if (!args.includes('--ref')) {
					terminal.writeln(`\x1b[31mError: Missing reference file (--ref flag)\x1b[0m`);
					terminal.writeln(`\x1b[31mUsage: snippy --ref reference.fasta --R1 R1.fq.gz --R2 R2.fq.gz --outdir snippy_results/\x1b[0m`);
					writePrompt();
					return;
				}
				if (!args.includes('--R1') || !args.includes('--R2')) {
					terminal.writeln(`\x1b[31mError: Missing read files (--R1 and --R2 flags)\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: snippy --ref reference.fasta --R1 trimmed/sample_01_R1_paired.fq.gz --R2 trimmed/sample_01_R2_paired.fq.gz --outdir snippy_results/\x1b[0m`);
					writePrompt();
					return;
				}
				if (!args.includes('--outdir')) {
					terminal.writeln(`\x1b[31mError: Missing output directory (--outdir flag)\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: --outdir snippy_results/\x1b[0m`);
					writePrompt();
					return;
				}
				const oIdx = args.indexOf('--outdir');
				const outDir = args[oIdx + 1]?.replace(/\/$/, '');
				if (outDir !== 'snippy_results') {
					terminal.writeln(`\x1b[31mError: Invalid output directory '${args[oIdx + 1] || 'missing'}'\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: snippy_results/\x1b[0m`);
					writePrompt();
					return;
				}
			}

			if (command === 'roary') {
				// Roary: roary -f roary_results/ annotation/*.gff
				if (!args.includes('-f')) {
					terminal.writeln(`\x1b[31mError: Missing output directory (-f flag)\x1b[0m`);
					terminal.writeln(`\x1b[31mUsage: roary -f roary_results/ annotation/*.gff\x1b[0m`);
					writePrompt();
					return;
				}
				const gffFiles = args.filter(a => a.endsWith('.gff') || a.includes('*.gff'));
				if (gffFiles.length === 0) {
					terminal.writeln(`\x1b[31mError: Missing GFF annotation files\x1b[0m`);
					terminal.writeln(`\x1b[90mRoary requires GFF files from prokka annotation\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: roary -f roary_results/ annotation/*.gff\x1b[0m`);
					writePrompt();
					return;
				}
				const fIdx = args.indexOf('-f');
				const outDir = args[fIdx + 1]?.replace(/\/$/, '');
				if (outDir !== 'roary_results') {
					terminal.writeln(`\x1b[31mError: Invalid output directory '${args[fIdx + 1] || 'missing'}'\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: roary_results/\x1b[0m`);
					writePrompt();
					return;
				}
			}

			if (command === 'iqtree') {
				// IQ-TREE: iqtree -s roary_results/core_gene_alignment.aln -m GTR+G -bb 1000 --prefix iqtree_results/core_alignment
				if (!args.includes('-s')) {
					terminal.writeln(`\x1b[31mError: Missing alignment file (-s flag)\x1b[0m`);
					terminal.writeln(`\x1b[31mUsage: iqtree -s roary_results/core_gene_alignment.aln --prefix iqtree_results/core_alignment\x1b[0m`);
					writePrompt();
					return;
				}
				const sIdx = args.indexOf('-s');
				const alnFile = args[sIdx + 1];
				if (!alnFile || !alnFile.endsWith('.aln')) {
					terminal.writeln(`\x1b[31mError: Invalid or missing alignment file\x1b[0m`);
					terminal.writeln(`\x1b[90mIQ-TREE requires: roary_results/core_gene_alignment.aln\x1b[0m`);
					writePrompt();
					return;
				}
				if (!args.includes('--prefix')) {
					terminal.writeln(`\x1b[31mError: Missing output prefix (--prefix flag)\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: --prefix iqtree_results/core_alignment\x1b[0m`);
					writePrompt();
					return;
				}
			}

			if (command === 'gubbins') {
				// Gubbins: run_gubbins.py roary_results/core_gene_alignment.aln --prefix gubbins_results/clean
				const alnFile = args.find(a => a.endsWith('.aln'));
				if (!alnFile) {
					terminal.writeln(`\x1b[31mError: Missing alignment file\x1b[0m`);
					terminal.writeln(`\x1b[31mUsage: run_gubbins.py roary_results/core_gene_alignment.aln --prefix gubbins_results/clean\x1b[0m`);
					writePrompt();
					return;
				}
				if (!args.includes('--prefix')) {
					terminal.writeln(`\x1b[31mError: Missing output prefix (--prefix flag)\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: --prefix gubbins_results/clean\x1b[0m`);
					writePrompt();
					return;
				}
				const pIdx = args.indexOf('--prefix');
				const prefix = args[pIdx + 1];
				if (!prefix || !prefix.startsWith('gubbins_results/')) {
					terminal.writeln(`\x1b[31mError: Invalid output prefix '${prefix || 'missing'}'\x1b[0m`);
					terminal.writeln(`\x1b[33mFor this training, please use: gubbins_results/clean\x1b[0m`);
					writePrompt();
					return;
				}
			}

			await executeBioTool(command, args, cmd);
			return;
		}

		// Unknown command
		terminal.writeln(`\x1b[31mbash: ${command}: command not found\x1b[0m`);
		terminal.writeln(`\x1b[90mType 'help' for available commands\x1b[0m`);
		writePrompt();
	}

	function showHelp() {
		terminal.writeln('');
		terminal.writeln('\x1b[1;33m════════════════════════════════════════════════════════\x1b[0m');
		terminal.writeln('\x1b[1;33m  BioLearn Terminal - Available Commands\x1b[0m');
		terminal.writeln('\x1b[1;33m════════════════════════════════════════════════════════\x1b[0m');
		terminal.writeln('');
		terminal.writeln('\x1b[1;36mFile Navigation:\x1b[0m');
		terminal.writeln('');
		terminal.writeln('  ls [path]       List directory contents');
		terminal.writeln('  cd [path]       Change directory');
		terminal.writeln('  pwd             Print working directory');
		terminal.writeln('  cat [file]      View file contents');
		terminal.writeln('  head [file]     View first 10 lines');
		terminal.writeln('  tail [file]     View last 10 lines');
		terminal.writeln('');
		terminal.writeln('\x1b[1;36mBioinformatics Tools:\x1b[0m');
		terminal.writeln('');
		terminal.writeln('  \x1b[1;33mPhase 1 - QC & Assembly:\x1b[0m');
		terminal.writeln('  \x1b[32mseqkit stats\x1b[0m    Read statistics (~3s)');
		terminal.writeln('  \x1b[32mfastqc\x1b[0m          Quality control (~10s)');
		terminal.writeln('  \x1b[32mtrimmomatic\x1b[0m     Read trimming (~45s)');
		terminal.writeln('  \x1b[32municycler\x1b[0m       Genome assembly (~3-5min)');
		terminal.writeln('  \x1b[32mbandage\x1b[0m         Visualize assembly graph (~5s)');
		terminal.writeln('');
		terminal.writeln('  \x1b[1;33mPhase 2 - QC & Analysis:\x1b[0m');
		terminal.writeln('  \x1b[32mquast\x1b[0m           Assembly QC (~20s)');
		terminal.writeln('  \x1b[32mcheckm\x1b[0m          Genome completeness (~30s)');
		terminal.writeln('  \x1b[32mconfindr\x1b[0m        Contamination detection (~15s)');
		terminal.writeln('  \x1b[32mprokka\x1b[0m          Genome annotation (~1-2min)');
		terminal.writeln('  \x1b[32mbakta\x1b[0m           Gene annotation (~1-2min)');
		terminal.writeln('  \x1b[32mabricate\x1b[0m        AMR screening (~10s)');
		terminal.writeln('  \x1b[32mmlst\x1b[0m            Sequence typing (~5s)');
		terminal.writeln('');
		terminal.writeln('  \x1b[1;33mPhase 3 - Plasmid Analysis:\x1b[0m');
		terminal.writeln('  \x1b[32mmob_recon\x1b[0m       Plasmid reconstruction (~30s)');
		terminal.writeln('  \x1b[32mplaton\x1b[0m          Plasmid detection (~20s)');
		terminal.writeln('');
		terminal.writeln('  \x1b[1;33mPhase 4 - Phylogenetics:\x1b[0m');
		terminal.writeln('  \x1b[32msnippy\x1b[0m          Variant calling (~1min)');
		terminal.writeln('  \x1b[32mroary\x1b[0m           Pan-genome analysis (~2-4min)');
		terminal.writeln('  \x1b[32miqtree\x1b[0m          Phylogenetic tree (~1-3min)');
		terminal.writeln('  \x1b[32mgubbins\x1b[0m         Recombination detection (~2-5min)');
		terminal.writeln('');
		terminal.writeln('\x1b[1;36mKeyboard Shortcuts:\x1b[0m');
		terminal.writeln('');
		terminal.writeln('  ↑/↓             Browse command history');
		terminal.writeln('  ←/→             Move cursor in command line');
		terminal.writeln('  Tab             Autocomplete file names');
		terminal.writeln('  Ctrl+L          Clear screen');
		terminal.writeln('  Ctrl+C          Cancel running command');
		terminal.writeln('');
		terminal.writeln('\x1b[1;36mUtility:\x1b[0m');
		terminal.writeln('');
		terminal.writeln('  help            Show this message');
		terminal.writeln('  clear           Clear terminal');
		terminal.writeln('');
	}

	function handleLs(args: string[]) {
		const filesystem = getFilesystem();
		const path = args[0] || currentDir;
		const fullPath = path.startsWith('/') ? path : `${currentDir}/${path}`.replace(/\/+/g, '/').replace(/\/$/, '');
		const files = filesystem[fullPath] || [];

		if (files.length === 0) {
			terminal.writeln('\x1b[90m(empty directory)\x1b[0m');
			return;
		}

		const formatted = files.map(f => {
			if (f.endsWith('/')) {
				return `\x1b[34m${f}\x1b[0m`;
			} else if (f.endsWith('.gz') || f.endsWith('.fastq') || f.endsWith('.fasta')) {
				return `\x1b[32m${f}\x1b[0m`;
			} else if (f.endsWith('.html') || f.endsWith('.log')) {
				return `\x1b[33m${f}\x1b[0m`;
			} else if (f.endsWith('.png') || f.endsWith('.svg')) {
				return `\x1b[35m${f}\x1b[0m`;
			}
			return f;
		});

		// Display in columns
		terminal.writeln(formatted.join('  '));
	}

	function handleCd(args: string[]) {
		const filesystem = getFilesystem();

		if (args.length === 0 || args[0] === '~') {
			currentDir = '/data/outbreak_investigation';
			currentDirectory.set(currentDir);
			return;
		}

		let targetPath = args[0];

		// Handle .. (parent directory)
		if (targetPath === '..' || targetPath === '../' || targetPath.startsWith('../')) {
			const parts = currentDir.split('/').filter(p => p);
			if (parts.length > 0) {
				parts.pop();
			}
			if (targetPath.startsWith('../')) {
				// Handle ../something
				const remaining = targetPath.slice(3);
				if (remaining) {
					currentDir = '/' + parts.join('/');
					currentDirectory.set(currentDir);
					handleCd([remaining]);
					return;
				}
			}
			currentDir = parts.length > 0 ? '/' + parts.join('/') : '/data';
			// Don't go above /data
			if (!currentDir.startsWith('/data')) {
				currentDir = '/data/outbreak_investigation';
			}
			currentDirectory.set(currentDir);
			return;
		}

		// Build full path
		const newPath = targetPath.startsWith('/')
			? targetPath
			: `${currentDir}/${targetPath}`.replace(/\/+/g, '/').replace(/\/$/, '');

		// Check if directory exists in filesystem
		if (filesystem[newPath] !== undefined) {
			currentDir = newPath;
			currentDirectory.set(currentDir);
		} else {
			terminal.writeln(`\x1b[31mbash: cd: ${args[0]}: No such directory\x1b[0m`);
		}
	}

	// File contents for different file types
	const fileContents: Record<string, string> = {
		// FASTQ files
		'.fastq.gz': `\x1b[90m[Compressed file - showing first reads]\x1b[0m
@M00123:45:000000000-ABC12:1:1101:15234:1000 1:N:0:1
ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG
+
FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
@M00123:45:000000000-ABC12:1:1101:15235:1001 1:N:0:1
GCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT
+
FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
@M00123:45:000000000-ABC12:1:1101:15236:1002 1:N:0:1
TACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTAC
+
FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
...`,
		'.fq.gz': `\x1b[90m[Compressed file - showing first reads]\x1b[0m
@M00123:45:000000000-ABC12:1:1101:15234:1000 1:N:0:1
ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG
+
FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
...`,
		// FASTA assembly
		'assembly.fasta': `>chromosome_1 length=4892156 circular=true
ATGAAACGCATTAGCACCACCATTACCACCACCATCACCATTACCACAGGTAACGGTGCGGGCTGA
CGCGTACAGGAAACACAGAAAAAAGCCCGCACCTGACAGTGCGGGCTTTTTTTTTCGACCAAAGGT
AACGAGGTAACAACCATGCGAGTGTTGAAGTTCGGCGGTACATCAGTGGCAAATGCAGAACGTTTT
CTGCGTGTTGCCGATATTCTGGAAAGCAATGCCAGGCAGGGGCAGGTGGCCACCGTCCTCTCTGCC
CCCGCCAAAATCACCAACCACCTGGTGGCGATGATTGAAAAAACCATTAGCGGCCAGGATGCTTTAC
CCAATATCAGCGATGCCGAACGTATTTTTGCCGAACTTTTGACGGGACTCGCCGCCGCCCAGCCGG
GGTTCCCGCTGGCGCAATTGAAAACTTTCGTCGATCAGGAATTTGCCCAAATAAAACATGTCCTGC
ATGGCATTAGTTTGTTGGGGCAGTGCCCGGATAGCATCAACGCTGCGCTGATTTGCCGTGGCGAGA
AAATGTCGATCGCCATTATGGCCGGCGTATTAGAAGCGCGCGGTCACAACGTTACTGTTATCGATC
CGGTTGATTTCAGAGCTGCCCATGTTTGCGATGGCGGCATGTTTGTTGATGAAACGCGCGAATCGA
...`,
		// GFA assembly graph
		'assembly.gfa': `H	VN:Z:1.0
S	1	ATGAAACGCATTAGCACCACCATTACCACCACCATCACCATTACCACAGGT
S	2	AACGGTGCGGGCTGACGCGTACAGGAAACACAGAAAAAAGCCCGCACCTGA
S	3	CAGTGCGGGCTTTTTTTTTCGACCAAAGGTAACGAGGTAACAACCATGCGA
S	4	GTGTTGAAGTTCGGCGGTACATCAGTGGCAAATGCAGAACGTTTTCTGCGT
L	1	+	2	+	45M
L	2	+	3	+	45M
L	3	+	4	+	45M
L	4	+	1	+	45M
P	chromosome	1+,2+,3+,4+	45M,45M,45M
...`,
		// Unicycler log
		'unicycler.log': `
Unicycler v0.5.0
Command: unicycler -1 sample_01_R1_paired.fq.gz -2 sample_01_R2_paired.fq.gz -o assembly/

2024-01-15 10:23:45 - Starting Unicycler
2024-01-15 10:23:45 - Checking dependencies
2024-01-15 10:23:46 - SPAdes version: 3.15.5
2024-01-15 10:23:46 - Racon version: 1.5.0
2024-01-15 10:23:47 - Loading reads
2024-01-15 10:23:52 - Read count: 2,394,012 pairs
2024-01-15 10:24:15 - Running SPAdes assembly
2024-01-15 10:35:23 - SPAdes assembly complete
...`,
		// FastQC HTML (simplified)
		'_fastqc.html': `<!DOCTYPE html>
<html>
<head><title>FastQC Report</title></head>
<body>
<h1>FastQC Report - sample_01_R1</h1>
<h2>Basic Statistics</h2>
<table>
  <tr><td>Filename</td><td>sample_01_R1.fastq.gz</td></tr>
  <tr><td>Total Sequences</td><td>2,456,789</td></tr>
  <tr><td>Sequence length</td><td>150</td></tr>
  <tr><td>%GC</td><td>52</td></tr>
</table>
...`,
		// TSV report
		'.tsv': `#Sample	Total_Reads	Mapped_Reads	Coverage	GC_Content
sample_01	2456789	2394012	97.44	52.3
sample_02	2489123	2421456	97.28	51.9
sample_03	2512456	2445678	97.34	52.1
...`,
		// GFF annotation
		'.gff': `##gff-version 3
##sequence-region chromosome_1 1 4892156
chromosome_1	Prokka	gene	1	1350	.	+	.	ID=gene_0001;Name=dnaA
chromosome_1	Prokka	CDS	1	1350	.	+	0	ID=CDS_0001;Parent=gene_0001;product=Chromosomal replication initiator protein DnaA
chromosome_1	Prokka	gene	1524	2624	.	+	.	ID=gene_0002;Name=dnaN
chromosome_1	Prokka	CDS	1524	2624	.	+	0	ID=CDS_0002;Parent=gene_0002;product=Beta sliding clamp
chromosome_1	Prokka	gene	2801	3901	.	+	.	ID=gene_0003;Name=recF
chromosome_1	Prokka	CDS	2801	3901	.	+	0	ID=CDS_0003;Parent=gene_0003;product=DNA replication and repair protein RecF
chromosome_1	Prokka	gene	3978	6311	.	+	.	ID=gene_0004;Name=gyrB
chromosome_1	Prokka	CDS	3978	6311	.	+	0	ID=CDS_0004;Parent=gene_0004;product=DNA gyrase subunit B
...`,
		// GenBank format
		'.gbk': `LOCUS       chromosome_1         4892156 bp    DNA     circular BCT 15-JAN-2024
DEFINITION  Klebsiella pneumoniae strain sample_01 chromosome, complete genome.
ACCESSION   CP000001
VERSION     CP000001.1
KEYWORDS    .
SOURCE      Klebsiella pneumoniae
  ORGANISM  Klebsiella pneumoniae
            Bacteria; Proteobacteria; Gammaproteobacteria; Enterobacterales;
            Enterobacteriaceae; Klebsiella.
FEATURES             Location/Qualifiers
     source          1..4892156
                     /organism="Klebsiella pneumoniae"
                     /mol_type="genomic DNA"
                     /strain="sample_01"
...`,
		// AMR report
		'amr_report.tsv': `#FILE	SEQUENCE	START	END	STRAND	GENE	COVERAGE	IDENTITY	DATABASE	ACCESSION	PRODUCT	RESISTANCE
sample_01	chromosome	123456	124789	+	blaSHV-11	100.00	99.89	CARD	ARO:3000839	SHV-11 beta-lactamase	ampicillin;amoxicillin
sample_01	chromosome	234567	235890	+	oqxA	100.00	98.76	CARD	ARO:3002999	multidrug efflux pump	quinolone
sample_01	plasmid_1	12345	14567	+	blaCTX-M-15	100.00	100.00	CARD	ARO:3000096	CTX-M-15 extended-spectrum beta-lactamase	cefotaxime;ceftazidime
...`,
		// Default text file
		'.txt': `Analysis Summary
================
Sample: sample_01
Date: 2024-01-15
Status: Complete

Quality metrics passed all thresholds.
Assembly completed successfully.
Annotation identified 4,523 coding sequences.
...`
	};

	function handleFileView(cmd: string, args: string[]) {
		if (args.length === 0) {
			terminal.writeln(`\x1b[31m${cmd}: missing file operand\x1b[0m`);
			return;
		}

		const filename = args[0];
		const filesystem = getFilesystem();

		// Resolve the path
		let fullPath: string;
		let dirPath: string;
		let baseName: string;

		if (filename.includes('/')) {
			// Path includes directory
			const parts = filename.split('/');
			baseName = parts.pop() || '';
			const relativeDirPath = parts.join('/');
			dirPath = relativeDirPath.startsWith('/')
				? relativeDirPath
				: `${currentDir}/${relativeDirPath}`.replace(/\/+/g, '/');
			fullPath = `${dirPath}/${baseName}`;
		} else {
			baseName = filename;
			dirPath = currentDir;
			fullPath = `${currentDir}/${filename}`;
		}

		// Check if file exists in filesystem
		const filesInDir = filesystem[dirPath] || [];
		const fileExists = filesInDir.some(f => f === baseName || f === baseName + '/');

		if (!fileExists) {
			terminal.writeln(`\x1b[31m${cmd}: ${filename}: No such file or directory\x1b[0m`);
			return;
		}

		// Check if it's a directory
		if (filesInDir.includes(baseName + '/')) {
			terminal.writeln(`\x1b[31m${cmd}: ${filename}: Is a directory\x1b[0m`);
			return;
		}

		// Get file content based on extension or name
		let content: string | null = null;

		// Check for exact filename matches first
		for (const [key, value] of Object.entries(fileContents)) {
			if (baseName === key || baseName.endsWith(key)) {
				content = value;
				break;
			}
		}

		// If no match, try extension
		if (!content) {
			const ext = '.' + baseName.split('.').pop();
			content = fileContents[ext] || null;
		}

		// Special handling for specific file types
		if (!content) {
			if (baseName.endsWith('.fastq.gz') || baseName.endsWith('.fq.gz')) {
				content = fileContents['.fastq.gz'];
			} else if (baseName.endsWith('.fasta') || baseName.endsWith('.fna') || baseName.endsWith('.faa') || baseName.endsWith('.ffn')) {
				content = fileContents['assembly.fasta'];
			} else if (baseName.endsWith('.gfa')) {
				content = fileContents['assembly.gfa'];
			} else if (baseName.endsWith('.log')) {
				content = fileContents['unicycler.log'];
			} else if (baseName.endsWith('.html')) {
				content = fileContents['_fastqc.html'];
			} else if (baseName.endsWith('.tsv')) {
				content = fileContents['.tsv'];
			} else if (baseName.endsWith('.gff')) {
				content = fileContents['.gff'];
			} else if (baseName.endsWith('.gbk')) {
				content = fileContents['.gbk'];
			} else if (baseName.endsWith('.png') || baseName.endsWith('.svg')) {
				terminal.writeln(`\x1b[90m[Binary image file - cannot display in terminal]\x1b[0m`);
				terminal.writeln(`\x1b[90mFile: ${baseName}\x1b[0m`);
				return;
			} else if (baseName.endsWith('.zip')) {
				terminal.writeln(`\x1b[90m[Compressed archive - cannot display in terminal]\x1b[0m`);
				terminal.writeln(`\x1b[90mFile: ${baseName}\x1b[0m`);
				return;
			} else {
				content = fileContents['.txt'];
			}
		}

		// Display the content
		if (content) {
			const lines = content.split('\n');
			const maxLines = cmd === 'head' ? 10 : (cmd === 'tail' ? 10 : lines.length);
			const startLine = cmd === 'tail' ? Math.max(0, lines.length - maxLines) : 0;

			for (let i = startLine; i < Math.min(startLine + maxLines, lines.length); i++) {
				terminal.writeln(lines[i]);
			}
		}
	}

	async function executeBioTool(tool: string, args: string[], fullCmd: string) {
		isExecuting = true;
		const times = toolExecutionTimes[tool] || { min: 5, max: 15 };
		const execTime = Math.floor(Math.random() * (times.max - times.min + 1)) + times.min;

		// Update terminal state for output panel
		terminalState.set({
			isRunning: true,
			currentCommand: fullCmd,
			progress: 0,
			estimatedTime: execTime
		});

		// Show tool startup with disclaimer
		terminal.writeln(`\x1b[36m[${tool}]\x1b[0m Starting analysis...`);
		terminal.writeln(`\x1b[90mEstimated time: ~${execTime}s (Press Ctrl+C to cancel)\x1b[0m`);
		terminal.writeln(`\x1b[90;3m(Note: This is a simulated duration. Real analysis may take minutes to hours.)\x1b[0m`);
		terminal.writeln('');

		// Get dynamic tool output
		const toolData = getToolOutput(tool, args, fullCmd);
		const outputLines = toolData?.output?.split('\n') || [];
		const interval = (execTime * 1000) / Math.max(outputLines.length, 10);

		let wasCancelled = false;
		for (let i = 0; i < outputLines.length; i++) {
			await sleep(interval);
			if (!isExecuting) {
				wasCancelled = true;
				break;
			}

			terminal.writeln(outputLines[i]);
			const progress = Math.floor(((i + 1) / outputLines.length) * 100);
			terminalState.update(s => ({ ...s, progress }));
		}

		if (wasCancelled) {
			// Tool was cancelled - don't add files to filesystem
			terminal.writeln('');
			terminal.writeln(`\x1b[33m⚠ ${tool} cancelled by user\x1b[0m`);
			terminal.writeln(`\x1b[90mNo output files were created.\x1b[0m`);
		} else if (toolData) {
			// Track executed command for dynamic filesystem
			executedCommands.update(cmds => {
				if (!cmds.includes(tool)) {
					return [...cmds, tool];
				}
				return cmds;
			});

			// Update output panel with results
			outputData.set({
				type: tool,
				title: `${tool.charAt(0).toUpperCase() + tool.slice(1)} Results`,
				tool: fullCmd,
				summary: toolData.summary,
				chartData: toolData.chartData,
				files: toolData.files
			});

			terminal.writeln('');
			terminal.writeln(`\x1b[32m✓ Analysis complete\x1b[0m`);
		}

		isExecuting = false;
		terminalState.set({ isRunning: false, currentCommand: '', progress: 100, estimatedTime: 0 });
		writePrompt();
	}

	function sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	onMount(async () => {
		const { Terminal } = await import('@xterm/xterm');
		const { FitAddon } = await import('@xterm/addon-fit');
		const { WebLinksAddon } = await import('@xterm/addon-web-links');
		await import('@xterm/xterm/css/xterm.css');

		terminal = new Terminal(terminalOptions);
		fitAddon = new FitAddon();
		const webLinksAddon = new WebLinksAddon();

		terminal.loadAddon(fitAddon);
		terminal.loadAddon(webLinksAddon);
		terminal.open(terminalContainer);

		setTimeout(() => fitAddon.fit(), 0);

		resizeObserver = new ResizeObserver(() => {
			fitAddon.fit();
		});
		resizeObserver.observe(terminalContainer);

		// Subscribe to stop signal
		stopUnsubscribe = stopSignal.subscribe(() => {
			if (isExecuting) {
				isExecuting = false;
			}
		});

		// Welcome message
		terminal.writeln('\x1b[1;36m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
		terminal.writeln('\x1b[1;36m║\x1b[0m   \x1b[1;32mBioLearn\x1b[0m - Bioinformatics Learning Terminal             \x1b[1;36m║\x1b[0m');
		terminal.writeln('\x1b[1;36m║\x1b[0m   Type \x1b[33mhelp\x1b[0m for available commands                         \x1b[1;36m║\x1b[0m');
		terminal.writeln('\x1b[1;36m║\x1b[0m   Use ↑/↓ for history, Tab for autocomplete               \x1b[1;36m║\x1b[0m');
		terminal.writeln('\x1b[1;36m╚═══════════════════════════════════════════════════════════╝\x1b[0m');
		writePrompt();

		terminal.onData(handleInput);
	});

	onDestroy(() => {
		if (stopUnsubscribe) stopUnsubscribe();
		if (resizeObserver) resizeObserver.disconnect();
		if (terminal) terminal.dispose();
	});
</script>

<div class="flex flex-col h-full bg-gray-900 overflow-hidden">
	<!-- Command bar -->
	<div class="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-gray-800 border-b border-gray-700 text-xs">
		<span class="text-gray-400">Commands:</span>
		<div class="flex gap-1 flex-wrap">
			{#each ['ls', 'cd', 'pwd', 'cat', 'head', 'tail', 'clear', 'help'] as cmd}
				<span class="px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded text-[10px]">{cmd}</span>
			{/each}
		</div>
	</div>
	<!-- Terminal -->
	<div bind:this={terminalContainer} class="flex-1 min-h-0 bg-[#1e1e1e] overflow-hidden"></div>
</div>

<style>
	:global(.xterm) {
		padding: 8px;
		height: 100%;
	}

	:global(.xterm-screen) {
		height: 100% !important;
	}

	:global(.xterm-viewport) {
		overflow-y: scroll !important;
	}

	:global(.xterm-viewport::-webkit-scrollbar) {
		width: 10px;
	}

	:global(.xterm-viewport::-webkit-scrollbar-track) {
		background: #2d2d2d;
	}

	:global(.xterm-viewport::-webkit-scrollbar-thumb) {
		background: #555;
		border-radius: 5px;
	}

	:global(.xterm-viewport::-webkit-scrollbar-thumb:hover) {
		background: #777;
	}
</style>
