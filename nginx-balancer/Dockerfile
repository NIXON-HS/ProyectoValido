FROM nginx:alpine

# Copiar configuración personalizada
COPY nginx.conf /etc/nginx/nginx.conf

# Puerto que expondrá el contenedor (Render asigna el puerto via PORT env)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
