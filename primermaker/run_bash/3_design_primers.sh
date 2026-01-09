#!/bin/bash
# Step 3: Design primers using Primer3
# Usage: ./3_design_primers.sh
#
# Requires: primer3 (sudo apt-get install primer3)

INPUT="alignment.fasta"

# Check primer3
if ! command -v primer3_core &> /dev/null; then
    echo "ERROR: primer3 not installed"
    echo "Install: sudo apt-get install primer3"
    exit 1
fi

# Get consensus sequence (first sequence from alignment, remove gaps)
TEMPLATE=$(grep -v "^>" "$INPUT" | head -20 | tr -d '\n' | tr -d '-' | head -c 1000)

echo "Template length: ${#TEMPLATE} bp"

# Create Primer3 input
cat > primer3_input.txt << EOF
SEQUENCE_ID=primer_design
SEQUENCE_TEMPLATE=$TEMPLATE
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
PRIMER_PRODUCT_SIZE_RANGE=100-500
PRIMER_NUM_RETURN=5
=
EOF

echo "Running Primer3..."
primer3_core < primer3_input.txt > primer3_output.txt

# Display results
echo ""
echo "========== RESULTS =========="
grep -E "PRIMER_(LEFT|RIGHT)_[0-9]+_SEQUENCE" primer3_output.txt
grep -E "PRIMER_(LEFT|RIGHT)_[0-9]+_TM" primer3_output.txt
grep -E "PRIMER_PAIR_[0-9]+_PRODUCT_SIZE" primer3_output.txt
echo ""
echo "Full output: primer3_output.txt"
