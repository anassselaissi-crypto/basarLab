# Basar / Abstra Agent 3 SimulationConfig v1

Agent 3 is a real-time simulation backend, not an LLM.

## Runtime flow

Abstra Engine / Memory Core produces:

```ts
SimulationConfig
```

Agent 3 consumes it:

```txt
SimulationConfig -> frames + metrics
```

The React viewer can receive the same config via:

1. `initialConfig` prop
2. `externalConfig` prop
3. `window.postMessage({ type: "ABSTRA_SIMULATION_CONFIG", requestId, config })`

The viewer responds with:

```js
window.postMessage({
  type: "ABSTRA_SIMULATION_CONFIG_APPLIED",
  requestId,
  config: normalizedConfig
}, "*")
```

Telemetry is emitted through the `onTelemetry(telemetry)` prop.

## Files

- `basar.simulation-config.v1.schema.json`: official JSON schema.
- `basar.simulation-config.v1.example.json`: example config.
- `BasarLab_Pro.v2.2.simulation_config.jsx`: React viewer with config adapter.
