@echo off
chcp 65001 > nul
cd /d "%~dp0"
title Sincronizador Carteira Oracle MLPDW -> Supabase
color 0B
echo ======================================================================
echo   MAGALOG CDs - PCP J'S MARTINS
echo   Sincronizacao Direta: Oracle MLPDW -^> Supabase
echo ======================================================================
echo.
echo [1/3] Verificando conexao VPN e Oracle...
echo [2/3] Consultando query oficial da Carteira (53 colunas)...
echo [3/3] Atualizando tabela pcp_js_martins no Supabase e cache local...
echo.
python scripts\sync_pcp_oracle.py
echo.
echo ======================================================================
pause
