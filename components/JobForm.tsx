import React, { useState } from 'react';
import { JobData, JobGrade } from '../types';
import { Plus, Trash2, Briefcase, User } from 'lucide-react';

interface JobFormProps {
  data: JobData;
  onChange: (data: JobData) => void;
}

const JobForm: React.FC<JobFormProps> = ({ data, onChange }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'grades'>('details');

  const updateField = (field: keyof JobData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addGrade = () => {
    const newLevel = data.grades.length;
    const newGrade: JobGrade = {
      level: newLevel,
      name: `Rank ${newLevel}`,
      payment: 100 + (newLevel * 50),
      isBoss: false
    };
    onChange({ ...data, grades: [...data.grades, newGrade] });
  };

  const removeGrade = (index: number) => {
    const newGrades = data.grades.filter((_, i) => i !== index);
    // Re-index levels to keep them sequential
    const reindexed = newGrades.map((g, i) => ({ ...g, level: i }));
    onChange({ ...data, grades: reindexed });
  };

  const updateGrade = (index: number, field: keyof JobGrade, value: any) => {
    const newGrades = [...data.grades];
    newGrades[index] = { ...newGrades[index], [field]: value };
    onChange({ ...data, grades: newGrades });
  };

  return (
    <div className="bg-qb-light border border-slate-700 rounded-xl shadow-xl flex flex-col h-full overflow-hidden">
      <div className="flex border-b border-slate-700 bg-qb-darker">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === 'details' 
              ? 'text-qb-accent border-b-2 border-qb-accent' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Job Details
        </button>
        <button
          onClick={() => setActiveTab('grades')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === 'grades' 
              ? 'text-qb-accent border-b-2 border-qb-accent' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Grades & Salary
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* ID */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Job ID (Internal Name)</label>
              <div className="relative">
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => updateField('name', e.target.value.toLowerCase().replace(/\s/g, ''))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-qb-accent transition-colors pl-10"
                  placeholder="police"
                />
                <Briefcase className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Used in database and scripts. Lowercase, no spaces.</p>
            </div>

            {/* Label */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Display Label</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={data.label}
                  onChange={(e) => updateField('label', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-qb-accent transition-colors"
                  placeholder="Los Santos Police Dept"
                />
              </div>
            </div>

            {/* Switches */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Default Duty</label>
                  <input
                    type="checkbox"
                    checked={data.defaultDuty}
                    onChange={(e) => updateField('defaultDuty', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-qb-accent focus:ring-qb-accent bg-gray-700"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Does the player start on-duty when they log in?</p>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Off-Duty Pay</label>
                  <input
                    type="checkbox"
                    checked={data.offDutyPay}
                    onChange={(e) => updateField('offDutyPay', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-qb-accent focus:ring-qb-accent bg-gray-700"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Does the player get paid while off-duty?</p>
              </div>
            </div>

             {/* Metadata */}
             <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Author</label>
              <div className="relative">
                <input
                  type="text"
                  value={data.author || ''}
                  onChange={(e) => updateField('author', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-qb-accent transition-colors pl-10"
                  placeholder="Your Name"
                />
                <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-300">Job Ranks Hierarchy</h3>
              <button
                onClick={addGrade}
                className="text-xs bg-qb-accent/20 hover:bg-qb-accent/30 text-qb-accent px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Grade
              </button>
            </div>

            <div className="space-y-3">
              {data.grades.map((grade, idx) => (
                <div key={idx} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 flex gap-3 items-center group">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono text-gray-400 shrink-0">
                    {grade.level}
                  </div>
                  
                  <div className="flex-1 space-y-2 sm:space-y-0 sm:flex sm:gap-3">
                    <input
                      type="text"
                      value={grade.name}
                      onChange={(e) => updateGrade(idx, 'name', e.target.value)}
                      placeholder="Rank Name"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:border-qb-accent focus:outline-none"
                    />
                    <div className="relative w-full sm:w-32">
                        <span className="absolute left-2 top-1.5 text-gray-500 text-xs">$</span>
                        <input
                        type="number"
                        value={grade.payment}
                        onChange={(e) => updateGrade(idx, 'payment', parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-700 rounded pl-5 pr-2 py-1 text-sm text-white focus:border-qb-accent focus:outline-none"
                        />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                     <label className="flex items-center cursor-pointer relative" title="Is Boss?">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={grade.isBoss}
                            onChange={(e) => updateGrade(idx, 'isBoss', e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-qb-success"></div>
                     </label>
                    <button
                      onClick={() => removeGrade(idx)}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {data.grades.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-700 rounded-lg">
                    No grades defined. Add one manually.
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobForm;