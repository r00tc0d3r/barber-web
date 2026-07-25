# Task for gentle-ai-worker

Implement Priority 1 Security hardening for barber-web project at /Users/k3l0d3v/Projects/barber-web.

## Context
This is a Next.js 16 app (React 19, Prisma 7, Neon PostgreSQL, NextAuth beta). It's a barber shop booking system with admin panel. Current state: ZERO auth checks on admin server actions, ZERO input validation, ZERO rate limiting, ZERO security headers.

## Tasks to implement (in order):

### 1. Create auth wrapper (`src/lib/auth-guard.ts`)
Create a reusable wrapper that validates NextAuth session + role for server actions:
```typescript
import { auth } from "@/lib/auth";
import { AuthError } from "next-auth";

type AllowedRoles = "ADMIN" | "SUPER_ADMIN";

export async function requireAuth(allowedRoles?: AllowedRoles[]) {
  const session = await auth();
  if (!session?.user) {
    throw new AuthError("No autorizado");
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role as AllowedRoles)) {
    throw new AuthError("No autorizado");
  }
  return session;
}
```

### 2. Create Zod validation schemas (`src/lib/validations.ts`)
Create schemas for ALL server action inputs:
- `createBarberSchema`, `updateBarberSchema` (barber CRUD)
- `createServiceSchema`, `updateServiceSchema` (service CRUD)
- `createAppointmentSchema` (booking)
- `getAvailableSlotsSchema` (slot query)
- `updateAppointmentStatusSchema` (status change)
- `uploadImageSchema` (gallery upload)

Use Zod v4 (already installed as `zod@^4.4.3`). Use `z.coerce` where needed for string-to-number/date conversions.

### 3. Apply auth + validation to ALL server actions

**`src/app/admin/actions.ts`** — Add `requireAuth(["ADMIN", "SUPER_ADMIN"])` at top of every function. Add Zod validation for all input `data` params. Return structured errors (not throw raw strings).

**`src/app/admin/galeria/actions.ts`** — Already has auth checks but uses manual `session.user.role === "CLIENT"` check. Replace with `requireAuth()` wrapper for consistency. Keep existing file validation but enhance it (see task 5).

**`src/app/agendar/actions.ts`** — `createAppointment` is public (clients use it) but MUST validate inputs with Zod. `getAvailableSlots` is also public but should validate inputs.

**`src/app/admin/settings/actions.ts`** — Check if this file exists; if it does, add auth guard.

### 4. Create security middleware (`src/middleware.ts`)
Create a root-level middleware.ts with security headers:
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  
  // CSP - basic policy (adjust as needed)
  response.headers.set("Content-Security-Policy", 
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https://images.unsplash.com data:; font-src 'self';"
  );
  
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sw.js).*)"],
};
```

### 5. Create rate limiter (`src/lib/rate-limit.ts`)
In-memory sliding window rate limiter:
```typescript
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }
  
  if (record.count >= maxRequests) {
    return { success: false, remaining: 0 };
  }
  
  record.count++;
  return { success: true, remaining: maxRequests - record.count };
}
```

Apply rate limiting to:
- `src/app/agendar/actions.ts` → `createAppointment`: 5 req/min per IP
- `src/app/api/auth/[...nextauth]/route.ts`: 10 req/min per IP (login brute force)
- `src/app/api/push-subscribe/route.ts`: 5 req/min per user

For IP extraction in server actions, use headers: `headers()` from `next/headers`.

### 6. Enhance file upload validation (`src/app/admin/galeria/actions.ts`)
Add magic bytes validation:
```typescript
const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF (WEBP starts with RIFF)
  "video/mp4": [0x00, 0x00, 0x00], //ftyp at offset 4
  "video/webm": [0x1a, 0x45, 0xdf, 0xa3],
};

function validateMagicBytes(buffer: Buffer, declaredType: string): boolean {
  const expected = MAGIC_BYTES[declaredType];
  if (!expected) return false;
  return expected.every((byte, i) => buffer[i] === byte);
}
```

## Important rules:
- Do NOT modify prisma schema
- Do NOT install new npm packages (everything needed is already installed)
- Keep existing functionality working — this is additive security, not a refactor
- Use `import { z } from "zod"` (v4 API)
- All generated code in English (comments, variable names, error messages)
- Test each change compiles: run `npx tsc --noEmit` at the end

## Files to create:
- `src/lib/auth-guard.ts`
- `src/lib/validations.ts`
- `src/lib/rate-limit.ts`
- `src/middleware.ts`

## Files to modify:
- `src/app/admin/actions.ts`
- `src/app/admin/galeria/actions.ts`
- `src/app/agendar/actions.ts`
- `src/app/api/push-subscribe/route.ts`

Read each file before modifying to preserve existing logic.

## Acceptance Contract
Acceptance level: reviewed
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Implement the requested change without widening scope
- criterion-2: Return evidence sufficient for an independent acceptance review

Required evidence: changed-files, tests-added, commands-run, validation-output, residual-risks, no-staged-files

Review gate: optional by reviewer.

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
`criteriaSatisfied[].status` must be exactly one of: satisfied, not-satisfied, not-applicable.
`commandsRun[].result` must be exactly one of: passed, failed, not-run.
`manualNotes` and `notes` are optional strings; an empty string means no note and does not satisfy `manual-notes` evidence.
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    },
    {
      "id": "criterion-2",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```