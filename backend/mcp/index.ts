#!/usr/bin/env node

/**
 * MCP Server for Smart Task Enterprise Service
 * Provides read-only database access via JSON-RPC
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { prisma } from '../src/config/database';

// Create MCP Server
const server = new Server(
  {
    name: 'smart-task-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_database_schema',
        description: 'Get the complete database schema including all tables and their columns',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_tables',
        description: 'List all tables in the database',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_table_info',
        description: 'Get detailed information about a specific table including columns and relations',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Name of the table to inspect',
            },
          },
          required: ['tableName'],
        },
      },
      {
        name: 'query_tasks',
        description: 'Query tasks with optional filters (read-only)',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'DONE'],
              description: 'Filter by task status',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              description: 'Filter by task priority',
            },
            limit: {
              type: 'number',
              default: 10,
              description: 'Maximum number of results',
            },
          },
        },
      },
      {
        name: 'query_users',
        description: 'Query users with optional filters (read-only)',
        inputSchema: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN'],
              description: 'Filter by user role',
            },
            limit: {
              type: 'number',
              default: 10,
              description: 'Maximum number of results',
            },
          },
        },
      },
      {
        name: 'count_records',
        description: 'Count records in a table',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              enum: ['users', 'tasks'],
              description: 'Table to count records in',
            },
          },
          required: ['tableName'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_database_schema': {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  tables: {
                    users: {
                      columns: ['id', 'email', 'password', 'name', 'role', 'createdAt', 'updatedAt'],
                      relations: ['createdTasks', 'assignedTasks'],
                    },
                    tasks: {
                      columns: ['id', 'title', 'description', 'status', 'priority', 'dueDate', 'tags', 'createdById', 'assignedToId', 'createdAt', 'updatedAt'],
                      relations: ['createdBy', 'assignedTo'],
                    },
                  },
                  enums: {
                    Role: ['USER', 'ADMIN'],
                    TaskStatus: ['TODO', 'IN_PROGRESS', 'DONE'],
                    Priority: ['LOW', 'MEDIUM', 'HIGH'],
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'list_tables': {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(['users', 'tasks'], null, 2),
            },
          ],
        };
      }

      case 'get_table_info': {
        const { tableName } = args as { tableName: string };

        if (tableName === 'users') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    name: 'users',
                    columns: [
                      { name: 'id', type: 'UUID', primaryKey: true },
                      { name: 'email', type: 'String', unique: true },
                      { name: 'password', type: 'String' },
                      { name: 'name', type: 'String' },
                      { name: 'role', type: 'Enum(USER, ADMIN)', default: 'USER' },
                      { name: 'createdAt', type: 'DateTime' },
                      { name: 'updatedAt', type: 'DateTime' },
                    ],
                    relations: [
                      { name: 'createdTasks', type: 'Task[]', relation: 'CreatedTasks' },
                      { name: 'assignedTasks', type: 'Task[]', relation: 'AssignedTasks' },
                    ],
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } else if (tableName === 'tasks') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    name: 'tasks',
                    columns: [
                      { name: 'id', type: 'UUID', primaryKey: true },
                      { name: 'title', type: 'String' },
                      { name: 'description', type: 'String?', nullable: true },
                      { name: 'status', type: 'Enum(TODO, IN_PROGRESS, DONE)', default: 'TODO' },
                      { name: 'priority', type: 'Enum(LOW, MEDIUM, HIGH)', default: 'MEDIUM' },
                      { name: 'dueDate', type: 'DateTime?', nullable: true },
                      { name: 'tags', type: 'String[]', default: '[]' },
                      { name: 'createdById', type: 'UUID', foreignKey: 'users.id' },
                      { name: 'assignedToId', type: 'UUID?', foreignKey: 'users.id', nullable: true },
                      { name: 'createdAt', type: 'DateTime' },
                      { name: 'updatedAt', type: 'DateTime' },
                    ],
                    relations: [
                      { name: 'createdBy', type: 'User', relation: 'CreatedTasks' },
                      { name: 'assignedTo', type: 'User?', relation: 'AssignedTasks' },
                    ],
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } else {
          throw new Error(`Unknown table: ${tableName}`);
        }
      }

      case 'query_tasks': {
        const { status, priority, limit = 10 } = args as {
          status?: string;
          priority?: string;
          limit?: number;
        };

        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;

        const tasks = await prisma.task.findMany({
          where,
          take: limit,
          include: {
            createdBy: { select: { id: true, email: true, name: true } },
            assignedTo: { select: { id: true, email: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tasks, null, 2),
            },
          ],
        };
      }

      case 'query_users': {
        const { role, limit = 10 } = args as {
          role?: string;
          limit?: number;
        };

        const where: Record<string, unknown> = {};
        if (role) where.role = role;

        const users = await prisma.user.findMany({
          where,
          take: limit,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(users, null, 2),
            },
          ],
        };
      }

      case 'count_records': {
        const { tableName } = args as { tableName: string };

        let count = 0;
        if (tableName === 'users') {
          count = await prisma.user.count();
        } else if (tableName === 'tasks') {
          count = await prisma.task.count();
        } else {
          throw new Error(`Unknown table: ${tableName}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ table: tableName, count }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
