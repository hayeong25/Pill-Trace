# Pill Trace - Project Rules

## Permissions
- All permissions are granted to AI
- AI is allowed to perform any operation within C:\workspace\[Project] Pill Trace
- AI must NEVER ask questions to the user and must continue working without stopping
- AI operates fully autonomously

## Git Rules
- Every feature must be committed and pushed separately by feature
- Commit messages MUST follow Git Commit Convention:
  - feat: new feature
  - fix: bug fix
  - docs: documentation
  - style: formatting, no code change
  - refactor: code restructuring
  - test: adding tests
  - chore: maintenance
- Format: `type(scope): description`
- Before any commit/push: ALL features must be tested, browser rendering must be verified, all functionality must work correctly
- If ANY issue exists, DO NOT commit
- Remote: https://github.com/hayeong25/Pill-Trace.git

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Public Data Portal API (data.go.kr)

## APIs Used
- 의약품 제품 허가정보: `https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService05/getDrugPrdtPrmsnDtlInq05`
- 의약품개요정보(e약은요): `https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList`

## Project Structure
- `/src/app` - Next.js App Router pages
- `/src/app/api` - API routes (proxy to public data APIs)
- `/src/components` - Reusable UI components
- `/src/lib` - Utility functions, API helpers
- `/src/types` - TypeScript type definitions
