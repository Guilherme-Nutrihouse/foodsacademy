# Foods Academy - AI Context (agents.md)

## Project Overview

Foods Academy is a corporate learning platform used by employees of Nutrihouse and Domaná.

It provides centralized access to:
- Courses
- Training videos
- Educational materials

---

## Tech Stack

- Backend: Node.js (Express)
- Frontend: React.js + Tailwind CSS
- Database: SQL Server (BD_UNIVNH)
- Authentication: LDAP (corporate directory)
- Hosting: IIS (Windows Server)

---

## Architecture Principles (Industry Standard)

This project follows well-known and trusted patterns:

### 1. Layered Architecture
- Controller (HTTP layer)
- Service (business logic)
- Data Access (database interaction)

### 2. Separation of Concerns
- Each layer has a single responsibility
- No business logic inside controllers
- No direct DB access from controllers

### 3. SOLID Principles (adapted for Node.js)
- Single Responsibility
- Open/Closed (extend, don’t rewrite)
- Dependency inversion when possible

### 4. Clean Code Practices
- Small, readable functions
- Clear naming conventions
- Avoid duplication (DRY)

---

## Backend Design Rules

### Controllers
- Handle HTTP request/response only
- Call services
- Return standardized responses

### Services
- Contain business logic
- Handle validation and rules
- Orchestrate data access

### Data Access
- Isolated logic for SQL queries
- No business rules

---

## API Standards (REST)

- Use proper HTTP methods:
  - GET → retrieve
  - POST → create
  - PUT/PATCH → update
  - DELETE → remove

- Use proper status codes:
  - 200 OK
  - 201 Created
  - 400 Bad Request
  - 401 Unauthorized
  - 403 Forbidden
  - 500 Internal Server Error

- Always return JSON

---

## Authentication & Security

- Authentication MUST go through LDAP
- Never bypass LDAP flow
- Validate user permissions before returning data
- Do not expose sensitive data

---

## Database Guidelines

- Use SQL Server (BD_UNIVNH)
- Prefer parameterized queries (avoid SQL injection)
- Keep queries readable and maintainable
- Avoid duplicating queries across files

---

## Frontend Guidelines

- Use React functional components
- Keep components small and reusable
- Separate UI from business logic
- Use consistent Tailwind styling

---

## Constraints

- Do NOT break existing APIs
- Do NOT change authentication flow
- Do NOT introduce heavy or unnecessary dependencies
- Maintain backward compatibility

---

## Development Philosophy

- Prefer simplicity over complexity
- Follow existing patterns in the codebase
- Extend features instead of rewriting
- Write code that is easy to maintain
- Add comments explaining every change made

---

## When Generating Code

The AI MUST:

1. Analyze existing project patterns before suggesting code
2. Follow the same structure already used in the project
3. Explain the solution BEFORE generating code
4. Avoid assumptions about unavailable libraries
5. Keep consistency with naming and architecture

---

## Anti-Patterns to Avoid

- Business logic inside controllers ❌
- Direct DB access in controllers ❌
- Hardcoded credentials ❌
- Breaking LDAP authentication ❌
- Large, monolithic functions ❌

---

## Preferred Output Style

- Step-by-step explanation
- Then code implementation
- Clear separation of layers
- Maintain readability and simplicity