@echo off
chcp 65001 > nul
title Sincronizador Magalog Carteira Oracle MLPDW -^> Supabase
color 0B

echo ======================================================================
echo   MAGALOG CDs - PCP J'S MARTINS
echo   Sincronizador Autonomo Oracle MLPDW -^> Supabase
echo ======================================================================
echo.

:: 1. Verifica se Python esta instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERRO] Python nao foi encontrado no PATH do sistema.
    echo Por favor, instale o Python ou certifique-se de que ele esta no PATH.
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

:: 3. Localiza o script Python (mesma pasta ou scripts\standalone_oracle_sync.py)
set "SCRIPT_FILE=%~dp0sincronizador_servidor.py"
if not exist "%SCRIPT_FILE%" (
    set "SCRIPT_FILE=%~dp0scripts\standalone_oracle_sync.py"
)
if not exist "%SCRIPT_FILE%" (
    set "SCRIPT_FILE=%~dp0standalone_oracle_sync.py"
)

if not exist "%SCRIPT_FILE%" (
    echo [*] Gerando script executavel autossuficiente em arquivo temporario...
    set "SCRIPT_FILE=%TEMP%\magalog_sync_carteira.py"
    powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/johanssongomes/Magalog-CDs/main/scripts/standalone_oracle_sync.py' -OutFile '%TEMP%\magalog_sync_carteira.py'" 2>nul
)

if not exist "%SCRIPT_FILE%" (
    echo [ERRO] Nao foi possivel localizar nem baixar o script standalone_oracle_sync.py.
    echo Certifique-se de ter conexao com a internet.
    pause
    exit /b 1
)

:: 4. Menu de Opcoes
echo.
echo Escolha o modo de execucao:
echo.
echo  [1] Sincronizar Carteira AGORA (execucao unica)
echo  [2] Iniciar MODO SENTINELA (fica ouvindo cliques do site na barra de tarefas)
echo  [3] Sincronizar AGORA e MANTER SENTINELA ATIVO (Recomendado)
echo.
echo Executando opcao 3 automaticamente em 5 segundos...
choice /c 123 /n /t 5 /d 3 /m "Digite 1, 2 ou 3 [Padrao: 3]: "
set OPCAO=%errorlevel%

echo.
if "%OPCAO%"=="1" (
    echo [*] Iniciando Sincronizacao Imediata...
    python "%SCRIPT_FILE%" --now
) else if "%OPCAO%"=="2" (
    echo [*] Iniciando Modo Sentinela...
    python "%SCRIPT_FILE%" --watch
) else (
    echo [*] Iniciando Modo Hibrido (Sincroniza Agora + Sentinela)...
    python "%SCRIPT_FILE%" --hybrid
)

echo.
echo ======================================================================
pause
