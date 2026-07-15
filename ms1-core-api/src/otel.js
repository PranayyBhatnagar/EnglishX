/**
 * OpenTelemetry setup for ms1-core-api.
 * Traces the full request lifecycle and propagates context to ms2.
 */
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');
const config = require('./config');

let sdk;

function initOtel() {
  if (!config.otel.endpoint) {
    console.log('OpenTelemetry: No endpoint configured, tracing disabled');
    return;
  }

  try {
    // Parse optional headers (format: "key=value,key2=value2")
    const headers = {};
    if (config.otel.headers) {
      config.otel.headers.split(',').forEach((pair) => {
        const idx = pair.indexOf('=');
        if (idx !== -1) {
          headers[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
        }
      });
    }

    const exporter = new OTLPTraceExporter({
      url: `${config.otel.endpoint}/v1/traces`,
      headers,
    });

    sdk = new NodeSDK({
      resource: new Resource({
        [ATTR_SERVICE_NAME]: config.otel.serviceName,
      }),
      traceExporter: exporter,
      instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();
    console.log(`OpenTelemetry: Tracing enabled → ${config.otel.endpoint}`);
  } catch (err) {
    console.warn('OpenTelemetry: Failed to initialize:', err.message);
  }
}

module.exports = { initOtel };
