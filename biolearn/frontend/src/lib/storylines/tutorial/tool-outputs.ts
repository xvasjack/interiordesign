/**
 * Tool outputs configuration for Tutorial storylines
 *
 * Each storyline has its own stats that generate unique terminal outputs.
 * Edit the numbers here to customize what users see when running commands.
 */

import type { StorylineStats } from '../types';

/**
 * K. pneumoniae Demo Tutorial
 *
 * Dataset: SRR36708862 - Clinical isolate from hospital outbreak investigation
 * Technology: Illumina NovaSeq 6000, 150bp paired-end
 */
export const kpneumoniaeDemo: StorylineStats = {
	// ============================================
	// BASIC SAMPLE INFO
	// ============================================
	samplePrefix: 'SRR36708862',
	organism: 'Klebsiella pneumoniae',
	organismShort: 'K. pneumoniae',

	// ============================================
	// SEQKIT / FASTQC - Raw read statistics
	// ============================================
	totalReads: 990478,
	readLength: 271,
	minLen: 35,
	maxLen: 301,
	gcContent: 55.2,
	q20Percent: 97.2,
	q30Percent: 93.8,

	// ============================================
	// TRIMMOMATIC - Read trimming results
	// ============================================
	trimBothSurvivingPercent: 99.23,
	trimForwardOnlyPercent: 0.47,
	trimReverseOnlyPercent: 0.03,
	trimDroppedPercent: 0.27,

	// ============================================
	// UNICYCLER / ASSEMBLY - Assembly statistics
	// ============================================
	assemblySize: 5553065,
	numContigs: 65,
	numContigsAll: 117,
	n50: 371705,
	n75: 224673,
	l50: 6,
	l75: 10,
	largestContig: 837178,
	assemblyGC: 57.18,
	numCircular: 3,
	numComponents: 4,

	// ============================================
	// PROKKA - Annotation statistics
	// ============================================
	numCDS: 5174,
	numtRNA: 77,
	numrRNA: 6,
	numtmRNA: 1,
	numMiscRNA: 0,
	numCRISPR: 0,

	// ============================================
	// CHECKM2 - Quality assessment
	// ============================================
	checkm: {
		completeness: 99.92,
		contamination: 0.38,
		strain_heterogeneity: 0.00,
		quality: 'High'
	},

	// ============================================
	// MLST - Multilocus sequence typing
	// ============================================
	mlst: {
		scheme: 'klebsiella',
		st: 'ST307',
		alleles: {
			gapA: 4,
			infB: 1,
			mdh: 2,
			pgi: 52,
			phoE: 1,
			rpoB: 1,
			tonB: 7
		},
		significance: 'High-risk international clone'
	},

	// ============================================
	// ABRICATE - AMR gene detection
	// ============================================
	amrDatabase: 'ncbi',
	amrGenes: [
		{
			gene: 'blaKPC-2',
			coverage: 100.00,
			identity: 100.00,
			accession: 'NG_049253.1',
			product: 'KPC-2 carbapenemase',
			resistance: 'CARBAPENEM',
			contig: 'contig_1',
			start: 2345678,
			end: 2346559,
			strand: '+'
		},
		{
			gene: 'blaSHV-11',
			coverage: 100.00,
			identity: 99.77,
			accession: 'NG_049956.1',
			product: 'SHV-11 beta-lactamase',
			resistance: 'BETA-LACTAM',
			contig: 'contig_1',
			start: 1234567,
			end: 1235432,
			strand: '+'
		},
		{
			gene: 'fosA',
			coverage: 100.00,
			identity: 100.00,
			accession: 'NG_047840.1',
			product: 'FosA fosfomycin resistance',
			resistance: 'FOSFOMYCIN',
			contig: 'contig_1',
			start: 3456789,
			end: 3457208,
			strand: '-'
		},
		{
			gene: 'oqxA',
			coverage: 100.00,
			identity: 99.91,
			accession: 'NG_048024.1',
			product: 'OqxA efflux pump',
			resistance: 'QUINOLONE',
			contig: 'contig_1',
			start: 4567890,
			end: 4569056,
			strand: '+'
		},
		{
			gene: 'oqxB',
			coverage: 100.00,
			identity: 99.87,
			accession: 'NG_048025.1',
			product: 'OqxB efflux pump',
			resistance: 'QUINOLONE',
			contig: 'contig_1',
			start: 4569123,
			end: 4572278,
			strand: '+'
		}
	],

	// ============================================
	// PLASMIDFINDER - Plasmid detection
	// ============================================
	plasmids: [
		{
			plasmid: 'IncFIB(K)',
			identity: 98.93,
			accession: 'JN233704',
			contig: 'contig_2',
			coverage: 100.00
		},
		{
			plasmid: 'ColRNAI',
			identity: 100.00,
			accession: 'DQ298019',
			contig: 'contig_3',
			coverage: 98.45
		}
	],

	// ============================================
	// QUAST - Assembly quality assessment
	// ============================================
	quast: {
		contigsGe500: 65,
		contigsGe1000: 57,
		contigsGe5000: 33,
		contigsGe10000: 29,
		contigsGe25000: 24,
		contigsGe50000: 18,
		totalLengthGe0: 5564255,
		totalLengthGe1000: 5547651,
		nsPer100kb: 0.00
	},

	// ============================================
	// MOB_RECON / PLATON - Plasmid analysis
	// ============================================
	plasmidContigs: [
		{
			name: 'contig_2',
			size: 5409,
			type: 'IncFIB(K)',
			mobility: 'conjugative'
		},
		{
			name: 'contig_3',
			size: 4315,
			type: 'ColRNAI',
			mobility: 'mobilizable'
		},
		{
			name: 'contig_4',
			size: 2532,
			type: 'Unknown',
			mobility: 'non-mobilizable'
		}
	],

	// ============================================
	// BANDAGE - Assembly graph statistics
	// ============================================
	bandage: {
		nodes: 189,
		edges: 243,
		components: 4,
		deadEnds: 6,
		circularContigs: 3,
		largestComponentSize: 5553813,
		largestComponentSegments: 186
	}
};

/**
 * Linux Basics Tutorial
 *
 * Simple demo dataset for learning Linux commands
 */
export const linuxBasics: StorylineStats = {
	// Basic info
	samplePrefix: 'sample',
	organism: 'Demo organism',
	organismShort: 'Demo',

	// Sequencing stats
	totalReads: 100000,
	readLength: 150,
	minLen: 35,
	maxLen: 151,
	gcContent: 50.0,
	q20Percent: 95.0,
	q30Percent: 90.0,

	// Trimmomatic
	trimBothSurvivingPercent: 98.5,
	trimForwardOnlyPercent: 0.8,
	trimReverseOnlyPercent: 0.2,
	trimDroppedPercent: 0.5,

	// Assembly
	assemblySize: 1000000,
	numContigs: 5,
	numContigsAll: 10,
	n50: 500000,
	n75: 300000,
	l50: 1,
	l75: 2,
	largestContig: 600000,
	assemblyGC: 50.0,
	numCircular: 1,
	numComponents: 2,

	// Annotation
	numCDS: 1000,
	numtRNA: 20,
	numrRNA: 6,
	numtmRNA: 1,
	numMiscRNA: 0,
	numCRISPR: 0,

	// CheckM2
	checkm: {
		completeness: 98.5,
		contamination: 0.5,
		strain_heterogeneity: 0.0,
		quality: 'High'
	},

	// MLST
	mlst: {
		scheme: 'demo',
		st: 'ST1',
		alleles: { locus1: 1, locus2: 1, locus3: 1 },
		significance: 'Demo type'
	},

	// AMR
	amrDatabase: 'ncbi',
	amrGenes: [
		{
			gene: 'blaDemo-1',
			coverage: 100.0,
			identity: 100.0,
			accession: 'DEMO001',
			product: 'Demo beta-lactamase',
			resistance: 'BETA-LACTAM',
			contig: 'contig_1',
			start: 1000,
			end: 2000,
			strand: '+'
		}
	],

	// Plasmids
	plasmids: [],

	// QUAST
	quast: {
		contigsGe500: 5,
		contigsGe1000: 5,
		contigsGe5000: 4,
		contigsGe10000: 3,
		contigsGe25000: 2,
		contigsGe50000: 1,
		totalLengthGe0: 1000000,
		totalLengthGe1000: 1000000,
		nsPer100kb: 0.0
	},

	// Plasmid contigs
	plasmidContigs: [],

	// Bandage
	bandage: {
		nodes: 10,
		edges: 12,
		components: 2,
		deadEnds: 2,
		circularContigs: 1,
		largestComponentSize: 900000,
		largestComponentSegments: 8
	}
};

/**
 * Get stats for a tutorial storyline by ID
 */
export function getTutorialStats(storylineId: string): StorylineStats {
	switch (storylineId) {
		case 'kpneumoniae-demo':
		case 'kpneumoniae_demo':
			return kpneumoniaeDemo;
		case 'linux-basics':
		case 'linux_basics':
			return linuxBasics;
		default:
			return kpneumoniaeDemo;
	}
}

// Export all stats for direct access
export const tutorialStats: Record<string, StorylineStats> = {
	'kpneumoniae-demo': kpneumoniaeDemo,
	'kpneumoniae_demo': kpneumoniaeDemo,
	'linux-basics': linuxBasics,
	'linux_basics': linuxBasics
};
