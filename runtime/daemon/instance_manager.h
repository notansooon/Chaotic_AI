#pragma once
#include <string>
#include <unordered_map>

class InstanceManager {
public:
    static bool start_instance(const std::string& run_id,
                               const std::string& tmpl,
                               const std::string& workspace_path,
                               const std::string& entry_script);

    static bool stop_instance(const std::string& run_id);

private:
    static std::unordered_map<std::string, pid_t>& table();
};
