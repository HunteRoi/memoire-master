# Simple Makefile for e-puck2 robot server

.PHONY: install run clean test lint config

# Install dependencies
install:
	pip2.7 install -r requirements.txt

# Create .env file from .env.example
config:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env file from .env.example"; \
		echo "Edit .env file to customize your configuration"; \
	else \
		echo ".env file already exists - use 'make config-force' to overwrite"; \
	fi

# Force create .env file (overwrites existing)
config-force:
	cp .env.example .env
	@echo "Created .env file from .env.example (overwrote existing)"
	@echo "Edit .env file to customize your configuration"

# Run the server
run:
	python2.7 start_server.py

# Run with debug logging
debug:
	LOG_LEVEL=DEBUG python2.7 start_server.py

# Clean up generated files
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	rm -rf logs/

# Run basic checks
lint:
	python2.7 -m py_compile main.py start_server.py websocket_server.py
	python2.7 -m py_compile config/*.py
	python2.7 -m py_compile application/*.py

# Show help
help:
	@echo "Available targets:"
	@echo "  install      - Install Python dependencies"
	@echo "  config       - Create .env file from .env.example"
	@echo "  config-force - Create .env file (overwrites existing)"
	@echo "  run          - Start the robot server"
	@echo "  debug        - Start server with debug logging"
	@echo "  clean        - Remove generated files"
	@echo "  lint         - Basic syntax checking"
	@echo "  help         - Show this help message"