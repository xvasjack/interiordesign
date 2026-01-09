#!/bin/bash
# Step 1: Fetch sequences from NCBI
# Usage: ./1_fetch_sequences.sh

cd "$(dirname "$0")/.."

python3 -c "
from sequence_fetcher import SequenceFetcher

fetcher = SequenceFetcher()

# EDIT THESE PARAMETERS:
sequences = fetcher.fetch_by_genus(
    genus='Salmonella',           # Change genus here
    gene='16S ribosomal RNA',     # Change gene here
    max_species=50,               # Max different species
    max_per_species=4,            # Max sequences per species
    databases=['ncbi']
)

fetcher.save_to_fasta(sequences, 'run_bash/sequences.fasta')
print(f'Saved {len(sequences)} sequences to run_bash/sequences.fasta')
"
