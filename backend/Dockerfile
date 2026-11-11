# Node 22 on Debian 13 (trixie) slim; newer base typically has fewer reported OS CVEs than bookworm.
# Rebuild and rescan after changes — scanners report image metadata and any unfixed upstream CVEs may remain.
FROM node:22-trixie-slim

ENV DEBIAN_FRONTEND=noninteractive

# Apply available OS security updates before installing LibreOffice.
RUN apt-get update && \
    apt-get upgrade -y --no-install-recommends && \
    apt-get install -y --no-install-recommends --no-install-suggests libreoffice && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
