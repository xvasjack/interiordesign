"""
Primer Design Tool

A comprehensive tool for designing primers across multiple species:
- Retrieves sequences from NCBI and EMBL-EBI databases
- Aligns sequences using MAFFT/MUSCLE
- Identifies conserved regions for primer design
- Calculates primer efficiency and annealing temperature
"""

__version__ = "1.0.0"
__author__ = "BioLearn"

from .sequence_fetcher import SequenceFetcher
from .aligner import SequenceAligner
from .primer_designer import PrimerDesigner

__all__ = ["SequenceFetcher", "SequenceAligner", "PrimerDesigner"]
