# FFFUUUU

Functions do not work!!

## ARCH

Terminology

collections -> boards -> images

## TODO:

- delete pin confirmation
- update landing
- design and improve create dialog
- (?) reset navigator on change orientation
- hide menu on idle timeout
- animate keyboard interaction
- interactions hint
- help
- Ctrl P fuzzy search menu with filters
- select/multiselect
- move

# RUN

    	docker compose down && docker compose up -d --build

http://127.0.0.1:4001/storage/pinpc-e9112.appspot.com/images
https://scrapeops.io/nodejs-web-scraping-playbook/node-fetch-fake-user-agents/

# Docker

        docker build -t pin-clone-frontend .
        docker run -dp 5173:5173 pin-clone-frontend

docker build -t pin-clone-frontend . && docker run -p 5173:5173 pin-clone-frontend

docker stop id

To stop a running container, we can use the docker stop <ID> command. To delete a container, run docker rm <ID> . To delete an image, run the command docker rmi <ImageID> .

docker run -p 5173:5173 pin-clone-db

docker run --entrypoint bash pin-clone-db

docker run -p 9099:9099 4001:4001 8083:8083 9199:9199 pin-clone-db

docker build -t pin-clone-db && docker run -P pin-clone-db

docker run -p 9099:9099 -p 4001:4001 -p 8083:8083 -p 9199:9199 pin-db

docker compose up -d --build

docker compose exec frontend sh

sudo tar -cvf fireabse-backup.001.tar.gz -C ./database/backup .
sudo tar -xvf fireabse-backup.002.tar.gz -C ./database/backup
