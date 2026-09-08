# nginx.conf is a full configuration (worker_processes, events, http), so it
# belongs at /etc/nginx/nginx.conf. The previous image copied it into conf.d/,
# where it is included *inside* the http block and is not valid — it only
# worked because docker-compose bind-mounted the same file over the real path.
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
