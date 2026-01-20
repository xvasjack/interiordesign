# BioLearn Development Reference

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
