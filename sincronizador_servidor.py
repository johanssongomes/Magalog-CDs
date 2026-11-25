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
import threading
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

# Query Supply Lojas Otimizada (Filtra CD 994 primeiro para evitar full scan no DBLink @PRODUCAO)
SUPPLY_QUERY = """
WITH PRODUTOS_994 AS (
    SELECT /*+ MATERIALIZE */
        A.CODFIL,
        A.CODITPROD,
        NVL(A.FISICO, 0) AS FISICO_994,
        NVL(A.TECNICO, 0) AS TECNICO_994,
        NVL(A.RESFIS, 0) AS RESFIS_994,
        NVL(A.RESLOG, 0) AS RESLOG_994,
        NVL(A.LOGICO, 0) AS LOGICO_994,
        NVL(A.TRANSITO, 0) AS TRANSITO_994,
        (NVL(A.FISICO, 0) + NVL(A.TECNICO, 0)) AS ESTOQUE_994
    FROM GEMCO.CAD_PRODLOC@PRODUCAO A
    WHERE A.CODFIL = 994
      AND (NVL(A.FISICO, 0) + NVL(A.TECNICO, 0) > 0)
)
SELECT /*+ LEADING(P) */
    P.CODFIL,
    P.CODITPROD || B.DIGITPROD AS CODIGO_PRODUTO,
    B.CODPRODDF,
    C.DESCRICAO,
    P.FISICO_994,
    P.TECNICO_994,
    P.RESFIS_994,
    P.RESLOG_994,
    P.LOGICO_994,
    P.TRANSITO_994,
    P.ESTOQUE_994,
    L.CODFIL AS FILIAL,
    NVL(L.FISICO, 0) AS FISICO,
    NVL(L.TECNICO, 0) AS TECNICO,
    NVL(L.RESFIS, 0) AS RESFIS,
    NVL(L.RESLOG, 0) AS RESLOG,
    NVL(L.LOGICO, 0) AS LOGICO,
    NVL(L.TRANSITO, 0) AS TRANSITO,
    NVL(L.FISICO, 0) + NVL(L.TECNICO, 0) AS ESTOQUE_LOJA,
    D.CMUP,
    (P.ESTOQUE_994 * NVL(D.CMUP, 0)) AS VALOR_ESTOQUE_994,
    CASE WHEN NVL(L.FISICO, 0) > 0 THEN 'LOJA COM FISICO' ELSE 'LOJA SEM FISICO' END AS STATUS_ESTOQUE,
    D.DESCLINHA
FROM PRODUTOS_994 P
LEFT JOIN GEMCO.CAD_PRODLOC@PRODUCAO L
    ON L.CODITPROD = P.CODITPROD
    AND L.CODFIL IN (
        727, 742, 743, 745, 755, 757, 873,
        1345, 1347, 1207, 1386, 1363, 1344,
        1341, 1236, 984, 820, 785, 736, 752,
        746, 751, 802, 710, 734, 740, 809,
        840, 778, 835, 846, 662, 842, 857,
        871, 872, 1206, 1217, 1349, 1223,
        1376, 761, 765, 847, 1411
    )
LEFT JOIN GEMCO.CAD_ITPROD@PRODUCAO B ON B.CODITPROD = P.CODITPROD
LEFT JOIN GEMCO.CAD_PROD@PRODUCAO C ON C.CODPROD = B.CODPROD
LEFT JOIN ADM.MAG_T_ARVORE_PRODUTO D ON D.CODITPROD = P.CODITPROD
ORDER BY P.CODITPROD, L.CODFIL
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
        print(f"[ORACLE] Conexão estabelecida com sucesso usando '{driver_used}'.")
        write_supply_status({
            "status": "running",
            "step": "querying",
            "progress": 30,
            "message": "Consultando estoque Supply de 45 lojas no Oracle..."
        })

        print("[ORACLE] Executando consulta SQL do Supply (CD 994 com estoque > 0 x 45 Lojas)...")
        print("[ORACLE] Aguardando retorno da query no banco Oracle MLPDW...")
        q_start = time.time()
        cursor = conn.cursor()
        cursor.execute(SUPPLY_QUERY)
        col_names = [d[0] for d in cursor.description]
        rows = cursor.fetchall()
        total_rows = len(rows)
        q_time = round(time.time() - q_start, 1)
        print(f"[ORACLE] Total retornado Supply: {total_rows:,} registros em {q_time}s.")

        cursor.close()
        conn.close()
        conn = None

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
            "message": f"Obtidos {total_rows:,} registros. Limpando tabela antiga no Supabase..."
        })

        # Limpa dados de supply_lojas
        print("[SUPABASE] Limpando tabela antiga de supply_lojas...")
        del_res = requests.delete(
            f"{SUPABASE_URL}/rest/v1/supply_lojas?codfil=eq.994",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
            verify=False,
            timeout=30
        )
        print(f"[SUPABASE] Limpeza concluída (Status {del_res.status_code}).")

        write_supply_status({
            "status": "running",
            "step": "uploading",
            "progress": 60,
            "total_found": total_rows,
            "message": f"Gravando {total_rows:,} registros em lotes no Supabase..."
        })

        batch_size = 500
        serialized = [serialize_row(col_names, r) for r in rows]
        inserted = 0
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
                f"{SUPABASE_URL}/rest/v1/supply_lojas",
                headers=headers,
                json=batch,
                verify=False,
                timeout=45
            )
            if res.status_code not in (200, 201):
                raise RuntimeError(f"Erro ao inserir lote Supply {b_idx}: {res.status_code} - {res.text}")
            inserted += len(batch)
            pct = 60 + int((inserted / total_rows) * 35)
            if b_idx % 10 == 0 or inserted == total_rows:
                print(f"[SUPABASE] Progresso Supply: lote {b_idx}/{total_batches} ({inserted:,}/{total_rows:,} registros)...")
            write_supply_status({
                "status": "running",
                "step": "uploading",
                "progress": pct,
                "current_batch": b_idx,
                "total_batches": total_batches,
                "inserted": inserted,
                "total": total_rows,
                "message": f"Gravando lote {b_idx}/{total_batches} ({inserted:,}/{total_rows:,})..."
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

# Configuração ODBC WIS
WIS_DSN = os.environ.get("WIS_DSN", "wis")
WIS_USER = os.environ.get("WIS_USER", "joh_gomes")
WIS_PWD = os.environ.get("WIS_PWD", "vAstLW3Ut4Opr2FAhoD251uj!H")

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

WIS_ESTOQUE_QUERY = """
SELECT 
    TRIM(A.CD_EMPRESA) || ' - ' || TRIM(B.NM_EMPRESA) AS EMPRESA,
    CASE WHEN MOD(TO_NUMBER(SUBSTR(TRIM(A.CD_ENDERECO), 4, 3)), 2) = 0 THEN 'PAR' ELSE 'IMPAR' END AS PARIDADE,
    SUBSTR(TRIM(A.CD_ENDERECO), 1, 1) AS END1,
    SUBSTR(TRIM(A.CD_ENDERECO), 1, 3) AS END2,
    TRIM(A.CD_ENDERECO) AS END3,
    TRIM(L.CD_PRODUTO) AS CODIGO,
    CASE 
        WHEN INSTR(TRIM(L.CD_PRODUTO), '/') > 0 THEN SUBSTR(TRIM(L.CD_PRODUTO), 1, INSTR(TRIM(L.CD_PRODUTO), '/') - 1)
        ELSE TRIM(L.CD_PRODUTO)
    END AS COD_GEMCO,
    TRIM(S.DS_PRODUTO) AS DS_ITEM,
    TO_NUMBER(TRIM(L.QT_ESTOQUE)) AS QNTS,
    TO_NUMBER(TRIM(L.QT_RESERVA_SAIDA)) AS RESERVA,
    TO_NUMBER(TRIM(L.QT_TRANSITO_ENTRADA)) AS TRANSITO,
    (K.VL_ALTURA * K.VL_LARGURA * K.VL_PROFUNDIDADE) / 1000000 AS CUBAGEM,
    ROUND((K.VL_ALTURA * K.VL_LARGURA * K.VL_PROFUNDIDADE) / 1000000 * L.QT_ESTOQUE, 3) AS CUB_TOTAL,
    TRIM(S.CD_CLASSE) AS CLASSE_ITEM,
    TRIM(S.CD_CLASSE) || ' - ' || D.DS_CLASSE AS DS_CLASSE_ITEM,
    TO_NUMBER(TRIM(LI.CD_LINHA)) AS CD_LINHA,
    LI.DS_LINHA,
    TO_NUMBER(TRIM(FA.CD_FAMILIA)) AS CD_FAMILIA,
    FA.DS_FAMILIA,
    TRIM(A.CD_TIPO_ENDERECO) || ' - ' || TRIM(C.DS_TIPO_ENDERECO) AS TIPO_DE_END,
    C.CD_TIPO_ENDERECO,
    C.DS_TIPO_ENDERECO,
    C.QT_CAPAC_PALETES,
    C.QT_PRODUTOS_DISTINTOS,
    C.ID_VARIOS_PRODUTOS,
    C.CD_TIPO_ESTRUTURA,
    C.VL_ALTURA,
    C.VL_LARGURA,
    C.VL_PROFUNDIDADE,
    C.VL_PESO_MAXIMO,
    K.PS_LIQUIDO,
    K.PS_BRUTO,
    TO_NUMBER(REPLACE(((C.VL_ALTURA * C.VL_LARGURA * C.VL_PROFUNDIDADE * C.QT_CAPAC_PALETES)/1000000), '.', '')) AS CUB_ESTRUTURA,
    TRIM(A.CD_CLASSE) || ' - ' || TRIM(D.DS_CLASSE) AS CLASSE_ENDERECO,
    TRIM(A.CD_ROTATIVIDADE) || ' - ' || TRIM(F.DS_ROTATIVIDADE) AS ROTATIVIDADE,
    TRIM(A.CD_SITUACAO) || ' - ' || TRIM(E.DS_SITUACAO) AS SITUACAO,
    TRIM(TA.CD_AREA_ARMAZ) || ' - ' || TRIM(TA.DS_AREA_ARMAZ) AS AREA_ARMEZENAGEM,
    TA.DS_AREA_ERP,
    CASE WHEN TRIM(A.ID_ARMAZ_FLEXIVEL) = 'S' THEN 'SIM' WHEN TRIM(A.ID_ARMAZ_FLEXIVEL) = 'N' THEN 'NAO' END AS FLEXIVEL,
    CASE WHEN TRIM(A.ID_ENDERECO_BAIXO) = 'S' THEN 'BAIXO' WHEN TRIM(A.ID_ENDERECO_BAIXO) = 'N' THEN 'ALTO' END AS NIVEL,
    TRIM(A.TP_PALETE) || ' - ' || TRIM(G.DS_PALETE) AS TIPO_DE_PALETE,
    CASE WHEN (SELECT COUNT(DISTINCT L2.CD_PRODUTO) FROM WIS50.T_ESTOQUE L2 WHERE L2.CD_ENDERECO = A.CD_ENDERECO AND L2.CD_EMPRESA = A.CD_EMPRESA) > 1 THEN 1 ELSE 0 END AS MULTIPLO_CODIGO,
    L.DT_FABRICACAO,
    L.DT_VALIDADE,
    CASE WHEN L.DT_VALIDADE IS NULL THEN NULL WHEN L.DT_VALIDADE < SYSDATE THEN 'VENCIDO' ELSE TO_CHAR(TRUNC(L.DT_VALIDADE - SYSDATE)) END AS DIAS_PARA_VENCIMENTO,
    S.ID_CONTROLE_VALIDADE,
    S.QT_DIAS_BLOQUEIO_VALIDADE,
    TO_CHAR(L.DT_ULTIMO_INVENTARIO, 'DD/MM/YYYY') AS DATA_ARMAZENAGEM,
    TO_CHAR(DET.MAX_DT_SEPARACAO, 'DD/MM/YYYY') AS DATA_SEPARACAO,
    ROUND(SYSDATE - L.DT_ULTIMO_INVENTARIO) AS DIAS_ARMAZENAGEM,
    CASE WHEN DET.MAX_DT_SEPARACAO IS NULL THEN NULL ELSE ROUND(SYSDATE - DET.MAX_DT_SEPARACAO) END AS DIAS_SEPARACAO,
    CASE 
        WHEN DET.MAX_DT_SEPARACAO IS NULL AND L.DT_ULTIMO_INVENTARIO IS NOT NULL THEN
            CASE 
                WHEN (ROUND(SYSDATE - L.DT_ULTIMO_INVENTARIO)) > 120 THEN 'ACIMA DE 120 DIAS'
                WHEN (ROUND(SYSDATE - L.DT_ULTIMO_INVENTARIO)) BETWEEN 91 AND 120 THEN '120 DIAS'
                WHEN (ROUND(SYSDATE - L.DT_ULTIMO_INVENTARIO)) BETWEEN 31 AND 90 THEN '90 DIAS'
                ELSE '30 DIAS'
            END
        WHEN DET.MAX_DT_SEPARACAO IS NOT NULL THEN
            CASE 
                WHEN (ROUND(SYSDATE - DET.MAX_DT_SEPARACAO)) > 120 THEN 'ACIMA DE 120 DIAS'
                WHEN (ROUND(SYSDATE - DET.MAX_DT_SEPARACAO)) BETWEEN 91 AND 120 THEN '120 DIAS'
                WHEN (ROUND(SYSDATE - DET.MAX_DT_SEPARACAO)) BETWEEN 31 AND 90 THEN '90 DIAS'
                ELSE '30 DIAS'
            END
        ELSE NULL 
    END AS PERIODO_MOVIMENTACAO,
    TO_CHAR(L.DT_ULTIMO_INVENTARIO, 'YYYY') AS ANO_ARMAZENAGEM,
    TO_CHAR(L.DT_ULTIMO_INVENTARIO, 'MM') AS MES_ARMAZENAGEM,
    NVL(TO_CHAR(DET.MAX_DT_SEPARACAO, 'YYYY'), '') AS ANO_SEPARACAO,
    NVL(TO_CHAR(DET.MAX_DT_SEPARACAO, 'MM'), '') AS MES_SEPARACAO,
    L.DT_ULTIMO_INVENTARIO
FROM WIS50.T_ENDERECO_ESTOQUE A
JOIN WIS50.T_EMPRESA B ON A.CD_EMPRESA = B.CD_EMPRESA
JOIN WIS50.T_TIPO_ENDERECO C ON A.CD_TIPO_ENDERECO = C.CD_TIPO_ENDERECO
JOIN WIS50.T_CLASSE D ON A.CD_CLASSE = D.CD_CLASSE
JOIN WIS50.T_SITUACAO E ON A.CD_SITUACAO = E.CD_SITUACAO
JOIN WIS50.T_ROTATIVIDADE F ON A.CD_ROTATIVIDADE = F.CD_ROTATIVIDADE
JOIN WIS50.T_TIPO_PALETE G ON A.TP_PALETE = G.TP_PALETE
LEFT JOIN WIS50.T_ESTOQUE L ON L.CD_ENDERECO = A.CD_ENDERECO AND L.CD_EMPRESA = A.CD_EMPRESA
LEFT JOIN WIS50.T_PRODUTO S ON S.CD_PRODUTO = L.CD_PRODUTO AND L.CD_EMPRESA = S.CD_EMPRESA
LEFT JOIN WIS50.T_CAB_PRODUTO K ON K.CD_PRODUTO = S.CD_PRODUTO
LEFT JOIN WIS50.T_LINHA LI ON K.CD_LINHA = LI.CD_LINHA
LEFT JOIN WIS50.T_FAMILIA_PRODUTO FA ON K.CD_FAMILIA = FA.CD_FAMILIA
LEFT JOIN WIS50.T_TIPO_AREA TA ON A.CD_AREA_ARMAZ = TA.CD_AREA_ARMAZ
LEFT JOIN (
    SELECT 
        CD_EMPRESA, 
        CD_PRODUTO, 
        MAX(DT_SEPARACAO) AS MAX_DT_SEPARACAO
    FROM WIS50.T_DET_SEPARACAO
    WHERE CD_EMPRESA in (1994)
      AND SUBSTR(CD_ENDERECO, 1, 1) <> 'T'
      AND DT_SEPARACAO >= SYSDATE - 130
    GROUP BY CD_EMPRESA, CD_PRODUTO
) DET ON L.CD_EMPRESA = DET.CD_EMPRESA AND L.CD_PRODUTO = DET.CD_PRODUTO
WHERE A.CD_EMPRESA IN (1994)
ORDER BY L.QT_ESTOQUE, A.CD_ENDERECO
"""

def update_estoque_status(status, message, progress=0, total=0, elapsed_seconds=0):
    try:
        now = datetime.datetime.now().isoformat()
        status_obj = {
            "status": status,
            "message": message,
            "progress": progress,
            "total": total,
            "elapsed_seconds": elapsed_seconds,
            "updated_at": now
        }
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        for key in ["estoque_sync_status", "estoque_sync_command"]:
            payload = {
                "cell_key": key,
                "value": json.dumps(status_obj, ensure_ascii=False),
                "updated_at": now
            }
            requests.post(f"{SUPABASE_URL}/rest/v1/performance_metrics", json=payload, headers=headers, timeout=10)
    except Exception as e:
        print("[STATUS ERROR ESTOQUE]", e)

def sync_estoque():
    """Executa a sincronização completa do Estoque WIS (EstoqueCD.sql) diretamente no banco"""
    t0 = time.time()
    print("\n" + "=" * 70)
    print("INICIANDO SINCRONIZAÇÃO DE ESTOQUE WIS50 -> DASHBOARD")
    print("=" * 70)
    update_estoque_status("running", "Conectando ao banco de dados Oracle WIS (ODBC)...", 10)

    try:
        import pyodbc
    except ImportError:
        err = "pyodbc não está instalado neste ambiente."
        print(f"[ERRO ESTOQUE WIS] {err}")
        update_estoque_status("error", err, 0)
        return False

    mapa_custos = {}
    base_dir = Path(__file__).resolve().parent
    possiveis_caminhos_custos = [
        base_dir / "src" / "data" / "base_valores_custos.json",
        base_dir.parent / "src" / "data" / "base_valores_custos.json",
        base_dir / "Magalog CDs" / "src" / "data" / "base_valores_custos.json",
        Path.home() / "Desktop" / "Magalog CDs" / "src" / "data" / "base_valores_custos.json",
        Path(r"C:\Users\joh_gomes\Desktop\Magalog CDs\src\data\base_valores_custos.json"),
        base_dir / "base_valores_custos.json"
    ]
    for p in possiveis_caminhos_custos:
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    candidato = json.load(f)
                if isinstance(candidato, dict) and len(candidato) > len(mapa_custos):
                    mapa_custos = candidato
                    print(f"[WIS] Base de custos carregada de '{p.name}' ({len(mapa_custos):,} produtos)!")
            except Exception:
                pass

    conn_str = f"DSN={WIS_DSN};UID={WIS_USER};PWD={WIS_PWD}"
    print(f"[WIS] Conectando com DSN '{WIS_DSN}'...")
    try:
        cnxn = pyodbc.connect(conn_str, timeout=15)
        cursor = cnxn.cursor()
    except Exception as e:
        err = f"Erro na conexão ODBC com '{WIS_DSN}': {e}"
        print(f"[ERRO ESTOQUE WIS] {err}")
        update_estoque_status("error", err, 0)
        return False

    update_estoque_status("running", "Executando consulta SQL de Estoque no WIS50...", 30)
    print("[WIS] Executando consulta SQL de Estoque...")

    try:
        cursor.execute(WIS_ESTOQUE_QUERY)
        rows = cursor.fetchall()
        cols = [c[0] for c in cursor.description]
        print(f"[WIS] Consulta finalizada! {len(rows):,} linhas retornadas.")
    except Exception as e:
        err = f"Erro na execução do SQL: {e}"
        print(f"[ERRO ESTOQUE WIS] {err}")
        update_estoque_status("error", err, 0)
        try:
            cnxn.close()
        except Exception:
            pass
        return False

    try:
        cnxn.close()
    except Exception:
        pass

    update_estoque_status("running", f"Processando {len(rows):,} itens e calculando cubagem/valores...", 70)

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
            except Exception:
                pass
        import re
        m = re.search(r"VOL:?\s*(\d+)\s*/\s*(\d+)", ds_item)
        if m:
            master = gemco or (codigo.split("/")[0] if codigo else "")
            try:
                tot_vols = int(m.group(2))
                master_volumes_count[master] = max(master_volumes_count.get(master, 0), tot_vols)
            except Exception:
                pass

    # Se mapa de custos estiver vazio ou incompleto, busca automaticamente do Supabase (base_valores)
    distinct_codes = set()
    for r in rows:
        row_dict = dict(zip(cols, r))
        c_cod = str(row_dict.get("CODIGO") or "").strip()
        c_gem = str(row_dict.get("COD_GEMCO") or "").strip()
        c_mast = c_gem or (c_cod.split("/")[0] if c_cod else "")
        if c_mast:
            distinct_codes.add(c_mast)
        if c_cod:
            distinct_codes.add(c_cod)

    missing_codes = [c for c in distinct_codes if c not in mapa_custos]
    if missing_codes:
        print(f"[WIS] Buscando custos de {len(missing_codes):,} produtos no Supabase (tabela base_valores)...")
        update_estoque_status("running", f"Buscando custos de {len(missing_codes):,} produtos no Supabase...", 60)
        batch_size = 300
        for i in range(0, len(missing_codes), batch_size):
            batch = missing_codes[i : i + batch_size]
            in_clause = ",".join(batch)
            try:
                url = f"{SUPABASE_URL}/rest/v1/base_valores?select=codigo,custo_inv&codigo=in.({in_clause})"
                headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
                res = requests.get(url, headers=headers, verify=False, timeout=15)
                if res.status_code == 200:
                    for item in res.json():
                        c_code = str(item.get("codigo") or "").strip()
                        c_val = float(item.get("custo_inv") or 0.0)
                        if c_code:
                            mapa_custos[c_code] = c_val
            except Exception as e:
                print(f"[WIS AVISO] Erro ao buscar lote de custos: {e}")

        # Salva em cache local para as próximas consultas apenas se tiver mais produtos
        try:
            cache_file = base_dir / "base_valores_custos.json"
            deve_salvar = True
            if cache_file.exists():
                try:
                    with open(cache_file, "r", encoding="utf-8") as f_old:
                        old_map = json.load(f_old)
                    if isinstance(old_map, dict) and len(old_map) >= len(mapa_custos):
                        deve_salvar = False
                except Exception:
                    pass
            if deve_salvar:
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(mapa_custos, f, ensure_ascii=False)
                print(f"[WIS] Cache local de custos salvo ({len(mapa_custos):,} produtos)!")
        except Exception:
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

            custo_master = float(
                mapa_custos.get(master)
                or mapa_custos.get(master.lstrip("0"))
                or mapa_custos.get(codigo)
                or mapa_custos.get(codigo.lstrip("0"))
                or 0.0
            )
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

            custo_master = float(
                mapa_custos.get(master)
                or mapa_custos.get(master.lstrip("0"))
                or mapa_custos.get(codigo)
                or mapa_custos.get(codigo.lstrip("0"))
                or 0.0
            )
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
        requests.post(f"{SUPABASE_URL}/rest/v1/performance_metrics", json=sb_payload, headers=headers, timeout=15)
        print("[WIS] Supabase atualizado com sucesso em estoque_categoria_summary!")
    except Exception as e:
        print("[ERRO SUPABASE ESTOQUE]", e)

    elapsed = round(time.time() - t0, 1)
    msg_sucesso = f"Estoque atualizado com sucesso! {len(rows):,} registros processados em {elapsed}s."
    update_estoque_status("success", msg_sucesso, 100, len(rows), elapsed)
    print(f"\n[SUCESSO ESTOQUE] {msg_sucesso}\n")
    return True

active_syncs = {
    "pcp": False,
    "supply": False,
    "estoque": False
}

def _run_pcp_thread():
    active_syncs["pcp"] = True
    try:
        sync_carteira()
    finally:
        active_syncs["pcp"] = False

def _run_supply_thread():
    active_syncs["supply"] = True
    try:
        sync_supply()
    finally:
        active_syncs["supply"] = False

def _run_estoque_thread():
    active_syncs["estoque"] = True
    try:
        sync_estoque()
    finally:
        active_syncs["estoque"] = False

def sentinel_loop():
    print("=" * 70)
    print("MODO SENTINELA UNIFICADO ATIVO (MULTITHREADING PARALELO)")
    print("Ouvindo os três botões do site simultaneamente:")
    print("  [PCP]     'Atualizar Carteira' -> canal pcp_sync_command")
    print("  [SUPPLY]  'Atualizar Supply'   -> canal supply_sync_command")
    print("  [ESTOQUE] 'Atualizar Estoque'  -> canal estoque_sync_command")
    print("Consultas rodam em paralelo! Mantenha esta janela minimizada.")
    print("Pressione Ctrl+C para encerrar quando quiser.")
    print("=" * 70 + "\n")

    # Verifica se já havia pedidos pendentes no momento da inicialização
    try:
        init_cmd = get_supabase_command()
        if init_cmd and isinstance(init_cmd, dict) and init_cmd.get("status") == "requested":
            print("[PCP] Pedido pendente encontrado! Disparando Carteira...")
            threading.Thread(target=_run_pcp_thread, daemon=True).start()
    except Exception:
        pass

    try:
        init_supply = get_supabase_supply_command()
        if init_supply and isinstance(init_supply, dict) and init_supply.get("status") == "requested":
            print("[SUPPLY] Pedido pendente encontrado! Disparando Supply...")
            threading.Thread(target=_run_supply_thread, daemon=True).start()
    except Exception:
        pass

    try:
        init_estoque = get_supabase_estoque_command()
        if init_estoque and isinstance(init_estoque, dict) and init_estoque.get("status") == "requested":
            print("[ESTOQUE] Pedido pendente encontrado! Disparando Estoque WIS...")
            threading.Thread(target=_run_estoque_thread, daemon=True).start()
    except Exception:
        pass

    last_pcp_time = ""
    last_supply_time = ""
    last_estoque_time = ""

    while True:
        try:
            # --- Canal PCP ---
            cmd = get_supabase_command()
            if cmd and isinstance(cmd, dict):
                status = cmd.get("status")
                req_time = cmd.get("requested_at", "")
                if status == "requested" and req_time != last_pcp_time:
                    last_pcp_time = req_time
                    if not active_syncs["pcp"]:
                        print(f"\n[PCP] Sinal detectado do site às {req_time}. Iniciando sync da Carteira em paralelo...")
                        threading.Thread(target=_run_pcp_thread, daemon=True).start()
                    else:
                        print(f"\n[PCP] Sincronização da Carteira já em andamento. Aguardando...")

            # --- Canal Supply ---
            supply_cmd = get_supabase_supply_command()
            if supply_cmd and isinstance(supply_cmd, dict):
                s_status = supply_cmd.get("status")
                s_req_time = supply_cmd.get("requested_at", "")
                if s_status == "requested" and s_req_time != last_supply_time:
                    last_supply_time = s_req_time
                    if not active_syncs["supply"]:
                        print(f"\n[SUPPLY] Sinal detectado do site às {s_req_time}. Iniciando sync do Supply em paralelo...")
                        threading.Thread(target=_run_supply_thread, daemon=True).start()
                    else:
                        print(f"\n[SUPPLY] Sincronização do Supply já em andamento. Aguardando...")

            # --- Canal Estoque WIS ---
            estoque_cmd = get_supabase_estoque_command()
            if estoque_cmd and isinstance(estoque_cmd, dict):
                e_status = estoque_cmd.get("status")
                e_req_time = estoque_cmd.get("requested_at", "")
                if e_status == "requested" and e_req_time != last_estoque_time:
                    last_estoque_time = e_req_time
                    if not active_syncs["estoque"]:
                        print(f"\n[ESTOQUE] Sinal detectado do site às {e_req_time}. Iniciando sync do Estoque WIS em paralelo...")
                        threading.Thread(target=_run_estoque_thread, daemon=True).start()
                    else:
                        print(f"\n[ESTOQUE] Sincronização do Estoque WIS já em andamento. Aguardando...")

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
