// runtime/daemon/daemon_server.cpp
#include "daemon_server.h"
#include "instance_manager.h"
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>
#include <nlohmann/json.hpp>



using json = nlohmann::json;

KyntrixDaemonServer::KyntrixDaemonServer(const std::string& socket_path)
    : m_socket_fd(-1), m_socket_path(socket_path) {

    m_socket_fd = ::socket(AF_UNIX, SOCK_STREAM, 0);
    if (m_socket_fd < 0) {

        throw std::runtime_error("socket() failed");
    }
    
    ::unlink(socket_path.c_str());

    sockaddr_un addr{};

    addr.sun_family = AF_UNIX;

    std::strncpy(addr.sun_path, socket_path.c_str(), sizeof(addr.sun_path)-1);

    if (::bind(m_socket_fd, (sockaddr*)&addr, sizeof(addr)) < 0) {
        throw std::runtime_error("bind() failed");
    }
    if (::listen(m_socket_fd, 16) < 0) {
        throw std::runtime_error("listen() failed");
    }
}

KyntrixDaemonServer::~KyntrixDaemonServer() {
    if (m_socket_fd >= 0) ::close(m_socket_fd);
    ::unlink(m_socket_path.c_str());
}

void KyntrixDaemonServer::run() {
    

    while (true) {
        int client_fd = ::accept(m_socket_fd, nullptr, nullptr);
        if (client_fd < 0) {
            continue;
        }
        handle_client(client_fd); 
        ::close(client_fd);
    }
}

void KyntrixDaemonServer::handle_client(int client_fd) {
    // Naive: read whole request into buffer, assume <= 8k
    char buf[8192];
    ssize_t n = ::read(client_fd, buf, sizeof(buf));
    if (n <= 0) return;

    json req = json::parse(std::string(buf, n), nullptr, false);
    if (req.is_discarded()) {
        return;
    }

    std::string action = req.value("action", "");
    json resp;

    if (action == "start") {
        // { action, run_id, template, workspace_path, entry }
        std::string run_id = req.value("run_id", "");
        std::string tmpl   = req.value("template", "node");
        std::string ws     = req.value("workspace_path", "");
        std::string entry  = req.value("entry", "");

        bool ok = InstanceManager::start_instance(run_id, tmpl, ws, entry);
        resp["ok"] = ok;
    } else if (action == "stop") {
        std::string run_id = req.value("run_id", "");
        bool ok = InstanceManager::stop_instance(run_id);
        resp["ok"] = ok;
    } else {
        resp["ok"] = false;
        resp["error"] = "unknown action";
    }

    auto s = resp.dump();
    ::write(client_fd, s.data(), s.size());
}
