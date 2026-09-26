# Project Context

## Tech Stack
- NestJS 10
- TypeScript 5
- PostgreSQL 15 + Prisma
- Redis 7 + BullMQ
- Jest + Supertest

## Architecture
- Hexagonal (Ports & Adapters)
- Core (domain + application) no depende de infraestructura
- Puertos primarios en `application/ports/`
- Puertos secundarios en `domain/ports/`
- Adaptadores en `infrastructure/adapters/`

## Conventions
- DTOs con class-validator
- Casos de uso implementan puertos primarios
- Controladores usan puertos primarios (no repositorios)
- Repositorios implementan puertos secundarios
- Sin `any` en controladores
- Logger en lugar de console.log

## Testing
- Ver `openspec/testing.md`