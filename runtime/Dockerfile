# Kyntrix Runtime Daemon
# Multi-stage build for minimal production image

# Stage 1: Build environment
FROM ubuntu:22.04 AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libcap-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy source files
COPY . /build/src/

# Build the daemon
WORKDIR /build/src
RUN cmake -B build -S . \
    -DCMAKE_BUILD_TYPE=Release \
    && cmake --build build --parallel $(nproc)

# Stage 2: Runtime environment
FROM ubuntu:22.04 AS runner

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libcap2 \
    python3 \
    python3-pip \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install OpenTelemetry auto-instrumentation for Python
RUN pip3 install --no-cache-dir \
    opentelemetry-distro \
    opentelemetry-exporter-otlp \
    && opentelemetry-bootstrap -a install

# Install OpenTelemetry auto-instrumentation for Node.js
RUN npm install -g \
    @opentelemetry/auto-instrumentations-node \
    @opentelemetry/exporter-trace-otlp-http

# Create non-root user for running isolated containers
RUN useradd -r -s /bin/false kyntrix

# Copy the built daemon
COPY --from=builder /build/src/build/runtime/daemon/kyntrixd /usr/local/bin/
COPY --from=builder /build/src/build/runtime/container/libkyntrix_container.a /usr/local/lib/

# Create directories for container rootfs and workspaces
RUN mkdir -p /var/lib/kyntrix/rootfs \
    && mkdir -p /var/lib/kyntrix/workspaces \
    && chown -R kyntrix:kyntrix /var/lib/kyntrix

# The daemon needs CAP_SYS_ADMIN for namespace operations
# This must be granted at container runtime with --cap-add=SYS_ADMIN

EXPOSE 9090

ENV KYNTRIX_OTLP_ENDPOINT=http://agents:4318/v1/traces
ENV KYNTRIX_WORKSPACE_DIR=/var/lib/kyntrix/workspaces

CMD ["/usr/local/bin/kyntrixd"]
