"""OpenTelemetry setup for ms2-speech-agent."""
import logging
import os
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from fastapi import FastAPI

try:
    from app.config import settings
except ImportError:
    # Fallback for direct script execution outside package
    from config import settings  # type: ignore[no-redef]

logger = logging.getLogger(__name__)


def init_otel(app: "FastAPI") -> None:
    """Initialize OpenTelemetry tracing for the FastAPI app.

    Supports both local Jaeger/Alloy collectors and Grafana Cloud OTLP gateway.
    Authentication headers (e.g., Grafana Cloud Basic Auth) are read from the
    OTEL_EXPORTER_OTLP_HEADERS environment variable automatically.
    """
    endpoint = settings.otel_exporter_otlp_endpoint
    if not endpoint or endpoint == "http://localhost:4318":
        # Only skip if no real endpoint configured
        if not os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT"):
            logger.info("OpenTelemetry: No endpoint configured, tracing disabled")
            return

    try:
        from opentelemetry import trace  # type: ignore[import-untyped]
        from opentelemetry.sdk.trace import TracerProvider  # type: ignore[import-untyped]
        from opentelemetry.sdk.trace.export import BatchSpanProcessor  # type: ignore[import-untyped]
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter  # type: ignore[import-untyped]
        from opentelemetry.sdk.resources import Resource  # type: ignore[import-untyped]
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor  # type: ignore[import-untyped]

        # Resource attributes — service.name is required by Grafana Cloud
        resource = Resource.create({
            "service.name": settings.otel_service_name,
            "service.version": "1.0.0",
            "deployment.environment": os.environ.get("NODE_ENV", "development"),
        })

        provider = TracerProvider(resource=resource)

        # Build exporter — headers for Grafana Cloud Basic Auth are picked up
        # automatically from OTEL_EXPORTER_OTLP_HEADERS env var by the SDK,
        # but we also support explicit env override for the endpoint.
        otlp_endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", endpoint)
        traces_url = f"{otlp_endpoint.rstrip('/')}/v1/traces"

        # Parse optional headers from env (format: "key=value,key2=value2")
        headers: dict[str, str] = {}
        raw_headers = os.environ.get("OTEL_EXPORTER_OTLP_HEADERS", "")
        if raw_headers:
            for pair in raw_headers.split(","):
                if "=" in pair:
                    k, v = pair.split("=", 1)
                    headers[k.strip()] = v.strip()

        exporter = OTLPSpanExporter(
            endpoint=traces_url,
            headers=headers if headers else None,
        )
        provider.add_span_processor(BatchSpanProcessor(exporter))
        trace.set_tracer_provider(provider)

        FastAPIInstrumentor.instrument_app(app)

        logger.info(
            "OpenTelemetry: Tracing enabled → %s (service=%s)",
            otlp_endpoint,
            settings.otel_service_name,
        )

    except ImportError:
        logger.warning("OpenTelemetry: Dependencies not installed, tracing disabled")
    except Exception as exc:
        logger.warning("OpenTelemetry: Failed to initialize: %s", exc)
