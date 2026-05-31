# Make commands for easier local deployment

install:
	npm install

build: install
	npm run build

test-unit:
	npm run check

run:
	# start the development server and open a new browser tab to the web app
	npm run dev -- --open

run-local:
	# start local Supabase, then start the dev server
	supabase start
	node scripts/setup-local-auth.mjs "$(EMAIL)" "$(PASSWORD)" "$(ROLES)"
	npm run dev -- --open

supabase-up:
	supabase start

supabase-down:
	supabase stop

supabase-status:
	supabase status

grant-local-roles:
	@test -n "$(EMAIL)" || (echo "Usage: make grant-local-roles EMAIL=user@example.com [ROLES=tester,admin,superuser]" && exit 1)
	node scripts/grant-local-roles.mjs "$(EMAIL)" "$(ROLES)"

setup-local-auth:
	node scripts/setup-local-auth.mjs "$(EMAIL)" "$(PASSWORD)" "$(ROLES)"

setup-live-dev-service-accounts:
	node scripts/setup-live-dev-service-accounts.mjs

lint:
	npm run lint

pull-dev:
	# update the current branch with the latest from remote dev
	git pull && git pull --rebase origin dev

pull-local-dev:
	# update the current branch with the latest from local dev
	git pull --rebase . dev

reset-prod:
	# force the current branch to EXACTLY match the remote prod branch
	git reset --hard origin/prod

reset-dev:
	# force the current branch to EXACTLY match the remote dev branch
	git reset --hard origin/dev
