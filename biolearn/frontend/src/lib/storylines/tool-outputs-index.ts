/**
 * Central index for storyline-specific tool outputs
 *
 * Import this to get the appropriate stats based on storyline context.
 */

import type { StorylineStats, AmrGeneEntry, MlstProfile, PlasmidResult, CheckmResult } from './types';
import { tutorialStats, getTutorialStats, kpneumoniaeDemo } from './tutorial/tool-outputs';
import { wgsBacteriaStats, getWgsBacteriaStats, hospital } from './wgs-bacteria/tool-outputs';

/**
 * Get stats for any storyline by category and storyline ID
 *
 * @param category - The storyline category (tutorial, wgs_bacteria, amplicon_bacteria)
 * @param storylineId - The storyline ID within that category
 * @returns The StorylineStats for generating terminal outputs
 */
export function getStorylineStats(category: string, storylineId: string): StorylineStats {
	// Normalize category name (handle both dash and underscore formats)
	const normalizedCategory = category.replace(/-/g, '_');

	switch (normalizedCategory) {
		case 'tutorial':
			return getTutorialStats(storylineId);

		case 'wgs_bacteria':
			return getWgsBacteriaStats(storylineId);

		case 'amplicon_bacteria':
			// TODO: Add amplicon bacteria stats when needed
			return kpneumoniaeDemo; // Fallback for now

		default:
			// Default to tutorial kpneumoniae demo
			return kpneumoniaeDemo;
	}
}

/**
 * Get stats by combined storyline path (e.g., "tutorial/kpneumoniae-demo")
 */
export function getStatsByPath(path: string): StorylineStats {
	const parts = path.split('/');
	if (parts.length >= 2) {
		return getStorylineStats(parts[0], parts[1]);
	}
	// Try to match just the storyline ID across all categories
	if (tutorialStats[path]) return tutorialStats[path];
	if (wgsBacteriaStats[path]) return wgsBacteriaStats[path];
	return kpneumoniaeDemo;
}

/**
 * Helper to format AMR genes for abricate output
 */
export function formatAmrOutput(genes: AmrGeneEntry[]): string {
	const header = '#FILE\tSEQUENCE\tSTART\tEND\tSTRAND\tGENE\tCOVERAGE\tGAPS\t%COVERAGE\t%IDENTITY\tDATABASE\tACCESSION\tPRODUCT\tRESISTANCE';
	const rows = genes.map(g =>
		`assembly.fasta\t${g.contig}\t${g.start}\t${g.end}\t${g.strand}\t${g.gene}\t1-${g.end - g.start}/${g.end - g.start}\t0/0\t${g.coverage.toFixed(2)}\t${g.identity.toFixed(2)}\tncbi\t${g.accession}\t${g.product}\t${g.resistance}`
	);
	return [header, ...rows].join('\n');
}

/**
 * Helper to format MLST output
 */
export function formatMlstOutput(mlst: MlstProfile, filename: string = 'o_unicycler/assembly.fasta'): string {
	const alleleList = Object.entries(mlst.alleles)
		.map(([locus, num]) => `${locus}(${num})`)
		.join('\t');
	return `${filename}\t${mlst.scheme}\t${mlst.st.replace('ST', '')}\t${alleleList}`;
}

/**
 * Helper to format plasmid finder output
 */
export function formatPlasmidOutput(plasmids: PlasmidResult[]): string {
	if (plasmids.length === 0) {
		return 'No plasmid replicons found.';
	}
	const header = 'Database\tPlasmid\tIdentity\tQuery / Template length\tContig\tPosition in contig\tNote\tAccession number';
	const rows = plasmids.map(p =>
		`plasmidfinder\t${p.plasmid}\t${p.identity.toFixed(2)}\t${p.coverage.toFixed(2)}%\t${p.contig}\t1..1000\t\t${p.accession}`
	);
	return [header, ...rows].join('\n');
}

// Re-export individual stats for direct access
export { tutorialStats, wgsBacteriaStats };
export { kpneumoniaeDemo, hospital };
export type { StorylineStats, AmrGeneEntry, MlstProfile, PlasmidResult, CheckmResult };
