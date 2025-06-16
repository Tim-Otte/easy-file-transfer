FROM node:lts-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build
RUN pnpm run build-server

FROM node:lts-slim
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/server
COPY --from=build /app/build /app/server/build
EXPOSE 3000
WORKDIR /app
CMD [ "node", "./server/src/server.js" ]