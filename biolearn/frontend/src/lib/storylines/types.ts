// Shared types for all storylines

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
	category: 'tutorial' | 'wgs_bacteria' | 'amplicon_bacteria' | 'reports';  // Template folder category
	templateId?: string;  // Template folder storyline ID (if different from id, e.g., 'kpneumoniae_demo' vs 'kpneumoniae-demo')
	title: string;
	subtitle: string;
	organism: string;
	technology: 'illumina' | 'pacbio' | 'nanopore' | 'hybrid' | 'r-report' | 'linux-basics';
	technologyLabel: string;
	dataDir: string;
	sections: StorylineSection[];
	toolsUsed: string[];
}

export interface StorylineSummary {
	id: string;
	title: string;
	subtitle: string;
	technology: string;
	technologyLabel: string;
}

/**
 * Configurable statistics for storyline-specific terminal outputs.
 * These values are used to generate realistic tool outputs that match
 * each storyline's dataset characteristics.
 */
export interface StorylineStats {
	// Basic sequencing stats
	totalReads: number;          // Total read pairs (e.g., 990478)
	readLength: number;          // Average read length in bp (e.g., 271 for Illumina)
	minLen: number;              // Minimum read length (e.g., 35)
	maxLen: number;              // Maximum read length (e.g., 301)
	gcContent: number;           // GC content percentage (e.g., 55.2)

	// Quality metrics
	q20Percent: number;          // Percentage of Q20+ bases (e.g., 97.2)
	q30Percent: number;          // Percentage of Q30+ bases (e.g., 93.8)

	// Trimmomatic results (percentages)
	trimBothSurvivingPercent: number;   // e.g., 99.23
	trimForwardOnlyPercent: number;     // e.g., 0.47
	trimReverseOnlyPercent: number;     // e.g., 0.03
	trimDroppedPercent: number;         // e.g., 0.27

	// Assembly stats
	assemblySize: number;        // Total assembly size in bp (e.g., 5234567)
	numContigs: number;          // Number of contigs (e.g., 1 for complete, more for draft)
	n50: number;                 // N50 value (e.g., 5234567 for complete)
	largestContig: number;       // Largest contig size (e.g., 5234567)

	// Annotation stats
	numCDS: number;              // Coding sequences (e.g., 4876)
	numtRNA: number;             // tRNA genes (e.g., 86)
	numrRNA: number;             // rRNA genes (e.g., 25)

	// AMR/MLST results
	mlstST: string;              // MLST sequence type (e.g., "ST15")
	mlstScheme: string;          // MLST scheme (e.g., "kpneumoniae")
	amrGenes: string[];          // List of AMR genes found

	// File naming
	samplePrefix: string;        // Sample file prefix (e.g., "SRR36708862")
	organism: string;            // Organism name for outputs
}
