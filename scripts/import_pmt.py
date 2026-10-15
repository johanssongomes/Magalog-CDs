import sys
import os
import argparse
import json
import sqlite3
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

BASE_EXCEL_DATE = datetime(1899, 12, 30)

def init_sqlite_db(db_path):
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS pmt_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ano INTEGER NOT NULL,
        mes INTEGER NOT NULL,
        cd TEXT NOT NULL,
        dia TEXT,
        modal_agrupado TEXT,
        sigla TEXT,
        div_moveis TEXT,
        canal_venda TEXT,
        tipo_saida TEXT,
        modal TEXT,
        valor_plan_diario_cd REAL DEFAULT 0,
        pedido_plan_diario_cd REAL DEFAULT 0,
        cub_plan_diario_cd REAL DEFAULT 0,
        pecas_plan_diario_cd REAL DEFAULT 0,
        pedido_unico_plan_diario_cd REAL DEFAULT 0,
        modal_saida TEXT,
        categoria TEXT,
        categoria_produtividade TEXT,
        plataforma_venda TEXT,
        versao TEXT DEFAULT 'v1',
        arquivo_origem TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    )
    """)
    
    cur.execute("CREATE INDEX IF NOT EXISTS idx_pmt_ano_mes ON pmt_records(ano, mes)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_pmt_cd ON pmt_records(cd)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_pmt_cd_ano_mes ON pmt_records(cd, ano, mes)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_pmt_dia ON pmt_records(dia)")
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS pmt_imports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ano INTEGER NOT NULL,
        mes INTEGER NOT NULL,
        versao TEXT DEFAULT 'v1',
        arquivo_nome TEXT NOT NULL,
        total_linhas INTEGER DEFAULT 0,
        cd_filtro TEXT DEFAULT '994',
        status TEXT DEFAULT 'concluido',
        substituiu_base INTEGER DEFAULT 1,
        imported_at TEXT DEFAULT (datetime('now'))
    )
    """)
    conn.commit()
    return conn

def parse_and_import(file_path, ano=2026, mes=10, versao="v14", replace=True, db_path="prisma/dev.db"):
    if not os.path.exists(file_path):
        return {"success": False, "error": f"Arquivo não encontrado: {file_path}"}
    
    conn = init_sqlite_db(db_path)
    cur = conn.cursor()
    
    if replace:
        cur.execute("DELETE FROM pmt_records WHERE ano = ? AND mes = ?", (ano, mes))
        conn.commit()
    
    with zipfile.ZipFile(file_path, 'r') as z:
        # Carrega Shared Strings
        sst_xml = z.read('xl/sharedStrings.xml')
        sst_tree = ET.fromstring(sst_xml)
        strings = []
        ns = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
        for si in sst_tree.findall(f'{ns}si'):
            t = si.find(f'{ns}t')
            strings.append(t.text if t is not None else ''.join([e.text or '' for e in si.iter(f'{ns}t')]))
        
        # Lê a Sheet 1
        sheet_xml = z.read('xl/worksheets/sheet1.xml')
        sheet_tree = ET.fromstring(sheet_xml)
        rows = sheet_tree.findall(f'.//{ns}row')
        
        records_to_insert = []
        cd994_count = 0
        total_count = 0
        
        # Colunas esperadas:
        # A: MÊS | B: MODAL_AGRUPADO | C: CD | D: DIA | E: SIGLA | F: DIV_MOVEIS | G: CANAL_VENDA | H: TIPO_SAIDA
        # I: MODAL | J: VALOR | K: PEDIDO | L: CUB | M: PECAS | N: PEDIDO_UNICO | O: MODAL_SAIDA | P: CATEGORIA
        # Q: CATEGORIA_PRODUTIVIDADE | R: PLATAFORMA_VENDA
        
        filename = os.path.basename(file_path)
        
        for r in rows[1:]:
            row_data = {}
            for c in r.findall(f'{ns}c'):
                ref = c.attrib.get('r', '')
                col = ''.join([ch for ch in ref if ch.isalpha()])
                t = c.attrib.get('t')
                v = c.find(f'{ns}v')
                val = v.text if v is not None and v.text else ''
                if t == 's' and val != '':
                    try:
                        val = strings[int(val)]
                    except:
                        pass
                row_data[col] = val
            
            # Converte data do Excel (serial)
            dia_str = None
            raw_dia = row_data.get('D')
            if raw_dia:
                try:
                    d_obj = BASE_EXCEL_DATE + timedelta(days=float(raw_dia))
                    dia_str = d_obj.strftime('%Y-%m-%d')
                except:
                    dia_str = str(raw_dia)
            
            # Converte valores numéricos
            def to_float(val):
                try:
                    return float(val) if val else 0.0
                except:
                    return 0.0
            
            cd_val = str(row_data.get('C', '')).strip()
            if cd_val == '994':
                cd994_count += 1
            
            rec = (
                ano,
                mes,
                cd_val,
                dia_str,
                row_data.get('B', ''),
                row_data.get('E', ''),
                row_data.get('F', ''),
                row_data.get('G', ''),
                row_data.get('H', ''),
                row_data.get('I', ''),
                to_float(row_data.get('J')),
                to_float(row_data.get('K')),
                to_float(row_data.get('L')),
                to_float(row_data.get('M')),
                to_float(row_data.get('N')),
                row_data.get('O', ''),
                row_data.get('P', ''),
                row_data.get('Q', ''),
                row_data.get('R', ''),
                versao,
                filename
            )
            records_to_insert.append(rec)
            total_count += 1
            
            # Insere em batches de 5.000 para velocidade máxima
            if len(records_to_insert) >= 5000:
                cur.executemany("""
                INSERT INTO pmt_records (
                    ano, mes, cd, dia, modal_agrupado, sigla, div_moveis, canal_venda, tipo_saida, modal,
                    valor_plan_diario_cd, pedido_plan_diario_cd, cub_plan_diario_cd, pecas_plan_diario_cd,
                    pedido_unico_plan_diario_cd, modal_saida, categoria, categoria_produtividade, plataforma_venda,
                    versao, arquivo_origem
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, records_to_insert)
                records_to_insert = []
        
        # Insere restante
        if records_to_insert:
            cur.executemany("""
            INSERT INTO pmt_records (
                ano, mes, cd, dia, modal_agrupado, sigla, div_moveis, canal_venda, tipo_saida, modal,
                valor_plan_diario_cd, pedido_plan_diario_cd, cub_plan_diario_cd, pecas_plan_diario_cd,
                pedido_unico_plan_diario_cd, modal_saida, categoria, categoria_produtividade, plataforma_venda,
                versao, arquivo_origem
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, records_to_insert)
            
        # Registra no histórico de importações
        cur.execute("""
        INSERT INTO pmt_imports (ano, mes, versao, arquivo_nome, total_linhas, cd_filtro, status, substituiu_base)
        VALUES (?, ?, ?, ?, ?, '994', 'concluido', ?)
        """, (ano, mes, versao, filename, total_count, 1 if replace else 0))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "totalRows": total_count,
            "cd994Rows": cd994_count,
            "ano": ano,
            "mes": mes,
            "versao": versao,
            "substituiu": replace,
            "arquivo": filename
        }

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Importador de Planilha PMT')
    parser.add_argument('--file', default='PMTs/PMT_out_2026.xlsx', help='Caminho do arquivo .xlsx')
    parser.add_argument('--ano', type=int, default=2026, help='Ano de referência')
    parser.add_argument('--mes', type=int, default=10, help='Mês de referência (1-12)')
    parser.add_argument('--versao', default='v14', help='Versão da base (ex: v1, v14)')
    parser.add_argument('--replace', action='store_true', default=True, help='Substituir base existente do mês/ano')
    parser.add_argument('--db', default='prisma/dev.db', help='Caminho do banco SQLite')
    
    args = parser.parse_args()
    
    res = parse_and_import(
        file_path=args.file,
        ano=args.ano,
        mes=args.mes,
        versao=args.versao,
        replace=args.replace,
        db_path=args.db
    )
    print(json.dumps(res, indent=2))
