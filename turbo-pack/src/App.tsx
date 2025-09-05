import { useState, useEffect } from 'react'
import './App.css'
import AppContext from './context/AppContext'
import type { AgentSuggestion } from './agents/AgentTypes'

function App() {
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([])
  const [selectedTab, setSelectedTab] = useState<'status' | 'mo' | 'atlas' | 'moderation' | 'breadcrumbs'>('status')

  useEffect(() => {
    // Update system status periodically
    const updateStatus = () => {
      setSystemStatus(AppContext.getSystemStatus())
    }

    updateStatus()
    const interval = setInterval(updateStatus, 2000)

    // Listen for agent suggestions
    const unsubscribe = AppContext.agentContext.eventBus.on('agents/suggestions', (payload) => {
      setSuggestions(payload.suggestions || [])
    })

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [])

  const handleFeedMo = () => {
    AppContext.mo.feed()
  }

  const handleMoAction = (action: string) => {
    AppContext.mo.performAction(action)
  }

  const handleExecuteSuggestion = (suggestion: AgentSuggestion) => {
    if (suggestion.action) {
      suggestion.action()
    }
  }

  if (!systemStatus) {
    return <div className="loading">Initializing BigMode Turbo Pack...</div>
  }

  return (
    <div className="bigmode-app">
      <header className="app-header">
        <h1>🛸 BigMode Turbo Pack</h1>
        <p>Unified Remix App - UFO ⇄ Dragon Mo ⇄ Agents ⇄ Atlas ⇄ Portals ⇄ Babelfish ⇄ Moderation</p>
      </header>

      <nav className="tab-nav">
        {(['status', 'mo', 'atlas', 'moderation', 'breadcrumbs'] as const).map(tab => (
          <button
            key={tab}
            className={`tab ${selectedTab === tab ? 'active' : ''}`}
            onClick={() => setSelectedTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <div className="content">
        {selectedTab === 'status' && (
          <div className="status-panel">
            <h2>System Status</h2>
            <div className="status-grid">
              <div className="status-card">
                <h3>Mo (Pet/Agent Hybrid)</h3>
                <p>Mode: {systemStatus.mo.mode}</p>
                <p>Energy: {systemStatus.mo.energy}/100</p>
                <p>Mood: {systemStatus.mo.mood}</p>
                {systemStatus.mo.possessedBy && (
                  <p>Possessed by: {systemStatus.mo.possessedBy}</p>
                )}
              </div>
              
              <div className="status-card">
                <h3>Agents</h3>
                <ul>
                  {systemStatus.agents.map((agent: any) => (
                    <li key={agent.id}>
                      {agent.label} ({agent.personality})
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="status-card">
                <h3>Atlas</h3>
                <p>Tiles: {systemStatus.atlas.totalTiles}</p>
                <p>Connections: {systemStatus.atlas.totalConnections}</p>
                <p>Dangling: {systemStatus.atlas.danglingTiles}</p>
              </div>
              
              <div className="status-card">
                <h3>Moderation</h3>
                <p>Total Flags: {systemStatus.moderation.totalFlags}</p>
                <p>Actions: {systemStatus.moderation.totalActions}</p>
                <p>Avg Severity: {systemStatus.moderation.averageSeverity.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'mo' && (
          <div className="mo-panel">
            <h2>Mo Control Panel</h2>
            <div className="mo-status">
              <div className="mo-avatar">
                🐉 {systemStatus.mo.possessedBy && '✨'}
              </div>
              <div className="mo-info">
                <p><strong>Energy:</strong> {systemStatus.mo.energy}/100</p>
                <p><strong>Mood:</strong> {systemStatus.mo.mood}</p>
                <p><strong>Mode:</strong> {systemStatus.mo.mode}</p>
                {systemStatus.mo.possessedBy && (
                  <p><strong>Possessed by:</strong> {systemStatus.mo.possessedBy}</p>
                )}
              </div>
            </div>
            <div className="mo-controls">
              <button onClick={handleFeedMo}>Feed Mo</button>
              <button onClick={() => handleMoAction('dance')}>Make Dance</button>
              <button onClick={() => handleMoAction('explore')}>Explore</button>
              <button onClick={() => handleMoAction('sleep')}>Sleep</button>
            </div>
          </div>
        )}

        {selectedTab === 'atlas' && (
          <div className="atlas-panel">
            <h2>Atlas Overview</h2>
            <div className="atlas-stats">
              <p>Total Tiles: {systemStatus.atlas.totalTiles}</p>
              <p>Total Connections: {systemStatus.atlas.totalConnections}</p>
              <p>Dangling Tiles: {systemStatus.atlas.danglingTiles}</p>
              <p>Connected Components: {systemStatus.atlas.connectedComponents}</p>
              <p>Average Connections per Tile: {systemStatus.atlas.averageConnections.toFixed(2)}</p>
            </div>
            <button onClick={() => {
              AppContext.agentContext.atlas.connections.addTile(
                `Tile ${Date.now()}`,
                'demo',
                Math.random() * 100,
                Math.random() * 100,
                { isPrime: Math.random() > 0.8 }
              )
            }}>
              Add Demo Tile
            </button>
          </div>
        )}

        {selectedTab === 'moderation' && (
          <div className="moderation-panel">
            <h2>Moderation Overview</h2>
            <div className="moderation-stats">
              <p>Total Flags: {systemStatus.moderation.totalFlags}</p>
              <p>Total Actions: {systemStatus.moderation.totalActions}</p>
              <p>Average Severity: {systemStatus.moderation.averageSeverity.toFixed(2)}</p>
            </div>
            <button onClick={() => {
              AppContext.agentContext.eventBus.emit('moderation/test', {
                content: 'Test content for moderation',
                severity: Math.random()
              })
            }}>
              Test Moderation Event
            </button>
          </div>
        )}

        {selectedTab === 'breadcrumbs' && (
          <div className="breadcrumbs-panel">
            <h2>Breadcrumbs (Recent Activity)</h2>
            <div className="breadcrumbs-list">
              {AppContext.agentContext.breadcrumbs.getRecent(10).reverse().map(crumb => (
                <div key={crumb.id} className={`breadcrumb ${crumb.level}`}>
                  <div className="breadcrumb-header">
                    <span className="timestamp">
                      {new Date(crumb.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="agent">{crumb.agent || 'system'}</span>
                    <span className="level">{crumb.level}</span>
                  </div>
                  <div className="breadcrumb-message">{crumb.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="suggestions-panel">
          <h3>Agent Suggestions</h3>
          {suggestions.slice(0, 3).map(suggestion => (
            <div key={suggestion.id} className="suggestion">
              <div className="suggestion-content">
                <strong>{suggestion.summary}</strong>
                {suggestion.detail && <p>{suggestion.detail}</p>}
                <div className="suggestion-meta">
                  Priority: {suggestion.priority} | Tags: {suggestion.tags?.join(', ')}
                </div>
              </div>
              {suggestion.action && (
                <button onClick={() => handleExecuteSuggestion(suggestion)}>
                  Execute
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
