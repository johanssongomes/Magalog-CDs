@echo off
chcp 65001 > nul
cd /d "%~dp0"
title Sincronizador Unificado: Carteira PCP + Supply Lojas (Oracle MLPDW -> Supabase)
color 0B
echo ======================================================================
echo   MAGALOG CDs - SINCRONIZADOR UNIFICADO
echo   Oracle MLPDW ^> Supabase
echo   Ouvindo dois canais simultaneamente:
echo     [PCP]    Botao "Atualizar Carteira" do site
echo     [SUPPLY] Botao "Atualizar Base (Oracle)" do Supply
echo ======================================================================
echo.
python scripts\sync_pcp_oracle.py
echo.
echo ======================================================================
pause
