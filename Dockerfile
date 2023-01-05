FROM ubuntu

RUN apt update -y \
  && apt install -y git ffmpeg \
  && apt autoclearn \
  && rm -rf /var/lib/apt/lists/*

COPY build/cicada-x64 /
VOLUME [ "/data", "/config.json" ]
CMD /cicada-x64 start -c /config.json --data /data --port 80
EXPOSE 80

LABEL org.opencontainers.image.title="cicada"
LABEL org.opencontainers.image.authors="mebtte<hi@mebtte.com>"
LABEL org.opencontainers.image.url="https://github.com/mebtte/cicada"
