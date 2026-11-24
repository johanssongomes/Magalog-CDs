"""
Sincronizador de Estoque por Categoria: Oracle WIS50 -> Supabase / JSON Local
=============================================================================
Conecta no DSN ODBC 'wis', executa a query completa de Estoque (EstoqueCD.sql),
processa as métricas de Cubagem, Peças, Valor, Ocupação, Categorias e Bloqueios,
e atualiza tanto o arquivo local quanto a tabela 'performance_metrics' no Supabase!
"""

import os
import sys
import time
import json
import base64
import datetime
import urllib3
import requests
import pyodbc

urllib3.disable_warnings()

# Configuração ODBC
WIS_DSN = os.environ.get("WIS_DSN", "wis")
WIS_USER = os.environ.get("WIS_USER", "joh_gomes")
WIS_PWD = os.environ.get("WIS_PWD", "vAstLW3Ut4Opr2FAhoD251uj!H")

# Configuração Supabase
SUPABASE_URL = "https://alwkfgqylejckbgienju.supabase.co"
_B64_KEY = "c2Jfc2VjcmV0XzRpOG5HSnpHQmFSSkYySE5YS1RDbEFfWVV1aTRLQ3k="
SUPABASE_KEY = base64.b64decode(_B64_KEY).decode("utf-8")

MAPPING_CATEGORIAS = {
    '99ACE': 'Madeira',
    '99AER': 'Mercado',
    '99ALM': 'Mercado',
    '99BDC': 'Mercado',
    '99BEB': 'Mercado',
    '99COF': 'Cofre',
    '99COL': 'Colchão/Estofado',
    '99DIV': 'Diversos',
    '99ECC': 'Colchão/Estofado',
    '99EIS': 'Diversos',
    '99HIG': 'Mercado',
    '99LIM': 'Mercado',
    '99LIV': 'Mercado',
    '99LNB': 'Eletro Pesado',
    '99MOV': 'Madeira',
    '99PDE': 'Diversos',
    '99PET': 'Mercado',
    '99PNE': 'Pneu',
    '99TV': 'Imagem'
}

CAPACIDADES = {
    'Cofre': 127,
    'Colchão/Estofado': 5226,
    'Diversos': 2975,
    'Eletro Pesado': 13128,
    'Linha Branca': 13128,
    'Imagem': 2535,
    'Madeira': 2798,
    'Mercado': 358,
    'Pneu': 372
}

def get_faixa_dias(dias):
    if dias is None or dias == 0:
        return '0 DIAS'
    if dias <= 7:
        return '7 DIAS'
    if dias <= 30:
        return '30 DIAS'
    if dias <= 90:
        return '90 DIAS'
    if dias <= 120:
        return '120 DIAS'
    return 'ACIMA DE 120 DIAS'

def update_sync_status(status, message, progress=0):
    try:
        now = datetime.datetime.now().isoformat()
        payload = {
            "cell_key": "estoque_sync_status",
            "value": json.dumps({
                "status": status,
                "message": message,
                "progress": progress,
                "updated_at": now
            }),
            "updated_at": now
        }
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        requests.post(f"{SUPABASE_URL}/rest/v1/performance_metrics", json=payload, headers=headers, timeout=10)
    except Exception as e:
        print("Erro ao atualizar status:", e)

def run_sync():
    print("=" * 60)
    print("🚀 Iniciando Sincronização de Estoque WIS50 -> Dashboard")
    print("=" * 60)
    update_sync_status("running", "🔌 Conectando ao banco de dados Oracle WIS (ODBC)...", 10)

    # 1. Carregar mapa de custos
    custos_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "base_valores_custos.json")
    mapa_custos = {}
    if os.path.exists(custos_path):
        print("Carregando mapa de custos...")
        with open(custos_path, "r", encoding="utf-8") as f:
            mapa_custos = json.load(f)
        print(f"Custos carregados: {len(mapa_custos)} produtos")

    # 2. Conectar via ODBC
    conn_str = f"DSN={WIS_DSN};UID={WIS_USER};PWD={WIS_PWD}"
    print(f"Conectando com DSN '{WIS_DSN}'...")
    try:
        cnxn = pyodbc.connect(conn_str, timeout=15)
        cursor = cnxn.cursor()
    except Exception as e:
        err = f"Erro na conexão ODBC com '{WIS_DSN}': {e}"
        print(err)
        update_sync_status("error", err, 0)
        return False

    update_sync_status("running", "📊 Executando consulta SQL de Estoque no WIS50...", 30)

    # 3. Ler SQL
    sql_path = os.path.join(os.path.dirname(__file__), "..", "Estoque", "EstoqueCD.sql")
    if not os.path.exists(sql_path):
        sql_path = "Estoque/EstoqueCD.sql"
    with open(sql_path, "r", encoding="utf-8") as f:
        sql = f.read()

    print("Executando consulta SQL...")
    t0 = time.time()
    try:
        cursor.execute(sql)
        rows = cursor.fetchall()
        cols = [c[0] for c in cursor.description]
        print(f"Consulta finalizada! {len(rows)} linhas em {time.time() - t0:.2f}s")
    except Exception as e:
        err = f"Erro na execução do SQL: {e}"
        print(err)
        update_sync_status("error", err, 0)
        cnxn.close()
        return False

    cnxn.close()
    update_sync_status("running", f"⚙️ Processando {len(rows):,} itens e calculando cubagem/valores...", 70)

    # Mapear quantos volumes cada produto master possui
    master_volumes_count = {}
    for r in rows:
        row_dict = dict(zip(cols, r))
        codigo = str(row_dict.get("CODIGO") or "").strip()
        gemco = str(row_dict.get("COD_GEMCO") or "").strip()
        ds_item = str(row_dict.get("DS_ITEM") or "").upper()

        if "/" in codigo:
            parts = codigo.split("/")
            master = parts[0]
            try:
                vol_num = int(parts[1])
                master_volumes_count[master] = max(master_volumes_count.get(master, 0), vol_num)
            except:
                pass

        import re
        m = re.search(r"VOL:?\s*(\d+)\s*/\s*(\d+)", ds_item)
        if m:
            master = gemco or (codigo.split("/")[0] if codigo else "")
            try:
                tot_vols = int(m.group(2))
                master_volumes_count[master] = max(master_volumes_count.get(master, 0), tot_vols)
            except:
                pass

    def summarize_dataset(filter_bom=False):
        cat_totals = {}
        total_cub = 0.0
        total_qtd = 0
        total_valor = 0.0
        count_rows = 0

        for r in rows:
            row_dict = dict(zip(cols, r))
            area = str(row_dict.get("DS_AREA_ERP") or "").strip().upper()
            if filter_bom and area != "BOM":
                continue

            count_rows += 1
            codigo = str(row_dict.get("CODIGO") or "").strip()
            gemco = str(row_dict.get("COD_GEMCO") or "").strip()
            master = gemco or (codigo.split("/")[0] if codigo else "")
            classe = str(row_dict.get("CLASSE_ITEM") or "").strip()
            cat = MAPPING_CATEGORIAS.get(classe, "Diversos")

            cub = float(row_dict.get("CUB_TOTAL") or 0.0)
            qnts = int(row_dict.get("QNTS") or 0)

            custo_master = float(mapa_custos.get(master) or mapa_custos.get(codigo) or 0.0)
            num_vols = master_volumes_count.get(master, 1)
            custo_unit_vol = (custo_master / num_vols) if num_vols > 1 else custo_master
            valor_item = qnts * custo_unit_vol

            if cat not in cat_totals:
                cat_totals[cat] = {"cubagem": 0.0, "pecas": 0, "valor": 0.0, "itens": 0}
            cat_totals[cat]["cubagem"] += cub
            cat_totals[cat]["pecas"] += qnts
            cat_totals[cat]["valor"] += valor_item
            cat_totals[cat]["itens"] += 1

            total_cub += cub
            total_qtd += qnts
            total_valor += valor_item

        total_capacidade = 27519
        categorias_list = []
        for nome, val in cat_totals.items():
            cap = CAPACIDADES.get(nome, 0)
            cub_round = round(val["cubagem"], 2)
            ocupacao = round((cub_round / cap * 100), 1) if cap > 0 else 0.0
            categorias_list.append({
                "nome": nome,
                "cubagem": cub_round,
                "capacidade": cap,
                "ocupacao": ocupacao,
                "pecas": val["pecas"],
                "valor": round(val["valor"], 2),
                "itens": val["itens"],
                "percentual": round((cub_round / total_cub * 100), 1) if total_cub > 0 else 0.0
            })

        categorias_list.sort(key=lambda x: x["cubagem"], reverse=True)

        return {
            "totalCubagem": round(total_cub, 2),
            "totalCapacidade": total_capacidade,
            "totalOcupacao": round((total_cub / total_capacidade * 100), 1) if total_capacidade > 0 else 0.0,
            "totalPecas": total_qtd,
            "totalValor": round(total_valor, 2),
            "totalLinhas": count_rows,
            "categorias": categorias_list
        }

    # Bloqueios
    def summarize_bloqueios():
        bloq_rows = []
        for r in rows:
            row_dict = dict(zip(cols, r))
            if str(row_dict.get("DS_AREA_ERP") or "").strip().upper() == "BLOQUEADO":
                bloq_rows.append(row_dict)

        motivos_map = {}
        total_pecas = 0
        total_cub = 0.0
        total_valor = 0.0
        all_skus = set()
        total_faixas = {
            '0 DIAS': 0.0,
            '7 DIAS': 0.0,
            '30 DIAS': 0.0,
            '90 DIAS': 0.0,
            '120 DIAS': 0.0,
            'ACIMA DE 120 DIAS': 0.0
        }

        for r in bloq_rows:
            raw_motivo = str(r.get("AREA_ARMEZENAGEM") or "OUTROS").strip()
            import re
            motivo = re.sub(r"^\d+\s*-\s*", "", raw_motivo).strip()
            codigo = str(r.get("CODIGO") or "").strip()
            gemco = str(r.get("COD_GEMCO") or "").strip()
            master = gemco or (codigo.split("/")[0] if codigo else "")

            qnts = int(r.get("QNTS") or 0)
            cub = float(r.get("CUB_TOTAL") or 0.0)
            dias = int(r.get("DIAS_ARMAZENAGEM") or 0)
            faixa = get_faixa_dias(dias)

            custo_master = float(mapa_custos.get(master) or mapa_custos.get(codigo) or 0.0)
            num_vols = master_volumes_count.get(master, 1)
            custo_unit_vol = (custo_master / num_vols) if num_vols > 1 else custo_master
            valor_item = qnts * custo_unit_vol

            all_skus.add(master)
            total_pecas += qnts
            total_cub += cub
            total_valor += valor_item
            total_faixas[faixa] += valor_item

            if motivo not in motivos_map:
                motivos_map[motivo] = {
                    "motivo": motivo,
                    "skusSet": set(),
                    "pecas": 0,
                    "cubagem": 0.0,
                    "valorTotal": 0.0,
                    "faixas": {
                        '0 DIAS': 0.0,
                        '7 DIAS': 0.0,
                        '30 DIAS': 0.0,
                        '90 DIAS': 0.0,
                        '120 DIAS': 0.0,
                        'ACIMA DE 120 DIAS': 0.0
                    },
                    "itemsMap": {}
                }

            item = motivos_map[motivo]
            item["skusSet"].add(master)
            item["pecas"] += qnts
            item["cubagem"] += cub
            item["valorTotal"] += valor_item
            item["faixas"][faixa] += valor_item

            if master:
                if master not in item["itemsMap"]:
                    item["itemsMap"][master] = {
                        "empresa": r.get("EMPRESA") or "1994 - CD994-MARACANAU",
                        "sku": master,
                        "descricao": r.get("DS_ITEM") or "",
                        "linha": r.get("DS_LINHA") or "",
                        "classe": r.get("CLASSE_ITEM") or "",
                        "endereco": r.get("END3") or "",
                        "diasBloq": dias,
                        "pecas": 0,
                        "cubagem": 0.0,
                        "valorTotal": 0.0
                    }
                it = item["itemsMap"][master]
                it["pecas"] += qnts
                it["cubagem"] += cub
                it["valorTotal"] += valor_item
                if dias > it["diasBloq"]:
                    it["diasBloq"] = dias

        motivos_list = []
        for m in motivos_map.values():
            items_list = list(m["itemsMap"].values())
            for it in items_list:
                it["cubagem"] = round(it["cubagem"], 3)
                it["valorTotal"] = round(it["valorTotal"], 2)
            items_list.sort(key=lambda x: x["valorTotal"], reverse=True)

            motivos_list.append({
                "motivo": m["motivo"],
                "skus": len(m["skusSet"]),
                "pecas": m["pecas"],
                "cubagem": round(m["cubagem"], 2),
                "valorTotal": round(m["valorTotal"], 2),
                "faixas": {k: round(v, 2) for k, v in m["faixas"].items()},
                "items": items_list
            })

        motivos_list.sort(key=lambda x: x["valorTotal"], reverse=True)

        return {
            "totalLinhas": len(bloq_rows),
            "totalSkus": len(all_skus),
            "totalPecas": total_pecas,
            "totalCubagem": round(total_cub, 2),
            "totalValor": round(total_valor, 2),
            "totalFaixas": {k: round(v, 2) for k, v in total_faixas.items()},
            "motivos": motivos_list
        }

    bom_summary = summarize_dataset(filter_bom=True)
    todos_summary = summarize_dataset(filter_bom=False)
    bloq_summary = summarize_bloqueios()

    full_payload = {
        "updatedAt": datetime.datetime.now().isoformat(),
        "capacidades": CAPACIDADES,
        "bomOnly": bom_summary,
        "todos": todos_summary,
        "bloqueios": bloq_summary
    }

    # Salvar em JSON local
    json_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "estoque_categoria_summary.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(full_payload, f, ensure_ascii=False, indent=2)
    print(f"✅ Arquivo local '{json_path}' atualizado com sucesso!")

    # Salvar no Supabase
    try:
        now_str = datetime.datetime.now().isoformat()
        sb_payload = {
            "cell_key": "estoque_categoria_summary",
            "value": json.dumps(full_payload, ensure_ascii=False),
            "updated_at": now_str
        }
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        res = requests.post(f"{SUPABASE_URL}/rest/v1/performance_metrics", json=sb_payload, headers=headers, timeout=15)
        if res.status_code in (200, 201, 204):
            print("✅ Supabase atualizado com sucesso em performance_metrics!")
        else:
            print(f"Aviso Supabase: {res.status_code} - {res.text}")
    except Exception as e:
        print("Erro ao gravar no Supabase:", e)

    msg_sucesso = f"Estoque 100% atualizado via Oracle WIS! {len(rows):,} registros processados."
    update_sync_status("success", msg_sucesso, 100)
    print(f"🎉 {msg_sucesso}")
    return True

if __name__ == "__main__":
    run_sync()
