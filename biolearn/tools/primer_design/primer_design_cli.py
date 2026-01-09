#!/usr/bin/env python3
"""
Primer Design Tool - Command Line Interface

A comprehensive tool for designing primers across multiple species:
1. Retrieves sequences from NCBI and EMBL-EBI databases
2. Performs multiple sequence alignment
3. Identifies conserved regions for primer design
4. Calculates primer efficiency and annealing temperature

Usage:
    python primer_design_cli.py --interactive
    python primer_design_cli.py --organisms "E. coli,Salmonella" --gene "16S rRNA"
"""

import argparse
import sys
import os
import json
from datetime import datetime
from typing import List, Optional

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from primer_design.sequence_fetcher import SequenceFetcher, SequenceRecord
from primer_design.aligner import SequenceAligner
from primer_design.primer_designer import PrimerDesigner


def print_banner():
    """Print welcome banner"""
    banner = """
╔══════════════════════════════════════════════════════════════════════╗
║                     PRIMER DESIGN TOOL v1.0                          ║
║                                                                      ║
║  Design primers from multiple species using NCBI & EMBL-EBI data     ║
║                                                                      ║
║  Features:                                                           ║
║  • Fetch sequences from NCBI GenBank and EMBL-EBI ENA               ║
║  • Multiple sequence alignment (MAFFT/MUSCLE/built-in)              ║
║  • Conserved region detection for universal primers                  ║
║  • Tm calculation using nearest-neighbor thermodynamics             ║
║  • PCR efficiency estimation                                         ║
╚══════════════════════════════════════════════════════════════════════╝
"""
    print(banner)


def get_user_input_interactive() -> dict:
    """Get parameters interactively from user"""

    print("\n" + "=" * 60)
    print("STEP 1: Define Target Organisms")
    print("=" * 60)

    print("\nEnter organism/species names (comma-separated)")
    print("Examples:")
    print("  - Escherichia coli, Salmonella enterica, Klebsiella pneumoniae")
    print("  - Staphylococcus aureus, Staphylococcus epidermidis")
    print("  - Homo sapiens, Mus musculus, Rattus norvegicus")

    organisms_input = input("\nOrganisms: ").strip()
    organisms = [o.strip() for o in organisms_input.split(',') if o.strip()]

    if not organisms:
        print("Error: At least one organism is required")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("STEP 2: Specify Target Region")
    print("=" * 60)

    print("\nCommon target regions:")
    print("  - 16S rRNA (bacterial identification)")
    print("  - ITS (fungal identification)")
    print("  - COI/CO1 (animal barcoding)")
    print("  - matK, rbcL (plant barcoding)")
    print("  - Custom gene name")

    gene = input("\nGene/Region name (or press Enter to skip): ").strip()
    if not gene:
        gene = None

    region = input("Additional region filter (or press Enter to skip): ").strip()
    if not region:
        region = None

    print("\n" + "=" * 60)
    print("STEP 3: Sequence Range (Optional)")
    print("=" * 60)

    print("\nSpecify a subsequence range to retrieve")
    print("Leave blank to retrieve full sequences")

    start_input = input("Start position (1-based, or Enter for full): ").strip()
    end_input = input("End position (or Enter for full): ").strip()

    start = int(start_input) if start_input else None
    end = int(end_input) if end_input else None

    print("\n" + "=" * 60)
    print("STEP 4: Database Selection")
    print("=" * 60)

    print("\nSelect databases to search:")
    print("  1. NCBI only")
    print("  2. EMBL-EBI only")
    print("  3. Both (recommended)")

    db_choice = input("\nChoice [3]: ").strip() or "3"
    databases = []
    if db_choice in ["1", "3"]:
        databases.append("ncbi")
    if db_choice in ["2", "3"]:
        databases.append("embl")

    print("\n" + "=" * 60)
    print("STEP 5: Primer Parameters")
    print("=" * 60)

    max_seqs = input("Max sequences per organism [5]: ").strip()
    max_seqs = int(max_seqs) if max_seqs else 5

    tm_min = input("Minimum Tm (C) [55]: ").strip()
    tm_min = float(tm_min) if tm_min else 55.0

    tm_max = input("Maximum Tm (C) [65]: ").strip()
    tm_max = float(tm_max) if tm_max else 65.0

    primer_min = input("Minimum primer length [18]: ").strip()
    primer_min = int(primer_min) if primer_min else 18

    primer_max = input("Maximum primer length [25]: ").strip()
    primer_max = int(primer_max) if primer_max else 25

    product_min = input("Minimum product size [100]: ").strip()
    product_min = int(product_min) if product_min else 100

    product_max = input("Maximum product size [500]: ").strip()
    product_max = int(product_max) if product_max else 500

    print("\n" + "=" * 60)
    print("STEP 6: Output Options")
    print("=" * 60)

    output_dir = input("Output directory [./primer_results]: ").strip()
    output_dir = output_dir if output_dir else "./primer_results"

    return {
        'organisms': organisms,
        'gene': gene,
        'region': region,
        'start': start,
        'end': end,
        'databases': databases,
        'max_seqs': max_seqs,
        'tm_min': tm_min,
        'tm_max': tm_max,
        'primer_min': primer_min,
        'primer_max': primer_max,
        'product_min': product_min,
        'product_max': product_max,
        'output_dir': output_dir
    }


def run_pipeline(params: dict) -> dict:
    """Run the complete primer design pipeline"""

    results = {
        'parameters': params,
        'sequences_retrieved': 0,
        'alignment_info': {},
        'conserved_regions': [],
        'primers': [],
        'primer_pairs': [],
        'timestamp': datetime.now().isoformat()
    }

    # Create output directory
    os.makedirs(params['output_dir'], exist_ok=True)

    # ========================================
    # STEP 1: Fetch Sequences
    # ========================================
    print("\n" + "=" * 60)
    print("FETCHING SEQUENCES")
    print("=" * 60)

    fetcher = SequenceFetcher()

    sequences = fetcher.fetch_from_all_databases(
        organisms=params['organisms'],
        gene=params.get('gene'),
        region=params.get('region'),
        max_per_organism=params['max_seqs'],
        start=params.get('start'),
        stop=params.get('end'),
        databases=params['databases']
    )

    if not sequences:
        print("\nNo sequences found. Try different search terms.")
        return results

    results['sequences_retrieved'] = len(sequences)
    print(f"\nTotal sequences retrieved: {len(sequences)}")

    # Save sequences
    seq_file = os.path.join(params['output_dir'], 'sequences.fasta')
    fetcher.save_to_fasta(sequences, seq_file)

    # ========================================
    # STEP 2: Sequence Alignment
    # ========================================
    print("\n" + "=" * 60)
    print("ALIGNING SEQUENCES")
    print("=" * 60)

    if len(sequences) < 2:
        print("Need at least 2 sequences for alignment")
        return results

    # Try to use MAFFT, fall back to built-in
    try:
        aligner = SequenceAligner(tool='mafft')
    except Exception:
        print("MAFFT not available, using built-in aligner")
        aligner = SequenceAligner(tool='builtin')

    alignment_file = os.path.join(params['output_dir'], 'alignment.fasta')
    aligned_sequences, alignment_fasta = aligner.align(sequences, alignment_file)

    # Get alignment summary
    summary = aligner.get_alignment_summary(aligned_sequences)
    results['alignment_info'] = summary

    print(f"\nAlignment Summary:")
    print(f"  Sequences:          {summary['num_sequences']}")
    print(f"  Alignment length:   {summary['alignment_length']} bp")
    print(f"  Conserved columns:  {summary['conserved_columns']}")
    print(f"  Percent identity:   {summary['percent_identity']:.1f}%")

    # ========================================
    # STEP 3: Find Conserved Regions
    # ========================================
    print("\n" + "=" * 60)
    print("FINDING CONSERVED REGIONS")
    print("=" * 60)

    conserved_regions = aligner.find_conserved_regions(
        aligned_sequences,
        min_conservation=0.8,
        min_length=params['primer_min'],
        max_length=params['primer_max']
    )

    print(f"\nFound {len(conserved_regions)} conserved regions")

    for i, region in enumerate(conserved_regions[:10], 1):
        print(f"\n  Region {i}:")
        print(f"    Position:     {region.start}-{region.end}")
        print(f"    Length:       {region.length} bp")
        print(f"    Conservation: {region.conservation_score*100:.1f}%")
        print(f"    Sequence:     {region.consensus_sequence[:50]}...")

    results['conserved_regions'] = [
        {
            'start': r.start,
            'end': r.end,
            'length': r.length,
            'conservation': r.conservation_score,
            'sequence': r.consensus_sequence
        }
        for r in conserved_regions
    ]

    if not conserved_regions:
        print("\nNo suitable conserved regions found.")
        print("Try:")
        print("  - Using more closely related species")
        print("  - Adjusting the region/gene filter")
        print("  - Lowering the conservation threshold")
        return results

    # ========================================
    # STEP 4: Design Primers
    # ========================================
    print("\n" + "=" * 60)
    print("DESIGNING PRIMERS")
    print("=" * 60)

    designer = PrimerDesigner(
        primer_min_length=params['primer_min'],
        primer_max_length=params['primer_max'],
        tm_min=params['tm_min'],
        tm_max=params['tm_max'],
        product_min_size=params['product_min'],
        product_max_size=params['product_max']
    )

    # Design individual primers
    primers = designer.design_primers(conserved_regions, aligned_sequences, max_primers=20)

    print(f"\nDesigned {len(primers)} candidate primers")

    # Design primer pairs
    pairs = designer.design_primer_pairs(conserved_regions, aligned_sequences, max_pairs=10)

    print(f"Designed {len(pairs)} primer pairs")

    # Store results
    results['primers'] = [p.to_dict() for p in primers[:20]]
    results['primer_pairs'] = [p.to_dict() for p in pairs]

    # ========================================
    # STEP 5: Output Results
    # ========================================
    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)

    # Print formatted results
    print(designer.format_results(primers=primers[:10], pairs=pairs[:5]))

    # Summary table
    print("\n" + "=" * 60)
    print("SUMMARY TABLE")
    print("=" * 60)

    print("\n{:<20} {:<25} {:<8} {:<8} {:<10}".format(
        "Name", "Sequence", "Tm (C)", "GC (%)", "Eff (%)"
    ))
    print("-" * 75)

    for p in primers[:10]:
        seq_display = p.sequence[:22] + "..." if len(p.sequence) > 25 else p.sequence
        print("{:<20} {:<25} {:<8.1f} {:<8.1f} {:<10.1f}".format(
            p.name, seq_display, p.tm, p.gc_content, p.efficiency
        ))

    # Save results to JSON
    results_file = os.path.join(params['output_dir'], 'primer_results.json')
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to: {results_file}")

    # Save primers to text file
    primers_file = os.path.join(params['output_dir'], 'primers.txt')
    with open(primers_file, 'w') as f:
        f.write(designer.format_results(primers=primers, pairs=pairs))
    print(f"Primers saved to: {primers_file}")

    # Save primer sequences for ordering
    order_file = os.path.join(params['output_dir'], 'primers_for_ordering.txt')
    with open(order_file, 'w') as f:
        f.write("# Primer sequences for ordering\n")
        f.write("# Format: Name, Sequence, Tm (C), Scale\n\n")
        for p in primers[:10]:
            f.write(f"{p.name}\t{p.sequence}\t{p.tm:.1f}\t25nmol\n")
    print(f"Order file saved to: {order_file}")

    print("\n" + "=" * 60)
    print("COMPLETED")
    print("=" * 60)
    print(f"\nAll output files saved to: {params['output_dir']}")

    return results


def main():
    """Main entry point"""

    parser = argparse.ArgumentParser(
        description="Primer Design Tool - Design primers from multiple species",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Interactive mode
  python primer_design_cli.py --interactive

  # Command line mode
  python primer_design_cli.py \\
    --organisms "Escherichia coli,Salmonella enterica,Klebsiella pneumoniae" \\
    --gene "16S rRNA" \\
    --max-seqs 5 \\
    --output ./my_primers

  # With sequence range
  python primer_design_cli.py \\
    --organisms "Staphylococcus aureus,Staphylococcus epidermidis" \\
    --gene "mecA" \\
    --start 100 --end 500
        """
    )

    parser.add_argument('--interactive', '-i', action='store_true',
                        help="Run in interactive mode")
    parser.add_argument('--organisms', '-o', type=str,
                        help="Comma-separated list of organism names")
    parser.add_argument('--gene', '-g', type=str,
                        help="Gene name to search for")
    parser.add_argument('--region', '-r', type=str,
                        help="Additional region filter")
    parser.add_argument('--start', type=int,
                        help="Start position (1-based)")
    parser.add_argument('--end', type=int,
                        help="End position")
    parser.add_argument('--databases', '-d', type=str, default="ncbi,embl",
                        help="Databases to search (ncbi,embl)")
    parser.add_argument('--max-seqs', type=int, default=5,
                        help="Maximum sequences per organism")
    parser.add_argument('--tm-min', type=float, default=55.0,
                        help="Minimum Tm (C)")
    parser.add_argument('--tm-max', type=float, default=65.0,
                        help="Maximum Tm (C)")
    parser.add_argument('--primer-min', type=int, default=18,
                        help="Minimum primer length")
    parser.add_argument('--primer-max', type=int, default=25,
                        help="Maximum primer length")
    parser.add_argument('--product-min', type=int, default=100,
                        help="Minimum product size")
    parser.add_argument('--product-max', type=int, default=500,
                        help="Maximum product size")
    parser.add_argument('--output', type=str, default="./primer_results",
                        help="Output directory")

    args = parser.parse_args()

    print_banner()

    if args.interactive or not args.organisms:
        params = get_user_input_interactive()
    else:
        params = {
            'organisms': [o.strip() for o in args.organisms.split(',')],
            'gene': args.gene,
            'region': args.region,
            'start': args.start,
            'end': args.end,
            'databases': [d.strip() for d in args.databases.split(',')],
            'max_seqs': args.max_seqs,
            'tm_min': args.tm_min,
            'tm_max': args.tm_max,
            'primer_min': args.primer_min,
            'primer_max': args.primer_max,
            'product_min': args.product_min,
            'product_max': args.product_max,
            'output_dir': args.output
        }

    # Confirm parameters
    print("\n" + "=" * 60)
    print("PARAMETERS CONFIRMED")
    print("=" * 60)
    print(f"  Organisms:      {', '.join(params['organisms'])}")
    print(f"  Gene/Region:    {params.get('gene', 'Any')} / {params.get('region', 'Any')}")
    print(f"  Range:          {params.get('start', 'Full')} - {params.get('end', 'Full')}")
    print(f"  Databases:      {', '.join(params['databases'])}")
    print(f"  Max sequences:  {params['max_seqs']} per organism")
    print(f"  Tm range:       {params['tm_min']}-{params['tm_max']} C")
    print(f"  Primer length:  {params['primer_min']}-{params['primer_max']} bp")
    print(f"  Product size:   {params['product_min']}-{params['product_max']} bp")
    print(f"  Output dir:     {params['output_dir']}")

    proceed = input("\nProceed? [Y/n]: ").strip().lower()
    if proceed == 'n':
        print("Cancelled.")
        sys.exit(0)

    # Run pipeline
    results = run_pipeline(params)

    return 0 if results.get('primer_pairs') else 1


if __name__ == "__main__":
    sys.exit(main())
