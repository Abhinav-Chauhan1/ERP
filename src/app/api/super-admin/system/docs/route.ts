import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apiDocGenerator } from '@/lib/utils/api-documentation-generator';
import { withErrorHandler } from '@/lib/middleware/enhanced-error-handler';

/**
 * GET /api/super-admin/system/docs
 * Get API documentation in various formats
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'openapi';

  // Initialize documentation with schools management endpoints
  apiDocGenerator.initializeSchoolsManagementEndpoints();

  switch (format) {
    case 'openapi':
    case 'swagger':
      const openApiSpec = apiDocGenerator.generateOpenAPISpec();
      return NextResponse.json(openApiSpec, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });

    case 'markdown':
    case 'md':
      const markdownDocs = apiDocGenerator.generateMarkdownDocs();
      return new NextResponse(markdownDocs, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': 'attachment; filename="api-documentation.md"',
          'Cache-Control': 'public, max-age=3600',
        },
      });

    case 'html':
      const htmlDocs = generateHTMLDocs();
      return new NextResponse(htmlDocs, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
        },
      });

    default:
      return NextResponse.json(
        { error: 'Unsupported format. Use: openapi, swagger, markdown, md, or html' },
        { status: 400 }
      );
  }
});

/**
 * Generate HTML documentation
 */
function generateHTMLDocs(): string {
  const openApiSpec = apiDocGenerator.generateOpenAPISpec();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${openApiSpec.info.title}</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '/api/super-admin/system/docs?format=openapi',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                validatorUrl: null,
                tryItOutEnabled: true,
                supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
                onComplete: function() {
                    console.log('Swagger UI loaded');
                },
                onFailure: function(data) {
                    console.error('Failed to load Swagger UI', data);
                }
            });
        };
    </script>
</body>
</html>
  `;
}