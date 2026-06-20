export const landmarks = [
  // Major Infrastructure & Gates
  { id: 'city-gate', name: 'Redemption City Main Gate', lat: 6.8270, lng: 3.4660 },
  { id: 'secretariat', name: 'RCCG National Secretariat', lat: 6.8085, lng: 3.4565 },
  
  // Auditoriums & Worship Centers
  { id: 'altar', name: 'The Main Altar', lat: 6.8180, lng: 3.4630 },
  { id: 'auditorium', name: 'Old Auditorium', lat: 6.8175, lng: 3.4620 },
  { id: 'new-auditorium', name: 'New Auditorium (The Arena)', lat: 6.8067, lng: 3.4548 },
  { id: 'youth', name: 'National Youth Centre', lat: 6.8264, lng: 3.4662 },
  { id: 'teenagers', name: 'National Teenagers Church', lat: 6.8120, lng: 3.4551 },
  
  // Medical Facilities
  { id: 'rhc', name: "Redeemer's Health Centre", lat: 6.8240, lng: 3.4640 },
  { id: 'rhv', name: "Redeemer's Health Village (RHV)", lat: 6.8150, lng: 3.4600 },
  
  // Education
  { id: 'run-old', name: "Redeemer's University (Old Campus)", lat: 6.8220, lng: 3.4610 },
  { id: 'bible-college', name: 'Redeemed Christian Bible College', lat: 6.8195, lng: 3.4580 },

  // Accommodations, CRM & Chalets
  { id: 'bethel', name: 'Bethel Guest House & Suites', lat: 6.8250, lng: 3.4650 },
  { id: 'intl-guest', name: 'International Guest House', lat: 6.8235, lng: 3.4635 },
  { id: 'africa-missions', name: 'Africa Missions Guest House', lat: 6.8210, lng: 3.4625 },
  { id: 'crm-guest', name: 'CRM Guest House', lat: 6.8190, lng: 3.4615 },
  { id: 'shiloh', name: 'Shiloh Apartments', lat: 6.8160, lng: 3.4590 },
  { id: 'joy', name: 'Joy to the Wise Apartments', lat: 6.8145, lng: 3.4585 },
  { id: 'white-house', name: 'White House Suites', lat: 6.8130, lng: 3.4570 },
  { id: 'comfort', name: 'Comfort Palace', lat: 6.8115, lng: 3.4560 },
  { id: 'overflow', name: 'Overflow Chalets', lat: 6.8090, lng: 3.4545 },
  { id: 'dove', name: 'Dove Guest House', lat: 6.8075, lng: 3.4530 },
  
  // Lodging Halls
  { id: 'hall1', name: 'Hall 1 Lodging', lat: 6.8200, lng: 3.4650 },
  { id: 'hall2', name: 'Hall 2 Lodging', lat: 6.8205, lng: 3.4652 },
  { id: 'hall3', name: 'Hall 3 Lodging', lat: 6.8210, lng: 3.4655 },
  { id: 'hall4', name: 'Hall 4 Lodging', lat: 6.8215, lng: 3.4658 },
];

export const mockDevices = [
  { id: 'iphone15', name: 'iPhone 15 Pro', rssi: -45, lastSeen: '2 mins ago', location: 'Old Auditorium, Row 14, Pillar 4B' },
  { id: 'keys', name: 'Keys Tile', rssi: -72, lastSeen: 'Just now', location: 'Youth Centre, Near entrance' },
  { id: 'airpods', name: 'AirPods Case', rssi: -88, lastSeen: '1 hr ago', location: 'Hall 2 Lodging' },
];

export const generateMockMetrics = () => {
  return {
    battery: Math.floor(Math.random() * (85 - 40 + 1) + 40),
    syncTime: '< 2 min',
    peers: Math.floor(Math.random() * (12 - 3 + 1) + 3),
  };
};
