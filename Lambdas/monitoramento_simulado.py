import psutil as ps
import pandas as pd
import time
from datetime import datetime
import boto3
import os
import requests
from requests.auth import HTTPBasicAuth
import json
import random
#from dotenv import load_dotenv

#load_dotenv('.env.dev')

# --- CONFIGURAÇÕES JIRA ---
JIRA_DOMAIN = 'https://ontracksys.atlassian.net'
PROJECT_KEY = "CHM" 
JIRA_CORE_URL = f"{JIRA_DOMAIN}/rest/api/3/issue"

JIRA_EMAIL = os.getenv('JIRA_EMAIL')
JIRA_TOKEN = os.getenv('JIRA_API_TOKEN')

# --- CONFIGURAÇÕES DE MONITORAMENTO ---
CPU_POR_ONIBUS = 1.5      
RAM_MB_POR_ONIBUS = 50    
INTERVALO_COLETA_SEGUNDOS = 5 
INTERVALO_UPLOAD_SEGUNDOS = 30
COOLDOWN_SEGUNDOS = 300 

# --- CONFIGURAÇÃO DASHBOARD JSON (NOVO) ---
INTERVALO_ATUALIZACAO_DASHBOARD = 2400  # 40 Minutos em segundos
BUCKET_RAW = 's3-raw-ontracksystems'       # Bucket dos CSVs
BUCKET_DASHBOARD = 's3-client-ontracksystems' # Bucket do JSON (conforme print)

# --- VARIÁVEIS DE DADOS (EM GB) ---
dados = {
    "timestamp": [], "usuario": [], "CPU": [], "RAM": [], "RAM_Percent": [],
    "Disco": [], "PacotesEnv": [], "PacotesRec": [], "Num_processos": [],
    "GB_Enviados_Seg": [], "GB_Recebidos_Seg": [], 
    "GB_Total_Enviados": [], "GB_Total_Recebidos": [],
    "Onibus_Garagem": []
}

# ACUMULADORES GLOBAIS
total_simulado_enviado_acumulado_gb = 0.0
total_simulado_recebido_acumulado_gb = 0.0

stats_iniciais = ps.net_io_counters(pernic=False, nowrap=True)

# Variáveis globais de garagem
nome_garagem = ""
id_garagem = ""

# --- FUNÇÕES AUXILIARES ---
def contar_onibus_na_garagem(caminho_arquivo=".onibusAtuais"): 
    try:
        with open(caminho_arquivo, 'r') as f:
            num_onibus = sum(1 for line in f if line.strip())
        return num_onibus
    except FileNotFoundError:
        return 0
    except Exception as e:
        print(f"Erro ao ler o arquivo {caminho_arquivo}: {e}")
        return 0

def get_id_garagem(caminho_arquivo=".uuid"):
    global nome_garagem, id_garagem
    try:
        with open(caminho_arquivo, 'r') as f:
            parametros = f.readline().split(',')
            if len(parametros) >= 5:
                id_garagem = parametros[0].strip()   
                nome_garagem = parametros[1].strip()                 
                return parametros[4].strip()
            return "id_desconhecido"
    except FileNotFoundError:
        return "garagem_padrao"

def obter_uso():
    global dados, total_simulado_enviado_acumulado_gb, total_simulado_recebido_acumulado_gb

    cpu_real_percent = ps.cpu_percent(interval=1)
    ram_real = ps.virtual_memory()
    disco = ps.disk_usage('/')
    rede_real = ps.net_io_counters(pernic=False, nowrap=True)
    usuario = ps.users()
    num_processos = len(list(ps.process_iter()))
    user = usuario[0].name if usuario else "Desconhecido"
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # --- SIMULAÇÃO REDE (~2GB/hora) ---
    delta_simulado_gb = random.uniform(0.0025, 0.0031) 
    delta_recv_gb = delta_simulado_gb * 0.1 

    gb_sent_seg = delta_simulado_gb / INTERVALO_COLETA_SEGUNDOS
    gb_recv_seg = delta_recv_gb / INTERVALO_COLETA_SEGUNDOS
    
    total_simulado_enviado_acumulado_gb += delta_simulado_gb
    total_simulado_recebido_acumulado_gb += delta_recv_gb

    num_onibus = contar_onibus_na_garagem()

    # Carga Simulada
    carga_cpu_simulada = num_onibus * CPU_POR_ONIBUS
    carga_ram_simulada_bytes = num_onibus * RAM_MB_POR_ONIBUS * (1024 * 1024)

    cpu_final_percent = min(100.0, cpu_real_percent + carga_cpu_simulada)
    ram_usada_final_bytes = ram_real.used + carga_ram_simulada_bytes
    ram_usada_final_gb = round(ram_usada_final_bytes / (1024 ** 3), 2)
    ram_final_percent = min(100.0, (ram_usada_final_bytes / ram_real.total) * 100)

    dados["timestamp"].append(timestamp)
    dados["usuario"].append(user)
    dados["CPU"].append(round(cpu_final_percent, 2))
    dados["RAM"].append(ram_usada_final_gb)
    dados["RAM_Percent"].append(round(ram_final_percent, 2))
    dados["Disco"].append(round(disco.used / 1024 ** 3, 2))
    dados["PacotesEnv"].append(int(delta_simulado_gb * 700000)) 
    dados["PacotesRec"].append(rede_real.packets_recv) 
    dados["Num_processos"].append(num_processos)
    dados["GB_Enviados_Seg"].append(round(gb_sent_seg, 8)) 
    dados["GB_Recebidos_Seg"].append(round(gb_recv_seg, 8))
    dados["GB_Total_Enviados"].append(round(total_simulado_enviado_acumulado_gb, 5))
    dados["GB_Total_Recebidos"].append(round(total_simulado_recebido_acumulado_gb, 5))
    dados["Onibus_Garagem"].append(num_onibus)

def salvar_csv():
    global dados
    df = pd.DataFrame(dados)
    df.to_csv("coletaGeralOTS.csv", encoding="utf-8", index=False)

def subirCSVS3():
    # Função para subir o CSV de histórico (Bucket RAW)
    idGaragem = get_id_garagem()
    ano = datetime.now().strftime('%Y')
    mes = datetime.now().strftime('%m')
    dia = datetime.now().strftime('%d')
    hora = datetime.now().strftime('%H')
    minuto = datetime.now().strftime('%M')
    segundo = datetime.now().strftime('%S')

    arquivo = 'coletaGeralOTS.csv'
    client = boto3.client('s3')
    caminhos3 = 'idGaragem={}/ano={}/mes={}/dia={}/hora={}/coleta_{}{}{}.csv'.format(idGaragem, ano, mes, dia, hora, hora, minuto, segundo)

    try:
        # Upload silencioso para não poluir log
        client.upload_file(arquivo, BUCKET_RAW, caminhos3)
    except Exception as e:
        print(f"--- Falha ao subir CSV para S3 Raw: {e} ---")

def atualizar_dashboard_json():
    idGaragem = get_id_garagem()
    client = boto3.client('s3')
    
    key_json = f"idGaragem={idGaragem}/dashboard_{idGaragem}.json"
    
    print(f"\n--- Iniciando Atualizacao do Dashboard JSON ({key_json}) ---")
    
    try:
        obj = client.get_object(Bucket=BUCKET_DASHBOARD, Key=key_json)
        conteudo_json = json.loads(obj['Body'].read())
        
        # 2. Simular dados de Backup e Arquivos Corrompidos
        # 95% de chance de sucesso, 5% de falha
        status_backup = "Sucesso" if random.random() > 0.05 else "Falha"
        
        # 98% de chance de 0 arquivos, 2% de chance de aparecer 1 ou 2
        qtd_corrompidos = 0
        if random.random() > 0.98:
            qtd_corrompidos = random.randint(1, 3)
            
        timestamp_agora = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + "-03:00"
        timestamp_visual = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # 3. Atualizar campos no JSON
        conteudo_json["lastUpdate"] = timestamp_agora
        
        # Cria ou atualiza o campo "backup"
        conteudo_json["backup"] = {
            "data": timestamp_visual,
            "situacao": status_backup
        }
        
        # Cria ou atualiza o campo "arquivosCorrompidos"
        conteudo_json["arquivosCorrompidos"] = {
            "quantidade": qtd_corrompidos,
            "ultimaVerificacao": timestamp_visual
        }

        # 4. Subir JSON atualizado de volta para o S3
        client.put_object(
            Bucket=BUCKET_DASHBOARD,
            Key=key_json,
            Body=json.dumps(conteudo_json, indent=4),
            ContentType='application/json'
        )
        print(f"--- Dashboard JSON atualizado: Backup={status_backup}, Corrompidos={qtd_corrompidos} ---")
        
    except client.exceptions.NoSuchKey:
        print(f"[ERRO] O arquivo {key_json} nao existe no bucket {BUCKET_DASHBOARD}.")
    except Exception as e:
        print(f"[ERRO] Falha ao atualizar JSON do Dashboard: {e}")


# --- ALERTA JIRA (Mantido) ---
ultimo_alerta_critico = { "CPU": 0, "RAM": 0, "Disco": 0 }
ultimo_alerta_medio = { "CPU": 0, "RAM": 0, "Disco": 0 }

def abrir_chamado_jira(componente, valor_atual, limite, nivel):
    auth = HTTPBasicAuth(JIRA_EMAIL, JIRA_TOKEN)
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    jira_priority = "Highest" if nivel == "CRITICO" else "Medium"
    
    payload = {
        "fields": {
            "project": {"key": PROJECT_KEY},
            "summary": f"[ALERTA {nivel}] {componente} atingiu {valor_atual:.2f}% - {nome_garagem}",
            "issuetype": {"name": "Task"}, 
            "priority": {"name": jira_priority},
            "description": {
                "type": "doc", "version": 1,
                "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": f"Anomalia: {componente} a {valor_atual:.2f}% (ID: {id_garagem})"}]}]
            }
        }
    }
    try:
        requests.post(JIRA_CORE_URL, json=payload, headers=headers, auth=auth)
        return True
    except:
        return False

def verificar_alertas():
    if not dados['timestamp']: return
    LIMITES = { "CRITICO": {"CPU": 90, "RAM": 90, "Disco": 95}, "MEDIO": {"CPU": 70, "RAM": 75, "Disco": 85} }
    agora = time.time()
    
    vals = {"CPU": dados['CPU'][-1], "RAM": dados['RAM_Percent'][-1], "Disco": ps.disk_usage('/').percent}
    criticos_ciclo = set()

    for comp, val in vals.items():
        if val > LIMITES["CRITICO"][comp]:
            criticos_ciclo.add(comp)
            if (agora - ultimo_alerta_critico[comp]) > COOLDOWN_SEGUNDOS:
                if abrir_chamado_jira(comp, val, LIMITES["CRITICO"][comp], "CRITICO"): ultimo_alerta_critico[comp] = agora
    
    for comp, val in vals.items():
        if comp in criticos_ciclo: continue
        if val > LIMITES["MEDIO"][comp]:
            if (agora - ultimo_alerta_medio[comp]) > COOLDOWN_SEGUNDOS:
                if abrir_chamado_jira(comp, val, LIMITES["MEDIO"][comp], "MEDIO"): ultimo_alerta_medio[comp] = agora

def monitoramento():
    global dados
    tempo_csv = 0
    tempo_dashboard = INTERVALO_ATUALIZACAO_DASHBOARD # Força atualizar logo no inicio ou espere zerar
    
    # Para atualizar logo na primeira execução, descomente a linha abaixo:
    # atualizar_dashboard_json()
    
    get_id_garagem() 
    print(f"Iniciando monitoramento...\nID Garagem: {id_garagem}\nCSV Bucket: {BUCKET_RAW}\nJSON Bucket: {BUCKET_DASHBOARD}")
    
    try:
        while True:
            obter_uso()
            salvar_csv()
            #verificar_alertas()
            
            if dados['timestamp']:
                print(f"[{dados['timestamp'][-1]}] CPU: {dados['CPU'][-1]}% | Total Env: {dados['GB_Total_Enviados'][-1]:.5f} GB")

            # Upload CSV (30s)
            tempo_csv += INTERVALO_COLETA_SEGUNDOS
            if tempo_csv >= INTERVALO_UPLOAD_SEGUNDOS:
                subirCSVS3()
                dados = {key: [] for key in dados}
                tempo_csv = 0
            
            # Atualização Dashboard JSON (40 min)
            tempo_dashboard += INTERVALO_COLETA_SEGUNDOS
            if tempo_dashboard >= INTERVALO_ATUALIZACAO_DASHBOARD:
                atualizar_dashboard_json()
                tempo_dashboard = 0 # Reinicia contagem
                
            time.sleep(INTERVALO_COLETA_SEGUNDOS) 

    except KeyboardInterrupt:
        print("\nInterrompido.")

if __name__ == "__main__":
    monitoramento()