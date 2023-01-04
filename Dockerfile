FROM node:16

RUN git clone https://github.com/mebtte/cicada.git /project/cicada \
  && cd /project/cicada \
  && npm install
