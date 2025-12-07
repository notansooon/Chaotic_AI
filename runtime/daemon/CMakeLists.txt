cmake_minimum_required(VERSION 3.16)
project(kyntrix_runtime LANGUAGES CXX)

# C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Default to Release if nothing is set
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release CACHE STRING "Build type" FORCE)
endif()

# ------------------------------------------------------------------
# Optional: nlohmann::json
# ------------------------------------------------------------------
# If you installed it via package manager and have a CMake config:
#   sudo apt install nlohmann-json3-dev
# then you can uncomment:
#
# find_package(nlohmann_json 3.2.0 QUIET)
#
# If not found, we just assume you have the single header in
# runtime/third_party/nlohmann/json.hpp and use include dirs instead.
# ------------------------------------------------------------------

# ------------------------------------------------------------------
# Container library (ct_namespace, ct_mount, ct_image)
# ------------------------------------------------------------------
add_library(kyntrix_container STATIC
    container/ct_namespace.cpp
    container/ct_mount.cpp
    container/ct_image.cpp
)

target_include_directories(kyntrix_container
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${CMAKE_CURRENT_SOURCE_DIR}/container
)

# ------------------------------------------------------------------
# Daemon support library (daemon_server, instance_manager)
# ------------------------------------------------------------------
add_library(kyntrix_daemon STATIC
    daemon/daemon_server.cpp
    daemon/instance_manager.cpp
)

target_include_directories(kyntrix_daemon
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${CMAKE_CURRENT_SOURCE_DIR}/daemon
        ${CMAKE_CURRENT_SOURCE_DIR}/container
        ${CMAKE_CURRENT_SOURCE_DIR}/third_party  # e.g. nlohmann/json.hpp
)

# If you successfully use find_package(nlohmann_json),
# you can link it like this:
#
# if (nlohmann_json_FOUND)
#   target_link_libraries(kyntrix_daemon PUBLIC nlohmann_json::nlohmann_json)
# endif()

# ------------------------------------------------------------------
# kyntrixd executable
# ------------------------------------------------------------------
add_executable(kyntrixd
    daemon/main.cpp
)

target_link_libraries(kyntrixd
    PRIVATE
        kyntrix_daemon
        kyntrix_container
        pthread   # for clone, threads etc.
)

# Optionally install
install(TARGETS kyntrixd
        RUNTIME DESTINATION bin)
