import { useEffect, useState } from 'react';
import MapView from './components/MapView';
import Globe from './components/GlobeView';
import Ontology from './components/OntologyView';
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
import TargetProfile from './components/hud/TargetProfile';
import { engine } from './sim/engine';
import { V2 } from './theme';
import IconRail from './components/v2/IconRail';
import MasterIndex, { IndexTab } from './components/v2/MasterIndex';
import { useEngine } from './sim/useEngine';
import { installGlobalBridge, attachPostMessageBridge } from './sim/connectors';

export default function App() {
  const snap = useEngine();
  const [indexOpen, setIndexOpen] = useState(false);
  useEffect(() => {
    engine.start();
    installGlobalBridge();
    const detach = attachPostMessageBridge();
    return () => { engine.stop(); detach(); };
  }, []);

  const Stage = snap.viewMode === 'globe' ? Globe : snap.viewMode === 'ontology' ? Ontology : MapView;

  return (
    <div className={`shell ${snap.panelMode}`}>
      <Stage />
      {snap.selectedInstitution ? <TargetProfile /> : <RawStream />}
      {!V2 && <GlitchFX />}
      <TopBar />
      {!V2 && <ViewSelector />}
      {V2 && <IconRail onIndex={() => setIndexOpen(true)} />}
      {V2 && <IndexTab onOpen={() => setIndexOpen(true)} />}
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
      {V2 && <MasterIndex open={indexOpen} onClose={() => setIndexOpen(false)} />}
    </div>
  );
}
