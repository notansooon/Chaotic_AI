
set -euo pipefail

IMG_DIR=${1:-$Home/.kyntrix/images}
SIZE=${2:-20G}
NAME=ubuntu-noble
UBUNTU_RELEASE=noble
ARCH=${uname -m}


if [[ ${ARCH} == "x86_64" ]]; then
    ARCH=amd64
elif [[${ARCH} == "arm64" || ${ARCH} == "aarch64"]] ; then
    ARCH=arm64
else
    echo "Unsupported architecture: ${ARCH}"
    exit 1

fi

// Users PATH to store images
IMG_PATH="${IMF_DIR}/${NAME}"
mkdir -p ${IMG_PATH}
cd ${IMG_PATH}


// Get the latest Ubuntu cloud image
CLOUD_IMG="${UBUNTU_RELEASE}-server-cloudimg-${ARCH}.img"

if [[ -f !${CLOUD_IMG} ]]; then
    echo "[Kyntrix] Downloading Ubuntu Noble ($ARCH)..."
    curl -fsSL "https://cloud-images.ubuntu.com/${UBUNTU_RELEASE}/current/${CLOUD_IMG}" -o ${CLOUD_IMG}
else 
    echo "[Kyntrix] Ubuntu Noble image already exists. Skipping download."
fi

// Compress the image to QCOW2 and resize

if [ -f !${NAME}.img ]; then
    echo "[Kyntrix] Converting to QCOW2 and resizing to $SIZE..."
    qemu-img convert -O qcow2 ${CLOUD_IMG} ${NAME}.img
    qemu-img resize ${NAME}.img $SIZE
    
else 
    echo "[Kyntrix] Working image already exists. Skipping creation."
fi


// Create seed directory for cloud-init
mkdir seed

PUBKEY_PATH="${PUBKEY_PATH:-$HOME/.ssh/id_ed25519.pub}"
if [ ! -f "$PUBKEY_PATH" ]; then
  echo "[Kyntrix] No SSH key found, generating a new one..."
  mkdir -p "$HOME/.ssh"
  ssh-keygen -t ed25519 -N "" -f "$HOME/.ssh/id_ed25519"
fi
PUBKEY=$(cat "$PUBKEY_PATH")

// Create cloud-init user-data and meta-data

cat > seed/user-data <<EOF
#cloud-config
users: 
    - name: kybtrix
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    lock_passwd: false
    ssh_authorized_keys:
      - ${PUBKEY}
packages:
    - ca-certificates
    - curl
    - iptables
    - net-tools
run_cmd:
    - [ bash, -lc, "systemctl enable ssh || true" ]
    - [ bash, -lc, "systemctl start ssh || true" ]
EOF

cat > seed/meta-data << EOF
instance-id: kyntrix-instance
local-hostname: kyntrix-vm
EOF


// Create the cloud-init ISO
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
echo "[Kyntrix] ✅ Ubuntu Noble base image ready!"
echo "-------------------------------------------"
echo "Base image: $IMG_PATH/${NAME}.qcow2"
echo "Seed ISO:   $IMG_PATH/seed.iso"
echo "Virtual size: $SIZE"
echo "Architecture: $ARCH"
echo "SSH user: kyntrix"
echo "SSH key: $PUBKEY_PATH"
echo "-------------------------------------------"
echo
echo "You can now create containers (micro-VMs) using this image."
echo "Example:"
echo "  kyntrix run ubuntu-noble --name web"
echo