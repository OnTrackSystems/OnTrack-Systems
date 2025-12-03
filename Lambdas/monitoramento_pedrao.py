import pandas as pd
import boto3
import random
import math
from datetime import datetime, timedelta
from io import StringIO
import time

# --- CONFIGURAÇÕES GLOBAIS ---
BUCKET_NAME = 's3-trusted-ontracksystems'  # Bucket correto para dados trusted
USUARIO_SIMULADO = 'admin'
DIAS_PARA_SIMULAR = 60
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

# Rede AJUSTADA para throughput realista em MB/s (Target: ~1GB/dia => ~1024MB/dia)
# Para 1GB/dia: 1024 MB / 86400 segundos = ~0.0118 MB/s de média.
REDE_BASE_MB_SEG = 0.005           # Base ajustada para MB/s
REDE_MB_POR_ONIBUS = 0.00015       # Cada ônibus adiciona ~0.15 KB/s
RUÍDO_REDE_MAXIMO = 0.002          # Variação natural reduzida

# Padrões de aleatoriedade por dia
def get_variacao_diaria():
    """Retorna variações diárias para tornar dados menos artificiais"""
    return {
        'cpu_mult': random.uniform(0.85, 1.15),
        'ram_mult': random.uniform(0.90, 1.10),
        'rede_mult': random.uniform(0.80, 1.25),
        'onibus_offset': random.randint(-5, 5)
    }      

TOTAL_RAM_GB = 16
TOTAL_DISCO_GB = 500

# Inicializando cliente S3
s3_client = boto3.client('s3')

def gerar_curva_onibus(hora_dia):
    """
    Simula a quantidade de ônibus na garagem.
    Padrão: Mais ônibus à noite (transferência de dados), menos durante o dia.
    """
    if 0 <= hora_dia < 2:       # Meia-noite: Pico inicial
        return random.randint(45, 55)
    elif 2 <= hora_dia < 5:     # Madrugada: Pico máximo
        return random.randint(50, 60)
    elif 5 <= hora_dia < 7:     # Manhã cedo: Saindo
        return random.randint(20, 40)
    elif 7 <= hora_dia < 10:    # Manhã: Poucos ônibus
        return random.randint(5, 15)
    elif 10 <= hora_dia < 18:   # Dia: Mínimo
        return random.randint(2, 10)
    elif 18 <= hora_dia < 21:   # Início noite: Retorno
        return random.randint(15, 30)
    else:                       # Noite: Retorno intenso
        return random.randint(35, 50)

def simular_dados_mes(id_garagem):
    print(f"\n--- Iniciando Simulação para a garagem: {id_garagem} ---")
   
    data_final = datetime.now()
    data_inicial = data_final - timedelta(days=DIAS_PARA_SIMULAR)
   
    # Acumuladores MUDADOS PARA MB (começam em valores iniciais realistas)
    acumulado_rede_env_mb = 10240.0  # 10 GB iniciais (~10240 MB)
    acumulado_rede_rec_mb = 5120.0   # 5 GB iniciais (~5120 MB)
    uso_disco_base = 240.0
   
    data_atual = data_inicial
    while data_atual <= data_final:
        # Variação diária para tornar dados mais realistas
        variacao_dia = get_variacao_diaria()
       
        ano = data_atual.strftime('%Y')
        mes = data_atual.strftime('%m')
        dia = data_atual.strftime('%d')
       
        # Loop sobre as 24 horas...
        for hora in range(24):
            dados_hora = {
                "timestamp": [], "usuario": [], "CPU": [], "RAM": [], "RAM_Percent": [],
                "Disco": [], "PacotesEnv": [], "PacotesRec": [], "Num_processos": [],
                # NOVAS COLUNAS: MB/s e MB Total
                "MB_Enviados_Seg": [], "MB_Recebidos_Seg": [],
                "MB_Total_Enviados": [], "MB_Total_Recebidos": [],
                "Onibus_Garagem": []
            }
           
            timestamp_simulado = data_atual.replace(hour=hora, minute=0, second=0, microsecond=0)
            fim_da_hora = timestamp_simulado + timedelta(hours=1)
           
            while timestamp_simulado < fim_da_hora:
               
                num_onibus = gerar_curva_onibus(hora) + variacao_dia['onibus_offset']
                num_onibus = max(0, num_onibus)  # Garante não negativo
               
                # Micro-variação por ponto (±5%) para evitar padrões exatos
                micro_var = random.uniform(0.95, 1.05)
               
                # Cálculo de Correlação (Mantido de 70-75%) com variações diárias
                ruido_cpu = random.uniform(-RUÍDO_CPU_MAXIMO, RUÍDO_CPU_MAXIMO)
                cpu_final = max(1.0, min(99.9, (CPU_BASE_OS + (num_onibus * CPU_POR_ONIBUS) + ruido_cpu) * variacao_dia['cpu_mult'] * micro_var))
               
                ruido_ram = random.uniform(-RUÍDO_RAM_MAXIMO, RUÍDO_RAM_MAXIMO)
                ram_usada_gb = min(TOTAL_RAM_GB, (RAM_BASE_GB + (num_onibus * RAM_MB_POR_ONIBUS / 1024) + ruido_ram) * variacao_dia['ram_mult'])
                ram_percent = max(5.0, min(95.0, (ram_usada_gb / TOTAL_RAM_GB) * 100))
               
                # CÁLCULO DE REDE AGORA É DIRETAMENTE EM MB/s
                ruido_rede = random.uniform(-RUÍDO_REDE_MAXIMO, RUÍDO_REDE_MAXIMO)
                mb_env_seg = max(0.001, (REDE_BASE_MB_SEG + (num_onibus * REDE_MB_POR_ONIBUS) + ruido_rede) * variacao_dia['rede_mult'] * micro_var)
                
                # Sistema de geração de anomalias e restauração
                # 2% chance de erro crítico (<= 0.001 MB/s)
                if random.random() < 0.02:
                    mb_env_seg = random.uniform(0.0005, 0.0009) # Valor crítico em MB/s
                    
                    # 40% de chance de restaurar após erro crítico (gera alerta de restauração)
                    if len(dados_hora["MB_Enviados_Seg"]) >= 2:
                        mb_anterior = dados_hora["MB_Enviados_Seg"][-1]
                        
                        if mb_anterior <= 0.001 and random.random() < 0.40:
                            # Restaura para valor normal (pico simulado)
                            mb_env_seg = random.uniform(0.005, 0.01) # Pico simulado em MB/s
                
                # 5% chance de warning (0.001 - 0.0015 MB/s) - apenas se não for crítico
                elif random.random() < 0.05:
                    mb_env_seg = random.uniform(0.001, 0.0015)
                
                mb_rec_seg = mb_env_seg * random.uniform(0.08, 0.12)  # Recebimento proporcional
                
                # Cálculo do Delta: MB/s * Intervalo = MB Acumulado no Intervalo
                mb_env_delta = mb_env_seg * INTERVALO_COLETA_SEGUNDOS
                mb_rec_delta = mb_rec_seg * INTERVALO_COLETA_SEGUNDOS
                
                # Acumuladores: MB acumulado
                acumulado_rede_env_mb += mb_env_delta
                acumulado_rede_rec_mb += mb_rec_delta
               
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
                # Pacotes baseados no throughput (assumindo ~1500 bytes/pacote)
                # (MB/s * 1024 * 1024) = Bytes/s. Multiplica pelo intervalo para dar total de bytes.
                bytes_env_delta = mb_env_seg * 1024 * 1024 * INTERVALO_COLETA_SEGUNDOS
                pacotes_env = int(bytes_env_delta / 1500)
                dados_hora["PacotesEnv"].append(pacotes_env)
                dados_hora["PacotesRec"].append(int(pacotes_env * 0.1))  # Proporção recv
                dados_hora["Num_processos"].append(num_processos)
                # MB/s já estão calculados
                dados_hora["MB_Enviados_Seg"].append(round(mb_env_seg, 8))
                dados_hora["MB_Recebidos_Seg"].append(round(mb_rec_seg, 8))
                # Acumulado em MB
                dados_hora["MB_Total_Enviados"].append(round(acumulado_rede_env_mb, 5))
                dados_hora["MB_Total_Recebidos"].append(round(acumulado_rede_rec_mb, 5))
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