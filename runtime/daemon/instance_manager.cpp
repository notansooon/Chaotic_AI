// runtime/daemon/instance_manager.cpp
#include "instance_manager.h"
#include "ct_namespace.h"
#include <sys/types.h>
#include <signal.h>

std::unordered_map<std::string, pid_t>& InstanceManager::table() {
    static std::unordered_map<std::string, pid_t> t;
    return t;
}

bool InstanceManager::start_instance(const std::string& run_id, const std::string& tmpl, 
           const std::string& workspace_path, const std::string& entry_script) {
    
    ContainerTemplate ct;
    if (tmpl == "node") {
        ct = ContainerTemplate::Node;
    } else {
        ct = ContainerTemplate::Python;
    }

    pid_t pid = spawn_container(ct, run_id, workspace_path, entry_script);
    if (pid <= 0) return false;

    table()[run_id] = pid;
    return true;
}

bool InstanceManager::stop_instance(const std::string& run_id) {
    auto& t = table();
    auto it = t.find(run_id);
    if (it == t.end()) return false;

    ::kill(it->second, SIGTERM);
    t.erase(it);
    return true;
}
