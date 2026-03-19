export const subjects = [
  { name: 'Accounting for Everyone', abbr: 'Accounting', year: 1 },
  { name: 'Artificial Intelligence', abbr: 'AI', year: 3 },
  { name: 'Automata and Formal Languages', abbr: 'AFL', year: 3 },
  { name: 'Basic Electronics', abbr: 'BE', year: 1 },
  { name: 'Basic Instrumentation', abbr: 'BI', year: 1 },
  { name: 'Big Data', abbr: 'Big Data', year: 4 },
  { name: 'Biomedical Engineering', abbr: 'BME', year: 2 },
  { name: 'Chemistry', abbr: 'Chem', year: 1 },
  { name: 'Civil', abbr: 'Civil', year: 1 },
  { name: 'Cloud Computing', abbr: 'CC', year: 4 },
  { name: 'Compiler Design', abbr: 'CD', year: 3 },
  { name: 'Computer Architecture and Organization', abbr: 'CO/CAO', year: 2 },
  { name: 'Computer Networks', abbr: 'CN', year: 3 },
  { name: 'Data Analytics', abbr: 'DA', year: 4 },
  { name: 'Data Mining and Data Warehousing', abbr: 'DMDW', year: 4 },
  { name: 'Database Management System', abbr: 'DBMS', year: 2 },
  { name: 'Deep Learning', abbr: 'DL', year: 4 },
  { name: 'Differential Equations and Linear Algebra', abbr: 'DE & LA', year: 1 },
  { name: 'Digital Systems Design', abbr: 'DSD', year: 2 },
  { name: 'Discrete Mathematics', abbr: 'DM', year: 2 },
  { name: 'Distributed Operating System', abbr: 'DOS', year: 4 },
  { name: 'Engineering Economics', abbr: 'EE', year: 2 },
  { name: 'Engineering Lab Sessional Viva Test', abbr: 'Lab Viva', year: 1 },
  { name: 'Engineering Professional Practice', abbr: 'EPP', year: 2 },
  { name: 'English', abbr: 'Eng', year: 1 },
  { name: 'Environmental Sciences', abbr: 'EVS', year: 1 },
  { name: 'High Performance Computing', abbr: 'HPC', year: 4 },
  { name: 'Math 1', abbr: 'Math 1', year: 1 },
  { name: 'Operating System', abbr: 'OS', year: 3 },
  { name: 'Parallel and Distributed Computing', abbr: 'PDC', year: 3 },
  { name: 'Physics', abbr: 'Phys', year: 1 },
  { name: 'Principle of Digital Communication', abbr: 'PDC/Comm', year: 3 },
  { name: 'Professional Communication', abbr: 'PC', year: 2 },
  { name: 'Science of Living System', abbr: 'Biology', year: 1 },
  { name: 'Science of Public Health', abbr: 'SPH', year: 1 },
  { name: 'Social Political Environment', abbr: 'SPE', year: 2 },
  { name: 'Telecom and Network Management', abbr: 'T&NM', year: 3 },
  { name: 'Data Structures and Algorithms', abbr: 'DSA', year: 2 },
  { name: 'The Industry 4.0', abbr: 'Ind 4.0', year: 2 },
  { name: 'Training Engineering and Transportation Planning', abbr: 'TETP', year: 2 },
  { name: 'Universal Human Values', abbr: 'UHV', year: 1 },
  { name: 'Web Technology', abbr: 'WT', year: 3 },
  { name: 'Software Engineering', abbr: 'SE', year: 3 },
  { name: 'Software Project Management', abbr: 'SPM', year: 4 },
  { name: 'Probability and Statistics', abbr: 'P&S', year: 2 },
  { name: 'Economics of Development', abbr: 'EoD', year: 2 },
  { name: 'Machine Learning', abbr: 'ML', year: 3 },
  { name: 'Design and Analysis of Algorithms', abbr: 'DAA', year: 3 },
  { name: 'Scientific and Technical Writing', abbr: 'STW', year: 2 },
  { name: 'Object Oriented Programming with Java', abbr: 'OOPJ', year: 2 },
];

export function searchSubjects(query) {
  if (!query) return [];
  const q = query.toLowerCase().trim();
  return subjects.filter(s => {
    const name = s.name.toLowerCase();
    const abbr = s.abbr.toLowerCase();
    return name.includes(q) || abbr.includes(q) || fuzzyMatch(q, name) || fuzzyMatch(q, abbr);
  }).slice(0, 10);
}

function fuzzyMatch(query, text) {
  let qi = 0;
  for (let i = 0; i < text.length && qi < query.length; i++) {
    if (text[i] === query[qi]) qi++;
  }
  return qi === query.length;
}

export function getSubjectsByYear(year) {
  return subjects.filter(s => s.year === year);
}
