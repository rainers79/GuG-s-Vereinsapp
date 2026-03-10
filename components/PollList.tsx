import React, { useEffect, useState } from 'react';
import { Poll, User, AppRole } from '../types';
import PollCreate from './PollCreate';
import PollItem from './PollItem';

interface PollListProps {
  polls: Poll[];
  user: User;
  selectedPollId?: number | null;
  onRefresh: () => void;
  onUnauthorized: () => void;
  onBackToProjects?: () => void;
  onProjectContextChange?: (context: {
    projectName: string | null;
    moduleLabel: string | null;
  }) => void;
}

const LS_ACTIVE_PROJECT_NAME = 'gug_active_project_name';
const LS_ACTIVE_PROJECT = 'gug_active_project';

const PollList: React.FC<PollListProps> = ({
  polls,
  user,
  selectedPollId,
  onRefresh,
  onUnauthorized,
  onBackToProjects,
  onProjectContextChange
}) => {
  const [showCreate, setShowCreate] = useState(false);

  const canCreate =
    user.role === AppRole.SUPERADMIN ||
    user.role === AppRole.VORSTAND;

  const selectedPoll = polls.find((p) => p.id === selectedPollId);

  useEffect(() => {
    if (!onProjectContextChange) return;

    const activeProjectId = localStorage.getItem(LS_ACTIVE_PROJECT);
    const activeProjectName = localStorage.getItem(LS_ACTIVE_PROJECT_NAME);

    if (activeProjectId && activeProjectName) {
      onProjectContextChange({
        projectName: activeProjectName,
        moduleLabel: 'Umfragen'
      });
      return;
    }

    onProjectContextChange({
      projectName: null,
      moduleLabel: null
    });
  }, [onProjectContextChange]);

  return (
    <div className="space-y-8 sm:space-y-16 animate-in fade-in duration-1000 pb-20">
      {canCreate && (
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-[#B5A47A] text-black font-bold px-6 py-3 rounded-xl"
        >
          {showCreate ? 'Abbrechen' : 'Neue Umfrage'}
        </button>
      )}

      {showCreate && canCreate && (
        <PollCreate
          onSuccess={() => {
            setShowCreate(false);
            onRefresh();
          }}
          onUnauthorized={onUnauthorized}
        />
      )}

      {selectedPollId ? (
        selectedPoll ? (
          <PollItem
            poll={selectedPoll}
            user={user}
            onRefresh={onRefresh}
            onUnauthorized={onUnauthorized}
          />
        ) : (
          <div className="text-center text-slate-400">
            Lade Umfrage...
          </div>
        )
      ) : polls.length === 0 ? (
        <div className="text-center text-slate-400">
          Keine Umfragen vorhanden.
        </div>
      ) : (
        <div className="grid gap-6">
          {polls.map((poll) => (
            <PollItem
              key={poll.id}
              poll={poll}
              user={user}
              onRefresh={onRefresh}
              onUnauthorized={onUnauthorized}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PollList;
