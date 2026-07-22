# syntax=docker/dockerfile:1

FROM maven:3.9.16-eclipse-temurin-21-noble@sha256:2b4496088e7b80ae10a8c9f74e574ea21380325a006ec684532ad6bad5bc7273 AS build

WORKDIR /workspace/apps/server

COPY apps/server/ ./
COPY contracts/ /workspace/contracts/

ARG IMPLEMENTATION_VERSION

RUN test -n "${IMPLEMENTATION_VERSION}" \
    && PROJECT_VERSION="$(mvn -q -DforceStdout -Dstyle.color=never help:evaluate -Dexpression=project.version)" \
    && test "${PROJECT_VERSION}" = "${IMPLEMENTATION_VERSION}" \
    && mvn -B -ntp -DskipTests clean package

FROM registry.access.redhat.com/ubi9/openjdk-21-runtime:1.23@sha256:14e5af876865b25abdc15c137dd30e68b3394aaee18e26bd1777036a52a907c5

ARG IMPLEMENTATION_VERSION

RUN test -n "${IMPLEMENTATION_VERSION}"

LABEL org.opencontainers.image.title="Stateless ECA Rule Engine"
LABEL org.opencontainers.image.description="Quarkus HTTP service for deterministic stateless ECA evaluation"
LABEL org.opencontainers.image.version="${IMPLEMENTATION_VERSION}"

WORKDIR /deployments

COPY --chown=185:0 --from=build /workspace/apps/server/cli/target/quarkus-app/ /deployments/
COPY --chown=185:0 contracts/conformance/models/reference-model.json /opt/eca/models/reference-model.json

ENV ECA_MODEL_PATH=/opt/eca/models/reference-model.json

EXPOSE 8080

USER 185

ENTRYPOINT ["java", "-jar", "/deployments/quarkus-run.jar", "start"]
