"""
Sincronizador Autônomo e Sentinela: Oracle MLPDW (Servidor Corporativo) -> Supabase
=====================================================================================
Copie este arquivo e 'atualizar_carteira_servidor.bat' para a Área de Trabalho 
do servidor da empresa (ml-ibm-vpnts02).

Ele roda automaticamente:
1. Faz a sincronização da Carteira na hora.
2. Mantém o Modo Sentinela ativo para responder aos cliques do site em tempo real!
"""

import os
import sys
import time
import json
import base64
import datetime
import urllib3
import requests

urllib3.disable_warnings()

ORACLE_USER = os.environ.get("ORACLE_USER", "JOH_GOMES")
ORACLE_PWD = os.environ.get("ORACLE_PWD", "m@SSW0RD")
ORACLE_DSN = os.environ.get("ORACLE_DSN", "MLPDW")
ORACLE_HOST = os.environ.get("ORACLE_HOST", "mlpdwpkg.magazineluiza.intranet")
ORACLE_HOST_FALLBACK = "100.64.0.6"
ORACLE_PORT = int(os.environ.get("ORACLE_PORT", 1524))
ORACLE_SERVICE = os.environ.get("ORACLE_SERVICE", "MLPDW")

SUPABASE_URL = "https://alwkfgqylejckbgienju.supabase.co"
_B64_KEY = "c2Jfc2VjcmV0XzRpOG5HSnpHQmFSSkYySE5YS1RDbEFfWVV1aTRLQ3k="
SUPABASE_KEY = base64.b64decode(_B64_KEY).decode("utf-8")

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

def update_supabase_status(status, progress=0, message="", total=0, elapsed=0):
    try:
        url = f"{SUPABASE_URL}/rest/v1/performance_metrics"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        val = {
            "action": "sync",
            "status": status,
            "progress": progress,
            "message": message,
            "total_records": total,
            "elapsed_seconds": elapsed,
            "updated_at": datetime.datetime.now().isoformat()
        }
        payload = {
            "cell_key": "pcp_sync_command",
            "value": json.dumps(val, ensure_ascii=False)
        }
        requests.post(url, headers=headers, json=payload, verify=False, timeout=10)
    except Exception as e:
        print(f"[STATUS SUPABASE AVISO] {e}")

def get_supabase_command():
    try:
        url = f"{SUPABASE_URL}/rest/v1/performance_metrics?cell_key=eq.pcp_sync_command&select=value"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        res = requests.get(url, headers=headers, verify=False, timeout=10)
        if res.status_code == 200:
            data = res.json()
            if data and "value" in data[0]:
                return json.loads(data[0]["value"])
    except Exception:
        pass
    return None

def connect_oracle():
    errors = []

    # 1. pyodbc com DSN MLPDW (o mesmo configurado no Excel da empresa)
    try:
        import pyodbc
        for dsn_str in [
            f"DSN={ORACLE_DSN};UID={ORACLE_USER};PWD={ORACLE_PWD};DBQ={ORACLE_DSN};",
            f"DSN={ORACLE_DSN};UID={ORACLE_USER};PWD={ORACLE_PWD};",
            f"DRIVER={{Oracle em OraClient11g_home1}};DBQ={ORACLE_DSN};UID={ORACLE_USER};PWD={ORACLE_PWD};"
        ]:
            try:
                name = dsn_str.split(";")[0]
                print(f"[ORACLE] Conectando via ODBC ({name})...")
                conn = pyodbc.connect(dsn_str, timeout=15)
                print("[ORACLE] Conectado com sucesso via ODBC!")
                return conn
            except Exception as e:
                errors.append(f"ODBC ({name}): {e}")
    except ImportError:
        errors.append("pyodbc não está instalado")

    # 2. oracledb thin mode (TCP direto)
    try:
        import oracledb
        for host in [ORACLE_HOST, ORACLE_HOST_FALLBACK]:
            try:
                print(f"[ORACLE] Conectando via oracledb thin ({host}:{ORACLE_PORT}/{ORACLE_SERVICE})...")
                dsn = oracledb.makedsn(host, ORACLE_PORT, service_name=ORACLE_SERVICE)
                conn = oracledb.connect(user=ORACLE_USER, password=ORACLE_PWD, dsn=dsn)
                print("[ORACLE] Conectado com sucesso via oracledb thin!")
                return conn
            except Exception as e:
                errors.append(f"oracledb thin ({host}): {e}")
    except ImportError:
        errors.append("oracledb não está instalado")

    # 3. oracledb thick mode se houver client 11g
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
            return conn
        except Exception as e:
            errors.append(f"oracledb thick: {e}")

    raise ConnectionError(
        "Não foi possível conectar ao Oracle MLPDW.\nDetalhes das tentativas:\n - " + "\n - ".join(errors)
    )

def format_cell(col_name, val):
    if val is None:
        return None
    col = col_name.lower()
    if isinstance(val, (datetime.date, datetime.datetime)):
        return val.strftime("%Y-%m-%d %H:%M:%S")

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

    float_cols = {"cub_tot", "pesoliq", "precounit", "vltotal"}
    if col in float_cols:
        try:
            return round(float(str(val).replace(",", ".")), 4)
        except (ValueError, TypeError):
            return 0.0

    s = str(val).strip()
    return s if s else None

def run_sync():
    start_time = time.time()
    now_str = datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    print("\n" + "=" * 70)
    print(f"[{now_str}] DISPARANDO SINCRONIZAÇÃO DA CARTEIRA PCP J'S MARTINS")
    print("=" * 70)

    update_supabase_status("running", progress=15, message="🔌 Conectando ao Oracle MLPDW no servidor corporativo...")

    conn = None
    try:
        conn = connect_oracle()
        print("[ORACLE] Conexão estabelecida com sucesso!")

        update_supabase_status("running", progress=35, message="📊 Executando select da Carteira no Oracle (53 colunas)...")
        cur = conn.cursor()
        print("[ORACLE] Executando query...")
        cur.execute(ORACLE_QUERY)

        col_names = [d[0].lower() for d in cur.description]
        rows = cur.fetchall()
        total_rows = len(rows)
        print(f"[ORACLE] Total retornado: {total_rows:,} registros.")
        cur.close()
        conn.close()
        conn = None

        if total_rows == 0:
            msg = "A consulta ao Oracle retornou 0 registros para filorig 994."
            print(f"[AVISO] {msg}")
            update_supabase_status("warning", progress=100, message=msg, total=0)
            return

        update_supabase_status("running", progress=55, message=f"⚙️ Formatando {total_rows:,} registros para o Supabase...")
        records = []
        for r in rows:
            rec = {}
            for col, val in zip(col_names, r):
                rec[col] = format_cell(col, val)
            records.append(rec)

        # Atualiza o Supabase
        update_supabase_status("running", progress=65, message="🧹 Limpando dados antigos da filial 994 no Supabase...")
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        try:
            requests.delete(f"{SUPABASE_URL}/rest/v1/pcp_js_martins?filorig=eq.994", headers=headers, verify=False, timeout=30)
            print("[SUPABASE] Filorig 994 limpa.")
        except Exception as de:
            print(f"[SUPABASE AVISO] {de}")

        batch_size = 1000
        inserted = 0
        for i in range(0, total_rows, batch_size):
            chunk = records[i:i + batch_size]
            pct = 65 + int((i / total_rows) * 32)
            update_supabase_status(
                "running", 
                progress=pct, 
                message=f"🚀 Gravando no Supabase: {inserted:,} de {total_rows:,} itens ({pct}%)...",
                total=total_rows
            )
            resp = requests.post(
                f"{SUPABASE_URL}/rest/v1/pcp_js_martins",
                headers=headers,
                json=chunk,
                verify=False,
                timeout=60
            )
            if resp.status_code not in (200, 201):
                raise RuntimeError(f"Erro ao inserir lote: {resp.status_code} - {resp.text}")
            inserted += len(chunk)
            print(f"[SUPABASE] {inserted:,} de {total_rows:,} itens gravados...")

        elapsed = round(time.time() - start_time, 1)
        success_msg = f"Carteira 100% atualizada! {inserted:,} itens sincronizados em {elapsed}s."
        print(f"\n[SUCESSO] {success_msg}\n")
        update_supabase_status("success", progress=100, message=success_msg, total=inserted, elapsed=elapsed)

    except Exception as e:
        err_msg = str(e)
        print(f"\n[ERRO] {err_msg}\n")
        update_supabase_status("error", progress=0, message=err_msg)
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

def sentinel_loop():
    print("=" * 70)
    print("MODO SENTINELA ATIVO (Ouvindo cliques do botão 'Atualizar Carteira' no site)")
    print("Mantenha esta janela minimizada na barra de tarefas do servidor.")
    print("Quando você clicar no site, a sincronização disparará automaticamente!")
    print("=" * 70 + "\n")

    # Verifica se já havia um pedido pendente no momento da inicialização
    try:
        init_cmd = get_supabase_command()
        if init_cmd and isinstance(init_cmd, dict) and init_cmd.get("status") == "requested":
            print("[PEDIDO PENDENTE ENCONTRADO!] Processando sincronização imediatamente...")
            run_sync()
    except Exception:
        pass

    last_processed_time = ""
    while True:
        try:
            cmd = get_supabase_command()
            if cmd and isinstance(cmd, dict):
                status = cmd.get("status")
                req_time = cmd.get("requested_at", "")
                if status == "requested" and req_time != last_processed_time:
                    last_processed_time = req_time
                    print(f"\n[SINAL DETECTADO DO SITE!] Solicitação recebida às {req_time}. Iniciando...")
                    run_sync()
                    print("\n[SENTINELA] Aguardando novos cliques no site...\n")
        except Exception as e:
            print(f"[SENTINELA AVISO] {e}")

        time.sleep(2)

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "--hybrid"
    if mode == "--now":
        run_sync()
    elif mode == "--watch":
        sentinel_loop()
    else:
        # Modo Padrão: Sincroniza imediatamente E entra em modo sentinela
        print("Iniciando sincronização inicial da Carteira...")
        run_sync()
        sentinel_loop()
