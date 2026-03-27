/**
 * roles.ts — PC-ROLE-01
 * Role + permission model for Pain Control.
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Types ──────────────────────────────────────────────────────────────────

export type Role = 'founder' | 'system' | 'external_input' | 'client_workspace';

export interface Permission {
  action:   string;
  allowed:  Role[];
  denied:   Role[];
  note?:    string;
}

export interface RoleModel {
  version:     number;
  createdAt:   string;
  roles:       Record<Role, RoleDefinition>;
  permissions: Permission[];
}

export interface RoleDefinition {
  role:        Role;
  description: string;
  trustLevel:  number;  // 0=untrusted, 1=low, 2=medium, 3=high, 4=absolute
  canOverridePolicy:    boolean;
  canAccessClientData:  boolean;
  canTriggerDeploy:     boolean;
  canModifyCanon:       boolean;
  canUnlockFullAuto:    boolean;
}

// ── Role model ────────────────────────────────────────────────────────────

export const ROLE_MODEL: RoleModel = {
  version:   1,
  createdAt: '2026-03-27T00:00:00.000Z',
  roles: {
    founder: {
      role:                 'founder',
      description:          'Jamaine Facey — absolute authority. Can override any policy, approve deploys, unlock emergency modes.',
      trustLevel:           4,
      canOverridePolicy:    true,
      canAccessClientData:  true,
      canTriggerDeploy:     true,
      canModifyCanon:       true,
      canUnlockFullAuto:    true,
    },
    system: {
      role:                 'system',
      description:          'Pain Engine — acts only within guardrail policy. Cannot self-escalate.',
      trustLevel:           3,
      canOverridePolicy:    false,
      canAccessClientData:  false,
      canTriggerDeploy:     false,
      canModifyCanon:       false,
      canUnlockFullAuto:    false,
    },
    external_input: {
      role:                 'external_input',
      description:          'Untrusted external input — signals, webhooks, external data. Always filtered through defence layer.',
      trustLevel:           0,
      canOverridePolicy:    false,
      canAccessClientData:  false,
      canTriggerDeploy:     false,
      canModifyCanon:       false,
      canUnlockFullAuto:    false,
    },
    client_workspace: {
      role:                 'client_workspace',
      description:          'Private client delivery space. Isolated — cannot see other client data or internal Pain System state.',
      trustLevel:           1,
      canOverridePolicy:    false,
      canAccessClientData:  true,   // own data only
      canTriggerDeploy:     false,
      canModifyCanon:       false,
      canUnlockFullAuto:    false,
    },
  },
  permissions: [
    { action: 'override_guardrail_policy',  allowed: ['founder'],                                    denied: ['system', 'external_input', 'client_workspace'] },
    { action: 'trigger_deploy',             allowed: ['founder'],                                    denied: ['system', 'external_input', 'client_workspace'] },
    { action: 'modify_canon',               allowed: ['founder'],                                    denied: ['system', 'external_input', 'client_workspace'] },
    { action: 'unlock_full_auto',           allowed: ['founder'],                                    denied: ['system', 'external_input', 'client_workspace'] },
    { action: 'approve_transform_task',     allowed: ['founder', 'system'],                          denied: ['external_input', 'client_workspace'] },
    { action: 'read_scheduler_state',       allowed: ['founder', 'system'],                          denied: ['external_input', 'client_workspace'] },
    { action: 'read_gate_results',          allowed: ['founder', 'system'],                          denied: ['external_input', 'client_workspace'] },
    { action: 'access_own_client_data',     allowed: ['founder', 'client_workspace'],                denied: ['external_input'] },
    { action: 'access_other_client_data',   allowed: ['founder'],                                    denied: ['system', 'external_input', 'client_workspace'], note: 'client_workspace isolation' },
    { action: 'read_knowledge_library',     allowed: ['founder', 'system'],                          denied: ['external_input', 'client_workspace'] },
    { action: 'write_working_memory',       allowed: ['founder', 'system'],                          denied: ['external_input', 'client_workspace'] },
    { action: 'promote_knowledge_to_canon', allowed: ['founder'],                                    denied: ['system', 'external_input', 'client_workspace'] },
    { action: 'activate_kill_switch',       allowed: ['founder', 'system'],                          denied: ['external_input', 'client_workspace'] },
    { action: 'disable_lane',               allowed: ['founder', 'system'],                          denied: ['external_input', 'client_workspace'] },
    { action: 'submit_backlog_item',        allowed: ['founder', 'system', 'client_workspace'],      denied: ['external_input'] },
  ],
};

// ── Permission check ──────────────────────────────────────────────────────

export function canPerform(role: Role, action: string): boolean {
  const perm = ROLE_MODEL.permissions.find(p => p.action === action);
  if (!perm) return false;
  if (perm.denied.includes(role))  return false;
  if (perm.allowed.includes(role)) return true;
  return false;
}

export function getRoleDefinition(role: Role): RoleDefinition {
  return ROLE_MODEL.roles[role];
}

// ── Persist ───────────────────────────────────────────────────────────────

const ROLE_FILE = path.join('engine', 'data', 'role-model.json');

export function persistRoleModel(): void {
  fs.writeFileSync(ROLE_FILE, JSON.stringify(ROLE_MODEL, null, 2), 'utf8');
}
