"""Root-level startup for Render. Changes to backend/ directory then starts the app."""
import os
import sys
import subprocess

# Change to the backend directory
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

print(f"=== Working directory: {os.getcwd()}")
print(f"=== Python: {sys.version}")
print(f"=== Files: {os.listdir('.')}")

# Test import
try:
    from app.main import app
    print("=== Import OK")
except Exception as e:
    print(f"=== IMPORT ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Start uvicorn
import uvicorn
port = int(os.environ.get("PORT", 8000))
print(f"=== Starting on port {port}")
uvicorn.run(app, host="0.0.0.0", port=port)
