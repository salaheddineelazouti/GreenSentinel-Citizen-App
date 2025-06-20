"""
Logging configuration for the worker service.
Uses structlog for structured JSON logging.
"""
import logging
import sys
from typing import Any, Callable, Dict, List, Optional, Union

import structlog
from structlog.types import EventDict, Processor


def configure_logging() -> None:
    """Configure logging for the worker service."""
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        logger_factory=structlog.PrintLoggerFactory(),
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.BoundLogger:
    """
    Get a structlog logger instance for the given name.
    
    Args:
        name: The name of the logger
        
    Returns:
        A bound structlog logger
    """
    return structlog.get_logger(name)
