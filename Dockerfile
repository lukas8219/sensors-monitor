from node

RUN apt update && apt upgrade -y

RUN apt install lm-sensors -y

COPY .env .

COPY src ./src

COPY package.json ./package.json

COPY index.js .

RUN  npm i

ENTRYPOINT npm start