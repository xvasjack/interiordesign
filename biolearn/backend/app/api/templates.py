"""Template content API endpoints."""
from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from typing import Optional

from ..services.template_loader import (
    get_file_content,
    get_terminal_output,
    get_tool_config,
    get_tool_files,
    get_summary,
    get_chart_data,
    get_all_tools,
    list_storylines,
    load_manifest,
)

router = APIRouter()


class ToolInfo(BaseModel):
    """Tool information from manifest."""
    name: str
    execution_time: float
    files: list[str]
    summary: Optional[dict] = None
    chart_data: Optional[dict] = None


class StorylineInfo(BaseModel):
    """Storyline information."""
    id: str
    title: str
    description: str
    tools: list[str]


@router.get("/storylines")
async def get_storylines() -> list[StorylineInfo]:
    """List all available storylines."""
    storylines = []
    for storyline_id in list_storylines():
        manifest = load_manifest(storyline_id)
        if manifest:
            storylines.append(StorylineInfo(
                id=storyline_id,
                title=manifest.get("title", storyline_id),
                description=manifest.get("description", ""),
                tools=get_all_tools(storyline_id),
            ))
    return storylines


@router.get("/storylines/{storyline_id}/tools")
async def get_tools(storyline_id: str) -> list[ToolInfo]:
    """Get all tools for a storyline."""
    tools = get_all_tools(storyline_id)
    if not tools:
        raise HTTPException(status_code=404, detail=f"Storyline '{storyline_id}' not found")

    result = []
    for tool_name in tools:
        config = get_tool_config(storyline_id, tool_name)
        if config:
            result.append(ToolInfo(
                name=tool_name,
                execution_time=config.get("execution_time", 10),
                files=config.get("files", []),
                summary=config.get("summary"),
                chart_data=config.get("chart_data"),
            ))
    return result


@router.get("/storylines/{storyline_id}/tools/{tool_name}")
async def get_tool(storyline_id: str, tool_name: str) -> ToolInfo:
    """Get tool information."""
    config = get_tool_config(storyline_id, tool_name)
    if not config:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found in storyline '{storyline_id}'")

    return ToolInfo(
        name=tool_name,
        execution_time=config.get("execution_time", 10),
        files=config.get("files", []),
        summary=config.get("summary"),
        chart_data=config.get("chart_data"),
    )


@router.get("/storylines/{storyline_id}/tools/{tool_name}/terminal", response_class=PlainTextResponse)
async def get_tool_terminal(storyline_id: str, tool_name: str) -> str:
    """Get terminal output for a tool."""
    output = get_terminal_output(storyline_id, tool_name)
    if not output:
        raise HTTPException(status_code=404, detail=f"Terminal output not found for '{tool_name}'")
    return output


@router.get("/storylines/{storyline_id}/files/{filename:path}", response_class=PlainTextResponse)
async def get_file(storyline_id: str, filename: str) -> str:
    """Get output file content."""
    content = get_file_content(storyline_id, filename)
    if not content:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found")
    return content


@router.get("/storylines/{storyline_id}/tools/{tool_name}/files")
async def get_tool_file_list(storyline_id: str, tool_name: str) -> list[str]:
    """Get list of output files for a tool."""
    files = get_tool_files(storyline_id, tool_name)
    if not files:
        config = get_tool_config(storyline_id, tool_name)
        if not config:
            raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")
    return files


@router.get("/storylines/{storyline_id}/tools/{tool_name}/summary")
async def get_tool_summary(storyline_id: str, tool_name: str) -> dict:
    """Get summary statistics for a tool."""
    summary = get_summary(storyline_id, tool_name)
    if summary is None:
        config = get_tool_config(storyline_id, tool_name)
        if not config:
            raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")
        return {}
    return summary
