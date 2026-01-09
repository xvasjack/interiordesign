# Run Bash - Step by Step

## Install Tools

```bash
sudo apt-get install mafft primer3 curl
```

## Usage

```bash
chmod +x *.sh

./1_fetch_sequences.sh    # Fetch from NCBI
./2_align_sequences.sh    # Align with MAFFT
./3_design_primers.sh     # Design with Primer3
```

## Edit Parameters

In `1_fetch_sequences.sh`:
```bash
GENUS="Salmonella"
GENE="16S ribosomal RNA"
MAX_SEQS=20
```

---

## Tools Comparison

| Tool | Advantages | Disadvantages |
|------|------------|---------------|
| **NCBI E-utils** | Largest database, free API | Rate limited (3/sec) |
| **MAFFT** | Fast, accurate, large datasets | Requires install |
| **Primer3** | Gold standard, accurate Tm | Requires install |

| Tm Method | Advantages | Disadvantages |
|-----------|------------|---------------|
| **Primer3 (SantaLucia)** | Most accurate | Requires Primer3 |
| **Wallace (2AT+4GC)** | Simple | Short oligos only |
