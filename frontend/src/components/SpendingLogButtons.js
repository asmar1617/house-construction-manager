import React, { useState } from 'react';
import SpendingLogModal from './SpendingLogModal';

function SpendingLogButtons({ expenses, currentView, onSelectView }) {
  const [modalOpen, setModalOpen] = useState(false);
  const useViewSwitch = typeof onSelectView === 'function';

  if (useViewSwitch) {
    return (
      <div className="spending-log-buttons">
        <button
          type="button"
          className={`spending-log-btn ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSelectView('dashboard')}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={`spending-log-btn ${currentView === 'categories' ? 'active' : ''}`}
          onClick={() => onSelectView('categories')}
        >
          Categories
        </button>
        <button
          type="button"
          className={`spending-log-btn ${currentView === 'today' ? 'active' : ''}`}
          onClick={() => onSelectView('today')}
        >
          Today&apos;s spend
        </button>
        <button
          type="button"
          className={`spending-log-btn ${currentView === 'weekly' ? 'active' : ''}`}
          onClick={() => onSelectView('weekly')}
        >
          Weekly spend
        </button>
        <button
          type="button"
          className={`spending-log-btn ${currentView === 'overall' ? 'active' : ''}`}
          onClick={() => onSelectView('overall')}
        >
          Overall spend
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="spending-log-buttons">
        <button type="button" className="spending-log-btn" onClick={() => setModalOpen(true)}>Today&apos;s spend</button>
        <button type="button" className="spending-log-btn" onClick={() => setModalOpen(true)}>Weekly spend</button>
        <button type="button" className="spending-log-btn" onClick={() => setModalOpen(true)}>Overall spend</button>
      </div>
      {modalOpen && <SpendingLogModal expenses={expenses} onClose={() => setModalOpen(false)} />}
    </>
  );
}

export default SpendingLogButtons;
