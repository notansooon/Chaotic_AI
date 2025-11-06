
set -euo pipefail

# Usage: ./build_img.sh [IMG_DIR=~/.kyntrix/images] [SIZE=20G]
IMG_DIR="${1:-$HOME/.kyntrix/images}"
SIZE="${2:-20G}"

NAME="ubuntu-noble"           
UBUNTU_RELEASE="noble"

# Detect host arch → map to Ubuntu cloud image arch labels
ARCH="$(uname -m)"

if [[ "$ARCH" == "x86_64" ]]; then
  ARCH_DL="amd64"
elif [[ "$ARCH" == "arm64" || "$ARCH" == "aarch64" ]]; then
  ARCH_DL="arm64"
else
  echo "Unsupported architecture: $ARCH"
  exit 1
fi

# Where we store the artifacts
IMG_PATH="${IMG_DIR}/${NAME}"
mkdir -p "${IMG_PATH}"
cd "${IMG_PATH}"

# Remote cloud image name (Ubuntu official cloud image)
CLOUD_IMG="${UBUNTU_RELEASE}-server-cloudimg-${ARCH_DL}.img"

# Download if missing
if [[ ! -f "${CLOUD_IMG}" ]]; then

  echo "[Kyntrix] Downloading Ubuntu ${UBUNTU_RELEASE} (${ARCH_DL})..."
  curl -fSL "https://cloud-images.ubuntu.com/${UBUNTU_RELEASE}/current/${CLOUD_IMG}" -o "${CLOUD_IMG}"
else
  echo "[Kyntrix] Ubuntu image already exists. Skipping download."
fi

# Convert to QCOW2 working image and resize (idempotent)
WORK_QCOW="${NAME}.qcow2"
if [[ ! -f "${WORK_QCOW}" ]]; then
  echo "[Kyntrix] Converting to QCOW2 and resizing to ${SIZE}..."
  qemu-img convert -O qcow2 "${CLOUD_IMG}" "${WORK_QCOW}"
  qemu-img resize "${WORK_QCOW}" "${SIZE}"
else
  echo "[Kyntrix] Working QCOW2 already exists. Skipping creation."
fi

# Cloud-init seed (for first-boot provisioning)
mkdir seed

# Ensure SSH key exists
PUBKEY_PATH="${PUBKEY_PATH:-$HOME/.ssh/id_ed25519.pub}"
if [[ ! -f "$PUBKEY_PATH" ]]; then
  echo "[Kyntrix] No SSH key found, generating a new one..."
  mkdir -p "$HOME/.ssh"
  ssh-keygen -t ed25519 -N "" -f "$HOME/.ssh/id_ed25519"
fi
PUBKEY="$(cat "$PUBKEY_PATH")"

# user-data (cloud-init) — note: runcmd is the correct key, user name fixed
cat > seed/user-data <<EOF
#cloud-config
preserve_hostname: false
hostname: kyntrix-vm
ssh_pwauth: false
users:
  - name: kyntrix
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    lock_passwd: false
    ssh_authorized_keys:
      - ${PUBKEY}
package_update: true
packages:
  - ca-certificates
  - curl
  - iptables
  - net-tools
runcmd:
  - [ bash, -lc, "systemctl enable ssh || true" ]
  - [ bash, -lc, "systemctl start ssh || true" ]
EOF

cat > seed/meta-data <<EOF
instance-id: kyntrix-instance
local-hostname: kyntrix-vm
EOF

# Build seed.iso (prefer cloud-localds; fallback to genisoimage/mkisofs)
if command -v cloud-localds >/dev/null 2>&1; then
  echo "[Kyntrix] Creating seed.iso with cloud-localds..."
  cloud-localds -v seed.iso seed/user-data seed/meta-data
else
  echo "[Kyntrix] Creating seed.iso with genisoimage/mkisofs..."
  if command -v genisoimage >/dev/null 2>&1; then
    genisoimage -quiet -output seed.iso -volid cidata -joliet -rock seed
  else
    mkisofs -quiet -o seed.iso -V cidata -J -R seed
  fi
fi

echo
echo "[Kyntrix] ✅ Ubuntu ${UBUNTU_RELEASE^} base image ready!"
echo "-------------------------------------------"
echo "Base QCOW2 : ${IMG_PATH}/${WORK_QCOW}"
echo "Seed ISO   : ${IMG_PATH}/seed.iso"
echo "Virtual sz : ${SIZE}"
echo "Host arch  : ${ARCH} (Ubuntu arch: ${ARCH_DL})"
echo "SSH user   : kyntrix"
echo "SSH key    : ${PUBKEY_PATH}"
echo "-------------------------------------------"
echo "Example QEMU boot (host networking fwd 2222→22):"
echo "  qemu-system-$( [[ \"$ARCH\" == \"arm64\" || \"$ARCH\" == \"aarch64\" ]] && echo aarch64 || echo x86_64 ) \\"
echo "    -m 2048 -cpu host -drive file=${WORK_QCOW},if=virtio,format=qcow2 \\"
echo "    -drive file=seed.iso,if=virtio,format=raw \\"
echo "    -nic user,model=virtio,hostfwd=tcp::2222-:22 -nographic -serial mon:stdio"
echo
