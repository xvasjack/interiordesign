/**
 * Terminal outputs for the Tutorial storyline
 *
 * This file contains help texts and simulated outputs for tools
 * used in the Linux Basics and K. pneumoniae demo tutorials.
 */

// Help texts for tools (displayed when user runs tool --help)
export const helpTexts: Record<string, Record<string, string>> = {
	'seqkit': {
		'main': [
			'\x1b[1mseqkit\x1b[0m - a cross-platform and ultrafast toolkit for FASTA/Q file manipulation',
                        '',
			'\x1b[1mUsage:\x1b[0m',
			'  seqkit [command]',
			'',
			'\x1b[1mAvailable Commands:\x1b[0m',
			'  stats       simple statistics of FASTA/Q files',
			'  seq         transform sequences',
			'  subseq      get subsequences by region/gtf/bed',
			'  fq2fa       convert FASTQ to FASTA',
			'  fx2tab      convert FASTA/Q to tabular format',
			'  grep        search sequences by ID/name/sequence/sequence motifs',
			'  head        print first N FASTA/Q records',
			'  sample      sample sequences by number or proportion',
			'',
			'\x1b[1mFlags:\x1b[0m',
			'  -h, --help      help for seqkit',
			'  -j, --threads   number of CPUs (default 4)',
			'',
			'Use "seqkit [command] --help" for more information about a command.'
		].join('\n'),
		'stats': [
			'\x1b[1mseqkit stats\x1b[0m - simple statistics of FASTA/Q files',
			'',
			'\x1b[1mUsage:\x1b[0m',
			'  seqkit stats [flags] <file1> [file2] ...',
			'',
			'\x1b[1mFlags:\x1b[0m',
			'  -a, --all           all statistics, including sum_gap, N50, L50',
			'  -b, --basename      only output basename of files',
			'  -G, --gap-letters   gap letters (default "- .")',
			'  -j, --threads       number of CPUs (default 4)',
			'  -T, --tabular       output in machine-friendly tabular format',
			'  -h, --help          help for stats',
			'',
			'\x1b[1mExamples:\x1b[0m',
			'  seqkit stats *.fastq.gz',
			'  seqkit stats -a sample_R1.fastq.gz sample_R2.fastq.gz',
			'  seqkit stats *.fastq.gz > stats.txt'
		].join('\n')
	}
};

// Simulated file contents for cat/head/tail commands
export const fileContents: Record<string, string> = {
	'sample_info.txt': [
		'Sample Information File',
		'=======================',
		'Project: K. pneumoniae WGS Analysis',
		'Date: 2024-01-15',
		'',
		'Sample ID: SRR36708862',
		'Organism: Klebsiella pneumoniae',
		'Platform: Illumina NovaSeq 6000',
		'Read Length: 150bp paired-end',
		'Coverage: ~100x'
	].join('\n')
};

// Directory listings for ls command
export const directoryListings: Record<string, string[]> = {
	'/data/linux_tutorial': [
		'sample_info.txt',
		'sequences/'
	],
	'/data/linux_tutorial/sequences': [
		'sample_R1.fastq',
		'sample_R2.fastq'
	]
};
