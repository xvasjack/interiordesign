# Run Bash - Step by Step

## Usage

```bash
chmod +x *.sh

./1_fetch_sequences.sh    # Fetch from NCBI
./2_align_sequences.sh    # Align sequences
./3_design_primers.sh     # Design primers
```

## Output Files

| File | Description |
|------|-------------|
| `sequences.fasta` | Raw sequences from NCBI |
| `alignment.fasta` | Aligned sequences |
| `conserved_regions.txt` | Conserved regions found |
| `primers.txt` | Designed primers with Tm & efficiency |

---

## Tools Comparison

### Sequence Databases

| Database | Advantages | Disadvantages |
|----------|------------|---------------|
| **NCBI GenBank** | Largest database, well-documented API, reliable | Rate limited (3 req/sec), US-based servers |
| **EMBL-EBI ENA** | European mirror, good for redundancy | Smaller, API less stable, slower |

### Alignment Tools

| Tool | Advantages | Disadvantages |
|------|------------|---------------|
| **MAFFT** | Fast, accurate, handles large datasets | Requires installation |
| **MUSCLE** | Very accurate for protein | Slower than MAFFT, memory intensive |
| **ClustalW** | Classic, widely cited | Outdated, slow, less accurate |
| **Built-in** | No dependencies, always works | Basic algorithm, less accurate |

### Tm Calculation Methods

| Method | Advantages | Disadvantages |
|--------|------------|---------------|
| **Nearest-Neighbor** | Most accurate, thermodynamic basis | Complex calculation |
| **Wallace Rule** | Simple (2AT + 4GC) | Only for short oligos (<14bp) |
| **Basic Formula** | Fast | Less accurate for long primers |

### Primer Design Approach

| Approach | Advantages | Disadvantages |
|----------|------------|---------------|
| **Conserved Region** | Universal primers, works across species | May miss species-specific targets |
| **Species-Specific** | High specificity | Only works for one species |

---

## Recommended Settings

| Parameter | Recommended | Range |
|-----------|-------------|-------|
| Primer length | 20 bp | 18-25 bp |
| Tm | 60°C | 55-65°C |
| GC content | 50% | 40-60% |
| Product size | 200-500 bp | 100-1000 bp |
