# BioLearn Development Reference

## Output Folder Naming Convention

- **Pattern**: `o_toolname`
- **Examples**: `o_unicycler`, `o_abricate`, `o_quast`, `o_prokka`, `o_mlst`

## Consistency Requirements

1. **Terminal output** = **Guidance screen** = **Backend**
   - All three must use the same folder names and file paths
   - Terminal.svelte toolCreatedFiles must match storyline commands
   - Output file generation is enabled

2. **All scenarios and tools must reflect real events**
   - Use realistic tool output formats
   - Use biologically accurate data (correct organism, ST types, AMR genes, etc.)
   - Match expected tool behavior and output structure

## Trial Storyline (kpneumoniae_demo)

**Organism**: Klebsiella pneumoniae ST258
**Tools used**: seqkit, fastqc, trimmomatic, unicycler, bandage, quast, checkm2, plasmidfinder, abricate, mlst, prokka

### Key Data Points
- **Assembly**: 189 contigs, 5,566,069 bp, N50 371,705 bp, GC 57.18%
- **Components**: 1 incomplete (chromosome), 3 complete circular (Col-type plasmids)
- **Plasmids**: ColRNAI (5,409 bp), Col(pHAD28) (4,315 bp), Col156 (2,532 bp)
- **MLST**: ST258 (gapA-3, infB-3, mdh-1, pgi-1, phoE-1, rpoB-1, tonB-79)
- **AMR genes**: blaKPC-2, blaSHV-11, fosA, oqxA, oqxB (all chromosomal)

## File Locations

- **Terminal outputs**: `biolearn/frontend/src/lib/components/Terminal.svelte`
- **Storylines**: `biolearn/frontend/src/lib/storylines/wgs-bacteria.ts`
- **Terminal store**: `biolearn/frontend/src/lib/stores/terminal.ts`
