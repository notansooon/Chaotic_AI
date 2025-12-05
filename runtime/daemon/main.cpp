#include "daemon_server.h"
#include <iostream>


int main(int argc, char* argv[]) {
    std::cout << "Starting Kyntrix Daemon Server..." << std::endl;

    std::string socket_path = "/var/run/kyntrixd.sock";

    if (argc > 1) {
        socket_path = argv[1];
    }

    try {

        KyntrixDaemonServer server(socket_path);
        server.run();
    } 
    catch (const std::exception& ex) {
        std::cerr << "Daemon server error: " << ex.what() << std::endl;
        return 1;

    }
}