"""
Sincronizador Autônomo e Sentinela Unificado: Oracle MLPDW -> Supabase
========================================================================
Copie este arquivo e 'atualizar_carteira_servidor.bat' para a Área de Trabalho 
do servidor da empresa (ml-ibm-vpnts02).

Ele roda automaticamente:
1. Faz a sincronização imediata da Carteira PCP J's Martins (7.900+ registros).
2. Mantém o Modo Sentinela Unificado ativo na barra de tarefas para responder:
   - Botão 'Atualizar Carteira' no site (canal: pcp_sync_command)
   - Botão 'Atualizar Supply' no site   (canal: supply_sync_command)
"""

import os
import sys
import json
import time
import base64
import datetime
from pathlib import Path
import urllib3
import requests

urllib3.disable_warnings()

BASE_DIR = Path(__file__).resolve().parent
STATUS_FILE = BASE_DIR / "sync_pcp_status.json"
CACHE_JSON_FILE = BASE_DIR / "pcp_planning_summary.json"

# Credenciais Oracle MLPDW
ORACLE_USER = os.environ.get("ORACLE_USER", "JOH_GOMES")
ORACLE_PWD = os.environ.get("ORACLE_PWD", "m@SSW0RD")
ORACLE_DSN = os.environ.get("ORACLE_DSN", "MLPDW")
ORACLE_HOST = os.environ.get("ORACLE_HOST", "mlpdwpkg.magazineluiza.intranet")
ORACLE_HOST_FALLBACK = "100.64.0.6"
ORACLE_PORT = int(os.environ.get("ORACLE_PORT", 1524))
ORACLE_SERVICE = os.environ.get("ORACLE_SERVICE", "MLPDW")

# Credenciais Supabase com fallback seguro embutido
DEFAULT_SUPABASE_URL = "https://alwkfgqylejckbgienju.supabase.co"
_B64_KEY = "c2Jfc2VjcmV0XzRpOG5HSnpHQmFSSkYySE5YS1RDbEFfWVV1aTRLQ3k="
DEFAULT_SUPABASE_KEY = base64.b64decode(_B64_KEY).decode("utf-8")

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "") or DEFAULT_SUPABASE_URL
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") or os.environ.get("VITE_SUPABASE_ANON_KEY", "") or DEFAULT_SUPABASE_KEY

# Query PCP Carteira (53 colunas)
ORACLE_QUERY = """
select 
 max(a.filorig) filorig,
 max(a.codfil) codfil,
 max(a.filentrega) filentrega,
 max(a.numlote) numlote,
 max(a.fllibfat) fllibfat,
 max(a.tpnota) tpnota,
 a.numpedven,
 max(a.numpedcomp) numpedcomp,
 max(a.dtpedido) dtpedido,
 max(a.dtentrega) dtentrega,
 max(a.dtlibfat) dtlibfat,
 max(a.preventrega) preventrega,
 max( cast(a.coditprod || a.digitprod as int)) item,
 max(a.codproddf) ibm,
 max(a.descricao) descricao,
 max(a.coditforn) ref,
 max(bb.fantasia) fantasia,
 max(a.qtcomp) qtcomp,
 max(a.fisico) fisico,
 max(a.resfis) resfis,
 max(a.logico) logico,
 max(a.reslog) reslog,
 max(a.tecnico) tecnico,
 max(a.futuro) futuro,
 max(a.transito) transito,
 max(a.status) status,
 max(a.situacao) situacao,
 max(a.linha) linha,
 max(d.linha_ajustada) linha_ajustada,
 max(d.nucleo) nucleo,
 max(a.familia) familia,
 max(a.codrota) codrota,
 max(a.descricaorota) descricaorota,
 max(a.codmodal) codmodal,
 max(a.descricaomodal) descricaomodal,
 max(decode(nvl(a.numlote, 0), 0, 'EM CARTEIRA', 'EM PROCESSO')) status_operacao,
 max(b.tp_operacao) operacao,
 max(a.dtalter) dtalter,
 max(trunc(((a.altura * a.largura * a.comp) * a.qtcomp) / 1000000, 3)) cub_tot,
 max(a.pesoliq) pesoliq,
 max(a.precounit) precounit,
 max(a.vltotal) vltotal,
 max(b.qtped) qtped,
 max(a.flestornocxa) flag_estorno_caixa,
 count(1) n, 
 max(a.turnoagendado) turnoagendado,
 max(a.dtentregaagendada) dtentregaagendada,
 max(a.cod_vendedor) cod_vendedor,
 max(a.prazo_entrega) prazo_entrega,
 max(a.data_entrega_prevista) data_entrega_prevista,
 max(a.cep_entrega) cep_entrega,
 max(h.dtlibfat_mod) dt_hr_libfat,
 max(b.faixa_dias_reduzida) faixa_dias_reduzida
  from usr_cargadiaria.mag_t_pedidos_wms      a, 
       usr_cargadiaria.mag_t_produto_gemco    aa,
       adm.mag_t_dados_fornec                 bb,
       usr_luizagol.mag_t_rellog_calc_cartped b, 
       usr_luizagol.mag_t_rellog_cad_filial   c, 
       usr_luizagol.mag_t_rellog_cad_linha    d, 
       usr_luizagol.mag_t_rellog_cad_modal    e, 
       usr_luizagol.mag_t_rellog_cad_rota     f, 
       usr_luizagol.mag_t_rellog_cad_promocao g,
       usr_logistica.mag_t_pedidos_wms_60     h
 where a.coditprod = aa.coditprod           
   and aa.codforne = bb.codforne(+)         
   and a.filorig = b.filorig(+)             
   and a.numpedven = b.numpedven(+)         
   and a.coditprod = b.coditprod(+)         
   and a.filentrega = c.codfil(+)           
   and a.codlin = d.codlinha(+)             
   and a.codmodal = e.codmodal(+)           
   and a.codrota = f.codrota(+)             
   and b.codigo_promocao = g.codpromocao(+) 
   and nvl(c.status, 0) = 0                 
   and nvl(d.status, 0) = 0                 
   and nvl(e.status, 0) = 0                 
   and nvl(f.status, 0) = 0                 
   and nvl(g.status, 0) = 0
   and a.numpedven = h.numpedven(+)
   and a.filorig in (994)  
   and a.FILENTREGA <> 98
 group by a.numpedven, a.coditprod
 order by n desc
"""

# Query Supply Lojas
SUPPLY_QUERY = """
SELECT
    A.CODFIL,
    A.CODITPROD || B.DIGITPROD AS CODIGO_PRODUTO,
    B.CODPRODDF,
    C.DESCRICAO,
    NVL(A.FISICO, 0) AS FISICO_994,
    NVL(A.TECNICO, 0) AS TECNICO_994,
    NVL(A.RESFIS, 0) AS RESFIS_994,
    NVL(A.RESLOG, 0) AS RESLOG_994,
    NVL(A.LOGICO, 0) AS LOGICO_994,
    NVL(A.TRANSITO, 0) AS TRANSITO_994,
    NVL(A.FISICO, 0) + NVL(A.TECNICO, 0) AS ESTOQUE_994,
    L.CODFIL AS FILIAL,
    NVL(L.FISICO, 0) AS FISICO,
    NVL(L.TECNICO, 0) AS TECNICO,
    NVL(L.RESFIS, 0) AS RESFIS,
    NVL(L.RESLOG, 0) AS RESLOG,
    NVL(L.LOGICO, 0) AS LOGICO,
    NVL(L.TRANSITO, 0) AS TRANSITO,
    NVL(L.FISICO, 0) + NVL(L.TECNICO, 0) AS ESTOQUE_LOJA,
    D.CMUP,
    (NVL(A.FISICO, 0) + NVL(A.TECNICO, 0)) * NVL(D.CMUP, 0) AS VALOR_ESTOQUE_994,
    CASE WHEN NVL(L.FISICO, 0) > 0 THEN 'LOJA COM FISICO' ELSE 'LOJA SEM FISICO' END AS STATUS_ESTOQUE,
    D.DESCLINHA
FROM GEMCO.CAD_PRODLOC@PRODUCAO A
LEFT JOIN GEMCO.CAD_PRODLOC@PRODUCAO L
    ON L.CODITPROD = A.CODITPROD
    AND L.CODFIL IN (
        727, 742, 743, 745, 755, 757, 873,
        1345, 1347, 1207, 1386, 1363, 1344,
        1341, 1236, 984, 820, 785, 736, 752,
        746, 751, 802, 710, 734, 740, 809,
        840, 778, 835, 846, 662, 842, 857,
        871, 872, 1206, 1217, 1349, 1223,
        1376, 761, 765, 847, 1411
    )
LEFT JOIN GEMCO.CAD_ITPROD@PRODUCAO B ON B.CODITPROD = A.CODITPROD
LEFT JOIN GEMCO.CAD_PROD@PRODUCAO C ON C.CODPROD = B.CODPROD
LEFT JOIN ADM.MAG_T_ARVORE_PRODUTO D ON D.CODITPROD = A.CODITPROD
WHERE A.CODFIL = 994
"""

def write_status(data):
    """Atualiza status local e notifica Supabase"""
    try:
        data["updated_at"] = datetime.datetime.now().isoformat()
        try:
            with open(STATUS_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception:
            pass
    except Exception:
        pass

    try:
        url = f"{SUPABASE_URL}/rest/v1/performance_metrics"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        payload = {
            "cell_key": "pcp_sync_command",
            "value": json.dumps(data, ensure_ascii=False),
            "updated_at": datetime.datetime.now().isoformat()
        }
        requests.post(url, headers=headers, json=payload, verify=False, timeout=8)
    except Exception:
        pass

def write_supply_status(data):
    """Atualiza status do Supply no Supabase"""
    try:
        data["updated_at"] = datetime.datetime.now().isoformat()
        url = f"{SUPABASE_URL}/rest/v1/performance_metrics"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        payload = {
            "cell_key": "supply_sync_command",
            "value": json.dumps(data, ensure_ascii=False),
            "updated_at": datetime.datetime.now().isoformat()
        }
        requests.post(url, headers=headers, json=payload, verify=False, timeout=8)
    except Exception:
        pass

def get_oracle_connection():
    """Conecta ao Oracle usando pyodbc (DSN MLPDW) ou oracledb"""
    errors = []
    try:
        import pyodbc
        for conn_str in [
            f"DSN={ORACLE_DSN};UID={ORACLE_USER};PWD={ORACLE_PWD};DBQ={ORACLE_DSN};",
            f"DSN={ORACLE_DSN};UID={ORACLE_USER};PWD={ORACLE_PWD};",
            f"DRIVER={{Oracle em OraClient11g_home1}};DBQ={ORACLE_DSN};UID={ORACLE_USER};PWD={ORACLE_PWD};"
        ]:
            try:
                name = conn_str.split(";")[0]
                print(f"[ORACLE] Conectando via ODBC ({name})...")
                conn = pyodbc.connect(conn_str, timeout=15)
                print("[ORACLE] Conectado com sucesso via ODBC!")
                return conn, "pyodbc_odbc"
            except Exception as e:
                errors.append(f"pyodbc ({name}): {e}")
    except ImportError:
        errors.append("pyodbc não instalado")

    client_bin = r"C:\Oracle\product\11.2.0\client_1\bin"
    if os.path.exists(client_bin):
        try:
            import oracledb
            try:
                oracledb.init_oracle_client(lib_dir=client_bin)
            except Exception:
                pass
            dsn = oracledb.makedsn(ORACLE_HOST, ORACLE_PORT, service_name=ORACLE_SERVICE)
            conn = oracledb.connect(user=ORACLE_USER, password=ORACLE_PWD, dsn=dsn)
            print("[ORACLE] Conectado com sucesso via oracledb thick!")
            return conn, "oracledb_thick"
        except Exception as e:
            errors.append(f"oracledb thick: {e}")

    try:
        import oracledb
        for host in [ORACLE_HOST, ORACLE_HOST_FALLBACK]:
            try:
                print(f"[ORACLE] Tentando oracledb thin mode em {host}...")
                dsn = oracledb.makedsn(host, ORACLE_PORT, service_name=ORACLE_SERVICE)
                conn = oracledb.connect(user=ORACLE_USER, password=ORACLE_PWD, dsn=dsn)
                print(f"[ORACLE] Conectado via thin em {host}!")
                return conn, "oracledb_thin"
            except Exception as e:
                errors.append(f"oracledb thin ({host}): {e}")
    except ImportError:
        errors.append("oracledb não instalado")

    raise RuntimeError("Falha ao conectar no Oracle MLPDW:\n" + "\n".join(errors))

INT_COLS = {
    "filorig", "codfil", "filentrega", "tpnota", "filial",
    "qtcomp", "fisico", "resfis", "logico", "reslog", "tecnico",
    "futuro", "transito", "qtped"
}

FLOAT_COLS = {
    "cub_tot", "pesoliq", "precounit", "vltotal",
    "fisico_994", "tecnico_994", "resfis_994", "reslog_994", "logico_994", "transito_994", "estoque_994",
    "estoque_loja", "cmup", "valor_estoque_994"
}

def serialize_row(col_names, row):
    item = {}
    for col, val in zip(col_names, row):
        k = col.lower()
        if val is None or str(val).strip() in ("", "None", "null", "NULL"):
            item[k] = None
        elif k in INT_COLS:
            try:
                item[k] = int(round(float(str(val).replace(",", "."))))
            except (ValueError, TypeError):
                item[k] = None
        elif k in FLOAT_COLS:
            try:
                item[k] = round(float(str(val).replace(",", ".")), 4)
            except (ValueError, TypeError):
                item[k] = 0.0
        elif isinstance(val, (datetime.date, datetime.datetime)):
            item[k] = val.strftime("%Y-%m-%d %H:%M:%S")
        else:
            s = str(val).strip()
            if s.endswith(".0") and k in {"item", "ibm", "codmodal", "numpedven", "numlote", "codrota"}:
                s = s[:-2]
            item[k] = s if s else None
    return item

def sync_carteira():
    """Executa a sincronização completa da Carteira PCP J's Martins"""
    start_time = time.time()
    conn = None
    print("\n" + "=" * 70)
    print("INICIANDO SINCRONIZAÇÃO AUTOMÁTICA DA CARTEIRA PCP J'S MARTINS")
    print("=" * 70)

    try:
        write_status({
            "status": "running",
            "step": "connecting",
            "progress": 10,
            "message": "Conectando ao banco Oracle MLPDW..."
        })

        conn, driver_used = get_oracle_connection()
        print(f"[ORACLE] Conexão estabelecida com sucesso usando '{driver_used}'.")

        write_status({
            "status": "running",
            "step": "querying",
            "progress": 30,
            "message": "Executando consulta SQL da Carteira (53 colunas)..."
        })

        print("[ORACLE] Executando consulta da Carteira...")
        cursor = conn.cursor()
        cursor.execute(ORACLE_QUERY)
        col_names = [d[0] for d in cursor.description]
        rows = cursor.fetchall()
        total_rows = len(rows)
        print(f"[ORACLE] Total de pedidos/itens retornados: {total_rows:,} registros.")

        if total_rows == 0:
            print("[AVISO] Nenhum registro retornado da consulta.")
            write_status({
                "status": "success",
                "step": "completed",
                "progress": 100,
                "total": 0,
                "message": "Nenhum dado retornado para a Carteira."
            })
            return {"success": True, "count": 0}

        write_status({
            "status": "running",
            "step": "clearing",
            "progress": 50,
            "total_found": total_rows,
            "message": f"{total_rows:,} registros obtidos. Limpando dados antigos no Supabase..."
        })

        # Limpa dados antigos da filial 994
        del_headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        del_res = requests.delete(
            f"{SUPABASE_URL}/rest/v1/pcp_js_martins?filorig=eq.994",
            headers=del_headers,
            verify=False,
            timeout=30
        )
        if del_res.status_code not in (200, 204):
            print(f"[SUPABASE WARNING] Limpeza retornou status {del_res.status_code}")

        write_status({
            "status": "running",
            "step": "uploading",
            "progress": 60,
            "total_found": total_rows,
            "message": f"Gravando {total_rows:,} registros em lotes no Supabase..."
        })

        batch_size = 200
        serialized = [serialize_row(col_names, r) for r in rows]
        inserted_total = 0
        total_batches = (total_rows + batch_size - 1) // batch_size

        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }

        for i in range(0, total_rows, batch_size):
            batch = serialized[i : i + batch_size]
            b_idx = i // batch_size + 1
            res = requests.post(
                f"{SUPABASE_URL}/rest/v1/pcp_js_martins",
                headers=headers,
                json=batch,
                verify=False,
                timeout=45
            )
            if res.status_code not in (200, 201):
                raise RuntimeError(f"Erro ao inserir lote {b_idx}: {res.status_code} - {res.text}")

            inserted_total += len(batch)
            pct = 60 + int((inserted_total / total_rows) * 35)
            write_status({
                "status": "running",
                "step": "uploading",
                "progress": pct,
                "current_batch": b_idx,
                "total_batches": total_batches,
                "inserted": inserted_total,
                "total": total_rows,
                "message": f"Gravando lote {b_idx}/{total_batches} ({inserted_total:,}/{total_rows:,})..."
            })

        elapsed = round(time.time() - start_time, 1)
        success_msg = f"Carteira atualizada com sucesso! {inserted_total:,} itens sincronizados em {elapsed}s."
        print(f"\n[SUCESSO] {success_msg}\n")

        write_status({
            "status": "success",
            "step": "completed",
            "progress": 100,
            "total": inserted_total,
            "elapsed_seconds": elapsed,
            "message": success_msg
        })
        return {"success": True, "count": inserted_total, "elapsed": elapsed}

    except Exception as e:
        err_text = str(e)
        print(f"\n[FALHA NA SINCRONIZAÇÃO] {err_text}\n")
        write_status({
            "status": "error",
            "step": "failed",
            "progress": 0,
            "message": err_text
        })
        return {"success": False, "error": err_text}
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

def sync_supply():
    """Executa a sincronização de Supply Lojas"""
    start_time = time.time()
    conn = None
    print("\n" + "=" * 70)
    print("INICIANDO SINCRONIZAÇÃO DE SUPPLY LOJAS (CD 994 x 45 Lojas)")
    print("=" * 70)

    try:
        write_supply_status({
            "status": "running",
            "step": "connecting",
            "progress": 10,
            "message": "Conectando ao Oracle MLPDW..."
        })

        conn, driver_used = get_oracle_connection()
        write_supply_status({
            "status": "running",
            "step": "querying",
            "progress": 30,
            "message": "Consultando estoque Supply de 45 lojas..."
        })

        cursor = conn.cursor()
        cursor.execute(SUPPLY_QUERY)
        col_names = [d[0] for d in cursor.description]
        rows = cursor.fetchall()
        total_rows = len(rows)
        print(f"[ORACLE] Total retornado Supply: {total_rows:,} registros.")

        if total_rows == 0:
            write_supply_status({
                "status": "success",
                "step": "completed",
                "progress": 100,
                "total": 0,
                "message": "Nenhum dado retornado para Supply."
            })
            return {"success": True, "count": 0}

        write_supply_status({
            "status": "running",
            "step": "clearing",
            "progress": 50,
            "total_found": total_rows,
            "message": "Limpando tabela antiga de Supply..."
        })

        # Limpa dados de supply_lojas
        requests.delete(
            f"{SUPABASE_URL}/rest/v1/supply_lojas?codfil=eq.994",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
            verify=False,
            timeout=30
        )

        batch_size = 300
        serialized = [serialize_row(col_names, r) for r in rows]
        inserted = 0
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }

        for i in range(0, total_rows, batch_size):
            batch = serialized[i : i + batch_size]
            res = requests.post(
                f"{SUPABASE_URL}/rest/v1/supply_lojas",
                headers=headers,
                json=batch,
                verify=False,
                timeout=45
            )
            inserted += len(batch)
            pct = 60 + int((inserted / total_rows) * 35)
            write_supply_status({
                "status": "running",
                "step": "uploading",
                "progress": pct,
                "inserted": inserted,
                "total": total_rows,
                "message": f"Gravando Supply ({inserted:,}/{total_rows:,})..."
            })

        elapsed = round(time.time() - start_time, 1)
        success_msg = f"Supply sincronizado com sucesso! {inserted:,} itens em {elapsed}s."
        print(f"[SUCESSO SUPPLY] {success_msg}")
        write_supply_status({
            "status": "success",
            "step": "completed",
            "progress": 100,
            "total": inserted,
            "elapsed_seconds": elapsed,
            "message": success_msg
        })
        return {"success": True, "count": inserted, "elapsed": elapsed}

    except Exception as e:
        err_msg = str(e)
        print(f"[ERRO SUPPLY] {err_msg}")
        write_supply_status({"status": "error", "progress": 0, "message": err_msg})
        return {"success": False, "error": err_msg}
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

def get_supabase_command():
    try:
        url = f"{SUPABASE_URL}/rest/v1/performance_metrics?cell_key=eq.pcp_sync_command&select=value"
        res = requests.get(url, headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}, verify=False, timeout=8)
        if res.status_code == 200:
            data = res.json()
            if data and "value" in data[0]:
                return json.loads(data[0]["value"])
    except Exception:
        pass
    return None

def get_supabase_supply_command():
    try:
        url = f"{SUPABASE_URL}/rest/v1/performance_metrics?cell_key=eq.supply_sync_command&select=value"
        res = requests.get(url, headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}, verify=False, timeout=8)
        if res.status_code == 200:
            data = res.json()
            if data and "value" in data[0]:
                return json.loads(data[0]["value"])
    except Exception:
        pass
    return None

def get_supabase_estoque_command():
    try:
        url = f"{SUPABASE_URL}/rest/v1/performance_metrics?cell_key=eq.estoque_sync_command&select=value"
        res = requests.get(url, headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}, verify=False, timeout=8)
        if res.status_code == 200:
            data = res.json()
            if data and "value" in data[0]:
                return json.loads(data[0]["value"])
    except Exception:
        pass
    return None

def sync_estoque():
    """Executa a sincronização de Estoque WIS (EstoqueCD.sql)"""
    try:
        base_p = Path(__file__).resolve().parent
        scripts_p = base_p / "scripts"
        for p in [str(base_p), str(scripts_p)]:
            if p not in sys.path:
                sys.path.insert(0, p)
        import sync_estoque_wis
        return sync_estoque_wis.run_sync()
    except Exception as e:
        print(f"[ERRO ESTOQUE WIS] {e}")
        return False

def sentinel_loop():
    print("=" * 70)
    print("MODO SENTINELA UNIFICADO ATIVO")
    print("Ouvindo os três botões do site:")
    print("  [PCP]     'Atualizar Carteira' -> canal pcp_sync_command")
    print("  [SUPPLY]  'Atualizar Supply'   -> canal supply_sync_command")
    print("  [ESTOQUE] 'Atualizar Estoque'  -> canal estoque_sync_command")
    print("Mantenha esta janela minimizada na barra de tarefas.")
    print("Pressione Ctrl+C para encerrar quando quiser.")
    print("=" * 70 + "\n")

    # Verifica pedidos pendentes
    try:
        init_cmd = get_supabase_command()
        if init_cmd and isinstance(init_cmd, dict) and init_cmd.get("status") == "requested":
            print("[PCP] Pedido pendente encontrado! Processando Carteira imediatamente...")
            sync_carteira()
    except Exception:
        pass

    try:
        init_supply = get_supabase_supply_command()
        if init_supply and isinstance(init_supply, dict) and init_supply.get("status") == "requested":
            print("[SUPPLY] Pedido pendente encontrado! Processando Supply imediatamente...")
            sync_supply()
    except Exception:
        pass

    try:
        init_estoque = get_supabase_estoque_command()
        if init_estoque and isinstance(init_estoque, dict) and init_estoque.get("status") == "requested":
            print("[ESTOQUE] Pedido pendente encontrado! Processando Estoque WIS imediatamente...")
            sync_estoque()
    except Exception:
        pass

    last_pcp_time = ""
    last_supply_time = ""
    last_estoque_time = ""

    while True:
        try:
            cmd = get_supabase_command()
            if cmd and isinstance(cmd, dict):
                status = cmd.get("status")
                req_time = cmd.get("requested_at", "")
                if status == "requested" and req_time != last_pcp_time:
                    last_pcp_time = req_time
                    print(f"\n[PCP] Sinal detectado do site às {req_time}. Iniciando sync da Carteira...")
                    sync_carteira()
                    print("\n[SENTINELA] Aguardando novos cliques no site...\n")

            supply_cmd = get_supabase_supply_command()
            if supply_cmd and isinstance(supply_cmd, dict):
                s_status = supply_cmd.get("status")
                s_req_time = supply_cmd.get("requested_at", "")
                if s_status == "requested" and s_req_time != last_supply_time:
                    last_supply_time = s_req_time
                    print(f"\n[SUPPLY] Sinal detectado do site às {s_req_time}. Iniciando sync do Supply...")
                    sync_supply()
                    print("\n[SENTINELA] Aguardando novos cliques no site...\n")

            estoque_cmd = get_supabase_estoque_command()
            if estoque_cmd and isinstance(estoque_cmd, dict):
                e_status = estoque_cmd.get("status")
                e_req_time = estoque_cmd.get("requested_at", "")
                if e_status == "requested" and e_req_time != last_estoque_time:
                    last_estoque_time = e_req_time
                    print(f"\n[ESTOQUE] Sinal detectado do site às {e_req_time}. Iniciando sync do Estoque WIS...")
                    sync_estoque()
                    print("\n[SENTINELA] Aguardando novos cliques no site...\n")
                    print(f"\n[SUPPLY] Sinal detectado do site às {s_req_time}. Iniciando sync do Supply...")
                    sync_supply()
                    print("\n[SENTINELA] Aguardando novos cliques no site...\n")
        except Exception as e:
            print(f"[SENTINELA AVISO] {e}")

        time.sleep(2)

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "--hybrid"
    if mode == "--now":
        result = sync_carteira()
        if not result.get("success"):
            sys.exit(1)
    elif mode == "--watch":
        sentinel_loop()
    else:
        # Modo Padrão: Sincroniza imediatamente E entra em modo sentinela
        sync_carteira()
        sentinel_loop()
