/**
 * Archivo HISTÓRICO de clima espacial (no es en vivo). Lo leen las misiones y el Archivo Científico.
 *
 * Origen: llamaradas reales registradas por NASA (DONKI / SVS) y NOAA SWPC. Hora = pico en rayos X (UTC).
 * `verifiedAgainstDonki: false` significa que los valores se tomaron de reportes públicos de NASA/NOAA
 * (ver `reference`) y todavía no se contrastaron con la API de DONKI. `npm run data:donki` descarga
 * DONKI (api.nasa.gov), reemplaza los eventos de cada semana y marca el archivo como verificado.
 */
export interface ArchivedFlare {
  peakTime: string;       // ISO 8601 UTC
  classType: string;      // clase GOES: C, M o X + magnitud (p. ej. "X9.3")
  activeRegion?: number;  // número NOAA de la región activa
  sep: boolean;           // hubo tormenta de partículas energéticas (SEP) asociada
}

export interface ArchivedWeek {
  id: string;
  startDate: string;      // primera jornada de la misión (fecha real)
  endDate: string;        // séptima jornada
  verifiedAgainstDonki: boolean;
  reference: string;      // página oficial para verificar
  flares: ArchivedFlare[];
}

export const DONKI_ARCHIVE: ArchivedWeek[] = [
  {
    id: 'quiet-2019',
    startDate: '2019-12-02',
    endDate: '2019-12-08',
    verifiedAgainstDonki: false,
    reference: 'https://www.nasa.gov/news-release/solar-cycle-25-is-here-nasa-noaa-scientists-explain-what-that-means/',
    flares: [], // mínimo solar (diciembre de 2019): sin llamaradas de clase M o X esa semana
  },
  {
    id: 'sep-2017',
    startDate: '2017-09-04',
    endDate: '2017-09-10',
    verifiedAgainstDonki: false,
    reference: 'https://svs.gsfc.nasa.gov/12706',
    flares: [
      { peakTime: '2017-09-04T20:33:00Z', classType: 'M5.5', activeRegion: 12673, sep: true },
      { peakTime: '2017-09-06T09:10:00Z', classType: 'X2.2', activeRegion: 12673, sep: false },
      { peakTime: '2017-09-06T12:02:00Z', classType: 'X9.3', activeRegion: 12673, sep: false },
      { peakTime: '2017-09-07T14:36:00Z', classType: 'X1.3', activeRegion: 12673, sep: false },
      { peakTime: '2017-09-08T07:49:00Z', classType: 'M8.1', activeRegion: 12673, sep: false },
      { peakTime: '2017-09-10T16:06:00Z', classType: 'X8.2', activeRegion: 12673, sep: true },
    ],
  },
  {
    id: 'may-2024',
    startDate: '2024-05-08',
    endDate: '2024-05-14',
    verifiedAgainstDonki: false,
    reference: 'https://science.nasa.gov/science-research/heliophysics/how-nasa-tracked-the-most-intense-solar-storm-in-decades/',
    flares: [
      { peakTime: '2024-05-08T21:40:00Z', classType: 'X1.0', activeRegion: 13664, sep: false },
      { peakTime: '2024-05-09T09:13:00Z', classType: 'X2.2', activeRegion: 13664, sep: false },
      { peakTime: '2024-05-09T17:44:00Z', classType: 'X1.1', activeRegion: 13664, sep: false },
      { peakTime: '2024-05-10T06:54:00Z', classType: 'X3.9', activeRegion: 13664, sep: false },
      { peakTime: '2024-05-11T01:23:00Z', classType: 'X5.8', activeRegion: 13664, sep: false },
      { peakTime: '2024-05-11T11:44:00Z', classType: 'X1.5', activeRegion: 13664, sep: false },
      { peakTime: '2024-05-12T16:26:00Z', classType: 'X1.0', activeRegion: 13664, sep: false },
      { peakTime: '2024-05-14T16:51:00Z', classType: 'X8.7', activeRegion: 13664, sep: false },
    ],
  },
  {
    id: 'oct-2024',
    startDate: '2024-09-29',
    endDate: '2024-10-05',
    verifiedAgainstDonki: false,
    reference: 'https://science.nasa.gov/blogs/solar-cycle-25/2024/10/03/sun-releases-strong-solar-flare-6/',
    flares: [
      { peakTime: '2024-10-01T22:20:00Z', classType: 'X7.1', activeRegion: 13842, sep: false },
      { peakTime: '2024-10-03T12:18:00Z', classType: 'X9.0', activeRegion: 13842, sep: false },
    ],
  },
];
