import json
import pandas as pd
import boto3
from datetime import datetime, timedelta
from io import StringIO
from typing import List, Dict, Any, Tuple

# --- CONFIGURAÇÕES ---
TRUSTED_BUCKET = 'trusted-ontrack'
CLIENT_BUCKET = 'client-ontrack' 

# PERÍODOS DE TEMPO: Cada período gera dados para cálculo de variação
TIME_RANGES: Dict[str, Dict[str, Any]] = {
    '48h': {
        'range': timedelta(hours=48),
        'frequency': 'h', 			# Amostragem horária
        'dashboard_period': 24, 	# Últimas 24h para dashboard
        'comparison_period': 24 	# 24h anteriores para comparação
    },
    '14d': {
        'range': timedelta(days=14),
        'frequency': '4h', 			# Amostragem a cada 4 horas
        'dashboard_period': 84, 	# Últimos 7d (84 pontos de 4h)
        'comparison_period': 42 	# 7d anteriores (42 pontos de 4h)
    },
    '60d': {
        'range': timedelta(days=60),
        'frequency': 'D', 			# Amostragem diária
        'dashboard_period': 30, 	# Últimos 30d para dashboard
        'comparison_period': 30 	# 30d anteriores para comparação
    }
}

# Thresholds para alertas (MB)
ALERT_THRESHOLDS = {
    'critical': 1.0, 	# <= 1MB é crítico
    'warning': 1.2 		# < 1.2MB é warning (Ajustado para nova escala de dados)
}

# Cliente S3
s3 = boto3.client('s3')


def discover_garage_ids() -> List[str]:
    """Descobre todos os IDs de garagem existentes no bucket Trusted."""
    ids = set()
    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=TRUSTED_BUCKET, Delimiter='/')
    
    for page in pages:
        if 'CommonPrefixes' in page:
            for prefix in page['CommonPrefixes']:
                if prefix['Prefix'].startswith('idGaragem='):
                    garage_id = prefix['Prefix'].split('=')[1].replace('/', '')
                    ids.add(garage_id)
    return list(ids)


def get_keys_for_time_range(time_range: timedelta, id_garagem: str) -> List[str]:
    """Busca as chaves (arquivos) no S3 para a garagem e o período especificados."""
    start_time = datetime.now() - time_range
    now = datetime.now()
    keys = []
    
    current_date = start_time.date()
    while current_date <= now.date():
        prefix = (
            f"idGaragem={id_garagem}/"
            f"ano={current_date.strftime('%Y')}/"
            f"mes={current_date.strftime('%m')}/"
            f"dia={current_date.strftime('%d')}/"
        )
        paginator = s3.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=TRUSTED_BUCKET, Prefix=prefix)
        
        for page in pages:
            if 'Contents' in page:
                for obj in page['Contents']:
                    keys.append(obj['Key'])
                    
        current_date += timedelta(days=1)
    return keys


def generate_alerts(timeseries_data: List[Dict], frequency: str) -> List[Dict]:
    """Gera alertas baseados nos dados de throughput (convertidos de Volume GB para MB/s)."""
    alerts = []
    
    # Determina duração do intervalo em segundos para cálculo de taxa
    seconds_map = {
        'h': 3600,
        '4h': 14400,
        'D': 86400
    }
    interval_seconds = seconds_map.get(frequency, 3600)
    
    # ------------------- FASE 1: GERAÇÃO DE ALERTA PADRÃO (THRESHOLD) -------------------
    for i, ponto in enumerate(timeseries_data):
        # Rede_Env agora é Volume em GB. Converter para MB/s para análise de alerta
        volume_gb = float(ponto.get('Rede_Env', 0))
        throughput_mb_s = (volume_gb * 1024) / interval_seconds if interval_seconds > 0 else 0
        
        timestamp = ponto.get('timestamp', '')
        
        # Parse timestamp para formatação
        try:
            dt = datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')
            hora_formatada = dt.strftime('%H:%M')
        except:
            hora_formatada = f"#{i}"
        
        # Verifica anterior para alertas de restauração e cálculo de flutuação
        throughput_anterior = None
        if i > 0:
            vol_ant = float(timeseries_data[i-1].get('Rede_Env', 0))
            throughput_anterior = (vol_ant * 1024) / interval_seconds
        
        # Regra 1: Throughput Crítico (<= 1 MB/s)
        if throughput_mb_s <= ALERT_THRESHOLDS['critical']:
            alerts.append({
                "tipo": "danger",
                "titulo": "Throughput Crítico",
                "mensagem": f"Envio crítico ({throughput_mb_s:.2f} MB/s) detectado às {hora_formatada}.",
                "timestamp": timestamp,
                "icone": "error",
                "classes": {
                    "container": "border-danger/50 bg-danger/10",
                    "iconeBg": "bg-danger/20 text-danger",
                    "titulo": "text-slate-900 dark:text-white",
                    "texto": "text-slate-600 dark:text-slate-400"
                }
            })
        
        # Regra 2: Throughput Baixo (< 1.2 MB/s mas > 1 MB/s)
        elif throughput_mb_s < ALERT_THRESHOLDS['warning']:
            alerts.append({
                "tipo": "warning",
                "titulo": "Throughput Baixo",
                "mensagem": f"Envio abaixo do ideal ({throughput_mb_s:.2f} MB/s) às {hora_formatada}.",
                "timestamp": timestamp,
                "icone": "warning",
                "classes": {
                    "container": "border-warning/50 bg-warning/10",
                    "iconeBg": "bg-warning/20 text-warning",
                    "titulo": "text-slate-900 dark:text-white",
                    "texto": "text-slate-600 dark:text-slate-400"
                }
            })
        
        # Regra 3: Conexão Restaurada (Crítico -> Normal)
        if (throughput_anterior is not None and 
            throughput_anterior <= ALERT_THRESHOLDS['critical'] and 
            throughput_mb_s > ALERT_THRESHOLDS['warning']):
            alerts.append({
                "tipo": "success",
                "titulo": "Conexão Restaurada",
                "mensagem": f"Estabilidade normalizada às {hora_formatada}.",
                "timestamp": timestamp,
                "icone": "task_alt",
                "classes": {
                    "container": "border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800",
                    "iconeBg": "bg-success/20 text-success",
                    "titulo": "text-slate-900 dark:text-white",
                    "texto": "text-slate-600 dark:text-slate-400"
                }
            })
    
    # ------------------- FASE 2: GARANTIA DE 3 AVISOS (NOVO) -------------------
    # Para garantir pelo menos 3 avisos de problema (danger, warning ou flutuação)
    # Filtra alertas de problema (danger e warning) gerados na FASE 1
    problem_alerts = [a for a in alerts if a['tipo'] in ['danger', 'warning']]
    
    if len(problem_alerts) < 3:
        alerts_to_add = 3 - len(problem_alerts)
        
        # Adiciona avisos de flutuação de throughput (quedas bruscas, mas não críticas)
        # Itera de trás para frente (dos dados mais recentes para os mais antigos)
        for i in range(len(timeseries_data) - 1, 0, -1):
            if alerts_to_add <= 0:
                break
                
            ponto_atual = timeseries_data[i]
            # O ponto anterior é timeseries_data[i-1] e seu throughput já foi calculado (throughput_anterior)
            
            # Recalcula throughputs para o ponto atual
            volume_gb = float(ponto_atual.get('Rede_Env', 0))
            throughput_mb_s = (volume_gb * 1024) / interval_seconds
            
            # Pega o throughput_anterior (que já foi calculado na FASE 1)
            vol_ant = float(timeseries_data[i-1].get('Rede_Env', 0))
            throughput_anterior = (vol_ant * 1024) / interval_seconds
            
            timestamp = ponto_atual.get('timestamp', '')
            try:
                dt = datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')
                hora_formatada = dt.strftime('%H:%M')
            except:
                hora_formatada = f"#{i}"

            # 1. Garante que o ponto atual não foi alertado como problema (danger/warning)
            # Verifica em todos os alertas, incluindo os já adicionados na FASE 2
            already_problem_alerted = any(a['timestamp'] == timestamp and a['tipo'] in ['danger', 'warning'] for a in alerts)
            
            # 2. Verifica se houve uma queda significativa (> 50%)
            # 3. Garante que o throughput atual é considerado 'normal' (> threshold de warning)
            if not already_problem_alerted and throughput_anterior > 0 and throughput_mb_s > ALERT_THRESHOLDS['warning']:
                drop_percent = (throughput_anterior - throughput_mb_s) / throughput_anterior
                
                if drop_percent >= 0.5: # 50% de queda
                    alerts.append({
                        "tipo": "warning", # Usando 'warning' para satisfazer o requisito de 'avisos'
                        "titulo": "Flutuação de Throughput",
                        "mensagem": f"Queda de {drop_percent*100:.0f}% no envio ({throughput_anterior:.2f} -> {throughput_mb_s:.2f} MB/s) às {hora_formatada}.",
                        "timestamp": timestamp,
                        "icone": "trending_down",
                        "classes": {
                            # Usando classes de 'warning' padrão
                            "container": "border-warning/50 bg-warning/10",
                            "iconeBg": "bg-warning/20 text-warning",
                            "titulo": "text-slate-900 dark:text-white",
                            "texto": "text-slate-600 dark:text-slate-400"
                        }
                    })
                    alerts_to_add -= 1


    # Retorna os últimos 20 alertas em ordem cronológica
    return sorted(alerts, key=lambda x: x['timestamp'])[-20:]


def calculate_kpis_with_variation(df_filtered: pd.DataFrame, timeseries_current: List[Dict], 
                                  timeseries_previous: List[Dict]) -> Dict[str, Any]:
    """Calcula KPIs somando os pontos do gráfico (Volume por intervalo)."""
    
    # KPIs básicos do período atual
    summary = {}
    summary['cpu_uso_medio'] = round(df_filtered['CPU'].mean(), 2)
    summary['ram_uso_medio_percent'] = round(df_filtered['RAM_Percent'].mean(), 2)
    
    summary['onibus_garagem_pico'] = int(df_filtered['Onibus_Garagem'].max()) if not df_filtered['Onibus_Garagem'].isnull().all() else 0
    summary['onibus_garagem_medio'] = int(df_filtered['Onibus_Garagem'].mean()) if not df_filtered['Onibus_Garagem'].isnull().all() else 0
    
    summary['disco_uso_gb'] = round(df_filtered['Disco'].iloc[-1], 2)
    
    # Média de banda (apenas informativo, recalculado do total)
    # Se Rede_Env é volume GB, soma tudo e divide pelo tempo total? 
    # Ou mantém a média dos pontos?
    # Vamos manter a média do campo original GB_Enviados_Seg para precisão
    summary['media_banda_periodo'] = round(df_filtered['GB_Enviados_Seg'].mean() * 1024, 2)
    summary['total_eventos_periodo'] = 0 	# Placeholder
    
    # --- CÁLCULO DE VOLUME TOTAL (SOMA DOS PONTOS) ---
    # Conforme solicitado: "soma dos pontos do gráfico Histórico de Throughput"
    # Rede_Env agora representa o Volume (GB) em cada intervalo
    
    # 1. Volume do Período Atual
    if timeseries_current:
        volume_atual_mb = sum(float(p.get('Rede_Env', 0)) for p in timeseries_current)
        # Ajuste de escala: Divide por 1024 (MB->GB) e por 1024 novamente conforme solicitado
        volume_atual_gb = (volume_atual_mb / 1024) / 1024
    else:
        volume_atual_gb = 0

    # 2. Volume do Período Anterior
    if timeseries_previous:
        volume_anterior_mb = sum(float(p.get('Rede_Env', 0)) for p in timeseries_previous)
        volume_anterior_gb = (volume_anterior_mb / 1024) / 1024
    else:
        volume_anterior_gb = 0
    
    summary['gb_total_enviado_periodo'] = round(volume_atual_gb, 2)
    summary['gb_total_enviado_periodo_anterior'] = round(volume_anterior_gb, 2)
    
    # Log para debug
    print(f"Volume Total (Soma dos Pontos) - Atual: {volume_atual:.2f}GB")
    print(f"Volume Total (Soma dos Pontos) - Anterior: {volume_anterior:.2f}GB")
    
    return summary


def split_timeseries_for_comparison(timeseries_full: List[Dict], config: Dict) -> Tuple[List[Dict], List[Dict]]:
    """Divide a série temporal em período atual e anterior para comparação."""
    total_points = len(timeseries_full)
    
    if total_points == 0:
        return [], []
    
    # Calcula pontos para cada período baseado na configuração
    dashboard_points = config.get('dashboard_period', total_points // 2)
    comparison_points = config.get('comparison_period', total_points // 2)
    
    # Garante que não exceda o total disponível
    total_needed = dashboard_points + comparison_points
    if total_needed > total_points:
        # Ajusta proporcionalmente
        ratio = total_points / total_needed
        dashboard_points = int(dashboard_points * ratio)
        comparison_points = total_points - dashboard_points
    
    # Divide: primeira parte = anterior, segunda parte = atual
    timeseries_previous = timeseries_full[:comparison_points]
    timeseries_current = timeseries_full[-dashboard_points:]
    
    print(f"Split: Total={total_points}, Anterior={len(timeseries_previous)}, Atual={len(timeseries_current)}")
    
    return timeseries_current, timeseries_previous


def process_and_aggregate_data(keys: List[str], time_key: str, time_range_limit: timedelta, 
                               id_garagem: str, config: Dict) -> Dict[str, Any]:
    """Baixa, combina, filtra e gera o resumo com KPIs, série temporal e alertas."""
    all_data = []
    current_time = datetime.now()
    time_limit = current_time - time_range_limit
    
    if not keys:
        return {}
        
    # Carrega todos os dados
    for key in keys:
        try:
            response = s3.get_object(Bucket=TRUSTED_BUCKET, Key=key)
            data_str = response['Body'].read().decode('utf-8')
            df_temp = pd.read_csv(StringIO(data_str))
            all_data.append(df_temp)
        except Exception as e:
            print(f"Erro ao baixar {key}: {e}")
            
    if not all_data:
        return {}
        
    df = pd.concat(all_data, ignore_index=True)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Filtra dados dentro do período
    df_filtered = df[df['timestamp'] >= time_limit].copy()
    
    if df_filtered.empty:
        return {}

    # Gera série temporal completa (para dividir em atual + anterior)
    df_ts = df_filtered.set_index('timestamp')
    freq = config['frequency']
    
    ts_agg = df_ts.resample(freq).agg({
        'CPU': 'mean',
        'RAM_Percent': 'mean',
        'Onibus_Garagem': 'mean',
        'GB_Enviados_Seg': 'mean',
        'Disco': 'last', 
        'GB_Total_Enviados': ['max', 'min'], # Pega max e min para calcular volume no intervalo
        'GB_Total_Recebidos': 'last'
    }).dropna()

    # Achata as colunas MultiIndex
    ts_agg.columns = ['_'.join(col).strip() if isinstance(col, tuple) else col for col in ts_agg.columns.values]
    
    # Renomeia colunas para facilitar
    ts_agg.rename(columns={
        'CPU_mean': 'CPU',
        'RAM_Percent_mean': 'RAM_Perc',
        'Onibus_Garagem_mean': 'Onibus',
        'GB_Total_Enviados_max': 'GB_Total_Max',
        'GB_Total_Enviados_min': 'GB_Total_Min',
        'GB_Total_Recebidos_last': 'GB_Total_Recebidos'
    }, inplace=True)

    ts_agg = ts_agg.reset_index()
    ts_agg['timestamp'] = ts_agg['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
    
    # Calcula Volume do Intervalo (MB) = (Max - Min) * 1024
    # Isso garante que Rede_Env seja o volume transferido naquele intervalo em MB
    ts_agg['Rede_Env'] = (ts_agg['GB_Total_Max'] - ts_agg['GB_Total_Min']) * 1024
    
    # Mantém apenas colunas necessárias
    ts_agg = ts_agg[['timestamp', 'CPU', 'RAM_Perc', 'Onibus', 'Rede_Env', 'GB_Total_Max', 'GB_Total_Recebidos']]
    
    # Renomeia GB_Total_Max para GB_Total_Enviados para compatibilidade
    ts_agg.rename(columns={'GB_Total_Max': 'GB_Total_Enviados'}, inplace=True)
    
    timeseries_full = json.loads(ts_agg.round(2).to_json(orient='records'))

    # Divide série temporal em atual e anterior
    timeseries_current, timeseries_previous = split_timeseries_for_comparison(timeseries_full, config)
    
    # Calcula KPIs com variação
    summary = calculate_kpis_with_variation(df_filtered, timeseries_current, timeseries_previous)
    
    # Gera alertas baseados no período atual
    alerts = generate_alerts(timeseries_current, config['frequency'])
    
    print(f"Gerados {len(alerts)} alertas para {id_garagem} ({time_key})")
    
    # Payload final otimizado
    final_payload = {
        'metadata': {
            'id_garagem': id_garagem, 
            'periodo': time_key,
            'timestamp_execucao': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        },
        'kpis_resumo': summary,
        'timeseries': timeseries_current, 	# Apenas período atual para o dashboard
        'alertas': alerts
    }

    return final_payload


def lambda_handler(event, context):
    garage_ids = discover_garage_ids()
    
    if not garage_ids:
        print("Aviso: Nenhuma pasta 'idGaragem=XXX/' encontrada no bucket Trusted.")
        return {'statusCode': 200, 'body': json.dumps({'message': 'Nenhuma garagem para processar.'})}

    print(f"Garagens encontradas para processamento: {garage_ids}")
    
    for id_garagem in garage_ids:
        print(f"\n--- Processando Garagem ID: {id_garagem} ---")
        
        for time_key, config in TIME_RANGES.items():
            time_range = config['range']
            
            keys_to_process = get_keys_for_time_range(time_range, id_garagem)
            
            if not keys_to_process:
                print(f"Nenhum arquivo encontrado para {id_garagem} no período {time_key}. Pulando.")
                continue
                
            final_payload = process_and_aggregate_data(keys_to_process, time_key, time_range, id_garagem, config)
            
            if not final_payload:
                continue
                
            json_payload = json.dumps(final_payload, indent=2)
            s3_key = f"idGaragem={id_garagem}/summary_{time_key}.json" 
            
            try:
                s3.put_object(
                    Bucket=CLIENT_BUCKET,
                    Key=s3_key,
                    Body=json_payload.encode('utf-8'),
                    ContentType='application/json'
                )
                print(f"Upload bem-sucedido: s3://{CLIENT_BUCKET}/{s3_key}")
                
            except Exception as e:
                print(f"Falha no upload para {CLIENT_BUCKET}: {e}")

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Processamento otimizado concluído com sucesso.'})
    }