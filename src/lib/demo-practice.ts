export type PracticeQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type PracticeTopic = {
  id: string;
  title: string;
  writtenPrompt: string;
  writtenFeedback: string;
  questions: PracticeQuestion[];
};

export type PracticeSubject = {
  id: string;
  title: string;
  topics: PracticeTopic[];
};

export const practiceSubjects: PracticeSubject[] = [
  { id: 'polity', title: 'Indian Polity', topics: [
    { id: 'constitution-preamble', title: 'Constitution & Preamble', writtenPrompt: 'Explain how the Preamble guides the interpretation of the Constitution.', writtenFeedback: 'Connect the constitutional values in the Preamble with their role in interpreting ambiguous provisions.', questions: [
      { id: 'polity-cp-1', prompt: 'The Preamble describes India as a:', options: ['Unitary monarchy', 'Sovereign socialist secular democratic republic', 'Federal kingdom', 'Confederation of states'], answer: 'Sovereign socialist secular democratic republic', explanation: 'The Preamble states the defining nature of the Indian republic.' },
      { id: 'polity-cp-2', prompt: 'Which word was added to the Preamble by the 42nd Amendment?', options: ['Republic', 'Justice', 'Secular', 'Liberty'], answer: 'Secular', explanation: 'The 42nd Amendment added the words Socialist, Secular and Integrity.' },
      { id: 'polity-cp-3', prompt: 'The Constitution of India came into force on:', options: ['15 August 1947', '26 November 1949', '26 January 1950', '2 October 1950'], answer: '26 January 1950', explanation: 'It was adopted on 26 November 1949 and came into force on 26 January 1950.' },
      { id: 'polity-cp-4', prompt: 'The authority of the Constitution is derived from:', options: ['Parliament', 'The President', 'The people of India', 'The Supreme Court'], answer: 'The people of India', explanation: 'The opening phrase “We, the People of India” identifies the people as the source of authority.' },
    ] },
    { id: 'rights-principles', title: 'Rights & Principles', writtenPrompt: 'Compare Fundamental Rights with Directive Principles of State Policy.', writtenFeedback: 'A strong answer should compare enforceability, purpose, constitutional location, and their complementary role.', questions: [
      { id: 'polity-rp-1', prompt: 'Which article protects life and personal liberty?', options: ['Article 14', 'Article 19', 'Article 21', 'Article 32'], answer: 'Article 21', explanation: 'Article 21 protects the right to life and personal liberty.' },
      { id: 'polity-rp-2', prompt: 'Fundamental Rights are contained in which Part?', options: ['Part II', 'Part III', 'Part IV', 'Part V'], answer: 'Part III', explanation: 'Fundamental Rights are contained in Part III of the Constitution.' },
      { id: 'polity-rp-3', prompt: 'Directive Principles are:', options: ['Enforceable by every court', 'Non-justiciable', 'Temporary provisions', 'Only applicable to states'], answer: 'Non-justiciable', explanation: 'Directive Principles guide the state but are not directly enforceable by courts.' },
      { id: 'polity-rp-4', prompt: 'The right to constitutional remedies is associated with:', options: ['Article 21', 'Article 32', 'Article 44', 'Article 368'], answer: 'Article 32', explanation: 'Article 32 allows citizens to approach the Supreme Court for enforcement of Fundamental Rights.' },
    ] },
  ] },
  { id: 'history', title: 'Modern History', topics: [
    { id: 'early-resistance', title: 'Early Resistance', writtenPrompt: 'Discuss the causes that transformed the Revolt of 1857 into a broad uprising.', writtenFeedback: 'Cover political, economic, military, social and religious causes, then connect them to regional participation.', questions: [
      { id: 'history-er-1', prompt: 'The Revolt of 1857 first broke out at:', options: ['Delhi', 'Meerut', 'Kanpur', 'Lucknow'], answer: 'Meerut', explanation: 'The uprising began at Meerut before spreading to Delhi and beyond.' },
      { id: 'history-er-2', prompt: 'Who was proclaimed the symbolic leader of the Revolt of 1857?', options: ['Nana Sahib', 'Bahadur Shah II', 'Tatya Tope', 'Kunwar Singh'], answer: 'Bahadur Shah II', explanation: 'The rebels proclaimed Mughal emperor Bahadur Shah II as their symbolic leader.' },
      { id: 'history-er-3', prompt: 'Rani Lakshmibai led resistance primarily at:', options: ['Jhansi', 'Awadh', 'Bareilly', 'Meerut'], answer: 'Jhansi', explanation: 'Rani Lakshmibai was the central leader of resistance in Jhansi.' },
      { id: 'history-er-4', prompt: 'The Doctrine of Lapse is associated with:', options: ['Lord Dalhousie', 'Lord Curzon', 'Lord Ripon', 'Lord Canning'], answer: 'Lord Dalhousie', explanation: 'Lord Dalhousie used the Doctrine of Lapse to annex princely states.' },
    ] },
    { id: 'national-movement', title: 'National Movement', writtenPrompt: 'Evaluate the role of mass participation in the Indian national movement.', writtenFeedback: 'Use examples from major movements and explain how participation widened the social base of nationalism.', questions: [
      { id: 'history-nm-1', prompt: 'The Indian National Congress was founded in:', options: ['1857', '1885', '1905', '1919'], answer: '1885', explanation: 'The Indian National Congress was founded in 1885.' },
      { id: 'history-nm-2', prompt: 'The Salt March was led by:', options: ['Bal Gangadhar Tilak', 'Mahatma Gandhi', 'Subhas Chandra Bose', 'Dadabhai Naoroji'], answer: 'Mahatma Gandhi', explanation: 'Mahatma Gandhi led the Salt March in 1930.' },
      { id: 'history-nm-3', prompt: 'The Quit India Movement began in:', options: ['1930', '1935', '1942', '1946'], answer: '1942', explanation: 'The Quit India Movement was launched in August 1942.' },
      { id: 'history-nm-4', prompt: 'The Swadeshi Movement followed the partition of:', options: ['Punjab', 'Bengal', 'Bombay', 'Madras'], answer: 'Bengal', explanation: 'The movement intensified after the partition of Bengal in 1905.' },
    ] },
  ] },
  { id: 'geography', title: 'Indian Geography', topics: [
    { id: 'physical-geography', title: 'Physical Geography', writtenPrompt: 'Explain how India’s physical divisions influence climate and settlement.', writtenFeedback: 'Relate the Himalayas, plains, plateau, coast and islands to rainfall, rivers, agriculture and population.', questions: [
      { id: 'geo-pg-1', prompt: 'Which is the oldest mountain range in India?', options: ['Himalayas', 'Aravallis', 'Vindhyas', 'Satpuras'], answer: 'Aravallis', explanation: 'The Aravalli range is among the world’s oldest fold mountain systems.' },
      { id: 'geo-pg-2', prompt: 'The Tropic of Cancer passes through how many Indian states?', options: ['6', '7', '8', '9'], answer: '8', explanation: 'The Tropic of Cancer crosses eight Indian states.' },
      { id: 'geo-pg-3', prompt: 'Which river is known as the Sorrow of Bihar?', options: ['Ganga', 'Kosi', 'Godavari', 'Narmada'], answer: 'Kosi', explanation: 'The Kosi is known for its changing course and floods in Bihar.' },
      { id: 'geo-pg-4', prompt: 'The Deccan Plateau is primarily composed of:', options: ['Alluvial deposits', 'Basaltic lava', 'Marine sediments', 'Glacial deposits'], answer: 'Basaltic lava', explanation: 'Much of the Deccan Plateau is formed from extensive basaltic lava flows.' },
    ] },
  ] },
];
