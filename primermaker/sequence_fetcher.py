"""
Sequence Fetcher Module

Retrieves FASTA sequences from NCBI and EMBL-EBI databases
for different species with specific genomic regions.
"""

import os
import sys
import time
import urllib.request
import urllib.parse
import urllib.error
import xml.etree.ElementTree as ET
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import json
import re


@dataclass
class SequenceRecord:
    """Container for sequence data"""
    accession: str
    organism: str
    description: str
    sequence: str
    source: str  # 'ncbi' or 'embl'
    region: Optional[str] = None

    def to_fasta(self) -> str:
        """Convert to FASTA format string"""
        header = f">{self.accession} {self.organism} {self.description}"
        if self.region:
            header += f" [{self.region}]"
        # Wrap sequence at 70 characters
        wrapped_seq = '\n'.join(
            self.sequence[i:i+70] for i in range(0, len(self.sequence), 70)
        )
        return f"{header}\n{wrapped_seq}"


class SequenceFetcher:
    """
    Fetches sequences from NCBI and EMBL-EBI databases.

    Supports:
    - NCBI E-utilities API for GenBank/RefSeq sequences
    - EMBL-EBI REST API for ENA sequences
    """

    NCBI_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
    EMBL_BASE_URL = "https://www.ebi.ac.uk/ena/browser/api"

    def __init__(self, email: str = "user@example.com", api_key: Optional[str] = None):
        """
        Initialize the fetcher.

        Args:
            email: Email for NCBI API (required for high-volume queries)
            api_key: Optional NCBI API key for higher rate limits
        """
        self.email = email
        self.api_key = api_key
        self.request_delay = 0.34 if api_key else 0.4  # NCBI rate limiting
        self._last_request_time = 0

    def _rate_limit(self):
        """Ensure we don't exceed API rate limits"""
        elapsed = time.time() - self._last_request_time
        if elapsed < self.request_delay:
            time.sleep(self.request_delay - elapsed)
        self._last_request_time = time.time()

    def _make_request(self, url: str, retries: int = 3) -> str:
        """Make HTTP request with retry logic"""
        for attempt in range(retries):
            try:
                self._rate_limit()
                req = urllib.request.Request(
                    url,
                    headers={'User-Agent': 'PrimerDesignTool/1.0'}
                )
                with urllib.request.urlopen(req, timeout=30) as response:
                    return response.read().decode('utf-8')
            except urllib.error.HTTPError as e:
                if e.code == 429 or e.code >= 500:
                    wait_time = 2 ** attempt
                    print(f"Request failed (attempt {attempt + 1}), retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    raise
            except urllib.error.URLError as e:
                if attempt < retries - 1:
                    wait_time = 2 ** attempt
                    print(f"Network error (attempt {attempt + 1}), retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    raise
        raise Exception(f"Failed to fetch URL after {retries} attempts: {url}")

    # ==================== NCBI Methods ====================

    def search_ncbi(
        self,
        organism: str,
        gene: Optional[str] = None,
        region: Optional[str] = None,
        max_results: int = 10,
        database: str = "nucleotide"
    ) -> List[str]:
        """
        Search NCBI for sequence accessions.

        Args:
            organism: Organism name (e.g., "Escherichia coli")
            gene: Gene name to search for (e.g., "16S rRNA")
            region: Genomic region (e.g., "ITS", "matK", "rbcL")
            max_results: Maximum number of results to return
            database: NCBI database to search (nucleotide, gene, etc.)

        Returns:
            List of accession IDs
        """
        # Build search query
        query_parts = [f'"{organism}"[Organism]']

        if gene:
            query_parts.append(f'"{gene}"[Gene Name]')
        if region:
            query_parts.append(f'"{region}"[Title]')

        query = " AND ".join(query_parts)

        # ESearch request
        params = {
            'db': database,
            'term': query,
            'retmax': max_results,
            'retmode': 'json',
            'email': self.email,
            'usehistory': 'y'
        }
        if self.api_key:
            params['api_key'] = self.api_key

        url = f"{self.NCBI_BASE_URL}/esearch.fcgi?{urllib.parse.urlencode(params)}"

        try:
            response = self._make_request(url)
            data = json.loads(response)

            if 'esearchresult' in data and 'idlist' in data['esearchresult']:
                return data['esearchresult']['idlist']
            return []
        except Exception as e:
            print(f"NCBI search error: {e}")
            return []

    def fetch_ncbi_sequences(
        self,
        accession_ids: List[str],
        database: str = "nucleotide",
        start: Optional[int] = None,
        stop: Optional[int] = None
    ) -> List[SequenceRecord]:
        """
        Fetch sequences from NCBI by accession IDs.

        Args:
            accession_ids: List of NCBI accession IDs
            database: NCBI database
            start: Start position (1-based, optional)
            stop: Stop position (1-based, optional)

        Returns:
            List of SequenceRecord objects
        """
        if not accession_ids:
            return []

        records = []

        # Fetch in batches of 10
        batch_size = 10
        for i in range(0, len(accession_ids), batch_size):
            batch = accession_ids[i:i+batch_size]

            params = {
                'db': database,
                'id': ','.join(batch),
                'rettype': 'fasta',
                'retmode': 'text',
                'email': self.email
            }

            # Add sequence range if specified
            if start is not None and stop is not None:
                params['seq_start'] = start
                params['seq_stop'] = stop

            if self.api_key:
                params['api_key'] = self.api_key

            url = f"{self.NCBI_BASE_URL}/efetch.fcgi?{urllib.parse.urlencode(params)}"

            try:
                response = self._make_request(url)
                records.extend(self._parse_fasta(response, source='ncbi'))
            except Exception as e:
                print(f"Error fetching NCBI sequences: {e}")

        return records

    def fetch_ncbi_by_organism(
        self,
        organism: str,
        gene: Optional[str] = None,
        region: Optional[str] = None,
        max_sequences: int = 10,
        start: Optional[int] = None,
        stop: Optional[int] = None
    ) -> List[SequenceRecord]:
        """
        Search and fetch sequences from NCBI in one step.

        Args:
            organism: Organism name
            gene: Gene name (optional)
            region: Genomic region (optional)
            max_sequences: Maximum sequences to retrieve
            start: Start position (1-based, optional)
            stop: Stop position (1-based, optional)

        Returns:
            List of SequenceRecord objects
        """
        print(f"Searching NCBI for {organism}...")
        accessions = self.search_ncbi(organism, gene, region, max_sequences)

        if not accessions:
            print(f"No sequences found in NCBI for {organism}")
            return []

        print(f"Found {len(accessions)} sequences, fetching...")
        return self.fetch_ncbi_sequences(accessions, start=start, stop=stop)

    # ==================== EMBL-EBI Methods ====================

    def search_embl(
        self,
        organism: str,
        gene: Optional[str] = None,
        region: Optional[str] = None,
        max_results: int = 10
    ) -> List[str]:
        """
        Search EMBL-EBI ENA for sequence accessions.

        Args:
            organism: Organism name
            gene: Gene name (optional)
            region: Genomic region (optional)
            max_results: Maximum results to return

        Returns:
            List of accession IDs
        """
        # Build search query for ENA
        query_parts = [f'tax_name("{organism}")']

        if gene:
            query_parts.append(f'gene="{gene}"')
        if region:
            query_parts.append(f'description="*{region}*"')

        query = " AND ".join(query_parts)

        params = {
            'query': query,
            'result': 'sequence',
            'fields': 'accession',
            'limit': max_results,
            'format': 'json'
        }

        url = f"https://www.ebi.ac.uk/ena/portal/api/search?{urllib.parse.urlencode(params)}"

        try:
            response = self._make_request(url)
            data = json.loads(response)
            return [item['accession'] for item in data if 'accession' in item]
        except Exception as e:
            print(f"EMBL-EBI search error: {e}")
            return []

    def fetch_embl_sequences(
        self,
        accession_ids: List[str],
        start: Optional[int] = None,
        stop: Optional[int] = None
    ) -> List[SequenceRecord]:
        """
        Fetch sequences from EMBL-EBI by accession IDs.

        Args:
            accession_ids: List of ENA accession IDs
            start: Start position (optional)
            stop: Stop position (optional)

        Returns:
            List of SequenceRecord objects
        """
        if not accession_ids:
            return []

        records = []

        for acc in accession_ids:
            # Use ENA browser API for FASTA retrieval
            url = f"{self.EMBL_BASE_URL}/fasta/{acc}"

            # Add range if specified
            if start is not None and stop is not None:
                url += f"?range={start}-{stop}"

            try:
                response = self._make_request(url)
                fetched = self._parse_fasta(response, source='embl')
                records.extend(fetched)
            except Exception as e:
                print(f"Error fetching {acc} from EMBL-EBI: {e}")

        return records

    def fetch_embl_by_organism(
        self,
        organism: str,
        gene: Optional[str] = None,
        region: Optional[str] = None,
        max_sequences: int = 10,
        start: Optional[int] = None,
        stop: Optional[int] = None
    ) -> List[SequenceRecord]:
        """
        Search and fetch sequences from EMBL-EBI in one step.

        Args:
            organism: Organism name
            gene: Gene name (optional)
            region: Genomic region (optional)
            max_sequences: Maximum sequences to retrieve
            start: Start position (optional)
            stop: Stop position (optional)

        Returns:
            List of SequenceRecord objects
        """
        print(f"Searching EMBL-EBI for {organism}...")
        accessions = self.search_embl(organism, gene, region, max_sequences)

        if not accessions:
            print(f"No sequences found in EMBL-EBI for {organism}")
            return []

        print(f"Found {len(accessions)} sequences, fetching...")
        return self.fetch_embl_sequences(accessions, start=start, stop=stop)

    # ==================== Combined Methods ====================

    def fetch_from_all_databases(
        self,
        organisms: List[str],
        gene: Optional[str] = None,
        region: Optional[str] = None,
        max_per_organism: int = 5,
        start: Optional[int] = None,
        stop: Optional[int] = None,
        databases: List[str] = None
    ) -> List[SequenceRecord]:
        """
        Fetch sequences from multiple databases for multiple organisms.

        Args:
            organisms: List of organism names
            gene: Gene name (optional)
            region: Genomic region (optional)
            max_per_organism: Max sequences per organism per database
            start: Start position (optional)
            stop: Stop position (optional)
            databases: List of databases to query ('ncbi', 'embl', or both)

        Returns:
            Combined list of SequenceRecord objects
        """
        if databases is None:
            databases = ['ncbi', 'embl']

        all_records = []

        for organism in organisms:
            print(f"\n{'='*50}")
            print(f"Fetching sequences for: {organism}")
            print('='*50)

            if 'ncbi' in databases:
                ncbi_records = self.fetch_ncbi_by_organism(
                    organism, gene, region, max_per_organism, start, stop
                )
                all_records.extend(ncbi_records)
                print(f"  NCBI: Retrieved {len(ncbi_records)} sequences")

            if 'embl' in databases:
                embl_records = self.fetch_embl_by_organism(
                    organism, gene, region, max_per_organism, start, stop
                )
                all_records.extend(embl_records)
                print(f"  EMBL-EBI: Retrieved {len(embl_records)} sequences")

        return all_records

    def _parse_fasta(self, fasta_text: str, source: str) -> List[SequenceRecord]:
        """Parse FASTA format text into SequenceRecord objects"""
        records = []
        current_header = None
        current_seq = []

        for line in fasta_text.strip().split('\n'):
            line = line.strip()
            if not line:
                continue

            if line.startswith('>'):
                # Save previous record
                if current_header and current_seq:
                    record = self._parse_header(current_header, ''.join(current_seq), source)
                    if record:
                        records.append(record)

                current_header = line[1:]  # Remove '>'
                current_seq = []
            else:
                current_seq.append(line)

        # Don't forget the last record
        if current_header and current_seq:
            record = self._parse_header(current_header, ''.join(current_seq), source)
            if record:
                records.append(record)

        return records

    def _parse_header(self, header: str, sequence: str, source: str) -> Optional[SequenceRecord]:
        """Parse FASTA header and create SequenceRecord"""
        if not sequence:
            return None

        # Extract accession (first word)
        parts = header.split()
        accession = parts[0] if parts else "unknown"

        # Try to extract organism name from header
        organism = "Unknown"
        description = header

        # Common patterns for organism extraction
        # Pattern: [organism name]
        bracket_match = re.search(r'\[([^\]]+)\]', header)
        if bracket_match:
            organism = bracket_match.group(1)

        # Pattern: organism="name" or /organism="name"
        org_match = re.search(r'organism[=:]["\']*([^"\'\]]+)', header, re.IGNORECASE)
        if org_match:
            organism = org_match.group(1)

        return SequenceRecord(
            accession=accession,
            organism=organism,
            description=description,
            sequence=sequence.upper().replace(' ', ''),
            source=source
        )

    def save_to_fasta(self, records: List[SequenceRecord], output_path: str):
        """Save sequences to a FASTA file"""
        with open(output_path, 'w') as f:
            for record in records:
                f.write(record.to_fasta() + '\n')
        print(f"Saved {len(records)} sequences to {output_path}")


# Example usage and testing
if __name__ == "__main__":
    fetcher = SequenceFetcher(email="test@example.com")

    # Example: Fetch 16S rRNA sequences from E. coli
    print("Testing NCBI search...")
    results = fetcher.search_ncbi("Escherichia coli", gene="16S", max_results=3)
    print(f"Found accessions: {results}")

    if results:
        print("\nFetching sequences...")
        seqs = fetcher.fetch_ncbi_sequences(results[:2])
        for seq in seqs:
            print(f"  {seq.accession}: {len(seq.sequence)} bp")
