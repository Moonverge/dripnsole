db\:up:
	docker compose up -d postgres

db\:down:
	docker compose down

db\:nuke:
	docker compose down -v

db\:migrate:
	pnpm --filter @dripnsole/server db:migrate

dev:
	pnpm dev

dev\:web:
	pnpm exec turbo run dev --filter=@dripnsole/web

dev\:server:
	pnpm exec turbo run dev --filter=@dripnsole/server

test:
	pnpm --filter @dripnsole/server test

test\:coverage:
	pnpm --filter @dripnsole/server test:coverage

test\:e2e:
	pnpm exec playwright test

test\:e2e-install:
	pnpm exec playwright install chromium

test\:all:
	make test && make test:e2e

clean:
	pnpm clean

clean\:all:
	pnpm clean:all
