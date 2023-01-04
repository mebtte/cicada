FROM ubuntu

COPY build/cicada-linux-x64 /
VOLUME [ "/data", "/config.json" ]
CMD /cicada-linux-x64 start -c /config.json --data /data --port 80
EXPOSE 80
