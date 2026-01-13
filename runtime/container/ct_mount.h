#pragma once
#include <string>

// Sets up rootfs with pivot_root and mounts workspace into container
// @param rootfs_path: Path to the rootfs template (e.g., /var/kyntrix/images/node)
// @param workspace_path: Path to user's workspace to bind mount at /workspace
bool setup_rootfs_and_mounts(const std::string& rootfs_path,
    const std::string& workspace_path);


