export type AdminStudent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: 'JEE' | 'CA' | 'NEET';
  category: string;
  hoursStudied: number;
  joinedOn: string;
  lastActive: string;
  examDate: string;
  academyId: string | null;
  dailyTarget: string;
  streakDays: number;
  syllabusCompletion: number;
  practiceAccuracy: number;
};

export type AdminOrder = {
  id: string;
  studentId: string;
  studentName: string;
  email: string;
  course: AdminStudent['course'];
  category: string;
  item: string;
  itemType: 'Note' | 'Package';
  amount: number;
  date: string;
  status: 'Paid' | 'Refunded';
  paymentId: string;
  paymentMethod: string;
};

export type PaidNote = {
  id: string;
  title: string;
  subject: string;
  course: AdminStudent['course'];
  category: string;
  pages: number;
  price: number;
};

export type PaidPackage = {
  id: string;
  title: string;
  course: AdminStudent['course'];
  category: string;
  lessonCount: number;
  price: number;
};

export const adminStudents: AdminStudent[] = [
  { id: 'ST-1001', name: 'Aditi Sharma', email: 'aditi@example.com', phone: '+91 98765 43210', course: 'JEE', category: 'Mains', hoursStudied: 84.5, joinedOn: '02 Jun 2026', lastActive: 'Today, 9:42 AM', examDate: '14 Sep 2026', academyId: 'PF-JEE-041', dailyTarget: '2 hours', streakDays: 6, syllabusCompletion: 68, practiceAccuracy: 82 },
  { id: 'ST-1002', name: 'Rahul Menon', email: 'rahul@example.com', phone: '+91 98470 11223', course: 'CA', category: 'Intermediate', hoursStudied: 61.2, joinedOn: '14 Jun 2026', lastActive: 'Today, 8:18 AM', examDate: '01 Nov 2026', academyId: 'ACA-2381', dailyTarget: '1h 30m', streakDays: 4, syllabusCompletion: 51, practiceAccuracy: 76 },
  { id: 'ST-1003', name: 'Meera Nair', email: 'meera@example.com', phone: '+91 99001 24567', course: 'NEET', category: 'UG', hoursStudied: 102.8, joinedOn: '20 May 2026', lastActive: 'Yesterday', examDate: '03 May 2027', academyId: null, dailyTarget: '3 hours', streakDays: 11, syllabusCompletion: 74, practiceAccuracy: 88 },
  { id: 'ST-1004', name: 'Arjun Patel', email: 'arjun@example.com', phone: '+91 98250 31840', course: 'JEE', category: 'Advanced', hoursStudied: 48.6, joinedOn: '28 Jun 2026', lastActive: 'Yesterday', examDate: '24 May 2027', academyId: 'SPARK-092', dailyTarget: '2h 30m', streakDays: 2, syllabusCompletion: 39, practiceAccuracy: 69 },
  { id: 'ST-1005', name: 'Nisha Gupta', email: 'nisha@example.com', phone: '+91 98111 42780', course: 'CA', category: 'Foundation', hoursStudied: 39.4, joinedOn: '05 Jul 2026', lastActive: '30 Jul 2026', examDate: '12 Jan 2027', academyId: null, dailyTarget: '90 minutes', streakDays: 0, syllabusCompletion: 32, practiceAccuracy: 71 },
  { id: 'ST-1006', name: 'Vikram Rao', email: 'vikram@example.com', phone: '+91 98860 50431', course: 'NEET', category: 'UG', hoursStudied: 73.1, joinedOn: '11 Jun 2026', lastActive: '29 Jul 2026', examDate: '03 May 2027', academyId: 'MED-771', dailyTarget: '2 hours', streakDays: 7, syllabusCompletion: 57, practiceAccuracy: 79 },
];

export const adminOrders: AdminOrder[] = [
  { id: 'PF-2026-0108', studentId: 'ST-1001', studentName: 'Aditi Sharma', email: 'aditi@example.com', course: 'JEE', category: 'Mains', item: 'JEE Mains Complete Pack', itemType: 'Package', amount: 1299, date: '31 Jul 2026', status: 'Paid', paymentId: 'pay_PF108JEE', paymentMethod: 'UPI' },
  { id: 'PF-2026-0107', studentId: 'ST-1002', studentName: 'Rahul Menon', email: 'rahul@example.com', course: 'CA', category: 'Intermediate', item: 'Corporate Law Essentials', itemType: 'Package', amount: 499, date: '30 Jul 2026', status: 'Paid', paymentId: 'pay_PF107CA', paymentMethod: 'Credit card' },
  { id: 'PF-2026-0106', studentId: 'ST-1001', studentName: 'Aditi Sharma', email: 'aditi@example.com', course: 'JEE', category: 'Mains', item: 'Constitutional Framework', itemType: 'Note', amount: 79, date: '28 Jul 2026', status: 'Paid', paymentId: 'pay_PF106JEE', paymentMethod: 'UPI' },
  { id: 'PF-2026-0105', studentId: 'ST-1003', studentName: 'Meera Nair', email: 'meera@example.com', course: 'NEET', category: 'UG', item: 'NEET Biology Master Pack', itemType: 'Package', amount: 1499, date: '27 Jul 2026', status: 'Paid', paymentId: 'pay_PF105NEET', paymentMethod: 'Debit card' },
  { id: 'PF-2026-0104', studentId: 'ST-1004', studentName: 'Arjun Patel', email: 'arjun@example.com', course: 'JEE', category: 'Advanced', item: 'National Movement', itemType: 'Note', amount: 99, date: '25 Jul 2026', status: 'Paid', paymentId: 'pay_PF104JEE', paymentMethod: 'Net banking' },
  { id: 'PF-2026-0103', studentId: 'ST-1005', studentName: 'Nisha Gupta', email: 'nisha@example.com', course: 'CA', category: 'Foundation', item: 'CA Foundation Starter', itemType: 'Package', amount: 699, date: '23 Jul 2026', status: 'Paid', paymentId: 'pay_PF103CA', paymentMethod: 'UPI' },
  { id: 'PF-2026-0102', studentId: 'ST-1006', studentName: 'Vikram Rao', email: 'vikram@example.com', course: 'NEET', category: 'UG', item: 'Physiographic Divisions', itemType: 'Note', amount: 59, date: '20 Jul 2026', status: 'Paid', paymentId: 'pay_PF102NEET', paymentMethod: 'UPI' },
  { id: 'PF-2026-0101', studentId: 'ST-1002', studentName: 'Rahul Menon', email: 'rahul@example.com', course: 'CA', category: 'Intermediate', item: 'CA Intermediate Revision Pack', itemType: 'Package', amount: 899, date: '18 Jul 2026', status: 'Paid', paymentId: 'pay_PF101CA', paymentMethod: 'Credit card' },
];

export const paidNotes: PaidNote[] = [
  { id: 'constitutional-framework', title: 'Constitutional Framework', subject: 'Indian Polity', course: 'JEE', category: 'Mains', pages: 29, price: 79 },
  { id: 'fundamental-rights', title: 'Fundamental Rights', subject: 'Indian Polity', course: 'JEE', category: 'Advanced', pages: 42, price: 79 },
  { id: 'national-movement', title: 'National Movement', subject: 'Modern History', course: 'JEE', category: 'Mains', pages: 58, price: 99 },
  { id: 'corporate-law', title: 'Corporate Law Essentials', subject: 'Corporate Law', course: 'CA', category: 'Intermediate', pages: 64, price: 129 },
  { id: 'human-physiology', title: 'Human Physiology', subject: 'Biology', course: 'NEET', category: 'UG', pages: 76, price: 119 },
  { id: 'organic-chemistry', title: 'Organic Chemistry Reactions', subject: 'Chemistry', course: 'NEET', category: 'UG', pages: 51, price: 89 },
];

export const paidPackages: PaidPackage[] = [
  { id: 'jee-mains-complete', title: 'JEE Mains Complete Pack', course: 'JEE', category: 'Mains', lessonCount: 24, price: 1299 },
  { id: 'ca-intermediate-revision', title: 'CA Intermediate Revision Pack', course: 'CA', category: 'Intermediate', lessonCount: 18, price: 899 },
  { id: 'neet-biology-master', title: 'NEET Biology Master Pack', course: 'NEET', category: 'UG', lessonCount: 31, price: 1499 },
];

export const adminCoupons = [
  { id: 'CP-01', code: 'PRELIMS10', kind: 'Percentage', value: 10, status: 'Active' as const, redemptions: 18, expiresOn: '31 Aug 2026' },
  { id: 'CP-02', code: 'POLITY50', kind: 'Flat', value: 50, status: 'Disabled' as const, redemptions: 7, expiresOn: '15 Aug 2026' },
];

export function formatInr(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

export function ordersForStudent(studentId: string) {
  return adminOrders.filter((order) => order.studentId === studentId);
}
