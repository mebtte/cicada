FROM node:16

RUN git clone https://github.com/mebtte/cicada.git /cicada \
  && cd /cicada \
  && npm install \
  && npm run build:pwa

WORKDIR /cicada
CMD npm run start:server -- -- start -c /config.json --data /cicada --port 80
