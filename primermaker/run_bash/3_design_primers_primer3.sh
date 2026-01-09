#!/bin/bash
# Step 3: Design primers using Primer3
# Usage: ./3_design_primers_primer3.sh
#
# Requires: primer3 (sudo apt-get install primer3)

cd "$(dirname "$0")/.."

# Check if primer3 is installed
if ! command -v primer3_core &> /dev/null; then
    echo "ERROR: primer3 not installed"
    echo "Install with: sudo apt-get install primer3"
    echo "         or: conda install -c bioconda primer3"
    exit 1
fi

python3 -c "
from sequence_fetcher import SequenceFetcher
from aligner import SequenceAligner
import subprocess
import os

# Load sequences
fetcher = SequenceFetcher()
with open('run_bash/sequences.fasta', 'r') as f:
    sequences = fetcher._parse_fasta(f.read(), 'file')

print(f'Loaded {len(sequences)} sequences')

# Align sequences
aligner = SequenceAligner(tool='mafft')
aligned, _ = aligner.align(sequences)

# Find conserved regions
regions = aligner.find_conserved_regions(aligned, min_conservation=0.8, min_length=100)

if not regions:
    print('No conserved regions found!')
    exit(1)

print(f'Found {len(regions)} conserved regions')

# Use the best conserved region as template
best_region = regions[0]
template_seq = best_region.consensus_sequence.replace('-', '')

print(f'Using region {best_region.start}-{best_region.end} ({len(template_seq)} bp)')

# Create Primer3 input file (Boulder-IO format)
primer3_input = f'''SEQUENCE_ID=primer_design
SEQUENCE_TEMPLATE={template_seq}
PRIMER_TASK=generic
PRIMER_PICK_LEFT_PRIMER=1
PRIMER_PICK_RIGHT_PRIMER=1
PRIMER_OPT_SIZE=20
PRIMER_MIN_SIZE=18
PRIMER_MAX_SIZE=25
PRIMER_OPT_TM=60.0
PRIMER_MIN_TM=55.0
PRIMER_MAX_TM=65.0
PRIMER_MIN_GC=40.0
PRIMER_MAX_GC=60.0
PRIMER_MAX_POLY_X=4
PRIMER_PRODUCT_SIZE_RANGE=100-500
PRIMER_NUM_RETURN=5
PRIMER_THERMODYNAMIC_OLIGO_ALIGNMENT=1
PRIMER_THERMODYNAMIC_TEMPLATE_ALIGNMENT=1
=
'''

with open('run_bash/primer3_input.txt', 'w') as f:
    f.write(primer3_input)

print('Created Primer3 input file')
print('Running Primer3...')
"

# Run Primer3
primer3_core < run_bash/primer3_input.txt > run_bash/primer3_output.txt

# Parse and display results
python3 -c "
import re

with open('run_bash/primer3_output.txt', 'r') as f:
    output = f.read()

print('\n' + '='*60)
print('PRIMER3 RESULTS')
print('='*60)

# Parse primer results
for i in range(5):
    left_seq = re.search(f'PRIMER_LEFT_{i}_SEQUENCE=(.+)', output)
    right_seq = re.search(f'PRIMER_RIGHT_{i}_SEQUENCE=(.+)', output)
    left_tm = re.search(f'PRIMER_LEFT_{i}_TM=(.+)', output)
    right_tm = re.search(f'PRIMER_RIGHT_{i}_TM=(.+)', output)
    left_gc = re.search(f'PRIMER_LEFT_{i}_GC_PERCENT=(.+)', output)
    right_gc = re.search(f'PRIMER_RIGHT_{i}_GC_PERCENT=(.+)', output)
    product = re.search(f'PRIMER_PAIR_{i}_PRODUCT_SIZE=(.+)', output)

    if left_seq and right_seq:
        print(f'\n--- Primer Pair {i+1} ---')
        print(f'Forward: 5\"-{left_seq.group(1)}-3\"')
        print(f'  Tm: {left_tm.group(1) if left_tm else \"N/A\"}°C')
        print(f'  GC: {left_gc.group(1) if left_gc else \"N/A\"}%')
        print(f'Reverse: 5\"-{right_seq.group(1)}-3\"')
        print(f'  Tm: {right_tm.group(1) if right_tm else \"N/A\"}°C')
        print(f'  GC: {right_gc.group(1) if right_gc else \"N/A\"}%')
        print(f'Product size: {product.group(1) if product else \"N/A\"} bp')

# Check for errors
if 'PRIMER_ERROR' in output:
    error = re.search('PRIMER_ERROR=(.+)', output)
    print(f'\nError: {error.group(1) if error else \"Unknown error\"}')

print('\n' + '='*60)
print('Full output saved to: run_bash/primer3_output.txt')
"
