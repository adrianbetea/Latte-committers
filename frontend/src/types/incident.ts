export interface Incident {
  id: string;
  plateNumber: string;
  location: {
    lat: number;
    lng: number;
    street: string;
    district: string;
  };
  violationStart: Date;
  duration: number; // in minutes
  status: 'new' | 'reviewing' | 'confirmed' | 'dismissed';
  images: {
    fullCar: string;
    licensePlate: string;
  };
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export const mockIncidents: Incident[] = [
  {
    id: '1',
    plateNumber: 'TM-01-ABC',
    location: {
      lat: 45.7489,
      lng: 21.2087,
      street: 'Bulevardul Revoluției din 1989',
      district: 'Centru',
    },
    violationStart: new Date(Date.now() - 45 * 60000),
    duration: 45,
    status: 'new',
    images: {
      fullCar: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800',
      licensePlate: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400',
    },
  },
  {
    id: '2',
    plateNumber: 'TM-42-XYZ',
    location: {
      lat: 45.7537,
      lng: 21.2257,
      street: 'Strada Eminescu',
      district: 'Centru',
    },
    violationStart: new Date(Date.now() - 32 * 60000),
    duration: 32,
    status: 'new',
    images: {
      fullCar: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
      licensePlate: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400',
    },
  },
  {
    id: '3',
    plateNumber: 'TM-15-DEF',
    location: {
      lat: 45.7564,
      lng: 21.2302,
      street: 'Piața Victoriei',
      district: 'Cetate',
    },
    violationStart: new Date(Date.now() - 28 * 60000),
    duration: 28,
    status: 'new',
    images: {
      fullCar: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',
      licensePlate: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400',
    },
  },
  {
    id: '4',
    plateNumber: 'TM-88-GHI',
    location: {
      lat: 45.7441,
      lng: 21.2191,
      street: 'Strada Alba Iulia',
      district: 'Fabric',
    },
    violationStart: new Date(Date.now() - 18 * 60000),
    duration: 18,
    status: 'new',
    images: {
      fullCar: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
      licensePlate: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400',
    },
  },
  {
    id: '5',
    plateNumber: 'TM-23-JKL',
    location: {
      lat: 45.7512,
      lng: 21.2145,
      street: 'Bulevardul Liviu Rebreanu',
      district: 'Iosefin',
    },
    violationStart: new Date(Date.now() - 12 * 60000),
    duration: 12,
    status: 'new',
    images: {
      fullCar: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800',
      licensePlate: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400',
    },
  },
];
