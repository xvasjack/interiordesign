"""
Primer Designer Module

Designs primers from conserved regions with:
- Melting temperature (Tm) calculation using nearest-neighbor method
- GC content analysis
- Efficiency estimation
- Self-complementarity and hairpin detection
- Primer dimer prediction
"""

import math
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
from aligner import ConservedRegion, AlignedSequence


@dataclass
class Primer:
    """Container for primer information"""
    sequence: str
    name: str
    direction: str  # 'forward' or 'reverse'
    start_pos: int  # Position in alignment
    end_pos: int
    length: int
    tm: float  # Melting temperature in Celsius
    gc_content: float  # Percentage
    efficiency: float  # Estimated PCR efficiency (0-100%)
    conservation_score: float
    self_complementarity: int  # Score
    hairpin_score: int
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'name': self.name,
            'sequence': self.sequence,
            'direction': self.direction,
            'position': f"{self.start_pos}-{self.end_pos}",
            'length': self.length,
            'tm': round(self.tm, 1),
            'gc_content': round(self.gc_content, 1),
            'efficiency': round(self.efficiency, 1),
            'conservation': round(self.conservation_score * 100, 1),
            'warnings': self.warnings
        }


@dataclass
class PrimerPair:
    """Container for primer pair"""
    forward: Primer
    reverse: Primer
    product_size: int
    pair_efficiency: float
    tm_difference: float
    dimer_score: int
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'forward': self.forward.to_dict(),
            'reverse': self.reverse.to_dict(),
            'product_size': self.product_size,
            'pair_efficiency': round(self.pair_efficiency, 1),
            'tm_difference': round(self.tm_difference, 1),
            'dimer_score': self.dimer_score,
            'warnings': self.warnings
        }


class PrimerDesigner:
    """
    Designs PCR primers from conserved regions.

    Uses nearest-neighbor thermodynamic model for Tm calculation
    and includes multiple quality checks.
    """

    # Nearest-neighbor parameters (SantaLucia 1998)
    # Delta H (kcal/mol) and Delta S (cal/mol·K)
    NN_PARAMS = {
        'AA': (-7.9, -22.2), 'TT': (-7.9, -22.2),
        'AT': (-7.2, -20.4), 'TA': (-7.2, -21.3),
        'CA': (-8.5, -22.7), 'TG': (-8.5, -22.7),
        'GT': (-8.4, -22.4), 'AC': (-8.4, -22.4),
        'CT': (-7.8, -21.0), 'AG': (-7.8, -21.0),
        'GA': (-8.2, -22.2), 'TC': (-8.2, -22.2),
        'CG': (-10.6, -27.2), 'GC': (-9.8, -24.4),
        'GG': (-8.0, -19.9), 'CC': (-8.0, -19.9),
    }

    # Initiation parameters
    INIT_PARAMS = {
        'G': (0.1, -2.8), 'C': (0.1, -2.8),
        'A': (2.3, 4.1), 'T': (2.3, 4.1)
    }

    def __init__(
        self,
        primer_min_length: int = 18,
        primer_max_length: int = 25,
        primer_opt_length: int = 20,
        tm_min: float = 55.0,
        tm_max: float = 65.0,
        tm_opt: float = 60.0,
        gc_min: float = 40.0,
        gc_max: float = 60.0,
        na_conc: float = 50.0,  # mM
        primer_conc: float = 250.0,  # nM
        product_min_size: int = 100,
        product_max_size: int = 500,
    ):
        """
        Initialize primer designer with parameters.

        Args:
            primer_min_length: Minimum primer length
            primer_max_length: Maximum primer length
            primer_opt_length: Optimal primer length
            tm_min: Minimum melting temperature (C)
            tm_max: Maximum melting temperature (C)
            tm_opt: Optimal melting temperature (C)
            gc_min: Minimum GC content (%)
            gc_max: Maximum GC content (%)
            na_conc: Sodium concentration (mM)
            primer_conc: Primer concentration (nM)
            product_min_size: Minimum PCR product size
            product_max_size: Maximum PCR product size
        """
        self.primer_min_length = primer_min_length
        self.primer_max_length = primer_max_length
        self.primer_opt_length = primer_opt_length
        self.tm_min = tm_min
        self.tm_max = tm_max
        self.tm_opt = tm_opt
        self.gc_min = gc_min
        self.gc_max = gc_max
        self.na_conc = na_conc
        self.primer_conc = primer_conc
        self.product_min_size = product_min_size
        self.product_max_size = product_max_size

    def calculate_tm_nearest_neighbor(self, sequence: str) -> float:
        """
        Calculate melting temperature using nearest-neighbor method.

        Uses SantaLucia (1998) unified parameters.

        Args:
            sequence: Primer sequence

        Returns:
            Tm in Celsius
        """
        sequence = sequence.upper().replace('-', '')

        if len(sequence) < 2:
            return 0.0

        # Sum up enthalpy and entropy
        dH = 0.0  # kcal/mol
        dS = 0.0  # cal/mol·K

        # Add initiation
        dH += self.INIT_PARAMS.get(sequence[0], (0, 0))[0]
        dS += self.INIT_PARAMS.get(sequence[0], (0, 0))[1]
        dH += self.INIT_PARAMS.get(sequence[-1], (0, 0))[0]
        dS += self.INIT_PARAMS.get(sequence[-1], (0, 0))[1]

        # Add nearest-neighbor contributions
        for i in range(len(sequence) - 1):
            dinuc = sequence[i:i+2]
            if dinuc in self.NN_PARAMS:
                dH += self.NN_PARAMS[dinuc][0]
                dS += self.NN_PARAMS[dinuc][1]

        # Salt correction (SantaLucia 1998)
        dS += 0.368 * (len(sequence) - 1) * math.log(self.na_conc / 1000)

        # Convert primer concentration to M
        primer_conc_M = self.primer_conc * 1e-9

        # Calculate Tm
        # Tm = dH / (dS + R * ln(Ct/4))
        R = 1.987  # cal/mol·K
        if dS == 0:
            return 0.0

        tm = (dH * 1000) / (dS + R * math.log(primer_conc_M / 4)) - 273.15

        return tm

    def calculate_tm_basic(self, sequence: str) -> float:
        """
        Calculate Tm using basic formula (Wallace rule).
        Useful as a quick estimate.

        Args:
            sequence: Primer sequence

        Returns:
            Tm in Celsius
        """
        sequence = sequence.upper().replace('-', '')
        gc = sequence.count('G') + sequence.count('C')
        at = sequence.count('A') + sequence.count('T')

        if len(sequence) < 14:
            # Wallace rule for short oligos
            return 2 * at + 4 * gc
        else:
            # Modified for longer sequences
            return 64.9 + 41 * (gc - 16.4) / len(sequence)

    def calculate_gc_content(self, sequence: str) -> float:
        """Calculate GC content as percentage"""
        sequence = sequence.upper().replace('-', '')
        if not sequence:
            return 0.0
        gc = sequence.count('G') + sequence.count('C')
        return (gc / len(sequence)) * 100

    def check_self_complementarity(self, sequence: str) -> int:
        """
        Check for self-complementarity (potential self-dimer).

        Returns:
            Score (0 = no issue, higher = more problematic)
        """
        complement = {'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G'}
        sequence = sequence.upper()
        rev_comp = ''.join(complement.get(b, b) for b in reversed(sequence))

        # Check for complementary regions
        max_match = 0
        for i in range(len(sequence)):
            for j in range(len(sequence)):
                match = 0
                k = 0
                while i + k < len(sequence) and j + k < len(rev_comp):
                    if sequence[i + k] == rev_comp[j + k]:
                        match += 1
                        k += 1
                    else:
                        break
                max_match = max(max_match, match)

        return max_match

    def check_hairpin(self, sequence: str) -> int:
        """
        Check for potential hairpin structures.

        Returns:
            Score (0 = no issue, higher = more problematic)
        """
        complement = {'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G'}
        sequence = sequence.upper()

        max_stem = 0
        min_loop = 3  # Minimum loop size

        # Check all possible hairpin positions
        for i in range(len(sequence)):
            for j in range(i + min_loop + 2, len(sequence)):
                stem_length = 0
                left = i
                right = j

                while left < right - min_loop:
                    if complement.get(sequence[left]) == sequence[right]:
                        stem_length += 1
                        left += 1
                        right -= 1
                    else:
                        break

                max_stem = max(max_stem, stem_length)

        return max_stem

    def check_3prime_stability(self, sequence: str) -> Tuple[bool, str]:
        """
        Check 3' end stability (important for priming efficiency).

        Returns:
            Tuple of (is_stable, warning_message)
        """
        sequence = sequence.upper()

        if len(sequence) < 5:
            return True, ""

        last_5 = sequence[-5:]
        gc_count = last_5.count('G') + last_5.count('C')

        # Check for GC clamp (good: 1-2 GC at 3' end)
        last_2 = sequence[-2:]
        gc_clamp = last_2.count('G') + last_2.count('C')

        warnings = []

        if gc_count > 3:
            warnings.append("High GC content at 3' end may cause mispriming")

        if gc_clamp == 0:
            warnings.append("No GC clamp at 3' end")

        if last_5.count('G') >= 4 or last_5.count('C') >= 4:
            warnings.append("Poly-G or poly-C at 3' end")

        return len(warnings) == 0, "; ".join(warnings)

    def calculate_efficiency(self, primer: str, conservation: float) -> float:
        """
        Estimate PCR efficiency based on primer characteristics.

        Args:
            primer: Primer sequence
            conservation: Conservation score (0-1)

        Returns:
            Estimated efficiency (0-100%)
        """
        primer = primer.upper().replace('-', '')

        # Start with base efficiency
        efficiency = 100.0

        # Tm penalty
        tm = self.calculate_tm_nearest_neighbor(primer)
        if tm < self.tm_min:
            efficiency -= (self.tm_min - tm) * 2
        elif tm > self.tm_max:
            efficiency -= (tm - self.tm_max) * 2

        # GC content penalty
        gc = self.calculate_gc_content(primer)
        if gc < self.gc_min:
            efficiency -= (self.gc_min - gc) * 0.5
        elif gc > self.gc_max:
            efficiency -= (gc - self.gc_max) * 0.5

        # Length penalty
        length = len(primer)
        if length < self.primer_min_length:
            efficiency -= (self.primer_min_length - length) * 3
        elif length > self.primer_max_length:
            efficiency -= (length - self.primer_max_length) * 2

        # Self-complementarity penalty
        self_comp = self.check_self_complementarity(primer)
        if self_comp >= 4:
            efficiency -= (self_comp - 3) * 5

        # Hairpin penalty
        hairpin = self.check_hairpin(primer)
        if hairpin >= 3:
            efficiency -= (hairpin - 2) * 5

        # Conservation bonus/penalty
        efficiency *= conservation

        # 3' stability
        stable, _ = self.check_3prime_stability(primer)
        if not stable:
            efficiency -= 5

        return max(0, min(100, efficiency))

    def check_primer_dimer(self, primer1: str, primer2: str) -> int:
        """
        Check for potential primer dimer formation between two primers.

        Returns:
            Score (0 = no issue, higher = more problematic)
        """
        complement = {'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G'}

        primer1 = primer1.upper()
        primer2 = primer2.upper()
        rev_comp2 = ''.join(complement.get(b, b) for b in reversed(primer2))

        # Check 3' end complementarity (most critical)
        max_3prime_match = 0
        for offset in range(-len(primer1) + 1, len(primer2)):
            match = 0
            for i in range(min(len(primer1), len(primer2) - offset)):
                idx1 = len(primer1) - 1 - i
                idx2 = len(primer2) - 1 - offset - i
                if idx1 >= 0 and idx2 >= 0 and idx2 < len(rev_comp2):
                    if primer1[idx1] == rev_comp2[idx2]:
                        match += 1
                    else:
                        break
            max_3prime_match = max(max_3prime_match, match)

        return max_3prime_match

    def design_primers(
        self,
        conserved_regions: List[ConservedRegion],
        aligned_sequences: List[AlignedSequence],
        max_primers: int = 10
    ) -> List[Primer]:
        """
        Design primers from conserved regions.

        Args:
            conserved_regions: List of conserved regions from alignment
            aligned_sequences: Aligned sequences for reference
            max_primers: Maximum number of primers to return

        Returns:
            List of Primer objects, sorted by efficiency
        """
        primers = []

        for idx, region in enumerate(conserved_regions):
            # Get consensus sequence without gaps
            seq = region.consensus_sequence.replace('-', '')

            if len(seq) < self.primer_min_length:
                continue

            # Try different primer lengths
            for length in range(self.primer_min_length, min(len(seq) + 1, self.primer_max_length + 1)):
                # Forward primer
                for start in range(len(seq) - length + 1):
                    primer_seq = seq[start:start + length]

                    if 'N' in primer_seq.upper():
                        continue

                    tm = self.calculate_tm_nearest_neighbor(primer_seq)
                    gc = self.calculate_gc_content(primer_seq)

                    # Skip if outside acceptable ranges
                    if not (self.tm_min - 5 <= tm <= self.tm_max + 5):
                        continue
                    if not (self.gc_min - 10 <= gc <= self.gc_max + 10):
                        continue

                    efficiency = self.calculate_efficiency(primer_seq, region.conservation_score)
                    self_comp = self.check_self_complementarity(primer_seq)
                    hairpin = self.check_hairpin(primer_seq)
                    _, stability_warning = self.check_3prime_stability(primer_seq)

                    warnings = []
                    if tm < self.tm_min:
                        warnings.append(f"Low Tm ({tm:.1f}C)")
                    elif tm > self.tm_max:
                        warnings.append(f"High Tm ({tm:.1f}C)")
                    if gc < self.gc_min:
                        warnings.append(f"Low GC ({gc:.1f}%)")
                    elif gc > self.gc_max:
                        warnings.append(f"High GC ({gc:.1f}%)")
                    if self_comp >= 4:
                        warnings.append(f"Self-complementarity ({self_comp}bp)")
                    if hairpin >= 3:
                        warnings.append(f"Hairpin potential ({hairpin}bp)")
                    if stability_warning:
                        warnings.append(stability_warning)

                    primer = Primer(
                        sequence=primer_seq,
                        name=f"Primer_F{idx+1}_{start+1}",
                        direction='forward',
                        start_pos=region.start + start,
                        end_pos=region.start + start + length,
                        length=length,
                        tm=tm,
                        gc_content=gc,
                        efficiency=efficiency,
                        conservation_score=region.conservation_score,
                        self_complementarity=self_comp,
                        hairpin_score=hairpin,
                        warnings=warnings
                    )
                    primers.append(primer)

                    # Also create reverse complement
                    complement = {'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G'}
                    rev_comp = ''.join(complement.get(b, b) for b in reversed(primer_seq))

                    rev_tm = self.calculate_tm_nearest_neighbor(rev_comp)
                    rev_gc = self.calculate_gc_content(rev_comp)
                    rev_efficiency = self.calculate_efficiency(rev_comp, region.conservation_score)
                    rev_self_comp = self.check_self_complementarity(rev_comp)
                    rev_hairpin = self.check_hairpin(rev_comp)

                    rev_warnings = []
                    if rev_tm < self.tm_min:
                        rev_warnings.append(f"Low Tm ({rev_tm:.1f}C)")
                    elif rev_tm > self.tm_max:
                        rev_warnings.append(f"High Tm ({rev_tm:.1f}C)")

                    rev_primer = Primer(
                        sequence=rev_comp,
                        name=f"Primer_R{idx+1}_{start+1}",
                        direction='reverse',
                        start_pos=region.start + start,
                        end_pos=region.start + start + length,
                        length=length,
                        tm=rev_tm,
                        gc_content=rev_gc,
                        efficiency=rev_efficiency,
                        conservation_score=region.conservation_score,
                        self_complementarity=rev_self_comp,
                        hairpin_score=rev_hairpin,
                        warnings=rev_warnings
                    )
                    primers.append(rev_primer)

        # Sort by efficiency and return top candidates
        primers.sort(key=lambda p: p.efficiency, reverse=True)
        return primers[:max_primers * 2]  # Return both forward and reverse

    def design_primer_pairs(
        self,
        conserved_regions: List[ConservedRegion],
        aligned_sequences: List[AlignedSequence],
        max_pairs: int = 5
    ) -> List[PrimerPair]:
        """
        Design primer pairs from multiple conserved regions.

        Args:
            conserved_regions: List of conserved regions
            aligned_sequences: Aligned sequences
            max_pairs: Maximum pairs to return

        Returns:
            List of PrimerPair objects
        """
        # Get individual primers
        all_primers = self.design_primers(conserved_regions, aligned_sequences, max_primers=50)

        forward_primers = [p for p in all_primers if p.direction == 'forward']
        reverse_primers = [p for p in all_primers if p.direction == 'reverse']

        pairs = []

        for fwd in forward_primers:
            for rev in reverse_primers:
                # Check product size
                product_size = rev.start_pos - fwd.end_pos

                if not (self.product_min_size <= product_size <= self.product_max_size):
                    continue

                # Check Tm difference
                tm_diff = abs(fwd.tm - rev.tm)

                # Check primer dimer
                dimer_score = self.check_primer_dimer(fwd.sequence, rev.sequence)

                # Calculate pair efficiency
                pair_efficiency = (fwd.efficiency + rev.efficiency) / 2
                if tm_diff > 5:
                    pair_efficiency -= (tm_diff - 5) * 2
                if dimer_score >= 4:
                    pair_efficiency -= (dimer_score - 3) * 5

                warnings = []
                if tm_diff > 5:
                    warnings.append(f"Large Tm difference ({tm_diff:.1f}C)")
                if dimer_score >= 4:
                    warnings.append(f"Primer dimer potential ({dimer_score}bp)")

                pair = PrimerPair(
                    forward=fwd,
                    reverse=rev,
                    product_size=product_size,
                    pair_efficiency=pair_efficiency,
                    tm_difference=tm_diff,
                    dimer_score=dimer_score,
                    warnings=warnings
                )
                pairs.append(pair)

        # Sort by pair efficiency
        pairs.sort(key=lambda p: p.pair_efficiency, reverse=True)
        return pairs[:max_pairs]

    def format_results(
        self,
        primers: List[Primer] = None,
        pairs: List[PrimerPair] = None
    ) -> str:
        """Format results for display"""
        output = []

        if primers:
            output.append("=" * 70)
            output.append("INDIVIDUAL PRIMERS")
            output.append("=" * 70)

            for i, p in enumerate(primers, 1):
                output.append(f"\n{i}. {p.name} ({p.direction})")
                output.append(f"   Sequence:    5'-{p.sequence}-3'")
                output.append(f"   Length:      {p.length} bp")
                output.append(f"   Tm:          {p.tm:.1f} C")
                output.append(f"   GC Content:  {p.gc_content:.1f}%")
                output.append(f"   Efficiency:  {p.efficiency:.1f}%")
                output.append(f"   Conservation: {p.conservation_score*100:.1f}%")
                output.append(f"   Position:    {p.start_pos}-{p.end_pos}")
                if p.warnings:
                    output.append(f"   Warnings:    {'; '.join(p.warnings)}")

        if pairs:
            output.append("\n" + "=" * 70)
            output.append("PRIMER PAIRS")
            output.append("=" * 70)

            for i, pair in enumerate(pairs, 1):
                output.append(f"\n--- Pair {i} ---")
                output.append(f"Forward: 5'-{pair.forward.sequence}-3'")
                output.append(f"  Name: {pair.forward.name}")
                output.append(f"  Tm: {pair.forward.tm:.1f} C | GC: {pair.forward.gc_content:.1f}% | Efficiency: {pair.forward.efficiency:.1f}%")

                output.append(f"Reverse: 5'-{pair.reverse.sequence}-3'")
                output.append(f"  Name: {pair.reverse.name}")
                output.append(f"  Tm: {pair.reverse.tm:.1f} C | GC: {pair.reverse.gc_content:.1f}% | Efficiency: {pair.reverse.efficiency:.1f}%")

                output.append(f"\nProduct Size:    {pair.product_size} bp")
                output.append(f"Pair Efficiency: {pair.pair_efficiency:.1f}%")
                output.append(f"Tm Difference:   {pair.tm_difference:.1f} C")
                output.append(f"Annealing Temp:  {min(pair.forward.tm, pair.reverse.tm) - 5:.1f} C (recommended)")

                if pair.warnings:
                    output.append(f"Warnings:        {'; '.join(pair.warnings)}")

        return '\n'.join(output)


# Example usage
if __name__ == "__main__":
    from .aligner import ConservedRegion

    # Test with a sample conserved region
    test_region = ConservedRegion(
        start=0,
        end=30,
        length=30,
        conservation_score=0.95,
        consensus_sequence="ATGCGATCGATCGATCGATCGATCGATCGA",
        alignment_positions=list(range(30))
    )

    designer = PrimerDesigner()

    primers = designer.design_primers([test_region], [], max_primers=5)
    print(designer.format_results(primers=primers))
