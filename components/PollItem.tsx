import React, { useState } from 'react';
import { Poll, User, AppRole } from '../types';
import * as api from '../services/api';

interface PollItemProps {
  poll: Poll;
  user: User;
  onRefresh: () => void;
  onUnauthorized: () => void;
}

const PollItem: React.FC<PollItemProps> = ({ poll, user, onRefresh, onUnauthorized }) => {
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVisitor = user.role === AppRole.VISITOR;
  const canModify =
    user.role === AppRole.SUPERADMIN ||
    user.role === AppRole.VORSTAND;

  const handleOptionToggle = (id: number) => {
    if (poll.has_voted || isVoting || isVisitor) return;

    if (poll.is_multiple_choice) {
      setSelectedOptions(prev =>
        prev.includes(id)
          ? prev.filter(oid => oid !== id)
          : [...prev, id]
      );
    } else {
      setSelectedOptions([id]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0) return;

    setIsVoting(true);
    setError(null);

    try {
      await api.votePoll(poll.id, selectedOptions, onUnauthorized);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Abstimmung fehlgeschlagen.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Diese Umfrage löschen?')) return;

    setIsDeleting(true);

    try {
      await api.deletePoll(poll.id, onUnauthorized);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Löschen fehlgeschlagen.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-white/5 mb-8 relative">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="bg-[#B5A47A] text-black px-4 py-1 rounded-lg text-xs font-black uppercase tracking-widest">
            {poll.target_date
              ? `EVENT: ${new Date(poll.target_date).toLocaleDateString('de-DE')}`
              : 'VOTING'}
          </span>
        </div>

        {canModify && (
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700"
          >
            🗑
          </button>
        )}
      </div>

      {/* QUESTION */}
      <div className="bg-slate-100 dark:bg-black/30 p-6 rounded-2xl mb-6">
        <h3 className="text-3xl font-black text-black dark:text-white">
          {poll.question}
        </h3>
      </div>

      {/* OPTIONS */}
      <div className="space-y-4">
        {poll.options.map((option) => {
          const percentage =
            poll.total_votes > 0
              ? (option.votes / poll.total_votes) * 100
              : 0;

          const isSelected = selectedOptions.includes(option.id);

          return (
            <div
              key={option.id}
              onClick={() => handleOptionToggle(option.id)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all
                ${
                  isSelected
                    ? 'border-[#B5A47A] bg-[#B5A47A]/10'
                    : 'border-slate-300 dark:border-white/10 bg-white dark:bg-[#2A2A2A]'
                }
              `}
            >
              <div className="flex justify-between items-center">

                <div className="flex items-center gap-4">
                  {!poll.has_voted && !isVisitor && (
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center
                        ${
                          isSelected
                            ? 'bg-[#B5A47A] border-[#B5A47A]'
                            : 'border-slate-400'
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-sm"></div>
                      )}
                    </div>
                  )}

                  <span className="text-lg font-bold text-black dark:text-white">
                    {option.text}
                  </span>
                </div>

                {poll.has_voted && (
                  <span className="font-bold text-[#B5A47A]">
                    {percentage.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200 dark:border-white/5">

        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          {poll.has_voted
            ? 'BEREITS ABGESTIMMT'
            : poll.is_multiple_choice
            ? 'MEHRFACHAUSWAHL'
            : 'EINZELAUSWAHL'}
        </span>

        {!poll.has_voted && !isVisitor && (
          <button
            onClick={handleVote}
            disabled={selectedOptions.length === 0 || isVoting}
            className="bg-[#B5A47A] text-black px-8 py-3 rounded-xl font-bold uppercase disabled:opacity-30"
          >
            Stimme absenden
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-500 mt-4 text-sm">{error}</p>
      )}
    </div>
  );
};

export default PollItem;
