"""
Sincronizador Automático de Carteira PCP J'S MARTINS: Oracle MLPDW -> Supabase (pcp_js_martins)
=================================================================================================
Este script realiza:
1. Conexão direta com o banco de dados Oracle Corporativo (MLPDW) utilizando credenciais salvas.
2. Execução da query SQL oficial da Carteira (53 colunas).
3. Formatação e mapeamento de tipos de dados.
4. Gravação direta no Supabase (pcp_js_martins) em lotes (batch).
5. Atualização do arquivo de cache local (src/data/pcp_planning_summary.json).
6. Registro de status em tempo real (scripts/sync_pcp_status.json) para o frontend.
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

def get_oracle_connection():
    """Tenta conectar ao Oracle usando oracledb (thin mode e thick mode) ou pyodbc (DSN e Driver)"""
    errors = []

    # 1. Tenta oracledb thin mode (puro python, não requer DLLs)
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

    # 2. Tenta pyodbc com DSN MLPDW
    try:
        import pyodbc
        try:
            print("[ORACLE] Tentando pyodbc com DSN=MLPDW...")
            conn_str = f"DSN={ORACLE_DSN};UID={ORACLE_USER};PWD={ORACLE_PWD};"
            conn = pyodbc.connect(conn_str, timeout=15)
            print("[ORACLE] Conectado com sucesso via pyodbc (DSN)!")
            return conn, "pyodbc_dsn"
        except Exception as e:
            errors.append(f"pyodbc DSN: {e}")

        # 3. Tenta pyodbc com DRIVER direto
        try:
            print("[ORACLE] Tentando pyodbc com DRIVER={Oracle em OraClient11g_home1}...")
            conn_str = f"DRIVER={{Oracle em OraClient11g_home1}};DBQ={ORACLE_DSN};UID={ORACLE_USER};PWD={ORACLE_PWD};"
            conn = pyodbc.connect(conn_str, timeout=15)
            print("[ORACLE] Conectado com sucesso via pyodbc (Driver)!")
            return conn, "pyodbc_driver"
        except Exception as e:
            errors.append(f"pyodbc Driver: {e}")
    except ImportError:
        errors.append("pyodbc não está instalado")

    # 4. Tenta oracledb thick mode se houver client local
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
            print("[ORACLE] Conectado com sucesso via oracledb thick mode!")
            return conn, "oracledb_thick"
        except Exception as e:
            errors.append(f"oracledb thick: {e}")

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

if __name__ == "__main__":
    result = sync_carteira()
    if not result.get("success"):
        sys.exit(1)
