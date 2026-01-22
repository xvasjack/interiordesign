/**
 * Tool outputs configuration for WGS Bacteria storylines
 *
 * Each storyline has unique stats matching its narrative and dataset.
 * Edit the numbers here to customize terminal outputs for each scenario.
 */

import type { StorylineStats } from '../types';

/**
 * Hospital Outbreak Investigation
 *
 * K. pneumoniae carbapenem-resistant outbreak in ICU
 * Technology: Illumina MiSeq, 250bp paired-end
 */
export const hospital: StorylineStats = {
	// Sequencing - high coverage for outbreak tracking
	totalReads: 1245678,
	readLength: 249,
	minLen: 35,
	maxLen: 251,
	gcContent: 57.1,

	// Quality metrics
	q20Percent: 96.8,
	q30Percent: 92.4,

	// Trimmomatic results
	trimBothSurvivingPercent: 98.76,
	trimForwardOnlyPercent: 0.62,
	trimReverseOnlyPercent: 0.05,
	trimDroppedPercent: 0.57,

	// Assembly - complete with plasmid
	assemblySize: 5678234,
	numContigs: 2,
	n50: 5432100,
	largestContig: 5432100,

	// Annotation
	numCDS: 5234,
	numtRNA: 89,
	numrRNA: 25,

	// AMR/MLST - carbapenem resistance
	mlstST: 'ST258',
	mlstScheme: 'kpneumoniae',
	amrGenes: ['blaKPC-2', 'blaSHV-12', 'blaTEM-1', 'aac(6\')-Ib', 'oqxA', 'oqxB', 'fosA', 'catA1'],

	// File naming
	samplePrefix: 'ICU_KP_001',
	organism: 'Klebsiella pneumoniae'
};

/**
 * Clinical Diagnostics
 *
 * E. coli urinary tract infection isolate
 * Technology: Illumina NextSeq 550, 150bp paired-end
 */
export const clinical: StorylineStats = {
	// Sequencing
	totalReads: 876543,
	readLength: 148,
	minLen: 35,
	maxLen: 151,
	gcContent: 50.8,

	// Quality metrics
	q20Percent: 97.5,
	q30Percent: 94.2,

	// Trimmomatic results
	trimBothSurvivingPercent: 99.12,
	trimForwardOnlyPercent: 0.43,
	trimReverseOnlyPercent: 0.02,
	trimDroppedPercent: 0.43,

	// Assembly
	assemblySize: 5123456,
	numContigs: 3,
	n50: 4567890,
	largestContig: 4567890,

	// Annotation
	numCDS: 4765,
	numtRNA: 84,
	numrRNA: 22,

	// AMR/MLST - ESBL producing
	mlstST: 'ST131',
	mlstScheme: 'ecoli',
	amrGenes: ['blaCTX-M-27', 'blaOXA-1', 'aac(3)-IIa', 'aadA5', 'sul1', 'dfrA17', 'tet(A)'],

	// File naming
	samplePrefix: 'UTI_EC_042',
	organism: 'Escherichia coli'
};

/**
 * Plant Pathogen
 *
 * Xanthomonas citri causing citrus canker
 * Technology: Illumina HiSeq X, 150bp paired-end
 */
export const plant: StorylineStats = {
	// Sequencing
	totalReads: 1567890,
	readLength: 149,
	minLen: 35,
	maxLen: 151,
	gcContent: 64.7,

	// Quality metrics
	q20Percent: 98.1,
	q30Percent: 95.3,

	// Trimmomatic results
	trimBothSurvivingPercent: 99.45,
	trimForwardOnlyPercent: 0.28,
	trimReverseOnlyPercent: 0.01,
	trimDroppedPercent: 0.26,

	// Assembly
	assemblySize: 5234789,
	numContigs: 1,
	n50: 5234789,
	largestContig: 5234789,

	// Annotation
	numCDS: 4321,
	numtRNA: 54,
	numrRNA: 6,

	// Pathogen typing
	mlstST: 'ST1',
	mlstScheme: 'xanthomonas',
	amrGenes: ['strA', 'strB', 'sul1'],

	// File naming
	samplePrefix: 'XCC_Citrus_01',
	organism: 'Xanthomonas citri'
};

/**
 * Fish Pathogen
 *
 * Aeromonas salmonicida from salmon farm outbreak
 * Technology: Illumina MiSeq, 300bp paired-end
 */
export const fish: StorylineStats = {
	// Sequencing
	totalReads: 923456,
	readLength: 295,
	minLen: 35,
	maxLen: 301,
	gcContent: 58.3,

	// Quality metrics
	q20Percent: 95.6,
	q30Percent: 89.8,

	// Trimmomatic results
	trimBothSurvivingPercent: 97.89,
	trimForwardOnlyPercent: 0.98,
	trimReverseOnlyPercent: 0.08,
	trimDroppedPercent: 1.05,

	// Assembly
	assemblySize: 4702345,
	numContigs: 4,
	n50: 2345678,
	largestContig: 2890123,

	// Annotation
	numCDS: 4123,
	numtRNA: 72,
	numrRNA: 19,

	// Pathogen typing
	mlstST: 'ST3',
	mlstScheme: 'aeromonas',
	amrGenes: ['tetA', 'tetR', 'floR', 'sul2', 'aadA1'],

	// File naming
	samplePrefix: 'AS_Salmon_07',
	organism: 'Aeromonas salmonicida'
};

/**
 * Foodborne Outbreak
 *
 * Salmonella enterica from contaminated lettuce
 * Technology: Illumina NovaSeq 6000, 150bp paired-end
 */
export const foodborne: StorylineStats = {
	// Sequencing - high throughput for outbreak
	totalReads: 2345678,
	readLength: 150,
	minLen: 35,
	maxLen: 151,
	gcContent: 52.2,

	// Quality metrics
	q20Percent: 98.3,
	q30Percent: 95.7,

	// Trimmomatic results
	trimBothSurvivingPercent: 99.34,
	trimForwardOnlyPercent: 0.35,
	trimReverseOnlyPercent: 0.01,
	trimDroppedPercent: 0.30,

	// Assembly
	assemblySize: 4857234,
	numContigs: 1,
	n50: 4857234,
	largestContig: 4857234,

	// Annotation
	numCDS: 4567,
	numtRNA: 84,
	numrRNA: 22,

	// Serotyping and AMR
	mlstST: 'ST19',
	mlstScheme: 'senterica',
	amrGenes: ['blaTEM-1', 'strA', 'strB', 'sul2', 'tet(B)', 'floR'],

	// File naming
	samplePrefix: 'SE_Lettuce_12',
	organism: 'Salmonella enterica'
};

/**
 * Wastewater Surveillance
 *
 * E. coli from wastewater treatment plant
 * Technology: Illumina NextSeq 2000, 150bp paired-end
 */
export const wastewater: StorylineStats = {
	// Sequencing
	totalReads: 1876543,
	readLength: 149,
	minLen: 35,
	maxLen: 151,
	gcContent: 50.5,

	// Quality metrics
	q20Percent: 97.8,
	q30Percent: 94.5,

	// Trimmomatic results
	trimBothSurvivingPercent: 99.21,
	trimForwardOnlyPercent: 0.41,
	trimReverseOnlyPercent: 0.02,
	trimDroppedPercent: 0.36,

	// Assembly - draft with multiple contigs
	assemblySize: 5345678,
	numContigs: 12,
	n50: 876543,
	largestContig: 1234567,

	// Annotation
	numCDS: 5012,
	numtRNA: 86,
	numrRNA: 22,

	// AMR surveillance
	mlstST: 'ST38',
	mlstScheme: 'ecoli',
	amrGenes: ['blaCTX-M-15', 'blaTEM-1', 'blaOXA-1', 'aac(6\')-Ib-cr', 'qnrS1', 'sul1', 'sul2', 'dfrA14', 'tet(A)', 'catB3'],

	// File naming
	samplePrefix: 'WW_EC_089',
	organism: 'Escherichia coli'
};

/**
 * Get stats for a WGS bacteria storyline by ID
 */
export function getWgsBacteriaStats(storylineId: string): StorylineStats {
	switch (storylineId) {
		case 'hospital':
			return hospital;
		case 'clinical':
			return clinical;
		case 'plant':
			return plant;
		case 'fish':
			return fish;
		case 'foodborne':
			return foodborne;
		case 'wastewater':
			return wastewater;
		default:
			// Default to hospital stats
			return hospital;
	}
}

// Export all stats for direct access
export const wgsBacteriaStats: Record<string, StorylineStats> = {
	hospital,
	clinical,
	plant,
	fish,
	foodborne,
	wastewater
};
