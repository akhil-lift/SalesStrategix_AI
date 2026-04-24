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

echo [3/3] Launching SalesStrategix AI...
echo.
echo App will open in your browser at http://localhost:8501
echo Press Ctrl+C in this window to stop the app.
echo.
streamlit run app.py

pause
