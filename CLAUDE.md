# Pill Trace - Project Rules

## Permissions
- All permissions are granted to AI
- AI is allowed to perform any operation within C:\workspace\[Project] Pill Trace
- AI must NEVER ask questions to the user and must continue working without stopping
- AI operates fully autonomously

## Verification Rules
- 모든 작업 완료 후, 반드시 `.next` 캐시를 삭제한 뒤 http://localhost:3000 웹 페이지가 정상적으로 뜨는지 확인해야 한다
- 확인 순서:
  1. `.next` 폴더 삭제 (`rm -rf .next`)
  2. `next dev` 서버 실행
  3. WebFetch로 http://localhost:3000 에 접속하여 페이지가 정상 렌더링(200 OK)되는지 검증
- `.next` 캐시 정리 없이 검증하는 것은 허용되지 않음 (캐시로 인한 오류 은폐 방지)
- 페이지가 정상적으로 뜨지 않으면 원인을 파악하고 수정한 후 다시 확인
- lint, build, test 통과 + 페이지 정상 확인이 모두 완료되어야 커밋 가능

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
- 의약품 제품 허가정보: `https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnDtlInq07`
- 의약품개요정보(e약은요): `https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList`

## Project Structure
- `/src/app` - Next.js App Router pages
- `/src/app/api` - API routes (proxy to public data APIs)
- `/src/components` - Reusable UI components
- `/src/lib` - Utility functions, API helpers
- `/src/types` - TypeScript type definitions
