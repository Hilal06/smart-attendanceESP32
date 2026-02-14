import { AttendanceRecord, AttendanceStatus, Employee, EmployeeStatus, Settings, Announcement, DaySchedule } from './types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map(day => ({
  day,
  status: (day === 'Saturday' || day === 'Sunday') ? 'Off Day' : 'Work Day',
  startTime: '09:00',
  endTime: '17:00'
}));

export const DEFAULT_SETTINGS: Settings = {
  companyName: 'Acme Corp',
  companyLogo: '',
  lateThresholdMinutes: 15,
  weeklySchedule: DEFAULT_SCHEDULE,
  language: 'en',
};

export const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard',
    employees: 'Employees',
    reports: 'Reports',
    settings: 'Settings',
    announcements: 'Announcements',
    profile: 'My Profile',
    requests: 'Requests',
    signOut: 'Sign Out',
    team: 'Team',
    present: 'Present',
    late: 'Late',
    absent: 'Absent',
    onLeave: 'On Leave',
    active: 'Active',
    terminated: 'Terminated',
    language: 'Language',
    companyName: 'Company Name',
    companyLogo: 'Company Logo',
    uploadLogo: 'Upload Logo',
    removeLogo: 'Remove',
    lateThreshold: 'Late Threshold (Minutes)',
    weeklySchedule: 'Weekly Schedule',
    saveConfiguration: 'Save Configuration',
    addEmployee: 'Add Employee',
    searchEmployees: 'Search employees...',
    allStatus: 'All Status',
    viewProfile: 'View Profile',
    askAI: 'Ask AI Insights',
    exportCSV: 'Export CSV',
    weeklyAttendanceTrend: 'Weekly Attendance Trends',
    statusDistribution: 'Status Distribution',
    detailedLogs: 'Detailed Attendance Logs',
    requestUpdate: 'Request Info Update',
    pending: 'Pending',
    resolved: 'Resolved',
    adminPortal: 'Admin Portal',
    attendanceMode: 'Attendance Mode',
    enterDashboard: 'Enter Dashboard',
    loginAsAdmin: 'Login as Admin',
    errorRequired: 'is required',
  },
  id: {
    dashboard: 'Dasbor',
    employees: 'Karyawan',
    reports: 'Laporan',
    settings: 'Pengaturan',
    announcements: 'Pengumuman',
    profile: 'Profil Saya',
    requests: 'Permintaan',
    signOut: 'Keluar',
    team: 'Tim',
    present: 'Hadir',
    late: 'Terlambat',
    absent: 'Absen',
    onLeave: 'Cuti',
    active: 'Aktif',
    terminated: 'Diberhentikan',
    language: 'Bahasa',
    companyName: 'Nama Perusahaan',
    companyLogo: 'Logo Perusahaan',
    uploadLogo: 'Unggah Logo',
    removeLogo: 'Hapus',
    lateThreshold: 'Ambang Batas Terlambat (Menit)',
    weeklySchedule: 'Jadwal Mingguan',
    saveConfiguration: 'Simpan Konfigurasi',
    addEmployee: 'Tambah Karyawan',
    searchEmployees: 'Cari karyawan...',
    allStatus: 'Semua Status',
    viewProfile: 'Lihat Profil',
    askAI: 'Tanya Wawasan AI',
    exportCSV: 'Ekspor CSV',
    weeklyAttendanceTrend: 'Tren Kehadiran Mingguan',
    statusDistribution: 'Distribusi Status',
    detailedLogs: 'Log Kehadiran Rinci',
    requestUpdate: 'Minta Pembaruan Info',
    pending: 'Menunggu',
    resolved: 'Selesai',
    adminPortal: 'Portal Admin',
    attendanceMode: 'Mode Kehadiran',
    enterDashboard: 'Masuk Dasbor',
    loginAsAdmin: 'Login sebagai Admin',
    errorRequired: 'harus diisi',
  }
};

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'Office Renovation Notice',
    content: 'The 3rd-floor meeting rooms will be under renovation starting next Monday. Please book conference rooms on the 2nd floor.',
    date: '2023-10-25',
    priority: 'Normal',
  },
  {
    id: '2',
    title: 'New Health Insurance Policy',
    content: 'We have updated our health insurance provider. Please check your email for the new enrollment forms and benefits guide.',
    date: '2023-10-20',
    priority: 'High',
  },
  {
    id: '3',
    title: 'Holiday Schedule',
    content: 'The office will be closed on November 24th and 25th for the Thanksgiving holiday. Enjoy your break!',
    date: '2023-10-15',
    priority: 'Normal',
  }
];

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    role: 'Software Engineer',
    department: 'Engineering',
    avatar: 'https://picsum.photos/200/200?random=1',
    email: 'alice@example.com',
    joinDate: '2023-01-15',
    phoneNumber: '+1 (555) 123-4567',
    address: '123 Tech Lane, Silicon Valley, CA',
    status: EmployeeStatus.ACTIVE
  },
  {
    id: '2',
    name: 'Bob Smith',
    role: 'Product Manager',
    department: 'Product',
    avatar: 'https://picsum.photos/200/200?random=2',
    email: 'bob@example.com',
    joinDate: '2022-11-01',
    phoneNumber: '+1 (555) 987-6543',
    address: '456 Market St, San Francisco, CA',
    status: EmployeeStatus.ACTIVE
  },
  {
    id: '3',
    name: 'Charlie Davis',
    role: 'Designer',
    department: 'Design',
    avatar: 'https://picsum.photos/200/200?random=3',
    email: 'charlie@example.com',
    joinDate: '2023-03-10',
    phoneNumber: '+1 (555) 456-7890',
    address: '789 Creative Blvd, Austin, TX',
    status: EmployeeStatus.ACTIVE
  },
  {
    id: '4',
    name: 'Diana Evans',
    role: 'HR Specialist',
    department: 'HR',
    avatar: 'https://picsum.photos/200/200?random=4',
    email: 'diana@example.com',
    joinDate: '2021-06-20',
    phoneNumber: '+1 (555) 222-3333',
    address: '321 People Way, New York, NY',
    status: EmployeeStatus.ON_LEAVE
  },
  {
    id: '5',
    name: 'Ethan Hunt',
    role: 'Security Analyst',
    department: 'IT',
    avatar: 'https://picsum.photos/200/200?random=5',
    email: 'ethan@example.com',
    joinDate: '2023-08-01',
    phoneNumber: '+1 (555) 999-0000',
    address: '555 Secure Dr, Washington, DC',
    status: EmployeeStatus.ACTIVE
  },
];

const generateMockAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    MOCK_EMPLOYEES.forEach((emp) => {
      const rand = Math.random();
      let status = AttendanceStatus.PRESENT;
      let checkIn = '08:55';
      let checkOut = '17:05';

      if (rand > 0.9) {
        status = AttendanceStatus.ABSENT;
        checkIn = null;
        checkOut = null;
      } else if (rand > 0.8) {
        status = AttendanceStatus.ON_LEAVE;
        checkIn = null;
        checkOut = null;
      } else if (rand > 0.6) {
        status = AttendanceStatus.LATE;
        checkIn = '09:30';
        checkOut = '17:30';
      }

      records.push({
        id: `${emp.id}-${dateStr}`,
        employeeId: emp.id,
        date: dateStr,
        checkIn,
        checkOut,
        status,
      });
    });
  }
  return records;
};

export const MOCK_ATTENDANCE = generateMockAttendance();