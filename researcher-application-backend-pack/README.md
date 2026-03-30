# Researcher Application Backend Pack

Production-oriented NestJS module for a **pending-approval researcher onboarding flow**.

## Included
- DTO validation with `class-validator`
- password hashing with `argon2`
- file upload handling with `@nestjs/platform-express`
- Prisma persistence
- admin review queue queries
- email notification port
- approve / reject / request-more-info endpoints
- Prisma schema snippet for the required models/enums

## Expected project dependencies
```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/swagger class-validator class-transformer argon2
```

## Assumptions
This pack assumes your app already has:
- `PrismaService` at `src/prisma/prisma.service.ts`
- auth guards / roles decorators you can swap in
- a real storage provider implementation
- a real mail provider implementation
- a real queue or notification implementation

## Suggested routes
### Public
- `POST /api/v1/auth/register-researcher-application`

### Admin
- `GET /api/v1/admin/researcher-applications`
- `GET /api/v1/admin/researcher-applications/:id`
- `PATCH /api/v1/admin/researcher-applications/:id/review`
- `PATCH /api/v1/admin/researcher-applications/:id/request-more-info`

## Wiring notes
Register concrete providers for these tokens:
- `FILE_STORAGE_PORT`
- `APPLICATION_MAILER_PORT`
- `APPLICATION_QUEUE_PORT`

Example:
```ts
providers: [
  {
    provide: FILE_STORAGE_PORT,
    useClass: S3FileStorageService,
  },
  {
    provide: APPLICATION_MAILER_PORT,
    useClass: ResendMailerService,
  },
  {
    provide: APPLICATION_QUEUE_PORT,
    useClass: BullApplicationQueueService,
  },
]
```

## Flow
1. User submits application and documents.
2. Service hashes password and stores pending user/application records.
3. Files are uploaded and URLs persisted.
4. Admin queue is notified.
5. Verification / submission emails are sent.
6. Admin reviews application.
7. System updates `reviewStatus` and `accountStatus`, then notifies applicant.
