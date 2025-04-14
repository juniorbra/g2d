FROM node:18-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY package.json package-lock.json ./

# Instalar dependências
FROM base AS deps
# Instalar todas as dependências, incluindo as de desenvolvimento
RUN npm ci --include=dev

# Construir a aplicação
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Criar um arquivo .env.production com variáveis de ambiente vazias para o build
RUN echo "NEXT_PUBLIC_SUPABASE_URL=" > .env.production
RUN echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=" >> .env.production

# Executar o build
RUN npm run build

# Configurar a aplicação para produção
FROM base AS runner
ENV NODE_ENV production

# Criar usuário não-root para produção
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Mudar para o usuário não-root
USER nextjs

# Expor a porta
EXPOSE 3000

# Definir variáveis de ambiente
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
