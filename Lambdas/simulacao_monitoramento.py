import pandas as pd
import boto3
import random
import math
from datetime import datetime, timedelta
from io import StringIO
import time

# --- CONFIGURAÇÕES GLOBAIS ---
BUCKET_NAME = 's3-trusted-ontracksystems'
USUARIO_SIMULADO = 'admin'
DIAS_PARA_SIMULAR = 30
INTERVALO_COLETA_SEGUNDOS = 5

# --- LISTA DE GARAGENS A SEREM SIMULADAS ---  
LISTA_ID_GARAGEM = ['18897']

# --- CONSTANTES DE CORRELAÇÃO MÉDIA (70%-75%) ---
CPU_BASE_OS = 6.0            
CPU_POR_ONIBUS = 1.6        
RUÍDO_CPU_MAXIMO = 15.0    

RAM_BASE_GB = 2.5            
RAM_MB_POR_ONIBUS = 150      
RUÍDO_RAM_MAXIMO = 1.5      

REDE_BASE_MB = 0.08          
REDE_MB_POR_ONIBUS = 0.7    
RUÍDO_REDE_MAXIMO = 1.0      

TOTAL_RAM_GB = 16
TOTAL_DISCO_GB = 500

# Inicializando cliente S3
s3_client = boto3.client('s3')

def gerar_curva_onibus(hora_dia):
    """
    Simula a quantidade de ônibus na garagem.
    """
    if 0 <= hora_dia < 5:      
        return random.randint(45, 55)
    elif 5 <= hora_dia < 8:    
        return random.randint(10, 40)
    elif 8 <= hora_dia < 17:    
        return random.randint(2, 10)
    elif 17 <= hora_dia < 20:  
        return random.randint(15, 35)
    else:                      
        return random.randint(35, 50)

def simular_dados_mes(id_garagem):
    print(f"\n--- Iniciando Simulação para a garagem: {id_garagem} ---")
   
    data_final = datetime.now()
    data_inicial = data_final - timedelta(days=DIAS_PARA_SIMULAR)
   
    acumulado_rede_env = 10240.0
    acumulado_rede_rec = 5000.0
    uso_disco_base = 240.0
   
    data_atual = data_inicial
    while data_atual <= data_final:
       
        ano = data_atual.strftime('%Y')
        mes = data_atual.strftime('%m')
        dia = data_atual.strftime('%d')
       
        # Loop sobre as 24 horas... (Lógica de simulação omitida para brevidade)
        for hora in range(24):
            dados_hora = {
                "timestamp": [], "usuario": [], "CPU": [], "RAM": [], "RAM_Percent": [],
                "Disco": [], "PacotesEnv": [], "PacotesRec": [], "Num_processos": [],
                "MB_Enviados_Seg": [], "MB_Recebidos_Seg": [],
                "MB_Total_Enviados": [], "MB_Total_Recebidos": [],
                "Onibus_Garagem": []
            }
           
            timestamp_simulado = data_atual.replace(hour=hora, minute=0, second=0, microsecond=0)
            fim_da_hora = timestamp_simulado + timedelta(hours=1)
           
            while timestamp_simulado < fim_da_hora:
               
                num_onibus = gerar_curva_onibus(hora)
               
                # Cálculo de Correlação (Mantido de 70-75%)
                ruido_cpu = random.uniform(-RUÍDO_CPU_MAXIMO, RUÍDO_CPU_MAXIMO)
                cpu_final = max(1.0, min(99.9, CPU_BASE_OS + (num_onibus * CPU_POR_ONIBUS) + ruido_cpu))
               
                ruido_ram = random.uniform(-RUÍDO_RAM_MAXIMO, RUÍDO_RAM_MAXIMO)
                ram_usada_gb = min(TOTAL_RAM_GB, RAM_BASE_GB + (num_onibus * RAM_MB_POR_ONIBUS / 1024) + ruido_ram)
                ram_percent = max(5.0, min(95.0, (ram_usada_gb / TOTAL_RAM_GB) * 100))
               
                ruido_rede = random.uniform(-RUÍDO_REDE_MAXIMO, RUÍDO_REDE_MAXIMO)
                mb_env_seg = max(0.01, REDE_BASE_MB + (num_onibus * REDE_MB_POR_ONIBUS) + ruido_rede)
                mb_rec_seg = random.uniform(0.1, 1.5)

                acumulado_rede_env += mb_env_seg * INTERVALO_COLETA_SEGUNDOS
                acumulado_rede_rec += mb_rec_seg * INTERVALO_COLETA_SEGUNDOS
               
                taxa_escrita_disco = 0.0001 + (num_onibus * 0.00005)
                if random.random() > 0.5: uso_disco_base += taxa_escrita_disco
               
                num_processos = 150 + (num_onibus * 2) + random.randint(-20, 20)

                # Preenchendo dados
                dados_hora["timestamp"].append(timestamp_simulado.strftime('%Y-%m-%d %H:%M:%S'))
                dados_hora["usuario"].append(USUARIO_SIMULADO)
                dados_hora["CPU"].append(round(cpu_final, 2))
                dados_hora["RAM"].append(round(ram_usada_gb, 2))
                dados_hora["RAM_Percent"].append(round(ram_percent, 2))
                dados_hora["Disco"].append(round(uso_disco_base, 2))
                dados_hora["PacotesEnv"].append(int(acumulado_rede_env * 15))
                dados_hora["PacotesRec"].append(int(acumulado_rede_rec * 15))
                dados_hora["Num_processos"].append(num_processos)
                dados_hora["MB_Enviados_Seg"].append(round(mb_env_seg, 2))
                dados_hora["MB_Recebidos_Seg"].append(round(mb_rec_seg, 2))
                dados_hora["MB_Total_Enviados"].append(round(acumulado_rede_env / 1024, 2))
                dados_hora["MB_Total_Recebidos"].append(round(acumulado_rede_rec / 1024, 2))
                dados_hora["Onibus_Garagem"].append(num_onibus)
               
                timestamp_simulado += timedelta(seconds=INTERVALO_COLETA_SEGUNDOS)

            # Upload S3 - NOTE O USO DA VARIÁVEL id_garagem
            if dados_hora["timestamp"]:
                df = pd.DataFrame(dados_hora)
                csv_buffer = StringIO()
                df.to_csv(csv_buffer, index=False, encoding='utf-8')
               
                nome_arquivo = f"consolidado_{hora:02d}.csv"
                # Caminho: idGaragem={ID}/ano=XXXX/mes=XX/dia=XX/
                caminho_s3 = f"idGaragem={id_garagem}/ano={ano}/mes={mes}/dia={dia}/{nome_arquivo}"
               
                try:
                    s3_client.put_object(Bucket=BUCKET_NAME, Key=caminho_s3, Body=csv_buffer.getvalue())
                except Exception as e:
                    print(f"Erro no upload {caminho_s3}: {e}")

        data_atual += timedelta(days=1)


if __name__ == "__main__":
    confirmacao = input(f"Gerar dados CORRELACIONADOS (30 dias, ~70-75%) para as garagens {LISTA_ID_GARAGEM}? (s/n): ")
    if confirmacao.lower() == 's':
        start_time = time.time()
        for id_garagem in LISTA_ID_GARAGEM:
            simular_dados_mes(id_garagem)
        print(f"\n--- Simulação Múltipla Concluída. Tempo total: {round(time.time() - start_time, 2)}s ---")
    else:
        print("Cancelado.")
