import pandas as pd
import boto3
import random
import math
from datetime import datetime, timedelta
from io import StringIO
import time

BUCKET_NAME = 's3-trusted-ontracksystems' 
USUARIO_SIMULADO = 'admin'
DIAS_PARA_SIMULAR = 60
INTERVALO_COLETA_SEGUNDOS = 5 

LISTA_ID_GARAGEM = ['18897'] 

# --- CONFIGURAÇÕES DE CAOS E LIMITES ---
# Ajustei para ser mais "pesado"
CPU_BASE_OS = 10.0            
CPU_POR_ONIBUS = 1.8         
# Limites para definir o que é "normal" na geração
TOTAL_RAM_GB = 16
TOTAL_DISCO_GB = 500

# --- TIPOS DE INCIDENTES ---
# Probabilidade de começar um incidente a cada hora (0.0 a 1.0)
PROB_INCIDENTE = 0.15  # 15% de chance de dar problema a cada hora

s3_client = boto3.client('s3')

def gerar_curva_onibus(hora_dia, fator_aleatorio=1.0):
    """
    Simula a quantidade de ônibus com picos mais agressivos.
    """
    if 0 <= hora_dia < 4:       
        base = random.randint(45, 55)
    elif 4 <= hora_dia < 8:     
        base = random.randint(15, 60) # Manhã caótica
    elif 8 <= hora_dia < 16:    
        base = random.randint(5, 20)
    elif 16 <= hora_dia < 20:   
        base = random.randint(25, 45) # Pico tarde
    else:                           
        base = random.randint(40, 52)
    
    return int(base * fator_aleatorio)

def simular_dados_mes(id_garagem):
    print(f"\n--- Iniciando Simulação 'Caótica' para a garagem: {id_garagem} ---")
    
    data_final = datetime.now()
    data_inicial = data_final - timedelta(days=DIAS_PARA_SIMULAR)
    
    acumulado_rede_env = 10240.0 
    acumulado_rede_rec = 5000.0 
    uso_disco_base = 240.0
    
    # Estado da Memória (Memory Leak Simulation)
    ram_atual_gb = 4.0 
    
    data_atual = data_inicial
    while data_atual <= data_final:
        
        ano = data_atual.strftime('%Y')
        mes = data_atual.strftime('%m')
        dia = data_atual.strftime('%d')
        
        fator_dia = random.uniform(0.9, 1.3) # Dias podem ser bem mais pesados
        
        # --- SORTEIO DE INCIDENTE DO DIA/HORA ---
        # Reset diário de disco para não estourar infinito
        if uso_disco_base > 480: 
            uso_disco_base = 240.0 # Limpeza de logs

        for hora in range(24):
            # Define se nesta hora teremos um problema específico
            tipo_incidente = "NORMAL"
            dado_sorteado = random.random()
            
            if dado_sorteado < 0.05:
                tipo_incidente = "CPU_SPIKE" # Processo travado
            elif dado_sorteado < 0.10:
                tipo_incidente = "MEMORY_LEAK" # Vazamento de memória rápido
            elif dado_sorteado < 0.12:
                tipo_incidente = "NETWORK_STORM" # Ataque ou backup pesado
            
            # Se for hora de pico (17h-19h ou 05h-07h), aumenta chance de gargalo natural
            is_peak_hour = (5 <= hora <= 7) or (17 <= hora <= 19)

            dados_hora = {
                "timestamp": [], "usuario": [], "CPU": [], "RAM": [], "RAM_Percent": [],
                "Disco": [], "PacotesEnv": [], "PacotesRec": [], "Num_processos": [],
                "MB_Enviados_Seg": [], "MB_Recebidos_Seg": [], 
                "MB_Total_Enviados": [], "MB_Total_Recebidos": [],
                "Onibus_Garagem": []
            }
            
            timestamp_simulado = data_atual.replace(hour=hora, minute=0, second=0, microsecond=0)
            fim_da_hora = timestamp_simulado + timedelta(hours=1)
            
            # Controle de oscilação dentro da hora
            senoide_control = 0 
            
            while timestamp_simulado < fim_da_hora:
                senoide_control += 0.1
                num_onibus = gerar_curva_onibus(hora, fator_dia)
                
                # --- CÁLCULO DE CPU (COM STRESS NÃO LINEAR) ---
                # Se tiver muitos ônibus, o consumo sobe exponencialmente, não linearmente
                stress_factor = 1.0
                if num_onibus > 40: stress_factor = 1.3
                if num_onibus > 50: stress_factor = 1.6

                cpu_calculada = CPU_BASE_OS + (num_onibus * CPU_POR_ONIBUS * stress_factor)
                
                # Aplica o Incidente de CPU
                if tipo_incidente == "CPU_SPIKE":
                    # CPU trava entre 85% e 100% durante essa hora
                    cpu_calculada = random.uniform(85, 100)
                else:
                    # Ruído normal
                    cpu_calculada += random.uniform(-5, 5)

                # Garante limites
                cpu_final = max(2.0, min(100.0, cpu_calculada))
                
                # --- CÁLCULO DE RAM (COM MEMORY LEAK) ---
                # A RAM agora tem "memória" do segundo anterior. Ela tende a subir.
                if tipo_incidente == "MEMORY_LEAK":
                    ram_atual_gb += 0.02 # Sobe rápido (aprox 12MB a cada 5s)
                else:
                    # Comportamento normal: Sobe e desce devagar baseado nos ônibus
                    target_ram = 2.5 + (num_onibus * 0.15) # 150MB por onibus
                    diff = target_ram - ram_atual_gb
                    ram_atual_gb += diff * 0.1 # Suavização (move 10% em direção ao alvo)
                    
                    # Vazamento lento natural (software mal otimizado)
                    if random.random() < 0.3: ram_atual_gb += 0.005

                # Reset se estourar a memória (Simula crash/reboot do serviço)
                if ram_atual_gb >= TOTAL_RAM_GB:
                    ram_atual_gb = 3.0 # Reiniciou
                
                ram_percent = (ram_atual_gb / TOTAL_RAM_GB) * 100
                
                # --- CÁLCULO DE REDE ---
                mb_env_base = (cpu_final * 0.05) + (num_onibus * 0.2)
                
                if tipo_incidente == "NETWORK_STORM":
                    mb_env_base = random.uniform(50, 120) # Pico absurdo de rede
                
                mb_env_seg = max(0.01, mb_env_base + random.uniform(-1, 1))
                mb_rec_seg = mb_env_seg * 0.6 # Download costuma ser menor que upload de telemetria
                
                acumulado_rede_env += mb_env_seg * INTERVALO_COLETA_SEGUNDOS
                acumulado_rede_rec += mb_rec_seg * INTERVALO_COLETA_SEGUNDOS
                
                # --- DISCO ---
                # Enche devagar, mas às vezes limpa (log rotation)
                uso_disco_base += 0.002
                
                # Preenchimento
                dados_hora["timestamp"].append(timestamp_simulado.strftime('%Y-%m-%d %H:%M:%S'))
                dados_hora["usuario"].append(USUARIO_SIMULADO)
                dados_hora["CPU"].append(round(cpu_final, 2))
                dados_hora["RAM"].append(round(ram_atual_gb, 2))
                dados_hora["RAM_Percent"].append(round(ram_percent, 2))
                dados_hora["Disco"].append(round(uso_disco_base, 2))
                dados_hora["PacotesEnv"].append(int(acumulado_rede_env * 10)) 
                dados_hora["PacotesRec"].append(int(acumulado_rede_rec * 10))
                dados_hora["Num_processos"].append(int(150 + (cpu_final * 1.5)))
                dados_hora["MB_Enviados_Seg"].append(round(mb_env_seg, 2))
                dados_hora["MB_Recebidos_Seg"].append(round(mb_rec_seg, 2))
                dados_hora["MB_Total_Enviados"].append(round(acumulado_rede_env / 1024, 2)) 
                dados_hora["MB_Total_Recebidos"].append(round(acumulado_rede_rec / 1024, 2)) 
                dados_hora["Onibus_Garagem"].append(num_onibus)
                
                timestamp_simulado += timedelta(seconds=INTERVALO_COLETA_SEGUNDOS)

            # Upload S3
            if dados_hora["timestamp"]:
                df = pd.DataFrame(dados_hora)
                csv_buffer = StringIO()
                df.to_csv(csv_buffer, index=False, encoding='utf-8')
                
                nome_arquivo = f"consolidado_{hora:02d}.csv"
                caminho_s3 = f"idGaragem={id_garagem}/ano={ano}/mes={mes}/dia={dia}/{nome_arquivo}"
                
                try:
                    # Comentado para teste local, descomente para enviar
                    s3_client.put_object(Bucket=BUCKET_NAME, Key=caminho_s3, Body=csv_buffer.getvalue())
                    pass
                except Exception as e:
                    print(f"Erro no upload {caminho_s3}: {e}")

        data_atual += timedelta(days=1)


if __name__ == "__main__":
    print("--- GERADOR DE DADOS CAÓTICOS (MODO REALISTA) ---")
    print("Este script irá gerar incidentes (Picos de CPU, Memory Leaks, Network Storms).")
    confirmacao = input(f"Iniciar simulação para {LISTA_ID_GARAGEM}? (s/n): ")
    
    if confirmacao.lower() == 's':
        start_time = time.time()
        for id_garagem in LISTA_ID_GARAGEM:
            simular_dados_mes(id_garagem)
        print(f"\n--- Simulação Concluída. Tempo total: {round(time.time() - start_time, 2)}s ---")
    else:
        print("Cancelado.")