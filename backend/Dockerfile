# =============================================
# TechStore Backend - Dockerfile
# Node.js 18 Alpine (imagen liviana)
# =============================================

FROM node:18-alpine

# Directorio de trabajo en el contenedor
WORKDIR /app

# Copiar archivos de dependencias primero (cache de capas)
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --omit=dev

# Copiar el código fuente
COPY . .

# Exponer el puerto de la API
EXPOSE 3000

# Comando de inicio
CMD ["node", "src/app.js"]
