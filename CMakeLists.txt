cmake_minimum_required(VERSION 3.20)

project(Kyntrix
    VERSION 0.1.0
    DESCRIPTION "Kyntrix Runtime: daemon, container namespace helpers"
    LANGUAGES C CXX
)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)


if(CMAKE_CXX_COMPILER_ID MATCHES "Clang|GNU")
    add_compile_options(-Wall -Wextra -Wpedantic)
endif()


add_subdirectory(runtime)
