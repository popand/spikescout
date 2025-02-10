'use client';

import { useState } from 'react';
import { School, Coach } from '../lib/types';
import SchoolForm from './SchoolForm';
import CoachForm from './CoachForm';
import { addSchool, updateSchool, addCoach, updateCoach, deleteCoach } from '../lib/firebase/firebaseUtils';

interface SchoolsListProps {
  schools: School[];
  coaches: Coach[];
  selectedSchool: School | null;
  selectedCoach: Coach | null;
  onSelectSchool: (school: School) => void;
  onSelectCoach: (coach: Coach) => void;
  onSchoolAdded: () => void;
  onSchoolUpdated: () => void;
  onCoachesUpdated: () => void;
}

export default function SchoolsList({
  schools,
  coaches,
  selectedSchool,
  selectedCoach,
  onSelectSchool,
  onSelectCoach,
  onSchoolAdded,
  onSchoolUpdated,
  onCoachesUpdated,
}: SchoolsListProps) {
  const [showSchoolForm, setShowSchoolForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);
  const [showCoachForm, setShowCoachForm] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [activeSchoolForCoach, setActiveSchoolForCoach] = useState<School | null>(null);

  const handleAddSchool = async (schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addSchool(schoolData);
    setShowSchoolForm(false);
    onSchoolAdded();
  };

  const handleEditSchool = async (schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingSchool) {
      await updateSchool(editingSchool.id, schoolData);
      setEditingSchool(null);
      onSchoolUpdated();
    }
  };

  const handleAddCoach = async (coachData: Omit<Coach, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addCoach(coachData);
    setShowCoachForm(false);
    setActiveSchoolForCoach(null);
    onCoachesUpdated();
  };

  const handleEditCoach = async (coachData: Omit<Coach, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingCoach) {
      await updateCoach(editingCoach.id, coachData);
      setEditingCoach(null);
      onCoachesUpdated();
    }
  };

  const handleDeleteCoach = async (coach: Coach) => {
    if (confirm('Are you sure you want to delete this coach?')) {
      await deleteCoach(coach.id);
      onCoachesUpdated();
    }
  };

  const toggleSchoolDetails = (schoolId: string) => {
    setExpandedSchool(expandedSchool === schoolId ? null : schoolId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Schools</h2>
        <button
          onClick={() => setShowSchoolForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 shadow-sm"
        >
          Add School
        </button>
      </div>

      {schools.map((school) => {
        const schoolCoaches = coaches.filter((coach) => coach.schoolId === school.id);
        const isSelected = selectedSchool?.id === school.id;
        const isExpanded = expandedSchool === school.id;

        return (
          <div
            key={school.id}
            className={`rounded-xl border transition-all duration-200 ${
              isSelected 
                ? 'border-blue-200 bg-blue-50 shadow-md' 
                : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
            }`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectSchool(school)}
                >
                  <h3 className="font-semibold text-gray-900">{school.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-gray-600">{school.location}</p>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm text-gray-600">{school.division}</span>
                  </div>
                  {school.tags && school.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {school.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleSchoolDetails(school.id)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors duration-150"
                  >
                    <svg 
                      className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSchool(school);
                    }}
                    className="p-1.5 text-blue-600 hover:text-blue-800 transition-colors duration-150"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pl-4 border-l-2 border-blue-200 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Description</h4>
                    <p className="mt-1 text-sm text-gray-600">{school.description}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Athletic Program</h4>
                    <p className="mt-1 text-sm text-gray-600">{school.athleticDetails}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Volleyball Program History</h4>
                    <p className="mt-1 text-sm text-gray-600">{school.volleyballHistory}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Programs/Majors</h4>
                    <p className="mt-1 text-sm text-gray-600">{school.programs.join(', ')}</p>
                  </div>
                  {school.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Notes</h4>
                      <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{school.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Coaches list */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Coaches and Staff</h4>
                  <button
                    onClick={() => {
                      setActiveSchoolForCoach(school);
                      setShowCoachForm(true);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-150"
                  >
                    Add Coach
                  </button>
                </div>
                <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                  {schoolCoaches.map((coach) => (
                    <div
                      key={coach.id}
                      className={`p-3 rounded-lg transition-all duration-200 ${
                        selectedCoach?.id === coach.id
                          ? 'bg-blue-100 text-blue-900'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCoach(coach);
                          }}
                        >
                          <div className="font-medium">{coach.name}</div>
                          <div className="text-sm text-gray-600">{coach.title}</div>
                          <div className="text-sm text-gray-600">{coach.email}</div>
                          {coach.phone && (
                            <div className="text-sm text-gray-600">{coach.phone}</div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCoach(coach);
                              setActiveSchoolForCoach(school);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 transition-colors duration-150"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCoach(coach);
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 transition-colors duration-150"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {schoolCoaches.length === 0 && (
                    <p className="text-sm text-gray-500 py-3">No coaches added yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* School Form Modal */}
      {showSchoolForm && (
        <SchoolForm
          school={editingSchool || undefined}
          onSubmit={editingSchool ? handleEditSchool : handleAddSchool}
          onCancel={() => {
            setShowSchoolForm(false);
            setEditingSchool(null);
          }}
        />
      )}

      {/* Coach Form Modal */}
      {showCoachForm && activeSchoolForCoach && (
        <CoachForm
          coach={editingCoach || undefined}
          schoolId={activeSchoolForCoach.id}
          onSubmit={editingCoach ? handleEditCoach : handleAddCoach}
          onCancel={() => {
            setShowCoachForm(false);
            setEditingCoach(null);
            setActiveSchoolForCoach(null);
          }}
        />
      )}
    </div>
  );
} 