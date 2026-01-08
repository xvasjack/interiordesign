"""WebSocket handling for terminal sessions."""
from fastapi import WebSocket
from typing import Dict
import asyncio
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for terminal sessions."""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_processes: Dict[str, asyncio.subprocess.Process] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info(f"Terminal session {session_id} connected")

    def disconnect(self, session_id: str):
        """Handle WebSocket disconnection."""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        if session_id in self.session_processes:
            process = self.session_processes[session_id]
            if process.returncode is None:
                process.terminate()
            del self.session_processes[session_id]
        logger.info(f"Terminal session {session_id} disconnected")

    async def send_message(self, session_id: str, message: str):
        """Send a message to a specific session."""
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_text(message)

    async def broadcast(self, message: str):
        """Broadcast a message to all connected sessions."""
        for connection in self.active_connections.values():
            await connection.send_text(message)

    async def process_command(self, session_id: str, command: str):
        """
        Process a command from the terminal.
        In production, this would:
        1. Validate the command against allowed tools
        2. Execute in a sandboxed Docker container
        3. Stream output back to the terminal
        """
        websocket = self.active_connections.get(session_id)
        if not websocket:
            return

        # Parse command
        parts = command.strip().split()
        if not parts:
            return

        tool = parts[0]

        # List of allowed bioinformatics tools
        allowed_tools = {
            "fastqc", "trimmomatic", "unicycler", "spades",
            "quast", "checkm", "confindr", "abricate",
            "prokka", "mlst", "mob_suite", "platon",
            "snippy", "gubbins", "iqtree", "roary",
            "ls", "cd", "pwd", "cat", "head", "tail",
            "less", "grep", "wc", "help", "clear",
        }

        if tool not in allowed_tools:
            await websocket.send_text(
                f"\x1b[31mError: '{tool}' is not a recognized command.\x1b[0m\r\n"
                f"Type 'help' for available commands.\r\n"
            )
            return

        # Handle built-in commands
        if tool == "help":
            help_text = """
\x1b[1;33mAvailable Commands:\x1b[0m

\x1b[1;36mQuality Control:\x1b[0m
  fastqc       - Quality control for sequencing data
  trimmomatic  - Adapter trimming and quality filtering

\x1b[1;36mAssembly:\x1b[0m
  unicycler    - Hybrid genome assembly
  quast        - Assembly quality assessment

\x1b[1;36mContamination:\x1b[0m
  checkm       - Assess genome quality and contamination
  confindr     - Detect intra-species contamination

\x1b[1;36mAnnotation:\x1b[0m
  prokka       - Genome annotation
  abricate     - AMR/virulence gene screening

\x1b[1;36mTyping:\x1b[0m
  mlst         - Multi-locus sequence typing

\x1b[1;36mPlasmid Analysis:\x1b[0m
  mob_suite    - Plasmid typing and reconstruction
  platon       - Plasmid identification

\x1b[1;36mPhylogeny:\x1b[0m
  snippy       - Variant calling
  gubbins      - Recombination detection
  iqtree       - Phylogenetic tree construction
  roary        - Pan-genome analysis

\x1b[1;36mUtilities:\x1b[0m
  ls, cd, pwd, cat, head, tail, grep, wc

"""
            await websocket.send_text(help_text)
            return

        if tool == "clear":
            await websocket.send_text("\x1b[2J\x1b[H")
            return

        # For bioinformatics tools, simulate execution
        # In production, this would run in Docker
        await websocket.send_text(
            f"\x1b[36mExecuting: {command}\x1b[0m\r\n"
            f"\x1b[90m[Connecting to analysis backend...]\x1b[0m\r\n"
        )

        # TODO: Execute command in Docker container and stream output
        # For now, send a placeholder response
        await asyncio.sleep(0.5)
        await websocket.send_text(
            f"\x1b[33m[Demo mode] Command would execute in sandboxed environment\x1b[0m\r\n"
        )
