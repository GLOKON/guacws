FROM guacamole/guacd

RUN set -ex; \
    apt-get update -yq; \
    apt-get install -yq --no-install-recommends \
        curl \
        gnupg \
        ca-certificates \
        supervisor \
        pulseaudio \
        ghostscript \
    ; \
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - ; \
    apt-get update -yq; \
    rm -rf /var/lib/apt/lists/* ; \
    apt-get install -yq --no-install-recommends \
        nodejs \
    ; \
    sed -i \
        -e 's|#load-module module-native-protocol-tcp|load-module module-native-protocol-tcp auth-anonymous=1|g' \
        /etc/pulse/default.pa

# Arguments to label built container
ARG GIT_SHA
ARG GIT_TAG=1.0.0

# Container labels (http://label-schema.org/)
# Container annotations (https://github.com/opencontainers/image-spec)
LABEL maintainer="Daniel McAssey <hello at glokon dot me>" \
      product="Apache Guacamole-Lite WebSocket Server" \
      version=$GIT_TAG \
      org.label-schema.vcs-ref=$GIT_SHA \
      org.label-schema.vcs-url="https://github.com/Monogramm/docker-guacd" \
      org.label-schema.name="Apache Guacamole Server" \
      org.label-schema.description="Guacamole proxy daemon." \
      org.label-schema.url="https://guacamole.apache.org/" \
      org.label-schema.vendor="Apache" \
      org.label-schema.version=$GIT_TAG \
      org.label-schema.schema-version="1.0" \
      org.opencontainers.image.revision=$GIT_SHA \
      org.opencontainers.image.source="https://github.com/Monogramm/docker-guacd" \
      org.opencontainers.image.title="Apache Guacamole Server" \
      org.opencontainers.image.description="Guacamole proxy daemon." \
      org.opencontainers.image.url="https://guacamole.apache.org/" \
      org.opencontainers.image.vendor="Apache" \
      org.opencontainers.image.version=$GIT_TAG \
      org.opencontainers.image.authors="Daniel McAssey <hello at glokon dot me>"

ENV GUACD_HOST=127.0.0.1
ENV GUACD_PORT=4822
ENV CRYPT_CYPHER='AES-256-CBC'
ENV LOG_LEVEL='info'
EXPOSE 8080

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

CMD [ "supervisord", "-c", "supervisor.conf"]
