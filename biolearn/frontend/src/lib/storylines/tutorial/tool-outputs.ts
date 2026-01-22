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
	// Sequencing stats - ~54x coverage of 5Mb genome
	totalReads: 990478,
	readLength: 271,
	minLen: 35,
	maxLen: 301,
	gcContent: 55.2,

	// Quality metrics
	q20Percent: 97.2,
	q30Percent: 93.8,

	// Trimmomatic results
	trimBothSurvivingPercent: 99.23,
	trimForwardOnlyPercent: 0.47,
	trimReverseOnlyPercent: 0.03,
	trimDroppedPercent: 0.27,

	// Assembly - complete circular chromosome
	assemblySize: 5234567,
	numContigs: 1,
	n50: 5234567,
	largestContig: 5234567,

	// Annotation
	numCDS: 4876,
	numtRNA: 86,
	numrRNA: 25,

	// AMR/MLST
	mlstST: 'ST15',
	mlstScheme: 'kpneumoniae',
	amrGenes: ['blaSHV-28', 'blaCTX-M-15', 'blaOXA-1', 'aac(6\')-Ib-cr', 'oqxA', 'oqxB', 'fosA'],

	// File naming
	samplePrefix: 'SRR36708862',
	organism: 'Klebsiella pneumoniae'
};

/**
 * Linux Basics Tutorial
 *
 * Simple demo dataset for learning Linux commands
 */
export const linuxBasics: StorylineStats = {
	totalReads: 100000,
	readLength: 150,
	minLen: 35,
	maxLen: 151,
	gcContent: 50.0,

	q20Percent: 95.0,
	q30Percent: 90.0,

	trimBothSurvivingPercent: 98.5,
	trimForwardOnlyPercent: 0.8,
	trimReverseOnlyPercent: 0.2,
	trimDroppedPercent: 0.5,

	assemblySize: 1000000,
	numContigs: 5,
	n50: 500000,
	largestContig: 600000,

	numCDS: 1000,
	numtRNA: 20,
	numrRNA: 6,

	mlstST: 'ST1',
	mlstScheme: 'demo',
	amrGenes: ['blaDemo-1'],

	samplePrefix: 'sample',
	organism: 'Demo organism'
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
			// Default to kpneumoniae demo stats
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
