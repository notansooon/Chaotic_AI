#pragma once
#include <string>


enum class ContainerTemplate {
    Node,
    Python

};


pid_t spawn_container(ContainerTemplate ct,
                        const std::string& run_id,
                        const std::string& workspace_path,
                        const std::string& entry_script);

