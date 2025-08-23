#!/bin/bash

# Pi Zero W System Check Script
# Checks hardware compatibility, installed software, and Python support

echo "======================================"
echo "Pi Zero W System Compatibility Check"
echo "======================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status="$1"
    shift
    local message="$*"
    case "$status" in
        "OK")
            echo -e "[${GREEN}OK${NC}] $message"
            ;;
        "WARN")
            echo -e "[${YELLOW}WARN${NC}] $message"
            ;;
        "FAIL")
            echo -e "[${RED}FAIL${NC}] $message"
            ;;
        "INFO")
            echo -e "[${BLUE}INFO${NC}] $message"
            ;;
    esac
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get file size in human readable format
get_size() {
    if [ -f "$1" ] || [ -d "$1" ]; then
        du -sh "$1" 2>/dev/null | cut -f1
    else
        echo "N/A"
    fi
}

echo "🔍 HARDWARE INFORMATION"
echo "========================================"

# Basic system info
print_status "INFO" "Hostname: $(hostname)"
print_status "INFO" "Kernel: $(uname -r)"
print_status "INFO" "Architecture: $(uname -m)"

# CPU info
cpu_model=$(grep "model name" /proc/cpuinfo | head -1 | cut -d: -f2 | xargs)
cpu_cores=$(grep -c ^processor /proc/cpuinfo)
print_status "INFO" "CPU: $cpu_model ($cpu_cores cores)"

# Memory info
total_mem=$(grep MemTotal /proc/meminfo | awk '{print $2}')
total_mem_mb=$((total_mem / 1024))
available_mem=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
available_mem_mb=$((available_mem / 1024))

print_status "INFO" "Total Memory: ${total_mem_mb}MB"
print_status "INFO" "Available Memory: ${available_mem_mb}MB"

if [ $total_mem_mb -lt 256 ]; then
    print_status "WARN" "Low memory detected. Python 3 may run slowly."
elif [ $total_mem_mb -ge 512 ]; then
    print_status "OK" "Sufficient memory for Python 3 development"
else
    print_status "OK" "Adequate memory for Python 3"
fi

# Storage info
echo
echo "💾 STORAGE INFORMATION"
echo "========================================"

# Root filesystem
root_info=$(df -h / | tail -1)
root_total=$(echo $root_info | awk '{print $2}')
root_used=$(echo $root_info | awk '{print $3}')
root_available=$(echo $root_info | awk '{print $4}')
root_percent=$(echo $root_info | awk '{print $5}' | sed 's/%//')

print_status "INFO" "Root filesystem: $root_used used / $root_total total ($root_available available)"

if [ "$root_percent" -gt 90 ]; then
    print_status "FAIL" "Storage critically low ($root_percent% used)"
elif [ "$root_percent" -gt 80 ]; then
    print_status "WARN" "Storage getting low ($root_percent% used)"
else
    print_status "OK" "Storage usage acceptable ($root_percent% used)"
fi

# Check available space (simple check in MB)
root_available_mb=$(df -m / | tail -1 | awk '{print $4}')
if [ "$root_available_mb" -gt 1000 ]; then
    print_status "OK" "Sufficient space for Python 3 installation (${root_available_mb}MB available)"
elif [ "$root_available_mb" -gt 500 ]; then
    print_status "WARN" "Limited space for Python 3 installation (${root_available_mb}MB available)"
else
    print_status "FAIL" "Insufficient space for Python 3 installation (${root_available_mb}MB available)"
fi

echo
echo "🐍 PYTHON INFORMATION"
echo "========================================"

# Python 2 check
if command_exists python2.7; then
    python2_version=$(python2.7 --version 2>&1)
    print_status "OK" "Python 2.7: $python2_version"

    # Check pip2
    if command_exists pip2.7; then
        pip2_version=$(pip2.7 --version | head -1)
        print_status "OK" "pip2.7: $pip2_version"
    else
        print_status "WARN" "pip2.7 not found"
    fi
elif command_exists python2; then
    python2_version=$(python2 --version 2>&1)
    print_status "OK" "Python 2: $python2_version"
else
    print_status "WARN" "Python 2 not found"
fi

# Python 3 check
if command_exists python3; then
    python3_version=$(python3 --version 2>&1)
    print_status "OK" "Python 3: $python3_version"

    # Check pip3
    if command_exists pip3; then
        pip3_version=$(pip3 --version | head -1)
        print_status "OK" "pip3: $pip3_version"
    else
        print_status "WARN" "pip3 not found"
    fi

    # Check venv module
    if python3 -m venv --help >/dev/null 2>&1; then
        print_status "OK" "venv module available"
    else
        print_status "WARN" "venv module not available"
    fi

    PYTHON3_AVAILABLE=true
else
    print_status "FAIL" "Python 3 not installed"
    PYTHON3_AVAILABLE=false
fi

# Default python
if command_exists python; then
    default_python=$(python --version 2>&1)
    print_status "INFO" "Default python: $default_python"
else
    print_status "WARN" "No default 'python' command found"
fi

echo
echo "📦 PACKAGE MANAGEMENT"
echo "========================================"

# APT check
if command_exists apt; then
    print_status "OK" "APT package manager available"

    # Check if we can sudo
    if sudo -n true 2>/dev/null; then
        print_status "OK" "Sudo access confirmed"
    else
        print_status "WARN" "Sudo may require password"
    fi
else
    print_status "FAIL" "APT package manager not found"
fi

# Check for common development tools
if command_exists gcc; then
    gcc_version=$(gcc --version | head -1)
    print_status "OK" "GCC compiler: $gcc_version"
else
    print_status "WARN" "GCC compiler not found (needed for some Python packages)"
fi

if command_exists make; then
    make_version=$(make --version | head -1)
    print_status "OK" "Make: $make_version"
else
    print_status "WARN" "Make not found"
fi

if command_exists git; then
    git_version=$(git --version)
    print_status "OK" "Git: $git_version"
else
    print_status "WARN" "Git not found"
fi

echo
echo "🔌 HARDWARE INTERFACES"
echo "========================================"

# GPIO check
if [ -d "/sys/class/gpio" ]; then
    print_status "OK" "GPIO interface available"
else
    print_status "WARN" "GPIO interface not found"
fi

# I2C check
if [ -c "/dev/i2c-1" ]; then
    print_status "OK" "I2C interface available (/dev/i2c-1)"
elif [ -c "/dev/i2c-0" ]; then
    print_status "OK" "I2C interface available (/dev/i2c-0)"
else
    print_status "WARN" "I2C interface not found"
fi

# SPI check
if [ -c "/dev/spidev0.0" ]; then
    print_status "OK" "SPI interface available"
else
    print_status "WARN" "SPI interface not found"
fi

# Check for common Pi packages
echo
echo "🥧 RASPBERRY PI PACKAGES"
echo "========================================"

# Check for Pi-specific packages
if dpkg -l | grep -q raspberrypi-kernel; then
    print_status "OK" "Raspberry Pi kernel packages installed"
else
    print_status "WARN" "Raspberry Pi kernel packages not found"
fi

if command_exists raspi-config; then
    print_status "OK" "raspi-config available"
else
    print_status "WARN" "raspi-config not found"
fi

# Check for Pi GPIO libraries
python_libs_to_check=(
    "RPi.GPIO"
    "gpiozero"
    "picamera"
)

echo
echo "🐍 PYTHON LIBRARIES CHECK"
echo "========================================"

for lib in "${python_libs_to_check[@]}"; do
    if python3 -c "import $lib" 2>/dev/null; then
        print_status "OK" "Python 3: $lib installed"
    else
        print_status "INFO" "Python 3: $lib not installed"
    fi
done

echo
echo "🌐 NETWORK CONFIGURATION"
echo "========================================"

# Network interfaces
ip_addresses=$(hostname -I 2>/dev/null || echo "Not available")
print_status "INFO" "IP addresses: $ip_addresses"

# Check for specific Pi Zero W network interface
if ip link show | grep -q wlan0; then
    print_status "OK" "WiFi interface (wlan0) detected"

    # Check if connected
    if iwgetid -r 2>/dev/null; then
        connected_ssid=$(iwgetid -r)
        print_status "OK" "Connected to WiFi: $connected_ssid"
    else
        print_status "WARN" "WiFi not connected"
    fi
else
    print_status "WARN" "WiFi interface not found"
fi

echo
echo "📊 SUMMARY AND RECOMMENDATIONS"
echo "========================================"

# Overall assessment
total_issues=0
critical_issues=0

# Memory check
if [ $total_mem_mb -lt 256 ]; then
    ((critical_issues++))
fi

# Storage check
if [ "$root_percent" -gt 90 ]; then
    ((critical_issues++))
elif [ "$root_percent" -gt 80 ]; then
    ((total_issues++))
fi

# Python 3 availability
if [ "$PYTHON3_AVAILABLE" = true ]; then
    print_status "OK" "System is compatible with Python 3 development"
else
    print_status "FAIL" "Python 3 not available - installation required"
    ((critical_issues++))
fi

echo
if [ $critical_issues -eq 0 ]; then
    if [ "$PYTHON3_AVAILABLE" = true ]; then
        print_status "OK" "System ready for Python 3 development!"
    else
        echo -e "${YELLOW}RECOMMENDATION:${NC} Install Python 3 for better compatibility and features"
        echo
        echo "Would you like to install Python 3 now? (y/N)"
        read -r response
        case "$response" in
            [yY][eS]|[yY])
                echo "Installing Python 3..."
                sudo apt update
                sudo apt install -y python3 python3-pip python3-venv python3-dev
                echo "Python 3 installation completed!"
                ;;
            *)
                echo "Python 3 installation skipped."
                ;;
        esac
    fi
else
    print_status "WARN" "Found $critical_issues critical issues that should be addressed"
    echo
    echo "Critical issues to resolve:"
    if [ $total_mem_mb -lt 256 ]; then
        echo "  - Insufficient memory (< 256MB)"
    fi
    if [ "$root_percent" -gt 90 ]; then
        echo "  - Storage critically low ($root_percent% used)"
    fi
    if [ "$PYTHON3_AVAILABLE" = false ]; then
        echo "  - Python 3 not installed"
    fi
fi

echo
echo "Script completed. Check the output above for any issues."
echo "======================================"
