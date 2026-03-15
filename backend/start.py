"""Startup script that shows actual import errors before launching uvicorn."""
import sys
import os
import traceback

print("=== Python version:", sys.version)
print("=== Working directory:", os.getcwd())
print("=== Files in current dir:", os.listdir("."))

if os.path.exists("app"):
    print("=== Files in app/:", os.listdir("app"))
else:
    print("=== ERROR: 'app' directory NOT FOUND!")
    print("=== This means Root Directory is not set to 'backend' on Render")
    sys.exit(1)

try:
    print("=== Attempting: from app.main import app")
    from app.main import app
    print("=== SUCCESS: app imported correctly")
except Exception as e:
    print("=== IMPORT FAILED ===")
    traceback.print_exc()
    sys.exit(1)

# Start uvicorn
import uvicorn
port = int(os.environ.get("PORT", 8000))
print(f"=== Starting uvicorn on port {port}")
uvicorn.run(app, host="0.0.0.0", port=port)
