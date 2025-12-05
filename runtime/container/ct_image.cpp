#include "ct_image.h"
#include <string>




std::string prepare_rootfs_for_template(ContainerTemplate tmpl) {
    switch (tmpl) {
    case ContainerTemplate::Node:
        return "/var/lib/kyntrix/images/node-rootfs";
        break;
    case ContainerTemplate::Python:
        return "/var/lib/kyntrix/images/python-rootfs";
        break;
    default:
        throw std::runtime_error("Unknown container template");
        break;
    }
}