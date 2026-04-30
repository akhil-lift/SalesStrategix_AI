@echo off
title SalesStrategix AI - Setup & Launch
color 0A

echo ============================================
echo   SalesStrategix AI - Groq Edition
echo ============================================
echo.

echo [1/3] Activating virtual environment...
call venv\Scripts\activate.bat

echo [2/3] Installing Groq package...
pip install "langchain-groq>=0.2.0" --quiet
if %errorlevel% neq 0 (
    echo ERROR: Failed to install langchain-groq. Check your internet connection.
    pause
    exit /b 1
)
echo Done!

echo [3/3] Preparing launch...
echo.

:: Get Local IP using Python
for /f "tokens=*" %%i in ('python -c "import socket; print(socket.gethostbyname(socket.gethostname()))"') do set LOCAL_IP=%%i

echo ============================================
echo   CHOOSE VERSION TO RUN:
echo ============================================
echo   1. Streamlit (Modern UI - Default)
echo   2. Flask (API / Custom Templates)
echo ============================================
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="2" (
    echo.
    echo 🚀 Starting Flask Version...
    echo 🔗 Local Link:   http://127.0.0.1:5000
    echo 🔗 Network Link: http://%LOCAL_IP%:5000
    echo.
    python app_flask.py
) else (
    echo.
    echo 🚀 Starting Streamlit Version...
    echo 🔗 Local Link:   http://localhost:8501
    echo 🔗 Network Link: http://%LOCAL_IP%:8501
    echo.
    streamlit run app.py
)

pause
