cmake_minimum_required(VERSION 3.20)

project(kyntrix_agent_core
    VERSION 0.1.0
    DESCRIPTION "Kyntrix Agent Core: telemetry collection library"
    LANGUAGES CXX
)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find libcurl
find_package(CURL REQUIRED)

# Agent core library sources
set(AGENT_CORE_SOURCES
    src/agent_core.cpp
    src/logging.cpp
)

# Build as shared library for FFI usage
add_library(kyntrix_agent SHARED ${AGENT_CORE_SOURCES})

target_include_directories(kyntrix_agent
    PUBLIC
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
        $<INSTALL_INTERFACE:include>
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/src
)

target_link_libraries(kyntrix_agent
    PRIVATE
        CURL::libcurl
        pthread
)

# Set library output name
set_target_properties(kyntrix_agent PROPERTIES
    OUTPUT_NAME "kyntrix_agent"
    VERSION ${PROJECT_VERSION}
    SOVERSION 1
)

# Also build static library for embedding
add_library(kyntrix_agent_static STATIC ${AGENT_CORE_SOURCES})

target_include_directories(kyntrix_agent_static
    PUBLIC
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
        $<INSTALL_INTERFACE:include>
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/src
)

target_link_libraries(kyntrix_agent_static
    PRIVATE
        CURL::libcurl
        pthread
)

# Install targets
install(TARGETS kyntrix_agent kyntrix_agent_static
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
)

install(DIRECTORY include/
    DESTINATION include
)
