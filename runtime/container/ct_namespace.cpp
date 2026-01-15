

#ifdef __linux__

#define _GNU_SOURCE
#include "ct_namespace.h"
#include "ct_mount.h"
#include "ct_image.h"
#include <sched.h>
#include <memory>
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
    std::string ingest_url;  // OTLP endpoint URL
};




pid_t spawn_container(ContainerTemplate tmpl,
                        const std::string& run_id,
                        const std::string& workspace_path,
                        const std::string& entry_script,
                        const std::string& ingest_url) {
    ContainerArgs* cargs = new ContainerArgs;
    cargs->tmpl          = tmpl;
    cargs->run_id        = run_id;
    cargs->workspace_path = workspace_path;
    cargs->entry_script  = entry_script;
    cargs->ingest_url    = ingest_url.empty() ? "http://localhost:4318" : ingest_url;

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

    // OpenTelemetry configuration
    ::setenv("OTEL_SERVICE_NAME", "user-script", 1);

    std::string resource_attrs = "kyntrix.run_id=" + cargs->run_id;
    ::setenv("OTEL_RESOURCE_ATTRIBUTES", resource_attrs.c_str(), 1);

    ::setenv("OTEL_EXPORTER_OTLP_ENDPOINT", cargs->ingest_url.c_str(), 1);
    ::setenv("OTEL_EXPORTER_OTLP_PROTOCOL", "http/json", 1);
    ::setenv("OTEL_BSP_SCHEDULE_DELAY", "100", 1);  // Flush every 100ms
    ::setenv("OTEL_TRACES_EXPORTER", "otlp", 1);
    ::setenv("OTEL_METRICS_EXPORTER", "none", 1);
    ::setenv("OTEL_LOGS_EXPORTER", "none", 1);

    // Build argv - need to keep strings alive until execvp
    std::vector<std::string> arg_strings;
    std::vector<char*> argv;

    if (cargs->tmpl == ContainerTemplate::Node) {
        // Node.js with OpenTelemetry auto-instrumentation
        ::setenv("NODE_OPTIONS", "--require @opentelemetry/auto-instrumentations-node/register", 1);

        arg_strings.push_back("node");
        arg_strings.push_back("/workspace/" + cargs->entry_script);
    } else {
        // Python with OpenTelemetry auto-instrumentation
        arg_strings.push_back("opentelemetry-instrument");
        arg_strings.push_back("python");
        arg_strings.push_back("/workspace/" + cargs->entry_script);
    }

    // Build argv from persistent strings
    for (auto& s : arg_strings) {
        argv.push_back(const_cast<char*>(s.c_str()));
    }
    argv.push_back(nullptr);

    ::execvp(argv[0], argv.data());

    return 1;
}



#endif // __linux__




