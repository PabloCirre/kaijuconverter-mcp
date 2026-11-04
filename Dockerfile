FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY bin ./bin
RUN chmod +x ./bin/kaijuconverter-mcp.js
ENTRYPOINT ["node", "./bin/kaijuconverter-mcp.js"]
