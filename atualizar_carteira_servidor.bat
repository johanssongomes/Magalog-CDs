@echo off
chcp 65001 > nul
setlocal
cd /d "%~dp0"
title Sincronizador Magalog Carteira Oracle MLPDW -^> Supabase
color 0B

echo ======================================================================
echo   MAGALOG CDs - PCP J'S MARTINS
echo   Sincronizador Oracle MLPDW -^> Supabase
echo ======================================================================
echo.

:: 1. Verifica se Python esta instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERRO] Python nao foi encontrado no PATH do sistema.
    echo Certifique-se de ter o Python instalado neste servidor.
    echo.
    pause
    exit /b 1
)

:: 2. Garante dependencias necessarias instaladas
echo [*] Verificando dependencias necessarias (requests, oracledb, pyodbc)...
python -c "import requests, oracledb, pyodbc" >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Instalando bibliotecas necessarias para comunicacao...
    pip install requests oracledb pyodbc --quiet
)

:: 3. Executa o script python imediatamente sem menus ou pausas
set "SCRIPT_FILE=%~dp0sincronizador_servidor.py"
if not exist "%SCRIPT_FILE%" (
    set "SCRIPT_FILE=%~dp0scripts\standalone_oracle_sync.py"
)

if not exist "%SCRIPT_FILE%" (
    color 0C
    echo [ERRO] O arquivo sincronizador_servidor.py nao foi encontrado na mesma pasta!
    echo Certifique-se de copiar ambos os arquivos (atualizar_carteira_servidor.bat e sincronizador_servidor.py).
    echo.
    pause
    exit /b 1
)

echo [*] Iniciando Sincronizacao da Carteira e ativando Modo Sentinela...
echo.
python "%SCRIPT_FILE%"

echo.
echo ======================================================================
pause
