import { v4 as uuidv4 } from 'uuid';

interface Connection {
  id: string;
  from: string;
  to: string;
  tags?: string[];
  createdAt: number;
  createdBy?: string;
  weight?: number; // Connection strength
}

interface TileMetadata {
  isPrime?: boolean;
  isPalindrome?: boolean;
  colorBinding?: string;
  semanticTags?: string[];
}

interface AtlasTile {
  id: string;
  name: string;
  type: string;
  metadata: TileMetadata;
  x: number;
  y: number;
  createdAt: number;
  lastModified: number;
}

/**
 * ConnectionsGraph - Manages connections between Atlas tiles
 */
export class ConnectionsGraph {
  private edges: Connection[] = [];
  private tiles: Map<string, AtlasTile> = new Map();

  /**
   * Add a new connection between tiles
   */
  addConnection(from: string, to: string, tags?: string[], createdBy?: string, weight: number = 1): Connection {
    const connection: Connection = {
      id: uuidv4(),
      from,
      to,
      tags,
      createdAt: Date.now(),
      createdBy,
      weight
    };
    
    this.edges.push(connection);
    return connection;
  }

  /**
   * Remove a connection
   */
  removeConnection(connectionId: string): boolean {
    const index = this.edges.findIndex(e => e.id === connectionId);
    if (index !== -1) {
      this.edges.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Add a tile to the Atlas
   */
  addTile(name: string, type: string, x: number = 0, y: number = 0, metadata: TileMetadata = {}): AtlasTile {
    const tile: AtlasTile = {
      id: uuidv4(),
      name,
      type,
      metadata,
      x,
      y,
      createdAt: Date.now(),
      lastModified: Date.now()
    };
    
    this.tiles.set(tile.id, tile);
    return tile;
  }

  /**
   * Update tile metadata
   */
  updateTile(tileId: string, updates: Partial<AtlasTile>): boolean {
    const tile = this.tiles.get(tileId);
    if (tile) {
      Object.assign(tile, updates, { lastModified: Date.now() });
      return true;
    }
    return false;
  }

  /**
   * Remove a tile and all its connections
   */
  removeTile(tileId: string): boolean {
    const removed = this.tiles.delete(tileId);
    if (removed) {
      // Remove all connections involving this tile
      this.edges = this.edges.filter(e => e.from !== tileId && e.to !== tileId);
    }
    return removed;
  }

  /**
   * Get all tiles
   */
  getAllTiles(): AtlasTile[] {
    return Array.from(this.tiles.values());
  }

  /**
   * Get a specific tile
   */
  getTile(tileId: string): AtlasTile | undefined {
    return this.tiles.get(tileId);
  }

  /**
   * Get all connections
   */
  getAllConnections(): Connection[] {
    return [...this.edges];
  }

  /**
   * Find connections involving a specific tile
   */
  getConnectionsForTile(tileId: string): Connection[] {
    return this.edges.filter(e => e.from === tileId || e.to === tileId);
  }

  /**
   * Find tiles that have no connections (dangling)
   */
  getDanglingTiles(): AtlasTile[] {
    const connectedTileIds = new Set<string>();
    this.edges.forEach(e => {
      connectedTileIds.add(e.from);
      connectedTileIds.add(e.to);
    });
    
    return Array.from(this.tiles.values()).filter(tile => 
      !connectedTileIds.has(tile.id)
    );
  }

  /**
   * Find strongly connected components
   */
  getConnectedComponents(): AtlasTile[][] {
    const visited = new Set<string>();
    const components: AtlasTile[][] = [];
    
    const dfs = (tileId: string, component: AtlasTile[]) => {
      if (visited.has(tileId)) return;
      
      visited.add(tileId);
      const tile = this.tiles.get(tileId);
      if (tile) {
        component.push(tile);
        
        // Find connected tiles
        const connections = this.getConnectionsForTile(tileId);
        connections.forEach(conn => {
          const nextTileId = conn.from === tileId ? conn.to : conn.from;
          dfs(nextTileId, component);
        });
      }
    };
    
    this.tiles.forEach((_tile, tileId) => {
      if (!visited.has(tileId)) {
        const component: AtlasTile[] = [];
        dfs(tileId, component);
        if (component.length > 0) {
          components.push(component);
        }
      }
    });
    
    return components;
  }

  /**
   * Get tiles by type
   */
  getTilesByType(type: string): AtlasTile[] {
    return Array.from(this.tiles.values()).filter(tile => tile.type === type);
  }

  /**
   * Get tiles with specific metadata properties
   */
  getTilesByMetadata(filter: Partial<TileMetadata>): AtlasTile[] {
    return Array.from(this.tiles.values()).filter(tile => {
      return Object.entries(filter).every(([key, value]) => 
        (tile.metadata as any)[key] === value
      );
    });
  }

  /**
   * Search tiles by name
   */
  searchTiles(query: string): AtlasTile[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.tiles.values()).filter(tile =>
      tile.name.toLowerCase().includes(lowercaseQuery) ||
      tile.type.toLowerCase().includes(lowercaseQuery) ||
      tile.metadata.semanticTags?.some(tag => 
        tag.toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  /**
   * Export the entire graph as JSON
   */
  exportGraph(): string {
    return JSON.stringify({
      tiles: Array.from(this.tiles.values()),
      connections: this.edges,
      exportedAt: Date.now()
    }, null, 2);
  }

  /**
   * Import a graph from JSON
   */
  importGraph(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      // Clear existing data
      this.tiles.clear();
      this.edges = [];
      
      // Import tiles
      if (data.tiles && Array.isArray(data.tiles)) {
        data.tiles.forEach((tile: AtlasTile) => {
          this.tiles.set(tile.id, tile);
        });
      }
      
      // Import connections
      if (data.connections && Array.isArray(data.connections)) {
        this.edges = [...data.connections];
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import graph:', error);
      return false;
    }
  }

  /**
   * Get graph statistics
   */
  getStats() {
    const typeCount = Array.from(this.tiles.values()).reduce((acc, tile) => {
      acc[tile.type] = (acc[tile.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTiles: this.tiles.size,
      totalConnections: this.edges.length,
      danglingTiles: this.getDanglingTiles().length,
      connectedComponents: this.getConnectedComponents().length,
      typeDistribution: typeCount,
      averageConnections: this.tiles.size > 0 ? this.edges.length / this.tiles.size : 0
    };
  }
}

// Global Atlas instance
export const AtlasConnections = new ConnectionsGraph();