@echo off
echo Starting all EnglishX microservices...
echo.
start "EnglishX - Frontend (Port 3000)" cmd /k "cd /d "%~dp0frontend" && npm run dev"
start "EnglishX - Core API (Port 3001)" cmd /k "cd /d "%~dp0ms1-core-api" && npm run dev"
start "EnglishX - Speech Agent (Port 8000)" cmd /k "cd /d "%~dp0ms2-speech-agent" && .\.venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"
echo.
echo =======================================================
echo  All EnglishX services are launching:
echo  1. Frontend Web App   - http://localhost:3000
echo  2. Core API Backend   - http://localhost:3001
echo  3. Voice Speech Agent - http://localhost:8000
echo =======================================================
echo Opening http://localhost:3000 in your browser...
echo.
timeout /t 3 /nobreak >nul
start http://localhost:3000
