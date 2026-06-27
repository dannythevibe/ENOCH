import { roadNodes, roadEdges } from './mock-data';

export interface RoutePath {
  coordinates: [number, number][]; // [lng, lat] pairs for MapLibre/Google Map
  distance: number; // total distance in meters
  directions: string[]; // text instructions
}

// Distance calculator using Haversine formula
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Find closest node ID in graph to a given coordinate
export function findClosestNode(lat: number, lng: number): string {
  let closestId = roadNodes[0].id;
  let minDistance = getDistance(lat, lng, roadNodes[0].lat, roadNodes[0].lng);

  for (let i = 1; i < roadNodes.length; i++) {
    const dist = getDistance(lat, lng, roadNodes[i].lat, roadNodes[i].lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestId = roadNodes[i].id;
    }
  }

  return closestId;
}

// Calculate the step directions based on street names of segments traversed
function generateDirections(path: string[]): string[] {
  const directions: string[] = [];
  if (path.length < 2) return ['Arrived at destination.'];

  let currentStreet = '';

  for (let i = 0; i < path.length - 1; i++) {
    const fromId = path[i];
    const toId = path[i + 1];

    // Find edge matching fromId and toId
    const edge = roadEdges.find(
      (e) =>
        (e.from === fromId && e.to === toId) ||
        (e.from === toId && e.to === fromId)
    );

    const fromNode = roadNodes.find((n) => n.id === fromId);
    const toNode = roadNodes.find((n) => n.id === toId);
    const fromName = fromNode ? fromNode.name : 'Unknown';
    const toName = toNode ? toNode.name : 'Unknown';
    const street = edge ? edge.streetName : 'Walkway';

    if (i === 0) {
      directions.push(`Start walking from your position towards ${toName} on ${street}.`);
      currentStreet = street;
    } else {
      if (street !== currentStreet) {
        directions.push(`Turn onto ${street} and proceed towards ${toName}.`);
        currentStreet = street;
      } else {
        directions.push(`Continue on ${street} past ${fromName} towards ${toName}.`);
      }
    }
  }

  directions.push(`Arrived at your destination.`);
  return directions;
}

export function computeRoute(
  startLat: number,
  startLng: number,
  destId: string
): RoutePath {
  // If destination doesn't exist, return straight line fallback
  const destNode = roadNodes.find((n) => n.id === destId);
  if (!destNode) {
    return {
      coordinates: [
        [startLng, startLat],
        [startLng, startLat],
      ],
      distance: 0,
      directions: ['Select a valid destination to begin routing.'],
    };
  }

  // Find closest node to start location to enter the graph
  const startNodeId = findClosestNode(startLat, startLng);

  // Build Adjacency List for Dijkstra
  const graph: { [key: string]: { node: string; weight: number }[] } = {};
  for (const node of roadNodes) {
    graph[node.id] = [];
  }

  for (const edge of roadEdges) {
    const fromNode = roadNodes.find((n) => n.id === edge.from);
    const toNode = roadNodes.find((n) => n.id === edge.to);

    if (fromNode && toNode) {
      const weight = getDistance(fromNode.lat, fromNode.lng, toNode.lat, toNode.lng);
      graph[edge.from].push({ node: edge.to, weight });
      graph[edge.to].push({ node: edge.from, weight }); // Bidirectional
    }
  }

  // Dijkstra's algorithm initialization
  const distances: { [key: string]: number } = {};
  const previous: { [key: string]: string | null } = {};
  const queue = new Set<string>();

  for (const node of roadNodes) {
    distances[node.id] = Infinity;
    previous[node.id] = null;
    queue.add(node.id);
  }

  distances[startNodeId] = 0;

  while (queue.size > 0) {
    // Find node in queue with shortest distance
    let minNodeId: string | null = null;
    let minDistance = Infinity;

    for (const nodeId of queue) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        minNodeId = nodeId;
      }
    }

    if (minNodeId === null || minNodeId === destId) {
      break;
    }

    queue.delete(minNodeId);

    // Update neighbors
    for (const neighbor of graph[minNodeId]) {
      if (!queue.has(neighbor.node)) continue;
      const alt = distances[minNodeId] + neighbor.weight;
      if (alt < distances[neighbor.node]) {
        distances[neighbor.node] = alt;
        previous[neighbor.node] = minNodeId;
      }
    }
  }

  // Reconstruct path
  const pathNodes: string[] = [];
  let curr: string | null = destId;
  while (curr !== null) {
    pathNodes.unshift(curr);
    curr = previous[curr];
  }

  // If path is disconnected or start node couldn't reach destination node, return straight line fallback
  if (pathNodes[0] !== startNodeId) {
    const dist = getDistance(startLat, startLng, destNode.lat, destNode.lng);
    return {
      coordinates: [
        [startLng, startLat],
        [destNode.lng, destNode.lat],
      ],
      distance: dist,
      directions: [
        `Walk straight from your position to ${destNode.name} (${dist}m).`,
      ],
    };
  }

  // Build route path coordinates
  const coordinates: [number, number][] = [];
  
  // Prepend actual start position (if it is distinct from the closest entry graph node)
  const firstNode = roadNodes.find((n) => n.id === startNodeId);
  if (firstNode) {
    const distFromStart = getDistance(startLat, startLng, firstNode.lat, firstNode.lng);
    if (distFromStart > 5 && distFromStart < 150) {
      coordinates.push([startLng, startLat]);
    }
  }

  for (const nodeId of pathNodes) {
    const node = roadNodes.find((n) => n.id === nodeId);
    if (node) {
      coordinates.push([node.lng, node.lat]);
    }
  }

  const distance = distances[destId];
  const directions = generateDirections(pathNodes);

  return {
    coordinates,
    distance,
    directions,
  };
}
