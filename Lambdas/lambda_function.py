import json
import pandas as pd
import boto3
from datetime import datetime, timedelta
from io import StringIO

# --- CONFIGURAÇÕES: AJUSTE OS NOMES DOS SEUS BUCKETS AQUI ---
TRUSTED_BUCKET = 'trusted-ontrack'
CLIENT_BUCKET = 'client-ontrack' 

# Define os intervalos de tempo para agregação
TIME_RANGES = {
    '24h': timedelta(hours=24),
    '7d': timedelta(days=7),
    '30d': timedelta(days=30),
}

# Define a frequência de amostragem (resample) para cada período
RESAMPLE_FREQUENCIES = {
    '24h': 'H',
    '7d': '4H', 
    '30d': 'D',
}

s3 = boto3.client('s3')


def discover_garage_ids() -> list:
    """
    Descobre todos os IDs de garagem existentes no bucket Trusted,
    lendo os prefixes de partição 'idGaragem=XXX/'.
    """
    ids = set()
    
    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(
        Bucket=TRUSTED_BUCKET,
        Delimiter='/' 
    )
    
    for page in pages:
        if 'CommonPrefixes' in page:
            for prefix in page['CommonPrefixes']:
                if prefix['Prefix'].startswith('idGaragem='):
                    garage_id = prefix['Prefix'].split('=')[1].replace('/', '')
                    ids.add(garage_id)
                    
    return list(ids)


def get_keys_for_time_range(time_range: timedelta, id_garagem: str) -> list:
    """
    Busca as chaves (arquivos) no S3 para a garagem e o período especificados.
    """
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


def process_and_aggregate_data(keys: list, time_key: str, time_range_limit: timedelta, id_garagem: str) -> dict:
    """
    Baixa, combina, filtra e gera o resumo (KPIs) e a série temporal para gráficos.
    """
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
    df_filtered = df[df['timestamp'] >= time_limit].copy()
    
    if df_filtered.empty: return {}

    # Geração da Série Temporal (Resample)
    df_ts = df_filtered.set_index('timestamp')
    freq = RESAMPLE_FREQUENCIES[time_key]
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
                           
    ts_agg = ts_agg[['timestamp', 'CPU', 'RAM_Perc', 'Onibus', 'Rede_Env']]
    # Converte a série temporal para uma lista de objetos JSON para facilitar o uso no Front-end (ex: Chart.js)
    timeseries_json = json.loads(ts_agg.round(2).to_json(orient='records'))

    # Cálculo das Métricas de Resumo (KPIs de Média/Máximo/Total)
    summary = {}
    summary['cpu_uso_medio'] = round(df_filtered['CPU'].mean(), 2)
    summary['ram_uso_medio_percent'] = round(df_filtered['RAM_Percent'].mean(), 2)
    summary['onibus_garagem_pico'] = int(df_filtered['Onibus_Garagem'].max())
    summary['onibus_garagem_medio'] = int(df_filtered['Onibus_Garagem'].mean())
    summary['disco_uso_gb'] = round(df_filtered['Disco'].iloc[-1], 2)
    
    total_env_final = df_filtered['MB_Total_Enviados'].iloc[-1]
    total_env_inicial = df_filtered['MB_Total_Enviados'].iloc[0]
    summary['mb_total_enviado_periodo'] = round(total_env_final - total_env_inicial, 2)
    
    # Estrutura Final
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
    """
    Função principal do Lambda, agora universal para todas as garagens.
    """
    
    # 1. DESCobre quais IDs existem no S3
    garage_ids = discover_garage_ids()
    
    if not garage_ids:
        print("Aviso: Nenhuma pasta 'idGaragem=XXX/' encontrada no bucket Trusted.")
        return {'statusCode': 200, 'body': json.dumps({'message': 'Nenhuma garagem para processar.'})}

    print(f"Garagens encontradas para processamento: {garage_ids}")
    
    # 2. LOOP sobre cada ID de Garagem
    for id_garagem in garage_ids:
        print(f"\n--- Processando Garagem ID: {id_garagem} ---")
        
        # 3. LOOP sobre cada Período (24h, 7d, 30d)
        for time_key, time_range in TIME_RANGES.items():
            
            keys_to_process = get_keys_for_time_range(time_range, id_garagem)
            
            if not keys_to_process:
                print(f"Nenhum arquivo encontrado para {id_garagem} no período {time_key}. Pulando.")
                continue
                
            final_payload = process_and_aggregate_data(keys_to_process, time_key, time_range, id_garagem)
            
            if not final_payload:
                continue
                
            # 4. Upload para o bucket Client
            json_payload = json.dumps(final_payload, indent=2)
            
            # Caminho: idGaragem={ID}/summary_24h.json
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