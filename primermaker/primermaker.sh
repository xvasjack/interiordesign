#!/bin/bash
# =============================================================================
# PrimerMaker - Quick Start Script
# =============================================================================
# Simple bash wrapper for the primer design tool
#
# Usage:
#   ./primermaker.sh                    # Interactive mode
#   ./primermaker.sh -g Salmonella      # Genus mode with defaults
#   ./primermaker.sh -o "E. coli"       # Organism mode
# =============================================================================

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/primer_design_cli.py"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python
check_python() {
    if command -v python3 &> /dev/null; then
        PYTHON=python3
    elif command -v python &> /dev/null; then
        PYTHON=python
    else
        echo -e "${RED}Error: Python not found. Please install Python 3.${NC}"
        exit 1
    fi
}

# Print usage
usage() {
    echo "PrimerMaker - Multi-species Primer Design Tool"
    echo ""
    echo "Usage:"
    echo "  $0                              Interactive mode"
    echo "  $0 -g GENUS [options]           Genus mode"
    echo "  $0 -o \"ORG1,ORG2\" [options]     Organism mode"
    echo ""
    echo "Options:"
    echo "  -g, --genus GENUS       Search by genus (e.g., Salmonella)"
    echo "  -o, --organisms LIST    Comma-separated organisms"
    echo "  -n, --gene GENE         Gene name (e.g., '16S ribosomal RNA')"
    echo "  -s, --max-species N     Max species under genus (default: 50)"
    echo "  -p, --per-species N     Max sequences per species (default: 4)"
    echo "  -d, --output DIR        Output directory (default: ./primer_results)"
    echo "  -h, --help              Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 -g Salmonella -n '16S ribosomal RNA' -s 50 -p 4"
    echo "  $0 -o 'Escherichia coli,Klebsiella pneumoniae' -n '16S ribosomal RNA'"
    echo ""
}

# Default values
GENUS=""
ORGANISMS=""
GENE=""
MAX_SPECIES=50
PER_SPECIES=4
OUTPUT="./primer_results"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -g|--genus)
            GENUS="$2"
            shift 2
            ;;
        -o|--organisms)
            ORGANISMS="$2"
            shift 2
            ;;
        -n|--gene)
            GENE="$2"
            shift 2
            ;;
        -s|--max-species)
            MAX_SPECIES="$2"
            shift 2
            ;;
        -p|--per-species)
            PER_SPECIES="$2"
            shift 2
            ;;
        -d|--output)
            OUTPUT="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Main
check_python

# Build command
CMD="$PYTHON $PYTHON_SCRIPT"

if [[ -n "$GENUS" ]]; then
    # Genus mode
    CMD="$CMD --genus \"$GENUS\" --max-species $MAX_SPECIES --max-per-species $PER_SPECIES"
    [[ -n "$GENE" ]] && CMD="$CMD --gene \"$GENE\""
    CMD="$CMD --databases ncbi --output \"$OUTPUT\""

    echo -e "${GREEN}Running in Genus mode...${NC}"
    echo -e "  Genus: $GENUS"
    echo -e "  Max species: $MAX_SPECIES"
    echo -e "  Per species: $PER_SPECIES"
    [[ -n "$GENE" ]] && echo -e "  Gene: $GENE"
    echo ""

elif [[ -n "$ORGANISMS" ]]; then
    # Organism mode
    CMD="$CMD --organisms \"$ORGANISMS\""
    [[ -n "$GENE" ]] && CMD="$CMD --gene \"$GENE\""
    CMD="$CMD --databases ncbi --output \"$OUTPUT\""

    echo -e "${GREEN}Running in Organism mode...${NC}"
    echo -e "  Organisms: $ORGANISMS"
    [[ -n "$GENE" ]] && echo -e "  Gene: $GENE"
    echo ""

else
    # Interactive mode
    echo -e "${GREEN}Running in Interactive mode...${NC}"
    CMD="$CMD --interactive"
fi

# Execute
eval $CMD
