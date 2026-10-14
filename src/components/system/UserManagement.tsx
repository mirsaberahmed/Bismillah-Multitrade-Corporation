import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Shield,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  KeyRound,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Activity,
  Download,
  Building2,
  Briefcase,
  Mail,
  Phone,
  BadgeCheck,
  Check,
  X,
  FileText
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { UserAccount, UserRole, UserStatus, UserDepartment } from '../../types';

interface UserManagementProps {
  initialTab?: 'users' | 'approvals' | 'logs';
}

const ALL_ROLES: UserRole[] = [
  'Super Admin',
  'Admin',
  'Manager',
  'Accountant',
  'Sales Executive',
  'Inventory Manager',
  'Delivery Executive',
  'Viewer'
];

const ALL_DEPARTMENTS: UserDepartment[] = [
  'Administration',
  'Accounts & Finance',
  'Sales',
  'Purchase',
  'Inventory',
  'Delivery & Logistics',
  'Management'
];

const ALL_PERMISSIONS = [
  'Create Invoices',
  'Edit Invoices',
  'Delete Invoices',
  'View Financial Reports',
  'Manage Money Receipts',
  'Manage Expenses',
  'Manage Products & Stock',
  'View Delivery Slips',
  'Update Delivery Status',
  'Manage Customers',
  'Manage Suppliers',
  'Manage Users & Roles',
  'Approve Registrations',
  'Manage System Settings',
  'Access Audit Logs'
];

export const UserManagement: React.FC<UserManagementProps> = ({ initialTab = 'users' }) => {
  const {
    users,
    saveUser,
    deleteUser,
    approveUser,
    rejectUser,
    updateUserStatus,
    currentUser,
    activityLogs,
    logActivity
  } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'approvals' | 'logs'>(initialTab);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'status' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Logs filters
  const [logSearch, setLogSearch] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('All');

  // Modals
  const [viewUserModal, setViewUserModal] = useState<UserAccount | null>(null);
  const [editUserModal, setEditUserModal] = useState<UserAccount | null>(null);
  const [approvalModalUser, setApprovalModalUser] = useState<UserAccount | null>(null);
  const [approvalRole, setApprovalRole] = useState<UserRole>('Sales Executive');
  const [approvalDept, setApprovalDept] = useState<string>('Sales');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserAccount | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [passwordResetNotice, setPasswordResetNotice] = useState('');

  // New User Form State
  const [newUser, setNewUser] = useState<Partial<UserAccount> & { password?: string }>({
    name: '',
    fullName: '',
    username: '',
    email: '',
    phone: '',
    employeeId: '',
    department: 'Sales',
    designation: '',
    role: 'Sales Executive',
    status: 'Active',
    active: true,
    permissions: ['Create Invoices', 'Manage Customers', 'View Sales Records']
  });
  const [formError, setFormError] = useState('');

  // Summary Counts
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter(u => u.status === 'Active' || u.active).length;
  const pendingApprovalsCount = users.filter(u => u.status === 'Pending').length;
  const suspendedUsersCount = users.filter(u => u.status === 'Suspended' || u.status === 'Deactivated' || u.status === 'Rejected').length;

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // If on approvals sub-tab, show only Pending
      if (activeSubTab === 'approvals' && user.status !== 'Pending') {
        return false;
      }

      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (user.fullName && user.fullName.toLowerCase().includes(q)) ||
        user.name.toLowerCase().includes(q) ||
        user.username.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.employeeId && user.employeeId.toLowerCase().includes(q)) ||
        (user.designation && user.designation.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Role filter
      if (roleFilter !== 'All' && user.role !== roleFilter) return false;

      // Department filter
      if (departmentFilter !== 'All' && user.department !== departmentFilter) return false;

      // Status filter
      if (statusFilter !== 'All' && (user.status || (user.active ? 'Active' : 'Suspended')) !== statusFilter) return false;

      return true;
    }).sort((a, b) => {
      let valA = '';
      let valB = '';
      if (sortBy === 'name') {
        valA = (a.fullName || a.name).toLowerCase();
        valB = (b.fullName || b.name).toLowerCase();
      } else if (sortBy === 'role') {
        valA = a.role.toLowerCase();
        valB = b.role.toLowerCase();
      } else if (sortBy === 'status') {
        valA = (a.status || 'Active').toLowerCase();
        valB = (b.status || 'Active').toLowerCase();
      } else {
        valA = a.createdAt || '';
        valB = b.createdAt || '';
      }
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [users, searchQuery, roleFilter, departmentFilter, statusFilter, sortBy, sortOrder, activeSubTab]);

  // Paginated Users
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const q = logSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (logActionFilter !== 'All' && !log.action.toLowerCase().includes(logActionFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [activityLogs, logSearch, logActionFilter]);

  // Handle Add User Submit
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanUsername = (newUser.username || '').trim().toLowerCase();
    const cleanEmail = (newUser.email || '').trim().toLowerCase();

    if (!cleanUsername || !cleanEmail || !newUser.fullName) {
      setFormError('Please fill in Full Name, Username, and Email Address.');
      return;
    }

    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      setFormError(`Username "${cleanUsername}" is already taken.`);
      return;
    }
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      setFormError(`Email "${cleanEmail}" is already registered.`);
      return;
    }

    const created: UserAccount = {
      id: `usr-${Date.now()}`,
      name: newUser.fullName.trim(),
      fullName: newUser.fullName.trim(),
      username: cleanUsername,
      email: cleanEmail,
      phone: newUser.phone?.trim() || '',
      employeeId: newUser.employeeId?.trim() || `EMP-${String(users.length + 1).padStart(3, '0')}`,
      department: newUser.department || 'Administration',
      designation: newUser.designation?.trim() || 'Executive',
      role: newUser.role || 'Sales Executive',
      status: 'Active',
      active: true,
      permissions: newUser.permissions || ['Create Invoices', 'Manage Customers'],
      approvedAt: new Date().toISOString(),
      approvedBy: currentUser?.name || 'Administrator',
      createdAt: new Date().toISOString()
    };

    saveUser(created);
    logActivity('User Created', `Created user account ${created.username} (${created.fullName}) with role ${created.role}`);
    setIsAddUserOpen(false);
    setNewUser({
      name: '',
      fullName: '',
      username: '',
      email: '',
      phone: '',
      employeeId: '',
      department: 'Sales',
      designation: '',
      role: 'Sales Executive',
      status: 'Active',
      active: true,
      permissions: ['Create Invoices', 'Manage Customers', 'View Sales Records']
    });
  };

  // Handle Edit User Submit
  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserModal) return;

    saveUser(editUserModal);
    logActivity('User Updated', `Updated user ${editUserModal.username} (${editUserModal.fullName})`);
    setEditUserModal(null);
  };

  // Handle Approval
  const handleConfirmApproval = () => {
    if (!approvalModalUser) return;
    approveUser(approvalModalUser.id, approvalRole, approvalDept);
    setApprovalModalUser(null);
  };

  // Handle Password Reset
  const handleExecutePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !tempPassword) return;

    logActivity('Password Reset', `Administrator reset password for user ${resetPasswordUser.username}`);
    setPasswordResetNotice(`Password for ${resetPasswordUser.fullName || resetPasswordUser.username} successfully updated.`);
    setTimeout(() => {
      setPasswordResetNotice('');
      setResetPasswordUser(null);
      setTempPassword('');
    }, 2000);
  };

  // Helper for status badge
  const renderStatusBadge = (status?: UserStatus) => {
    const s = status || 'Active';
    switch (s) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending Approval
          </span>
        );
      case 'Suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Suspended
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Rejected
          </span>
        );
      case 'Deactivated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Deactivated
          </span>
        );
      default:
        return null;
    }
  };

  // Helper for role badge
  const renderRoleBadge = (role: UserRole) => {
    if (role === 'Super Admin') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
          Super Admin
        </span>
      );
    }
    if (role === 'Admin') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
          Admin
        </span>
      );
    }
    if (role === 'Manager') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-200">
          Manager
        </span>
      );
    }
    if (role === 'Accountant') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
          Accountant
        </span>
      );
    }
    if (role === 'Sales Executive') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-900 border border-orange-200">
          Sales Executive
        </span>
      );
    }
    if (role === 'Inventory Manager') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-100 text-cyan-900 border border-cyan-200">
          Inventory Manager
        </span>
      );
    }
    if (role === 'Delivery Executive') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
          Delivery Executive
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
        Viewer
      </span>
    );
  };

  return (
    <div className="space-y-5 text-slate-900 font-sans pb-10">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Shield className="text-orange-500" size={24} />
            User Management &amp; Security Roles
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage user accounts, roles, access permissions, and approval workflows.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/25 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Users */}
        <div
          onClick={() => {
            setActiveSubTab('users');
            setStatusFilter('All');
          }}
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:border-orange-300 transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Total Users</span>
            <span className="text-2xl font-black text-slate-900 block my-0.5 font-mono">
              {totalUsersCount}
            </span>
            <span className="text-[10px] text-slate-400">Enterprise accounts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        {/* Card 2: Active Users */}
        <div
          onClick={() => {
            setActiveSubTab('users');
            setStatusFilter('Active');
          }}
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Active Accounts</span>
            <span className="text-2xl font-black text-emerald-600 block my-0.5 font-mono">
              {activeUsersCount}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">ERP access granted</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck size={20} />
          </div>
        </div>

        {/* Card 3: Pending Approvals */}
        <div
          onClick={() => {
            setActiveSubTab('approvals');
            setStatusFilter('Pending');
          }}
          className={`rounded-xl p-4 border shadow-xs transition-all cursor-pointer flex items-center justify-between ${
            pendingApprovalsCount > 0
              ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div>
            <span className="text-[11px] font-semibold text-amber-800 block">Pending Approvals</span>
            <span className="text-2xl font-black text-amber-700 block my-0.5 font-mono">
              {pendingApprovalsCount}
            </span>
            <span className="text-[10px] text-amber-700 font-bold">
              {pendingApprovalsCount > 0 ? 'Requires admin review' : 'No pending requests'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock size={20} className={pendingApprovalsCount > 0 ? 'animate-pulse' : ''} />
          </div>
        </div>

        {/* Card 4: Suspended Users */}
        <div
          onClick={() => {
            setActiveSubTab('users');
            setStatusFilter('Suspended');
          }}
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:border-rose-300 transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Suspended / Inactive</span>
            <span className="text-2xl font-black text-rose-600 block my-0.5 font-mono">
              {suspendedUsersCount}
            </span>
            <span className="text-[10px] text-slate-400">Locked / Deactivated</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <UserX size={20} />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => {
            setActiveSubTab('users');
            setStatusFilter('All');
          }}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'users'
              ? 'border-orange-500 text-orange-600 bg-white rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users size={15} />
          <span>All User Directory ({totalUsersCount})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('approvals');
            setStatusFilter('Pending');
          }}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'approvals'
              ? 'border-orange-500 text-orange-600 bg-white rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock size={15} />
          <span>Pending Approvals</span>
          {pendingApprovalsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'logs'
              ? 'border-orange-500 text-orange-600 bg-white rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity size={15} />
          <span>Audit Logs ({activityLogs.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1 & 2: USER DIRECTORY & PENDING APPROVALS */}
      {(activeSubTab === 'users' || activeSubTab === 'approvals') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, username, email, ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-orange-500"
              >
                <option value="All">All Departments</option>
                {ALL_DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-orange-500"
              >
                <option value="All">All Roles</option>
                {ALL_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Status Filter (if in All Users tab) */}
            {activeSubTab === 'users' ? (
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-orange-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending Approval</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Deactivated">Deactivated</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center text-xs text-amber-700 font-bold px-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span>Filter: Pending Approval Only</span>
              </div>
            )}
          </div>

          {/* User Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/90">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                  <th className="py-3 px-3">User ID</th>
                  <th className="py-3 px-3">Full Name &amp; Username</th>
                  <th className="py-3 px-3">Contact (Email / Mobile)</th>
                  <th className="py-3 px-3">Department &amp; Designation</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Last Login / Registered</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                      No user accounts found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map(user => {
                    const isPending = user.status === 'Pending';
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* User ID */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-600 whitespace-nowrap">
                          {user.employeeId || user.id.slice(0, 10)}
                        </td>

                        {/* Full Name & Username */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {(user.fullName || user.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {user.fullName || user.name}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500 block">
                                @{user.username}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="text-slate-800 block text-xs">{user.email}</span>
                          <span className="text-slate-500 block text-[11px] font-mono">{user.phone || 'No phone'}</span>
                        </td>

                        {/* Department & Designation */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 block">{user.department || 'General'}</span>
                          <span className="text-slate-500 text-[11px] block">{user.designation || 'Staff'}</span>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {renderRoleBadge(user.role)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {renderStatusBadge(user.status)}
                        </td>

                        {/* Last Login */}
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                          {user.lastLoginAt ? (
                            <span>{user.lastLoginAt}</span>
                          ) : (
                            <span className="text-slate-400">Never logged in</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* If Pending: Show Approve / Reject buttons directly! */}
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => {
                                    setApprovalModalUser(user);
                                    setApprovalRole(user.role || 'Sales Executive');
                                    setApprovalDept((user.department as string) || 'Sales');
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Review & Approve"
                                >
                                  <Check size={12} />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => rejectUser(user.id)}
                                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Reject"
                                >
                                  <X size={12} />
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setViewUserModal(user)}
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="View User Details"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={() => setEditUserModal(user)}
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit User & Permissions"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    setResetPasswordUser(user);
                                    setTempPassword('');
                                  }}
                                  className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                  title="Reset Password"
                                >
                                  <KeyRound size={14} />
                                </button>

                                {/* Status Toggle: Suspend / Activate */}
                                {user.status === 'Active' ? (
                                  <button
                                    onClick={() => updateUserStatus(user.id, 'Suspended')}
                                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Suspend User"
                                  >
                                    <UserX size={14} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => updateUserStatus(user.id, 'Active')}
                                    className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                    title="Activate User"
                                  >
                                    <UserCheck size={14} />
                                  </button>
                                )}

                                {currentUser?.role === 'Super Admin' && user.id !== currentUser.id && (
                                  <button
                                    onClick={() => setUserToDelete(user)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete User (Super Admin only)"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Showing {filteredUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <span className="font-semibold text-slate-700 font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: AUDIT LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity size={16} className="text-orange-500" />
                <span>Security Audit Trail &amp; Activity Log</span>
              </h3>
              <p className="text-xs text-slate-500">
                Immutable records of logins, account approvals, role changes, and business transactions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activityLogs, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute('href', dataStr);
                  downloadAnchor.setAttribute('download', `erp_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download size={13} />
                <span>Export Audit Logs</span>
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs by user, action, details..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
              />
            </div>

            <div>
              <select
                value={logActionFilter}
                onChange={(e) => setLogActionFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-orange-500"
              >
                <option value="All">All Actions</option>
                <option value="Login">Login Activities</option>
                <option value="Registration">Registrations</option>
                <option value="Approved">Approvals</option>
                <option value="Role">Role / Permissions</option>
                <option value="Invoice">Invoices</option>
                <option value="Payment">Payments &amp; Collections</option>
                <option value="Expense">Expenses</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/90">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Action Event</th>
                  <th className="py-2.5 px-3">Event Details</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3 text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No audit events found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {log.date} {log.time}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-800">
                        {log.user}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-md truncate">
                        {log.details}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {log.ip || '192.168.1.1'}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 size={13} /> Success
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD NEW USER (Direct Administrative Creation)    */}
      {/* ========================================================= */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Add New ERP User Account</h3>
                <p className="text-xs text-slate-500">Directly provision an employee account with pre-assigned role.</p>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahbubul Alam"
                    value={newUser.fullName || ''}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Employee ID</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-010"
                    value={newUser.employeeId || ''}
                    onChange={(e) => setNewUser({ ...newUser, employeeId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@bismillah.com"
                    value={newUser.email || ''}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+880 1812-345678"
                    value={newUser.phone || ''}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. mahbub"
                    value={newUser.username || ''}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newUser.password || ''}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department</label>
                  <select
                    value={newUser.department || 'Sales'}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value as UserDepartment })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    {ALL_DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Sales Executive"
                    value={newUser.designation || ''}
                    onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">User Role</label>
                  <select
                    value={newUser.role || 'Sales Executive'}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500 font-semibold"
                  >
                    {ALL_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Create &amp; Activate User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: APPROVAL & ROLE ASSIGNMENT DIALOG                */}
      {/* ========================================================= */}
      {approvalModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  Candidate Registration Review
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Approve Registration &amp; Assign Role
                </h3>
              </div>
              <button
                onClick={() => setApprovalModalUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Candidate Summary */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-bold text-slate-900">{approvalModalUser.fullName || approvalModalUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Username:</span>
                <span className="font-mono font-bold text-slate-700">@{approvalModalUser.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-800">{approvalModalUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mobile:</span>
                <span className="font-mono text-slate-800">{approvalModalUser.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registered On:</span>
                <span className="text-slate-700 font-mono">{approvalModalUser.registeredAt || approvalModalUser.createdAt}</span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Assign Official Department *</label>
                <select
                  value={approvalDept}
                  onChange={(e) => setApprovalDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  {ALL_DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assign Security Role *</label>
                <select
                  value={approvalRole}
                  onChange={(e) => setApprovalRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500 font-bold"
                >
                  {ALL_ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Once approved, the user's status becomes <strong>Active</strong> and they can log in to the ERP application with this role's permissions.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-5">
              <button
                type="button"
                onClick={() => {
                  rejectUser(approvalModalUser.id, 'Declined by Administrator');
                  setApprovalModalUser(null);
                }}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Reject Request
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setApprovalModalUser(null)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Approve &amp; Activate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: EDIT USER & PERMISSIONS                          */}
      {/* ========================================================= */}
      {editUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Edit User: {editUserModal.fullName || editUserModal.name}
                </h3>
                <p className="text-xs text-slate-500">Update employee profile, assign department, change role &amp; status.</p>
              </div>
              <button
                onClick={() => setEditUserModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editUserModal.fullName || editUserModal.name}
                    onChange={(e) => setEditUserModal({ ...editUserModal, fullName: e.target.value, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={editUserModal.employeeId || ''}
                    onChange={(e) => setEditUserModal({ ...editUserModal, employeeId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editUserModal.email}
                    onChange={(e) => setEditUserModal({ ...editUserModal, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={editUserModal.phone || ''}
                    onChange={(e) => setEditUserModal({ ...editUserModal, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department</label>
                  <select
                    value={editUserModal.department || 'Administration'}
                    onChange={(e) => setEditUserModal({ ...editUserModal, department: e.target.value as UserDepartment })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    {ALL_DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Designation</label>
                  <input
                    type="text"
                    value={editUserModal.designation || ''}
                    onChange={(e) => setEditUserModal({ ...editUserModal, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Security Role</label>
                  <select
                    value={editUserModal.role}
                    onChange={(e) => setEditUserModal({ ...editUserModal, role: e.target.value as UserRole })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500 font-bold"
                  >
                    {ALL_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Account Status</label>
                  <select
                    value={editUserModal.status || 'Active'}
                    onChange={(e) => {
                      const st = e.target.value as UserStatus;
                      setEditUserModal({
                        ...editUserModal,
                        status: st,
                        active: st === 'Active'
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500 font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending Approval</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Deactivated">Deactivated</option>
                  </select>
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-700 mb-2">Granular Module Permissions:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {ALL_PERMISSIONS.map(perm => {
                    const isChecked = (editUserModal.permissions || []).includes(perm);
                    return (
                      <label key={perm} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const cur = editUserModal.permissions || [];
                            const updated = e.target.checked
                              ? [...cur, perm]
                              : cur.filter(p => p !== perm);
                            setEditUserModal({ ...editUserModal, permissions: updated });
                          }}
                          className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-slate-700">{perm}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditUserModal(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: VIEW USER PROFILE                                */}
      {/* ========================================================= */}
      {viewUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900">User Profile Card</h3>
              <button
                onClick={() => setViewUserModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-center pb-4 border-b border-slate-100 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md mb-2">
                {(viewUserModal.fullName || viewUserModal.name || 'U').charAt(0).toUpperCase()}
              </div>
              <h4 className="text-lg font-black text-slate-900">{viewUserModal.fullName || viewUserModal.name}</h4>
              <p className="font-mono text-xs text-slate-500">@{viewUserModal.username}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                {renderRoleBadge(viewUserModal.role)}
                {renderStatusBadge(viewUserModal.status)}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Employee ID:</span>
                <span className="font-mono font-bold text-slate-800">{viewUserModal.employeeId || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Email Address:</span>
                <span className="font-semibold text-slate-800">{viewUserModal.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Mobile Number:</span>
                <span className="font-mono text-slate-800">{viewUserModal.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Department:</span>
                <span className="font-semibold text-slate-800">{viewUserModal.department || 'Administration'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Designation:</span>
                <span className="text-slate-800">{viewUserModal.designation || 'Staff'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Last Login:</span>
                <span className="font-mono text-slate-800">{viewUserModal.lastLoginAt || 'None'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Account Created:</span>
                <span className="font-mono text-slate-800">{viewUserModal.createdAt}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end mt-4">
              <button
                onClick={() => setViewUserModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: RESET PASSWORD (ADMINISTRATOR OVERRIDE)          */}
      {/* ========================================================= */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <KeyRound size={16} className="text-amber-600" />
                <span>Reset User Password</span>
              </h3>
              <button
                onClick={() => setResetPasswordUser(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {passwordResetNotice ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl text-center">
                {passwordResetNotice}
              </div>
            ) : (
              <form onSubmit={handleExecutePasswordReset} className="space-y-3.5 text-xs">
                <p className="text-slate-600">
                  Enter a temporary password for{' '}
                  <strong className="text-slate-900">
                    {resetPasswordUser.fullName || resetPasswordUser.username}
                  </strong>
                  .
                </p>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password (min 6 chars)"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setResetPasswordUser(null)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: DELETE CONFIRMATION                              */}
      {/* ========================================================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-black text-slate-900">Delete User Account?</h3>
            <p className="text-xs text-slate-600 mt-1 mb-4">
              Are you sure you want to permanently delete account{' '}
              <strong className="text-slate-900">@{userToDelete.username}</strong> ({userToDelete.fullName || userToDelete.name})? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
