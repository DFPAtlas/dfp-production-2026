'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Property, Tenancy, MaintenanceIssue, ComplianceItem, RentRecord, Document, ActivityEvent, AttentionItem, Insight, View } from './lib/types';
import { initialProperties, initialTenancies, initialMaintenance, initialCompliance, initialRent, initialDocuments, initialActivity, initialAttention, initialInsights } from './lib/data';
import { productConfigs } from '../components/shared/product-config';
import DemoControlBar from '../components/shared/DemoControlBar';
import DemoEntryOverlay from '../components/shared/DemoEntryOverlay';
import DemoGuidedTour from '../components/shared/DemoGuidedTour';
import DemoEnquiryPanel from '../components/shared/DemoEnquiryPanel';
import DemoCompletionOverlay from '../components/shared/DemoCompletionOverlay';
import DemoEnvironmentNotice from '../components/shared/DemoEnvironmentNotice';
import ExperienceSwitcher from '../components/shared/ExperienceSwitcher';
import ResetConfirmDialog from '../components/shared/ResetConfirmDialog';
import Sidebar from './components/Sidebar';
import OverviewView from './components/OverviewView';
import PropertiesView from './components/PropertiesView';
import TenanciesView from './components/TenanciesView';
import MaintenanceView from './components/MaintenanceView';
import ComplianceView from './components/ComplianceView';
import RentView from './components/RentView';
import DocumentsView from './components/DocumentsView';
import MessagesView from './components/MessagesView';
import AttentionRail from './components/AttentionRail';
import IntelligencePanel from './components/IntelligencePanel';
import ActivityTimeline from './components/ActivityTimeline';
import TenantPerspective from './components/TenantPerspective';
import MobileNav from './components/MobileNav';

const product = productConfigs['lethub-lettings-tour'];

export default function LetHubWorkspace() {
  const [entryVisible, setEntryVisible] = useState(true);
  const [activeView, setActiveView] = useState<View>('overview');
  const [perspective, setPerspective] = useState<'manager' | 'tenant'>('manager');
  const [tourStage, setTourStage] = useState(1);
  const [tourVisible, setTourVisible] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [completionVisible, setCompletionVisible] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [maintenance, setMaintenance] = useState<MaintenanceIssue[]>(initialMaintenance);
  const [compliance, setCompliance] = useState<ComplianceItem[]>(initialCompliance);
  const [rentRecords, setRentRecords] = useState<RentRecord[]>(initialRent);
  const [attention, setAttention] = useState<AttentionItem[]>(initialAttention);
  const [insights, setInsights] = useState<Insight[]>(initialInsights);
  const [activity, setActivity] = useState<ActivityEvent[]>(initialActivity);
  const [docs] = useState<Document[]>(initialDocuments);
  const [tenancies] = useState<Tenancy[]>(initialTenancies);

  const addActivity = useCallback((title: string, detail: string, property: string, type: ActivityEvent['type']) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setActivity((prev) => [{ id: `act-${Date.now()}`, time, title, detail, property, type }, ...prev]);
  }, []);

  const updateHealth = useCallback(() => {
    setProperties((prev) =>
      prev.map((p) => {
        const openRepairs = maintenance.filter((m) => m.propertyId === p.id && m.status !== 'Complete').length;
        const compIssues = compliance.filter((c) => c.propertyId === p.id && c.status !== 'Current').length;
        const rentIssue = rentRecords.some((r) => r.propertyId === p.id && r.status === 'Outstanding');
        const newHealth = Math.max(40, 95 - openRepairs * 8 - compIssues * 6 - (rentIssue ? 6 : 0));
        return { ...p, openRepairs, healthScore: Math.round(newHealth) };
      })
    );
  }, [maintenance, compliance, rentRecords]);

  useEffect(() => { updateHealth(); }, [maintenance, compliance, rentRecords, updateHealth]);

  const resetAll = () => {
    setProperties(initialProperties);
    setMaintenance(initialMaintenance);
    setCompliance(initialCompliance);
    setRentRecords(initialRent);
    setAttention(initialAttention);
    setInsights(initialInsights);
    setActivity(initialActivity);
    setActiveView('overview');
    setPerspective('manager');
    setTourStage(1);
    setTourVisible(false);
    setCompletionVisible(false);
  };

  const handleAssignContractor = (issueId: string, contractor: string, type: string) => {
    setMaintenance((prev) =>
      prev.map((m) => m.id === issueId ? { ...m, status: 'Assigned', contractor, contractorType: type, appointmentDate: 'Today', appointmentTime: '15:30' } : m)
    );
    addActivity('Contractor assigned', `${contractor} assigned to boiler repair`, '14 Oakfield Road', 'maintenance');
  };

  const handleCompleteRepair = (issueId: string) => {
    setMaintenance((prev) => prev.map((m) => (m.id === issueId ? { ...m, status: 'Complete' } : m)));
    setAttention((prev) => prev.filter((a) => !(a.type === 'maintenance' && a.property === '14 Oakfield Road')));
    addActivity('Repair completed', 'Boiler pressure issue resolved at 14 Oakfield Road', '14 Oakfield Road', 'maintenance');
  };

  const handleRenewCompliance = (itemId: string) => {
    setCompliance((prev) => prev.map((c) => c.id === itemId ? { ...c, status: 'Current', expiryDate: '22 Aug 2027' } : c));
    setAttention((prev) => prev.filter((a) => !(a.type === 'compliance' && a.property === '8 Milton Avenue')));
    addActivity('Compliance renewed', 'Gas safety certificate renewal recorded for 8 Milton Avenue', '8 Milton Avenue', 'compliance');
  };

  const handleRecordPayment = (rentId: string) => {
    setRentRecords((prev) => prev.map((r) => (r.id === rentId ? { ...r, status: 'Paid', paidDate: 'Today' } : r)));
    setAttention((prev) => prev.filter((a) => !(a.type === 'rent' && a.property === '22 Willow Close')));
    addActivity('Rent payment recorded', '£1,250 payment recorded for 22 Willow Close', '22 Willow Close', 'rent');
  };

  const handleAttentionClick = (item: AttentionItem) => {
    if (item.type === 'maintenance') setActiveView('maintenance');
    else if (item.type === 'compliance') setActiveView('compliance');
    else if (item.type === 'rent') setActiveView('rent');
  };

  const handleTourNext = () => {
    if (tourStage >= 7) { setTourVisible(false); setCompletionVisible(true); }
    else setTourStage(tourStage + 1);
  };

  const handleTourBack = () => { if (tourStage > 1) setTourStage(tourStage - 1); };

  const handleTourShowMe = () => {
    if (tourStage === 1) setActiveView('overview');
    if (tourStage === 2) setActiveView('maintenance');
    if (tourStage === 3) setPerspective('tenant');
    if (tourStage === 4) setActiveView('maintenance');
    if (tourStage === 5) setActiveView('compliance');
    if (tourStage === 6) setActiveView('rent');
    if (tourStage === 7) setActiveView('overview');
  };

  const handleStartTour = () => {
    setTourStage(1);
    setTourVisible(true);
    setPerspective('manager');
    setActiveView('overview');
    setEntryVisible(false);
    setCompletionVisible(false);
  };

  const handleExplore = () => { setEntryVisible(false); };

  const handleCompletionRestart = () => { setCompletionVisible(false); resetAll(); };

  const renderView = () => {
    switch (activeView) {
      case 'overview': return <OverviewView properties={properties} attention={attention} insights={insights} onNavigate={(v) => setActiveView(v as View)} onAttentionClick={handleAttentionClick} />;
      case 'properties': return <PropertiesView properties={properties} tenancies={tenancies} maintenance={maintenance} compliance={compliance} documents={docs} onSelectProperty={() => {}} />;
      case 'tenancies': return <TenanciesView tenancies={tenancies} properties={properties} />;
      case 'maintenance': return <MaintenanceView issues={maintenance} properties={properties} onAssignContractor={handleAssignContractor} onCompleteRepair={handleCompleteRepair} />;
      case 'compliance': return <ComplianceView items={compliance} properties={properties} onRenew={handleRenewCompliance} />;
      case 'rent': return <RentView records={rentRecords} properties={properties} onRecordPayment={handleRecordPayment} />;
      case 'documents': return <DocumentsView documents={docs} properties={properties} />;
      case 'messages': return <MessagesView />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[#f7f5f2] text-[#1a2332] overflow-hidden">
      <DemoControlBar
        product={product}
        onStartTour={handleStartTour}
        onReset={() => setShowResetConfirm(true)}
        onBuildCTA={() => setShowEnquiry(true)}
        tourActive={tourVisible}
        onSwitchExperience={() => setShowSwitcher(true)}
        extraRightContent={
          <button type="button" onClick={() => setPerspective(perspective === 'manager' ? 'tenant' : 'manager')} className="ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-amber-600 transition hover:bg-amber-500/10 cursor-pointer">
            <i className={`${perspective === 'manager' ? 'ri-user-line' : 'ri-building-line'} text-xs w-3 h-3 flex items-center justify-center`} />
            {perspective === 'manager' ? 'Tenant view' : 'Manager view'}
          </button>
        }
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        {perspective === 'manager' && (
          <Sidebar activeView={activeView} onNavigate={(v) => setActiveView(v as View)} />
        )}

        <main className="flex flex-1 min-w-0 overflow-hidden">
          {perspective === 'tenant' ? (
            <TenantPerspective properties={properties} maintenance={maintenance} rentRecords={rentRecords} onSwitchBack={() => setPerspective('manager')} />
          ) : (
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 min-w-0 lg:pb-2 pb-20">
                {renderView()}
              </div>
              <div className="hidden xl:flex w-80 shrink-0 flex-col border-l border-[#e8e5df]">
                <div className="h-1/3 overflow-hidden"><AttentionRail items={attention} onItemClick={handleAttentionClick} /></div>
                <div className="border-t border-[#e8e5df] h-1/3 overflow-hidden"><IntelligencePanel insights={insights} onNavigate={(v) => setActiveView(v as View)} /></div>
                <div className="border-t border-[#e8e5df] h-1/3 overflow-hidden"><ActivityTimeline events={activity} /></div>
              </div>
            </div>
          )}
        </main>
      </div>

      {perspective === 'manager' && <MobileNav activeView={activeView} onNavigate={(v) => setActiveView(v as View)} />}

      {entryVisible && (
        <DemoEntryOverlay product={product} onStartTour={handleStartTour} onExploreFreely={handleExplore} storageKey="lh_skip_entry" />
      )}

      <DemoGuidedTour
        product={product}
        active={tourVisible}
        step={tourStage - 1}
        total={product.tourSteps.length}
        steps={product.tourSteps}
        onNext={handleTourNext}
        onBack={handleTourBack}
        onExit={() => { setTourVisible(false); if (tourStage >= 7) setTimeout(() => setCompletionVisible(true), 500); }}
        onShowMe={handleTourShowMe}
      />

      {completionVisible && (
        <DemoCompletionOverlay product={product} open={completionVisible} onExploreAgain={handleCompletionRestart} />
      )}

      <DemoEnquiryPanel product={product} open={showEnquiry} onClose={() => setShowEnquiry(false)} />

      {showSwitcher && <ExperienceSwitcher currentId={product.id} onClose={() => setShowSwitcher(false)} />}
      <ResetConfirmDialog open={showResetConfirm} onConfirm={() => { setShowResetConfirm(false); resetAll(); }} onCancel={() => setShowResetConfirm(false)} />
    </div>
  );
}