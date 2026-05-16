FROM ubuntu

ARG TARGETOS=linux
ARG TARGETARCH=amd64

COPY build/${TARGETOS}-${TARGETARCH}/cicada /bin/cicada
ENTRYPOINT ["/bin/cicada"]

LABEL org.opencontainers.image.title="cicada" \
  org.opencontainers.image.authors="mebtte<i@mebtte.com>" \
  org.opencontainers.image.url="https://github.com/mebtte/cicada"
