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
	npm run dev -- --open

supabase-up:
	supabase start

supabase-down:
	supabase stop

supabase-status:
	supabase status

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
