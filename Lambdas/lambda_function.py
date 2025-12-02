import json
import pandas as pd
import boto3
from datetime import datetime, timedelta
from io import StringIO
from typing import List, Dict, Any

# --- CONFIGURAÇÕES ---
TRUSTED_BUCKET = 'trusted-ontrack'
CLIENT_BUCKET = 'client-ontrack' 

# 1. PERÍODOS DE TEMPO E NOMES DE ARQUIVOS AJUSTADOS:
# '48h' para 48 horas, '14d' para 14 dias, '60d' para 60 dias.
TIME_RANGES: Dict[str, timedelta] = {
    '48h': timedelta(hours=48),
    '14d': timedelta(days=14),
    '60d': timedelta(days=60), 
}

# 2. FREQUÊNCIAS DE AMOSTRAGEM AJUSTADAS:
RESAMPLE_FREQUENCIES: Dict[str, str] = {
    '48h': 'h',  # Amostragem Horária
    '14d': '4h',  # Amostragem a cada 4 horas
    '60d': 'D',  # Amostragem Diária
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
    
    # Busca arquivos dia por dia dentro do range para otimizar a listagem
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


def process_and_aggregate_data(keys: List[str], time_key: str, time_range_limit: timedelta, id_garagem: str) -> Dict[str, Any]:
    """Baixa, combina, filtra e gera o resumo (KPIs) e a série temporal."""
    all_data = []
    current_time = datetime.now()
    time_limit = current_time - time_range_limit
    
    if not keys: return {}
        
    for key in keys:
        try:
            response = s3.get_object(Bucket=TRUSTED_BUCKET, Key=key)
            data_str = response['Body'].read().decode('utf-8')
            df_temp = pd.read_csv(StringIO(data_str))
            all_data.append(df_temp)
        except Exception as e:
            print(f"Erro ao baixar {key}: {e}")
            
    if not all_data: return {}
        
    df = pd.concat(all_data, ignore_index=True)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Filtra dados que podem ter vindo a mais por causa da granularidade de partição (dia)
    df_filtered = df[df['timestamp'] >= time_limit].copy()
    
    if df_filtered.empty: return {}

    # Geração da Série Temporal (Resample)
    df_ts = df_filtered.set_index('timestamp')
    freq = RESAMPLE_FREQUENCIES[time_key]
    
    # Agregação
    ts_agg = df_ts.resample(freq).agg({
        'CPU': 'mean',
        'RAM_Percent': 'mean',
        'Onibus_Garagem': 'mean',
        'MB_Enviados_Seg': 'mean',
        'Disco': 'last', 
        'MB_Total_Enviados': 'last',
        'MB_Total_Recebidos': 'last'
    }).dropna()

    ts_agg = ts_agg.reset_index()
    ts_agg['timestamp'] = ts_agg['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
    
    ts_agg.rename(columns={'RAM_Percent': 'RAM_Perc', 
                           'Onibus_Garagem': 'Onibus',
                           'MB_Enviados_Seg': 'Rede_Env'}, inplace=True)
                            
    # Seleciona as colunas da Time Series (apenas as de monitoramento principal)
    ts_agg = ts_agg[['timestamp', 'CPU', 'RAM_Perc', 'Onibus', 'Rede_Env']]
    timeseries_json = json.loads(ts_agg.round(2).to_json(orient='records'))

    # --- Cálculo de KPIs ---
    summary = {}
    summary['cpu_uso_medio'] = round(df_filtered['CPU'].mean(), 2)
    summary['ram_uso_medio_percent'] = round(df_filtered['RAM_Percent'].mean(), 2)
    
    # Usa int(max) e int(mean) para Onibus_Garagem (assumindo que são contagens)
    summary['onibus_garagem_pico'] = int(df_filtered['Onibus_Garagem'].max()) if not df_filtered['Onibus_Garagem'].isnull().all() else 0
    summary['onibus_garagem_medio'] = int(df_filtered['Onibus_Garagem'].mean()) if not df_filtered['Onibus_Garagem'].isnull().all() else 0
    
    summary['disco_uso_gb'] = round(df_filtered['Disco'].iloc[-1], 2)
    
    # Cálculo de Transferência de Dados
    total_env_final = df_filtered['MB_Total_Enviados'].iloc[-1]
    total_env_inicial = df_filtered['MB_Total_Enviados'].iloc[0]
    summary['mb_total_enviado_periodo'] = round(total_env_final - total_env_inicial, 2)
    
    total_rec_final = df_filtered['MB_Total_Recebidos'].iloc[-1]
    total_rec_inicial = df_filtered['MB_Total_Recebidos'].iloc[0]
    summary['mb_total_recebido_periodo'] = round(total_rec_final - total_rec_inicial, 2)

    # Adicionando valores placeholder para compatibilidade com o controller JS
    summary['total_eventos_periodo'] = 0 
    summary['media_banda_periodo'] = round(df_filtered['MB_Enviados_Seg'].mean(), 2)
    
    
    final_payload = {
        'metadata': {
            'id_garagem': id_garagem, 
            'periodo': time_key,
            'timestamp_execucao': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        },
        'kpis_resumo': summary,
        'timeseries': timeseries_json 
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
        
        # Loop para 48h, 14d, 60d
        for time_key, time_range in TIME_RANGES.items():
            
            keys_to_process = get_keys_for_time_range(time_range, id_garagem)
            
            if not keys_to_process:
                print(f"Nenhum arquivo encontrado para {id_garagem} no período {time_key} ({time_range}). Pulando.")
                continue
                
            final_payload = process_and_aggregate_data(keys_to_process, time_key, time_range, id_garagem)
            
            if not final_payload:
                continue
                
            json_payload = json.dumps(final_payload, indent=2)
            
            # O nome do arquivo final é summary_48h.json, summary_14d.json ou summary_60d.json
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
        'body': json.dumps({'message': 'Processamento universal concluído com sucesso.'})
    }