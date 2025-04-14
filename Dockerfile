# Usar uma imagem Node.js mais completa
FROM node:18 as builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante dos arquivos
COPY . .

# Copiar arquivo .env.local para o build
COPY .env.local .env.local

# Modificar next.config.js para garantir que o build funcione
RUN sed -i 's/output: .standalone.,/\/\/ output: "standalone",/' next.config.js

# Construir a aplicação
RUN npm run build

# Imagem de produção
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Definir variáveis de ambiente
ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Copiar arquivos necessários
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expor a porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
