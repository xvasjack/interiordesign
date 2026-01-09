# PrimerMaker Quick Start

## Option 1: One-Line Commands (Copy & Paste)

### Genus Mode (Recommended)
```bash
# Salmonella 16S primers (50 species, 4 sequences each)
python3 primer_design_cli.py --genus "Salmonella" --gene "16S ribosomal RNA" --max-species 50 --max-per-species 4 --databases ncbi --output ./salmonella_primers

# Staphylococcus primers
python3 primer_design_cli.py --genus "Staphylococcus" --gene "16S ribosomal RNA" --max-species 30 --max-per-species 3 --databases ncbi --output ./staph_primers

# Escherichia primers
python3 primer_design_cli.py --genus "Escherichia" --gene "16S ribosomal RNA" --max-species 20 --max-per-species 5 --databases ncbi --output ./ecoli_primers
```

### Organism Mode (Specific Species)
```bash
# Multiple specific organisms
python3 primer_design_cli.py --organisms "Salmonella enterica,Salmonella typhimurium,Salmonella bongori" --gene "16S ribosomal RNA" --max-seqs 5 --databases ncbi --output ./specific_primers
```

### Interactive Mode
```bash
python3 primer_design_cli.py --interactive
```

---

## Option 2: Bash Script

```bash
# Make executable (one time)
chmod +x primermaker.sh

# Run
./primermaker.sh -g Salmonella -n "16S ribosomal RNA" -s 50 -p 4
./primermaker.sh --help
```

---

## Option 3: Step-by-Step Commands

### Step 1: Fetch Sequences
```python
# In Python
from sequence_fetcher import SequenceFetcher

fetcher = SequenceFetcher()
sequences = fetcher.fetch_by_genus(
    genus="Salmonella",
    gene="16S ribosomal RNA",
    max_species=50,
    max_per_species=4,
    databases=['ncbi']
)
fetcher.save_to_fasta(sequences, "sequences.fasta")
```

### Step 2: Align Sequences
```python
from aligner import SequenceAligner

aligner = SequenceAligner(tool='mafft')  # or 'builtin'
aligned, fasta = aligner.align(sequences, "alignment.fasta")
regions = aligner.find_conserved_regions(aligned, min_conservation=0.8)
```

### Step 3: Design Primers
```python
from primer_designer import PrimerDesigner

designer = PrimerDesigner(tm_min=55, tm_max=65)
primers = designer.design_primers(regions, aligned)
pairs = designer.design_primer_pairs(regions, aligned)
print(designer.format_results(primers=primers, pairs=pairs))
```

---

## Common Gene Names for NCBI Search

| Target | Gene Name |
|--------|-----------|
| Bacteria 16S | `16S ribosomal RNA` |
| Fungi ITS | `internal transcribed spacer` |
| Animal COI | `cytochrome oxidase subunit I` |
| Plant matK | `maturase K` |
| Plant rbcL | `ribulose-1,5-bisphosphate carboxylase` |

---

## Output Files

After running, check the output directory:
```bash
ls -la ./primer_results/
```

| File | Description |
|------|-------------|
| `sequences.fasta` | Downloaded sequences |
| `alignment.fasta` | Aligned sequences |
| `primer_results.json` | Full results (JSON) |
| `primers.txt` | Formatted report |
| `primers_for_ordering.txt` | Ready for ordering |

---

## Troubleshooting

**No sequences found?**
- Use proper capitalization: `Salmonella` not `salmonella`
- Use full gene names: `16S ribosomal RNA` not `16S`
- Try NCBI only: `--databases ncbi`

**EMBL-EBI errors?**
- Skip it: `--databases ncbi`

**Need MAFFT for better alignment?**
```bash
# Ubuntu/Debian
sudo apt-get install mafft

# Conda
conda install -c bioconda mafft
```
