
#ifdef __linux__
#define _GNU_SOURCE
#include "ct_mount.h"

#include <sys/mount.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>

#include <string>
#include <iostream>

static bool ensure_dir(const char* path, mode_t mode = 0755) {
    struct stat st;
    if (::stat(path, &st) == 0) {

        if (S_ISDIR(st.st_mode)) {
            return true;
        }

        std::cerr << "Path exists but is not directory: " << path << "\n";
        return false;
    }
    if (::mkdir(path, mode) < 0) {
        std::cerr << "mkdir(" << path << ") failed: " << strerror(errno) << "\n";
        return false;
    }
    return true;
}

bool setup_rootfs_and_mounts(const std::string& rootfs_path, const std::string& workspace_path) {

    const char* new_root_mount = "/mnt/root";

    if (!ensure_dir(new_root_mount)) {
        return false;
    }

    if (::mount(rootfs_path.c_str(), new_root_mount, nullptr,
           MS_BIND | MS_REC, nullptr) < 0) {
        std::cerr << "mount(BIND " << rootfs_path << " -> " << new_root_mount
           << ") failed: " << strerror(errno) << "\n";
        return false;
    }

    if (::chdir(new_root_mount) < 0) {
        std::cerr << "chdir(" << new_root_mount << ") failed: " << strerror(errno) << "\n";
        return false;
    }

    const char* old_root = "old_root";
    if (!ensure_dir(old_root)) {
        return false;
    }

    if (::syscall(SYS_pivot_root, ".", old_root) < 0) {
        std::cerr << "pivot_root failed: " << strerror(errno) << "\n";
        return false;
    }

    if (::chdir("/") < 0) {
        std::cerr << "chdir(/) after pivot_root failed: " << strerror(errno) << "\n";
        return false;
    }

    if (!ensure_dir("/proc")) {
        return false;
    }
    if (::mount("proc", "/proc", "proc", 0, nullptr) < 0) {
        std::cerr << "mount(proc) failed: " << strerror(errno) << "\n";
        return false;
    }

    if (!ensure_dir("/sys")) {
        return false;
    }
    if (::mount("sysfs", "/sys", "sysfs", 0, nullptr) < 0) {
        std::cerr << "mount(sysfs) failed: " << strerror(errno) << "\n";
        return false;
    }

    if (!ensure_dir("/workspace")) {
        return false;
    }
    if (::mount(workspace_path.c_str(), "/workspace", nullptr,
                MS_BIND | MS_REC, nullptr) < 0) {
        std::cerr << "mount(BIND workspace " << workspace_path << " -> /workspace"
                  << ") failed: " << strerror(errno) << "\n";
        return false;
    }

    ensure_dir("/tmp", 01777);

    if (::umount2("/old_root", MNT_DETACH) < 0) {
        std::cerr << "umount2(/old_root) failed: " << strerror(errno) << "\n";
    }

    return true;
}


#endif // __linux__