export interface Camera {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    street: string;
  };
  status: 'online' | 'offline' | 'maintenance';
  streamUrl: string; // URL to the camera stream
  coverageArea?: string;
}

// Mock camera data - using public live traffic cameras for demo
export const mockCameras: Camera[] = [
  {
    id: 'cam-001',
    name: 'Camera 1 - Central Square',
    location: {
      lat: 45.7535,
      lng: 21.2254,
      street: 'Piața Victoriei'
    },
    status: 'online',
    // Public traffic camera stream from EarthCam (Times Square)
    streamUrl: 'https://www.youtube.com/embed/z7SiAaN4ogw?si=hI_tDZF4nJ7STXxo',
    coverageArea: 'Central parking area'
  },
  {
    id: 'cam-002',
    name: 'Camera 2 - North District',
    location: {
      lat: 45.7376,
      lng: 21.2347,
      street: 'Bulevardul Liviu Rebreanu'
    },
    status: 'online',
    // Tokyo street view live stream
    streamUrl: 'https://www.youtube.com/embed/z7SiAaN4ogw?si=hI_tDZF4nJ7STXxo',
    coverageArea: 'South parking zone'
  },
  {
    id: 'cam-003',
    name: 'Camera 3 - City Center',
    location: {
      lat: 45.7513,
      lng: 21.2246,
      street: 'Bulevardul Regele Ferdinand I'
    },
    status: 'online',
    // London traffic camera
    streamUrl: 'https://www.youtube.com/embed/z7SiAaN4ogw?si=hI_tDZF4nJ7STXxo',
    coverageArea: 'Downtown area'
  },
  {
    id: 'cam-004',
    name: 'Camera 4 - South Gate',
    location: {
      lat: 45.7286,
      lng: 21.2055,

      street: 'Calea Șagului'
    },
    status: 'online',
    // Paris traffic camera
    streamUrl: 'https://www.youtube.com/embed/z7SiAaN4ogw?si=hI_tDZF4nJ7STXxo',
    coverageArea: 'South entrance'
  },
  {
    id: 'cam-005',
    name: 'Camera 5 - East Side',
    location: {
      lat: 45.7491,
      lng: 21.2352,
      street: 'Strada Michelangelo'
    },
    status: 'offline',
    streamUrl: '',
    coverageArea: 'Eastern district'
  }
];
