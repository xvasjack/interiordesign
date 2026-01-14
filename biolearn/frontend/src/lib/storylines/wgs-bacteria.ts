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
	technologyLabel: string; // Display label like "Short Read (Illumina)" or "Long Read (PacBio)"
	dataDir: string; // Initial directory for terminal (e.g., '/data/outbreak_investigation')
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
			text: 'Assess raw sequencing data quality and assemble the genome for all 3 patient isolates.',
			phase: 1
		},
		{
			type: 'task',
			title: 'Step 1: Explore the Data',
			text: `Check the sequencing data statistics for all patient samples.`,
			command: 'seqkit stats *.fastq.gz',
			explanation: 'SeqKit provides quick statistics about sequencing files. Using wildcard (*) processes all FASTQ files at once.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: 'stats', desc: 'Generate sequence statistics' },
				{ name: '*.fastq.gz', desc: 'Wildcard matching all FASTQ files' }
			]
		},
		{
			type: 'task',
			title: 'Step 2: Quality Control',
			text: `Generate quality reports for all raw reads.`,
			command: 'fastqc *.fastq.gz -o qc_reports/',
			explanation: 'FastQC identifies quality issues before assembly. Running on all samples simultaneously.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '*.fastq.gz', desc: 'All FASTQ files' },
				{ name: '-o qc_reports/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 3: Aggregate QC Reports',
			text: `Combine all FastQC reports into a single summary.`,
			command: 'multiqc qc_reports/ -o multiqc_output/',
			explanation: 'MultiQC aggregates results from multiple samples for easy comparison.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: 'qc_reports/', desc: 'Input directory with FastQC reports' },
				{ name: '-o multiqc_output/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 4: Read Trimming (Patient 01)',
			text: `Remove adapters and low-quality bases from Patient 01 reads.`,
			command: 'trimmomatic PE -phred33 patient_01_R1.fastq.gz patient_01_R2.fastq.gz trimmed/patient_01_R1_paired.fq.gz trimmed/patient_01_R1_unpaired.fq.gz trimmed/patient_01_R2_paired.fq.gz trimmed/patient_01_R2_unpaired.fq.gz ILLUMINACLIP:TruSeq3-PE.fa:2:30:10 SLIDINGWINDOW:4:15 MINLEN:36',
			explanation: 'Trimmomatic removes adapter contamination and low quality bases. Processing Patient 01.',
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
			title: 'Step 5: Read Trimming (Patient 02)',
			text: `Trim Patient 02 reads.`,
			command: 'trimmomatic PE -phred33 patient_02_R1.fastq.gz patient_02_R2.fastq.gz trimmed/patient_02_R1_paired.fq.gz trimmed/patient_02_R1_unpaired.fq.gz trimmed/patient_02_R2_paired.fq.gz trimmed/patient_02_R2_unpaired.fq.gz ILLUMINACLIP:TruSeq3-PE.fa:2:30:10 SLIDINGWINDOW:4:15 MINLEN:36',
			explanation: 'Processing Patient 02 with the same trimming parameters.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: 'PE', desc: 'Paired-end mode' }
			]
		},
		{
			type: 'task',
			title: 'Step 6: Read Trimming (Patient 03)',
			text: `Trim Patient 03 reads.`,
			command: 'trimmomatic PE -phred33 patient_03_R1.fastq.gz patient_03_R2.fastq.gz trimmed/patient_03_R1_paired.fq.gz trimmed/patient_03_R1_unpaired.fq.gz trimmed/patient_03_R2_paired.fq.gz trimmed/patient_03_R2_unpaired.fq.gz ILLUMINACLIP:TruSeq3-PE.fa:2:30:10 SLIDINGWINDOW:4:15 MINLEN:36',
			explanation: 'Processing Patient 03 with the same trimming parameters.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: 'PE', desc: 'Paired-end mode' }
			]
		},
		{
			type: 'task',
			title: 'Step 7: Genome Assembly (Patient 01)',
			text: `Assemble cleaned reads into contigs for Patient 01.`,
			command: 'unicycler -1 trimmed/patient_01_R1_paired.fq.gz -2 trimmed/patient_01_R2_paired.fq.gz -o assembly/patient_01/',
			explanation: 'Unicycler produces high-quality bacterial assemblies. Each patient gets a separate assembly.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-1/-2', desc: 'Forward/reverse reads' },
				{ name: '-o assembly/patient_01/', desc: 'Output directory for Patient 01' }
			]
		},
		{
			type: 'task',
			title: 'Step 8: Genome Assembly (Patient 02)',
			text: `Assemble Patient 02.`,
			command: 'unicycler -1 trimmed/patient_02_R1_paired.fq.gz -2 trimmed/patient_02_R2_paired.fq.gz -o assembly/patient_02/',
			explanation: 'Assembling Patient 02 isolate.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-o assembly/patient_02/', desc: 'Output directory for Patient 02' }
			]
		},
		{
			type: 'task',
			title: 'Step 9: Genome Assembly (Patient 03)',
			text: `Assemble Patient 03.`,
			command: 'unicycler -1 trimmed/patient_03_R1_paired.fq.gz -2 trimmed/patient_03_R2_paired.fq.gz -o assembly/patient_03/',
			explanation: 'Assembling Patient 03 isolate.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-o assembly/patient_03/', desc: 'Output directory for Patient 03' }
			]
		},
		{
			type: 'task',
			title: 'Step 10: Visualize Assemblies',
			text: `Create visual representations of all assembly graphs.`,
			command: 'bandage image assembly/patient_01/assembly.gfa assembly/patient_01_graph.png',
			explanation: 'Bandage visualizes assembly graphs to identify structure. Repeat for each patient.',
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
			text: 'Evaluate assembly quality and screen for key markers across all patient isolates.',
			phase: 2
		},
		{
			type: 'task',
			title: 'Step 11: Assembly Quality',
			text: `Assess assembly quality metrics for all patients.`,
			command: 'quast assembly/patient_01/assembly.fasta assembly/patient_02/assembly.fasta assembly/patient_03/assembly.fasta -o quast_results/',
			explanation: 'QUAST calculates N50, total length, and other metrics. Comparing all 3 patient assemblies.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-o quast_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 12: Genome Completeness',
			text: `Check genome completeness using marker genes.`,
			command: 'checkm lineage_wf assembly/ checkm_results/ -x fasta',
			explanation: 'CheckM estimates completeness and contamination for all assemblies.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: 'lineage_wf', desc: 'Full CheckM workflow' },
				{ name: '-x fasta', desc: 'File extension' }
			]
		},
		{
			type: 'task',
			title: 'Step 13: AMR Screening (All Patients)',
			text: `Screen all patient assemblies for antimicrobial resistance genes.`,
			command: 'abricate --db ncbi assembly/patient_01/assembly.fasta assembly/patient_02/assembly.fasta assembly/patient_03/assembly.fasta > abricate_results/all_patients_amr.tsv',
			explanation: 'ABRicate identifies resistance genes. Screening all patients at once for comparison.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--db ncbi', desc: 'Use NCBI database' },
				{ name: '>', desc: 'Redirect output to combined file' }
			]
		},
		{
			type: 'task',
			title: 'Step 14: MLST Typing (All Patients)',
			text: `Determine the sequence type for each isolate. This is critical for outbreak investigation.`,
			command: 'mlst assembly/patient_01/assembly.fasta assembly/patient_02/assembly.fasta assembly/patient_03/assembly.fasta > mlst_results/all_patients_mlst.tsv',
			explanation: 'MLST assigns sequence types for epidemiological tracking. Same ST suggests clonal outbreak.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '>', desc: 'Combined output for all patients' }
			]
		},
		{
			type: 'alert',
			title: '🔍 MLST Results - Key Finding',
			text: `**MLST Typing Results:**\n\n| Patient | Species | Sequence Type |\n|---------|---------|---------------|\n| Patient 01 | K. pneumoniae | ST258 |\n| Patient 02 | K. pneumoniae | ST258 |\n| Patient 03 | K. pneumoniae | ST11 |\n\n**Interpretation:**\n• **Patients 01 & 02 (ST258):** Share the same sequence type - strong evidence of clonal transmission (outbreak cluster)\n• **Patient 03 (ST11):** Different sequence type - likely a sporadic case, NOT part of the outbreak\n\n**ST258 Background:** This is a globally-disseminated high-risk clone associated with hospital outbreaks and carbapenem resistance. ST11 is also clinically significant but represents a separate lineage.\n\nContinue analysis to confirm transmission and identify resistance mechanisms...`
		}
	];
}

function createIlluminaPhase3Sections(): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 3: Annotation & Plasmid Analysis',
			text: 'Annotate genes and identify mobile genetic elements for the outbreak cluster (ST258 isolates).',
			phase: 3
		},
		{
			type: 'context',
			text: `**Focus on Outbreak Cluster**\n\nBased on MLST results, Patients 01 and 02 are part of a clonal outbreak (ST258). We'll perform detailed annotation on these isolates to understand the outbreak strain. Patient 03 (ST11) represents a separate, sporadic case.`
		},
		{
			type: 'task',
			title: 'Step 15: Genome Annotation (Patient 01)',
			text: `Annotate genes in the Patient 01 assembly.`,
			command: 'prokka --outdir prokka_results/patient_01/ --prefix patient_01 assembly/patient_01/assembly.fasta',
			explanation: 'Prokka identifies CDS, tRNA, and rRNA features.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--outdir', desc: 'Output directory' },
				{ name: '--prefix patient_01', desc: 'Output file prefix' }
			]
		},
		{
			type: 'task',
			title: 'Step 16: Genome Annotation (Patient 02)',
			text: `Annotate Patient 02 (second ST258 isolate).`,
			command: 'prokka --outdir prokka_results/patient_02/ --prefix patient_02 assembly/patient_02/assembly.fasta',
			explanation: 'Annotating the second outbreak isolate for comparison.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--outdir', desc: 'Output directory' },
				{ name: '--prefix patient_02', desc: 'Output file prefix' }
			]
		},
		{
			type: 'task',
			title: 'Step 17: Genome Annotation (Patient 03)',
			text: `Annotate Patient 03 (ST11 sporadic case) for comparison.`,
			command: 'prokka --outdir prokka_results/patient_03/ --prefix patient_03 assembly/patient_03/assembly.fasta',
			explanation: 'Annotating the sporadic ST11 isolate to compare AMR profiles.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--outdir', desc: 'Output directory' },
				{ name: '--prefix patient_03', desc: 'Output file prefix' }
			]
		},
		{
			type: 'task',
			title: 'Step 18: Plasmid Detection (ST258 Outbreak)',
			text: `Identify plasmids in the outbreak strain.`,
			command: 'mob_recon -i assembly/patient_01/assembly.fasta -o mob_recon_results/patient_01/',
			explanation: 'MOB-suite reconstructs plasmids carrying AMR genes.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-i', desc: 'Input assembly' },
				{ name: '-o', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 19: Plasmid Typing',
			text: `Identify plasmid replicon types across all patients.`,
			command: 'plasmidfinder -i assembly/patient_01/assembly.fasta -o plasmidfinder_results/',
			explanation: 'PlasmidFinder detects plasmid replicons for epidemiological typing.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-i', desc: 'Input assembly' },
				{ name: '-o plasmidfinder_results/', desc: 'Output directory' }
			]
		}
	];
}

function createIlluminaPhase4Sections(): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 4: Phylogenetics & Transmission Analysis',
			text: 'Build evolutionary trees to confirm outbreak transmission between patients.',
			phase: 4
		},
		{
			type: 'context',
			text: `**Phylogenetic Analysis Goal**\n\nWe need to determine:\n1. Are Patients 01 & 02 truly part of a clonal outbreak? (expect <10 SNP differences)\n2. Is Patient 03 definitely unrelated? (expect >100 SNP differences from outbreak cluster)\n3. What is the likely transmission direction?`
		},
		{
			type: 'task',
			title: 'Step 20: Variant Calling (Patient 01)',
			text: `Call SNPs for Patient 01 against the reference genome.`,
			command: 'snippy --ref reference.gbk --ctgs assembly/patient_01/assembly.fasta --outdir snippy_results/patient_01/',
			explanation: 'Snippy identifies SNPs, insertions, and deletions.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--ref reference.gbk', desc: 'Reference genome' },
				{ name: '--ctgs', desc: 'Query contigs' },
				{ name: '--outdir', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 21: Variant Calling (Patient 02)',
			text: `Call SNPs for Patient 02.`,
			command: 'snippy --ref reference.gbk --ctgs assembly/patient_02/assembly.fasta --outdir snippy_results/patient_02/',
			explanation: 'Calling variants for the second ST258 outbreak isolate.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--outdir', desc: 'Output directory for Patient 02' }
			]
		},
		{
			type: 'task',
			title: 'Step 22: Variant Calling (Patient 03)',
			text: `Call SNPs for Patient 03 (ST11 control).`,
			command: 'snippy --ref reference.gbk --ctgs assembly/patient_03/assembly.fasta --outdir snippy_results/patient_03/',
			explanation: 'Calling variants for the sporadic ST11 isolate as a comparison.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--outdir', desc: 'Output directory for Patient 03' }
			]
		},
		{
			type: 'task',
			title: 'Step 23: Core Genome Alignment',
			text: `Create a core genome alignment from all samples.`,
			command: 'snippy-core --ref reference.gbk snippy_results/patient_01 snippy_results/patient_02 snippy_results/patient_03',
			explanation: 'Snippy-core generates a multiple sequence alignment for phylogenetic analysis.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--ref', desc: 'Reference genome' },
				{ name: 'snippy_results/*', desc: 'All individual snippy outputs' }
			]
		},
		{
			type: 'task',
			title: 'Step 24: Pan-genome Analysis',
			text: `Analyze the pan-genome across all isolates.`,
			command: 'roary -f roary_results/ -e -n -v prokka_results/patient_01/*.gff prokka_results/patient_02/*.gff prokka_results/patient_03/*.gff',
			explanation: 'Roary identifies core genes shared by all isolates and accessory genes.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-f roary_results/', desc: 'Output directory' },
				{ name: '-e', desc: 'Create core gene alignment' },
				{ name: '-n', desc: 'Fast alignment with MAFFT' }
			]
		},
		{
			type: 'task',
			title: 'Step 25: Phylogenetic Tree',
			text: `Build a maximum-likelihood phylogenetic tree.`,
			command: 'iqtree -s core.aln -m GTR+G -bb 1000 -nt AUTO',
			explanation: 'IQ-TREE builds phylogenetic trees with bootstrap support.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-s core.aln', desc: 'Core genome alignment' },
				{ name: '-m GTR+G', desc: 'Substitution model' },
				{ name: '-bb 1000', desc: 'Bootstrap replicates' }
			]
		},
		{
			type: 'alert',
			title: '🌳 Phylogenetic Results - Outbreak Confirmed',
			text: `**SNP Distance Matrix:**\n\n|           | Patient 01 | Patient 02 | Patient 03 |\n|-----------|------------|------------|------------|\n| Patient 01 | 0          | 3          | 847        |\n| Patient 02 | 3          | 0          | 851        |\n| Patient 03 | 847        | 851        | 0          |\n\n**Interpretation:**\n• **Patients 01 & 02:** Only 3 SNP differences - confirms direct transmission or very recent common source\n• **Patient 03:** >800 SNPs difference - completely unrelated, sporadic infection\n\n**Timeline Estimate:**\nAt ~1-2 SNPs/genome/year for K. pneumoniae, 3 SNPs suggests transmission occurred within the past 1-3 weeks - consistent with the ICU timeline.\n\n**Conclusion:** This is a confirmed clonal outbreak involving 2 of 3 patients.`
		}
	];
}

// Hospital-specific additional tools
function createHospitalAdditionalTools(): StorylineSection[] {
	return [
		{
			type: 'task',
			title: 'Step 26: Detailed Resistance Analysis',
			text: `Get detailed resistance gene information for the outbreak strain.`,
			command: 'resfinder -i assembly/patient_01/assembly.fasta -o resfinder_results/patient_01/ -db_res',
			explanation: 'ResFinder provides detailed resistance gene annotations.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '-db_res', desc: 'Use resistance database' }
			]
		},
		{
			type: 'task',
			title: 'Step 27: Integron Detection',
			text: `Find integrons carrying resistance cassettes in the ST258 outbreak strain.`,
			command: 'integron_finder assembly/patient_01/assembly.fasta --outdir integron_results/',
			explanation: 'IntegronFinder detects integrons that often carry AMR genes.',
			requiredDir: '/data/outbreak_investigation',
			parameters: [
				{ name: '--outdir integron_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 28: IS Element Detection',
			text: `Identify insertion sequences for understanding AMR gene mobility.`,
			command: 'isescan --seqfile assembly/patient_01/assembly.fasta --output isescan_results/',
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
// PACBIO HIFI LONG-READ WORKFLOW SECTIONS
// ============================================

function createPacBioPhase1Sections(dataDir: string = '/data/outbreak_investigation'): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 1: Long-Read Quality Control & Assembly',
			text: 'Assess PacBio HiFi read quality and perform de novo assembly.',
			phase: 1
		},
		{
			type: 'task',
			title: 'Step 1: Explore the Data',
			text: `Check the PacBio HiFi sequencing data statistics.`,
			command: 'seqkit stats sample_01_hifi.fastq.gz',
			explanation: 'SeqKit provides quick statistics including read count and N50 length.',
			requiredDir: dataDir,
			parameters: [
				{ name: 'stats', desc: 'Generate sequence statistics' }
			]
		},
		{
			type: 'task',
			title: 'Step 2: Long-Read Quality Assessment',
			text: `Generate comprehensive quality plots for HiFi reads.`,
			command: 'NanoPlot --fastq sample_01_hifi.fastq.gz -o nanoplot_results/ --plots hex dot',
			explanation: 'NanoPlot creates visualizations of read length and quality distributions.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--fastq', desc: 'Input FASTQ file' },
				{ name: '-o nanoplot_results/', desc: 'Output directory' },
				{ name: '--plots hex dot', desc: 'Plot types to generate' }
			]
		},
		{
			type: 'task',
			title: 'Step 3: Filter Low-Quality Reads',
			text: `Remove low-quality and short reads.`,
			command: 'filtlong --min_length 5000 --min_mean_q 20 sample_01_hifi.fastq.gz | gzip > filtered/sample_01_filtered.fastq.gz',
			explanation: 'Filtlong filters reads by length and quality for optimal assembly.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--min_length 5000', desc: 'Minimum read length (bp)' },
				{ name: '--min_mean_q 20', desc: 'Minimum mean quality score' }
			]
		},
		{
			type: 'task',
			title: 'Step 4: Long-Read Assembly',
			text: `Assemble filtered reads using Flye optimized for HiFi data.`,
			command: 'flye --pacbio-hifi filtered/sample_01_filtered.fastq.gz -o assembly/ --threads 8',
			explanation: 'Flye produces high-quality assemblies optimized for long reads.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--pacbio-hifi', desc: 'PacBio HiFi read mode' },
				{ name: '-o assembly/', desc: 'Output directory' },
				{ name: '--threads 8', desc: 'Number of CPU threads' }
			]
		},
		{
			type: 'task',
			title: 'Step 5: Visualize Assembly Graph',
			text: `Examine the assembly graph for circular chromosomes.`,
			command: 'bandage image assembly/assembly.gfa assembly/assembly_graph.png --lengths',
			explanation: 'Bandage visualizes assembly graphs; circular contigs indicate complete chromosomes.',
			requiredDir: dataDir,
			parameters: [
				{ name: 'image', desc: 'Generate image output' },
				{ name: '--lengths', desc: 'Show contig lengths' }
			]
		},
		{
			type: 'task',
			title: 'Step 6: Polish Assembly',
			text: `Polish the assembly to correct remaining errors.`,
			command: 'medaka_consensus -i filtered/sample_01_filtered.fastq.gz -d assembly/assembly.fasta -o polished/ -m r941_min_hac_g507',
			explanation: 'Medaka uses neural networks to polish long-read assemblies.',
			requiredDir: dataDir,
			parameters: [
				{ name: '-i', desc: 'Input reads' },
				{ name: '-d', desc: 'Draft assembly' },
				{ name: '-o polished/', desc: 'Output directory' },
				{ name: '-m', desc: 'Model for polishing' }
			]
		}
	];
}

function createLongReadPhase2Sections(dataDir: string = '/data/outbreak_investigation'): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 2: Quality Assessment & Screening',
			text: 'Evaluate assembly quality and screen for key markers.',
			phase: 2
		},
		{
			type: 'task',
			title: 'Step 7: Assembly Quality Metrics',
			text: `Assess assembly quality and completeness.`,
			command: 'quast polished/consensus.fasta -o quast_results/',
			explanation: 'QUAST provides N50, total length, and contig statistics.',
			requiredDir: dataDir,
			parameters: [
				{ name: '-o quast_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 8: Genome Completeness',
			text: `Check genome completeness using marker genes.`,
			command: 'checkm lineage_wf polished/ checkm_results/ -x fasta',
			explanation: 'CheckM estimates completeness and contamination.',
			requiredDir: dataDir,
			parameters: [
				{ name: 'lineage_wf', desc: 'Full CheckM workflow' },
				{ name: '-x fasta', desc: 'File extension' }
			]
		},
		{
			type: 'task',
			title: 'Step 9: BUSCO Assessment',
			text: `Validate completeness with universal single-copy orthologs.`,
			command: 'busco -i polished/consensus.fasta -o busco_results/ -m genome -l bacteria_odb10',
			explanation: 'BUSCO checks for conserved genes expected in all bacteria.',
			requiredDir: dataDir,
			parameters: [
				{ name: '-m genome', desc: 'Genome mode' },
				{ name: '-l bacteria_odb10', desc: 'Bacteria database' }
			]
		},
		{
			type: 'task',
			title: 'Step 10: AMR Screening',
			text: `Screen for antimicrobial resistance genes.`,
			command: 'abricate --db ncbi polished/consensus.fasta -o abricate_results/',
			explanation: 'ABRicate identifies resistance genes from databases.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--db ncbi', desc: 'Use NCBI database' },
				{ name: '-o abricate_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 11: MLST Typing',
			text: `Determine the sequence type.`,
			command: 'mlst polished/consensus.fasta -o mlst_results/',
			explanation: 'MLST assigns sequence types for epidemiological tracking.',
			requiredDir: dataDir,
			parameters: [
				{ name: '-o mlst_results/', desc: 'Output directory' }
			]
		}
	];
}

function createLongReadPhase3Sections(dataDir: string = '/data/outbreak_investigation'): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 3: Annotation & Mobile Element Analysis',
			text: 'Annotate genes and comprehensively analyze mobile genetic elements.',
			phase: 3
		},
		{
			type: 'task',
			title: 'Step 12: Genome Annotation',
			text: `Annotate genes in the polished assembly.`,
			command: 'prokka --outdir prokka_results/ --prefix sample_01 polished/consensus.fasta',
			explanation: 'Prokka identifies CDS, tRNA, and rRNA features.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--outdir prokka_results/', desc: 'Output directory' },
				{ name: '--prefix sample_01', desc: 'Output file prefix' }
			]
		},
		{
			type: 'task',
			title: 'Step 13: Detailed Annotation',
			text: `Get comprehensive annotations with Bakta.`,
			command: 'bakta polished/consensus.fasta --output bakta_results/',
			explanation: 'Bakta provides rich functional annotations.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--output bakta_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 14: Complete Plasmid Analysis',
			text: `Identify and characterize plasmids from the complete assembly.`,
			command: 'mob_recon -i polished/consensus.fasta -o mob_recon_results/',
			explanation: 'MOB-suite reconstructs plasmids with high accuracy on complete genomes.',
			requiredDir: dataDir,
			parameters: [
				{ name: '-i', desc: 'Input assembly' },
				{ name: '-o mob_recon_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 15: Plasmid Typing',
			text: `Identify plasmid replicon types.`,
			command: 'plasmidfinder -i polished/consensus.fasta -o plasmidfinder_results/',
			explanation: 'PlasmidFinder detects plasmid replicons for typing.',
			requiredDir: dataDir,
			parameters: [
				{ name: '-i', desc: 'Input assembly' },
				{ name: '-o plasmidfinder_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 16: IS Element Detection',
			text: `Identify insertion sequences in the complete genome.`,
			command: 'isescan --seqfile polished/consensus.fasta --output isescan_results/',
			explanation: 'ISEScan finds IS elements that facilitate gene mobility.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--seqfile', desc: 'Input assembly' },
				{ name: '--output isescan_results/', desc: 'Output directory' }
			]
		}
	];
}

function createLongReadPhase4Sections(dataDir: string = '/data/outbreak_investigation'): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 4: Phylogenetics & Comparative Analysis',
			text: 'Build evolutionary trees and perform detailed comparative genomics.',
			phase: 4
		},
		{
			type: 'task',
			title: 'Step 17: Variant Calling',
			text: `Call SNPs against the reference genome.`,
			command: 'snippy --ref reference.gbk --ctgs polished/consensus.fasta --outdir snippy_results/',
			explanation: 'Snippy identifies SNPs, insertions, and deletions.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--ref reference.gbk', desc: 'Reference genome' },
				{ name: '--ctgs', desc: 'Query contigs' },
				{ name: '--outdir snippy_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 18: Pan-genome Analysis',
			text: `Analyze the pan-genome across isolates.`,
			command: 'roary -f roary_results/ -e -n -v prokka_results/*.gff',
			explanation: 'Roary identifies core and accessory genes.',
			requiredDir: dataDir,
			parameters: [
				{ name: '-f roary_results/', desc: 'Output directory' },
				{ name: '-e', desc: 'Create core gene alignment' },
				{ name: '-n', desc: 'Fast alignment with MAFFT' }
			]
		},
		{
			type: 'task',
			title: 'Step 19: Phylogenetic Tree',
			text: `Build a maximum-likelihood phylogenetic tree.`,
			command: 'iqtree -s roary_results/core_gene_alignment.aln -m GTR+G -bb 1000 -nt AUTO',
			explanation: 'IQ-TREE builds phylogenetic trees with bootstrap support.',
			requiredDir: dataDir,
			parameters: [
				{ name: '-s', desc: 'Input alignment' },
				{ name: '-m GTR+G', desc: 'Substitution model' },
				{ name: '-bb 1000', desc: 'Bootstrap replicates' }
			]
		},
		{
			type: 'task',
			title: 'Step 20: Recombination Analysis',
			text: `Remove recombination for cleaner phylogeny.`,
			command: 'run_gubbins.py -p gubbins_results/clean roary_results/core_gene_alignment.aln',
			explanation: 'Gubbins identifies recombination regions for removal.',
			requiredDir: dataDir,
			parameters: [
				{ name: '-p gubbins_results/clean', desc: 'Output prefix' }
			]
		}
	];
}

// ============================================
// NANOPORE LONG-READ WORKFLOW SECTIONS
// ============================================

function createNanoporePhase1Sections(dataDir: string = '/data/outbreak_investigation'): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 1: Rapid Long-Read Analysis',
			text: 'Process Oxford Nanopore data for rapid pathogen identification.',
			phase: 1
		},
		{
			type: 'task',
			title: 'Step 1: Explore the Data',
			text: `Check the Nanopore sequencing data statistics.`,
			command: 'seqkit stats sample_01_nanopore.fastq.gz',
			explanation: 'SeqKit provides quick statistics about sequencing files.',
			requiredDir: dataDir,
			parameters: [
				{ name: 'stats', desc: 'Generate sequence statistics' }
			]
		},
		{
			type: 'task',
			title: 'Step 2: Basecalling Quality Check',
			text: `Assess read quality and length distribution.`,
			command: 'NanoPlot --fastq sample_01_nanopore.fastq.gz -o nanoplot_results/ --plots kde hex',
			explanation: 'NanoPlot creates visualizations showing quality vs. read length.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--fastq', desc: 'Input FASTQ file' },
				{ name: '-o nanoplot_results/', desc: 'Output directory' },
				{ name: '--plots kde hex', desc: 'Plot types to generate' }
			]
		},
		{
			type: 'task',
			title: 'Step 3: Adapter Trimming',
			text: `Remove adapters and chimeric reads.`,
			command: 'porechop -i sample_01_nanopore.fastq.gz -o trimmed/sample_01_trimmed.fastq.gz',
			explanation: 'Porechop removes sequencing adapters from Nanopore reads.',
			requiredDir: dataDir,
			parameters: [
				{ name: '-i', desc: 'Input FASTQ file' },
				{ name: '-o', desc: 'Output trimmed file' }
			]
		},
		{
			type: 'task',
			title: 'Step 4: Quality Filtering',
			text: `Filter reads by quality and length.`,
			command: 'filtlong --min_length 1000 --keep_percent 90 trimmed/sample_01_trimmed.fastq.gz | gzip > filtered/sample_01_filtered.fastq.gz',
			explanation: 'Filtlong removes the lowest quality reads.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--min_length 1000', desc: 'Minimum read length' },
				{ name: '--keep_percent 90', desc: 'Keep top 90% by quality' }
			]
		},
		{
			type: 'task',
			title: 'Step 5: Real-Time Species Identification',
			text: `Rapidly identify species using k-mer classification.`,
			command: 'kraken2 --db standard --threads 8 --report kraken_report.txt filtered/sample_01_filtered.fastq.gz > kraken_output.txt',
			explanation: 'Kraken2 provides rapid taxonomic classification for species ID.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--db standard', desc: 'Standard Kraken2 database' },
				{ name: '--threads 8', desc: 'Number of threads' },
				{ name: '--report', desc: 'Summary report output' }
			]
		},
		{
			type: 'task',
			title: 'Step 6: De Novo Assembly',
			text: `Assemble filtered reads with Flye.`,
			command: 'flye --nano-hq filtered/sample_01_filtered.fastq.gz -o assembly/ --threads 8',
			explanation: 'Flye produces high-quality assemblies from Nanopore data.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--nano-hq', desc: 'High-quality Nanopore mode (Q20+)' },
				{ name: '-o assembly/', desc: 'Output directory' },
				{ name: '--threads 8', desc: 'Number of CPU threads' }
			]
		},
		{
			type: 'task',
			title: 'Step 7: Assembly Polishing',
			text: `Polish assembly with Medaka for improved accuracy.`,
			command: 'medaka_consensus -i filtered/sample_01_filtered.fastq.gz -d assembly/assembly.fasta -o polished/ -m r941_min_sup_g507',
			explanation: 'Medaka uses neural networks to improve assembly accuracy.',
			requiredDir: dataDir,
			parameters: [
				{ name: '-i', desc: 'Input reads' },
				{ name: '-d', desc: 'Draft assembly' },
				{ name: '-o polished/', desc: 'Output directory' },
				{ name: '-m', desc: 'Nanopore model' }
			]
		},
		{
			type: 'task',
			title: 'Step 8: Visualize Assembly',
			text: `Examine the assembly graph structure.`,
			command: 'bandage image assembly/assembly.gfa assembly/assembly_graph.png --lengths',
			explanation: 'Bandage visualizes assembly completeness and structure.',
			requiredDir: dataDir,
			parameters: [
				{ name: 'image', desc: 'Generate image output' },
				{ name: '--lengths', desc: 'Show contig lengths' }
			]
		}
	];
}

function createNanoporePhase2Sections(dataDir: string = '/data/outbreak_investigation'): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 2: Rapid Screening & Resistance Detection',
			text: 'Quickly screen for resistance genes and virulence factors.',
			phase: 2
		},
		{
			type: 'task',
			title: 'Step 9: Assembly Quality',
			text: `Assess assembly quality metrics.`,
			command: 'quast polished/consensus.fasta -o quast_results/',
			explanation: 'QUAST provides key assembly statistics.',
			requiredDir: dataDir,
			parameters: [
				{ name: '-o quast_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 10: Real-Time AMR Detection',
			text: `Screen for resistance genes directly from reads.`,
			command: 'abricate --db resfinder polished/consensus.fasta -o abricate_results/',
			explanation: 'ABRicate rapidly identifies resistance genes.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--db resfinder', desc: 'Use ResFinder database' },
				{ name: '-o abricate_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 11: MLST Typing',
			text: `Determine sequence type for epidemiology.`,
			command: 'mlst polished/consensus.fasta -o mlst_results/',
			explanation: 'MLST provides immediate epidemiological context.',
			requiredDir: dataDir,
			parameters: [
				{ name: '-o mlst_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 12: Virulence Screening',
			text: `Screen for virulence factors.`,
			command: 'abricate --db vfdb polished/consensus.fasta -o virulence_results/',
			explanation: 'VFDB database contains curated virulence factors.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--db vfdb', desc: 'Use VFDB database' },
				{ name: '-o virulence_results/', desc: 'Output directory' }
			]
		}
	];
}

function createNanoporePhase3Sections(dataDir: string = '/data/outbreak_investigation'): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 3: Annotation & Detailed Analysis',
			text: 'Comprehensive annotation and structural variant detection.',
			phase: 3
		},
		{
			type: 'task',
			title: 'Step 13: Genome Annotation',
			text: `Annotate the polished assembly.`,
			command: 'prokka --outdir prokka_results/ --prefix sample_01 polished/consensus.fasta',
			explanation: 'Prokka provides comprehensive gene annotations.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--outdir prokka_results/', desc: 'Output directory' },
				{ name: '--prefix sample_01', desc: 'Output prefix' }
			]
		},
		{
			type: 'task',
			title: 'Step 14: Detailed Annotation with Bakta',
			text: `Get comprehensive functional annotations.`,
			command: 'bakta polished/consensus.fasta --output bakta_results/',
			explanation: 'Bakta provides rich functional and taxonomic annotations.',
			requiredDir: dataDir,
			parameters: [
				{ name: '--output bakta_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 15: Plasmid Detection',
			text: `Identify plasmids in the assembly.`,
			command: 'mob_recon -i polished/consensus.fasta -o mob_recon_results/',
			explanation: 'MOB-suite reconstructs and types plasmids.',
			requiredDir: dataDir,
			parameters: [
				{ name: '-i', desc: 'Input assembly' },
				{ name: '-o mob_recon_results/', desc: 'Output directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 16: Methylation Analysis',
			text: `Detect DNA methylation patterns (if available).`,
			command: 'modkit pileup sample_01_nanopore.bam methylation_results/ --ref polished/consensus.fasta',
			explanation: 'Modkit detects base modifications from Nanopore signal data.',
			requiredDir: dataDir,
			parameters: [
				{ name: 'pileup', desc: 'Generate methylation pileup' },
				{ name: '--ref', desc: 'Reference genome' }
			]
		}
	];
}

// ============================================
// STORYLINES
// ============================================

export const storylines: Record<string, Storyline> = {
	// Trial/Demo scenario - single sample workflow
	trial: {
		id: 'trial',
		title: 'Exploring K. pneumoniae',
		subtitle: 'Introduction to WGS Analysis',
		organism: 'Klebsiella pneumoniae',
		technology: 'illumina',
		technologyLabel: 'Short Read (Illumina)',
		dataDir: '/data/kpneumoniae_demo',
		toolsUsed: ['seqkit', 'fastqc', 'trimmomatic', 'unicycler', 'bandage', 'quast', 'checkm2', 'abricate', 'mlst', 'prokka'],
		sections: [
			{
				type: 'intro',
				text: `<strong>Welcome to BioLearn WGS Analysis</strong>

In this introductory module, you'll learn the fundamentals of whole-genome sequencing (WGS) analysis using a <em>Klebsiella pneumoniae</em> isolate. This hands-on tutorial will guide you through the complete workflow from raw reads to annotated genome.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'context',
				text: `<strong>About <em>Klebsiella pneumoniae</em></strong>

<em>Klebsiella pneumoniae</em> is a common opportunistic, Gram-negative, encapsulated bacterium that is a major cause of hospital-acquired infections including pneumonia, urinary tract infections, and bloodstream infections. It is a critical public health concern due to the emergence of multidrug-resistant (MDR) and hypervirulent strains that are difficult to treat and associated with high mortality rates.

This dataset (SRR36708862) comes from a study investigating antibiotic resistance and virulence profiles of clinical <em>K. pneumoniae</em> strains, helping researchers understand mechanisms of resistance (e.g., blaCTX-M, carbapenemases) and virulence factors (capsule production, fimbriae, siderophores) to inform treatment strategies.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'context',
				text: `<strong>Sample Information:</strong>

<table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody><tr><td>Accession</td><td>SRR36708862</td></tr><tr><td>Organism</td><td><em>Klebsiella pneumoniae</em></td></tr><tr><td>Platform</td><td>Illumina NovaSeq 6000</td></tr><tr><td>Read Length</td><td>2 × 150 bp (paired-end)</td></tr><tr><td>Expected Genome</td><td>~5.5 Mb</td></tr></tbody></table>

<strong>Learning Objectives:</strong>
<ol><li>Assess raw sequencing data quality</li><li>Trim adapters and low-quality bases</li><li>Assemble reads into contigs</li><li>Evaluate assembly quality</li><li>Screen for antimicrobial resistance genes</li><li>Annotate the genome</li></ol>`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'phase',
				title: 'Phase 1: Quality Control',
				text: 'First, we assess the quality of our raw sequencing data before processing.',
				phase: 1
			},
			{
				type: 'task',
				title: 'Step 1: Check Sequencing Statistics',
				text: `Let's start by examining basic statistics about our sequencing data.`,
				command: 'seqkit stats SRR36708862_1.fastq.gz SRR36708862_2.fastq.gz',
				explanation: 'SeqKit provides quick statistics including read count, total bases, and average read length.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: 'stats', desc: 'Generate sequence statistics' },
					{ name: 'SRR36708862_*.fastq.gz', desc: 'Input paired-end FASTQ files' }
				]
			},
			{
				type: 'task',
				title: 'Step 2: Quality Control Report',
				text: `Generate detailed quality reports to identify any issues with the sequencing data.`,
				command: 'fastqc SRR36708862_1.fastq.gz SRR36708862_2.fastq.gz -o fastqc_output/',
				explanation: 'FastQC analyzes per-base quality scores, GC content, adapter contamination, and other quality metrics.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: '-o fastqc_output/', desc: 'Output directory for reports' }
				]
			},
			{
				type: 'phase',
				title: 'Phase 2: Read Preprocessing',
				text: 'Clean the raw reads by removing adapters and low-quality bases.',
				phase: 2
			},
			{
				type: 'task',
				title: 'Step 3: Adapter Trimming',
				text: `Remove Illumina adapters and trim low-quality bases from read ends.`,
				command: 'trimmomatic PE -threads 2 -phred33 SRR36708862_1.fastq.gz SRR36708862_2.fastq.gz trimmed/SRR36708862_R1_paired.fq.gz trimmed/SRR36708862_R1_unpaired.fq.gz trimmed/SRR36708862_R2_paired.fq.gz trimmed/SRR36708862_R2_unpaired.fq.gz ILLUMINACLIP:TruSeq3-PE.fa:2:30:10 SLIDINGWINDOW:4:15 MINLEN:36',
				explanation: 'Trimmomatic removes adapter sequences and trims bases with quality below threshold.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: 'PE', desc: 'Paired-end mode' },
					{ name: '-threads 2', desc: 'Use 2 CPU threads' },
					{ name: 'ILLUMINACLIP', desc: 'Remove TruSeq adapters' },
					{ name: 'SLIDINGWINDOW:4:15', desc: 'Trim when 4-base average quality < 15' },
					{ name: 'MINLEN:36', desc: 'Discard reads shorter than 36 bp' }
				]
			},
			{
				type: 'phase',
				title: 'Phase 3: Genome Assembly',
				text: 'Assemble the cleaned reads into contiguous sequences (contigs).',
				phase: 3
			},
			{
				type: 'task',
				title: 'Step 4: De Novo Assembly',
				text: `Assemble the trimmed reads into contigs using Unicycler.`,
				command: 'unicycler -1 trimmed/SRR36708862_R1_paired.fq.gz -2 trimmed/SRR36708862_R2_paired.fq.gz -o assembly/',
				explanation: 'Unicycler uses SPAdes with multiple k-mer sizes and optimizes the assembly graph.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: '-1/-2', desc: 'Forward and reverse paired reads' },
					{ name: '-o assembly/', desc: 'Output directory' }
				]
			},
			{
				type: 'task',
				title: 'Step 5: Visualize Assembly Graph',
				text: `Create a visual representation of the assembly graph to understand genome structure.`,
				command: 'bandage image assembly/assembly.gfa assembly_graph.png',
				explanation: 'Bandage visualizes the assembly graph showing how contigs connect.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: 'image', desc: 'Generate PNG image' },
					{ name: 'assembly.gfa', desc: 'Input graph file' }
				]
			},
			{
				type: 'phase',
				title: 'Phase 4: Assembly Quality Assessment',
				text: 'Evaluate the quality and completeness of the assembled genome.',
				phase: 4
			},
			{
				type: 'task',
				title: 'Step 6: Assembly Metrics',
				text: `Calculate assembly statistics including N50, total length, and contig count.`,
				command: 'quast assembly/assembly.fasta -o quast_output/',
				explanation: 'QUAST calculates key assembly metrics to assess quality.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: '-o quast_output/', desc: 'Output directory' }
				]
			},
			{
				type: 'task',
				title: 'Step 7: Genome Completeness',
				text: `Assess genome completeness and contamination using CheckM2.`,
				command: 'checkm2 predict --input assembly/ --output-directory checkm2_output/ -x fasta',
				explanation: 'CheckM2 uses machine learning to estimate completeness and contamination.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: '--input assembly/', desc: 'Directory with assembly' },
					{ name: '-x fasta', desc: 'File extension' }
				]
			},
			{
				type: 'phase',
				title: 'Phase 5: AMR Screening & Typing',
				text: 'Screen for antimicrobial resistance genes and determine sequence type.',
				phase: 5
			},
			{
				type: 'task',
				title: 'Step 8: AMR Gene Detection',
				text: `Screen the assembly for antimicrobial resistance genes using multiple databases.`,
				command: 'abricate --db ncbi assembly/assembly.fasta > abricate_output/amr_ncbi.tab',
				explanation: 'ABRicate rapidly screens for resistance genes against curated databases.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: '--db ncbi', desc: 'Use NCBI AMRFinder database' },
					{ name: '>', desc: 'Redirect output to file' }
				]
			},
			{
				type: 'task',
				title: 'Step 9: MLST Typing',
				text: `Determine the sequence type (ST) for epidemiological classification.`,
				command: 'mlst assembly/assembly.fasta > mlst_output/mlst_result.tab',
				explanation: 'MLST identifies the allelic profile of 7 housekeeping genes to assign a sequence type.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: '>', desc: 'Redirect output to file' }
				]
			},
			{
				type: 'phase',
				title: 'Phase 6: Genome Annotation',
				text: 'Identify and annotate genes in the assembled genome.',
				phase: 6
			},
			{
				type: 'task',
				title: 'Step 10: Gene Annotation',
				text: `Annotate the genome to identify coding sequences, tRNAs, and rRNAs.`,
				command: 'prokka --outdir prokka_output/ assembly/assembly.fasta',
				explanation: 'Prokka performs rapid prokaryotic genome annotation.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: '--outdir prokka_output/', desc: 'Output directory' }
				]
			},
			{
				type: 'complete',
				title: 'Tutorial Complete!',
				text: `**Congratulations!** You've completed the WGS analysis tutorial.\n\n---\n\n**Your Results Summary:**\n\n| Metric | Value |\n|--------|-------|\n| Input Reads | 990,478 pairs |\n| After Trimming | 982,838 pairs (99.23%) |\n| Assembly Size | 5,553,065 bp |\n| Contigs | 189 |\n| N50 | 371,705 bp |\n| GC Content | 57.18% |\n| Completeness | 99.8% |\n| Contamination | 0.2% |\n\n**Sequence Type:** ST307 (Klebsiella pneumoniae)\n\n**AMR Genes Detected:**\n• blaSHV-28 (β-lactamase)\n• oqxA/oqxB (fluoroquinolone efflux)\n• fosA (fosfomycin resistance)\n\n**Annotation Summary:**\n• 5,234 coding sequences (CDS)\n• 86 tRNAs\n• 25 rRNAs\n\n---\n\n**What's Next?**\nTry the **Hospital Outbreak Investigation** scenario to apply these skills to a real-world epidemiological investigation with multiple samples!`
			}
		]
	},
	hospital: {
		id: 'hospital',
		title: 'Hospital Outbreak Investigation',
		subtitle: 'Antimicrobial Resistance in ICU',
		organism: 'Klebsiella pneumoniae',
		technology: 'illumina',
		technologyLabel: 'Short Read (Illumina)',
		dataDir: '/data/outbreak_investigation',
		toolsUsed: ['seqkit', 'fastqc', 'multiqc', 'trimmomatic', 'unicycler', 'bandage', 'quast', 'checkm', 'abricate', 'mlst', 'prokka', 'mob_recon', 'plasmidfinder', 'snippy', 'roary', 'iqtree', 'resfinder', 'integron_finder', 'isescan'],
		sections: [
			{
				type: 'intro',
				text: `**URGENT - Infection Control Alert**\n\n3 patients in the ICU have been diagnosed with carbapenem-resistant *Klebsiella pneumoniae* infections. All developed severe bloodstream infections within the past 72 hours and are not responding to last-line antibiotics.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'context',
				text: `**Patient Information:**\n\n| Patient | Location | Onset | Sample |\n|---------|----------|-------|--------|\n| Patient 01 | ICU Bed 3 | Day 0 | Blood culture |\n| Patient 02 | ICU Bed 7 | Day 2 | Blood culture |\n| Patient 03 | ICU Bed 12 | Day 3 | Blood culture |\n\nSamples from all 3 patients have been sequenced using Illumina NovaSeq (150bp paired-end, ~100x coverage).\n\n**Your Investigation Goals:**\n1. Determine if this is a clonal outbreak (same strain) or coincidental infections\n2. Identify the antimicrobial resistance mechanisms\n3. Guide infection control response`,
				hint: null,
				requiredDir: null
			},
			...createIlluminaPhase1Sections(),
			...createIlluminaPhase2Sections(),
			...createIlluminaPhase3Sections(),
			...createIlluminaPhase4Sections(),
			...createHospitalAdditionalTools(),
			{
				type: 'complete',
				title: 'Investigation Complete',
				text: `**Hospital Outbreak Investigation - Final Report**\n\n---\n\n**OUTBREAK STATUS: CONFIRMED (Partial)**\n\n**Strain Analysis:**\n| Patient | Sequence Type | Outbreak Status |\n|---------|---------------|------------------|\n| Patient 01 | ST258 | ✓ Outbreak cluster |\n| Patient 02 | ST258 | ✓ Outbreak cluster |\n| Patient 03 | ST11 | ✗ Sporadic case |\n\n**Key Findings:**\n\n*Outbreak Cluster (Patients 01 & 02 - ST258):*\n• Only 3 SNP differences between isolates - confirms direct transmission\n• Complete genome: 5.3 Mb chromosome + 2 plasmids (pKPC-250kb, pNDM-85kb)\n• Carbapenemase genes: blaKPC-2 (IncFII plasmid), blaNDM-1 (IncX3 plasmid)\n• Transmission likely occurred via shared equipment or healthcare worker\n\n*Sporadic Case (Patient 03 - ST11):*\n• >800 SNP differences from outbreak cluster - unrelated strain\n• Different plasmid profile - carries blaCTX-M-15 (ESBL) but no carbapenemases\n• Likely community-acquired infection, NOT part of ICU outbreak\n\n**Infection Control Recommendations:**\n1. Focus containment efforts on Beds 3-7 area (outbreak cluster)\n2. Review shared equipment and procedures between Patients 01 & 02\n3. Patient 03 can be managed separately - not an outbreak risk\n4. Screen other ICU patients for ST258 carriage\n\n**Clinical Implications:**\n• Patients 01 & 02: Consider colistin + tigecycline combination\n• Patient 03: Standard ESBL treatment (carbapenems may still be effective)`
			}
		]
	},
	plant: {
		id: 'plant',
		title: 'Plant Pathogen Investigation',
		subtitle: 'Citrus Canker Outbreak',
		organism: 'Xanthomonas citri',
		technology: 'illumina',
		technologyLabel: 'Short Read (Illumina)',
		dataDir: '/data/outbreak_investigation',
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
				imageUrl: '/images/citrus_canker.svg',
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
		technology: 'hybrid',
		technologyLabel: 'Hybrid (Illumina + ONT)',
		dataDir: '/data/outbreak_investigation',
		toolsUsed: ['seqkit', 'fastqc', 'trimmomatic', 'NanoPlot', 'filtlong', 'unicycler', 'bandage', 'quast', 'checkm', 'busco', 'abricate', 'mlst', 'prokka', 'bakta', 'mob_recon', 'plasmidfinder', 'platon', 'snippy', 'roary', 'iqtree', 'gubbins', 'virulencefinder'],
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
				imageUrl: '/images/vibrio_fish.svg',
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
		technologyLabel: 'Short Read (Illumina)',
		dataDir: '/data/outbreak_investigation',
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
			{
				type: 'complete',
				title: 'Analysis Complete',
				text: `Congratulations! You have completed the Food Poisoning Investigation.\n\n**Assembly Result:** Complete genome - 1 circular chromosome (4.8 Mb), no plasmids detected\n\n**Key findings:**\n• Confirmed Salmonella enterica serovar Enteritidis (ST11)\n• All 8 patient isolates clonal (<3 SNP differences) - confirmed linked outbreak\n• Source traced to contaminated eggs from the restaurant kitchen\n• Detected Salmonella Genomic Island 1 (SGI-1) with multidrug resistance\n• ASSuT resistance pattern: Ampicillin, Streptomycin, Sulfonamides, Tetracycline\n• No plasmid-mediated resistance - all AMR genes chromosomally encoded\n\n**Public Health Actions:**\n• Restaurant temporarily closed for sanitation\n• Egg supplier traced and notified\n• Patient antibiotic therapy adjusted based on resistance profile`
			}
		]
	},
	// ============================================
	// LONG READ STORYLINES
	// ============================================
	wastewater: {
		id: 'wastewater',
		title: 'Wastewater AMR Surveillance',
		subtitle: 'Environmental Resistance Monitoring',
		organism: 'Escherichia coli (mcr-positive)',
		technology: 'pacbio',
		technologyLabel: 'Long Read (PacBio HiFi)',
		dataDir: '/data/wastewater_surveillance',
		toolsUsed: ['seqkit', 'pbmarkdup', 'ccs', 'hifiasm', 'flye', 'bandage', 'quast', 'checkm', 'busco', 'abricate', 'mlst', 'prokka', 'bakta', 'mob_recon', 'plasmidfinder', 'isescan', 'snippy', 'roary', 'iqtree', 'gubbins', 'resfinder'],
		sections: [
			{
				type: 'intro',
				text: `ALERT - Environmental Health Agency:\n\nRoutine wastewater surveillance has detected high levels of colistin resistance genes (mcr) in samples from a municipal treatment plant. Colistin is a last-resort antibiotic, and environmental spread of resistance is a critical public health concern.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'image',
				title: 'Wastewater Treatment Facility',
				text: 'Aerial view of the municipal wastewater treatment plant where AMR surveillance sampling is conducted. Understanding resistance gene flow through wastewater systems helps predict and prevent clinical outbreaks.',
				imageUrl: '/images/wastewater_plant.svg',
				imageAlt: 'Aerial view of wastewater treatment facility with settling ponds and processing buildings'
			},
			{
				type: 'context',
				text: `Cultured isolates from influent (incoming) and effluent (treated) water have been sequenced using PacBio HiFi technology. Long-read sequencing is essential here because:\n\n• **Complete plasmid resolution:** mcr genes are typically plasmid-borne\n• **IS element context:** Understanding the genetic environment aids transmission tracking\n• **Chromosomal integration detection:** Some mcr variants integrate into chromosomes\n\nYour task: Characterize the mcr-positive isolates, determine the plasmid context, and assess if treatment is removing resistant bacteria.`,
				hint: null,
				requiredDir: null
			},
			...createPacBioPhase1Sections('/data/wastewater_surveillance'),
			{
				type: 'alert',
				title: 'Assembly Result',
				text: `**PacBio HiFi Assembly Successful**\n\nYour long-read assembly produced a complete, closed genome:\n• 1 circular chromosome (4.9 Mb)\n• 2 complete circular plasmids (IncI2: 65 kb, IncX4: 35 kb)\n• N50: 4.9 Mb (chromosome-level)\n\n**Advantage of long reads:** Unlike short-read assembly, we have resolved the complete plasmid sequences, allowing us to determine exactly which plasmid carries the mcr gene and analyze its transfer potential.`
			},
			...createLongReadPhase2Sections('/data/wastewater_surveillance'),
			{
				type: 'alert',
				title: 'Critical Finding: mcr-1 Detected',
				text: `**AMR Screening Result:**\n\nmcr-1 gene detected on the IncI2 plasmid (pMCR-65kb)\n\n**Why this matters:**\n• mcr-1 confers resistance to colistin, a last-resort antibiotic\n• IncI2 plasmids are highly conjugative (easily transferred between bacteria)\n• This plasmid type has been associated with global mcr-1 spread\n\nContinue analysis to understand the transmission context...`
			},
			...createLongReadPhase3Sections('/data/wastewater_surveillance'),
			{
				type: 'task',
				title: 'Step 17: Detailed mcr Analysis',
				text: `Analyze the genetic context of the mcr gene.`,
				command: 'resfinder -i polished/consensus.fasta -o resfinder_results/ -db_res -l 0.9 -t 0.8',
				explanation: 'ResFinder provides detailed resistance gene context and variants.',
				requiredDir: '/data/wastewater_surveillance',
				parameters: [
					{ name: '-db_res', desc: 'Use resistance database' },
					{ name: '-l 0.9', desc: 'Minimum coverage 90%' },
					{ name: '-t 0.8', desc: 'Minimum identity 80%' }
				]
			},
			{
				type: 'task',
				title: 'Step 18: Plasmid Transferability',
				text: `Assess conjugation potential of the mcr-carrying plasmid.`,
				command: 'mob_typer -i mob_recon_results/plasmid_pMCR.fasta -o mob_typer_results/',
				explanation: 'MOB-typer predicts plasmid mobility and host range.',
				requiredDir: '/data/wastewater_surveillance',
				parameters: [
					{ name: '-i', desc: 'Input plasmid sequence' },
					{ name: '-o mob_typer_results/', desc: 'Output directory' }
				]
			},
			...createLongReadPhase4Sections('/data/wastewater_surveillance'),
			{
				type: 'complete',
				title: 'Analysis Complete',
				text: `Congratulations! You have completed the Wastewater AMR Surveillance Investigation.\n\n**Assembly Result:** Complete genome with 2 fully resolved plasmids\n\n**Key findings:**\n• Identified E. coli ST131 (high-risk pandemic clone)\n• mcr-1 located on conjugative IncI2 plasmid (pMCR-65kb)\n• Plasmid carries complete conjugation machinery (tra genes intact)\n• Same plasmid backbone found in clinical isolates from 3 continents\n• IS element (ISApl1) flanking mcr-1 suggests recent mobilization\n\n**Environmental Insights:**\n• mcr-positive isolates found in both influent AND effluent\n• Current treatment not eliminating resistant bacteria\n• Downstream agricultural irrigation may be at risk\n\n**Recommendations:**\n• Implement enhanced disinfection protocols\n• Expand surveillance to receiving waters\n• Alert clinical laboratories to monitor for mcr-positive infections\n\n**Why long reads were essential:**\nComplete plasmid assembly revealed the IncI2 backbone, conjugation genes, and IS element context—information impossible to obtain from fragmented short-read assemblies.`
			}
		]
	},
	clinical: {
		id: 'clinical',
		title: 'Clinical Rapid Diagnostics',
		subtitle: 'Same-Day Pathogen Identification',
		organism: 'Pseudomonas aeruginosa',
		technology: 'nanopore',
		technologyLabel: 'Long Read (ONT)',
		dataDir: '/data/clinical_samples',
		toolsUsed: ['seqkit', 'NanoPlot', 'porechop', 'filtlong', 'kraken2', 'flye', 'medaka', 'bandage', 'quast', 'abricate', 'mlst', 'prokka', 'bakta', 'mob_recon', 'modkit'],
		sections: [
			{
				type: 'intro',
				text: `URGENT - Clinical Microbiology Laboratory:\n\nA critically ill patient in the burn unit has developed a rapidly progressing wound infection. Blood cultures are growing Gram-negative rods. The clinical team needs rapid identification and antimicrobial susceptibility guidance—standard culture-based methods will take 48-72 hours.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'image',
				title: 'Oxford Nanopore MinION Sequencer',
				text: 'The portable MinION device enables rapid, real-time sequencing at the point of care. Results can be obtained within hours rather than days, enabling faster clinical decision-making.',
				imageUrl: '/images/minion_sequencer.svg',
				imageAlt: 'Oxford Nanopore MinION portable sequencing device connected to a laptop'
			},
			{
				type: 'context',
				text: `DNA has been extracted directly from positive blood culture and loaded onto a MinION sequencer. Oxford Nanopore technology provides:\n\n• **Real-time sequencing:** Results stream as sequencing progresses\n• **Rapid turnaround:** Species ID within 1 hour, AMR within 4 hours\n• **Long reads:** Complete gene context without assembly fragmentation\n• **Portability:** Can be performed at bedside or in resource-limited settings\n\nYour task: Rapidly identify the pathogen, detect resistance genes, and provide actionable guidance to the clinical team.`,
				hint: null,
				requiredDir: null
			},
			...createNanoporePhase1Sections('/data/clinical_samples'),
			{
				type: 'alert',
				title: 'Rapid Species Identification',
				text: `**Kraken2 Classification Result (15 minutes):**\n\n• **Species:** Pseudomonas aeruginosa (98.7% reads classified)\n• **Confidence:** High (>95% agreement across k-mers)\n\n**Clinical Significance:**\nP. aeruginosa is an opportunistic pathogen notorious for:\n• Intrinsic resistance to many antibiotics\n• Ability to acquire additional resistance mechanisms\n• Biofilm formation in burn wounds\n• High mortality in bacteremic patients\n\nContinue analysis for resistance gene detection...`
			},
			...createNanoporePhase2Sections('/data/clinical_samples'),
			{
				type: 'alert',
				title: 'Critical AMR Alert',
				text: `**Resistance Gene Detection (2 hours):**\n\n**Detected resistance mechanisms:**\n• blaVIM-2: Metallo-β-lactamase (carbapenem resistance)\n• aac(6')-Ib: Aminoglycoside resistance\n• Chromosomal oprD mutation: Imipenem resistance\n\n**Predicted Resistance Profile:**\n• Carbapenems: RESISTANT (meropenem, imipenem)\n• Aminoglycosides: RESISTANT (gentamicin, tobramycin)\n• Fluoroquinolones: Likely SUSCEPTIBLE\n• Colistin: Likely SUSCEPTIBLE\n\n**Immediate Clinical Recommendation:**\n⚠️ Avoid carbapenems and aminoglycosides\n✓ Consider colistin + fluoroquinolone combination pending confirmatory susceptibility testing`
			},
			...createNanoporePhase3Sections('/data/clinical_samples'),
			{
				type: 'task',
				title: 'Step 17: Resistance Gene Context',
				text: `Analyze the genetic environment of resistance genes.`,
				command: 'abricate --db card polished/consensus.fasta -o card_results/',
				explanation: 'CARD database provides detailed resistance mechanism annotations.',
				requiredDir: '/data/clinical_samples',
				parameters: [
					{ name: '--db card', desc: 'Use CARD database' },
					{ name: '-o card_results/', desc: 'Output directory' }
				]
			},
			{
				type: 'task',
				title: 'Step 18: Integron Analysis',
				text: `Check for integron-associated resistance.`,
				command: 'integron_finder polished/consensus.fasta --outdir integron_results/',
				explanation: 'IntegronFinder detects gene cassettes that may carry additional resistance genes.',
				requiredDir: '/data/clinical_samples',
				parameters: [
					{ name: '--outdir integron_results/', desc: 'Output directory' }
				]
			},
			{
				type: 'phase',
				title: 'Phase 4: Clinical Correlation',
				text: 'Compare with outbreak database and finalize recommendations.',
				phase: 4
			},
			{
				type: 'task',
				title: 'Step 19: MLST Comparison',
				text: `Compare sequence type with known outbreak strains.`,
				command: 'mlst polished/consensus.fasta -o mlst_results/',
				explanation: 'MLST helps identify if this strain matches known outbreak clusters.',
				requiredDir: '/data/clinical_samples',
				parameters: [
					{ name: '-o mlst_results/', desc: 'Output directory' }
				]
			},
			{
				type: 'context',
				text: `**MLST Result:** ST235\n\n**Epidemiological Significance:**\nST235 is a globally disseminated high-risk clone of P. aeruginosa known for:\n• Association with hospital outbreaks worldwide\n• Frequent carriage of metallo-β-lactamases (VIM, IMP)\n• Enhanced virulence and transmissibility\n• Poor clinical outcomes\n\nThis finding triggers additional infection control measures.`
			},
			{
				type: 'task',
				title: 'Step 20: Generate Clinical Report',
				text: `Create a summary report for the clinical team.`,
				command: 'summary_report --input polished/consensus.fasta --amr abricate_results/ --mlst mlst_results/ -o clinical_report/',
				explanation: 'Generates a clinical summary for immediate use by the care team.',
				requiredDir: '/data/clinical_samples',
				parameters: [
					{ name: '--input', desc: 'Assembly file' },
					{ name: '--amr', desc: 'AMR results directory' },
					{ name: '-o clinical_report/', desc: 'Output directory' }
				]
			},
			{
				type: 'complete',
				title: 'Analysis Complete',
				text: `Congratulations! You have completed the Clinical Rapid Diagnostics Investigation.\n\n**Timeline Achieved:**\n• Species ID: 15 minutes (Kraken2)\n• Resistance detection: 2 hours (ABRicate)\n• Complete genome: 4 hours (Flye + Medaka)\n• Full report: 6 hours total\n\n**vs. Traditional Methods: 48-72 hours**\n\n**Key Findings:**\n• Pseudomonas aeruginosa ST235 (high-risk clone)\n• Carbapenem-resistant (blaVIM-2 positive)\n• Aminoglycoside-resistant (aac(6')-Ib)\n• Located on class 1 integron with additional gene cassettes\n\n**Clinical Impact:**\n• Antibiotic therapy adjusted within 6 hours (vs. 72 hours)\n• Appropriate empiric coverage initiated immediately\n• Infection control team alerted to high-risk clone\n• Contact precautions implemented for burn unit\n\n**Patient Outcome:**\nEarly appropriate therapy enabled by rapid sequencing contributed to improved clinical response. The patient showed improvement within 48 hours of targeted therapy initiation.\n\n**Why Nanopore was ideal:**\n• Real-time data streaming for rapid species ID\n• Portable format suitable for clinical lab\n• Long reads resolved the integron structure completely\n• No batching required—single sample, immediate results`
			}
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
