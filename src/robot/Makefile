# Simple Makefile for e-puck2 robot server

.PHONY: install run clean test lint

# Install dependencies
install:
	pip install -r requirements.txt

# Run the server
run:
	python start_server.py

# Run with debug logging
debug:
	LOG_LEVEL=DEBUG python start_server.py

# Clean up generated files
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	rm -rf logs/

# Run basic checks
lint:
	python -m py_compile main.py start_server.py
	python -m py_compile domain/*.py
	python -m py_compile application/*.py
	python -m py_compile infrastructure/*.py

# Show help
help:
	@echo "Available targets:"
	@echo "  install  - Install Python dependencies"
	@echo "  run      - Start the robot server"
	@echo "  debug    - Start server with debug logging"
	@echo "  clean    - Remove generated files"
	@echo "  lint     - Basic syntax checking"
	@echo "  help     - Show this help message"