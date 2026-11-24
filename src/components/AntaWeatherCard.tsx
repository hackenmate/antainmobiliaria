import { useCallback, useEffect, useState } from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Moon,
  RefreshCw,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react';
import { SECTORS, type SectorId } from '../data/properties';

interface AntaWeatherCardProps {
  activeSector: SectorId;
}

type WeatherIconKind =
  | 'sun'
  | 'moon'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'storm';

interface WeatherReading {
  temperatureC: number;
  feelsLikeC: number;
  humidityPct: number;
  windKmh: number;
  conditionLabel: string;
  iconKind: WeatherIconKind;
  observedAt: string;
  providerLabel: string;
}

function mapWmoCode(
  code: number,
  isDay: boolean
): { label: string; iconKind: WeatherIconKind } {
  if (code === 0) {
    return { label: 'Cielo despejado', iconKind: isDay ? 'sun' : 'moon' };
  }
  if (code === 1) {
    return {
      label: 'Mayormente despejado',
      iconKind: isDay ? 'partly-cloudy' : 'moon',
    };
  }
  if (code === 2) {
    return { label: 'Parcialmente nublado', iconKind: 'partly-cloudy' };
  }
  if (code === 3) {
    return { label: 'Cielo cubierto', iconKind: 'cloudy' };
  }
  if (code === 45 || code === 48) {
    return { label: 'Neblina en el valle', iconKind: 'fog' };
  }
  if ((code >= 51 && code <= 57)) {
    return { label: 'Llovizna ligera', iconKind: 'drizzle' };
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return { label: 'Lluvia en el sector', iconKind: 'rain' };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { label: 'Granizo o nieve en altura', iconKind: 'snow' };
  }
  if (code >= 95) {
    return { label: 'Tormenta eléctrica', iconKind: 'storm' };
  }
  return { label: 'Clima de montaña', iconKind: 'partly-cloudy' };
}

function mapOpenWeatherIcon(id: number, iconCode: string): WeatherIconKind {
  const isNight = iconCode.endsWith('n');
  if (id >= 200 && id < 300) return 'storm';
  if (id >= 300 && id < 400) return 'drizzle';
  if (id >= 500 && id < 600) return 'rain';
  if (id >= 600 && id < 700) return 'snow';
  if (id >= 700 && id < 800) return 'fog';
  if (id === 800) return isNight ? 'moon' : 'sun';
  if (id === 801 || id === 802) return 'partly-cloudy';
  return 'cloudy';
}

function renderWeatherIcon(kind: WeatherIconKind) {
  const props = { size: 28, strokeWidth: 1.75 };
  switch (kind) {
    case 'sun':
      return <Sun {...props} />;
    case 'moon':
      return <Moon {...props} />;
    case 'partly-cloudy':
      return <CloudSun {...props} />;
    case 'cloudy':
      return <Cloud {...props} />;
    case 'fog':
      return <CloudFog {...props} />;
    case 'drizzle':
      return <CloudDrizzle {...props} />;
    case 'rain':
      return <CloudRain {...props} />;
    case 'snow':
      return <CloudSnow {...props} />;
    case 'storm':
      return <CloudLightning {...props} />;
  }
}

export function AntaWeatherCard({ activeSector }: AntaWeatherCardProps) {
  const sectorMeta = SECTORS[activeSector];
  const [reading, setReading] = useState<WeatherReading | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const loadWeather = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(false);

      const { lat, lng } = sectorMeta.coordinates;
      const openWeatherKey = import.meta.env.VITE_OPENWEATHER_API_KEY?.trim();

      try {
        if (openWeatherKey) {
          const owRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&lang=es&appid=${encodeURIComponent(
              openWeatherKey
            )}`,
            { signal }
          );
          if (owRes.ok) {
            const owData = await owRes.json();
            const rawDesc = String(owData.weather?.[0]?.description || 'Despejado');
            const formattedDesc =
              rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1);
            const dt = owData.dt
              ? new Date(owData.dt * 1000).toLocaleTimeString('es-PE', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'America/Lima',
                })
              : '--:--';

            setReading({
              temperatureC: Math.round(Number(owData.main?.temp ?? 0)),
              feelsLikeC: Math.round(Number(owData.main?.feels_like ?? 0)),
              humidityPct: Math.round(Number(owData.main?.humidity ?? 0)),
              windKmh: Math.round(Number(owData.wind?.speed ?? 0) * 3.6),
              conditionLabel: formattedDesc,
              iconKind: mapOpenWeatherIcon(
                Number(owData.weather?.[0]?.id ?? 800),
                String(owData.weather?.[0]?.icon ?? '01d')
              ),
              observedAt: dt,
              providerLabel: 'OpenWeatherMap',
            });
            setLoading(false);
            return;
          }
        }

        const omRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=America%2FLima`,
          { signal }
        );
        if (!omRes.ok) {
          throw new Error('Weather API unavailable');
        }
        const omData = await omRes.json();
        const cur = omData.current;
        if (!cur) {
          throw new Error('Missing current weather payload');
        }

        const mapped = mapWmoCode(
          Number(cur.weather_code ?? 0),
          Number(cur.is_day ?? 1) === 1
        );
        const timeText =
          typeof cur.time === 'string' && cur.time.includes('T')
            ? cur.time.split('T')[1].slice(0, 5)
            : '--:--';

        setReading({
          temperatureC: Math.round(Number(cur.temperature_2m ?? 0)),
          feelsLikeC: Math.round(Number(cur.apparent_temperature ?? 0)),
          humidityPct: Math.round(Number(cur.relative_humidity_2m ?? 0)),
          windKmh: Math.round(Number(cur.wind_speed_10m ?? 0)),
          conditionLabel: mapped.label,
          iconKind: mapped.iconKind,
          observedAt: timeText,
          providerLabel: 'Open-Meteo',
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(true);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [sectorMeta.coordinates]
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadWeather(controller.signal);
    return () => controller.abort();
  }, [loadWeather]);

  return (
    <article
      className="bento-tile bento-weather reveal-tile"
      aria-label="Clima actual en Anta"
    >
      <div className="bento-weather-main">
        <div className="bento-weather-id">
          <span className="bento-weather-icon-wrap" aria-hidden="true">
            {reading ? renderWeatherIcon(reading.iconKind) : <CloudSun size={28} strokeWidth={1.75} />}
          </span>
          <div>
            <span className="bento-weather-kicker">
              Clima actual en Anta · {sectorMeta.shortName} ({sectorMeta.elevation})
            </span>
            {loading && !reading ? (
              <h3 className="bento-weather-title">Consultando condiciones del valle…</h3>
            ) : error && !reading ? (
              <h3 className="bento-weather-title">Sin conexión meteorológica</h3>
            ) : reading ? (
              <div className="bento-weather-headline">
                <strong className="bento-weather-temp tabular-nums">
                  {reading.temperatureC}°C
                </strong>
                <span className="bento-weather-cond">{reading.conditionLabel}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="bento-weather-metrics">
          {reading ? (
            <>
              <div className="bento-weather-stat">
                <Thermometer size={15} strokeWidth={1.8} aria-hidden="true" />
                <div>
                  <span className="bento-weather-stat-label">Sensación</span>
                  <strong className="bento-weather-stat-val tabular-nums">
                    {reading.feelsLikeC}°C
                  </strong>
                </div>
              </div>

              <div className="bento-weather-stat">
                <Droplets size={15} strokeWidth={1.8} aria-hidden="true" />
                <div>
                  <span className="bento-weather-stat-label">Humedad</span>
                  <strong className="bento-weather-stat-val tabular-nums">
                    {reading.humidityPct}%
                  </strong>
                </div>
              </div>

              <div className="bento-weather-stat">
                <Wind size={15} strokeWidth={1.8} aria-hidden="true" />
                <div>
                  <span className="bento-weather-stat-label">Viento</span>
                  <strong className="bento-weather-stat-val tabular-nums">
                    {reading.windKmh} km/h
                  </strong>
                </div>
              </div>
            </>
          ) : null}

          <div className="bento-weather-actions">
            {reading && (
              <span className="bento-weather-source tabular-nums">
                {reading.observedAt} h · {reading.providerLabel}
              </span>
            )}
            <button
              type="button"
              className="bento-weather-refresh"
              aria-label="Actualizar clima actual en Anta"
              disabled={loading}
              onClick={() => void loadWeather()}
            >
              <RefreshCw
                size={14}
                strokeWidth={1.9}
                className={loading ? 'is-spinning' : undefined}
              />
              <span>{error ? 'Reintentar' : 'Actualizar'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
