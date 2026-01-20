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
