import os
import sqlite3
import json
import urllib.request
import urllib.error

# Ler .env manualmente
env_vars = {}
if os.path.exists('.env'):
    with open('.env', 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env_vars[k.strip()] = v.strip()

SUPABASE_URL = env_vars.get("VITE_SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = env_vars.get("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_KEY:
    raise ValueError("SUPABASE_SERVICE_ROLE_KEY não configurada no .env")

REST_URL = f"{SUPABASE_URL}/rest/v1/pmt_records"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def sync_pmt():
    db_path = "prisma/dev.db"
    if not os.path.exists(db_path):
        print("dev.db não encontrado!")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            ano, mes, cd, dia, modal_agrupado, sigla, div_moveis, canal_venda, tipo_saida, modal,
            valor_plan_diario_cd, pedido_plan_diario_cd, cub_plan_diario_cd, pecas_plan_diario_cd,
            pedido_unico_plan_diario_cd, modal_saida, categoria, categoria_produtividade, plataforma_venda,
            versao, arquivo_origem
        FROM pmt_records
        ORDER BY ano, mes, id
    """)

    columns = [
        "ano", "mes", "cd", "dia", "modal_agrupado", "sigla", "div_moveis", "canal_venda", "tipo_saida", "modal",
        "valor_plan_diario_cd", "pedido_plan_diario_cd", "cub_plan_diario_cd", "pecas_plan_diario_cd",
        "pedido_unico_plan_diario_cd", "modal_saida", "categoria", "categoria_produtividade", "plataforma_venda",
        "versao", "arquivo_origem"
    ]

    print("Iniciando upload para o Supabase via urllib...")
    batch_size = 1500
    total_inserted = 0

    while True:
        rows = cur.fetchmany(batch_size)
        if not rows:
            break

        payload = []
        for r in rows:
            item = {}
            for i, col in enumerate(columns):
                val = r[i]
                if col in ["valor_plan_diario_cd", "pedido_plan_diario_cd", "cub_plan_diario_cd", "pecas_plan_diario_cd", "pedido_unico_plan_diario_cd"]:
                    item[col] = float(val) if val is not None else 0.0
                elif col in ["ano", "mes"]:
                    item[col] = int(val) if val is not None else 0
                else:
                    item[col] = str(val) if val is not None else None
            payload.append(item)

        json_data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(REST_URL, data=json_data, headers=headers, method='POST')
        
        try:
            with urllib.request.urlopen(req) as response:
                total_inserted += len(payload)
                print(f"Inseridos: {total_inserted} registros...")
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode('utf-8')
            print(f"Erro HTTP {e.code}: {err_msg}")
            break
        except Exception as e:
            print(f"Erro na requisição: {e}")
            break

    print(f"Finalizado! Total sincronizado com sucesso: {total_inserted}")
    conn.close()

if __name__ == "__main__":
    sync_pmt()
