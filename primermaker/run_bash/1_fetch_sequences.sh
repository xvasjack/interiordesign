#!/bin/bash
# Step 1: Fetch sequences from NCBI
# Usage: ./1_fetch_sequences.sh

# === EDIT THESE PARAMETERS ===
GENUS="Salmonella"
GENE="16S ribosomal RNA"
MAX_SEQS=20
OUTPUT="sequences.fasta"
# =============================

echo "Fetching $GENUS $GENE sequences from NCBI..."

# Search NCBI
QUERY="${GENUS}[Organism]+AND+${GENE}[Gene Name]"
QUERY=$(echo "$QUERY" | sed 's/ /+/g')

# Get IDs
IDS=$(curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nucleotide&term=${QUERY}&retmax=${MAX_SEQS}&retmode=json" | grep -oP '"idlist":\["\K[^"]+' | tr ',' '\n' | head -${MAX_SEQS})

if [ -z "$IDS" ]; then
    echo "No sequences found!"
    exit 1
fi

ID_LIST=$(echo $IDS | tr ' ' ',')
echo "Found IDs: $ID_LIST"

# Fetch sequences
curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nucleotide&id=${ID_LIST}&rettype=fasta&retmode=text" > "$OUTPUT"

COUNT=$(grep -c "^>" "$OUTPUT")
echo "Saved $COUNT sequences to $OUTPUT"
