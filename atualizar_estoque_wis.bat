@echo off
chcp 65001 > nul
title Sincronizador de Estoque WIS50 - Magalog CDs
cd /d "%~dp0"

echo ============================================================
echo   SINCRONIZADOR DE ESTOQUE POR CATEGORIA (ORACLE WIS50)
echo ============================================================
echo.
echo Conectando via ODBC (DSN wis) e executando EstoqueCD.sql...
echo Aguarde, a consulta processa cerca de 22.000 posições de estoque...
echo.

python scripts\sync_estoque_wis.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo   ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!
    echo ============================================================
) else (
    echo.
    echo ============================================================
    echo   OCORREU UM ERRO NA ATUALIZAÇÃO. VERIFIQUE A CONEXÃO VPN.
    echo ============================================================
)

echo.
pause
