#!/bin/bash
# Wrapper script for task-master in WSL environment

export PATH="/home/conectaboi-dev/.nvm/versions/node/v22.19.0/bin:$PATH"
export NODE_PATH="/home/conectaboi-dev/.nvm/versions/node/v22.19.0/lib/node_modules"

# Execute task-master with all passed arguments
exec /home/conectaboi-dev/.nvm/versions/node/v22.19.0/bin/task-master "$@"