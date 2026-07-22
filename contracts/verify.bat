@echo off
setlocal

set "CONTRACTS_DIR=%~dp0"
set "VENV_PYTHON=%CONTRACTS_DIR%.venv\Scripts\python.exe"

if not exist "%VENV_PYTHON%" (
    set "VENV_PYTHON=%CONTRACTS_DIR%.venv\bin\python.exe"
)

if not exist "%VENV_PYTHON%" (
    echo Contract environment not found. 1>&2
    echo Run: python -m venv "%CONTRACTS_DIR%.venv" 1>&2
    echo Then install "%CONTRACTS_DIR%requirements.txt" using the environment's pip executable. 1>&2
    exit /b 1
)

"%VENV_PYTHON%" "%CONTRACTS_DIR%verify.py" %*
exit /b %ERRORLEVEL%
