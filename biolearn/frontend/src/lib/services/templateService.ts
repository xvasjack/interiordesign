/**
 * Template service for loading storyline content from the backend API.
 *
 * This service provides functions to:
 * - Get tool information (execution time, files, summary)
 * - Get terminal output for tools
 * - Get output file contents
 *
 * All content is loaded from the template directory via the backend API.
 */

const API_BASE = '/api/templates';

export interface ToolInfo {
	name: string;
	execution_time: number;
	files: string[];
	summary?: Record<string, string>;
	chart_data?: Record<string, unknown>;
}

export interface StorylineInfo {
	id: string;
	title: string;
	description: string;
	tools: string[];
}

// Cache for file contents to avoid repeated API calls
const fileContentCache: Map<string, string> = new Map();
const toolInfoCache: Map<string, ToolInfo> = new Map();

/**
 * Get list of all available storylines.
 */
export async function getStorylines(): Promise<StorylineInfo[]> {
	const response = await fetch(`${API_BASE}/storylines`);
	if (!response.ok) {
		console.error('Failed to fetch storylines');
		return [];
	}
	return response.json();
}

/**
 * Get tool information from the manifest.
 */
export async function getToolInfo(storylineId: string, toolName: string): Promise<ToolInfo | null> {
	const cacheKey = `${storylineId}:${toolName}`;
	if (toolInfoCache.has(cacheKey)) {
		return toolInfoCache.get(cacheKey)!;
	}

	try {
		const response = await fetch(`${API_BASE}/storylines/${storylineId}/tools/${toolName}`);
		if (!response.ok) {
			return null;
		}
		const info = await response.json();
		toolInfoCache.set(cacheKey, info);
		return info;
	} catch (error) {
		console.error(`Failed to fetch tool info for ${toolName}:`, error);
		return null;
	}
}

/**
 * Get terminal output for a tool.
 */
export async function getTerminalOutput(storylineId: string, toolName: string): Promise<string | null> {
	try {
		const response = await fetch(`${API_BASE}/storylines/${storylineId}/tools/${toolName}/terminal`);
		if (!response.ok) {
			return null;
		}
		return response.text();
	} catch (error) {
		console.error(`Failed to fetch terminal output for ${toolName}:`, error);
		return null;
	}
}

/**
 * Get output file content.
 */
export async function getFileContent(storylineId: string, filename: string): Promise<string | null> {
	const cacheKey = `${storylineId}:${filename}`;
	if (fileContentCache.has(cacheKey)) {
		return fileContentCache.get(cacheKey)!;
	}

	try {
		const response = await fetch(`${API_BASE}/storylines/${storylineId}/files/${filename}`);
		if (!response.ok) {
			return null;
		}
		const content = await response.text();
		fileContentCache.set(cacheKey, content);
		return content;
	} catch (error) {
		console.error(`Failed to fetch file content for ${filename}:`, error);
		return null;
	}
}

/**
 * Get list of output files for a tool.
 */
export async function getToolFiles(storylineId: string, toolName: string): Promise<string[]> {
	const info = await getToolInfo(storylineId, toolName);
	return info?.files ?? [];
}

/**
 * Get execution time for a tool.
 */
export async function getExecutionTime(storylineId: string, toolName: string): Promise<number> {
	const info = await getToolInfo(storylineId, toolName);
	return info?.execution_time ?? 10;
}

/**
 * Get summary statistics for a tool.
 */
export async function getSummary(storylineId: string, toolName: string): Promise<Record<string, string> | null> {
	const info = await getToolInfo(storylineId, toolName);
	return info?.summary ?? null;
}

/**
 * Clear all caches (useful for development/testing).
 */
export function clearCache(): void {
	fileContentCache.clear();
	toolInfoCache.clear();
}

/**
 * Get file type from filename extension.
 */
export function getFileType(filename: string): string {
	const ext = filename.split('.').pop()?.toLowerCase() ?? '';
	const typeMap: Record<string, string> = {
		'html': 'html',
		'txt': 'txt',
		'tsv': 'tsv',
		'csv': 'csv',
		'fasta': 'fasta',
		'fa': 'fasta',
		'fna': 'fasta',
		'faa': 'fasta',
		'fastq': 'fastq',
		'fq': 'fastq',
		'gfa': 'gfa',
		'gff': 'gff',
		'gff3': 'gff',
		'gbk': 'gbk',
		'gbff': 'gbk',
		'vcf': 'vcf',
		'log': 'log',
		'json': 'json',
		'png': 'png',
		'zip': 'zip',
		'gz': 'gz',
		'nwk': 'nwk',
		'tre': 'nwk',
		'treefile': 'nwk',
		'aln': 'aln',
	};
	return typeMap[ext] ?? 'txt';
}
