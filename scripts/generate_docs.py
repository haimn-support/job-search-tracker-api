#!/usr/bin/env python3
"""
Script to generate API documentation from FastAPI OpenAPI schema.
"""
import json
import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app


def generate_openapi_json():
    """Generate OpenAPI JSON schema."""
    openapi_schema = app.openapi()
    
    # Create docs directory if it doesn't exist
    docs_dir = Path(__file__).parent.parent / "docs"
    docs_dir.mkdir(exist_ok=True)
    
    # Write OpenAPI schema to file
    with open(docs_dir / "openapi.json", "w") as f:
        json.dump(openapi_schema, f, indent=2)
    
    print(f"OpenAPI schema generated at: {docs_dir / 'openapi.json'}")
    
    # Generate a simple HTML documentation page
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>{openapi_schema['info']['title']} - API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.25.0/swagger-ui.css" />
    <style>
        html {{
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }}
        *, *:before, *:after {{
            box-sizing: inherit;
        }}
        body {{
            margin:0;
            background: #fafafa;
        }}
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@3.25.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@3.25.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {{
            const ui = SwaggerUIBundle({{
                url: './openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            }});
        }};
    </script>
</body>
</html>
    """
    
    with open(docs_dir / "index.html", "w") as f:
        f.write(html_content)
    
    print(f"HTML documentation generated at: {docs_dir / 'index.html'}")
    
    # Generate README for the docs
    readme_content = f"""# {openapi_schema['info']['title']} Documentation

{openapi_schema['info']['description']}

## API Documentation

- **Interactive Documentation**: Open `index.html` in your browser for interactive API documentation
- **OpenAPI Schema**: `openapi.json` contains the complete OpenAPI 3.0 schema
- **Live Documentation**: When running the API server, visit `/docs` for interactive documentation

## API Version

Version: {openapi_schema['info']['version']}

## Base URL

When running locally: `http://localhost:8000`

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Quick Start

1. Register a new account: `POST /api/v1/auth/register`
2. Login to get a token: `POST /api/v1/auth/login`
3. Create your first position: `POST /api/v1/positions`
4. Add interviews: `POST /api/v1/positions/{{position_id}}/interviews`
5. View your statistics: `GET /api/v1/statistics/overview`

## Endpoints Overview

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get token
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/refresh` - Refresh access token

### Positions
- `GET /api/v1/positions` - List positions (with filtering)
- `POST /api/v1/positions` - Create new position
- `GET /api/v1/positions/{{id}}` - Get position details
- `PUT /api/v1/positions/{{id}}` - Update position
- `DELETE /api/v1/positions/{{id}}` - Delete position

### Interviews
- `GET /api/v1/positions/{{id}}/interviews` - List interviews for position
- `POST /api/v1/positions/{{id}}/interviews` - Add interview
- `PUT /api/v1/interviews/{{id}}` - Update interview
- `DELETE /api/v1/interviews/{{id}}` - Delete interview

### Statistics
- `GET /api/v1/statistics/overview` - General statistics
- `GET /api/v1/statistics/timeline` - Timeline analysis
- `GET /api/v1/statistics/companies` - Company breakdown

### Health
- `GET /health` - API health check
- `GET /health/db` - Database health check
"""
    
    with open(docs_dir / "README.md", "w") as f:
        f.write(readme_content)
    
    print(f"Documentation README generated at: {docs_dir / 'README.md'}")


if __name__ == "__main__":
    generate_openapi_json()