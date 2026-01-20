# BioLearn Development Reference

## Template Directory Structure

The `biolearn/template/` directory contains pre-generated output files for storylines:

```
biolearn/template/
├── tutorial/
│   ├── basic_linux_commands/
│   │   └── (sample files for Linux basics tutorial)
│   └── kpneumoniae_demo/
│       ├── o_fastqc/
│       ├── o_trimmomatic/
│       ├── o_unicycler/
│       ├── o_quast/
│       ├── o_checkm2/
│       ├── o_plasmidfinder/
│       ├── o_abricate/
│       ├── o_mlst/
│       └── o_prokka/
│
├── wgs_bacteria/
│   ├── hospital/                    # Storyline 1: Hospital Outbreak (AMR in ICU)
│   │   ├── o_fastqc/
│   │   ├── o_trimmomatic/
│   │   ├── o_unicycler/
│   │   ├── o_quast/
│   │   ├── o_checkm/
│   │   ├── o_abricate/
│   │   ├── o_mlst/
│   │   ├── o_prokka/
│   │   ├── o_mob_recon/
│   │   ├── o_plasmidfinder/
│   │   ├── o_snippy/
│   │   ├── o_roary/
│   │   ├── o_iqtree/
│   │   ├── o_resfinder/
│   │   ├── o_integron_finder/
│   │   └── o_isescan/
│   │
│   ├── foodborne/                   # Storyline 2: Food Poisoning Outbreak
│   │   ├── o_fastqc/
│   │   ├── o_trimmomatic/
│   │   └── ... (same pattern)
│   │
│   ├── plant/                       # Storyline 3: Plant Pathogen (Citrus Canker)
│   │   └── ...
│   │
│   ├── fish/                        # Storyline 4: Fish Mortality Event
│   │   └── ...
│   │
│   ├── wastewater/                  # Storyline 5: Wastewater AMR Surveillance
│   │   └── ...
│   │
│   └── clinical/                    # Storyline 6: Clinical Rapid Diagnostics
│       └── ...
│
└── amplicon_bacteria/
    ├── gut/                         # Storyline 1: Gut Microbiome (IBD vs Healthy)
    │   ├── o_fastqc/
    │   ├── o_multiqc/
    │   ├── o_cutadapt/
    │   ├── o_qiime2/
    │   └── ...
    │
    ├── soil/                        # Storyline 2: Compost Microbiome
    │   ├── o_fastqc/
    │   └── ...
    │
    └── water/                       # Storyline 3: Water Contamination Investigation
        ├── o_fastqc/
        └── ...
```

## Output Folder/File Naming Convention

**Output file format: `o_toolname`**

- All output folders and files MUST follow this pattern
- **Folders**: `o_toolname/` (e.g., `o_unicycler/`, `o_abricate/`, `o_quast/`, `o_prokka/`, `o_mlst/`)
- **Single files**: `o_toolname.ext` (e.g., `o_bandage.png`, `o_seqkit_stats.txt`, `o_fastqc.html`)

## Consistency Requirements

1. **Terminal output** = **Guidance screen** = **Backend**
   - All three must use the same folder names and file paths
   - Terminal.svelte toolCreatedFiles must match storyline commands
   - Output file generation is enabled

2. **All scenarios and tools must reflect real events**
   - Use realistic tool output formats
   - Use biologically accurate data (correct organism, ST types, AMR genes, etc.)
   - Match expected tool behavior and output structure

3. **When changing a filename/path, update ALL locations:**
   - `Terminal.svelte` - toolCreatedFiles, toolOutputs, files array
   - `wgs-bacteria.ts` - storyline commands
   - `ThreePanelLayout.svelte` - toolOutputFiles mapping
   - `OutputPanel.svelte` - mockFileContents
   - `terminal.ts` - bioTools set (if adding new tool)

## Trial Storyline (kpneumoniae_demo)

**Organism**: Klebsiella pneumoniae ST258
**Tools used**: seqkit, fastqc, trimmomatic, unicycler, bandage, quast, checkm2, plasmidfinder, abricate, mlst, prokka

### Key Data Points
- **Assembly**: 65 contigs (>=500bp), 117 contigs total, 5,553,065 bp, N50 371,705 bp, GC 57.18%
- **Largest contig**: 837,178 bp
- **L50**: 6, **L75**: 10, **N75**: 224,673 bp
- **Components**: 1 incomplete (chromosome), 3 complete circular (Col-type plasmids)
- **Plasmids**: ColRNAI (5,409 bp), Col(pHAD28) (4,315 bp), Col156 (2,532 bp)
- **MLST**: ST258 (gapA-3, infB-3, mdh-1, pgi-1, phoE-1, rpoB-1, tonB-79)
- **AMR genes**: blaKPC-2, blaSHV-11, fosA, oqxA, oqxB (all chromosomal)

## File Locations

- **Terminal outputs**: `biolearn/frontend/src/lib/components/Terminal.svelte`
- **Storylines**: `biolearn/frontend/src/lib/storylines/wgs-bacteria.ts`
- **Terminal store**: `biolearn/frontend/src/lib/stores/terminal.ts`
- **Three panel layout**: `biolearn/frontend/src/lib/components/ThreePanelLayout.svelte`
- **Output panel**: `biolearn/frontend/src/lib/components/OutputPanel.svelte`

## Common Pitfalls

1. **Filename mismatch**: Always search for the old filename across all files before changing
2. **Inconsistent paths**: Input files should use source folder (e.g., `o_unicycler/assembly.fasta`)
3. **Missing tool in bioTools**: New tools must be added to the bioTools set in terminal.ts

## TODO: Apply `o_toolname` Convention and Create Template Files

### Phase 1: Tutorial Templates
1. **`template/tutorial/basic_linux_commands/`** - Sample files for Linux basics
2. **`template/tutorial/kpneumoniae_demo/`** - Current o_fastqc/ files need to be moved here

### Phase 2: WGS Bacteria Templates
Each storyline needs template output files created in `template/wgs_bacteria/<storyline>/`:

| Storyline | Template Path | Status |
|-----------|---------------|--------|
| `hospital` | `template/wgs_bacteria/hospital/` | Pending |
| `foodborne` | `template/wgs_bacteria/foodborne/` | Pending |
| `plant` | `template/wgs_bacteria/plant/` | Pending |
| `fish` | `template/wgs_bacteria/fish/` | Pending |
| `wastewater` | `template/wgs_bacteria/wastewater/` | Pending |
| `clinical` | `template/wgs_bacteria/clinical/` | Pending |

### Phase 3: Amplicon Bacteria Templates
Each storyline needs template output files created in `template/amplicon_bacteria/<storyline>/`:

| Storyline | Template Path | Status |
|-----------|---------------|--------|
| `gut` | `template/amplicon_bacteria/gut/` | Pending |
| `soil` | `template/amplicon_bacteria/soil/` | Pending |
| `water` | `template/amplicon_bacteria/water/` | Pending |

### Legacy Folder Names to Update in Code
The following storylines still use non-standard output folder names in their code:

| Storyline | Current Names | Should Be |
|-----------|---------------|-----------|
| WGS storylines | `trimmed/`, `assembly/`, `quast_results/`, etc. | `o_trimmomatic/`, `o_unicycler/`, `o_quast/`, etc. |
| Amplicon storylines | `qc_reports/`, `trimmed/` | `o_fastqc/`, `o_cutadapt/` |

**Note**: Apply code changes when working on each storyline individually.
