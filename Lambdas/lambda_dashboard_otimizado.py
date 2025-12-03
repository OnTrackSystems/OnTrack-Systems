import json
import pandas as pd
import boto3
from datetime import datetime, timedelta
from io import StringIO
from typing import List, Dict, Any, Tuple

# --- CONFIGURAÇÕES ---
TRUSTED_BUCKET = "trusted-ontrack"
CLIENT_BUCKET = "client-ontrack"

# PERÍODOS DE TEMPO
TIME_RANGES: Dict[str, Dict[str, Any]] = {
    "48h": {
        "range": timedelta(hours=48),
        "frequency": "h",
        "dashboard_period": 24,
        "comparison_period": 24
    },
    "14d": {
        "range": timedelta(days=14),
        "frequency": "4h",
        "dashboard_period": 42,
        "comparison_period": 42
    },
    "60d": {
        "range": timedelta(days=60),
        "frequency": "D",
        "dashboard_period": 30,
        "comparison_period": 30
    }
}

# Thresholds para alertas baseados nos valores REAIS de cada período
# Valores em MB por intervalo (não MB/s)
ALERT_THRESHOLDS_BY_PERIOD = {
    "48h": {
        # 24h: menor ~20MB, maior ~44MB por hora
        "critical": 22,      # Abaixo de 22 MB/h = crítico
        "warning": 26,       # Abaixo de 26 MB/h = aviso
        "drop_percent": 0.25 # Queda de 25% = flutuação
    },
    "14d": {
        # 7d: menor ~72MB, maior ~192MB por 4h
        "critical": 85,      # Abaixo de 85 MB/4h = crítico
        "warning": 110,      # Abaixo de 110 MB/4h = aviso
        "drop_percent": 0.30 # Queda de 30% = flutuação
    },
    "60d": {
        # 30d: menor ~550MB, maior ~840MB por dia
        "critical": 580,     # Abaixo de 580 MB/dia = crítico
        "warning": 650,      # Abaixo de 650 MB/dia = aviso
        "drop_percent": 0.20 # Queda de 20% = flutuação
    }
}

# Cliente S3
s3 = boto3.client("s3")


def discover_garage_ids() -> List[str]:
    """Descobre todos os IDs de garagem existentes no bucket Trusted."""
    ids = set()
    paginator = s3.get_paginator("list_objects_v2")
    pages = paginator.paginate(Bucket=TRUSTED_BUCKET, Delimiter="/")

    for page in pages:
        if "CommonPrefixes" in page:
            for prefix in page["CommonPrefixes"]:
                if prefix["Prefix"].startswith("idGaragem="):
                    garage_id = prefix["Prefix"].split("=")[1].replace("/", "")
                    ids.add(garage_id)
    return list(ids)


def get_keys_for_time_range(time_range: timedelta, id_garagem: str) -> List[str]:
    """Busca as chaves (arquivos) no S3 para a garagem e o período especificados."""
    start_time = datetime.now() - time_range
    now = datetime.now()
    keys: List[str] = []

    current_date = start_time.date()
    while current_date <= now.date():
        prefix = (
            f"idGaragem={id_garagem}/"
            f"ano={current_date.strftime('%Y')}/"
            f"mes={current_date.strftime('%m')}/"
            f"dia={current_date.strftime('%d')}/"
        )
        paginator = s3.get_paginator("list_objects_v2")
        pages = paginator.paginate(Bucket=TRUSTED_BUCKET, Prefix=prefix)

        for page in pages:
            if "Contents" in page:
                for obj in page["Contents"]:
                    keys.append(obj["Key"])

        current_date += timedelta(days=1)
    return keys


def generate_alerts(timeseries_data: List[Dict], frequency: str, time_key: str) -> List[Dict]:
    """Gera alertas baseados nos dados de throughput usando thresholds específicos por período."""
    alerts: List[Dict] = []

    # Obtém thresholds específicos do período
    thresholds = ALERT_THRESHOLDS_BY_PERIOD.get(time_key, ALERT_THRESHOLDS_BY_PERIOD["48h"])
    critical_mb = thresholds["critical"]
    warning_mb = thresholds["warning"]
    drop_threshold = thresholds["drop_percent"]

    # Mapeamento de unidade de tempo para exibição
    unit_map = {"h": "hora", "4h": "4 horas", "D": "dia"}
    time_unit = unit_map.get(frequency, "intervalo")

    for i, ponto in enumerate(timeseries_data):
        volume_mb = float(ponto.get("Rede_Env", 0))

        timestamp = ponto.get("timestamp", "")
        try:
            dt = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
            hora_formatada = dt.strftime("%d/%m %H:%M")
        except Exception:
            hora_formatada = f"#{i}"

        volume_anterior = None
        if i > 0:
            volume_anterior = float(timeseries_data[i - 1].get("Rede_Env", 0))

        # Alerta CRÍTICO: volume muito baixo
        if volume_mb <= critical_mb:
            alerts.append({
                "tipo": "danger",
                "titulo": "Throughput Crítico",
                "mensagem": f"Transferência crítica ({volume_mb:.1f} MB/{time_unit}) detectada em {hora_formatada}.",
                "timestamp": timestamp,
                "icone": "error",
                "classes": {
                    "container": "border-danger/50 bg-danger/10",
                    "iconeBg": "bg-danger/20 text-danger",
                    "titulo": "text-slate-900 dark:text-white",
                    "texto": "text-slate-600 dark:text-slate-400"
                }
            })
        # Alerta WARNING: volume abaixo do ideal
        elif volume_mb < warning_mb:
            alerts.append({
                "tipo": "warning",
                "titulo": "Throughput Baixo",
                "mensagem": f"Transferência abaixo do ideal ({volume_mb:.1f} MB/{time_unit}) em {hora_formatada}.",
                "timestamp": timestamp,
                "icone": "warning",
                "classes": {
                    "container": "border-warning/50 bg-warning/10",
                    "iconeBg": "bg-warning/20 text-warning",
                    "titulo": "text-slate-900 dark:text-white",
                    "texto": "text-slate-600 dark:text-slate-400"
                }
            })

        # Alerta de RECUPERAÇÃO: saiu do crítico para normal
        if (volume_anterior is not None and
                volume_anterior <= critical_mb and
                volume_mb > warning_mb):
            alerts.append({
                "tipo": "success",
                "titulo": "Conexão Restaurada",
                "mensagem": f"Transferência normalizada ({volume_mb:.1f} MB/{time_unit}) em {hora_formatada}.",
                "timestamp": timestamp,
                "icone": "task_alt",
                "classes": {
                    "container": "border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800",
                    "iconeBg": "bg-success/20 text-success",
                    "titulo": "text-slate-900 dark:text-white",
                    "texto": "text-slate-600 dark:text-slate-400"
                }
            })

    # Fase 2: Detecta flutuações bruscas (quedas significativas)
    problem_alerts = [a for a in alerts if a["tipo"] in ["danger", "warning"]]

    if len(problem_alerts) < 3:
        alerts_to_add = 3 - len(problem_alerts)
        for i in range(len(timeseries_data) - 1, 0, -1):
            if alerts_to_add <= 0:
                break

            ponto_atual = timeseries_data[i]
            volume_mb = float(ponto_atual.get("Rede_Env", 0))
            volume_anterior = float(timeseries_data[i - 1].get("Rede_Env", 0))

            timestamp = ponto_atual.get("timestamp", "")
            try:
                dt = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
                hora_formatada = dt.strftime("%d/%m %H:%M")
            except Exception:
                hora_formatada = f"#{i}"

            already_alerted = any(
                a.get("timestamp") == timestamp and a.get("tipo") in ["danger", "warning"] for a in alerts
            )

            # Detecta queda percentual significativa
            if not already_alerted and volume_anterior > 0 and volume_mb > warning_mb:
                drop_percent = (volume_anterior - volume_mb) / volume_anterior
                if drop_percent >= drop_threshold:
                    alerts.append({
                        "tipo": "warning",
                        "titulo": "Flutuação de Throughput",
                        "mensagem": f"Queda de {drop_percent*100:.0f}% ({volume_anterior:.1f} → {volume_mb:.1f} MB) em {hora_formatada}.",
                        "timestamp": timestamp,
                        "icone": "trending_down",
                        "classes": {
                            "container": "border-warning/50 bg-warning/10",
                            "iconeBg": "bg-warning/20 text-warning",
                            "titulo": "text-slate-900 dark:text-white",
                            "texto": "text-slate-600 dark:text-slate-400"
                        }
                    })
                    alerts_to_add -= 1

    # Retorna os últimos 20 alertas em ordem cronológica
    sorted_alerts = sorted(alerts, key=lambda x: x.get("timestamp", ""))
    return sorted_alerts[-20:]


def calculate_kpis_with_variation(df_filtered: pd.DataFrame, timeseries_current: List[Dict],
                                  timeseries_previous: List[Dict]) -> Dict[str, Any]:
    """Calcula KPIs somando os pontos do gráfico (Volume por intervalo)."""
    summary: Dict[str, Any] = {}

    if "CPU" in df_filtered.columns and not df_filtered["CPU"].isnull().all():
        summary["cpu_uso_medio"] = round(df_filtered["CPU"].mean(), 2)
    else:
        summary["cpu_uso_medio"] = 0.0

    if "RAM_Percent" in df_filtered.columns and not df_filtered["RAM_Percent"].isnull().all():
        summary["ram_uso_medio_percent"] = round(df_filtered["RAM_Percent"].mean(), 2)
    else:
        summary["ram_uso_medio_percent"] = 0.0

    if "Onibus_Garagem" in df_filtered.columns and not df_filtered["Onibus_Garagem"].isnull().all():
        summary["onibus_garagem_pico"] = int(df_filtered["Onibus_Garagem"].max())
        summary["onibus_garagem_medio"] = int(df_filtered["Onibus_Garagem"].mean())
    else:
        summary["onibus_garagem_pico"] = 0
        summary["onibus_garagem_medio"] = 0

    summary["disco_uso_gb"] = round(df_filtered["Disco"].iloc[-1], 2) if "Disco" in df_filtered.columns else 0.0

    if "MB_Enviados_Seg" in df_filtered.columns:
        summary["media_banda_periodo"] = round(df_filtered["MB_Enviados_Seg"].mean(), 6)
    else:
        summary["media_banda_periodo"] = 0.0

    summary["total_eventos_periodo"] = 0

    volume_atual_mb = sum(float(p.get("Rede_Env", 0)) for p in timeseries_current) if timeseries_current else 0.0
    volume_anterior_mb = sum(float(p.get("Rede_Env", 0)) for p in timeseries_previous) if timeseries_previous else 0.0

    volume_atual_gb = volume_atual_mb / 1024.0
    volume_anterior_gb = volume_anterior_mb / 1024.0

    summary["gb_total_enviado_periodo"] = round(volume_atual_gb, 2)
    summary["gb_total_enviado_periodo_anterior"] = round(volume_anterior_gb, 2)
    summary["mb_total_enviado_periodo"] = round(volume_atual_mb, 2)
    summary["mb_total_enviado_periodo_anterior"] = round(volume_anterior_mb, 2)

    print(f"Volume Total (MB) - Atual: {volume_atual_mb:.2f}MB, Anterior: {volume_anterior_mb:.2f}MB")
    print(f"Volume Total (GB) - Atual: {volume_atual_gb:.2f}GB, Anterior: {volume_anterior_gb:.2f}GB")

    return summary


def split_timeseries_for_comparison(timeseries_full: List[Dict], config: Dict) -> Tuple[List[Dict], List[Dict]]:
    """Divide a série temporal em período atual e anterior para comparação."""
    total_points = len(timeseries_full)
    if total_points == 0:
        return [], []

    dashboard_points = config.get("dashboard_period", total_points // 2)
    comparison_points = config.get("comparison_period", total_points // 2)

    total_needed = dashboard_points + comparison_points
    if total_needed > total_points:
        ratio = total_points / total_needed
        dashboard_points = int(dashboard_points * ratio)
        comparison_points = total_points - dashboard_points

    timeseries_previous = timeseries_full[-(dashboard_points + comparison_points):-dashboard_points] if (dashboard_points + comparison_points) <= total_points else timeseries_full[:comparison_points]
    timeseries_current = timeseries_full[-dashboard_points:] if dashboard_points > 0 else []

    print(f"Split: Total={total_points}, Anterior={len(timeseries_previous)}, Atual={len(timeseries_current)}")

    return timeseries_current, timeseries_previous


def process_and_aggregate_data(keys: List[str], time_key: str, time_range_limit: timedelta,
                               id_garagem: str, config: Dict) -> Dict[str, Any]:
    """Baixa, combina, filtra e gera o resumo com KPIs, série temporal e alertas."""
    all_data: List[pd.DataFrame] = []
    current_time = datetime.now()
    time_limit = current_time - time_range_limit

    if not keys:
        return {}

    for key in keys:
        try:
            response = s3.get_object(Bucket=TRUSTED_BUCKET, Key=key)
            data_str = response["Body"].read().decode("utf-8")
            df_temp = pd.read_csv(StringIO(data_str))
            all_data.append(df_temp)
        except Exception as e:
            print(f"Erro ao baixar {key}: {e}")

    if not all_data:
        return {}

    df = pd.concat(all_data, ignore_index=True)
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df_filtered = df[df["timestamp"] >= time_limit].copy()

    if df_filtered.empty:
        return {}

    df_ts = df_filtered.set_index("timestamp")
    freq = config["frequency"]

    ts_agg = df_ts.resample(freq).agg({
        "CPU": "mean",
        "RAM_Percent": "mean",
        "Onibus_Garagem": "mean",
        "MB_Enviados_Seg": "mean",
        "Disco": "last",
        "MB_Total_Enviados": ["max", "min"],
        "MB_Total_Recebidos": "last"
    }).dropna()

    ts_agg.columns = ["_".join(col).strip() if isinstance(col, tuple) else col for col in ts_agg.columns.values]

    ts_agg.rename(columns={
        "CPU_mean": "CPU",
        "RAM_Percent_mean": "RAM_Perc",
        "Onibus_Garagem_mean": "Onibus",
        "MB_Total_Enviados_max": "MB_Total_Max",
        "MB_Total_Enviados_min": "MB_Total_Min",
        "MB_Total_Recebidos_last": "MB_Total_Recebidos"
    }, inplace=True)

    ts_agg = ts_agg.reset_index()
    ts_agg["timestamp"] = ts_agg["timestamp"].dt.strftime("%Y-%m-%d %H:%M:%S")

    ts_agg["Rede_Env"] = ts_agg["MB_Total_Max"] - ts_agg["MB_Total_Min"]

    ts_agg = ts_agg[["timestamp", "CPU", "RAM_Perc", "Onibus", "Rede_Env", "MB_Total_Max", "MB_Total_Recebidos"]]

    ts_agg.rename(columns={"MB_Total_Max": "MB_Total_Enviados"}, inplace=True)

    timeseries_full = json.loads(ts_agg.round(2).to_json(orient="records"))

    timeseries_current, timeseries_previous = split_timeseries_for_comparison(timeseries_full, config)

    summary = calculate_kpis_with_variation(df_filtered, timeseries_current, timeseries_previous)

    # Passa time_key para generate_alerts usar thresholds corretos
    alerts = generate_alerts(timeseries_current, config["frequency"], time_key)

    print(f"Gerados {len(alerts)} alertas para {id_garagem} ({time_key})")

    timeseries_combined = timeseries_previous + timeseries_current

    final_payload = {
        "metadata": {
            "id_garagem": id_garagem,
            "periodo": time_key,
            "timestamp_execucao": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        "kpis_resumo": summary,
        "timeseries": timeseries_combined,
        "alertas": alerts
    }

    return final_payload


def lambda_handler(event, context):
    garage_ids = discover_garage_ids()

    if not garage_ids:
        print("Aviso: Nenhuma pasta 'idGaragem=XXX/' encontrada no bucket Trusted.")
        return {"statusCode": 200, "body": json.dumps({"message": "Nenhuma garagem para processar."})}

    print(f"Garagens encontradas para processamento: {garage_ids}")

    for id_garagem in garage_ids:
        print(f"\n--- Processando Garagem ID: {id_garagem} ---")

        for time_key, config in TIME_RANGES.items():
            time_range = config["range"]

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
                    Body=json_payload.encode("utf-8"),
                    ContentType="application/json"
                )
                print(f"Upload bem-sucedido: s3://{CLIENT_BUCKET}/{s3_key}")

            except Exception as e:
                print(f"Falha no upload para {CLIENT_BUCKET}: {e}")

    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Processamento otimizado concluído com sucesso."})
    }