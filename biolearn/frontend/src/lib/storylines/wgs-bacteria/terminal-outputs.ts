/**
 * Terminal outputs for the WGS Bacteria storyline
 *
 * This file contains help texts and simulated outputs for tools
 * used in the hospital outbreak and other WGS scenarios.
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
	},
	'fastqc': {
		'main': [
			'\x1b[1mFastQC\x1b[0m - A quality control tool for high throughput sequence data',
			'',
			'\x1b[1mUsage:\x1b[0m',
			'  fastqc [options] <seqfile1> <seqfile2> ...',
			'',
			'\x1b[1mOptions:\x1b[0m',
			'  -o, --outdir     Create all output files in the specified directory',
			'  -t, --threads    Number of files to process simultaneously',
			'  -f, --format     Force file format (fastq, bam, sam)',
			'  --noextract      Do not uncompress the output file after creating it',
			'  -h, --help       Print this help message',
			'',
			'\x1b[1mExamples:\x1b[0m',
			'  fastqc sample_R1.fastq.gz sample_R2.fastq.gz',
			'  fastqc *.fastq.gz -o qc_reports/ -t 4'
		].join('\n')
	},
	'trimmomatic': {
		'main': [
			'\x1b[1mTrimmomatic\x1b[0m - A flexible read trimming tool for Illumina NGS data',
			'',
			'\x1b[1mUsage:\x1b[0m',
			'  trimmomatic PE [-threads <threads>] <input1> <input2>',
			'    <output1P> <output1U> <output2P> <output2U> <steps>',
			'',
			'\x1b[1mTrimming Steps:\x1b[0m',
			'  ILLUMINACLIP:<fastaWithAdapters>:<seed>:<palindrome>:<simple>   Remove adapters',
			'  SLIDINGWINDOW:<windowSize>:<requiredQuality>                    Sliding window trimming',
			'  LEADING:<quality>             Remove leading low quality bases',
			'  TRAILING:<quality>            Remove trailing low quality bases',
			'  MINLEN:<length>               Drop reads below specified length',
			'',
			'\x1b[1mExample:\x1b[0m',
			'  trimmomatic PE -phred33 input_R1.fq.gz input_R2.fq.gz \\',
			'    out_R1_paired.fq.gz out_R1_unpaired.fq.gz \\',
			'    out_R2_paired.fq.gz out_R2_unpaired.fq.gz \\',
			'    ILLUMINACLIP:TruSeq3-PE.fa:2:30:10 SLIDINGWINDOW:4:15 MINLEN:36'
		].join('\n')
	},
	'unicycler': {
		'main': [
			'\x1b[1mUnicycler\x1b[0m - Hybrid assembly pipeline for bacterial genomes',
			'',
			'\x1b[1mUsage:\x1b[0m',
			'  unicycler -1 <R1.fq.gz> -2 <R2.fq.gz> -o <output_dir>',
			'',
			'\x1b[1mOptions:\x1b[0m',
			'  -1, --short1    Forward reads (FASTQ)',
			'  -2, --short2    Reverse reads (FASTQ)',
			'  -l, --long      Long reads for hybrid assembly (optional)',
			'  -o, --out       Output directory',
			'  -t, --threads   Number of threads (default: 8)',
			'  --mode          Assembly mode: conservative, normal, bold (default: normal)',
			'  -h, --help      Show this help message',
			'',
			'\x1b[1mExamples:\x1b[0m',
			'  unicycler -1 reads_R1.fq.gz -2 reads_R2.fq.gz -o assembly/',
			'  unicycler -1 short_R1.fq.gz -2 short_R2.fq.gz -l long.fq.gz -o hybrid/'
		].join('\n')
	},
	'prokka': {
		'main': [
			'\x1b[1mProkka\x1b[0m - Rapid prokaryotic genome annotation',
			'',
			'\x1b[1mUsage:\x1b[0m',
			'  prokka [options] <contigs.fasta>',
			'',
			'\x1b[1mOptions:\x1b[0m',
			'  --outdir     Output directory',
			'  --prefix     Filename prefix for output files',
			'  --genus      Genus name (triggers genus-specific BLAST)',
			'  --species    Species name',
			'  --strain     Strain name',
			'  --cpus       Number of CPUs (default: 8)',
			'  -h, --help   Show this help message',
			'',
			'\x1b[1mExample:\x1b[0m',
			'  prokka --outdir results/ --prefix sample assembly.fasta'
		].join('\n')
	},
	'abricate': {
		'main': [
			'\x1b[1mABRicate\x1b[0m - Mass screening of contigs for antimicrobial resistance genes',
			'',
			'\x1b[1mUsage:\x1b[0m',
			'  abricate [options] <contigs.fasta>',
			'',
			'\x1b[1mOptions:\x1b[0m',
			'  --db         Database to use: ncbi, card, resfinder, vfdb, plasmidfinder',
			'  --minid      Minimum identity (default: 80)',
			'  --mincov     Minimum coverage (default: 80)',
			'  -h, --help   Show this help message',
			'',
			'\x1b[1mDatabases:\x1b[0m',
			'  ncbi            NCBI AMRFinderPlus',
			'  card            Comprehensive Antibiotic Resistance Database',
			'  resfinder       ResFinder from CGE',
			'  vfdb            Virulence Factor Database',
			'  plasmidfinder   PlasmidFinder from CGE',
			'',
			'\x1b[1mExample:\x1b[0m',
			'  abricate --db ncbi assembly.fasta > amr_results.tsv'
		].join('\n')
	},
	'quast': {
		'main': [
			'\x1b[1mQUAST\x1b[0m - Quality Assessment Tool for Genome Assemblies',
			'',
			'\x1b[1mUsage:\x1b[0m',
			'  quast [options] <contigs.fasta>',
			'',
			'\x1b[1mOptions:\x1b[0m',
			'  -o, --output-dir   Output directory',
			'  -r, --reference    Reference genome for comparison',
			'  -t, --threads      Number of threads (default: 1)',
			'  --min-contig       Minimum contig length (default: 500)',
			'  -h, --help         Show this help message',
			'',
			'\x1b[1mExample:\x1b[0m',
			'  quast -o quast_results/ assembly.fasta'
		].join('\n')
	},
	'mlst': {
		'main': [
			'\x1b[1mmlst\x1b[0m - Scan genomes against PubMLST schemes',
			'',
			'\x1b[1mUsage:\x1b[0m',
			'  mlst [options] <contigs.fasta>',
			'',
			'\x1b[1mOptions:\x1b[0m',
			'  --scheme     Force use of a specific scheme',
			'  --list       List available schemes',
			'  --minid      Minimum identity (default: 95)',
			'  --mincov     Minimum coverage (default: 10)',
			'  -h, --help   Show this help message',
			'',
			'\x1b[1mExample:\x1b[0m',
			'  mlst assembly.fasta',
			'  mlst --scheme kpneumoniae assembly.fasta'
		].join('\n')
	}
};
