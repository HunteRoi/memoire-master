# E-puck2 Robot Server Makefile
# Simple and clean commands for Raspbian Buster setup

# Variables
VENV_DIR = venv
PYTHON = python3.7
PIP = $(VENV_DIR)/bin/pip
PYTHON_VENV = $(VENV_DIR)/bin/python

.PHONY: install install-python venv venv-force config clean run help setup

# Install system dependencies (pyenv, opencv, gpio tools, smbus, etc.)
install:
	@echo "📦 Installing system dependencies..."
	sudo apt update
	@echo "Installing pyenv dependencies..."
	sudo apt install -y make build-essential libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev xz-utils tk-dev libffi-dev liblzma-dev
	@echo "Installing OpenCV system dependencies..."
	sudo apt install -y libopenblas-dev libatlas-base-dev libjpeg-dev libtiff5-dev libpng-dev
	sudo apt install -y libavcodec-dev libavformat-dev libswscale-dev libv4l-dev libxvidcore-dev libx264-dev
	@echo "Installing GPIO and I2C tools..."
	sudo apt install -y i2c-tools python3-smbus
	@echo "Installing SDL2 dependencies for pygame..."
	sudo apt install -y libsdl2-dev libsdl2-image-dev libsdl2-mixer-dev libsdl2-ttf-dev libfreetype6-dev libportmidi-dev
	@echo "Installing git (required for pyenv)..."
	sudo apt install -y git
	@echo "Installing pyenv..."
	@if [ ! -d "$(HOME)/.pyenv" ]; then \
		curl https://pyenv.run | bash; \
		echo 'export PYENV_ROOT="$$HOME/.pyenv"' >> ~/.bashrc; \
		echo 'command -v pyenv >/dev/null || export PATH="$$PYENV_ROOT/bin:$$PATH"' >> ~/.bashrc; \
		echo 'eval "$$(pyenv init -)"' >> ~/.bashrc; \
		echo "⚠️  Please run 'source ~/.bashrc' or restart your terminal after this command"; \
	else \
		echo "✅ pyenv already installed"; \
	fi
	@echo "✅ System dependencies installed"

# Install Python 3.7 using pyenv
install-python:
	@echo "🐍 Installing Python 3.7 with pyenv..."
	@if ! command -v pyenv >/dev/null 2>&1; then \
		echo "❌ pyenv not found. Please run 'make install' first and restart your terminal"; \
		exit 1; \
	fi
	@if pyenv versions | grep -q "3.7.17"; then \
		echo "✅ Python 3.7.17 already installed"; \
	else \
		echo "Installing Python 3.7.17..."; \
		pyenv install 3.7.17; \
	fi
	pyenv global 3.7.17
	@echo "✅ Python 3.7.17 set as global version"

# Create virtual environment and install requirements
venv:
	@if [ -d "$(VENV_DIR)" ]; then \
		echo "✅ Virtual environment already exists"; \
		echo "📦 Updating Python requirements..."; \
	else \
		echo "📁 Creating virtual environment..."; \
		$(PYTHON) -m venv $(VENV_DIR); \
		echo "📦 Installing Python requirements..."; \
	fi
	$(PIP) install --upgrade pip
	@echo "Configuring pip to use piwheels (pre-built wheels for Raspberry Pi)..."
	@mkdir -p $(VENV_DIR)/pip && cp pip.conf $(VENV_DIR)/pip/pip.conf
	@echo "Installing core requirements (using piwheels - no compilation needed!)..."
	$(PIP) install --only-binary=all -r requirements.txt
	@echo "Installing pygame (optional audio support)..."
	@if ! $(PIP) install --only-binary=all pygame>=2.0.0; then \
		echo "⚠️  pygame installation failed - audio file playback will not be available"; \
		echo "✅ Core robot functionality will work without pygame"; \
	else \
		echo "✅ pygame installed successfully - audio file playback available"; \
	fi
	@echo "✅ Virtual environment created and requirements installed"

# Force recreate virtual environment (removes existing one first)
venv-force:
	@echo "🔄 Force recreating virtual environment..."
	@if [ -d "$(VENV_DIR)" ]; then \
		echo "Removing existing virtual environment..."; \
		rm -rf $(VENV_DIR); \
	fi
	$(PYTHON) -m venv $(VENV_DIR)
	@echo "📦 Installing Python requirements..."
	$(PIP) install --upgrade pip
	@echo "Configuring pip to use piwheels (pre-built wheels for Raspberry Pi)..."
	mkdir -p $(VENV_DIR)/pip && cp pip.conf $(VENV_DIR)/pip/pip.conf
	@echo "Installing core requirements (using piwheels - no compilation needed!)..."
	$(PIP) install --only-binary=all -r requirements.txt
	@echo "Installing pygame (optional audio support)..."
	@if ! $(PIP) install --only-binary=all pygame>=2.0.0; then \
		echo "⚠️  pygame installation failed - audio file playback will not be available"; \
		echo "✅ Core robot functionality will work without pygame"; \
	else \
		echo "✅ pygame installed successfully - audio file playback available"; \
	fi
	@echo "✅ Virtual environment forcefully recreated and requirements installed"

# Create config file from example
config:
	@echo "⚙️  Creating configuration file..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ Created .env file from .env.example"; \
		echo "Edit .env file to customize your configuration"; \
	else \
		echo "⚠️  .env file already exists"; \
	fi

# Clean everything (venv, cache, config)
clean:
	@echo "🧹 Cleaning everything..."
	rm -rf $(VENV_DIR)
	rm -f .env
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	rm -rf logs/ 2>/dev/null || true
	@echo "✅ Everything cleaned"

# Run the robot server
run:
	@echo "🚀 Starting e-puck2 robot server..."
	@if [ ! -d "$(VENV_DIR)" ]; then \
		echo "❌ Virtual environment not found. Please run 'make venv' first"; \
		exit 1; \
	fi
	$(PYTHON_VENV) main.py

# Complete setup: install -> install-python -> venv -> config
setup: install install-python venv config
	@echo "🎉 Complete setup finished!"
	@echo "You can now run 'make run' to start the server"

# Show help
help:
	@echo "🤖 E-puck2 Robot Server - Makefile Commands"
	@echo ""
	@echo "📋 Available Commands:"
	@echo ""
	@echo "  install         Install system dependencies (pyenv, opencv, gpio tools, smbus, etc.)"
	@echo "  install-python  Install Python 3.7 using pyenv"
	@echo "  venv            Create/update virtual environment and install requirements"
	@echo "  venv-force      Force recreate virtual environment (removes existing one)"
	@echo "  config          Create configuration file from .env.example"
	@echo "  clean           Clean and delete everything (venv, cache, config)"
	@echo "  run             Start the robot server with venv"
	@echo "  help            Show this help message"
	@echo ""
	@echo "  setup           Run install -> install-python -> venv -> config (complete setup)"
	@echo ""
	@echo "💡 Quick Start:"
	@echo "  make setup      # Complete setup (first time)"
	@echo "  make run        # Start the server"
	@echo "  make clean      # Clean everything"
