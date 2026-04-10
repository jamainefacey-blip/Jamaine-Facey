import { searchGitHub } from '../../../utils/githubConnector';
import { normalise, extractSkill } from '../../../utils/skillExtractor';
import { routeCommand } from '../../../utils/skillRouter';
import { executeActions } from '../../../utils/executionEngine';

const MAX_INPUT_LENGTH = 200;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { input, allowWrite = false } = body || {};
  if (!input || typeof input !== 'string' || !input.trim()) {
    return res.status(400).json({ error: 'input required' });
  }

  const query = input.trim().slice(0, MAX_INPUT_LENGTH);

  // Step 1: Fetch + extract skills
  const { results, rateLimited } = await searchGitHub(query);

  const skills = [];
  for (const raw of results) {
    try { skills.push(extractSkill(normalise(raw))); }
    catch { /* skip */ }
  }

  // Step 2: Route to actions
  const skillTokens = skills.flatMap(s => [s.name, ...s.patterns]);
  const { actions } = routeCommand({ intent: query, skills: skillTokens });

  // Step 3: Execute actions
  const execution = await executeActions(actions, { allowWrite: allowWrite === true });

  return res.status(200).json({
    query,
    skillCount: skills.length,
    skills,
    actions,
    execution,
    rateLimited: rateLimited || false,
  });
}
