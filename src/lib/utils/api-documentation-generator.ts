/**
 * API Documentation Generator
 * 
 * Generates comprehensive OpenAPI/Swagger documentation for the schools management API
 */

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  summary: string;
  description: string;
  tags: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  security?: SecurityRequirement[];
}

export interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  schema: Schema;
  description: string;
}

export interface RequestBody {
  description: string;
  required: boolean;
  content: Record<string, { schema: Schema }>;
}

export interface Response {
  description: string;
  content?: Record<string, { schema: Schema }>;
}

export interface Schema {
  type?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  enum?: string[];
  example?: any;
  required?: string[];
  $ref?: string;
  format?: string;
  default?: any;
  minimum?: number;
  maximum?: number;
}

export interface SecurityRequirement {
  [key: string]: string[];
}

class APIDocumentationGenerator {
  private endpoints: APIEndpoint[] = [];

  /**
   * Add endpoint documentation
   */
  addEndpoint(endpoint: APIEndpoint): void {
    this.endpoints.push(endpoint);
  }

  /**
   * Generate OpenAPI specification
   */
  generateOpenAPISpec(): any {
    return {
      openapi: '3.0.3',
      info: {
        title: 'SikshaMitra ERP - Schools Management API',
        description: 'Comprehensive API for managing schools, users, and educational data',
        version: '1.0.0',
        contact: {
          name: 'SikshaMitra Support',
          email: 'support@sikshamitra.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: 'https://api.sikshamitra.com',
          description: 'Production server',
        },
        {
          url: 'https://staging-api.sikshamitra.com',
          description: 'Staging server',
        },
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      tags: this.generateTags(),
      paths: this.generatePaths(),
      components: {
        schemas: this.generateSchemas(),
        securitySchemes: this.generateSecuritySchemes(),
      },
      security: [
        {
          BearerAuth: [],
        },
      ],
    };
  }

  /**
   * Generate tags from endpoints
   */
  private generateTags(): any[] {
    const tagSet = new Set<string>();
    this.endpoints.forEach(endpoint => {
      endpoint.tags.forEach(tag => tagSet.add(tag));
    });

    return Array.from(tagSet).map(tag => ({
      name: tag,
      description: this.getTagDescription(tag),
    }));
  }

  /**
   * Generate paths from endpoints
   */
  private generatePaths(): any {
    const paths: any = {};

    this.endpoints.forEach(endpoint => {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: endpoint.responses,
        security: endpoint.security,
      };
    });

    return paths;
  }

  /**
   * Generate common schemas
   */
  private generateSchemas(): any {
    return {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          code: { type: 'string' },
          details: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' },
          requestId: { type: 'string' },
        },
        required: ['error', 'message', 'timestamp'],
      },
      School: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          schoolCode: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' },
          address: { type: 'string' },
          domain: { type: 'string' },
          subdomain: { type: 'string' },
          plan: { type: 'string', enum: ['STARTER', 'GROWTH', 'DOMINATE'] },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'name', 'schoolCode', 'plan', 'status'],
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          mobile: { type: 'string' },
          role: { type: 'string', enum: ['STUDENT', 'TEACHER', 'PARENT', 'ADMIN', 'SUPER_ADMIN'] },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'name', 'role', 'isActive'],
      },
      Backup: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          filename: { type: 'string' },
          size: { type: 'integer' },
          type: { type: 'string', enum: ['MANUAL', 'SCHEDULED', 'AUTOMATIC'] },
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] },
          includeFiles: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time' },
          errorMessage: { type: 'string' },
        },
        required: ['id', 'filename', 'type', 'status', 'createdAt'],
      },
      SchoolPermissions: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          schoolId: { type: 'string' },
          manageStudents: { type: 'boolean' },
          manageTeachers: { type: 'boolean' },
          manageParents: { type: 'boolean' },
          manageAdmins: { type: 'boolean' },
          manageClasses: { type: 'boolean' },
          manageSubjects: { type: 'boolean' },
          manageSyllabus: { type: 'boolean' },
          manageExams: { type: 'boolean' },
          manageAssignments: { type: 'boolean' },
          manageAttendance: { type: 'boolean' },
          generateReportCards: { type: 'boolean' },
          messagingSystem: { type: 'boolean' },
          notificationSystem: { type: 'boolean' },
          announcementSystem: { type: 'boolean' },
          whatsappIntegration: { type: 'boolean' },
          smsIntegration: { type: 'boolean' },
          emailIntegration: { type: 'boolean' },
          feeManagement: { type: 'boolean' },
          paymentProcessing: { type: 'boolean' },
          financialReports: { type: 'boolean' },
          libraryManagement: { type: 'boolean' },
          transportManagement: { type: 'boolean' },
          hostelManagement: { type: 'boolean' },
          alumniManagement: { type: 'boolean' },
          certificateGeneration: { type: 'boolean' },
          backupRestore: { type: 'boolean' },
          dataExport: { type: 'boolean' },
          auditLogs: { type: 'boolean' },
          apiAccess: { type: 'boolean' },
          customBranding: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'schoolId'],
      },
    };
  }

  /**
   * Generate security schemes
   */
  private generateSecuritySchemes(): any {
    return {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from authentication endpoint',
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for service-to-service authentication',
      },
    };
  }

  /**
   * Get tag description
   */
  private getTagDescription(tag: string): string {
    const descriptions: Record<string, string> = {
      'Schools': 'School management operations',
      'Users': 'User management operations',
      'Backups': 'Backup and restore operations',
      'Permissions': 'Permission management operations',
      'Settings': 'Configuration and settings management',
      'Analytics': 'Analytics and reporting operations',
      'Billing': 'Billing and subscription management',
      'Audit': 'Audit logging and compliance',
      'Monitoring': 'System monitoring and health checks',
      'Support': 'Support and help desk operations',
    };

    return descriptions[tag] || `${tag} related operations`;
  }

  /**
   * Initialize with schools management endpoints
   */
  initializeSchoolsManagementEndpoints(): void {
    // Schools endpoints
    this.addEndpoint({
      path: '/api/super-admin/schools',
      method: 'GET',
      summary: 'List all schools',
      description: 'Retrieve a paginated list of all schools with filtering and sorting options',
      tags: ['Schools'],
      parameters: [
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: { type: 'integer', example: 1 },
          description: 'Page number for pagination',
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', example: 20 },
          description: 'Number of items per page',
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
          description: 'Filter by school status',
        },
        {
          name: 'plan',
          in: 'query',
          required: false,
          schema: { type: 'string', enum: ['STARTER', 'GROWTH', 'DOMINATE'] },
          description: 'Filter by subscription plan',
        },
      ],
      responses: {
        '200': {
          description: 'List of schools retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  schools: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/School' },
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      total: { type: 'integer' },
                      pages: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    });

    // School backups endpoint
    this.addEndpoint({
      path: '/api/super-admin/schools/{id}/backups',
      method: 'GET',
      summary: 'List school backups',
      description: 'Retrieve all backups for a specific school',
      tags: ['Schools', 'Backups'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'School ID',
        },
      ],
      responses: {
        '200': {
          description: 'School backups retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  schoolId: { type: 'string' },
                  schoolName: { type: 'string' },
                  backups: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Backup' },
                  },
                  stats: {
                    type: 'object',
                    properties: {
                      totalBackups: { type: 'integer' },
                      totalSize: { type: 'integer' },
                      lastBackupDate: { type: 'string', format: 'date-time' },
                      successRate: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
        '404': {
          description: 'School not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    });

    // Create backup endpoint
    this.addEndpoint({
      path: '/api/super-admin/schools/{id}/backups',
      method: 'POST',
      summary: 'Create school backup',
      description: 'Create a new backup for a specific school',
      tags: ['Schools', 'Backups'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'School ID',
        },
      ],
      requestBody: {
        description: 'Backup configuration',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['MANUAL', 'SCHEDULED', 'AUTOMATIC'],
                  default: 'MANUAL',
                },
                includeFiles: { type: 'boolean', default: true },
                includeDatabase: { type: 'boolean', default: true },
                includeLogs: { type: 'boolean', default: false },
                compressionLevel: { type: 'integer', minimum: 1, maximum: 9, default: 6 },
                encryptBackup: { type: 'boolean', default: false },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Backup creation initiated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  backupId: { type: 'string' },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
        '409': {
          description: 'Backup already in progress',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    });

    // Add more endpoints...
  }

  /**
   * Generate markdown documentation
   */
  generateMarkdownDocs(): string {
    let markdown = '# SikshaMitra ERP - Schools Management API Documentation\n\n';
    
    markdown += '## Overview\n\n';
    markdown += 'This API provides comprehensive functionality for managing schools, users, and educational data in the SikshaMitra ERP system.\n\n';
    
    markdown += '## Authentication\n\n';
    markdown += 'All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:\n\n';
    markdown += '```\nAuthorization: Bearer <your-jwt-token>\n```\n\n';
    
    markdown += '## Base URL\n\n';
    markdown += '- Production: `https://api.sikshamitra.com`\n';
    markdown += '- Staging: `https://staging-api.sikshamitra.com`\n';
    markdown += '- Development: `http://localhost:3000`\n\n';
    
    markdown += '## Endpoints\n\n';
    
    // Group endpoints by tags
    const endpointsByTag: Record<string, APIEndpoint[]> = {};
    this.endpoints.forEach(endpoint => {
      endpoint.tags.forEach(tag => {
        if (!endpointsByTag[tag]) {
          endpointsByTag[tag] = [];
        }
        endpointsByTag[tag].push(endpoint);
      });
    });
    
    Object.entries(endpointsByTag).forEach(([tag, endpoints]) => {
      markdown += `### ${tag}\n\n`;
      
      endpoints.forEach(endpoint => {
        markdown += `#### ${endpoint.method} ${endpoint.path}\n\n`;
        markdown += `${endpoint.description}\n\n`;
        
        if (endpoint.parameters && endpoint.parameters.length > 0) {
          markdown += '**Parameters:**\n\n';
          endpoint.parameters.forEach(param => {
            markdown += `- \`${param.name}\` (${param.in}) - ${param.description}\n`;
          });
          markdown += '\n';
        }
        
        if (endpoint.requestBody) {
          markdown += '**Request Body:**\n\n';
          markdown += `${endpoint.requestBody.description}\n\n`;
        }
        
        markdown += '**Responses:**\n\n';
        Object.entries(endpoint.responses).forEach(([code, response]) => {
          markdown += `- \`${code}\` - ${response.description}\n`;
        });
        markdown += '\n';
      });
    });
    
    return markdown;
  }
}

// Export singleton instance
export const apiDocGenerator = new APIDocumentationGenerator();
export default apiDocGenerator;