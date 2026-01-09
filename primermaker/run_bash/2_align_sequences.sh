#!/bin/bash
# Step 2: Align sequences
# Usage: ./2_align_sequences.sh

cd "$(dirname "$0")/.."

python3 -c "
from sequence_fetcher import SequenceFetcher
from aligner import SequenceAligner

# Load sequences
fetcher = SequenceFetcher()
with open('run_bash/sequences.fasta', 'r') as f:
    sequences = fetcher._parse_fasta(f.read(), 'file')

print(f'Loaded {len(sequences)} sequences')

# Align (uses MAFFT if available, otherwise built-in)
aligner = SequenceAligner(tool='mafft')
aligned, fasta = aligner.align(sequences, 'run_bash/alignment.fasta')

# Find conserved regions
regions = aligner.find_conserved_regions(aligned, min_conservation=0.8, min_length=18)
print(f'Found {len(regions)} conserved regions')

# Save regions info
with open('run_bash/conserved_regions.txt', 'w') as f:
    for i, r in enumerate(regions, 1):
        f.write(f'{i}. Position {r.start}-{r.end}, Conservation: {r.conservation_score:.1%}\n')
        f.write(f'   Sequence: {r.consensus_sequence}\n\n')

print('Saved alignment to run_bash/alignment.fasta')
print('Saved regions to run_bash/conserved_regions.txt')
"
