FROM alpine

COPY build/cicada /bin/cicada
ENTRYPOINT ["/bin/cicada"]

LABEL org.opencontainers.image.title="cicada" \
  org.opencontainers.image.authors="mebtte<hi@mebtte.com>" \
  org.opencontainers.image.url="https://github.com/mebtte/cicada"
