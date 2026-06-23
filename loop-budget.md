# Loop Budget Limits

This file defines the hard budget limits and cost ceilings enforced by the loop execution runner.

## Core Limits

| Parameter | Value | Description |
|---|---|---|
| **Max Cost Daily ($)** | 5.00 | Hard spend ceiling per 24 hours |
| **Max Tokens Daily** | 10000000 | Token limit per 24 hours |
| **Max Attempts Per Task** | 3 | Hard retry ceiling for loop iterations |
| **Warning Threshold (%)** | 80 | Triggers warning notification |

## Enforcement Policies

1. **Pre-flight Checks:** The orchestrator reads these limits and checks historical spend logs *before* invoking any LLM operations.
2. **Hard Block:** If spend is ≥ 100% of limits, the runner exits immediately with exit code 1.
3. **Escalation Warning:** If spend is ≥ 80%, the runner logs a warning and triggers a system notification.
