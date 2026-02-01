# Build stage
FROM alpine:3.19 AS builder

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    cmake \
    linux-headers \
    make \
    g++

WORKDIR /app

# Copy CMakeLists.txt first
COPY CMakeLists.txt ./

# Copy external dependencies (nlohmann json)
COPY external/ ./external/

# Copy runtime source code
COPY runtime/ ./runtime/

# List files to verify copy worked
RUN echo "=== Checking copied files ===" && \
    ls -la && \
    ls -la runtime/ && \
    ls -la runtime/daemon/ && \
    ls -la runtime/container/ && \
    ls -la external/nlohmann/

# Build the daemon
RUN mkdir -p build && cd build && \
    cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_VERBOSE_MAKEFILE=ON && \
    cmake --build . --target kyntrixd -j$(nproc)

# Production stage
FROM alpine:3.19 AS runner

# Install runtime dependencies
RUN apk add --no-cache \
    libstdc++ \
    libgcc

# Create directory for socket
RUN mkdir -p /var/run/kyntrix

WORKDIR /app

# Copy the built daemon binary
COPY --from=builder /app/build/runtime/daemon/kyntrixd /usr/local/bin/kyntrixd

# Make it executable
RUN chmod +x /usr/local/bin/kyntrixd

# The daemon needs to run as root for namespace operations
USER root

# Run the daemon with configurable socket path
CMD ["kyntrixd", "/var/run/kyntrix/daemon.sock"]
