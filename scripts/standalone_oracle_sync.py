"""
Sincronizador Autônomo e Sentinela Unificado: Oracle MLPDW -> Supabase
"""
# Reutiliza o sincronizador_servidor.py
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

import sincronizador_servidor

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "--hybrid"
    if mode == "--now":
        result = sincronizador_servidor.sync_carteira()
        if not result.get("success"):
            sys.exit(1)
    elif mode == "--watch":
        sincronizador_servidor.sentinel_loop()
    else:
        sincronizador_servidor.sync_carteira()
        sincronizador_servidor.sentinel_loop()
