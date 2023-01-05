FROM ubuntu

RUN apt-get update -y \
  && apt-get install -y git ffmpeg \
  && apt-get autoclean \
  && rm -rf /var/lib/apt/lists/*

COPY build/cicada-x64 /
VOLUME [ "/data", "/config.json" ]
CMD /cicada-x64 start -c /config.json --data /data --port 80
EXPOSE 80

LABEL org.opencontainers.image.title="cicada"
LABEL org.opencontainers.image.authors="mebtte<hi@mebtte.com>"
LABEL org.opencontainers.image.url="https://github.com/mebtte/cicada"
