

#ifdef __linux__

#define _GNU_SOURCE
#include "ct_namespace.h"
#include "ct_mount.h"
#include "ct_image.h"
#include <sched.h>
#include <sys/wait.h>
#include <unistd.h>
#include <vector>
#include <string>

static int container_child_main(void* arg);

struct ContainerArgs {
    ContainerTemplate tmpl;
    std::string run_id;
    std::string workspace_path;
    std::string entry_script;
    std::string rootfs_path;
};




pid_t spawn_container(ContainerTemplate tmpl,
                      const std::string& run_id,
                      const std::string& workspace_path,
                      const std::string& entry_script) {
    ContainerArgs* cargs = new ContainerArgs;
    cargs->tmpl          = tmpl;
    cargs->run_id        = run_id;
    cargs->workspace_path = workspace_path;
    cargs->entry_script  = entry_script;

    // Prepare rootfs 
    cargs->rootfs_path   = prepare_rootfs_for_template(tmpl);

    // Allocate stack for clone
    const int stack_size = 1024 * 1024;
    void* stack = ::malloc(stack_size);
    void* stack_top = (char*)stack + stack_size;

    int flags = CLONE_NEWNS | CLONE_NEWPID | CLONE_NEWNET | SIGCHLD;

    pid_t child_pid = ::clone(container_child_main, stack_top, flags, cargs);
    if (child_pid < 0) {
        ::free(stack);
        delete cargs;
        return -1;
    }

    // Parent returns child PID (init of container)
    return child_pid;
}

static int container_child_main(void* arg) {
    std::unique_ptr<ContainerArgs> cargs((ContainerArgs*)arg);

    // Mount & pivot_root into rootfs
    if (!setup_rootfs_and_mounts(cargs->rootfs_path, cargs->workspace_path)) {
        return 1;
    }

    
    ::setenv("KYNTRIX_RUN_ID", cargs->run_id.c_str(), 1);
    ::setenv("KYNTRIX_INGEST_URL", "http://agents:8081/ingest/tal", 1);
    ::setenv("KYNTRIX_BATCH_SIZE", "100", 1);
    ::setenv("KYNTRIX_FLUSH_INTERVAL", "1000", 1);

    
    std::vector<char*> argv;

    if (cargs->tmpl == ContainerTemplate::Node) {
        
        ::setenv("NODE_OPTIONS", "--require /opt/kyntrix/node-embedded/dist/autoHook.js", 1);

        argv.push_back((char*)"node");
        argv.push_back((char*)("/workspace/" + cargs->entry_script).c_str());
        argv.push_back(nullptr);
    } else {
        
        argv.push_back((char*)"python");
        argv.push_back((char*)"-m");
        argv.push_back((char*)"kyntrix_agent.autohook");
        argv.push_back((char*)("/workspace/" + cargs->entry_script).c_str());
        argv.push_back(nullptr);
    }

    
    ::execvp(argv[0], argv.data());
    
    return 1;
}



#endif // __linux__