import React, { useMemo, useState } from 'react';

const weekDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

function createAvailabilityTemplate() {
  return weekDays.reduce((acc, day) => {
    acc[day] = {
      status: 'Available',
      start: '09:00',
      end: '17:00',
      notes: ''
    };
    return acc;
  }, {});
}

const defaultStaff = [
  {
    id: 'staff-1',
    name: 'Alex Johnson',
    roles: ['Manager', 'Supervisor'],
    trainings: ['Food Safety Level 2', 'First Aid'],
    restHours: 11,
    availability: {
      ...createAvailabilityTemplate(),
      Wednesday: { status: 'Partial - University', start: '13:00', end: '21:00', notes: 'Morning lectures' },
      Saturday: { status: 'Available', start: '10:00', end: '18:00', notes: '' },
      Sunday: { status: 'Holiday', start: '00:00', end: '00:00', notes: 'Family day' }
    }
  },
  {
    id: 'staff-2',
    name: 'Priya Singh',
    roles: ['Barista', 'Cashier'],
    trainings: ['Barista Certification', 'Allergen Awareness'],
    restHours: 12,
    availability: {
      ...createAvailabilityTemplate(),
      Monday: { status: 'Maternity/Paternity', start: '00:00', end: '00:00', notes: 'Leave until June' },
      Tuesday: { status: 'Maternity/Paternity', start: '00:00', end: '00:00', notes: '' },
      Wednesday: { status: 'Maternity/Paternity', start: '00:00', end: '00:00', notes: '' }
    }
  },
  {
    id: 'staff-3',
    name: 'Diego Ramirez',
    roles: ['Chef'],
    trainings: ['Food Safety Level 3', 'Knife Skills'],
    restHours: 10,
    availability: {
      ...createAvailabilityTemplate(),
      Thursday: { status: 'Unavailable', start: '00:00', end: '00:00', notes: 'Holiday travel' },
      Friday: { status: 'Unavailable', start: '00:00', end: '00:00', notes: 'Holiday travel' }
    }
  }
];

const defaultShifts = [
  {
    id: 'shift-1',
    day: 'Monday',
    role: 'Manager',
    start: '08:00',
    end: '16:00',
    requiredTraining: 'First Aid',
    notes: 'Open truck and supervise setup',
    assignedStaffId: ''
  },
  {
    id: 'shift-2',
    day: 'Wednesday',
    role: 'Chef',
    start: '11:00',
    end: '19:00',
    requiredTraining: 'Food Safety Level 3',
    notes: 'Prep and service for lunch/dinner',
    assignedStaffId: ''
  },
  {
    id: 'shift-3',
    day: 'Saturday',
    role: 'Barista',
    start: '09:00',
    end: '15:00',
    requiredTraining: 'Barista Certification',
    notes: 'Coffee cart at farmers market',
    assignedStaffId: ''
  }
];

function timeToMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function dayIndex(day) {
  const index = weekDays.indexOf(day);
  return index === -1 ? 0 : index;
}

function minutesFromWeekStart(day, time) {
  return dayIndex(day) * 24 * 60 + timeToMinutes(time);
}

function checkRestCompliance(staff, shift, shifts) {
  const restMinutes = (staff.restHours || 0) * 60;
  if (!restMinutes) {
    return { ok: true };
  }

  const targetStart = minutesFromWeekStart(shift.day, shift.start);
  const targetEnd = minutesFromWeekStart(shift.day, shift.end);

  const assignedShifts = shifts.filter((item) => item.assignedStaffId === staff.id && item.id !== shift.id);

  for (const other of assignedShifts) {
    const otherStart = minutesFromWeekStart(other.day, other.start);
    const otherEnd = minutesFromWeekStart(other.day, other.end);

    if (
      (targetStart >= otherStart && targetStart < otherEnd) ||
      (targetEnd > otherStart && targetEnd <= otherEnd) ||
      (otherStart >= targetStart && otherStart < targetEnd)
    ) {
      return { ok: false, reason: 'Overlaps with another assigned shift.' };
    }

    if (otherEnd <= targetStart) {
      const gap = targetStart - otherEnd;
      if (gap < restMinutes) {
        const needed = Math.ceil((restMinutes - gap) / 60);
        return { ok: false, reason: `Needs ${needed} more hour(s) rest after previous shift.` };
      }
    }

    if (targetEnd <= otherStart) {
      const gap = otherStart - targetEnd;
      if (gap < restMinutes) {
        const needed = Math.ceil((restMinutes - gap) / 60);
        return { ok: false, reason: `Requires ${needed} more hour(s) rest before next shift.` };
      }
    }
  }

  return { ok: true };
}

function evaluateStaffForShift(staff, shift, shifts) {
  const issues = [];
  const warnings = [];

  if (shift.role && !staff.roles.includes(shift.role)) {
    issues.push('Role not in skill set.');
  }

  if (shift.requiredTraining && !staff.trainings.includes(shift.requiredTraining)) {
    issues.push('Missing required training.');
  }

  const dailyAvailability = staff.availability[shift.day];
  if (!dailyAvailability) {
    issues.push('No availability recorded.');
  } else {
    const status = dailyAvailability.status;
    if (status === 'Holiday') {
      issues.push('On holiday.');
    } else if (status === 'Maternity/Paternity') {
      issues.push('On maternity/paternity leave.');
    } else if (status === 'Unavailable') {
      issues.push('Marked unavailable.');
    } else {
      const availableStart = timeToMinutes(dailyAvailability.start);
      const availableEnd = timeToMinutes(dailyAvailability.end);
      const shiftStart = timeToMinutes(shift.start);
      const shiftEnd = timeToMinutes(shift.end);

      if (shiftStart < availableStart || shiftEnd > availableEnd) {
        issues.push('Shift is outside availability.');
      }

      if (status === 'Partial - University') {
        warnings.push('Availability reduced due to university.');
      }
    }
  }

  const rest = checkRestCompliance(staff, shift, shifts);
  if (!rest.ok) {
    issues.push(rest.reason);
  }

  return {
    eligible: issues.length === 0,
    issues,
    warnings
  };
}

function generateId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function SchedulePlanner() {
  const [staffMembers, setStaffMembers] = useState(defaultStaff);
  const [shifts, setShifts] = useState(defaultShifts);
  const [newStaff, setNewStaff] = useState({
    name: '',
    roles: '',
    trainings: '',
    restHours: 11
  });
  const [newShift, setNewShift] = useState({
    day: 'Monday',
    role: '',
    start: '09:00',
    end: '17:00',
    requiredTraining: '',
    notes: ''
  });

  const groupedShifts = useMemo(() => {
    return weekDays.map((day) => ({
      day,
      items: shifts.filter((shift) => shift.day === day)
    }));
  }, [shifts]);

  const handleStaffFieldChange = (staffId, field, value) => {
    setStaffMembers((prev) =>
      prev.map((staff) => (staff.id === staffId ? { ...staff, [field]: value } : staff))
    );
  };

  const handleAvailabilityChange = (staffId, day, changes) => {
    setStaffMembers((prev) =>
      prev.map((staff) => {
        if (staff.id !== staffId) return staff;
        return {
          ...staff,
          availability: {
            ...staff.availability,
            [day]: {
              ...staff.availability[day],
              ...changes
            }
          }
        };
      })
    );
  };

  const handleAddStaff = (event) => {
    event.preventDefault();
    if (!newStaff.name.trim()) {
      return;
    }

    const staffRecord = {
      id: generateId('staff'),
      name: newStaff.name.trim(),
      roles: newStaff.roles
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      trainings: newStaff.trainings
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      restHours: Number(newStaff.restHours) || 0,
      availability: createAvailabilityTemplate()
    };

    setStaffMembers((prev) => [...prev, staffRecord]);
    setNewStaff({ name: '', roles: '', trainings: '', restHours: 11 });
  };

  const handleAddShift = (event) => {
    event.preventDefault();
    if (!newShift.role.trim()) {
      return;
    }

    const shift = {
      ...newShift,
      id: generateId('shift'),
      role: newShift.role.trim(),
      requiredTraining: newShift.requiredTraining.trim(),
      assignedStaffId: ''
    };

    setShifts((prev) => [...prev, shift]);
    setNewShift({ day: 'Monday', role: '', start: '09:00', end: '17:00', requiredTraining: '', notes: '' });
  };

  const assignStaffToShift = (shiftId, staffId) => {
    setShifts((prev) =>
      prev.map((shift) => {
        if (shift.id !== shiftId) return shift;
        const staff = staffMembers.find((item) => item.id === staffId);
        const evaluation = staff ? evaluateStaffForShift(staff, shift, prev) : { eligible: false };
        if (!staff || !evaluation.eligible) {
          return shift;
        }
        return { ...shift, assignedStaffId: staffId };
      })
    );
  };

  const unassignShift = (shiftId) => {
    setShifts((prev) => prev.map((shift) => (shift.id === shiftId ? { ...shift, assignedStaffId: '' } : shift)));
  };

  const getEligibilitySummary = (shift) => {
    return staffMembers.map((staff) => {
      const evaluation = evaluateStaffForShift(staff, shift, shifts);
      return { staff, evaluation };
    });
  };

  return (
    <div className="schedule-grid">
      <section className="schedule-panel">
        <header className="schedule-panel__header">
          <h2>Team availability</h2>
          <p>Track legal rest periods, leave and training readiness before planning shifts.</p>
        </header>

        <div className="staff-list">
          {staffMembers.map((staff) => (
            <article key={staff.id} className="staff-card">
              <header className="staff-card__header">
                <div>
                  <h3>{staff.name}</h3>
                  <p className="staff-card__meta">Roles: {staff.roles.length ? staff.roles.join(', ') : '—'}</p>
                  <p className="staff-card__meta">Training: {staff.trainings.length ? staff.trainings.join(', ') : '—'}</p>
                </div>
                <div className="staff-card__rest">
                  <label>
                    Rest requirement (hrs)
                    <input
                      type="number"
                      min="0"
                      value={staff.restHours}
                      onChange={(event) => handleStaffFieldChange(staff.id, 'restHours', Number(event.target.value))}
                    />
                  </label>
                </div>
              </header>

              <div className="availability-grid">
                {weekDays.map((day) => {
                  const availability = staff.availability[day] || { status: 'Available', start: '09:00', end: '17:00', notes: '' };
                  return (
                    <div key={day} className="availability-card">
                      <h4>{day}</h4>
                      <label>
                        Status
                        <select
                          value={availability.status}
                          onChange={(event) =>
                            handleAvailabilityChange(staff.id, day, { status: event.target.value })
                          }
                        >
                          <option value="Available">Available</option>
                          <option value="Partial - University">Partial - University</option>
                          <option value="Unavailable">Unavailable</option>
                          <option value="Holiday">Holiday</option>
                          <option value="Maternity/Paternity">Maternity/Paternity</option>
                        </select>
                      </label>
                      {(availability.status === 'Available' || availability.status === 'Partial - University') && (
                        <div className="availability-card__times">
                          <label>
                            From
                            <input
                              type="time"
                              value={availability.start}
                              onChange={(event) =>
                                handleAvailabilityChange(staff.id, day, { start: event.target.value })
                              }
                            />
                          </label>
                          <label>
                            To
                            <input
                              type="time"
                              value={availability.end}
                              onChange={(event) =>
                                handleAvailabilityChange(staff.id, day, { end: event.target.value })
                              }
                            />
                          </label>
                        </div>
                      )}
                      <label>
                        Notes
                        <input
                          type="text"
                          value={availability.notes}
                          onChange={(event) =>
                            handleAvailabilityChange(staff.id, day, { notes: event.target.value })
                          }
                          placeholder="e.g. covering university lecture"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        <form className="inline-form" onSubmit={handleAddStaff}>
          <h3>Add team member</h3>
          <div className="inline-form__row">
            <label>
              Name
              <input
                type="text"
                value={newStaff.name}
                onChange={(event) => setNewStaff((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>
            <label>
              Rest hours
              <input
                type="number"
                min="0"
                value={newStaff.restHours}
                onChange={(event) => setNewStaff((prev) => ({ ...prev, restHours: event.target.value }))}
              />
            </label>
          </div>
          <label>
            Roles (comma separated)
            <input
              type="text"
              value={newStaff.roles}
              onChange={(event) => setNewStaff((prev) => ({ ...prev, roles: event.target.value }))}
              placeholder="Chef, Barista"
            />
          </label>
          <label>
            Training & qualifications (comma separated)
            <input
              type="text"
              value={newStaff.trainings}
              onChange={(event) => setNewStaff((prev) => ({ ...prev, trainings: event.target.value }))}
              placeholder="Food Safety Level 2"
            />
          </label>
          <button type="submit">Add team member</button>
        </form>
      </section>

      <section className="schedule-panel">
        <header className="schedule-panel__header">
          <h2>Weekly shift planner</h2>
          <p>See who matches each role, confirm rest breaks and assign confidently.</p>
        </header>

        <form className="inline-form" onSubmit={handleAddShift}>
          <h3>Create shift</h3>
          <div className="inline-form__row">
            <label>
              Day
              <select
                value={newShift.day}
                onChange={(event) => setNewShift((prev) => ({ ...prev, day: event.target.value }))}
              >
                {weekDays.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Role
              <input
                type="text"
                value={newShift.role}
                onChange={(event) => setNewShift((prev) => ({ ...prev, role: event.target.value }))}
                required
              />
            </label>
          </div>
          <div className="inline-form__row">
            <label>
              From
              <input
                type="time"
                value={newShift.start}
                onChange={(event) => setNewShift((prev) => ({ ...prev, start: event.target.value }))}
              />
            </label>
            <label>
              To
              <input
                type="time"
                value={newShift.end}
                onChange={(event) => setNewShift((prev) => ({ ...prev, end: event.target.value }))}
              />
            </label>
            <label>
              Required training
              <input
                type="text"
                value={newShift.requiredTraining}
                onChange={(event) =>
                  setNewShift((prev) => ({ ...prev, requiredTraining: event.target.value }))
                }
                placeholder="Optional"
              />
            </label>
          </div>
          <label>
            Notes
            <input
              type="text"
              value={newShift.notes}
              onChange={(event) => setNewShift((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="e.g. lunch rush support"
            />
          </label>
          <button type="submit">Add shift</button>
        </form>

        <div className="shift-columns">
          {groupedShifts.map(({ day, items }) => (
            <div key={day} className="shift-column">
              <h3>{day}</h3>
              {items.length === 0 ? (
                <p className="empty">No shifts planned yet.</p>
              ) : (
                items.map((shift) => {
                  const summary = getEligibilitySummary(shift);
                  const assigned = staffMembers.find((staff) => staff.id === shift.assignedStaffId);
                  return (
                    <article key={shift.id} className="shift-card">
                      <header className="shift-card__header">
                        <div>
                          <h4>{shift.role}</h4>
                          <p className="shift-card__time">
                            {shift.start} – {shift.end}
                          </p>
                        </div>
                        {assigned ? (
                          <div className="assignment">
                            <span className="assignment__label">Assigned</span>
                            <span className="assignment__name">{assigned.name}</span>
                            <button type="button" onClick={() => unassignShift(shift.id)}>
                              Clear
                            </button>
                          </div>
                        ) : (
                          <p className="assignment assignment--open">Unassigned</p>
                        )}
                      </header>
                      {shift.requiredTraining && (
                        <p className="shift-card__detail">Training: {shift.requiredTraining}</p>
                      )}
                      {shift.notes && <p className="shift-card__detail">Notes: {shift.notes}</p>}

                      <div className="eligibility">
                        <h5>Eligible team</h5>
                        <ul>
                          {summary
                            .filter(({ evaluation }) => evaluation.eligible)
                            .map(({ staff, evaluation }) => (
                              <li key={staff.id}>
                                <button type="button" onClick={() => assignStaffToShift(shift.id, staff.id)}>
                                  {staff.name}
                                </button>
                                {evaluation.warnings.length > 0 && (
                                  <ul className="eligibility__warnings">
                                    {evaluation.warnings.map((warning, index) => (
                                      <li key={index}>{warning}</li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            ))}
                        </ul>

                        <h5>Needs attention</h5>
                        <ul>
                          {summary
                            .filter(({ evaluation }) => !evaluation.eligible)
                            .map(({ staff, evaluation }) => (
                              <li key={staff.id}>
                                <span>{staff.name}</span>
                                <ul className="eligibility__issues">
                                  {evaluation.issues.map((issue, index) => (
                                    <li key={index}>{issue}</li>
                                  ))}
                                </ul>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
