
add_executable(kyntrixd
    main.cpp
    daemon_server.cpp
    instance_manager.cpp
)

target_include_directories(kyntrixd
    PRIVATE
        ${CMAKE_SOURCE_DIR}/external
)


target_link_libraries(kyntrixd
    PRIVATE
        kyntrix_container
)