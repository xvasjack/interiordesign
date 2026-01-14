<script lang="ts">
	import { onMount } from 'svelte';
	import Terminal from './Terminal.svelte';
	import StoryPanel from './StoryPanel.svelte';
	import OutputPanel from './OutputPanel.svelte';
	import { executedCommands } from '$lib/stores/terminal';
	import type { Storyline } from '$lib/storylines/wgs-bacteria';

	let {
		storyContent = '',
		currentStep = 0,
		outputData = null,
		storyline = null
	}: {
		storyContent?: string;
		currentStep?: number;
		outputData?: any;
		storyline?: Storyline | null;
	} = $props();

	let terminalHeight = $state(70); // percentage
	let isResizing = $state(false);
	let filesDropdownOpen = $state(false);
	let allGeneratedFiles = $state<{name: string, type: string, tool: string}[]>([]);

	// File contents for viewing
	const fileContents: Record<string, string> = {
		'seqkit_stats.txt': `file\tformat\ttype\tnum_seqs\tsum_len\tmin_len\tavg_len\tmax_len\nsample_01_R1.fastq.gz\tFASTQ\tDNA\t2,847,293\t427,093,950\t150\t150\t150\nsample_01_R2.fastq.gz\tFASTQ\tDNA\t2,847,293\t427,093,950\t150\t150\t150`,
		'sample_01_R1_fastqc.html': `<!DOCTYPE html>
<html>
<head>
<title>FastQC Report: sample_01_R1.fastq.gz</title>
<style type="text/css">
@media screen {
  body { font-family: Arial, Helvetica, sans-serif; font-size: 14px; margin: 0; padding: 0; background-color: #ffffff; }
  .header { background-color: #4271ae; color: white; padding: 10px 20px; display: flex; align-items: center; }
  .header h1 { margin: 0; font-size: 20px; font-weight: normal; }
  .main-container { display: flex; min-height: calc(100vh - 60px); }
  .sidebar { width: 280px; background: #f5f5f5; border-right: 1px solid #ddd; padding: 0; flex-shrink: 0; }
  .sidebar h2 { background: #4271ae; color: white; margin: 0; padding: 10px 15px; font-size: 14px; }
  .sidebar ul { list-style: none; margin: 0; padding: 0; }
  .sidebar li { border-bottom: 1px solid #ddd; }
  .sidebar li a { display: flex; align-items: center; padding: 8px 15px; text-decoration: none; color: #333; }
  .sidebar li a:hover { background: #e8e8e8; }
  .sidebar li a .icon { width: 20px; height: 20px; margin-right: 10px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: white; }
  .icon.pass { background: #36a64f; }
  .icon.warn { background: #ff9900; }
  .icon.fail { background: #dc3545; }
  .content { flex: 1; padding: 20px 30px; overflow-y: auto; }
  .module { margin-bottom: 40px; border: 1px solid #ddd; background: white; }
  .module h2 { background: #f0f0f0; margin: 0; padding: 12px 15px; font-size: 16px; border-bottom: 1px solid #ddd; display: flex; align-items: center; }
  .module h2 .status { margin-right: 10px; }
  .module-content { padding: 20px; }
  table.summary-table { border-collapse: collapse; width: 100%; max-width: 600px; }
  table.summary-table th, table.summary-table td { border: 1px solid #aaa; padding: 8px 12px; text-align: left; }
  table.summary-table th { background: #d0d0d0; }
  table.summary-table tr:nth-child(even) { background: #f9f9f9; }
  .quality-plot { width: 100%; max-width: 800px; background: #fff; border: 1px solid #ccc; padding: 10px; }
  .quality-plot .plot-area { position: relative; height: 300px; background: linear-gradient(to bottom, #d4edda 0%, #d4edda 28%, #fff3cd 28%, #fff3cd 52%, #f8d7da 52%, #f8d7da 100%); border: 1px solid #999; border-left: 2px solid #333; border-bottom: 2px solid #333; }
  .quality-plot .y-axis { position: absolute; left: -45px; top: 0; height: 100%; display: flex; flex-direction: column; justify-content: space-between; font-size: 11px; color: #333; }
  .quality-plot .x-axis { position: absolute; bottom: -25px; left: 0; width: 100%; display: flex; justify-content: space-between; font-size: 11px; color: #333; }
  .quality-plot .plot-title { text-align: center; font-weight: bold; margin-bottom: 5px; }
  .quality-plot .legend { display: flex; gap: 20px; margin-top: 10px; justify-content: center; font-size: 12px; }
  .quality-plot .legend span { display: flex; align-items: center; gap: 5px; }
  .quality-plot .legend .box { width: 15px; height: 15px; border: 1px solid #999; }
  .footer { background: #f5f5f5; padding: 15px 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
}
</style>
</head>
<body>
<div class="header">
  <div style="background: white; padding: 5px 10px; border-radius: 3px; margin-right: 15px;">
    <span style="color: #4271ae; font-weight: bold; font-size: 18px;">FastQC</span>
  </div>
  <h1>Quality Control Report - sample_01_R1.fastq.gz</h1>
</div>
<div class="main-container">
  <div class="sidebar">
    <h2>Summary</h2>
    <ul>
      <li><a href="#basic-stats"><span class="icon pass">✓</span>Basic Statistics</a></li>
      <li><a href="#per-base-quality"><span class="icon pass">✓</span>Per base sequence quality</a></li>
      <li><a href="#per-tile-quality"><span class="icon pass">✓</span>Per tile sequence quality</a></li>
      <li><a href="#per-seq-quality"><span class="icon pass">✓</span>Per sequence quality scores</a></li>
      <li><a href="#per-base-content"><span class="icon pass">✓</span>Per base sequence content</a></li>
      <li><a href="#per-seq-gc"><span class="icon warn">!</span>Per sequence GC content</a></li>
      <li><a href="#per-base-n"><span class="icon pass">✓</span>Per base N content</a></li>
      <li><a href="#seq-length"><span class="icon pass">✓</span>Sequence Length Distribution</a></li>
      <li><a href="#seq-dup"><span class="icon pass">✓</span>Sequence Duplication Levels</a></li>
      <li><a href="#overrep"><span class="icon pass">✓</span>Overrepresented sequences</a></li>
      <li><a href="#adapter"><span class="icon pass">✓</span>Adapter Content</a></li>
    </ul>
  </div>
  <div class="content">
    <div class="module" id="basic-stats">
      <h2><span class="status icon pass">✓</span>Basic Statistics</h2>
      <div class="module-content">
        <table class="summary-table">
          <tr><th>Measure</th><th>Value</th></tr>
          <tr><td>Filename</td><td>sample_01_R1.fastq.gz</td></tr>
          <tr><td>File type</td><td>Conventional base calls</td></tr>
          <tr><td>Encoding</td><td>Sanger / Illumina 1.9</td></tr>
          <tr><td>Total Sequences</td><td>2,847,293</td></tr>
          <tr><td>Sequences flagged as poor quality</td><td>0</td></tr>
          <tr><td>Sequence length</td><td>150</td></tr>
          <tr><td>%GC</td><td>52</td></tr>
        </table>
      </div>
    </div>
    <div class="module" id="per-base-quality">
      <h2><span class="status icon pass">✓</span>Per base sequence quality</h2>
      <div class="module-content">
        <p style="color:#666;font-size:13px;margin-bottom:15px;">The boxplot shows the distribution of quality scores at each position. Background colors indicate quality zones: green (Q≥28), yellow (Q20-28), red (Q&lt;20).</p>
        <div class="quality-plot">
          <div class="plot-title">Quality scores across all bases (Sanger / Illumina 1.9 encoding)</div>
          <div style="position:relative; margin-left:50px; margin-top:20px;">
            <div class="plot-area">
              <svg width="100%" height="100%" viewBox="0 0 750 300" preserveAspectRatio="none">
                <g transform="translate(15,0)">
                  <rect x="0" y="20" width="8" height="40" fill="#ffd700" stroke="#333"/>
                  <rect x="48" y="10" width="8" height="50" fill="#ffd700" stroke="#333"/>
                  <rect x="120" y="6" width="8" height="40" fill="#ffd700" stroke="#333"/>
                  <rect x="216" y="5" width="8" height="38" fill="#ffd700" stroke="#333"/>
                  <rect x="312" y="6" width="8" height="40" fill="#ffd700" stroke="#333"/>
                  <rect x="408" y="10" width="8" height="44" fill="#ffd700" stroke="#333"/>
                  <rect x="504" y="14" width="8" height="48" fill="#ffd700" stroke="#333"/>
                  <rect x="600" y="22" width="8" height="56" fill="#ffd700" stroke="#333"/>
                  <rect x="696" y="32" width="8" height="65" fill="#ffd700" stroke="#333"/>
                </g>
              </svg>
            </div>
            <div class="x-axis"><span>1</span><span>25</span><span>50</span><span>75</span><span>100</span><span>125</span><span>150</span></div>
          </div>
          <div class="legend">
            <span><div class="box" style="background:#d4edda"></div> Very good (Q≥28)</span>
            <span><div class="box" style="background:#fff3cd"></div> Reasonable (Q20-28)</span>
            <span><div class="box" style="background:#f8d7da"></div> Poor (Q&lt;20)</span>
          </div>
        </div>
      </div>
    </div>
    <div class="module" id="per-seq-gc">
      <h2><span class="status icon warn">!</span>Per sequence GC content</h2>
      <div class="module-content">
        <p style="color:#ff9900;"><strong>Warning:</strong> Minor deviation from theoretical distribution - common in bacterial samples.</p>
      </div>
    </div>
    <div class="module" id="seq-dup">
      <h2><span class="status icon pass">✓</span>Sequence Duplication Levels</h2>
      <div class="module-content">
        <table class="summary-table" style="max-width:400px;">
          <tr><td>% Deduplicated</td><td>86.3%</td></tr>
          <tr><td>% Total Deduplicated</td><td>72.1%</td></tr>
        </table>
      </div>
    </div>
    <div class="module" id="adapter">
      <h2><span class="status icon pass">✓</span>Adapter Content</h2>
      <div class="module-content">
        <p style="color:#36a64f;"><strong>Result:</strong> Adapter content below 2% - excellent quality data.</p>
      </div>
    </div>
  </div>
</div>
<div class="footer">
  <p>Produced by <strong>FastQC</strong> v0.12.1 | Analysis Date: 2024-01-15 10:23:45 | Babraham Bioinformatics</p>
</div>
</body>
</html>`,
		'sample_01_R2_fastqc.html': `<!DOCTYPE html>
<html>
<head>
<title>FastQC Report: sample_01_R2.fastq.gz</title>
<style type="text/css">
@media screen {
  body { font-family: Arial, Helvetica, sans-serif; font-size: 14px; margin: 0; padding: 0; background-color: #ffffff; }
  .header { background-color: #4271ae; color: white; padding: 10px 20px; display: flex; align-items: center; }
  .header h1 { margin: 0; font-size: 20px; font-weight: normal; }
  .main-container { display: flex; min-height: calc(100vh - 60px); }
  .sidebar { width: 280px; background: #f5f5f5; border-right: 1px solid #ddd; padding: 0; flex-shrink: 0; }
  .sidebar h2 { background: #4271ae; color: white; margin: 0; padding: 10px 15px; font-size: 14px; }
  .sidebar ul { list-style: none; margin: 0; padding: 0; }
  .sidebar li { border-bottom: 1px solid #ddd; }
  .sidebar li a { display: flex; align-items: center; padding: 8px 15px; text-decoration: none; color: #333; }
  .sidebar li a:hover { background: #e8e8e8; }
  .sidebar li a .icon { width: 20px; height: 20px; margin-right: 10px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: white; }
  .icon.pass { background: #36a64f; }
  .icon.warn { background: #ff9900; }
  .icon.fail { background: #dc3545; }
  .content { flex: 1; padding: 20px 30px; overflow-y: auto; }
  .module { margin-bottom: 40px; border: 1px solid #ddd; background: white; }
  .module h2 { background: #f0f0f0; margin: 0; padding: 12px 15px; font-size: 16px; border-bottom: 1px solid #ddd; display: flex; align-items: center; }
  .module h2 .status { margin-right: 10px; }
  .module-content { padding: 20px; }
  table.summary-table { border-collapse: collapse; width: 100%; max-width: 600px; }
  table.summary-table th, table.summary-table td { border: 1px solid #aaa; padding: 8px 12px; text-align: left; }
  table.summary-table th { background: #d0d0d0; }
  table.summary-table tr:nth-child(even) { background: #f9f9f9; }
  .quality-plot { width: 100%; max-width: 800px; background: #fff; border: 1px solid #ccc; padding: 10px; }
  .quality-plot .plot-area { position: relative; height: 300px; background: linear-gradient(to bottom, #d4edda 0%, #d4edda 28%, #fff3cd 28%, #fff3cd 52%, #f8d7da 52%, #f8d7da 100%); border: 1px solid #999; border-left: 2px solid #333; border-bottom: 2px solid #333; }
  .quality-plot .y-axis { position: absolute; left: -45px; top: 0; height: 100%; display: flex; flex-direction: column; justify-content: space-between; font-size: 11px; color: #333; }
  .quality-plot .x-axis { position: absolute; bottom: -25px; left: 0; width: 100%; display: flex; justify-content: space-between; font-size: 11px; color: #333; }
  .quality-plot .plot-title { text-align: center; font-weight: bold; margin-bottom: 5px; }
  .quality-plot .legend { display: flex; gap: 20px; margin-top: 10px; justify-content: center; font-size: 12px; }
  .quality-plot .legend span { display: flex; align-items: center; gap: 5px; }
  .quality-plot .legend .box { width: 15px; height: 15px; border: 1px solid #999; }
  .footer { background: #f5f5f5; padding: 15px 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
}
</style>
</head>
<body>
<div class="header">
  <div style="background: white; padding: 5px 10px; border-radius: 3px; margin-right: 15px;">
    <span style="color: #4271ae; font-weight: bold; font-size: 18px;">FastQC</span>
  </div>
  <h1>Quality Control Report - sample_01_R2.fastq.gz</h1>
</div>
<div class="main-container">
  <div class="sidebar">
    <h2>Summary</h2>
    <ul>
      <li><a href="#basic-stats"><span class="icon pass">✓</span>Basic Statistics</a></li>
      <li><a href="#per-base-quality"><span class="icon pass">✓</span>Per base sequence quality</a></li>
      <li><a href="#per-tile-quality"><span class="icon pass">✓</span>Per tile sequence quality</a></li>
      <li><a href="#per-seq-quality"><span class="icon pass">✓</span>Per sequence quality scores</a></li>
      <li><a href="#per-base-content"><span class="icon pass">✓</span>Per base sequence content</a></li>
      <li><a href="#per-seq-gc"><span class="icon warn">!</span>Per sequence GC content</a></li>
      <li><a href="#per-base-n"><span class="icon pass">✓</span>Per base N content</a></li>
      <li><a href="#seq-length"><span class="icon pass">✓</span>Sequence Length Distribution</a></li>
      <li><a href="#seq-dup"><span class="icon pass">✓</span>Sequence Duplication Levels</a></li>
      <li><a href="#overrep"><span class="icon pass">✓</span>Overrepresented sequences</a></li>
      <li><a href="#adapter"><span class="icon pass">✓</span>Adapter Content</a></li>
    </ul>
  </div>
  <div class="content">
    <div class="module" id="basic-stats">
      <h2><span class="status icon pass">✓</span>Basic Statistics</h2>
      <div class="module-content">
        <table class="summary-table">
          <tr><th>Measure</th><th>Value</th></tr>
          <tr><td>Filename</td><td>sample_01_R2.fastq.gz</td></tr>
          <tr><td>File type</td><td>Conventional base calls</td></tr>
          <tr><td>Encoding</td><td>Sanger / Illumina 1.9</td></tr>
          <tr><td>Total Sequences</td><td>2,847,293</td></tr>
          <tr><td>Sequences flagged as poor quality</td><td>0</td></tr>
          <tr><td>Sequence length</td><td>150</td></tr>
          <tr><td>%GC</td><td>52</td></tr>
        </table>
      </div>
    </div>
    <div class="module" id="per-base-quality">
      <h2><span class="status icon pass">✓</span>Per base sequence quality</h2>
      <div class="module-content">
        <p style="color:#666;font-size:13px;margin-bottom:15px;">R2 reads typically show slightly lower quality at the 3' end compared to R1, which is normal for Illumina paired-end sequencing.</p>
        <div class="quality-plot">
          <div class="plot-title">Quality scores across all bases (Sanger / Illumina 1.9 encoding)</div>
          <div style="position:relative; margin-left:50px; margin-top:20px;">
            <div class="plot-area">
              <svg width="100%" height="100%" viewBox="0 0 750 300" preserveAspectRatio="none">
                <g transform="translate(15,0)">
                  <rect x="0" y="28" width="8" height="45" fill="#ffd700" stroke="#333"/>
                  <rect x="48" y="16" width="8" height="52" fill="#ffd700" stroke="#333"/>
                  <rect x="120" y="8" width="8" height="42" fill="#ffd700" stroke="#333"/>
                  <rect x="216" y="8" width="8" height="42" fill="#ffd700" stroke="#333"/>
                  <rect x="312" y="12" width="8" height="46" fill="#ffd700" stroke="#333"/>
                  <rect x="408" y="20" width="8" height="54" fill="#ffd700" stroke="#333"/>
                  <rect x="504" y="32" width="8" height="62" fill="#ffd700" stroke="#333"/>
                  <rect x="600" y="50" width="8" height="74" fill="#ffd700" stroke="#333"/>
                  <rect x="696" y="68" width="8" height="86" fill="#ffd700" stroke="#333"/>
                </g>
              </svg>
            </div>
            <div class="x-axis"><span>1</span><span>25</span><span>50</span><span>75</span><span>100</span><span>125</span><span>150</span></div>
          </div>
          <div class="legend">
            <span><div class="box" style="background:#d4edda"></div> Very good (Q≥28)</span>
            <span><div class="box" style="background:#fff3cd"></div> Reasonable (Q20-28)</span>
            <span><div class="box" style="background:#f8d7da"></div> Poor (Q&lt;20)</span>
          </div>
        </div>
        <p style="margin-top:15px;color:#36a64f;"><strong>Result:</strong> Quality remains above Q20 across all positions. The drop at the 3' end is typical for R2 reads.</p>
      </div>
    </div>
    <div class="module" id="per-seq-gc">
      <h2><span class="status icon warn">!</span>Per sequence GC content</h2>
      <div class="module-content">
        <p style="color:#ff9900;"><strong>Warning:</strong> Minor deviation from theoretical distribution - consistent with R1 pattern.</p>
      </div>
    </div>
    <div class="module" id="seq-dup">
      <h2><span class="status icon pass">✓</span>Sequence Duplication Levels</h2>
      <div class="module-content">
        <table class="summary-table" style="max-width:400px;">
          <tr><td>% Deduplicated</td><td>85.8%</td></tr>
          <tr><td>% Total Deduplicated</td><td>71.4%</td></tr>
        </table>
      </div>
    </div>
    <div class="module" id="adapter">
      <h2><span class="status icon pass">✓</span>Adapter Content</h2>
      <div class="module-content">
        <p style="color:#36a64f;"><strong>Result:</strong> Minimal adapter content detected. Data is suitable for downstream analysis.</p>
      </div>
    </div>
  </div>
</div>
<div class="footer">
  <p>Produced by <strong>FastQC</strong> v0.12.1 | Analysis Date: 2024-01-15 10:23:52 | Babraham Bioinformatics</p>
</div>
</body>
</html>`,
		'assembly.fasta': `>contig_1 length=4892156 depth=45.2x circular=true\nATGCGTACGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT\n>contig_2 length=95234 depth=78.5x circular=true\nATGCGTACGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT`,
		'assembly.gfa': `H\tVN:Z:1.0\nS\t1\tATGCGTACGTAGCTAGCTAGCTAGCTAGCT\tLN:i:4892156\nS\t2\tGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC\tLN:i:95234`,
		'unicycler.log': `[2024-01-15 10:23:45] Starting Unicycler v0.5.0\n[2024-01-15 10:25:12] Assembly completed successfully\n[2024-01-15 10:25:12] 2 contigs assembled\n[2024-01-15 10:25:12] Total length: 4,987,390 bp`,
		'quast_report.html': `<!DOCTYPE html><html><head><title>QUAST Report</title><style>body{font-family:Arial;margin:20px;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #ddd;padding:12px;} th{background:#4CAF50;color:white;}</style></head><body><h1>QUAST Report</h1><table><tr><th>Metric</th><th>Value</th></tr><tr><td>Total contigs</td><td>2</td></tr><tr><td>Total length</td><td>4,987,390 bp</td></tr><tr><td>N50</td><td>4,892,156 bp</td></tr></table></body></html>`,
		'quast_report.tsv': `Assembly\tcontigs\ttotal_length\tlargest_contig\tN50\tGC_percent\nassembly\t2\t4987390\t4892156\t4892156\t52.3`,
		'amr_report.tsv': `#FILE\tSEQUENCE\tGENE\t%IDENTITY\tRESISTANCE\nassembly.fasta\tcontig_1\tblaCTX-M-15\t99.89\tCephalosporin\nassembly.fasta\tcontig_2\ttet(A)\t100.00\tTetracycline`,
		'amr_summary.txt': `AMR Gene Summary\n================\nTotal genes found: 2\n\n1. blaCTX-M-15 - Cephalosporin resistance\n2. tet(A) - Tetracycline resistance`,
		// CheckM files
		'checkm_report.tsv': `Bin Id\tMarker lineage\tCompleteness\tContamination\tStrain heterogeneity\nassembly\tf__Enterobacteriaceae\t99.45\t0.28\t0.00`,
		// ConFindr files
		'confindr_report.csv': `Sample,Genus,NumContamSNVs,ContamStatus,PercentContam\nsample_01,Escherichia,0,False,0.00`,
		'confindr_log.txt': `[2024-01-15 11:35:00] ConFindr v0.8.0\n[2024-01-15 11:35:01] Analyzing sample_01\n[2024-01-15 11:35:15] rMLST genes extracted: 53/53\n[2024-01-15 11:35:20] No contamination detected\n[2024-01-15 11:35:20] Analysis complete`,
		// Prokka files
		'sample_01.gff': `##gff-version 3\n##sequence-region chromosome_1 1 4892156\nchromosome_1\tProkka\tgene\t1\t1350\t.\t+\t.\tID=gene_0001;Name=dnaA\nchromosome_1\tProkka\tCDS\t1\t1350\t.\t+\t0\tID=CDS_0001;product=Chromosomal replication initiator`,
		'sample_01.gbk': `LOCUS       chromosome_1         4892156 bp    DNA     circular BCT 15-JAN-2024\nDEFINITION  Escherichia coli strain sample_01 chromosome\nFEATURES             Location/Qualifiers\n     source          1..4892156\n                     /organism="Escherichia coli"`,
		'sample_01.txt': `organism: Escherichia coli sample_01\ncontigs: 2\nbases: 4987390\nCDS: 4523\ntRNA: 86\nrRNA: 22`,
		// Bakta files
		'sample_01.gff3': `##gff-version 3\n##sequence-region chromosome_1 1 4892156\nchromosome_1\tBakta\tgene\t1\t1350\t.\t+\t.\tID=gene_0001;Name=dnaA;locus_tag=SAMPLE01_00001\nchromosome_1\tBakta\tCDS\t1\t1350\t.\t+\t0\tID=cds_0001;product=Chromosomal replication initiator protein DnaA`,
		'sample_01.gbff': `LOCUS       chromosome_1         4892156 bp    DNA     circular BCT 15-JAN-2024\nDEFINITION  Escherichia coli strain sample_01, complete genome.\nACCESSION   .\nVERSION     .\nKEYWORDS    .\nSOURCE      Escherichia coli\n  ORGANISM  Escherichia coli`,
		'sample_01.faa': `>SAMPLE01_00001 Chromosomal replication initiator protein DnaA\nMSLSLWQQCLARLQDELPAIPSEIIEMEKKPSTNATVGRPLRWLVDKILEQEKKTPDVVTH\n>SAMPLE01_00002 DNA polymerase III subunit beta\nMKFTVERINQGYLDGLSQRLQMRSGVVASPHDPAAAMIRQSQHLTDRLVNDLVGALEIATR`,
		'sample_01.tsv': `locus_tag\ttype\tstart\tend\tstrand\tgene\tproduct\nSAMPLE01_00001\tCDS\t1\t1350\t+\tdnaA\tChromosomal replication initiator protein DnaA\nSAMPLE01_00002\tCDS\t1524\t2624\t+\tdnaN\tDNA polymerase III subunit beta`,
		'sample_01.json': `{"version":"1.8.2","genome":{"length":4987390,"contigs":2,"gc":52.3},"features":{"CDS":4623,"tRNA":86,"rRNA":22,"ncRNA":89,"CRISPR":2}}`,
		// MLST files
		'mlst_report.tsv': `FILE\tSCHEME\tST\tadk\tfumC\tgyrB\ticd\tmdh\tpurA\trecA\nassembly/assembly.fasta\techerichia_coli_achtman\t131\t10\t11\t4\t8\t8\t8\t2`,
		// Phase 3: MOB-suite files
		'plasmid_report.tsv': `sample_id\tnum_contigs\ttotal_length\tplasmid_id\treplicon_type\tmobility\nchromosome\t1\t4892156\t-\t-\t-\nplasmid_1\t1\t95234\tAA001\tIncFIB(K),IncFII(K)\tconjugative`,
		'mobtyper_results.txt': `MOB-typer Results\n=================\nPlasmid: AA001\nSize: 95,234 bp\nReplicon type: IncFIB(K), IncFII(K)\nMobility: Conjugative\nRelaxase: MOBF\nMate-pair formation: MPF_F`,
		// Phase 3: Platon files
		'plasmid_predictions.tsv': `contig_id\tlength\tplasmid_score\tprediction\ncontig_1\t4892156\t0.023\tchromosome\ncontig_2\t95234\t0.987\tplasmid`,
		// Phase 4: Snippy files
		'snps.vcf': `##fileformat=VCFv4.2\n##source=snippy\n#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\nchromosome\t12345\t.\tA\tG\t999\tPASS\tDP=78`,
		'snps.tab': `CHROM\tPOS\tTYPE\tREF\tALT\tEFFECT\nchromosome\t12345\tsnp\tA\tG\tsynonymous_variant`,
		// Phase 4: Roary files
		'gene_presence_absence.csv': `Gene,Non-unique,Fragments,sample_01,sample_02,sample_03,reference\ndnaA,0,0,1,1,1,1\ndnaN,0,0,1,1,1,1`,
		'summary_statistics.txt': `Core genes: 3987\nSoft-core genes: 312\nShell genes: 489\nCloud genes: 446\nTotal genes: 5234`,
		// Phase 4: IQ-TREE files
		'core_alignment.treefile': `((sample_01:0.0012,sample_02:0.0008):0.0045,(sample_03:0.0023,reference:0.0089):0.0034);`,
		'core_alignment.iqtree': `IQ-TREE 2.2.0\nBest-fit model: GTR+F+I+G4\nLog-likelihood: -22345.678\nBootstrap support: >=98% for all nodes`,
		// Phase 4: Gubbins files
		'recombination_predictions.gff': `##gff-version 3\nchromosome\tGubbins\trecombination\t234567\t245678\t.\t+\t.\tID=rec_1`,
		'clean.summary.txt': `Gubbins Analysis\nRecombinant regions: 21\nBases affected: 43234 (1.25%)\nClean SNPs: 10234`
	};

	// Tool to files mapping
	const toolFiles: Record<string, {name: string, type: string}[]> = {
		'seqkit': [{ name: 'seqkit_stats.txt', type: 'txt' }],
		'fastqc': [
			{ name: 'sample_01_R1_fastqc.html', type: 'html' },
			{ name: 'sample_01_R2_fastqc.html', type: 'html' },
			{ name: 'sample_01_R1_fastqc.zip', type: 'zip' },
			{ name: 'sample_01_R2_fastqc.zip', type: 'zip' }
		],
		'trimmomatic': [
			{ name: 'sample_01_R1_paired.fq.gz', type: 'fastq' },
			{ name: 'sample_01_R2_paired.fq.gz', type: 'fastq' },
			{ name: 'sample_01_R1_unpaired.fq.gz', type: 'fastq' },
			{ name: 'sample_01_R2_unpaired.fq.gz', type: 'fastq' }
		],
		'unicycler': [
			{ name: 'assembly.fasta', type: 'fasta' },
			{ name: 'assembly.gfa', type: 'gfa' },
			{ name: 'unicycler.log', type: 'log' }
		],
		'bandage': [{ name: 'assembly_graph.png', type: 'png' }],
		'quast': [
			{ name: 'quast_report.html', type: 'html' },
			{ name: 'quast_report.tsv', type: 'tsv' }
		],
		'checkm': [
			{ name: 'checkm_report.tsv', type: 'tsv' }
		],
		'confindr': [
			{ name: 'confindr_report.csv', type: 'csv' },
			{ name: 'confindr_log.txt', type: 'txt' }
		],
		'prokka': [
			{ name: 'sample_01.gff', type: 'gff' },
			{ name: 'sample_01.gbk', type: 'gbk' },
			{ name: 'sample_01.txt', type: 'txt' }
		],
		'bakta': [
			{ name: 'sample_01.gff3', type: 'gff' },
			{ name: 'sample_01.gbff', type: 'gbk' },
			{ name: 'sample_01.faa', type: 'faa' },
			{ name: 'sample_01.tsv', type: 'tsv' },
			{ name: 'sample_01.json', type: 'json' }
		],
		'abricate': [
			{ name: 'amr_report.tsv', type: 'tsv' },
			{ name: 'amr_summary.txt', type: 'txt' }
		],
		'mlst': [
			{ name: 'mlst_report.tsv', type: 'tsv' }
		],
		// Phase 3: Plasmid Analysis
		'mob_recon': [
			{ name: 'plasmid_report.tsv', type: 'tsv' },
			{ name: 'chromosome.fasta', type: 'fasta' },
			{ name: 'plasmid_AA001.fasta', type: 'fasta' },
			{ name: 'mobtyper_results.txt', type: 'txt' }
		],
		'platon': [
			{ name: 'plasmid_predictions.tsv', type: 'tsv' },
			{ name: 'plasmid_sequences.fasta', type: 'fasta' },
			{ name: 'chromosome_sequences.fasta', type: 'fasta' }
		],
		// Phase 4: Phylogenetics
		'snippy': [
			{ name: 'snps.vcf', type: 'vcf' },
			{ name: 'snps.tab', type: 'tsv' },
			{ name: 'snps.aligned.fa', type: 'fasta' },
			{ name: 'snps.consensus.fa', type: 'fasta' }
		],
		'roary': [
			{ name: 'gene_presence_absence.csv', type: 'csv' },
			{ name: 'core_gene_alignment.aln', type: 'aln' },
			{ name: 'summary_statistics.txt', type: 'txt' }
		],
		'iqtree': [
			{ name: 'core_alignment.treefile', type: 'nwk' },
			{ name: 'core_alignment.iqtree', type: 'txt' },
			{ name: 'core_alignment.log', type: 'log' }
		],
		'gubbins': [
			{ name: 'recombination_predictions.gff', type: 'gff' },
			{ name: 'clean.core.aln', type: 'aln' },
			{ name: 'clean.final_tree.tre', type: 'nwk' },
			{ name: 'clean.summary.txt', type: 'txt' }
		]
	};

	onMount(() => {
		const unsubscribe = executedCommands.subscribe(cmds => {
			const files: {name: string, type: string, tool: string}[] = [];
			cmds.forEach(tool => {
				const toolFileList = toolFiles[tool];
				if (toolFileList) {
					toolFileList.forEach(f => {
						files.push({ ...f, tool });
					});
				}
			});
			allGeneratedFiles = files;
		});
		return unsubscribe;
	});

	function viewFile(file: {name: string, type: string}) {
		const content = fileContents[file.name];
		if (file.type === 'html' && content) {
			const newWindow = window.open('', '_blank');
			if (newWindow) {
				newWindow.document.write(content);
				newWindow.document.close();
			}
		} else if (content) {
			alert(`File: ${file.name}\n\n${content}`);
		} else if (file.type === 'png') {
			alert(`${file.name}\n\nImage preview not available in training mode.`);
		} else {
			alert(`${file.name}\n\nThis is a simulated file in the training environment.`);
		}
		filesDropdownOpen = false;
	}

	function startResize(e: MouseEvent) {
		isResizing = true;
		document.addEventListener('mousemove', handleResize);
		document.addEventListener('mouseup', stopResize);
	}

	function handleResize(e: MouseEvent) {
		if (!isResizing) return;
		const container = document.getElementById('left-panel');
		if (!container) return;
		const rect = container.getBoundingClientRect();
		const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
		terminalHeight = Math.max(30, Math.min(85, newHeight));
	}

	function stopResize() {
		isResizing = false;
		document.removeEventListener('mousemove', handleResize);
		document.removeEventListener('mouseup', stopResize);
	}

	function closeDropdown(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.files-dropdown')) {
			filesDropdownOpen = false;
		}
	}
</script>

<svelte:window onclick={closeDropdown} />

<div class="h-screen w-screen flex flex-col overflow-hidden" style="display: flex; flex-direction: column; height: 100vh; width: 100vw;">
	<!-- Top Header Bar -->
	<div class="h-10 bg-gray-800 flex items-center justify-between px-4 border-b border-gray-700" style="display: flex; align-items: center; justify-content: space-between; height: 40px; flex-shrink: 0;">
		<div class="flex items-center gap-2" style="display: flex; align-items: center; gap: 0.5rem;">
			<a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
				<span class="text-green-400 font-bold text-sm">BioLearn</span>
			</a>
			<span class="text-gray-400 text-xs">| Bioinformatics Training Platform</span>
			{#if storyline}
				<span class="text-gray-600 text-xs">|</span>
				<span class="text-blue-400 text-xs">{storyline.title}</span>
			{/if}
		</div>

		<!-- Files Dropdown -->
		<div class="files-dropdown relative" style="position: relative;">
			<button
				class="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
				style="display: flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.75rem; background: #374151; border-radius: 0.25rem; font-size: 0.875rem; color: white; border: none; cursor: pointer;"
				onclick={() => filesDropdownOpen = !filesDropdownOpen}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px;">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
				</svg>
				Output Files ({allGeneratedFiles.length})
				<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 12px; height: 12px;">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{#if filesDropdownOpen}
				<div class="absolute right-0 top-full mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-auto" style="position: absolute; right: 0; top: 100%; margin-top: 0.25rem; width: 18rem; background: white; border-radius: 0.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; z-index: 50; max-height: 24rem; overflow: auto;">
					{#if allGeneratedFiles.length === 0}
						<div class="p-4 text-gray-500 text-sm text-center" style="padding: 1rem; color: #6b7280; font-size: 0.875rem; text-align: center;">
							No output files yet.<br/>
							<span class="text-xs" style="font-size: 0.75rem;">Run a tool to generate files.</span>
						</div>
					{:else}
						<div class="p-2 bg-gray-50 border-b text-xs text-gray-600 font-medium" style="padding: 0.5rem; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 0.75rem; color: #4b5563; font-weight: 500;">
							{allGeneratedFiles.length} files generated
						</div>
						{#each allGeneratedFiles as file}
							<button
								class="w-full px-3 py-2 flex items-center gap-3 hover:bg-blue-50 text-left border-b border-gray-100 last:border-0"
								style="width: 100%; padding: 0.5rem 0.75rem; display: flex; align-items: center; gap: 0.75rem; text-align: left; border-bottom: 1px solid #f3f4f6; background: white; border-left: none; border-right: none; border-top: none; cursor: pointer;"
								onclick={() => viewFile(file)}
							>
								<span class="text-lg" style="font-size: 1.125rem;">
									{#if file.type === 'html'}📄
									{:else if file.type === 'png'}🖼️
									{:else if file.type === 'zip'}📦
									{:else if file.type === 'fasta' || file.type === 'fastq'}🧬
									{:else if file.type === 'tsv' || file.type === 'txt'}📋
									{:else if file.type === 'log'}📝
									{:else if file.type === 'gfa'}🔗
									{:else}📁{/if}
								</span>
								<div class="flex-1 min-w-0" style="flex: 1; min-width: 0;">
									<p class="text-sm text-gray-800 truncate" style="font-size: 0.875rem; color: #1f2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{file.name}</p>
									<p class="text-xs text-gray-500" style="font-size: 0.75rem; color: #6b7280;">{file.tool} • {file.type.toUpperCase()}</p>
								</div>
								<span class="text-blue-500 text-xs" style="color: #3b82f6; font-size: 0.75rem;">View</span>
							</button>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Main Content -->
	<div class="flex-1 flex overflow-hidden" style="display: flex; flex: 1; overflow: hidden; height: calc(100% - 40px); min-height: 0;">
		<!-- Left Panel: Terminal + Output -->
		<div id="left-panel" class="w-1/2 flex flex-col border-r border-gray-300" style="display: flex; flex-direction: column; width: 50%; height: 100%; min-height: 0;">
		<!-- Terminal -->
		<div
			class="terminal-panel overflow-hidden"
			style="height: {terminalHeight}%; min-height: 0; overflow: hidden; flex-shrink: 0;"
		>
			<Terminal />
		</div>

		<!-- Resize Handle -->
		<div
			class="h-1 bg-gray-600 cursor-row-resize hover:bg-blue-500 transition-colors"
			style="height: 4px; background: #4b5563; cursor: row-resize; flex-shrink: 0;"
			onmousedown={startResize}
			role="separator"
			aria-orientation="horizontal"
			tabindex="0"
		></div>

		<!-- Output Panel -->
		<div
			class="output-panel overflow-auto"
			style="height: {100 - terminalHeight}%; min-height: 0; overflow: auto; flex: 1;"
		>
			<OutputPanel />
		</div>
	</div>

		<!-- Right Panel: Story -->
		<div class="w-1/2 story-panel overflow-auto" style="width: 50%; height: 100%; overflow: auto;">
			<StoryPanel {storyline} />
		</div>
	</div>
</div>

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
