import { z } from 'zod';
import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';

export interface CombatControlToolsOptions {
  foundryClient: FoundryClient;
  logger: Logger;
}

export class CombatControlTools {
  private foundryClient: FoundryClient;
  private logger: Logger;

  constructor({ foundryClient, logger }: CombatControlToolsOptions) {
    this.foundryClient = foundryClient;
    this.logger = logger.child({ component: 'CombatControlTools' });
  }

  getToolDefinitions() {
    return [
      {
        name: 'get-combat-state',
        description:
          'Read the current Foundry combat encounter state, including round, turn, current combatant, and combatants.',
        inputSchema: {
          type: 'object',
          properties: {
            combatId: {
              type: 'string',
              description: 'Optional combat encounter ID. Defaults to the active combat.',
            },
          },
        },
      },
      {
        name: 'start-combat',
        description:
          'Create or activate a Foundry combat encounter for current-scene tokens, optionally roll initiative, then start combat.',
        inputSchema: {
          type: 'object',
          properties: {
            tokenIds: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Current-scene token IDs to include. If omitted, includes all visible current-scene tokens with actors.',
            },
            combatId: {
              type: 'string',
              description: 'Optional existing combat ID to use instead of creating or reusing active combat.',
            },
            rollInitiative: {
              type: 'boolean',
              description: 'Whether to roll initiative before starting. Defaults to true.',
              default: true,
            },
            includeHidden: {
              type: 'boolean',
              description: 'Whether omitted tokenIds should include hidden tokens. Defaults to false.',
              default: false,
            },
            reuseExisting: {
              type: 'boolean',
              description:
                'Whether to reuse an existing active/viewed combat for the scene if available. Defaults to true.',
              default: true,
            },
          },
        },
      },
      {
        name: 'add-tokens-to-combat',
        description:
          'Add current-scene tokens to an existing or active Foundry combat encounter.',
        inputSchema: {
          type: 'object',
          properties: {
            tokenIds: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
              description: 'Current-scene token IDs to add as combatants.',
            },
            combatId: {
              type: 'string',
              description: 'Optional combat encounter ID. Defaults to active combat.',
            },
          },
          required: ['tokenIds'],
        },
      },
      {
        name: 'roll-combat-initiative',
        description:
          'Roll initiative for combatants in a Foundry combat encounter. Can roll all missing initiatives or selected combatant IDs.',
        inputSchema: {
          type: 'object',
          properties: {
            combatId: {
              type: 'string',
              description: 'Optional combat encounter ID. Defaults to active combat.',
            },
            combatantIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific combatant IDs to roll. Omit when rollAll=true.',
            },
            rollAll: {
              type: 'boolean',
              description: 'Roll all combatants without initiative. Defaults to true.',
              default: true,
            },
            formula: {
              type: 'string',
              description: 'Optional custom initiative formula.',
            },
            updateTurn: {
              type: 'boolean',
              description: 'Forwarded to Foundry Combat.rollInitiative. Defaults to true.',
              default: true,
            },
          },
        },
      },
      {
        name: 'set-combatant-initiative',
        description: 'Set a specific initiative value for one combatant.',
        inputSchema: {
          type: 'object',
          properties: {
            combatId: {
              type: 'string',
              description: 'Optional combat encounter ID. Defaults to active combat.',
            },
            combatantId: {
              type: 'string',
              description: 'Combatant ID whose initiative should be set.',
            },
            initiative: {
              type: 'number',
              description: 'Initiative value to assign.',
            },
          },
          required: ['combatantId', 'initiative'],
        },
      },
      {
        name: 'next-combat-turn',
        description: 'Advance the active or specified Foundry combat encounter to the next turn.',
        inputSchema: {
          type: 'object',
          properties: {
            combatId: {
              type: 'string',
              description: 'Optional combat encounter ID. Defaults to active combat.',
            },
          },
        },
      },
      {
        name: 'previous-combat-turn',
        description: 'Move the active or specified Foundry combat encounter to the previous turn.',
        inputSchema: {
          type: 'object',
          properties: {
            combatId: {
              type: 'string',
              description: 'Optional combat encounter ID. Defaults to active combat.',
            },
          },
        },
      },
      {
        name: 'next-combat-round',
        description: 'Advance the active or specified Foundry combat encounter to the next round.',
        inputSchema: {
          type: 'object',
          properties: {
            combatId: {
              type: 'string',
              description: 'Optional combat encounter ID. Defaults to active combat.',
            },
          },
        },
      },
      {
        name: 'set-combatant-defeated',
        description: 'Mark or unmark a combatant as defeated.',
        inputSchema: {
          type: 'object',
          properties: {
            combatId: {
              type: 'string',
              description: 'Optional combat encounter ID. Defaults to active combat.',
            },
            combatantId: {
              type: 'string',
              description: 'Combatant ID to update.',
            },
            defeated: {
              type: 'boolean',
              description: 'Whether the combatant is defeated.',
            },
          },
          required: ['combatantId', 'defeated'],
        },
      },
      {
        name: 'end-combat',
        description: 'End a Foundry combat encounter without opening the Foundry confirmation dialog.',
        inputSchema: {
          type: 'object',
          properties: {
            combatId: {
              type: 'string',
              description: 'Optional combat encounter ID. Defaults to active combat.',
            },
            confirmEnd: {
              type: 'boolean',
              const: true,
              description: 'Required confirmation because ending combat mutates world state.',
            },
          },
          required: ['confirmEnd'],
        },
      },
    ];
  }

  async handleToolCall(name: string, args: any): Promise<any> {
    this.logger.info('Handling combat control tool call', { name });

    switch (name) {
      case 'get-combat-state':
        return this.query('get-combat-state', z.object({ combatId: z.string().optional() }), args);
      case 'start-combat':
        return this.query(
          'start-combat',
          z.object({
            tokenIds: z.array(z.string()).optional(),
            combatId: z.string().optional(),
            rollInitiative: z.boolean().default(true),
            includeHidden: z.boolean().default(false),
            reuseExisting: z.boolean().default(true),
          }),
          args
        );
      case 'add-tokens-to-combat':
        return this.query(
          'add-tokens-to-combat',
          z.object({
            tokenIds: z.array(z.string()).min(1),
            combatId: z.string().optional(),
          }),
          args
        );
      case 'roll-combat-initiative':
        return this.query(
          'roll-combat-initiative',
          z.object({
            combatId: z.string().optional(),
            combatantIds: z.array(z.string()).optional(),
            rollAll: z.boolean().default(true),
            formula: z.string().optional(),
            updateTurn: z.boolean().default(true),
          }),
          args
        );
      case 'set-combatant-initiative':
        return this.query(
          'set-combatant-initiative',
          z.object({
            combatId: z.string().optional(),
            combatantId: z.string(),
            initiative: z.number(),
          }),
          args
        );
      case 'next-combat-turn':
      case 'previous-combat-turn':
      case 'next-combat-round':
        return this.query(name, z.object({ combatId: z.string().optional() }), args);
      case 'set-combatant-defeated':
        return this.query(
          'set-combatant-defeated',
          z.object({
            combatId: z.string().optional(),
            combatantId: z.string(),
            defeated: z.boolean(),
          }),
          args
        );
      case 'end-combat':
        return this.query(
          'end-combat',
          z.object({
            combatId: z.string().optional(),
            confirmEnd: z.literal(true),
          }),
          args
        );
      default:
        throw new Error(`Unknown combat control tool: ${name}`);
    }
  }

  private async query(name: string, schema: z.ZodTypeAny, args: any): Promise<any> {
    try {
      const params = schema.parse(args ?? {});
      return await this.foundryClient.query(`foundry-mcp-bridge.${name}`, params);
    } catch (error) {
      this.logger.error(`Failed combat control tool ${name}`, error);
      if (error instanceof z.ZodError) {
        throw new Error(`Parameter error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }
}
