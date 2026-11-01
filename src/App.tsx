import { useEffect } from 'react';
import MapView from './components/MapView';
import Globe from './components/GlobeView';
import TopBar from './components/hud/TopBar';
import AgentPanel from './components/hud/AgentPanel';
import DetailCard from './components/hud/DetailCard';
import Filters from './components/hud/Filters';
import StatsPanel from './components/hud/StatsPanel';
import EventFeed from './components/hud/EventFeed';
import Dock from './components/hud/Dock';
import ViewSelector from './components/hud/ViewSelector';
import GlitchFX from './components/fx/GlitchFX';
import RawStream from './components/fx/RawStream';
import { engine } from './sim/engine';
import { useEngine } from './sim/useEngine';
import { installGlobalBridge, attachPostMessageBridge } from './sim/connectors';

export default function App() {
  const snap = useEngine();
  useEffect(() => {
    engine.start();
    installGlobalBridge();
    const detach = attachPostMessageBridge();
    return () => { engine.stop(); detach(); };
  }, []);

  const Stage = snap.viewMode === 'globe' ? Globe : MapView;

  return (
    <div className={`shell ${snap.panelMode}`}>
      <Stage />
      <RawStream />
      <GlitchFX />
      <TopBar />
      <ViewSelector />
      <div className="col-l">
        <AgentPanel />
        <DetailCard />
        <Filters />
      </div>
      <div className="col-r">
        <StatsPanel />
        <EventFeed />
      </div>
      <Dock />
    </div>
  );
}
