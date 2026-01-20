<script lang="ts">
	import { onMount } from 'svelte';
	import Terminal from './Terminal.svelte';
	import StoryPanel from './StoryPanel.svelte';
	import OutputPanel from './OutputPanel.svelte';
	import { executedCommands, storylineDataDir, currentDirectory } from '$lib/stores/terminal';
	import type { Storyline } from '$lib/storylines/wgs-bacteria';

	let {
		storyContent = '',
		currentStep = 0,
		outputData = null,
		storyline = null
	}: {
		storyContent?: string;
		currentStep?: number;
		outputData?: any;
		storyline?: Storyline | null;
	} = $props();

	// Check if this is a report page based on storyline technology
	const isReportPage = $derived(storyline?.technology === 'r-report');

	let terminalHeight = $state(70); // percentage
	let isResizing = $state(false);
	let filesDropdownOpen = $state(false);
	let allGeneratedFiles = $state<{name: string, type: string, tool: string}[]>([]);

	// File contents for viewing
	const fileContents: Record<string, string> = {
		'o_seqkit_stats.txt': `file\tformat\ttype\tnum_seqs\tsum_len\tmin_len\tavg_len\tmax_len\nSRR36708862_1.fastq.gz\tFASTQ\tDNA\t990,478\t268,416,273\t35\t271\t301\nSRR36708862_2.fastq.gz\tFASTQ\tDNA\t990,478\t268,449,364\t35\t271\t301`,
		// FastQC reports - loaded from static folder (real FastQC output format)
		'sample_01_R1_fastqc.html': 'FASTQC_STATIC',
		'sample_01_R2_fastqc.html': 'FASTQC_STATIC',
		'assembly.fasta': `>contig_1 length=837178 depth=45.2x\nATGCGTACGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT\nGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC\n>contig_2 length=721456 depth=44.8x\nATGCGTACGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT\n>contig_3 length=512089 depth=46.1x\nGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC\n... (65 contigs total)`,
		'assembly.gfa': `H\tVN:Z:1.0\nS\t1\tATGCGTACGTAGCTAGCTAGCTAGCTAGCT\tLN:i:837178\nS\t2\tGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC\tLN:i:721456\nS\t3\tATGCGTACGTAGCTAGCTAGCTAGCTAGCT\tLN:i:512089\nL\t1\t+\t2\t+\t0M\nL\t2\t+\t3\t+\t0M\n... (65 segments, 78 links)`,
		'unicycler.log': `
Unicycler v0.5.0
Command: unicycler -1 sample_01_R1_paired.fq.gz -2 sample_01_R2_paired.fq.gz -o o_unicycler/

[2024-01-15 10:23:45] Starting Unicycler
[2024-01-15 10:23:45] Loading reads
[2024-01-15 10:24:12] Building assembly graph with SPAdes
[2024-01-15 10:38:45] SPAdes assembly complete
[2024-01-15 10:38:46] Cleaning graph
[2024-01-15 10:39:02] Bridging graph
[2024-01-15 10:45:23] Polishing assembly
[2024-01-15 10:52:18] Assembly complete

Assembly Statistics:
  Total length: 5,553,065 bp
  Number of contigs: 65
  Largest contig: 837,178 bp
  N50: 371,705 bp
  GC content: 57.18%

Component summary:
  1 linear component (chromosome - incomplete)
  3 circular components (plasmids)
    - ColRNAI: 5,409 bp
    - Col(pHAD28): 4,315 bp
    - Col156: 2,532 bp
`,
		'quast_report.html': `<!DOCTYPE html><html><head><title>QUAST Report</title><style>body{font-family:Arial,sans-serif;margin:20px;background:#f5f5f5;} .container{max-width:800px;margin:0 auto;background:white;padding:20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);} h1{color:#333;border-bottom:2px solid #4CAF50;padding-bottom:10px;} table{border-collapse:collapse;width:100%;margin-top:20px;} td,th{border:1px solid #ddd;padding:12px;text-align:left;} th{background:#4CAF50;color:white;} tr:nth-child(even){background:#f9f9f9;} tr:hover{background:#f1f1f1;} .metric{font-weight:bold;}</style></head><body><div class="container"><h1>QUAST Report - assembly</h1><table><tr><th>Metric</th><th>Value</th></tr><tr><td class="metric"># contigs (>= 0 bp)</td><td>117</td></tr><tr><td class="metric"># contigs (>= 1000 bp)</td><td>57</td></tr><tr><td class="metric"># contigs (>= 5000 bp)</td><td>33</td></tr><tr><td class="metric"># contigs (>= 10000 bp)</td><td>29</td></tr><tr><td class="metric"># contigs (>= 25000 bp)</td><td>24</td></tr><tr><td class="metric"># contigs (>= 50000 bp)</td><td>18</td></tr><tr><td class="metric">Total length (>= 0 bp)</td><td>5,564,255</td></tr><tr><td class="metric">Total length (>= 1000 bp)</td><td>5,547,651</td></tr><tr><td class="metric"># contigs</td><td>65</td></tr><tr><td class="metric">Largest contig</td><td>837,178</td></tr><tr><td class="metric">Total length</td><td>5,553,065</td></tr><tr><td class="metric">GC (%)</td><td>57.18</td></tr><tr><td class="metric">N50</td><td>371,705</td></tr><tr><td class="metric">N75</td><td>224,673</td></tr><tr><td class="metric">L50</td><td>6</td></tr><tr><td class="metric">L75</td><td>10</td></tr><tr><td class="metric"># N's per 100 kbp</td><td>0.00</td></tr></table></div></body></html>`,
		'quast_report.tsv': `Assembly\tassembly\n# contigs (>= 0 bp)\t117\n# contigs (>= 1000 bp)\t57\n# contigs (>= 5000 bp)\t33\n# contigs (>= 10000 bp)\t29\n# contigs (>= 25000 bp)\t24\n# contigs (>= 50000 bp)\t18\nTotal length (>= 0 bp)\t5564255\nTotal length (>= 1000 bp)\t5547651\n# contigs\t65\nLargest contig\t837178\nTotal length\t5553065\nGC (%)\t57.18\nN50\t371705\nN75\t224673\nL50\t6\nL75\t10\n# N's per 100 kbp\t0.00`,
		'amr_report.tsv': `#FILE\tSEQUENCE\tGENE\t%IDENTITY\tRESISTANCE\nassembly.fasta\tcontig_1\tblaCTX-M-15\t99.89\tCephalosporin\nassembly.fasta\tcontig_2\ttet(A)\t100.00\tTetracycline`,
		'amr_summary.txt': `AMR Gene Summary\n================\nTotal genes found: 2\n\n1. blaCTX-M-15 - Cephalosporin resistance\n2. tet(A) - Tetracycline resistance`,
		// CheckM files
		'checkm_report.tsv': `Bin Id\tMarker lineage\tCompleteness\tContamination\tStrain heterogeneity\nassembly\tf__Enterobacteriaceae\t99.45\t0.28\t0.00`,
		// ConFindr files
		'confindr_report.csv': `Sample,Genus,NumContamSNVs,ContamStatus,PercentContam\nsample_01,Escherichia,0,False,0.00`,
		'confindr_log.txt': `[2024-01-15 11:35:00] ConFindr v0.8.0\n[2024-01-15 11:35:01] Analyzing sample_01\n[2024-01-15 11:35:15] rMLST genes extracted: 53/53\n[2024-01-15 11:35:20] No contamination detected\n[2024-01-15 11:35:20] Analysis complete`,
		// Prokka files
		'sample_01.gff': `##gff-version 3\n##sequence-region chromosome_1 1 4892156\nchromosome_1\tProkka\tgene\t1\t1350\t.\t+\t.\tID=gene_0001;Name=dnaA\nchromosome_1\tProkka\tCDS\t1\t1350\t.\t+\t0\tID=CDS_0001;product=Chromosomal replication initiator`,
		'sample_01.gbk': `LOCUS       chromosome_1         4892156 bp    DNA     circular BCT 15-JAN-2024\nDEFINITION  Escherichia coli strain sample_01 chromosome\nFEATURES             Location/Qualifiers\n     source          1..4892156\n                     /organism="Escherichia coli"`,
		'sample_01.txt': `organism: Escherichia coli sample_01\ncontigs: 2\nbases: 4987390\nCDS: 4523\ntRNA: 86\nrRNA: 22`,
		// Bakta files
		'sample_01.gff3': `##gff-version 3\n##sequence-region chromosome_1 1 4892156\nchromosome_1\tBakta\tgene\t1\t1350\t.\t+\t.\tID=gene_0001;Name=dnaA;locus_tag=SAMPLE01_00001\nchromosome_1\tBakta\tCDS\t1\t1350\t.\t+\t0\tID=cds_0001;product=Chromosomal replication initiator protein DnaA`,
		'sample_01.gbff': `LOCUS       chromosome_1         4892156 bp    DNA     circular BCT 15-JAN-2024\nDEFINITION  Escherichia coli strain sample_01, complete genome.\nACCESSION   .\nVERSION     .\nKEYWORDS    .\nSOURCE      Escherichia coli\n  ORGANISM  Escherichia coli`,
		'sample_01.faa': `>SAMPLE01_00001 Chromosomal replication initiator protein DnaA\nMSLSLWQQCLARLQDELPAIPSEIIEMEKKPSTNATVGRPLRWLVDKILEQEKKTPDVVTH\n>SAMPLE01_00002 DNA polymerase III subunit beta\nMKFTVERINQGYLDGLSQRLQMRSGVVASPHDPAAAMIRQSQHLTDRLVNDLVGALEIATR`,
		'sample_01.tsv': `locus_tag\ttype\tstart\tend\tstrand\tgene\tproduct\nSAMPLE01_00001\tCDS\t1\t1350\t+\tdnaA\tChromosomal replication initiator protein DnaA\nSAMPLE01_00002\tCDS\t1524\t2624\t+\tdnaN\tDNA polymerase III subunit beta`,
		'sample_01.json': `{"version":"1.8.2","genome":{"length":4987390,"contigs":2,"gc":52.3},"features":{"CDS":4623,"tRNA":86,"rRNA":22,"ncRNA":89,"CRISPR":2}}`,
		// MLST files
		'o_mlst.tab': `o_unicycler/assembly.fasta\tklebsiella\t307\tgapA(4)\tinfB(1)\tmdh(2)\tpgi(52)\tphoE(1)\trpoB(1)\ttonB(7)`,
		// Phase 3: MOB-suite files
		'plasmid_report.tsv': `sample_id\tnum_contigs\ttotal_length\tplasmid_id\treplicon_type\tmobility\nchromosome\t1\t4892156\t-\t-\t-\nplasmid_1\t1\t95234\tAA001\tIncFIB(K),IncFII(K)\tconjugative`,
		'mobtyper_results.txt': `MOB-typer Results\n=================\nPlasmid: AA001\nSize: 95,234 bp\nReplicon type: IncFIB(K), IncFII(K)\nMobility: Conjugative\nRelaxase: MOBF\nMate-pair formation: MPF_F`,
		// Phase 3: Platon files
		'plasmid_predictions.tsv': `contig_id\tlength\tplasmid_score\tprediction\ncontig_1\t4892156\t0.023\tchromosome\ncontig_2\t95234\t0.987\tplasmid`,
		// Phase 4: Snippy files
		'snps.vcf': `##fileformat=VCFv4.2\n##source=snippy\n#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\nchromosome\t12345\t.\tA\tG\t999\tPASS\tDP=78`,
		'snps.tab': `CHROM\tPOS\tTYPE\tREF\tALT\tEFFECT\nchromosome\t12345\tsnp\tA\tG\tsynonymous_variant`,
		// Phase 4: Roary files
		'gene_presence_absence.csv': `Gene,Non-unique,Fragments,sample_01,sample_02,sample_03,reference\ndnaA,0,0,1,1,1,1\ndnaN,0,0,1,1,1,1`,
		'summary_statistics.txt': `Core genes: 3987\nSoft-core genes: 312\nShell genes: 489\nCloud genes: 446\nTotal genes: 5234`,
		// Phase 4: IQ-TREE files
		'core_alignment.treefile': `((sample_01:0.0012,sample_02:0.0008):0.0045,(sample_03:0.0023,reference:0.0089):0.0034);`,
		'core_alignment.iqtree': `IQ-TREE 2.2.0\nBest-fit model: GTR+F+I+G4\nLog-likelihood: -22345.678\nBootstrap support: >=98% for all nodes`,
		// Phase 4: Gubbins files
		'recombination_predictions.gff': `##gff-version 3\nchromosome\tGubbins\trecombination\t234567\t245678\t.\t+\t.\tID=rec_1`,
		'clean.summary.txt': `Gubbins Analysis\nRecombinant regions: 21\nBases affected: 43234 (1.25%)\nClean SNPs: 10234`
	};

	// Tool to files mapping
	const toolFiles: Record<string, {name: string, type: string}[]> = {
		'seqkit': [{ name: 'o_seqkit_stats.txt', type: 'txt' }],
		'fastqc': [
			{ name: 'sample_01_R1_fastqc.html', type: 'html' },
			{ name: 'sample_01_R2_fastqc.html', type: 'html' },
			{ name: 'sample_01_R1_fastqc.zip', type: 'zip' },
			{ name: 'sample_01_R2_fastqc.zip', type: 'zip' }
		],
		'trimmomatic': [
			{ name: 'sample_01_R1_paired.fq.gz', type: 'fastq' },
			{ name: 'sample_01_R2_paired.fq.gz', type: 'fastq' },
			{ name: 'sample_01_R1_unpaired.fq.gz', type: 'fastq' },
			{ name: 'sample_01_R2_unpaired.fq.gz', type: 'fastq' }
		],
		'unicycler': [
			{ name: 'assembly.fasta', type: 'fasta' },
			{ name: 'assembly.gfa', type: 'gfa' },
			{ name: 'unicycler.log', type: 'log' }
		],
		'bandage': [{ name: 'o_bandage.png', type: 'png' }],
		'quast': [
			{ name: 'quast_report.html', type: 'html' },
			{ name: 'quast_report.tsv', type: 'tsv' }
		],
		'checkm': [
			{ name: 'checkm_report.tsv', type: 'tsv' }
		],
		'confindr': [
			{ name: 'confindr_report.csv', type: 'csv' },
			{ name: 'confindr_log.txt', type: 'txt' }
		],
		'prokka': [
			{ name: 'sample_01.gff', type: 'gff' },
			{ name: 'sample_01.gbk', type: 'gbk' },
			{ name: 'sample_01.txt', type: 'txt' }
		],
		'bakta': [
			{ name: 'sample_01.gff3', type: 'gff' },
			{ name: 'sample_01.gbff', type: 'gbk' },
			{ name: 'sample_01.faa', type: 'faa' },
			{ name: 'sample_01.tsv', type: 'tsv' },
			{ name: 'sample_01.json', type: 'json' }
		],
		'abricate': [
			{ name: 'amr_report.tsv', type: 'tsv' },
			{ name: 'amr_summary.txt', type: 'txt' }
		],
		'mlst': [
			{ name: 'o_mlst.tab', type: 'tsv' }
		],
		// Phase 3: Plasmid Analysis
		'mob_recon': [
			{ name: 'plasmid_report.tsv', type: 'tsv' },
			{ name: 'chromosome.fasta', type: 'fasta' },
			{ name: 'plasmid_AA001.fasta', type: 'fasta' },
			{ name: 'mobtyper_results.txt', type: 'txt' }
		],
		'platon': [
			{ name: 'plasmid_predictions.tsv', type: 'tsv' },
			{ name: 'plasmid_sequences.fasta', type: 'fasta' },
			{ name: 'chromosome_sequences.fasta', type: 'fasta' }
		],
		// Phase 4: Phylogenetics
		'snippy': [
			{ name: 'snps.vcf', type: 'vcf' },
			{ name: 'snps.tab', type: 'tsv' },
			{ name: 'snps.aligned.fa', type: 'fasta' },
			{ name: 'snps.consensus.fa', type: 'fasta' }
		],
		'roary': [
			{ name: 'gene_presence_absence.csv', type: 'csv' },
			{ name: 'core_gene_alignment.aln', type: 'aln' },
			{ name: 'summary_statistics.txt', type: 'txt' }
		],
		'iqtree': [
			{ name: 'core_alignment.treefile', type: 'nwk' },
			{ name: 'core_alignment.iqtree', type: 'txt' },
			{ name: 'core_alignment.log', type: 'log' }
		],
		'gubbins': [
			{ name: 'recombination_predictions.gff', type: 'gff' },
			{ name: 'clean.core.aln', type: 'aln' },
			{ name: 'clean.final_tree.tre', type: 'nwk' },
			{ name: 'clean.summary.txt', type: 'txt' }
		]
	};

	onMount(() => {
		// Set the storyline's data directory in stores so Terminal knows where to start
		const dataDir = storyline?.dataDir || '/data/outbreak_investigation';
		storylineDataDir.set(dataDir);
		currentDirectory.set(dataDir);

		const unsubscribe = executedCommands.subscribe(cmds => {
			const files: {name: string, type: string, tool: string}[] = [];
			cmds.forEach(tool => {
				const toolFileList = toolFiles[tool];
				if (toolFileList) {
					toolFileList.forEach(f => {
						files.push({ ...f, tool });
					});
				}
			});
			allGeneratedFiles = files;
		});
		return unsubscribe;
	});

	async function viewFile(file: {name: string, type: string}) {
		const content = fileContents[file.name];

		// Handle FastQC HTML files - fetch from static folder
		if (file.type === 'html' && content === 'FASTQC_STATIC') {
			try {
				const response = await fetch(`/fastqc/${file.name}`);
				if (response.ok) {
					const htmlContent = await response.text();
					const newWindow = window.open('', '_blank');
					if (newWindow) {
						newWindow.document.write(htmlContent);
						newWindow.document.close();
					}
				} else {
					alert(`Could not load ${file.name}`);
				}
			} catch (error) {
				alert(`Error loading ${file.name}`);
			}
		} else if (file.type === 'html' && content) {
			const newWindow = window.open('', '_blank');
			if (newWindow) {
				newWindow.document.write(content);
				newWindow.document.close();
			}
		} else if (content) {
			alert(`File: ${file.name}\n\n${content}`);
		} else if (file.type === 'png') {
			// Open image in new window
			const newWindow = window.open('', '_blank', 'width=1200,height=900');
			if (newWindow) {
				newWindow.document.write(`
					<!DOCTYPE html>
					<html>
					<head>
						<title>${file.name}</title>
						<style>
							body { margin: 0; padding: 20px; background: #1a1a2e; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
							img { max-width: 100%; max-height: 90vh; object-fit: contain; }
						</style>
					</head>
					<body>
						<img src="/images/${file.name}" alt="${file.name}" />
					</body>
					</html>
				`);
				newWindow.document.close();
			}
		} else {
			alert(`${file.name}\n\nThis is a simulated file in the training environment.`);
		}
		filesDropdownOpen = false;
	}

	function startResize(e: MouseEvent) {
		isResizing = true;
		document.addEventListener('mousemove', handleResize);
		document.addEventListener('mouseup', stopResize);
	}

	function handleResize(e: MouseEvent) {
		if (!isResizing) return;
		const container = document.getElementById('left-panel');
		if (!container) return;
		const rect = container.getBoundingClientRect();
		const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
		terminalHeight = Math.max(30, Math.min(85, newHeight));
	}

	function stopResize() {
		isResizing = false;
		document.removeEventListener('mousemove', handleResize);
		document.removeEventListener('mouseup', stopResize);
	}

	function closeDropdown(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.files-dropdown')) {
			filesDropdownOpen = false;
		}
	}
</script>

<svelte:window onclick={closeDropdown} />

<div class="h-screen w-screen flex flex-col overflow-hidden" style="display: flex; flex-direction: column; height: 100vh; width: 100vw;">
	<!-- Top Header Bar -->
	<div class="h-10 bg-gray-800 flex items-center justify-between px-4 border-b border-gray-700" style="display: flex; align-items: center; justify-content: space-between; height: 40px; flex-shrink: 0;">
		<div class="flex items-center gap-2" style="display: flex; align-items: center; gap: 0.5rem;">
			<a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
				<span class="text-green-400 font-bold text-sm">BioLearn</span>
			</a>
			<span class="text-gray-400 text-xs">| Bioinformatics Training Platform</span>
			{#if storyline}
				<span class="text-gray-600 text-xs">|</span>
				<span class="text-blue-400 text-xs">{storyline.title}</span>
			{/if}
		</div>

		<!-- Files Dropdown -->
		<div class="files-dropdown relative" style="position: relative;">
			<button
				class="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
				style="display: flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.75rem; background: #374151; border-radius: 0.25rem; font-size: 0.875rem; color: white; border: none; cursor: pointer;"
				onclick={() => filesDropdownOpen = !filesDropdownOpen}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px;">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
				</svg>
				Output Files ({allGeneratedFiles.length})
				<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 12px; height: 12px;">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{#if filesDropdownOpen}
				<div class="absolute right-0 top-full mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-auto" style="position: absolute; right: 0; top: 100%; margin-top: 0.25rem; width: 18rem; background: white; border-radius: 0.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; z-index: 50; max-height: 24rem; overflow: auto;">
					<!-- Educational warning -->
					<div class="p-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700" style="padding: 0.5rem; background: #fffbeb; border-bottom: 1px solid #fde68a; font-size: 0.75rem; color: #b45309;">
						<span style="font-weight: 500;">Note:</span> Only a few files are included for educational purposes.
					</div>
					{#if allGeneratedFiles.length === 0}
						<div class="p-4 text-gray-500 text-sm text-center" style="padding: 1rem; color: #6b7280; font-size: 0.875rem; text-align: center;">
							No output files yet.<br/>
							<span class="text-xs" style="font-size: 0.75rem;">Run a tool to generate files.</span>
						</div>
					{:else}
						<div class="p-2 bg-gray-50 border-b text-xs text-gray-600 font-medium" style="padding: 0.5rem; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 0.75rem; color: #4b5563; font-weight: 500;">
							{allGeneratedFiles.length} files generated
						</div>
						{#each allGeneratedFiles as file}
							<button
								class="w-full px-3 py-2 flex items-center gap-3 hover:bg-blue-50 text-left border-b border-gray-100 last:border-0"
								style="width: 100%; padding: 0.5rem 0.75rem; display: flex; align-items: center; gap: 0.75rem; text-align: left; border-bottom: 1px solid #f3f4f6; background: white; border-left: none; border-right: none; border-top: none; cursor: pointer;"
								onclick={() => viewFile(file)}
							>
								<span class="text-lg" style="font-size: 1.125rem;">
									{#if file.type === 'html'}📄
									{:else if file.type === 'png'}🖼️
									{:else if file.type === 'zip'}📦
									{:else if file.type === 'fasta' || file.type === 'fastq'}🧬
									{:else if file.type === 'tsv' || file.type === 'txt'}📋
									{:else if file.type === 'log'}📝
									{:else if file.type === 'gfa'}🔗
									{:else}📁{/if}
								</span>
								<div class="flex-1 min-w-0" style="flex: 1; min-width: 0;">
									<p class="text-sm text-gray-800 truncate" style="font-size: 0.875rem; color: #1f2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{file.name}</p>
									<p class="text-xs text-gray-500" style="font-size: 0.75rem; color: #6b7280;">{file.tool} • {file.type.toUpperCase()}</p>
								</div>
								<span class="text-blue-500 text-xs" style="color: #3b82f6; font-size: 0.75rem;">View</span>
							</button>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Main Content -->
	<div class="flex-1 flex overflow-hidden" style="display: flex; flex: 1; overflow: hidden; height: calc(100% - 40px); min-height: 0;">
		<!-- Left Panel: Terminal + Output -->
		<div id="left-panel" class="w-1/2 flex flex-col border-r border-gray-300" style="display: flex; flex-direction: column; width: 50%; height: 100%; min-height: 0;">
		<!-- Terminal -->
		<div
			class="terminal-panel overflow-hidden"
			style="height: {terminalHeight}%; min-height: 0; overflow: hidden; flex-shrink: 0;"
		>
			<Terminal initialDir={storyline?.dataDir || '/data/outbreak_investigation'} />
		</div>

		<!-- Resize Handle -->
		<div
			class="h-1 bg-gray-600 cursor-row-resize hover:bg-blue-500 transition-colors"
			style="height: 4px; background: #4b5563; cursor: row-resize; flex-shrink: 0;"
			onmousedown={startResize}
			role="separator"
			aria-orientation="horizontal"
			tabindex="0"
		></div>

		<!-- Output Panel -->
		<div
			class="output-panel overflow-auto"
			style="height: {100 - terminalHeight}%; min-height: 0; overflow: auto; flex: 1;"
		>
			<OutputPanel {isReportPage} />
		</div>
	</div>

		<!-- Right Panel: Story -->
		<div class="w-1/2 story-panel overflow-auto" style="width: 50%; height: 100%; overflow: auto;">
			<StoryPanel {storyline} />
		</div>
	</div>
</div>

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
