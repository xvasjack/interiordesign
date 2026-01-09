"""
Sequence Aligner Module

Performs multiple sequence alignment using MAFFT, MUSCLE, or ClustalW.
Identifies conserved regions suitable for primer design.
"""

import os
import subprocess
import tempfile
import shutil
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from .sequence_fetcher import SequenceRecord


@dataclass
class AlignedSequence:
    """Container for aligned sequence"""
    accession: str
    organism: str
    sequence: str  # With gaps (-)
    original_length: int


@dataclass
class ConservedRegion:
    """Container for conserved region information"""
    start: int  # 0-based position in alignment
    end: int
    length: int
    conservation_score: float  # 0.0 to 1.0
    consensus_sequence: str
    alignment_positions: List[int]  # Positions of each base in original sequences


class SequenceAligner:
    """
    Multiple sequence alignment using external tools.

    Supports:
    - MAFFT (recommended)
    - MUSCLE
    - ClustalW

    Also provides built-in simple alignment for small sequences.
    """

    SUPPORTED_TOOLS = ['mafft', 'muscle', 'clustalw', 'clustalo', 'builtin']

    def __init__(self, tool: str = 'mafft'):
        """
        Initialize aligner with specified tool.

        Args:
            tool: Alignment tool to use ('mafft', 'muscle', 'clustalw', 'clustalo', 'builtin')
        """
        self.tool = tool.lower()
        if self.tool not in self.SUPPORTED_TOOLS:
            raise ValueError(f"Unsupported tool: {tool}. Use one of {self.SUPPORTED_TOOLS}")

        if self.tool != 'builtin':
            self._check_tool_available()

    def _check_tool_available(self) -> bool:
        """Check if the alignment tool is installed"""
        tool_name = self.tool
        if tool_name == 'clustalw':
            tool_name = 'clustalw2'  # Common binary name

        if shutil.which(tool_name) or shutil.which(self.tool):
            return True

        print(f"Warning: {self.tool} not found in PATH. Will use built-in aligner.")
        self.tool = 'builtin'
        return False

    def align(
        self,
        sequences: List[SequenceRecord],
        output_file: Optional[str] = None
    ) -> Tuple[List[AlignedSequence], str]:
        """
        Perform multiple sequence alignment.

        Args:
            sequences: List of SequenceRecord objects to align
            output_file: Optional path to save alignment

        Returns:
            Tuple of (List of AlignedSequence objects, alignment in FASTA format)
        """
        if len(sequences) < 2:
            raise ValueError("Need at least 2 sequences for alignment")

        print(f"Aligning {len(sequences)} sequences using {self.tool}...")

        # Write sequences to temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.fasta', delete=False) as f:
            input_file = f.name
            for seq in sequences:
                f.write(seq.to_fasta() + '\n')

        try:
            if self.tool == 'builtin':
                aligned_fasta = self._builtin_align(sequences)
            else:
                aligned_fasta = self._run_external_tool(input_file)
        finally:
            os.unlink(input_file)

        # Parse aligned sequences
        aligned_sequences = self._parse_aligned_fasta(aligned_fasta, sequences)

        # Save if requested
        if output_file:
            with open(output_file, 'w') as f:
                f.write(aligned_fasta)
            print(f"Alignment saved to {output_file}")

        return aligned_sequences, aligned_fasta

    def _run_external_tool(self, input_file: str) -> str:
        """Run external alignment tool"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.fasta', delete=False) as f:
            output_file = f.name

        try:
            if self.tool == 'mafft':
                cmd = ['mafft', '--auto', '--quiet', input_file]
                result = subprocess.run(cmd, capture_output=True, text=True, check=True)
                return result.stdout

            elif self.tool == 'muscle':
                # MUSCLE v5 syntax
                cmd = ['muscle', '-align', input_file, '-output', output_file]
                try:
                    subprocess.run(cmd, capture_output=True, text=True, check=True)
                except subprocess.CalledProcessError:
                    # Try MUSCLE v3 syntax
                    cmd = ['muscle', '-in', input_file, '-out', output_file]
                    subprocess.run(cmd, capture_output=True, text=True, check=True)

                with open(output_file) as f:
                    return f.read()

            elif self.tool in ['clustalw', 'clustalw2']:
                tool_name = 'clustalw2' if shutil.which('clustalw2') else 'clustalw'
                cmd = [tool_name, '-INFILE=' + input_file, '-OUTFILE=' + output_file,
                       '-OUTPUT=FASTA', '-QUIET']
                subprocess.run(cmd, capture_output=True, text=True, check=True)

                with open(output_file) as f:
                    return f.read()

            elif self.tool == 'clustalo':
                cmd = ['clustalo', '-i', input_file, '-o', output_file, '--force']
                subprocess.run(cmd, capture_output=True, text=True, check=True)

                with open(output_file) as f:
                    return f.read()

        except subprocess.CalledProcessError as e:
            print(f"Alignment tool error: {e.stderr}")
            print("Falling back to built-in aligner...")
            # Re-read input and use builtin
            with open(input_file) as f:
                seqs = self._parse_input_fasta(f.read())
            return self._builtin_align_raw(seqs)

        finally:
            if os.path.exists(output_file):
                os.unlink(output_file)

    def _builtin_align(self, sequences: List[SequenceRecord]) -> str:
        """Simple built-in alignment for when external tools aren't available"""
        seqs = [(s.accession, s.sequence) for s in sequences]
        return self._builtin_align_raw(seqs)

    def _builtin_align_raw(self, sequences: List[Tuple[str, str]]) -> str:
        """
        Simple progressive alignment implementation.
        For production use, external tools are recommended.
        """
        if not sequences:
            return ""

        # Find the longest sequence
        max_len = max(len(seq) for _, seq in sequences)

        # Simple center star alignment
        # Use longest sequence as reference
        ref_idx = max(range(len(sequences)), key=lambda i: len(sequences[i][1]))
        ref_name, ref_seq = sequences[ref_idx]

        aligned = []

        for name, seq in sequences:
            if seq == ref_seq:
                aligned.append((name, seq))
            else:
                # Simple pairwise alignment using dynamic programming
                aligned_seq = self._pairwise_align(ref_seq, seq)
                aligned.append((name, aligned_seq))

        # Make all sequences same length
        max_aligned_len = max(len(seq) for _, seq in aligned)

        result = []
        for name, seq in aligned:
            padded = seq + '-' * (max_aligned_len - len(seq))
            result.append(f">{name}\n{padded}")

        return '\n'.join(result)

    def _pairwise_align(self, seq1: str, seq2: str) -> str:
        """Simple Needleman-Wunsch pairwise alignment"""
        # Scoring
        match = 2
        mismatch = -1
        gap = -2

        m, n = len(seq1), len(seq2)

        # Initialize score matrix
        score = [[0] * (n + 1) for _ in range(m + 1)]

        for i in range(m + 1):
            score[i][0] = gap * i
        for j in range(n + 1):
            score[0][j] = gap * j

        # Fill matrix
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                match_score = match if seq1[i-1] == seq2[j-1] else mismatch
                score[i][j] = max(
                    score[i-1][j-1] + match_score,
                    score[i-1][j] + gap,
                    score[i][j-1] + gap
                )

        # Traceback to get aligned sequence
        aligned = []
        i, j = m, n

        while i > 0 or j > 0:
            if i > 0 and j > 0:
                match_score = match if seq1[i-1] == seq2[j-1] else mismatch
                if score[i][j] == score[i-1][j-1] + match_score:
                    aligned.append(seq2[j-1])
                    i -= 1
                    j -= 1
                elif score[i][j] == score[i-1][j] + gap:
                    aligned.append('-')
                    i -= 1
                else:
                    aligned.append(seq2[j-1])
                    j -= 1
            elif i > 0:
                aligned.append('-')
                i -= 1
            else:
                aligned.append(seq2[j-1])
                j -= 1

        return ''.join(reversed(aligned))

    def _parse_aligned_fasta(
        self,
        fasta_text: str,
        original_sequences: List[SequenceRecord]
    ) -> List[AlignedSequence]:
        """Parse aligned FASTA and create AlignedSequence objects"""
        # Create lookup for original sequences
        orig_lookup = {s.accession: s for s in original_sequences}

        aligned = []
        current_name = None
        current_seq = []

        for line in fasta_text.strip().split('\n'):
            line = line.strip()
            if not line:
                continue

            if line.startswith('>'):
                if current_name and current_seq:
                    accession = current_name.split()[0]
                    orig = orig_lookup.get(accession)
                    organism = orig.organism if orig else "Unknown"
                    orig_len = len(orig.sequence) if orig else len(''.join(current_seq).replace('-', ''))

                    aligned.append(AlignedSequence(
                        accession=accession,
                        organism=organism,
                        sequence=''.join(current_seq),
                        original_length=orig_len
                    ))

                current_name = line[1:]
                current_seq = []
            else:
                current_seq.append(line)

        # Last sequence
        if current_name and current_seq:
            accession = current_name.split()[0]
            orig = orig_lookup.get(accession)
            organism = orig.organism if orig else "Unknown"
            orig_len = len(orig.sequence) if orig else len(''.join(current_seq).replace('-', ''))

            aligned.append(AlignedSequence(
                accession=accession,
                organism=organism,
                sequence=''.join(current_seq),
                original_length=orig_len
            ))

        return aligned

    def _parse_input_fasta(self, fasta_text: str) -> List[Tuple[str, str]]:
        """Parse FASTA to list of (name, sequence) tuples"""
        sequences = []
        current_name = None
        current_seq = []

        for line in fasta_text.strip().split('\n'):
            line = line.strip()
            if line.startswith('>'):
                if current_name:
                    sequences.append((current_name, ''.join(current_seq)))
                current_name = line[1:].split()[0]
                current_seq = []
            else:
                current_seq.append(line)

        if current_name:
            sequences.append((current_name, ''.join(current_seq)))

        return sequences

    def find_conserved_regions(
        self,
        aligned_sequences: List[AlignedSequence],
        min_conservation: float = 0.8,
        min_length: int = 18,
        max_length: int = 25
    ) -> List[ConservedRegion]:
        """
        Find conserved regions suitable for primer design.

        Args:
            aligned_sequences: List of aligned sequences
            min_conservation: Minimum conservation score (0.0-1.0)
            min_length: Minimum region length
            max_length: Maximum region length

        Returns:
            List of ConservedRegion objects
        """
        if not aligned_sequences:
            return []

        alignment_length = len(aligned_sequences[0].sequence)
        num_sequences = len(aligned_sequences)

        # Calculate conservation at each position
        conservation = []
        consensus = []

        for pos in range(alignment_length):
            bases = [seq.sequence[pos] for seq in aligned_sequences]

            # Count non-gap bases
            non_gap = [b for b in bases if b != '-']
            if not non_gap:
                conservation.append(0.0)
                consensus.append('-')
                continue

            # Find most common base
            base_counts = {}
            for base in non_gap:
                base_counts[base] = base_counts.get(base, 0) + 1

            most_common = max(base_counts.items(), key=lambda x: x[1])
            cons_score = most_common[1] / num_sequences

            conservation.append(cons_score)
            consensus.append(most_common[0])

        # Find regions meeting criteria
        regions = []
        start = None

        for i, score in enumerate(conservation):
            if score >= min_conservation:
                if start is None:
                    start = i
            else:
                if start is not None:
                    length = i - start
                    if length >= min_length:
                        # Split into primer-sized chunks if too long
                        for chunk_start in range(start, i, max_length):
                            chunk_end = min(chunk_start + max_length, i)
                            chunk_len = chunk_end - chunk_start
                            if chunk_len >= min_length:
                                avg_conservation = sum(conservation[chunk_start:chunk_end]) / chunk_len
                                regions.append(ConservedRegion(
                                    start=chunk_start,
                                    end=chunk_end,
                                    length=chunk_len,
                                    conservation_score=avg_conservation,
                                    consensus_sequence=''.join(consensus[chunk_start:chunk_end]),
                                    alignment_positions=list(range(chunk_start, chunk_end))
                                ))
                    start = None

        # Check final region
        if start is not None:
            length = alignment_length - start
            if length >= min_length:
                for chunk_start in range(start, alignment_length, max_length):
                    chunk_end = min(chunk_start + max_length, alignment_length)
                    chunk_len = chunk_end - chunk_start
                    if chunk_len >= min_length:
                        avg_conservation = sum(conservation[chunk_start:chunk_end]) / chunk_len
                        regions.append(ConservedRegion(
                            start=chunk_start,
                            end=chunk_end,
                            length=chunk_len,
                            conservation_score=avg_conservation,
                            consensus_sequence=''.join(consensus[chunk_start:chunk_end]),
                            alignment_positions=list(range(chunk_start, chunk_end))
                        ))

        # Sort by conservation score
        regions.sort(key=lambda r: r.conservation_score, reverse=True)

        return regions

    def get_alignment_summary(self, aligned_sequences: List[AlignedSequence]) -> Dict:
        """Get summary statistics for alignment"""
        if not aligned_sequences:
            return {}

        alignment_length = len(aligned_sequences[0].sequence)
        num_sequences = len(aligned_sequences)

        # Calculate overall conservation
        total_conserved = 0
        gap_columns = 0

        for pos in range(alignment_length):
            bases = [seq.sequence[pos] for seq in aligned_sequences]
            non_gap = [b for b in bases if b != '-']

            if not non_gap:
                gap_columns += 1
                continue

            base_counts = {}
            for base in non_gap:
                base_counts[base] = base_counts.get(base, 0) + 1

            most_common = max(base_counts.values())
            if most_common == num_sequences:
                total_conserved += 1

        return {
            'num_sequences': num_sequences,
            'alignment_length': alignment_length,
            'conserved_columns': total_conserved,
            'gap_columns': gap_columns,
            'percent_identity': (total_conserved / alignment_length) * 100 if alignment_length > 0 else 0,
            'percent_gaps': (gap_columns / alignment_length) * 100 if alignment_length > 0 else 0
        }


# Example usage
if __name__ == "__main__":
    # Test with sample sequences
    from .sequence_fetcher import SequenceRecord

    test_sequences = [
        SequenceRecord("seq1", "Species A", "Test", "ATGCGATCGATCGATCGATCGATCG", "test"),
        SequenceRecord("seq2", "Species B", "Test", "ATGCGATCGTTCGATCGATCGATCG", "test"),
        SequenceRecord("seq3", "Species C", "Test", "ATGCGATCGATCGAACGATCGATCG", "test"),
    ]

    aligner = SequenceAligner(tool='builtin')
    aligned, fasta = aligner.align(test_sequences)

    print("Aligned sequences:")
    print(fasta)

    print("\nConserved regions:")
    regions = aligner.find_conserved_regions(aligned, min_conservation=0.8, min_length=5)
    for region in regions:
        print(f"  {region.start}-{region.end}: {region.consensus_sequence} "
              f"(conservation: {region.conservation_score:.2f})")
