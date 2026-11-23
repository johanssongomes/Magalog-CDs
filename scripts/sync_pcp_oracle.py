"""
Sincronizador Unificado: Oracle MLPDW -> Supabase
==================================================
Ouve dois canais simultaneamente no Supabase:
  - pcp_sync_command   => sync da Carteira PCP J'S MARTINS (tabela pcp_js_martins)
  - supply_sync_command => sync do Supply Lojas (tabela supply_lojas)

Mantém UMA janela só aberta na barra de tarefas, escutando ambos os botões do site.
"""

import os
import sys
import json
import time
import datetime
from pathlib import Path

# Suprime avisos de SSL se estiver em proxy ou VPN corporativa com certificado autoassinado
import urllib3
import requests
urllib3.disable_warnings()

BASE_DIR = Path(__file__).resolve().parent.parent
STATUS_FILE = BASE_DIR / "scripts" / "sync_pcp_status.json"
CACHE_JSON_FILE = BASE_DIR / "src" / "data" / "pcp_planning_summary.json"

# Credenciais e parâmetros de conexão Oracle MLPDW
ORACLE_USER = os.environ.get("ORACLE_USER", "JOH_GOMES")
ORACLE_PWD = os.environ.get("ORACLE_PWD", "m@SSW0RD")
ORACLE_DSN = os.environ.get("ORACLE_DSN", "MLPDW")
ORACLE_HOST = os.environ.get("ORACLE_HOST", "mlpdwpkg.magazineluiza.intranet")
ORACLE_HOST_FALLBACK = "100.64.0.6"
ORACLE_PORT = int(os.environ.get("ORACLE_PORT", 1524))
ORACLE_SERVICE = os.environ.get("ORACLE_SERVICE", "MLPDW")

# Credenciais Supabase (lidas dinamicamente do .env)
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") or os.environ.get("VITE_SUPABASE_ANON_KEY", "")

# Carrega .env do projeto se disponível
ENV_PATH = BASE_DIR / ".env"
if ENV_PATH.exists():
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip()
                os.environ.setdefault(k, v)
                if k == "VITE_SUPABASE_URL" and not SUPABASE_URL:
                    SUPABASE_URL = v
                elif k == "SUPABASE_SERVICE_ROLE_KEY" and not SUPABASE_KEY:
                    SUPABASE_KEY = v
                elif k == "VITE_SUPABASE_ANON_KEY" and not SUPABASE_KEY:
                    SUPABASE_KEY = v

# ============================================================
# QUERY SQL: CARTEIRA PCP J'S MARTINS (53 colunas)
# ============================================================
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

def write_status(data):
    """Atualiza o arquivo de status para que a interface web possa acompanhar em tempo real"""
    try:
        data["updated_at"] = datetime.datetime.now().isoformat()
        with open(STATUS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[STATUS ERROR] {e}")

    # Também atualiza no Supabase para a interface web na nuvem acompanhar
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

def get_oracle_connection():
    """Tenta conectar ao Oracle usando pyodbc (DSN MLPDW) ou oracledb"""
    errors = []

    # 1. Tenta pyodbc com DSN MLPDW (ODBC nativo do Windows)
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
        errors.append("pyodbc não está instalado")

    # 2. Tenta oracledb thick mode se houver client local 11g
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

    # 3. Tenta oracledb thin mode (caso servidor seja compativel)
    try:
        import oracledb
        for host in [ORACLE_HOST, ORACLE_HOST_FALLBACK]:
            try:
                print(f"[ORACLE] Tentando oracledb thin mode em {host}:{ORACLE_PORT}/{ORACLE_SERVICE}...")
                dsn = oracledb.makedsn(host, ORACLE_PORT, service_name=ORACLE_SERVICE)
                conn = oracledb.connect(user=ORACLE_USER, password=ORACLE_PWD, dsn=dsn)
                print(f"[ORACLE] Conectado com sucesso via oracledb thin mode ({host})!")
                return conn, "oracledb_thin"
            except Exception as e:
                errors.append(f"oracledb thin ({host}): {e}")
    except ImportError:
        errors.append("oracledb não está instalado")

    raise ConnectionError(
        "Não foi possível conectar ao Oracle. Verifique se você está conectado à VPN corporativa da empresa.\nDetalhes:\n" + "\n".join(errors)
    )

def format_value(col_name, val):
    """Trata valores nulos, converte datas para ISO string e números para tipos corretos"""
    if val is None:
        return None
    
    col = col_name.lower()

    # Datas
    if isinstance(val, (datetime.date, datetime.datetime)):
        return val.strftime("%Y-%m-%d %H:%M:%S")

    # Inteiros
    int_cols = {
        "filorig", "codfil", "filentrega", "tpnota", "qtcomp", "fisico", 
        "resfis", "logico", "reslog", "tecnico", "futuro", "transito", 
        "qtped", "n"
    }
    if col in int_cols:
        try:
            return int(float(str(val).replace(",", ".")))
        except (ValueError, TypeError):
            return None

    # Floats / Decimais
    float_cols = {"cub_tot", "pesoliq", "precounit", "vltotal"}
    if col in float_cols:
        try:
            return round(float(str(val).replace(",", ".")), 4)
        except (ValueError, TypeError):
            return 0.0

    # Texto
    str_val = str(val).strip()
    if col in {"item", "ibm", "codmodal", "numpedven", "numlote", "codrota"}:
        if str_val.endswith(".0"):
            str_val = str_val[:-2]
    return str_val if str_val else None

def sync_carteira():
    start_time = time.time()
    print("=" * 70)
    print("INICIANDO SINCRONIZAÇÃO AUTOMÁTICA DA CARTEIRA PCP J'S MARTINS")
    print("=" * 70)

    write_status({
        "status": "running",
        "step": "connecting",
        "progress": 10,
        "message": "🔌 Conectando ao banco de dados Oracle MLPDW (verificando VPN)..."
    })

    conn = None
    try:
        conn, method = get_oracle_connection()
        print(f"[ORACLE] Conexão estabelecida com sucesso usando '{method}'.")

        write_status({
            "status": "running",
            "step": "querying",
            "progress": 30,
            "message": "📊 Executando consulta SQL da Carteira no Oracle (53 colunas)..."
        })

        cursor = conn.cursor()
        print("[ORACLE] Executando consulta da Carteira...")
        cursor.execute(ORACLE_QUERY)

        # Mapeia os nomes das colunas
        col_names = [d[0].lower() for d in cursor.description]
        print(f"[ORACLE] Colunas retornadas ({len(col_names)}): {', '.join(col_names[:8])}...")

        rows = cursor.fetchall()
        total_rows = len(rows)
        print(f"[ORACLE] Total de pedidos/itens retornados: {total_rows:,} registros.")

        cursor.close()
        conn.close()
        conn = None

        if total_rows == 0:
            msg = "A consulta ao Oracle retornou 0 registros. Nenhuma alteração foi gravada."
            write_status({
                "status": "warning",
                "step": "empty",
                "progress": 100,
                "message": msg,
                "total": 0
            })
            print(f"[AVISO] {msg}")
            return {"success": True, "count": 0, "message": msg}

        # Converte as linhas em lista de dicionários
        write_status({
            "status": "running",
            "step": "formatting",
            "progress": 50,
            "message": f"⚙️ Formatando {total_rows:,} registros para o Supabase..."
        })

        records = []
        for r in rows:
            record = {}
            for col, val in zip(col_names, r):
                record[col] = format_value(col, val)
            records.append(record)

        # Atualiza a tabela Supabase 'pcp_js_martins'
        write_status({
            "status": "running",
            "step": "supabase_cleaning",
            "progress": 60,
            "message": "🧹 Limpando dados anteriores da filial 994 no Supabase..."
        })

        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }

        # Limpa dados da filorig 994
        try:
            del_resp = requests.delete(
                f"{SUPABASE_URL}/rest/v1/pcp_js_martins?filorig=eq.994",
                headers=headers,
                verify=False,
                timeout=30
            )
            print(f"[SUPABASE] Limpeza da filorig 994 concluída (Status {del_resp.status_code}).")
        except Exception as e:
            print(f"[SUPABASE WARNING] Erro ao limpar filorig 994: {e}")

        # Insere em lotes (batch) de 1000
        batch_size = 1000
        inserted_total = 0

        for i in range(0, total_rows, batch_size):
            chunk = records[i:i + batch_size]
            pct = 60 + int((i / total_rows) * 35)

            write_status({
                "status": "running",
                "step": "supabase_inserting",
                "progress": pct,
                "current": inserted_total,
                "total": total_rows,
                "message": f"🚀 Gravando no Supabase: {inserted_total:,} de {total_rows:,} registros ({pct}%)..."
            })

            post_resp = requests.post(
                f"{SUPABASE_URL}/rest/v1/pcp_js_martins",
                headers=headers,
                json=chunk,
                verify=False,
                timeout=60
            )

            if post_resp.status_code not in (200, 201):
                err_msg = f"Erro ao inserir lote {i}-{i+batch_size}: {post_resp.status_code} - {post_resp.text}"
                print(f"[SUPABASE ERROR] {err_msg}")
                raise RuntimeError(err_msg)

            inserted_total += len(chunk)
            print(f"[SUPABASE] Progresso: {inserted_total:,} / {total_rows:,} inseridos.")

        # Atualiza cache local offline se existir
        try:
            write_status({
                "status": "running",
                "step": "local_cache",
                "progress": 98,
                "message": "💾 Atualizando cache local para carregamento instantâneo..."
            })
            with open(CACHE_JSON_FILE, "w", encoding="utf-8") as f:
                json.dump(records, f, ensure_ascii=False)
            print(f"[CACHE] Arquivo local {CACHE_JSON_FILE.name} atualizado com sucesso!")
        except Exception as ce:
            print(f"[CACHE WARNING] Não foi possível atualizar {CACHE_JSON_FILE}: {ce}")

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

        return {"success": True, "count": inserted_total, "elapsed": elapsed, "message": success_msg}

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

def get_supabase_command():
    """Lê o comando na fila do Supabase para saber se o site solicitou sincronização da Carteira"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/performance_metrics?cell_key=eq.pcp_sync_command&select=value"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        res = requests.get(url, headers=headers, verify=False, timeout=8)
        if res.status_code == 200:
            data = res.json()
            if data and "value" in data[0]:
                return json.loads(data[0]["value"])
    except Exception:
        pass
    return None

def get_supabase_supply_command():
    """Lê o comando na fila do Supabase para saber se o site solicitou sincronização do Supply"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/performance_metrics?cell_key=eq.supply_sync_command&select=value"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        res = requests.get(url, headers=headers, verify=False, timeout=8)
        if res.status_code == 200:
            data = res.json()
            if data and "value" in data[0]:
                return json.loads(data[0]["value"])
    except Exception:
        pass
    return None

# ============================================================
# QUERY SQL: SUPPLY LOJAS (CD 994 x 45 Lojas)
# ============================================================
SUPPLY_QUERY = """
SELECT
    A.CODFIL,
    A.CODITPROD || B.DIGITPROD AS CODIGO_PRODUTO,
    B.CODPRODDF,
    C.DESCRICAO,

    /* ESTOQUE CD 994 */
    NVL(A.FISICO, 0) AS FISICO_994,
    NVL(A.TECNICO, 0) AS TECNICO_994,
    NVL(A.RESFIS, 0) AS RESFIS_994,
    NVL(A.RESLOG, 0) AS RESLOG_994,
    NVL(A.LOGICO, 0) AS LOGICO_994,
    NVL(A.TRANSITO, 0) AS TRANSITO_994,

    NVL(A.FISICO, 0) + NVL(A.TECNICO, 0)
        AS ESTOQUE_994,

    /* ESTOQUE DAS LOJAS */
    L.CODFIL AS FILIAL,
    NVL(L.FISICO, 0) AS FISICO,
    NVL(L.TECNICO, 0) AS TECNICO,
    NVL(L.RESFIS, 0) AS RESFIS,
    NVL(L.RESLOG, 0) AS RESLOG,
    NVL(L.LOGICO, 0) AS LOGICO,
    NVL(L.TRANSITO, 0) AS TRANSITO,

    NVL(L.FISICO, 0) + NVL(L.TECNICO, 0)
        AS ESTOQUE_LOJA,

    /* CUSTO E VALOR DO ESTOQUE */
    D.CMUP,

    (NVL(A.FISICO, 0) + NVL(A.TECNICO, 0))
        * NVL(D.CMUP, 0) AS VALOR_ESTOQUE_994,

    /* STATUS */
    CASE
        WHEN NVL(L.FISICO, 0) > 0
            THEN 'LOJA COM FISICO'
        ELSE 'LOJA SEM FISICO'
    END AS STATUS_ESTOQUE,

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

LEFT JOIN GEMCO.CAD_ITPROD@PRODUCAO B
    ON B.CODITPROD = A.CODITPROD

LEFT JOIN GEMCO.CAD_PROD@PRODUCAO C
    ON C.CODPROD = B.CODPROD

LEFT JOIN ADM.MAG_T_ARVORE_PRODUTO D
    ON D.CODITPROD = A.CODITPROD

WHERE A.CODFIL = 994
  AND NVL(A.FISICO, 0) + NVL(A.TECNICO, 0) > 0

ORDER BY
    A.CODITPROD,
    L.CODFIL
"""

def write_supply_status(data):
    """Atualiza o status da sincronização do Supply no Supabase (canal supply_sync_command)"""
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
            "updated_at": data["updated_at"]
        }
        requests.post(url, headers=headers, json=payload, verify=False, timeout=8)
    except Exception as e:
        print(f"[SUPPLY STATUS ERROR] {e}")

def format_supply_value(col_name, val):
    """Trata valores do Supply: nulos, datas e tipos numéricos"""
    if val is None:
        return None
    col = col_name.lower()
    if isinstance(val, (datetime.date, datetime.datetime)):
        return val.strftime("%Y-%m-%d %H:%M:%S")
    int_cols = {"codfil", "filial"}
    if col in int_cols:
        try:
            return int(float(str(val).replace(",", ".")))
        except (ValueError, TypeError):
            return None
    float_cols = {
        "fisico_994", "tecnico_994", "resfis_994", "reslog_994", "logico_994",
        "transito_994", "estoque_994", "fisico", "tecnico", "resfis", "reslog",
        "logico", "transito", "estoque_loja", "cmup", "valor_estoque_994"
    }
    if col in float_cols:
        try:
            return round(float(str(val).replace(",", ".")), 4)
        except (ValueError, TypeError):
            return 0.0
    str_val = str(val).strip()
    return str_val if str_val else None

def sync_supply():
    """Sincroniza Supply Lojas: Oracle MLPDW -> Supabase (supply_lojas)"""
    start_time = time.time()
    print("=" * 70)
    print("INICIANDO SINCRONIZAÇÃO DO SUPPLY LOJAS (CD 994 x 45 LOJAS)")
    print("=" * 70)

    write_supply_status({
        "status": "running",
        "step": "connecting",
        "progress": 10,
        "message": "🔌 Conectando ao Oracle MLPDW para buscar estoque do Supply..."
    })

    conn = None
    try:
        conn, method = get_oracle_connection()
        print(f"[ORACLE] Conexão estabelecida com sucesso usando '{method}'.")

        write_supply_status({
            "status": "running",
            "step": "querying",
            "progress": 25,
            "message": "📊 Executando consulta SQL do Supply (CD 994 x 45 Lojas)..."
        })

        cursor = conn.cursor()
        print("[ORACLE] Executando consulta do Supply...")
        cursor.execute(SUPPLY_QUERY)

        col_names = [d[0].lower() for d in cursor.description]
        print(f"[ORACLE] Colunas retornadas ({len(col_names)}): {', '.join(col_names[:8])}...")

        rows = cursor.fetchall()
        total_rows = len(rows)
        print(f"[ORACLE] Total de registros de Supply: {total_rows:,}")

        cursor.close()
        conn.close()
        conn = None

        if total_rows == 0:
            msg = "A consulta do Supply retornou 0 registros. Nenhuma alteração foi gravada."
            write_supply_status({
                "status": "warning",
                "step": "empty",
                "progress": 100,
                "message": msg,
                "total": 0
            })
            print(f"[AVISO] {msg}")
            return {"success": True, "count": 0, "message": msg}

        write_supply_status({
            "status": "running",
            "step": "formatting",
            "progress": 40,
            "message": f"⚙️ Formatando {total_rows:,} registros para o Supabase..."
        })

        records = []
        for r in rows:
            record = {}
            for col, val in zip(col_names, r):
                record[col] = format_supply_value(col, val)
            records.append(record)

        # Limpa tabela supply_lojas
        write_supply_status({
            "status": "running",
            "step": "supabase_cleaning",
            "progress": 50,
            "message": "🧹 Limpando dados anteriores do Supply no Supabase..."
        })

        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }

        try:
            del_resp = requests.delete(
                f"{SUPABASE_URL}/rest/v1/supply_lojas?id=gte.0",
                headers=headers,
                verify=False,
                timeout=60
            )
            print(f"[SUPABASE] Limpeza do supply_lojas concluída (Status {del_resp.status_code}).")
        except Exception as e:
            print(f"[SUPABASE WARNING] Erro ao limpar supply_lojas: {e}")

        # Insere em lotes de 500 (Supply pode ter muitas linhas)
        batch_size = 500
        inserted_total = 0

        for i in range(0, total_rows, batch_size):
            chunk = records[i:i + batch_size]
            pct = 50 + int((i / total_rows) * 45)

            write_supply_status({
                "status": "running",
                "step": "supabase_inserting",
                "progress": pct,
                "current": inserted_total,
                "total": total_rows,
                "message": f"🚀 Gravando Supply no Supabase: {inserted_total:,} de {total_rows:,} registros ({pct}%)..."
            })

            post_resp = requests.post(
                f"{SUPABASE_URL}/rest/v1/supply_lojas",
                headers=headers,
                json=chunk,
                verify=False,
                timeout=60
            )

            if post_resp.status_code not in (200, 201):
                err_msg = f"Erro ao inserir lote Supply {i}-{i+batch_size}: {post_resp.status_code} - {post_resp.text}"
                print(f"[SUPABASE ERROR] {err_msg}")
                raise RuntimeError(err_msg)

            inserted_total += len(chunk)
            print(f"[SUPABASE] Supply progresso: {inserted_total:,} / {total_rows:,} inseridos.")

        elapsed = round(time.time() - start_time, 1)
        success_msg = f"Supply atualizado! {inserted_total:,} registros sincronizados em {elapsed}s."
        print(f"\n[SUCESSO SUPPLY] {success_msg}\n")

        write_supply_status({
            "status": "success",
            "step": "completed",
            "progress": 100,
            "total": inserted_total,
            "elapsed_seconds": elapsed,
            "message": success_msg
        })

        return {"success": True, "count": inserted_total, "elapsed": elapsed, "message": success_msg}

    except Exception as e:
        err_text = str(e)
        print(f"\n[FALHA SUPPLY] {err_text}\n")
        write_supply_status({
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



def sentinel_loop():
    print("=" * 70)
    print("MODO SENTINELA UNIFICADO ATIVO")
    print("Ouvindo ambos os botões do site:")
    print("  [PCP]    'Atualizar Carteira' -> canal pcp_sync_command")
    print("  [SUPPLY] 'Atualizar Supply'   -> canal supply_sync_command")
    print("Mantenha esta janela minimizada na barra de tarefas.")
    print("Pressione Ctrl+C para encerrar quando quiser.")
    print("=" * 70 + "\n")

    # Verifica se já havia pedidos pendentes no momento da inicialização
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

    last_pcp_time = ""
    last_supply_time = ""

    while True:
        try:
            # --- Canal PCP ---
            cmd = get_supabase_command()
            if cmd and isinstance(cmd, dict):
                status = cmd.get("status")
                req_time = cmd.get("requested_at", "")
                if status == "requested" and req_time != last_pcp_time:
                    last_pcp_time = req_time
                    print(f"\n[PCP] Sinal detectado do site às {req_time}. Iniciando sync da Carteira...")
                    sync_carteira()
                    print("\n[SENTINELA] Aguardando novos cliques no site...\n")

            # --- Canal Supply ---
            supply_cmd = get_supabase_supply_command()
            if supply_cmd and isinstance(supply_cmd, dict):
                s_status = supply_cmd.get("status")
                s_req_time = supply_cmd.get("requested_at", "")
                if s_status == "requested" and s_req_time != last_supply_time:
                    last_supply_time = s_req_time
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
        sync_carteira()
        sentinel_loop()
