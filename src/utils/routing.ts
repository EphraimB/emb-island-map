export interface Point {
  x: number;
  y: number;
  description?: string;
}

export interface Road {
  id: string;
  name: string;
  type?: string;
  points: Point[];
}

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  roadId: string;
  pointIndex: number;
  description?: string;
  neighbors: string[];
}

export function buildGraph(roads: Road[]): Record<string, GraphNode> {
  const nodes: Record<string, GraphNode> = {};
  
  // 1. Add all points as nodes
  roads.forEach(road => {
    road.points.forEach((pt, idx) => {
      const id = `${road.id}-${idx}`;
      nodes[id] = {
        id,
        x: pt.x,
        y: pt.y,
        roadId: road.id,
        pointIndex: idx,
        description: pt.description,
        neighbors: []
      };
    });
  });

  const nodeKeys = Object.keys(nodes);

  // 2. Connect sequential points within the same road
  roads.forEach(road => {
    for (let i = 0; i < road.points.length; i++) {
      const currentId = `${road.id}-${i}`;
      if (i > 0) {
        const prevId = `${road.id}-${i - 1}`;
        nodes[currentId].neighbors.push(prevId);
      }
      if (i < road.points.length - 1) {
        const nextId = `${road.id}-${i + 1}`;
        nodes[currentId].neighbors.push(nextId);
      }
    }
  });

  // 3. Connect nodes across different roads if they are geographically overlapping (intersection points)
  // Distance threshold: e.g. 150 units in the 4032x3024 scale (about 4% of a tile width)
  const threshold = 200;
  for (let i = 0; i < nodeKeys.length; i++) {
    for (let j = i + 1; j < nodeKeys.length; j++) {
      const n1 = nodes[nodeKeys[i]];
      const n2 = nodes[nodeKeys[j]];
      if (n1.roadId !== n2.roadId) {
        const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
        if (dist <= threshold) {
          n1.neighbors.push(n2.id);
          n2.neighbors.push(n1.id);
        }
      }
    }
  }

  return nodes;
}

export function findShortestPath(
  roads: Road[], 
  startX: number, 
  startY: number, 
  endX: number, 
  endY: number
): GraphNode[] {
  const graph = buildGraph(roads);
  const keys = Object.keys(graph);
  if (keys.length === 0) return [];

  // Find closest start node
  let startNodeId = '';
  let minStartDist = Infinity;
  // Find closest end node
  let endNodeId = '';
  let minEndDist = Infinity;

  keys.forEach(id => {
    const node = graph[id];
    const dStart = Math.hypot(node.x - startX, node.y - startY);
    if (dStart < minStartDist) {
      minStartDist = dStart;
      startNodeId = id;
    }
    const dEnd = Math.hypot(node.x - endX, node.y - endY);
    if (dEnd < minEndDist) {
      minEndDist = dEnd;
      endNodeId = id;
    }
  });

  if (!startNodeId || !endNodeId) return [];

  // Dijkstra's algorithm
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const queue: string[] = [];

  keys.forEach(id => {
    distances[id] = Infinity;
    previous[id] = null;
    queue.push(id);
  });
  distances[startNodeId] = 0;

  while (queue.length > 0) {
    // Find node with minimum distance in queue
    queue.sort((a, b) => distances[a] - distances[b]);
    const currentId = queue.shift()!;

    if (currentId === endNodeId) break;
    if (distances[currentId] === Infinity) break;

    const current = graph[currentId];
    current.neighbors.forEach(neighborId => {
      if (!queue.includes(neighborId)) return;
      const neighbor = graph[neighborId];
      const edgeWeight = Math.hypot(current.x - neighbor.x, current.y - neighbor.y);
      const alt = distances[currentId] + edgeWeight;
      
      if (alt < distances[neighborId]) {
        distances[neighborId] = alt;
        previous[neighborId] = currentId;
      }
    });
  }

  // Reconstruct path
  const path: GraphNode[] = [];
  let u: string | null = endNodeId;
  while (u !== null) {
    path.unshift(graph[u]);
    u = previous[u];
  }

  // If path is disconnected
  if (path[0]?.id !== startNodeId) return [];

  return path;
}

// Generate simple directions list based on path nodes
export interface DirectionStep {
  instruction: string;
  x: number;
  y: number;
  type: 'start' | 'straight' | 'turn-left' | 'turn-right' | 'arrive';
}

export function generateDirections(path: GraphNode[], landmarks: any[]): DirectionStep[] {
  if (path.length === 0) return [];
  
  const steps: DirectionStep[] = [];
  
  // Step 1: Start point
  const startNode = path[0];
  const startLandmark = landmarks.find(l => Math.hypot(l.x - startNode.x, l.y - startNode.y) < 150);
  steps.push({
    instruction: startLandmark 
      ? `Start your journey at ${startLandmark.name}`
      : `Start your journey on the road`,
    x: startNode.x,
    y: startNode.y,
    type: 'start'
  });

  // Intermediate steps
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const next = path[i + 1];

    // Check if the current node represents a landmark
    const landmark = landmarks.find(l => Math.hypot(l.x - curr.x, l.y - curr.y) < 150);

    // Calculate angles to detect turning
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);
    let diff = angle2 - angle1;

    // Normalize diff to [-PI, PI]
    while (diff < -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;

    // Threshold for turning (e.g. 45 degrees / 0.78 radians)
    let type: 'straight' | 'turn-left' | 'turn-right' = 'straight';
    let turnText = '';
    
    if (diff > 0.6) {
      type = 'turn-right';
      turnText = 'turn right';
    } else if (diff < -0.6) {
      type = 'turn-left';
      turnText = 'turn left';
    }

    // Determine instruction text
    let instruction = '';
    if (landmark) {
      if (type !== 'straight') {
        instruction = `At ${landmark.name}, ${turnText}`;
      } else {
        instruction = `Pass by ${landmark.name}`;
      }
    } else if (curr.description) {
      instruction = curr.description;
    } else if (type !== 'straight') {
      instruction = `Make a ${turnText === 'turn right' ? 'right turn' : 'left turn'}`;
    }

    if (instruction) {
      steps.push({
        instruction,
        x: curr.x,
        y: curr.y,
        type
      });
    }
  }

  // Final step: Arrive
  const endNode = path[path.length - 1];
  const endLandmark = landmarks.find(l => Math.hypot(l.x - endNode.x, l.y - endNode.y) < 150);
  steps.push({
    instruction: endLandmark 
      ? `Arrive at your destination: ${endLandmark.name}`
      : `Arrive at your destination`,
    x: endNode.x,
    y: endNode.y,
    type: 'arrive'
  });

  return steps;
}
