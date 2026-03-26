// engine/executor/index.ts — Claude API executor
// Uses claude-opus-4-6 with adaptive thinking + streaming.

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { ENGINE_CONFIG, ROOT } from '../config';
import { log } from '../logger';
import type { Task } from '../types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an autonomous code execution agent operating inside the PAIN SYSTEM repository.

RULES:
1. You receive a task with a description and allowed file scope.
2. You MUST only modify files within the declared scope.
3. You MUST produce working, verified code. No placeholders.
4. After your changes, respond with a JSON block (last thing in your response) in this exact format:
\`\`\`json
{
  "filesChanged": ["path/to/file.ts"],
  "summary": "One sentence describing what was done.",
  "status": "complete" | "blocked",
  "blockReason": "only if blocked"
}
\`\`\`
5. Do not narrate. Write code.
6. Respect the lane. Do not modify files outside scope.
`;

export interface ExecutorOutput {
  filesChanged: string[];
  summary: string;
  status: 'complete' | 'blocked';
  blockReason?: string;
  rawOutput: string;
}

function parseExecutorJson(raw: string): Pick<ExecutorOutput, 'filesChanged' | 'summary' | 'status' | 'blockReason'> {
  const match = raw.match(/```json\s*([\s\S]*?)```/);
  if (!match) {
    return {
      filesChanged: [],
      summary: 'No JSON block found in output.',
      status: 'blocked',
      blockReason: 'Executor did not produce a JSON result block.',
    };
  }
  try {
    const parsed = JSON.parse(match[1]) as {
      filesChanged?: string[];
      summary?: string;
      status?: string;
      blockReason?: string;
    };
    return {
      filesChanged: parsed.filesChanged ?? [],
      summary: parsed.summary ?? '',
      status: parsed.status === 'blocked' ? 'blocked' : 'complete',
      blockReason: parsed.blockReason,
    };
  } catch {
    return {
      filesChanged: [],
      summary: 'JSON parse error.',
      status: 'blocked',
      blockReason: 'Could not parse executor JSON block.',
    };
  }
}

function buildTaskPrompt(task: Task): string {
  const scopeStr = task.scope.join(', ');
  const repoContext = buildRepoContext(task.scope);
  return `TASK ID: ${task.id}
LANE: ${task.lane}
DESCRIPTION: ${task.description}
ALLOWED FILE SCOPE: ${scopeStr}

CURRENT FILE CONTENTS:
${repoContext}

Execute the task. Modify files as needed within the allowed scope. End your response with the JSON result block.`;
}

function buildRepoContext(scope: string[]): string {
  const lines: string[] = [];
  for (const pattern of scope) {
    // Simple: if pattern has no glob chars, treat as direct file path
    if (!pattern.includes('*')) {
      const fp = path.join(ROOT, pattern);
      if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
        try {
          const content = fs.readFileSync(fp, 'utf8');
          lines.push(`\n--- ${pattern} ---\n${content}`);
        } catch {
          lines.push(`\n--- ${pattern} --- [UNREADABLE]`);
        }
      } else {
        lines.push(`\n--- ${pattern} --- [NOT FOUND]`);
      }
    }
    // Glob patterns are informational only — Claude knows the scope
  }
  return lines.join('\n') || '(no existing files in scope)';
}

export async function executeTask(task: Task): Promise<ExecutorOutput> {
  log('INFO', `Executor: starting task ${task.id}`, { lane: task.lane });

  const prompt = buildTaskPrompt(task);
  let rawOutput = '';

  const stream = await client.messages.stream({
    model: ENGINE_CONFIG.model,
    max_tokens: ENGINE_CONFIG.maxTokens,
    thinking: { type: 'adaptive' },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      rawOutput += event.delta.text;
    }
  }

  const parsed = parseExecutorJson(rawOutput);
  log('INFO', `Executor: task ${task.id} ${parsed.status}`, { files: parsed.filesChanged });

  return { ...parsed, rawOutput };
}
