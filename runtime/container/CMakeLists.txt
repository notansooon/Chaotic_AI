add_library( kyntrix_container
    ct_image.cpp
    ct_mount.cpp
    ct_namespace.cpp
    
)

target_include_directories(kyntrix_container
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
)