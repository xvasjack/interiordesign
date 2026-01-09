# Primer Design Tool

A comprehensive Linux tool for designing universal primers across multiple species.

## Features

- **Sequence Retrieval**: Fetches FASTA sequences from NCBI GenBank and EMBL-EBI ENA databases
- **Multiple Sequence Alignment**: Aligns sequences using MAFFT, MUSCLE, or built-in aligner
- **Conserved Region Detection**: Identifies regions suitable for universal primer design
- **Primer Design**: Generates forward and reverse primers with quality metrics
- **Thermodynamic Calculations**:
  - Melting temperature (Tm) using nearest-neighbor method
  - GC content analysis
  - PCR efficiency estimation
  - Self-complementarity and hairpin detection
  - Primer dimer prediction

## Output

For each designed primer, the tool provides:
- **Efficiency (%)**: Estimated PCR efficiency based on primer characteristics
- **Annealing Temperature (Tm)**: Calculated using SantaLucia nearest-neighbor parameters

## Installation

```bash
# Clone the repository
cd biolearn/tools/primer_design

# Optional: Install alignment tools for better results
# Using conda:
conda install -c bioconda mafft muscle

# Or using apt (Ubuntu/Debian):
sudo apt-get install mafft muscle
```

## Usage

### Interactive Mode

```bash
python primer_design_cli.py --interactive
```

Follow the prompts to:
1. Enter target organisms (comma-separated)
2. Specify gene/region of interest
3. Set sequence range (optional)
4. Choose databases (NCBI, EMBL-EBI, or both)
5. Configure primer parameters

### Command Line Mode

```bash
# Basic usage
python primer_design_cli.py \
  --organisms "Escherichia coli,Salmonella enterica,Klebsiella pneumoniae" \
  --gene "16S rRNA" \
  --output ./my_primers

# With all options
python primer_design_cli.py \
  --organisms "Staphylococcus aureus,Staphylococcus epidermidis" \
  --gene "mecA" \
  --region "resistance" \
  --start 100 --end 800 \
  --databases "ncbi,embl" \
  --max-seqs 10 \
  --tm-min 55 --tm-max 65 \
  --primer-min 18 --primer-max 25 \
  --product-min 100 --product-max 500 \
  --output ./mecA_primers
```

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--organisms, -o` | Comma-separated organism names | Required |
| `--gene, -g` | Gene name to search | None |
| `--region, -r` | Additional region filter | None |
| `--start` | Start position (1-based) | Full sequence |
| `--end` | End position | Full sequence |
| `--databases, -d` | Databases to search | ncbi,embl |
| `--max-seqs` | Max sequences per organism | 5 |
| `--tm-min` | Minimum Tm (C) | 55.0 |
| `--tm-max` | Maximum Tm (C) | 65.0 |
| `--primer-min` | Minimum primer length | 18 |
| `--primer-max` | Maximum primer length | 25 |
| `--product-min` | Minimum product size | 100 |
| `--product-max` | Maximum product size | 500 |
| `--output` | Output directory | ./primer_results |

## Output Files

The tool generates several output files in the specified directory:

| File | Description |
|------|-------------|
| `sequences.fasta` | Retrieved sequences in FASTA format |
| `alignment.fasta` | Multiple sequence alignment |
| `primer_results.json` | Complete results in JSON format |
| `primers.txt` | Formatted primer report |
| `primers_for_ordering.txt` | Primer sequences ready for ordering |

## Example Output

```
======================================================================
PRIMER PAIRS
======================================================================

--- Pair 1 ---
Forward: 5'-AGAGTTTGATCCTGGCTCAG-3'
  Name: Primer_F1_1
  Tm: 58.2 C | GC: 50.0% | Efficiency: 92.5%

Reverse: 5'-GGTTACCTTGTTACGACTT-3'
  Name: Primer_R2_3
  Tm: 56.8 C | GC: 42.1% | Efficiency: 88.3%

Product Size:    465 bp
Pair Efficiency: 90.4%
Tm Difference:   1.4 C
Annealing Temp:  51.8 C (recommended)
```

## Tm Calculation Method

The tool uses the **SantaLucia (1998) nearest-neighbor method** for accurate Tm calculation:

```
Tm = ΔH / (ΔS + R × ln(Ct/4)) - 273.15
```

Where:
- ΔH = sum of nearest-neighbor enthalpy values
- ΔS = sum of nearest-neighbor entropy values + salt correction
- R = gas constant (1.987 cal/mol·K)
- Ct = primer concentration

## Efficiency Calculation

PCR efficiency is estimated based on:
- Tm within optimal range (55-65°C)
- GC content (40-60% optimal)
- Primer length (18-25 bp optimal)
- Self-complementarity score
- Hairpin potential
- 3' end stability (GC clamp)
- Conservation score across species

## Common Use Cases

### 1. Bacterial Identification (16S rRNA)
```bash
python primer_design_cli.py \
  --organisms "Escherichia coli,Pseudomonas aeruginosa,Bacillus subtilis" \
  --gene "16S rRNA" \
  --output ./16S_primers
```

### 2. Fungal Identification (ITS)
```bash
python primer_design_cli.py \
  --organisms "Candida albicans,Aspergillus fumigatus,Saccharomyces cerevisiae" \
  --gene "ITS" \
  --output ./ITS_primers
```

### 3. Animal DNA Barcoding (COI)
```bash
python primer_design_cli.py \
  --organisms "Homo sapiens,Pan troglodytes,Gorilla gorilla" \
  --gene "COI" \
  --output ./COI_primers
```

### 4. Plant Barcoding
```bash
python primer_design_cli.py \
  --organisms "Arabidopsis thaliana,Oryza sativa,Zea mays" \
  --gene "matK" \
  --output ./plant_primers
```

## Troubleshooting

### No sequences found
- Check organism spelling (use scientific names)
- Try broader search terms
- Use different databases

### No conserved regions found
- Species may be too divergent
- Try more closely related species
- Increase sequence range
- Lower conservation threshold

### Poor primer quality
- Adjust Tm range
- Modify primer length constraints
- Try different target regions

## API Usage

```python
from primer_design import SequenceFetcher, SequenceAligner, PrimerDesigner

# Fetch sequences
fetcher = SequenceFetcher()
sequences = fetcher.fetch_from_all_databases(
    organisms=["E. coli", "Salmonella"],
    gene="16S rRNA",
    max_per_organism=5
)

# Align sequences
aligner = SequenceAligner(tool='mafft')
aligned, fasta = aligner.align(sequences)

# Find conserved regions
regions = aligner.find_conserved_regions(aligned, min_conservation=0.8)

# Design primers
designer = PrimerDesigner(tm_min=55, tm_max=65)
primers = designer.design_primers(regions, aligned)
pairs = designer.design_primer_pairs(regions, aligned)

# Print results
print(designer.format_results(primers=primers, pairs=pairs))
```

## References

- SantaLucia J Jr. (1998) A unified view of polymer, dumbbell, and oligonucleotide DNA nearest-neighbor thermodynamics. PNAS 95:1460-1465
- NCBI E-utilities documentation: https://www.ncbi.nlm.nih.gov/books/NBK25500/
- EMBL-EBI ENA API: https://www.ebi.ac.uk/ena/browser/api/

## License

MIT License - See LICENSE file for details.
