<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { outputData, terminalState, fileNotes, stopSignal } from '$lib/stores/terminal';

	let plotContainer: HTMLDivElement;
	let activeTab = $state('chart');
	let currentOutput = $state<any>(null);
	let isLoading = $state(false);
	let loadingProgress = $state(0);
	let loadingTool = $state('');
	let currentNotes = $state<any[]>([]);
	let chartRendered = $state(false);

	function handleStop() {
		// Increment stop signal to trigger cancellation
		stopSignal.update(n => n + 1);
	}

	// Re-render chart when switching to chart tab
	$effect(() => {
		if (activeTab === 'chart' && currentOutput?.chartData && plotContainer) {
			// Use tick to ensure DOM is updated before rendering
			tick().then(() => {
				renderChart(currentOutput);
			});
		}
	});

	// Subscribe to stores
	onMount(() => {
		const unsubOutput = outputData.subscribe(data => {
			currentOutput = data;
			chartRendered = false;
			if (data && data.chartData && activeTab === 'chart') {
				setTimeout(() => renderChart(data), 100);
			}
			// Update notes for the current tool
			if (data?.type) {
				currentNotes = fileNotes[data.type] || [];
			} else {
				currentNotes = [];
			}
		});

		const unsubTerminal = terminalState.subscribe(state => {
			isLoading = state.isRunning;
			loadingProgress = state.progress;
			loadingTool = state.currentCommand.split(' ')[0] || '';
		});

		return () => {
			unsubOutput();
			unsubTerminal();
		};
	});

	// Sample file contents for different file types
	const fileContents: Record<string, string> = {
		// SeqKit stats
		'seqkit_stats.txt': `file\tformat\ttype\tnum_seqs\tsum_len\tmin_len\tavg_len\tmax_len\nsample_01_R1.fastq.gz\tFASTQ\tDNA\t2,847,293\t427,093,950\t150\t150\t150\nsample_01_R2.fastq.gz\tFASTQ\tDNA\t2,847,293\t427,093,950\t150\t150\t150`,

		// FastQC reports - Realistic HTML matching actual FastQC output
		'sample_01_R1_fastqc.html': `<!DOCTYPE html>
<html>
<head>
<title>FastQC Report: sample_01_R1.fastq.gz</title>
<style type="text/css">
@media screen {
  body { font-family: Arial, Helvetica, sans-serif; font-size: 14px; margin: 0; padding: 0; background-color: #ffffff; }
  .header { background-color: #4271ae; color: white; padding: 10px 20px; display: flex; align-items: center; }
  .header h1 { margin: 0; font-size: 20px; font-weight: normal; }
  .header img { height: 40px; margin-right: 15px; }
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
  .boxplot-container { position: relative; height: 100%; padding: 20px 10px; display: flex; align-items: flex-end; justify-content: space-around; }
  .boxplot { width: 12px; display: flex; flex-direction: column; align-items: center; }
  .boxplot .whisker { width: 1px; background: #333; }
  .boxplot .box { width: 10px; background: #ffd700; border: 1px solid #333; }
  .boxplot .median { width: 10px; height: 2px; background: #dc3545; }
  .gc-plot { width: 100%; max-width: 700px; height: 250px; position: relative; background: white; border: 1px solid #ccc; margin-top: 10px; }
  .gc-curve { stroke: #dc3545; stroke-width: 2; fill: none; }
  .gc-theoretical { stroke: #4271ae; stroke-width: 1.5; stroke-dasharray: 5,3; fill: none; }
  .sequence-length-table { margin-top: 15px; }
  .duplication-plot { width: 100%; max-width: 700px; }
  .adapter-plot { width: 100%; max-width: 700px; }
  .footer { background: #f5f5f5; padding: 15px 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
  .pass-text { color: #36a64f; }
  .warn-text { color: #ff9900; }
  .fail-text { color: #dc3545; }
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
        <p style="color:#666;font-size:13px;margin-bottom:15px;">The boxplot shows the distribution of quality scores at each position. The background colors indicate quality zones: green (very good, Q≥28), yellow (reasonable, Q20-28), and red (poor, Q&lt;20).</p>
        <div class="quality-plot">
          <div class="plot-title">Quality scores across all bases (Sanger / Illumina 1.9 encoding)</div>
          <div style="position:relative; margin-left:50px; margin-top:20px;">
            <div class="plot-area">
              <div class="y-axis">
                <span>40</span><span>38</span><span>36</span><span>34</span><span>32</span><span>30</span><span>28</span><span>26</span><span>24</span><span>22</span><span>20</span><span>18</span><span>16</span><span>14</span><span>12</span><span>10</span><span>8</span><span>6</span><span>4</span><span>2</span><span>0</span>
              </div>
              <svg width="100%" height="100%" viewBox="0 0 750 300" preserveAspectRatio="none">
                <!-- Boxplots for each position - showing high quality typical of modern Illumina -->
                <g transform="translate(15,0)">
                  <!-- Position 1-10: slightly lower start -->
                  <rect x="0" y="20" width="8" height="40" fill="#ffd700" stroke="#333"/>
                  <line x1="0" y1="35" x2="8" y2="35" stroke="#dc3545" stroke-width="2"/>
                  <rect x="24" y="15" width="8" height="45" fill="#ffd700" stroke="#333"/>
                  <line x1="24" y1="32" x2="32" y2="32" stroke="#dc3545" stroke-width="2"/>
                  <rect x="48" y="10" width="8" height="50" fill="#ffd700" stroke="#333"/>
                  <line x1="48" y1="28" x2="56" y2="28" stroke="#dc3545" stroke-width="2"/>
                  <rect x="72" y="8" width="8" height="45" fill="#ffd700" stroke="#333"/>
                  <line x1="72" y1="25" x2="80" y2="25" stroke="#dc3545" stroke-width="2"/>
                  <rect x="96" y="8" width="8" height="42" fill="#ffd700" stroke="#333"/>
                  <line x1="96" y1="24" x2="104" y2="24" stroke="#dc3545" stroke-width="2"/>
                  <!-- Positions 11-50: stable high quality -->
                  <rect x="120" y="6" width="8" height="40" fill="#ffd700" stroke="#333"/>
                  <line x1="120" y1="22" x2="128" y2="22" stroke="#dc3545" stroke-width="2"/>
                  <rect x="168" y="5" width="8" height="38" fill="#ffd700" stroke="#333"/>
                  <line x1="168" y1="20" x2="176" y2="20" stroke="#dc3545" stroke-width="2"/>
                  <rect x="216" y="5" width="8" height="38" fill="#ffd700" stroke="#333"/>
                  <line x1="216" y1="20" x2="224" y2="20" stroke="#dc3545" stroke-width="2"/>
                  <rect x="264" y="6" width="8" height="40" fill="#ffd700" stroke="#333"/>
                  <line x1="264" y1="22" x2="272" y2="22" stroke="#dc3545" stroke-width="2"/>
                  <rect x="312" y="6" width="8" height="40" fill="#ffd700" stroke="#333"/>
                  <line x1="312" y1="22" x2="320" y2="22" stroke="#dc3545" stroke-width="2"/>
                  <!-- Positions 51-100 -->
                  <rect x="360" y="8" width="8" height="42" fill="#ffd700" stroke="#333"/>
                  <line x1="360" y1="24" x2="368" y2="24" stroke="#dc3545" stroke-width="2"/>
                  <rect x="408" y="10" width="8" height="44" fill="#ffd700" stroke="#333"/>
                  <line x1="408" y1="28" x2="416" y2="28" stroke="#dc3545" stroke-width="2"/>
                  <rect x="456" y="12" width="8" height="46" fill="#ffd700" stroke="#333"/>
                  <line x1="456" y1="30" x2="464" y2="30" stroke="#dc3545" stroke-width="2"/>
                  <rect x="504" y="14" width="8" height="48" fill="#ffd700" stroke="#333"/>
                  <line x1="504" y1="32" x2="512" y2="32" stroke="#dc3545" stroke-width="2"/>
                  <!-- Positions 101-150: gradual quality drop typical of Illumina -->
                  <rect x="552" y="18" width="8" height="52" fill="#ffd700" stroke="#333"/>
                  <line x1="552" y1="38" x2="560" y2="38" stroke="#dc3545" stroke-width="2"/>
                  <rect x="600" y="22" width="8" height="56" fill="#ffd700" stroke="#333"/>
                  <line x1="600" y1="44" x2="608" y2="44" stroke="#dc3545" stroke-width="2"/>
                  <rect x="648" y="28" width="8" height="60" fill="#ffd700" stroke="#333"/>
                  <line x1="648" y1="50" x2="656" y2="50" stroke="#dc3545" stroke-width="2"/>
                  <rect x="696" y="32" width="8" height="65" fill="#ffd700" stroke="#333"/>
                  <line x1="696" y1="56" x2="704" y2="56" stroke="#dc3545" stroke-width="2"/>
                  <rect x="720" y="38" width="8" height="70" fill="#ffd700" stroke="#333"/>
                  <line x1="720" y1="62" x2="728" y2="62" stroke="#dc3545" stroke-width="2"/>
                </g>
              </svg>
            </div>
            <div class="x-axis"><span>1</span><span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>60</span><span>70</span><span>80</span><span>90</span><span>100</span><span>110</span><span>120</span><span>130</span><span>140</span><span>150</span></div>
            <div style="text-align:center;margin-top:30px;font-size:12px;color:#666;">Position in read (bp)</div>
          </div>
          <div class="legend">
            <span><div class="box" style="background:#d4edda"></div> Very good quality (Q≥28)</span>
            <span><div class="box" style="background:#fff3cd"></div> Reasonable quality (Q20-28)</span>
            <span><div class="box" style="background:#f8d7da"></div> Poor quality (Q&lt;20)</span>
          </div>
        </div>
      </div>
    </div>
    <div class="module" id="per-seq-quality">
      <h2><span class="status icon pass">✓</span>Per sequence quality scores</h2>
      <div class="module-content">
        <p style="color:#666;font-size:13px;margin-bottom:15px;">This shows the distribution of mean quality scores per sequence. A peak at high quality indicates good data.</p>
        <svg width="600" height="300" style="border:1px solid #ccc;background:white;">
          <defs><linearGradient id="qualGrad" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" style="stop-color:#f8d7da"/><stop offset="52%" style="stop-color:#fff3cd"/><stop offset="100%" style="stop-color:#d4edda"/></linearGradient></defs>
          <rect x="50" y="20" width="500" height="240" fill="url(#qualGrad)"/>
          <polyline points="60,250 80,248 100,245 120,240 140,235 160,225 180,200 200,160 220,110 240,70 260,45 280,35 300,30 320,28 340,32 360,45 380,80 400,150 420,210 440,238 460,248 480,252 500,254 520,255 540,256" fill="none" stroke="#dc3545" stroke-width="2"/>
          <line x1="50" y1="260" x2="550" y2="260" stroke="#333" stroke-width="2"/>
          <line x1="50" y1="20" x2="50" y2="260" stroke="#333" stroke-width="2"/>
          <text x="300" y="285" text-anchor="middle" font-size="12">Mean Sequence Quality (Phred Score)</text>
          <text x="20" y="140" transform="rotate(-90,20,140)" text-anchor="middle" font-size="12">Count</text>
          <text x="60" y="275" font-size="10">0</text><text x="160" y="275" font-size="10">10</text><text x="260" y="275" font-size="10">20</text><text x="360" y="275" font-size="10">30</text><text x="460" y="275" font-size="10">40</text>
        </svg>
        <p style="margin-top:10px;color:#36a64f;"><strong>Result:</strong> Most sequences have mean quality scores above Q30, indicating excellent data quality.</p>
      </div>
    </div>
    <div class="module" id="per-seq-gc">
      <h2><span class="status icon warn">!</span>Per sequence GC content</h2>
      <div class="module-content">
        <p style="color:#666;font-size:13px;margin-bottom:15px;">The red line shows the GC distribution of your sequences. The blue dashed line shows the theoretical normal distribution. Minor deviations are common in bacterial samples.</p>
        <svg width="600" height="280" style="border:1px solid #ccc;background:white;">
          <rect x="50" y="20" width="500" height="220" fill="#fafafa"/>
          <!-- Theoretical normal distribution (blue dashed) centered at 52% -->
          <polyline points="60,230 100,225 140,200 180,150 220,90 260,50 300,35 340,50 380,90 420,150 460,200 500,225 540,230" fill="none" stroke="#4271ae" stroke-width="1.5" stroke-dasharray="5,3"/>
          <!-- Actual GC distribution (red) - slight deviation typical of bacterial samples -->
          <polyline points="60,232 100,228 140,210 180,165 220,105 260,60 280,42 300,38 320,36 340,40 360,55 380,85 420,145 460,198 500,224 540,232" fill="none" stroke="#dc3545" stroke-width="2"/>
          <line x1="50" y1="240" x2="550" y2="240" stroke="#333" stroke-width="2"/>
          <line x1="50" y1="20" x2="50" y2="240" stroke="#333" stroke-width="2"/>
          <text x="300" y="265" text-anchor="middle" font-size="12">Mean GC content (%)</text>
          <text x="20" y="130" transform="rotate(-90,20,130)" text-anchor="middle" font-size="12">Count</text>
          <text x="60" y="255" font-size="10">0</text><text x="160" y="255" font-size="10">20</text><text x="260" y="255" font-size="10">40</text><text x="360" y="255" font-size="10">60</text><text x="460" y="255" font-size="10">80</text><text x="540" y="255" font-size="10">100</text>
        </svg>
        <div style="margin-top:10px;display:flex;gap:20px;font-size:12px;">
          <span style="color:#dc3545;">━ GC count per read</span>
          <span style="color:#4271ae;">┅ Theoretical Distribution</span>
        </div>
        <p style="margin-top:10px;color:#ff9900;"><strong>Warning:</strong> The distribution shows a slight shoulder, which may indicate contamination or mixed species. This is common in environmental/clinical samples and may not affect downstream analysis.</p>
      </div>
    </div>
    <div class="module" id="seq-length">
      <h2><span class="status icon pass">✓</span>Sequence Length Distribution</h2>
      <div class="module-content">
        <p style="color:#666;font-size:13px;margin-bottom:15px;">All sequences are 150bp as expected for Illumina paired-end sequencing.</p>
        <table class="summary-table" style="max-width:400px;">
          <tr><th>Length</th><th>Count</th></tr>
          <tr><td>150</td><td>2,847,293</td></tr>
        </table>
      </div>
    </div>
    <div class="module" id="seq-dup">
      <h2><span class="status icon pass">✓</span>Sequence Duplication Levels</h2>
      <div class="module-content">
        <p style="color:#666;font-size:13px;margin-bottom:15px;">Low duplication levels indicate good library complexity.</p>
        <svg width="600" height="250" style="border:1px solid #ccc;background:white;">
          <rect x="50" y="20" width="500" height="190" fill="#fafafa"/>
          <!-- Duplication histogram bars -->
          <rect x="70" y="30" width="35" height="170" fill="#4271ae"/>
          <rect x="115" y="90" width="35" height="110" fill="#4271ae"/>
          <rect x="160" y="140" width="35" height="60" fill="#4271ae"/>
          <rect x="205" y="165" width="35" height="35" fill="#4271ae"/>
          <rect x="250" y="178" width="35" height="22" fill="#4271ae"/>
          <rect x="295" y="186" width="35" height="14" fill="#4271ae"/>
          <rect x="340" y="192" width="35" height="8" fill="#4271ae"/>
          <rect x="385" y="195" width="35" height="5" fill="#4271ae"/>
          <rect x="430" y="197" width="35" height="3" fill="#4271ae"/>
          <rect x="475" y="198" width="35" height="2" fill="#4271ae"/>
          <line x1="50" y1="210" x2="550" y2="210" stroke="#333" stroke-width="2"/>
          <line x1="50" y1="20" x2="50" y2="210" stroke="#333" stroke-width="2"/>
          <text x="300" y="240" text-anchor="middle" font-size="12">Sequence Duplication Level</text>
          <text x="87" y="225" font-size="9">1</text><text x="132" y="225" font-size="9">2</text><text x="177" y="225" font-size="9">3</text><text x="222" y="225" font-size="9">4</text><text x="267" y="225" font-size="9">5</text><text x="312" y="225" font-size="9">6</text><text x="357" y="225" font-size="9">7</text><text x="402" y="225" font-size="9">8</text><text x="447" y="225" font-size="9">9</text><text x="492" y="225" font-size="9">&gt;10</text>
        </svg>
        <table class="summary-table" style="max-width:400px;margin-top:15px;">
          <tr><td>% Deduplicated</td><td>86.3%</td></tr>
          <tr><td>% Total Deduplicated</td><td>72.1%</td></tr>
        </table>
      </div>
    </div>
    <div class="module" id="adapter">
      <h2><span class="status icon pass">✓</span>Adapter Content</h2>
      <div class="module-content">
        <p style="color:#666;font-size:13px;margin-bottom:15px;">Very low adapter contamination detected. No trimming required.</p>
        <svg width="600" height="250" style="border:1px solid #ccc;background:white;">
          <rect x="50" y="20" width="500" height="190" fill="#fafafa"/>
          <!-- Adapter content lines - minimal contamination -->
          <polyline points="60,200 150,200 250,199 350,198 450,196 540,192" fill="none" stroke="#4271ae" stroke-width="2"/>
          <polyline points="60,200 150,200 250,200 350,199 450,197 540,194" fill="none" stroke="#dc3545" stroke-width="2"/>
          <polyline points="60,200 150,200 250,200 350,200 450,199 540,197" fill="none" stroke="#36a64f" stroke-width="2"/>
          <polyline points="60,200 150,200 250,200 350,200 450,200 540,199" fill="none" stroke="#ff9900" stroke-width="2"/>
          <line x1="50" y1="210" x2="550" y2="210" stroke="#333" stroke-width="2"/>
          <line x1="50" y1="20" x2="50" y2="210" stroke="#333" stroke-width="2"/>
          <text x="300" y="240" text-anchor="middle" font-size="12">Position in read (bp)</text>
          <text x="60" y="225" font-size="10">1</text><text x="200" y="225" font-size="10">50</text><text x="350" y="225" font-size="10">100</text><text x="520" y="225" font-size="10">150</text>
        </svg>
        <div style="margin-top:10px;display:flex;gap:15px;font-size:11px;flex-wrap:wrap;">
          <span style="color:#4271ae;">━ Illumina Universal Adapter</span>
          <span style="color:#dc3545;">━ Illumina Small RNA 3' Adapter</span>
          <span style="color:#36a64f;">━ Illumina Small RNA 5' Adapter</span>
          <span style="color:#ff9900;">━ Nextera Transposase Sequence</span>
        </div>
        <p style="margin-top:10px;color:#36a64f;"><strong>Result:</strong> Adapter content is below 2% at all positions. Data quality is excellent.</p>
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
        <p style="color:#666;font-size:13px;margin-bottom:15px;">The boxplot shows the distribution of quality scores at each position. R2 reads typically show slightly lower quality at the end compared to R1.</p>
        <div class="quality-plot">
          <div class="plot-title">Quality scores across all bases (Sanger / Illumina 1.9 encoding)</div>
          <div style="position:relative; margin-left:50px; margin-top:20px;">
            <div class="plot-area">
              <div class="y-axis">
                <span>40</span><span>38</span><span>36</span><span>34</span><span>32</span><span>30</span><span>28</span><span>26</span><span>24</span><span>22</span><span>20</span><span>18</span><span>16</span><span>14</span><span>12</span><span>10</span><span>8</span><span>6</span><span>4</span><span>2</span><span>0</span>
              </div>
              <svg width="100%" height="100%" viewBox="0 0 750 300" preserveAspectRatio="none">
                <!-- R2 boxplots - slightly lower quality at ends typical of R2 -->
                <g transform="translate(15,0)">
                  <!-- Position 1-10: R2 starts slightly lower -->
                  <rect x="0" y="28" width="8" height="45" fill="#ffd700" stroke="#333"/>
                  <line x1="0" y1="42" x2="8" y2="42" stroke="#dc3545" stroke-width="2"/>
                  <rect x="24" y="22" width="8" height="48" fill="#ffd700" stroke="#333"/>
                  <line x1="24" y1="38" x2="32" y2="38" stroke="#dc3545" stroke-width="2"/>
                  <rect x="48" y="16" width="8" height="52" fill="#ffd700" stroke="#333"/>
                  <line x1="48" y1="34" x2="56" y2="34" stroke="#dc3545" stroke-width="2"/>
                  <rect x="72" y="12" width="8" height="48" fill="#ffd700" stroke="#333"/>
                  <line x1="72" y1="30" x2="80" y2="30" stroke="#dc3545" stroke-width="2"/>
                  <rect x="96" y="10" width="8" height="45" fill="#ffd700" stroke="#333"/>
                  <line x1="96" y1="28" x2="104" y2="28" stroke="#dc3545" stroke-width="2"/>
                  <!-- Positions 11-50 -->
                  <rect x="120" y="8" width="8" height="42" fill="#ffd700" stroke="#333"/>
                  <line x1="120" y1="25" x2="128" y2="25" stroke="#dc3545" stroke-width="2"/>
                  <rect x="168" y="7" width="8" height="40" fill="#ffd700" stroke="#333"/>
                  <line x1="168" y1="23" x2="176" y2="23" stroke="#dc3545" stroke-width="2"/>
                  <rect x="216" y="8" width="8" height="42" fill="#ffd700" stroke="#333"/>
                  <line x1="216" y1="24" x2="224" y2="24" stroke="#dc3545" stroke-width="2"/>
                  <rect x="264" y="10" width="8" height="44" fill="#ffd700" stroke="#333"/>
                  <line x1="264" y1="26" x2="272" y2="26" stroke="#dc3545" stroke-width="2"/>
                  <rect x="312" y="12" width="8" height="46" fill="#ffd700" stroke="#333"/>
                  <line x1="312" y1="28" x2="320" y2="28" stroke="#dc3545" stroke-width="2"/>
                  <!-- Positions 51-100 -->
                  <rect x="360" y="16" width="8" height="50" fill="#ffd700" stroke="#333"/>
                  <line x1="360" y1="34" x2="368" y2="34" stroke="#dc3545" stroke-width="2"/>
                  <rect x="408" y="20" width="8" height="54" fill="#ffd700" stroke="#333"/>
                  <line x1="408" y1="40" x2="416" y2="40" stroke="#dc3545" stroke-width="2"/>
                  <rect x="456" y="26" width="8" height="58" fill="#ffd700" stroke="#333"/>
                  <line x1="456" y1="46" x2="464" y2="46" stroke="#dc3545" stroke-width="2"/>
                  <rect x="504" y="32" width="8" height="62" fill="#ffd700" stroke="#333"/>
                  <line x1="504" y1="52" x2="512" y2="52" stroke="#dc3545" stroke-width="2"/>
                  <!-- Positions 101-150: more pronounced drop for R2 -->
                  <rect x="552" y="40" width="8" height="68" fill="#ffd700" stroke="#333"/>
                  <line x1="552" y1="62" x2="560" y2="62" stroke="#dc3545" stroke-width="2"/>
                  <rect x="600" y="50" width="8" height="74" fill="#ffd700" stroke="#333"/>
                  <line x1="600" y1="74" x2="608" y2="74" stroke="#dc3545" stroke-width="2"/>
                  <rect x="648" y="60" width="8" height="80" fill="#ffd700" stroke="#333"/>
                  <line x1="648" y1="86" x2="656" y2="86" stroke="#dc3545" stroke-width="2"/>
                  <rect x="696" y="68" width="8" height="86" fill="#ffd700" stroke="#333"/>
                  <line x1="696" y1="96" x2="704" y2="96" stroke="#dc3545" stroke-width="2"/>
                  <rect x="720" y="76" width="8" height="92" fill="#ffd700" stroke="#333"/>
                  <line x1="720" y1="106" x2="728" y2="106" stroke="#dc3545" stroke-width="2"/>
                </g>
              </svg>
            </div>
            <div class="x-axis"><span>1</span><span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>60</span><span>70</span><span>80</span><span>90</span><span>100</span><span>110</span><span>120</span><span>130</span><span>140</span><span>150</span></div>
            <div style="text-align:center;margin-top:30px;font-size:12px;color:#666;">Position in read (bp)</div>
          </div>
          <div class="legend">
            <span><div class="box" style="background:#d4edda"></div> Very good quality (Q≥28)</span>
            <span><div class="box" style="background:#fff3cd"></div> Reasonable quality (Q20-28)</span>
            <span><div class="box" style="background:#f8d7da"></div> Poor quality (Q&lt;20)</span>
          </div>
        </div>
        <p style="margin-top:15px;color:#36a64f;"><strong>Result:</strong> Quality remains above Q20 across all positions. The slight drop at the 3' end is typical for R2 reads and can be addressed with quality trimming if needed.</p>
      </div>
    </div>
    <div class="module" id="per-seq-quality">
      <h2><span class="status icon pass">✓</span>Per sequence quality scores</h2>
      <div class="module-content">
        <p style="color:#666;font-size:13px;margin-bottom:15px;">Distribution of mean quality scores per sequence.</p>
        <svg width="600" height="300" style="border:1px solid #ccc;background:white;">
          <defs><linearGradient id="qualGrad2" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" style="stop-color:#f8d7da"/><stop offset="52%" style="stop-color:#fff3cd"/><stop offset="100%" style="stop-color:#d4edda"/></linearGradient></defs>
          <rect x="50" y="20" width="500" height="240" fill="url(#qualGrad2)"/>
          <!-- R2 quality distribution - peak slightly shifted left compared to R1 -->
          <polyline points="60,252 80,250 100,248 120,245 140,238 160,220 180,185 200,140 220,95 240,60 260,42 280,38 300,40 320,52 340,78 360,120 380,170 400,210 420,235 440,248 460,253 480,255 500,256 520,257 540,257" fill="none" stroke="#dc3545" stroke-width="2"/>
          <line x1="50" y1="260" x2="550" y2="260" stroke="#333" stroke-width="2"/>
          <line x1="50" y1="20" x2="50" y2="260" stroke="#333" stroke-width="2"/>
          <text x="300" y="285" text-anchor="middle" font-size="12">Mean Sequence Quality (Phred Score)</text>
          <text x="60" y="275" font-size="10">0</text><text x="160" y="275" font-size="10">10</text><text x="260" y="275" font-size="10">20</text><text x="360" y="275" font-size="10">30</text><text x="460" y="275" font-size="10">40</text>
        </svg>
        <p style="margin-top:10px;color:#36a64f;"><strong>Result:</strong> Mean quality scores peak around Q32-34, indicating high-quality sequencing data.</p>
      </div>
    </div>
    <div class="module" id="per-seq-gc">
      <h2><span class="status icon warn">!</span>Per sequence GC content</h2>
      <div class="module-content">
        <p style="color:#666;font-size:13px;margin-bottom:15px;">GC content distribution compared to theoretical normal distribution.</p>
        <svg width="600" height="280" style="border:1px solid #ccc;background:white;">
          <rect x="50" y="20" width="500" height="220" fill="#fafafa"/>
          <polyline points="60,230 100,225 140,200 180,150 220,90 260,50 300,35 340,50 380,90 420,150 460,200 500,225 540,230" fill="none" stroke="#4271ae" stroke-width="1.5" stroke-dasharray="5,3"/>
          <polyline points="60,232 100,228 140,210 180,165 220,108 260,62 280,44 300,40 320,38 340,42 360,58 380,88 420,148 460,200 500,225 540,232" fill="none" stroke="#dc3545" stroke-width="2"/>
          <line x1="50" y1="240" x2="550" y2="240" stroke="#333" stroke-width="2"/>
          <line x1="50" y1="20" x2="50" y2="240" stroke="#333" stroke-width="2"/>
          <text x="300" y="265" text-anchor="middle" font-size="12">Mean GC content (%)</text>
          <text x="60" y="255" font-size="10">0</text><text x="160" y="255" font-size="10">20</text><text x="260" y="255" font-size="10">40</text><text x="360" y="255" font-size="10">60</text><text x="460" y="255" font-size="10">80</text><text x="540" y="255" font-size="10">100</text>
        </svg>
        <div style="margin-top:10px;display:flex;gap:20px;font-size:12px;">
          <span style="color:#dc3545;">━ GC count per read</span>
          <span style="color:#4271ae;">┅ Theoretical Distribution</span>
        </div>
        <p style="margin-top:10px;color:#ff9900;"><strong>Warning:</strong> Minor deviation from normal distribution detected. Consistent with R1 pattern - likely reflects genuine biological variation in the sample.</p>
      </div>
    </div>
    <div class="module" id="seq-length">
      <h2><span class="status icon pass">✓</span>Sequence Length Distribution</h2>
      <div class="module-content">
        <table class="summary-table" style="max-width:400px;">
          <tr><th>Length</th><th>Count</th></tr>
          <tr><td>150</td><td>2,847,293</td></tr>
        </table>
      </div>
    </div>
    <div class="module" id="seq-dup">
      <h2><span class="status icon pass">✓</span>Sequence Duplication Levels</h2>
      <div class="module-content">
        <svg width="600" height="250" style="border:1px solid #ccc;background:white;">
          <rect x="50" y="20" width="500" height="190" fill="#fafafa"/>
          <rect x="70" y="35" width="35" height="165" fill="#4271ae"/>
          <rect x="115" y="95" width="35" height="105" fill="#4271ae"/>
          <rect x="160" y="145" width="35" height="55" fill="#4271ae"/>
          <rect x="205" y="168" width="35" height="32" fill="#4271ae"/>
          <rect x="250" y="180" width="35" height="20" fill="#4271ae"/>
          <rect x="295" y="188" width="35" height="12" fill="#4271ae"/>
          <rect x="340" y="193" width="35" height="7" fill="#4271ae"/>
          <rect x="385" y="196" width="35" height="4" fill="#4271ae"/>
          <rect x="430" y="198" width="35" height="2" fill="#4271ae"/>
          <rect x="475" y="199" width="35" height="1" fill="#4271ae"/>
          <line x1="50" y1="210" x2="550" y2="210" stroke="#333" stroke-width="2"/>
          <line x1="50" y1="20" x2="50" y2="210" stroke="#333" stroke-width="2"/>
          <text x="300" y="240" text-anchor="middle" font-size="12">Sequence Duplication Level</text>
        </svg>
        <table class="summary-table" style="max-width:400px;margin-top:15px;">
          <tr><td>% Deduplicated</td><td>85.8%</td></tr>
          <tr><td>% Total Deduplicated</td><td>71.4%</td></tr>
        </table>
      </div>
    </div>
    <div class="module" id="adapter">
      <h2><span class="status icon pass">✓</span>Adapter Content</h2>
      <div class="module-content">
        <p style="color:#666;font-size:13px;margin-bottom:15px;">Adapter contamination levels across read positions.</p>
        <svg width="600" height="250" style="border:1px solid #ccc;background:white;">
          <rect x="50" y="20" width="500" height="190" fill="#fafafa"/>
          <polyline points="60,200 150,200 250,199 350,198 450,195 540,190" fill="none" stroke="#4271ae" stroke-width="2"/>
          <polyline points="60,200 150,200 250,200 350,198 450,194 540,188" fill="none" stroke="#dc3545" stroke-width="2"/>
          <polyline points="60,200 150,200 250,200 350,199 450,196 540,192" fill="none" stroke="#36a64f" stroke-width="2"/>
          <polyline points="60,200 150,200 250,200 350,200 450,198 540,195" fill="none" stroke="#ff9900" stroke-width="2"/>
          <line x1="50" y1="210" x2="550" y2="210" stroke="#333" stroke-width="2"/>
          <line x1="50" y1="20" x2="50" y2="210" stroke="#333" stroke-width="2"/>
          <text x="300" y="240" text-anchor="middle" font-size="12">Position in read (bp)</text>
        </svg>
        <div style="margin-top:10px;display:flex;gap:15px;font-size:11px;flex-wrap:wrap;">
          <span style="color:#4271ae;">━ Illumina Universal Adapter</span>
          <span style="color:#dc3545;">━ Illumina Small RNA 3' Adapter</span>
          <span style="color:#36a64f;">━ Illumina Small RNA 5' Adapter</span>
          <span style="color:#ff9900;">━ Nextera Transposase Sequence</span>
        </div>
        <p style="margin-top:10px;color:#36a64f;"><strong>Result:</strong> Minimal adapter content detected. Data is suitable for downstream analysis.</p>
      </div>
    </div>
  </div>
</div>
<div class="footer">
  <p>Produced by <strong>FastQC</strong> v0.12.1 | Analysis Date: 2024-01-15 10:23:52 | Babraham Bioinformatics</p>
</div>
</body>
</html>`,
		'sample_01_R1_fastqc.zip': 'FASTQC_ZIP_PLACEHOLDER',
		'sample_01_R2_fastqc.zip': 'FASTQC_ZIP_PLACEHOLDER',

		// Trimmomatic outputs
		'sample_01_R1_paired.fq.gz': `@SEQ_ID_1\nATGCGTACGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT\n+\nIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII\n@SEQ_ID_2\nGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC\n+\nIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII`,
		'sample_01_R2_paired.fq.gz': `@SEQ_ID_1\nTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTA\n+\nIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII\n@SEQ_ID_2\nCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT\n+\nIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII`,
		'sample_01_R1_unpaired.fq.gz': `@UNPAIRED_1\nATGCATGCATGCATGC\n+\nIIIIIIIIIIIIIIII`,
		'sample_01_R2_unpaired.fq.gz': `@UNPAIRED_1\nGCATGCATGCATGCAT\n+\nIIIIIIIIIIIIIIII`,

		// Unicycler outputs
		'assembly.fasta': `>contig_1 length=4892156 depth=45.2x circular=true\nATGCGTACGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT\nGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAG\nTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT\n>contig_2 length=95234 depth=78.5x circular=true\nATGCGTACGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT\nGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAG`,
		'assembly.gfa': `H\tVN:Z:1.0\nS\t1\tATGCGTACGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT\tLN:i:4892156\tRC:i:221089472\nS\t2\tGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC\tLN:i:95234\tRC:i:7476869\nL\t1\t+\t1\t+\t0M\nL\t2\t+\t2\t+\t0M`,
		'unicycler.log': `[2024-01-15 10:23:45] Starting Unicycler v0.5.0\n[2024-01-15 10:23:45] Command: unicycler -1 trimmed/sample_01_R1_paired.fq.gz -2 trimmed/sample_01_R2_paired.fq.gz -o assembly\n[2024-01-15 10:23:46] Input files validated\n[2024-01-15 10:23:47] Read count: 2,683,521 (forward), 2,683,521 (reverse)\n[2024-01-15 10:24:15] SPAdes assembly completed\n[2024-01-15 10:24:45] Rotating contigs to standard start\n[2024-01-15 10:25:00] Polishing assembly with Pilon\n[2024-01-15 10:25:12] Assembly completed successfully\n[2024-01-15 10:25:12] Final assembly: 2 contigs, total length 4,987,390 bp`,

		// Bandage output (base64 placeholder for PNG)
		'assembly_graph.png': 'PNG_IMAGE_PLACEHOLDER',

		// QUAST outputs
		'quast_report.tsv': `Assembly\t# contigs\tTotal length\tLargest contig\tGC (%)\tN50\tN75\tL50\tL75\n# misassemblies\t# misassembled contigs\nsample_01\t2\t4987390\t4892156\t52.3\t4892156\t95234\t1\t2\t0\t0`,
		'quast_report.html': `<!DOCTYPE html><html><head><title>QUAST Report</title><style>body{font-family:Arial,sans-serif;margin:20px;} h1{color:#333;} table{border-collapse:collapse;width:100%;margin:20px 0;} td,th{border:1px solid #ddd;padding:12px;text-align:left;} th{background:#4CAF50;color:white;} tr:nth-child(even){background:#f2f2f2;} .good{color:green;font-weight:bold;}</style></head><body><h1>QUAST Quality Assessment Report</h1><h2>Assembly Statistics</h2><table><tr><th>Metric</th><th>Value</th></tr><tr><td>Total contigs</td><td class="good">2</td></tr><tr><td>Total length</td><td>4,987,390 bp</td></tr><tr><td>Largest contig</td><td>4,892,156 bp</td></tr><tr><td>GC content</td><td>52.3%</td></tr><tr><td>N50</td><td class="good">4,892,156 bp</td></tr><tr><td>N75</td><td>95,234 bp</td></tr></table><h2>Conclusion</h2><p>Assembly quality: <span class="good">EXCELLENT</span> - Complete circular chromosome with one plasmid detected.</p></body></html>`,

		// Abricate outputs
		'amr_report.tsv': `#FILE\tSEQUENCE\tSTART\tEND\tSTRAND\tGENE\tCOVERAGE\tCOVERAGE_MAP\tGAPS\t%COVERAGE\t%IDENTITY\tDATABASE\tACCESSION\tPRODUCT\tRESISTANCE\nassembly.fasta\tcontig_1\t1245678\t1246523\t+\tblaCTX-M-15\t1-846/846\t===============\t0/0\t100.00\t99.89\tncbi\tNG_049557.1\tclass A extended-spectrum beta-lactamase CTX-M-15\tCephalosporin\nassembly.fasta\tcontig_2\t52345\t53567\t+\ttet(A)\t1-1223/1223\t===============\t0/0\t100.00\t100.00\tncbi\tAF534183.1\ttetracycline efflux MFS transporter Tet(A)\tTetracycline`,
		'amr_summary.txt': `AMR Gene Summary Report\n=======================\nGenerated: 2024-01-15\nSample: sample_01\nDatabase: NCBI AMRFinderPlus\n\nTotal AMR genes found: 2\n\n1. blaCTX-M-15 (Beta-lactamase)\n   Location: contig_1:1245678-1246523\n   Coverage: 100.00%\n   Identity: 99.89%\n   Resistance: Extended-spectrum cephalosporins (3rd/4th generation)\n   Clinical significance: HIGH - Associated with hospital-acquired infections\n\n2. tet(A) (Tetracycline efflux pump)\n   Location: contig_2:52345-53567  \n   Coverage: 100.00%\n   Identity: 100.00%\n   Resistance: Tetracycline, Doxycycline\n   Clinical significance: MODERATE\n\nRecommendation: Avoid cephalosporins and tetracyclines for treatment.`
	};

	// MIME types for different file extensions
	const mimeTypes: Record<string, string> = {
		'html': 'text/html',
		'txt': 'text/plain',
		'tsv': 'text/tab-separated-values',
		'fasta': 'text/plain',
		'gfa': 'text/plain',
		'log': 'text/plain',
		'png': 'image/png',
		'zip': 'application/zip',
		'gff': 'text/plain',
		'gbk': 'text/plain',
		'fna': 'text/plain',
		'faa': 'text/plain',
		'ffn': 'text/plain'
	};

	function viewFile(file: any) {
		const content = fileContents[file.name];
		if (file.type === 'html' && content) {
			// Open HTML in new window
			const newWindow = window.open('', '_blank');
			if (newWindow) {
				newWindow.document.write(content);
				newWindow.document.close();
			}
		} else if (content) {
			// Show text content in alert (could be improved with modal)
			alert(`File: ${file.name}\n\n${content.substring(0, 500)}${content.length > 500 ? '...' : ''}`);
		} else {
			alert(`Preview not available for ${file.name}\n\nThis is a simulated file in the training environment.`);
		}
	}

	function downloadFile(file: any) {
		const content = fileContents[file.name] || `# Simulated content for ${file.name}\n# This file was generated in the BioLearn training environment`;
		const mimeType = mimeTypes[file.type] || 'text/plain';
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = file.name;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	async function renderChart(data: any) {
		if (!plotContainer || !data?.chartData) return;

		const Plotly = await import('plotly.js-dist-min');
		const chartData = data.chartData;

		let traces: any[] = [];
		let layout: any = {
			title: {
				text: chartData.title || data.title,
				font: { size: 16, color: '#1f2937' }
			},
			xaxis: {
				title: { text: chartData.xLabel || 'X', font: { size: 12, color: '#4b5563' } },
				gridcolor: '#e5e7eb',
				tickfont: { size: 11, color: '#6b7280' }
			},
			yaxis: {
				title: { text: chartData.yLabel || 'Y', font: { size: 12, color: '#4b5563' } },
				gridcolor: '#e5e7eb',
				tickfont: { size: 11, color: '#6b7280' }
			},
			margin: { t: 50, r: 30, b: 60, l: 80 },
			paper_bgcolor: 'transparent',
			plot_bgcolor: '#fafafa',
			font: { family: 'system-ui, sans-serif' },
			showlegend: false
		};

		if (chartData.type === 'assemblyGraph') {
			// Assembly graph visualization - circular diagrams for complete genomes
			const components = chartData.components || [];
			const stats = chartData.graphStats || {};

			// Calculate circle sizes based on component sizes
			const maxSize = Math.max(...components.map((c: any) => c.size));

			const shapes: any[] = [];
			const annotations: any[] = [];

			// Fixed positions - labels at same Y, circles above with bottom edge aligned
			const labelY = 2.0;           // All labels at same Y
			const circleBottomY = 3.2;    // All circle bottoms at same Y

			components.forEach((comp: any, i: number) => {
				// X position: spread further apart
				const xPos = i === 0 ? 2 : 10;

				// Scale radius based on size
				const relativeSize = comp.size / maxSize;
				const radius = Math.max(0.5, 1.4 * Math.sqrt(relativeSize));

				// Circle center: bottom edge at circleBottomY, so center is at circleBottomY + radius
				const yCenter = circleBottomY + radius;

				if (comp.circular) {
					shapes.push({
						type: 'circle',
						xref: 'x',
						yref: 'y',
						x0: xPos - radius,
						y0: circleBottomY,
						x1: xPos + radius,
						y1: circleBottomY + 2 * radius,
						line: { color: comp.color, width: 4 },
						fillcolor: 'rgba(255,255,255,0)'
					});
				} else {
					shapes.push({
						type: 'line',
						xref: 'x',
						yref: 'y',
						x0: xPos - radius,
						y0: yCenter,
						x1: xPos + radius,
						y1: yCenter,
						line: { color: comp.color, width: 4 }
					});
				}

				// Label at fixed Y position, centered under circle
				annotations.push({
					x: xPos,
					y: labelY,
					xref: 'x',
					yref: 'y',
					text: `<b>${comp.name}</b><br>${(comp.size / 1e6).toFixed(2)} Mb`,
					showarrow: false,
					font: { size: 13, color: comp.color },
					align: 'center'
				});
			});

			// Quality badge at top
			const quality = stats.quality || 'unknown';
			const qualityColor = quality === 'excellent' ? '#10b981' : quality === 'good' ? '#f59e0b' : '#ef4444';
			annotations.push({
				x: 6,
				y: 9.2,
				xref: 'x',
				yref: 'y',
				text: `<b>Quality: ${quality.toUpperCase()}</b> | ${stats.circular || 0} circular | ${stats.deadEnds || 0} dead ends`,
				showarrow: false,
				font: { size: 12, color: qualityColor }
			});

			// Node/edge stats at bottom
			annotations.push({
				x: 6,
				y: 0.5,
				xref: 'x',
				yref: 'y',
				text: `Nodes: ${stats.totalNodes?.toLocaleString() || 'N/A'} | Edges: ${stats.totalEdges?.toLocaleString() || 'N/A'}`,
				showarrow: false,
				font: { size: 11, color: '#9ca3af' }
			});

			layout = {
				title: { text: chartData.title, font: { size: 16, color: '#1f2937' } },
				xaxis: { visible: false, range: [0, 12], fixedrange: true, constrain: 'domain' },
				yaxis: { visible: false, range: [0, 10], fixedrange: true, scaleanchor: 'x', scaleratio: 1 },
				margin: { t: 50, r: 20, b: 20, l: 20 },
				paper_bgcolor: 'transparent',
				plot_bgcolor: '#fafafa',
				shapes: shapes,
				annotations: annotations,
				showlegend: false
			};

			// Empty trace to render the plot
			traces.push({
				x: [5],
				y: [5],
				type: 'scatter',
				mode: 'markers',
				marker: { size: 0.1, opacity: 0 }
			});
		} else if (chartData.type === 'bar') {
			// Bar chart for trimmomatic, unicycler
			const colors = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];

			traces.push({
				x: chartData.x,
				y: chartData.y,
				type: 'bar',
				marker: {
					color: colors.slice(0, chartData.x.length),
					line: { color: '#1f2937', width: 1 }
				},
				text: chartData.y.map((v: number) => v.toLocaleString()),
				textposition: 'outside',
				textfont: { size: 11, color: '#374151' }
			});

			layout.yaxis.rangemode = 'tozero';
		} else {
			// Line chart for FastQC quality scores
			traces.push({
				x: chartData.positions || chartData.x,
				y: chartData.scores || chartData.y,
				type: 'scatter',
				mode: 'lines',
				fill: 'tozeroy',
				fillcolor: 'rgba(16, 185, 129, 0.2)',
				line: { color: '#10b981', width: 2 },
				name: chartData.name || 'Quality Score'
			});

			// Add quality threshold lines for FastQC
			if (chartData.yLabel?.includes('Phred') || chartData.yLabel?.includes('Quality')) {
				// Q30 line (excellent)
				traces.push({
					x: [1, 150],
					y: [30, 30],
					type: 'scatter',
					mode: 'lines',
					line: { color: '#10b981', width: 1, dash: 'dash' },
					name: 'Q30 (Excellent)',
					showlegend: true
				});
				// Q20 line (acceptable)
				traces.push({
					x: [1, 150],
					y: [20, 20],
					type: 'scatter',
					mode: 'lines',
					line: { color: '#f59e0b', width: 1, dash: 'dash' },
					name: 'Q20 (Acceptable)',
					showlegend: true
				});

				layout.showlegend = true;
				layout.legend = { x: 0.7, y: 0.1, bgcolor: 'rgba(255,255,255,0.8)' };
				layout.yaxis.range = [0, 42];
			}
		}

		Plotly.default.newPlot(plotContainer, traces, layout, {
			responsive: true,
			displaylogo: false,
			modeBarButtonsToRemove: ['lasso2d', 'select2d']
		});
	}
</script>

<div class="h-full flex flex-col bg-gray-50" style="display: flex; flex-direction: column; height: 100%; background: #f9fafb;">
	<!-- Tabs -->
	<div class="flex border-b bg-white" style="display: flex; border-bottom: 1px solid #e5e7eb; background: white; flex-shrink: 0;">
		<button
			class="px-4 py-2 text-sm font-medium transition-colors"
			style="padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; background: transparent; border: none; cursor: pointer; border-bottom: {activeTab === 'chart' ? '2px solid #2563eb' : 'none'}; color: {activeTab === 'chart' ? '#2563eb' : '#4b5563'};"
			onclick={() => (activeTab = 'chart')}
		>
			📊 Chart
		</button>
		<button
			class="px-4 py-2 text-sm font-medium transition-colors"
			style="padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; background: transparent; border: none; cursor: pointer; border-bottom: {activeTab === 'table' ? '2px solid #2563eb' : 'none'}; color: {activeTab === 'table' ? '#2563eb' : '#4b5563'};"
			onclick={() => (activeTab = 'table')}
		>
			📋 Summary
		</button>
		<button
			class="px-4 py-2 text-sm font-medium transition-colors"
			style="padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; background: transparent; border: none; cursor: pointer; border-bottom: {activeTab === 'files' ? '2px solid #2563eb' : 'none'}; color: {activeTab === 'files' ? '#2563eb' : '#4b5563'};"
			onclick={() => (activeTab = 'files')}
		>
			📁 Files
		</button>
		<button
			class="px-4 py-2 text-sm font-medium transition-colors"
			style="padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; background: transparent; border: none; cursor: pointer; border-bottom: {activeTab === 'notes' ? '2px solid #2563eb' : 'none'}; color: {activeTab === 'notes' ? '#2563eb' : '#4b5563'};"
			onclick={() => (activeTab = 'notes')}
		>
			📝 Notes
		</button>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-auto p-4" style="flex: 1; overflow: auto; padding: 1rem;">
		{#if isLoading}
			<!-- Loading State -->
			<div class="h-full flex flex-col items-center justify-center text-gray-500" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
				<div class="mb-4">
					<svg class="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
				</div>
				<p class="text-lg font-medium text-gray-700">Running {loadingTool}...</p>
				<div class="w-64 mt-4">
					<div class="bg-gray-200 rounded-full h-2">
						<div
							class="bg-blue-600 h-2 rounded-full transition-all duration-300"
							style="width: {loadingProgress}%"
						></div>
					</div>
					<p class="text-sm text-gray-500 mt-2 text-center">{loadingProgress}% complete</p>
				</div>
				<button
					onclick={handleStop}
					class="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<rect x="6" y="6" width="12" height="12" rx="1" stroke-width="2" fill="currentColor"/>
					</svg>
					Stop
				</button>
			</div>
		{:else if !currentOutput}
			<!-- Empty State -->
			<div class="h-full flex flex-col items-center justify-center text-gray-400" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #9ca3af;">
				<svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 64px; height: 64px; margin-bottom: 16px;">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				<p class="text-lg font-medium">No output yet</p>
				<p class="text-sm mt-1">Run a command in the terminal to see results</p>
			</div>
		{:else if activeTab === 'chart'}
			{#if currentOutput.chartData}
				<div bind:this={plotContainer} class="w-full h-full min-h-[200px]"></div>
			{:else}
				<div class="h-full flex items-center justify-center text-gray-400">
					<p>No chart data available for this command</p>
				</div>
			{/if}
		{:else if activeTab === 'table'}
			{#if currentOutput.summary}
				<div class="bg-white rounded-lg shadow-sm border">
					<div class="px-4 py-3 border-b">
						<h3 class="font-semibold text-gray-800">{currentOutput.title}</h3>
						<p class="text-sm text-gray-500">{currentOutput.tool}</p>
					</div>
					<div class="p-4">
						<dl class="grid grid-cols-2 gap-4">
							{#each Object.entries(currentOutput.summary) as [key, value]}
								<div>
									<dt class="text-sm text-gray-500">{key}</dt>
									<dd class="text-lg font-semibold text-gray-800">{value}</dd>
								</div>
							{/each}
						</dl>
					</div>
				</div>
			{:else}
				<div class="h-full flex items-center justify-center text-gray-400">
					<p>No summary data available</p>
				</div>
			{/if}
		{:else if activeTab === 'files'}
			{#if currentOutput.files && currentOutput.files.length > 0}
				<div class="bg-white rounded-lg shadow-sm border">
					<div class="px-4 py-3 border-b">
						<h3 class="font-semibold text-gray-800">Generated Files</h3>
					</div>
					<ul class="divide-y">
						{#each currentOutput.files as file}
							<li class="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
								<div class="flex items-center gap-3">
									<span class="text-2xl">{file.type === 'html' ? '📄' : file.type === 'zip' ? '📦' : '📁'}</span>
									<div>
										<p class="font-medium text-gray-800">{file.name}</p>
										<p class="text-sm text-gray-500">{file.type.toUpperCase()} • {file.size}</p>
									</div>
								</div>
								<div class="flex gap-2">
									{#if file.type === 'html'}
										<button
											class="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium transition-colors"
											onclick={() => viewFile(file)}
										>
											View
										</button>
									{/if}
									<button
										class="px-3 py-1 text-green-600 hover:bg-green-50 rounded text-sm font-medium transition-colors"
										onclick={() => downloadFile(file)}
									>
										Download
									</button>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{:else}
				<div class="h-full flex items-center justify-center text-gray-400">
					<p>No files generated</p>
				</div>
			{/if}
		{:else if activeTab === 'notes'}
			{#if currentNotes.length > 0}
				<div class="bg-white rounded-lg shadow-sm border">
					<div class="px-4 py-3 border-b">
						<h3 class="font-semibold text-gray-800">File Format Notes</h3>
						<p class="text-sm text-gray-500">Helpful information about the files and formats</p>
					</div>
					<ul class="divide-y">
						{#each currentNotes as note}
							<li class="px-4 py-3">
								<div class="flex items-start gap-3">
									<span class="text-blue-500 mt-0.5">💡</span>
									<div>
										<p class="font-medium text-gray-800">{note.name}</p>
										{#if note.format}
											<span class="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded mb-1">{note.format}</span>
										{/if}
										<p class="text-sm text-gray-600">{note.description}</p>
									</div>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{:else}
				<div class="h-full flex items-center justify-center text-gray-400">
					<div class="text-center">
						<p class="mb-2">No notes available</p>
						<p class="text-sm">Run a bioinformatics tool to see file format notes</p>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
