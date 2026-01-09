#!/bin/bash
# Step 2: Align sequences using MAFFT
# Usage: ./2_align_sequences.sh
#
# Requires: mafft (sudo apt-get install mafft)

INPUT="sequences.fasta"
OUTPUT="alignment.fasta"

# Check mafft
if ! command -v mafft &> /dev/null; then
    echo "ERROR: mafft not installed"
    echo "Install: sudo apt-get install mafft"
    exit 1
fi

echo "Aligning sequences..."
mafft --auto --quiet "$INPUT" > "$OUTPUT"

echo "Saved alignment to $OUTPUT"
echo "Sequences aligned: $(grep -c '^>' $OUTPUT)"
