FROM node:18.12.1

WORKDIR /app

COPY ["./build/cicada-linux","package.json","package-lock.json*","config.json","./"]

RUN npm install

EXPOSE 8000

CMD ["./cicada-linux","start","-c","config.json"]




