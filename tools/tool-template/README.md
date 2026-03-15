# Pain System Tool Template

This folder acts as the **blueprint for all future Pain System tools**.

When creating a new tool in this sandbox repository, copy this folder and follow the structure below:

## Required Files

| File | Purpose |
|------|---------|
| `tool.config.json` | Declares the tool name, endpoint path, version, and description |
| `handler.ts` | Netlify Edge Function that handles requests to the tool's endpoint |
| `README.md` | Documents what the tool does, its endpoint, and expected response |

## Steps to Create a New Tool

1. Duplicate the `tool-template` folder and rename it to your tool name (e.g. `tools/my-tool`).
2. Update `tool.config.json` with the correct name, endpoint, and description.
3. Implement your logic in `handler.ts`, returning the appropriate JSON response.
4. Add a `README.md` describing the tool's purpose.
5. Register the new tool in the root `MODULE_REGISTRY.md` under **Example Sandbox Tools**.

## Standard Response Shape

All Pain System tools should return a JSON response that includes at minimum:

```json
{
  "tool": "<tool-name>",
  "status": "active"
}
```
