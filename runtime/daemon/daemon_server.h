#pragma once
#include <string>

class KyntrixDaemonServer {
    public:
        explicit KyntrixDaemonServer(const std::string& socket_path);
        ~KyntrixDaemonServer();

        void run();

    private:
        int m_socket_fd;
        std::string m_socket_path;

        void handle_client(int client_fd);
           
};