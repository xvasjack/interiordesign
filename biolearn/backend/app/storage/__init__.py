"""
Pre-computed analysis results storage.

This module handles the proxy architecture where:
1. Admin provides real analysis outputs in template/storylines/{id}/
2. Results (terminal output, files, charts) are loaded from templates
3. Users receive template results when they type commands

No actual bioinformatics tools run per user - just playback of stored results.
"""
from pydantic import BaseModel
from typing import Optional

from ..services.template_loader import (
    get_terminal_output,
    get_tool_files,
    get_execution_time,
    get_summary,
    get_chart_data,
    get_tool_config,
)


class CommandOutput(BaseModel):
    """Stored output for a command."""
    command: str  # The command user types
    terminal_output: str  # What appears in terminal
    execution_time: float  # Simulated execution time in seconds
    files_generated: list[str] = []  # List of output files
    chart_data: Optional[dict] = None  # Data for Plotly charts
    summary: Optional[dict] = None  # Summary statistics


def get_command_output(storyline_id: str, tool_name: str, command: str) -> Optional[CommandOutput]:
    """
    Get the pre-computed output for a specific command.

    Args:
        storyline_id: The storyline being played (e.g., 'hospital-outbreak')
        tool_name: The tool being executed (e.g., 'fastqc', 'unicycler')
        command: The command user typed

    Returns:
        CommandOutput if found, None otherwise
    """
    # Check if tool exists in manifest
    tool_config = get_tool_config(storyline_id, tool_name)
    if not tool_config:
        return None

    # Load terminal output from template
    terminal_output = get_terminal_output(storyline_id, tool_name)
    if not terminal_output:
        terminal_output = f"[Output for {tool_name} not found in template]"

    return CommandOutput(
        command=command,
        terminal_output=terminal_output,
        execution_time=get_execution_time(storyline_id, tool_name),
        files_generated=get_tool_files(storyline_id, tool_name),
        chart_data=get_chart_data(storyline_id, tool_name),
        summary=get_summary(storyline_id, tool_name),
    )


def extract_tool_from_command(command: str) -> Optional[str]:
    """
    Extract the tool name from a command string.

    Args:
        command: The full command string

    Returns:
        Tool name or None if not recognized
    """
    if not command:
        return None

    # Get the first word (the tool name)
    parts = command.strip().split()
    if not parts:
        return None

    tool = parts[0]

    # Handle special cases
    tool_mappings = {
        'run_gubbins.py': 'gubbins',
        'run_gubbins': 'gubbins',
    }

    return tool_mappings.get(tool, tool)
