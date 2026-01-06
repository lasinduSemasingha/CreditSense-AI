# Backend Startup Script for PowerShell
Write-Host "Starting Backend Server..." -ForegroundColor Cyan

# Navigate to backend directory
Set-Location $PSScriptRoot

# Activate virtual environment
if (Test-Path "venv\Scripts\Activate.ps1") {
    . .\venv\Scripts\Activate.ps1
    Write-Host "Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "Virtual environment not found. Please create it first." -ForegroundColor Red
    exit 1
}

# Start the FastAPI server
Write-Host "Starting FastAPI server on http://localhost:8000" -ForegroundColor Yellow
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000


