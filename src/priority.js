const priorityLabels = {
  4: { label: '최우선', tone: 'danger' },
  3: { label: '높음', tone: 'warning' },
  2: { label: '보통', tone: 'info' },
  1: { label: '낮음', tone: 'neutral' },
};

export function calculatePriority(importance, urgency) {
  const score = Number(importance) + Number(urgency);
  if (score >= 5) return { score: 4, ...priorityLabels[4] };
  if (score === 4) return { score: 3, ...priorityLabels[3] };
  if (score === 3) return { score: 2, ...priorityLabels[2] };
  return { score: 1, ...priorityLabels[1] };
}

export function getLocalDateString(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function isDueToday(dueDate, today = getLocalDateString()) {
  return dueDate === today;
}

export function completionRate(tasks) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((task) => task.completed).length / tasks.length) * 100);
}
