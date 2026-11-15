/**
  * Imágenes del Archivo científico. Las de la NASA son de dominio público (crédito: NASA y el centro o fotógrafo). Las de Chile son de Wikimedia Commons
  * con licencia libre: se muestra el autor y la licencia. Cada imagen enlaza a su página original.
  * Archivos en `public/game/archive/<clave>.jpg`. `chile-sky-alma` es la segunda foto de la ficha «El cielo de Chile».
  */
export interface ArchiveImage { credit: string; title: string; url: string; license: string; }
export const ARCHIVE_IMAGES: Record<string, ArchiveImage> = {
  'algae-oxygen': { credit: 'NASA / JSC · Nick Hague', title: 'Photobioreactor', url: 'https://images.nasa.gov/details/iss059e114346', license: 'NASA (dominio público)' },
  'artemis': { credit: 'NASA / JSC', title: 'Artemis I FD 17 Orion and a Crescent Moon', url: 'https://images.nasa.gov/details/Artemis%20I%20FD%2017%20Orion%20and%20a%20Crescent%20Moon', license: 'NASA (dominio público)' },
  'body-in-space': { credit: 'NASA / JSC · Andre Kuipers', title: 'Kuipers exercises on the ARED in the Node 3', url: 'https://images.nasa.gov/details/iss030e148403', license: 'NASA (dominio público)' },
  'chile-auroras': { credit: 'Mat Austro', title: 'Aurora Australis on Puerto Williams, Chile', url: 'https://commons.wikimedia.org/wiki/File:Aurora_Australis_on_Puerto_Williams,_Chile.jpg', license: 'CC BY 4.0' },
  'chile-sky': { credit: 'ESO/G. Hüdepohl (atacamaphoto.com)', title: 'Paranal and the Pacific at sunset (dsc4088, retouched, cropped)', url: 'https://commons.wikimedia.org/wiki/File:Paranal_and_the_Pacific_at_sunset_(dsc4088,_retouched,_cropped).jpg', license: 'CC BY 4.0' },
  'chile-sky-alma': { credit: 'ESO/B. Tafreshi (twanight.org)', title: 'ALMA antennas on Chajnantor', url: 'https://commons.wikimedia.org/wiki/File:ALMA_antennas_on_Chajnantor.jpg', license: 'CC BY 4.0' },
  'comm-delay': { credit: 'NASA/JPL-Caltech', title: 'A New Antenna for NASA\'s Deep Space Network', url: 'https://images.nasa.gov/details/PIA25136', license: 'NASA (dominio público)' },
  'donki': { credit: 'NASA / GSFC', title: 'CME Blow Out', url: 'https://images.nasa.gov/details/cme-blow-out_18529951894_o', license: 'NASA (dominio público)' },
  'exoplanets': { credit: 'NASA/Ames Research Center/Wendy Stenzel', title: 'Kepler-90 System Compared to Our Solar System (Artist\'s Concept)', url: 'https://images.nasa.gov/details/PIA22193', license: 'NASA (dominio público)' },
  'flare-classes': { credit: 'NASA / GSFC', title: 'Two X Flares in Quick Succession', url: 'https://images.nasa.gov/details/GSFC_20171208_Archive_e001050', license: 'NASA (dominio público)' },
  'guina': { credit: 'Mauro Tammone', title: 'Leopardus guigna', url: 'https://commons.wikimedia.org/wiki/File:Leopardus_guigna.jpeg', license: 'CC BY 3.0' },
  'kuiper': { credit: 'NASA/Johns Hopkins University Applied Physics Laboratory/Southwest Research Institute/Steve Gribben', title: 'New Horizons Encountering 2014 MU69 (Artist\'s Impression)', url: 'https://images.nasa.gov/details/PIA22190', license: 'NASA (dominio público)' },
  'lagrange': { credit: 'NASA / GSFC · NOAA', title: 'From a Million Miles Away, NASA Camera Shows Moon Crossing Face of Earth', url: 'https://images.nasa.gov/details/from-a-million-miles-away-nasa-camera-shows-moon-crossing-face-of-earth_20129140980_o', license: 'NASA (dominio público)' },
  'lunar-day': { credit: 'NASA / JSC', title: 'Panoramic view of Station 5 (Camelot Crater) during Apollo 17 EVA-2', url: 'https://images.nasa.gov/details/as17-145-22183', license: 'NASA (dominio público)' },
  'mars-gravity': { credit: 'NASA/JPL-Caltech/MSSS', title: 'Curiosity Low-Angle Self-Portrait at Buckskin Drilling Site on Mount Sharp', url: 'https://images.nasa.gov/details/PIA19807', license: 'NASA (dominio público)' },
  'mataveri': { credit: 'Dennis G. Jarvis', title: 'Chile-03721 - Mataveri International Airport (49073235787)', url: 'https://commons.wikimedia.org/wiki/File:Chile-03721_-_Mataveri_International_Airport_(49073235787).jpg', license: 'CC BY-SA 2.0' },
  'may-2024': { credit: 'NASA/University of Colorado/LASP', title: 'MAVEN Detects Auroras During Solar Storm in 2024', url: 'https://images.nasa.gov/details/PIA26304', license: 'NASA (dominio público)' },
  'moon-dust': { credit: 'NASA / JSC', title: 'Astronaut Eugene Cernan inside the lunar module on lunar surface after EVA', url: 'https://images.nasa.gov/details/AS17-145-22224', license: 'NASA (dominio público)' },
  'moon-gravity': { credit: 'NASA / JSC', title: 'Astronaut John Young leaps from lunar surface to salute flag', url: 'https://images.nasa.gov/details/as16-113-18339', license: 'NASA (dominio público)' },
  'moon-radiation': { credit: 'NASA / JSC', title: 'Astronaut Alan Bean deploys Lunar Surface Magnetometer on lunar surface', url: 'https://images.nasa.gov/details/as12-46-6813', license: 'NASA (dominio público)' },
  'oct-2024': { credit: 'NASA / GSFC', title: 'Giant Sunspot Erupts on October 24, 2014', url: 'https://images.nasa.gov/details/GSFC_20171208_Archive_e000920', license: 'NASA (dominio público)' },
  'osdr': { credit: 'NASA / JSC', title: 'Astronaut Nick Hague works on space biology research', url: 'https://images.nasa.gov/details/iss072e146315', license: 'NASA (dominio público)' },
  'perseverance': { credit: 'NASA/JPL-Caltech/MSSS', title: 'Perseverance\'s Selfie with Ingenuity', url: 'https://images.nasa.gov/details/PIA24542', license: 'NASA (dominio público)' },
  'plants-space': { credit: 'NASA / JSC · David Saint-Jacques', title: 'Veggie Ponds experiment Initiation', url: 'https://images.nasa.gov/details/iss059e035668', license: 'NASA (dominio público)' },
  'sep-2017': { credit: 'NASA/GSFC/Solar Dynamics Observatory', title: 'Major Solar Flare', url: 'https://images.nasa.gov/details/PIA21949', license: 'NASA (dominio público)' },
  'solar-min': { credit: 'NASA / JPL', title: 'Spotless Sun', url: 'https://images.nasa.gov/details/PIA21582', license: 'NASA (dominio público)' },
  'trappist': { credit: 'NASA/JPL-Caltech', title: 'Illustration of TRAPPIST-1 Planets as of Feb. 2018', url: 'https://images.nasa.gov/details/PIA22097', license: 'NASA (dominio público)' },
  'voyager': { credit: 'NASA/JPL', title: 'Artist Concept of Voyager', url: 'https://images.nasa.gov/details/PIA04495', license: 'NASA (dominio público)' },
  'water-shield': { credit: 'NASA / JSC', title: 'Personal Radiation Shielding Garment', url: 'https://images.nasa.gov/details/iss053e238888', license: 'NASA (dominio público)' },
  'webb': { credit: 'NASA / GSFC', title: 'James Webb Space Telescope Revealed', url: 'https://images.nasa.gov/details/GSFC_20171208_Archive_e000355', license: 'NASA (dominio público)' },
};
