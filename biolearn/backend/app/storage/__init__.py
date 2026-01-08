"""
Pre-computed analysis results storage.

This module handles the proxy architecture where:
1. Admin runs real analysis during development
2. Results (terminal output, files, charts) are stored
3. Users receive stored results when they type commands

No actual bioinformatics tools run per user - just playback of stored results.
"""
from pydantic import BaseModel
from typing import Optional
import json
from pathlib import Path


class CommandOutput(BaseModel):
    """Stored output for a command."""
    command: str  # The command user types
    terminal_output: str  # What appears in terminal (with ANSI colors)
    execution_time: float  # Simulated execution time in seconds
    files_generated: list[str] = []  # List of output files
    chart_data: Optional[dict] = None  # Data for Plotly charts
    summary: Optional[dict] = None  # Summary statistics


class StepResults(BaseModel):
    """All results for a narrative step."""
    step_id: int
    commands: list[CommandOutput]


class NarrativeResults(BaseModel):
    """Complete pre-computed results for a narrative."""
    narrative_id: str
    steps: list[StepResults]


# In-memory storage for pre-computed results
# In production, this would be loaded from files/database
PRECOMPUTED_RESULTS: dict[str, NarrativeResults] = {}


def load_narrative_results(narrative_id: str) -> Optional[NarrativeResults]:
    """Load pre-computed results for a narrative."""
    if narrative_id in PRECOMPUTED_RESULTS:
        return PRECOMPUTED_RESULTS[narrative_id]

    # Try to load from JSON file
    results_path = Path(__file__).parent.parent.parent / "content" / "results" / f"{narrative_id}.json"
    if results_path.exists():
        with open(results_path) as f:
            data = json.load(f)
            results = NarrativeResults(**data)
            PRECOMPUTED_RESULTS[narrative_id] = results
            return results

    return None


def get_command_output(narrative_id: str, step_id: int, command: str) -> Optional[CommandOutput]:
    """
    Get the pre-computed output for a specific command.

    Args:
        narrative_id: The narrative being played
        step_id: Current step in the narrative
        command: The command user typed

    Returns:
        CommandOutput if found, None otherwise
    """
    results = load_narrative_results(narrative_id)
    if not results:
        return None

    for step in results.steps:
        if step.step_id == step_id:
            for cmd_output in step.commands:
                # Match command (could be exact or fuzzy matching)
                if command.strip() == cmd_output.command.strip():
                    return cmd_output
                # Also match if user typed the base command
                if command.strip().split()[0] == cmd_output.command.split()[0]:
                    return cmd_output

    return None


# Sample pre-computed results for the hospital outbreak narrative
PRECOMPUTED_RESULTS["hospital-outbreak"] = NarrativeResults(
    narrative_id="hospital-outbreak",
    steps=[
        StepResults(
            step_id=3,
            commands=[
                CommandOutput(
                    command="fastqc sample_01.fastq.gz -o qc_reports/",
                    execution_time=2.5,
                    terminal_output="""Started analysis of sample_01.fastq.gz
Approx 5% complete for sample_01.fastq.gz
Approx 10% complete for sample_01.fastq.gz
Approx 15% complete for sample_01.fastq.gz
Approx 25% complete for sample_01.fastq.gz
Approx 35% complete for sample_01.fastq.gz
Approx 50% complete for sample_01.fastq.gz
Approx 65% complete for sample_01.fastq.gz
Approx 80% complete for sample_01.fastq.gz
Approx 95% complete for sample_01.fastq.gz
Analysis complete for sample_01.fastq.gz
""",
                    files_generated=["qc_reports/sample_01_fastqc.html", "qc_reports/sample_01_fastqc.zip"],
                    chart_data={
                        "type": "quality_scores",
                        "title": "Per Base Sequence Quality",
                        "x_label": "Position in read (bp)",
                        "y_label": "Quality Score (Phred)",
                        "positions": list(range(1, 151)),
                        "scores": [32 + (i % 5) - 2 for i in range(150)],  # Simulated quality scores
                    },
                    summary={
                        "total_sequences": "2,456,789",
                        "sequence_length": "150 bp",
                        "gc_content": "52%",
                        "quality": "Pass",
                        "adapter_content": "Warning - 3.2% detected",
                    }
                ),
            ]
        ),
        StepResults(
            step_id=4,
            commands=[
                CommandOutput(
                    command="trimmomatic PE -phred33 sample_01_R1.fastq.gz sample_01_R2.fastq.gz sample_01_R1_paired.fq.gz sample_01_R1_unpaired.fq.gz sample_01_R2_paired.fq.gz sample_01_R2_unpaired.fq.gz ILLUMINACLIP:TruSeq3-PE.fa:2:30:10 LEADING:3 TRAILING:3 SLIDINGWINDOW:4:15 MINLEN:36",
                    execution_time=45.0,
                    terminal_output="""TrimmomaticPE: Started with arguments:
 -phred33 sample_01_R1.fastq.gz sample_01_R2.fastq.gz sample_01_R1_paired.fq.gz sample_01_R1_unpaired.fq.gz sample_01_R2_paired.fq.gz sample_01_R2_unpaired.fq.gz ILLUMINACLIP:TruSeq3-PE.fa:2:30:10 LEADING:3 TRAILING:3 SLIDINGWINDOW:4:15 MINLEN:36
Using PrefixPair: 'TACACTCTTTCCCTACACGACGCTCTTCCGATCT' and 'GTGACTGGAGTTCAGACGTGTGCTCTTCCGATCT'
ILLUMINACLIP: Using 1 prefix pairs, 2 forward/reverse sequences, 0 common sequences
Quality encoding detected as phred33
Input Read Pairs: 2456789
Both Surviving: 2398456 (97.63%)
Forward Only Surviving: 32145 (1.31%)
Reverse Only Surviving: 18234 (0.74%)
Dropped: 7954 (0.32%)
TrimmomaticPE: Completed successfully
""",
                    files_generated=[
                        "sample_01_R1_paired.fq.gz",
                        "sample_01_R1_unpaired.fq.gz",
                        "sample_01_R2_paired.fq.gz",
                        "sample_01_R2_unpaired.fq.gz"
                    ],
                    summary={
                        "input_reads": "2,456,789 pairs",
                        "surviving_pairs": "2,398,456 (97.63%)",
                        "forward_only": "32,145 (1.31%)",
                        "reverse_only": "18,234 (0.74%)",
                        "dropped": "7,954 (0.32%)",
                    }
                ),
            ]
        ),
        StepResults(
            step_id=5,
            commands=[
                CommandOutput(
                    command="unicycler -1 sample_01_R1_paired.fq.gz -2 sample_01_R2_paired.fq.gz -o assembly/",
                    execution_time=180.0,  # 3 minutes simulated
                    terminal_output="""
\033[1m\033[32m
 _    _       _                  _
| |  | |     (_)                | |
| |  | |_ __  _  ___ _   _  ____| | ___ _ __
| |  | | '_ \\| |/ __| | | |/ __| |/ _ \\ '__|
| |__| | | | | | (__| |_| | (__| |  __/ |
 \\____/|_| |_|_|\\___|\\__, |\\___|_|\\___|_|
                      __/ |
                     |___/
\033[0m
Starting Unicycler v0.5.0

Checking dependencies...
  SPAdes: 3.15.5
  Racon: 1.5.0
  Pilon: 1.24
  Bowtie2: 2.4.5
  Samtools: 1.17

Loading reads...
  Forward reads: 2,398,456
  Reverse reads: 2,398,456

Performing SPAdes assembly...
  k-mer sizes: 27, 47, 63, 77, 89, 99

Building assembly graph...
  Nodes: 847
  Edges: 1,203

Rotating circular contigs...
  Chromosome: circularized (4,892,156 bp)
  Plasmid 1: circularized (95,234 bp)

Polishing assembly with Pilon...
  Round 1: 23 corrections
  Round 2: 3 corrections
  Round 3: 0 corrections

Assembly complete!

Final assembly:
  Contigs: 2
  Total length: 4,987,390 bp
  Largest contig: 4,892,156 bp (chromosome)
  N50: 4,892,156 bp
  GC content: 52.3%
""",
                    files_generated=[
                        "assembly/assembly.fasta",
                        "assembly/assembly.gfa",
                        "assembly/unicycler.log"
                    ],
                    chart_data={
                        "type": "assembly_summary",
                        "contigs": [
                            {"name": "Chromosome", "length": 4892156, "gc": 52.1, "circular": True},
                            {"name": "Plasmid_1", "length": 95234, "gc": 48.7, "circular": True}
                        ]
                    },
                    summary={
                        "total_contigs": "2",
                        "total_length": "4,987,390 bp",
                        "largest_contig": "4,892,156 bp",
                        "n50": "4,892,156 bp",
                        "gc_content": "52.3%",
                        "circular_contigs": "2 (chromosome + plasmid)",
                    }
                ),
            ]
        ),
    ]
)
