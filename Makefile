
create:
	git checkout -b trials

check:
	git status
	git branch

start:
	npm run dev

add:
	git status
	git add .
	git status

# git commit -m "message"

trials:
	git push origin trials

push:
	git push origin main

main:
	git checkout main
	git branch
	git pull
	git checkout trials

main2:
	git pull origin main

user-reset:
	git config user.name "AnvayB"
	git config user.email "anvay.bhanap@gmail.com"

user-check:
	git config user.name
	git config user.email

