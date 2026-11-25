# Node 24 LTS on Debian 13 (trixie) slim; rebuild regularly to pick up security updates.
# Rebuild and rescan after changes — scanners report image metadata and unfixed upstream CVEs may remain.
FROM node:24-trixie-slim

ENV DEBIAN_FRONTEND=noninteractive

# Apply available OS security updates before installing LibreOffice.
RUN apt-get update && \
    apt-get full-upgrade -y --no-install-recommends && \
    apt-get install -y --no-install-recommends --no-install-suggests libreoffice && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
