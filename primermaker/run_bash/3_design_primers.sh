#!/bin/bash
# Step 3: Design primers
# Usage: ./3_design_primers.sh

cd "$(dirname "$0")/.."

python3 -c "
from sequence_fetcher import SequenceFetcher
from aligner import SequenceAligner
from primer_designer import PrimerDesigner

# Load and align sequences
fetcher = SequenceFetcher()
with open('run_bash/sequences.fasta', 'r') as f:
    sequences = fetcher._parse_fasta(f.read(), 'file')

aligner = SequenceAligner(tool='mafft')
aligned, _ = aligner.align(sequences)
regions = aligner.find_conserved_regions(aligned, min_conservation=0.8)

# Design primers
designer = PrimerDesigner(
    tm_min=55.0,
    tm_max=65.0,
    primer_min_length=18,
    primer_max_length=25
)

primers = designer.design_primers(regions, aligned, max_primers=10)
pairs = designer.design_primer_pairs(regions, aligned, max_pairs=5)

# Save results
with open('run_bash/primers.txt', 'w') as f:
    f.write(designer.format_results(primers=primers, pairs=pairs))

print(designer.format_results(primers=primers[:5], pairs=pairs[:3]))
print('\nFull results saved to run_bash/primers.txt')
"
