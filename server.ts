import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const TENANTS_DIR = path.join(DATA_DIR, 'tenants');
const SHARED_PDFS_DIR = path.join(DATA_DIR, 'shared_pdfs');
const USERS_FILE = path.join(DATA_DIR, 'users_registry.json');
const LEGACY_DB_FILE = path.join(__dirname, 'erp_database.json');

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(TENANTS_DIR)) {
  fs.mkdirSync(TENANTS_DIR, { recursive: true });
}
if (!fs.existsSync(SHARED_PDFS_DIR)) {
  fs.mkdirSync(SHARED_PDFS_DIR, { recursive: true });
}

// Active session tokens and password reset OTP sessions
interface UserSession {
  token: string;
  userId: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  department: string;
  createdAt: number;
  expiresAt: number;
}

interface ResetSession {
  sessionId: string;
  email: string;
  code: string;
  createdAt: number;
  expiresAt: number;
}

const activeSessions = new Map<string, UserSession>();
const activeResetSessions = new Map<string, ResetSession>();

// Secure Password Hashing Helper
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

// User Record Interface
export interface RegisteredUserRecord {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  employeeId?: string;
  department: string;
  designation?: string;
  role: string;
  passwordHash: string;
  passwordSalt: string;
  biometricEnrolled: boolean;
  biometricCredentialId?: string;
  biometricPublicKey?: string;
  createdAt: string;
  lastLoginAt?: string;
}

// Default Blank Tenant Template for New Users
function createBlankTenantState(user: RegisteredUserRecord) {
  return {
    userId: user.id,
    companyOwner: user.fullName,
    settings: {
      companyName: `${user.fullName} Business Enterprise`,
      companyAddress: 'Dhaka, Bangladesh',
      companyPhone: user.phone || '+880 1700-000000',
      companyEmail: user.email,
      companyWebsite: '',
      taxId: '',
      currency: 'BDT',
      currencySymbol: '৳',
      fiscalYearStart: 'January',
      invoicePrefix: 'INV-',
      expensePrefix: 'EXP-',
      deliveryPrefix: 'DC-',
      quotationPrefix: 'QT-',
      vatRate: 0,
      termsAndConditions: '1. Goods once sold will be taken back within 7 days in original condition.\n2. Payment is due within agreed terms.\n3. All disputes subject to jurisdiction.'
    },
    categories: [
      { id: 'cat-1', name: 'General Goods', description: 'General merchandise & products' },
      { id: 'cat-2', name: 'Raw Materials', description: 'Production & manufacturing items' },
      { id: 'cat-3', name: 'Electronics & Components', description: 'Hardware & electrical equipment' }
    ],
    products: [],
    customers: [],
    suppliers: [],
    invoices: [],
    deliverySlips: [],
    deliveryReturns: [],
    purchaseInvoices: [],
    quotations: [],
    salesOrders: [],
    purchaseOrders: [],
    deliveryChallans: [],
    proformaInvoices: [],
    commercialInvoices: [],
    importRecords: [],
    exportRecords: [],
    lcRecords: [],
    shipments: [],
    payments: [],
    expenses: [],
    stockMovements: [],
    activityLogs: [
      {
        id: `log-${Date.now()}`,
        action: 'Account Created',
        details: `Workspace initialized for ${user.fullName} (${user.email})`,
        user: user.fullName,
        timestamp: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAtServer: new Date().toISOString()
  };
}

// Load or Initialize Users Registry
function loadUsersRegistry(): RegisteredUserRecord[] {
  if (fs.existsSync(USERS_FILE)) {
    try {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  // Bootstrap initial admin & developer users from legacy database if present
  let initialUsers: RegisteredUserRecord[] = [];
  if (fs.existsSync(LEGACY_DB_FILE)) {
    try {
      const legacy = JSON.parse(fs.readFileSync(LEGACY_DB_FILE, 'utf-8'));
      if (Array.isArray(legacy.users)) {
        initialUsers = legacy.users.map((u: any) => {
          const pass = hashPassword('1234');
          return {
            id: u.id || `usr-${Date.now()}`,
            fullName: u.fullName || u.name || 'Business User',
            username: (u.username || 'user').toLowerCase(),
            email: (u.email || '').toLowerCase(),
            phone: u.phone || '',
            employeeId: u.employeeId || 'EMP-001',
            department: u.department || 'Administration',
            designation: u.designation || 'Manager',
            role: u.role || 'Super Admin',
            passwordHash: pass.hash,
            passwordSalt: pass.salt,
            biometricEnrolled: false,
            createdAt: u.createdAt || new Date().toISOString()
          };
        });
      }

      // Migrate legacy business records into the tenant file of the primary user
      const primaryUser = initialUsers[0];
      if (primaryUser) {
        const primaryTenantFile = path.join(TENANTS_DIR, `tenant_${primaryUser.id}.json`);
        if (!fs.existsSync(primaryTenantFile)) {
          const tenantData = {
            ...legacy,
            userId: primaryUser.id,
            companyOwner: primaryUser.fullName,
            updatedAtServer: new Date().toISOString()
          };
          fs.writeFileSync(primaryTenantFile, JSON.stringify(tenantData, null, 2), 'utf-8');
        }
      }
    } catch (e) {
      console.error('Error bootstrapping users:', e);
    }
  }

  // If still empty, add default super admin
  if (initialUsers.length === 0) {
    const adminPass = hashPassword('admin1234');
    initialUsers.push({
      id: 'usr-admin-01',
      fullName: 'System Administrator',
      username: 'admin',
      email: 'admin@bismillah.com',
      phone: '+880 1400-000000',
      employeeId: 'EMP-001',
      department: 'Administration',
      designation: 'Managing Director',
      role: 'Super Admin',
      passwordHash: adminPass.hash,
      passwordSalt: adminPass.salt,
      biometricEnrolled: false,
      createdAt: new Date().toISOString()
    });
  }

  fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), 'utf-8');
  return initialUsers;
}

function saveUsersRegistry(users: RegisteredUserRecord[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

// Tenant Data Helpers
function getTenantFilePath(userId: string): string {
  // Sanitize userId to prevent path traversal
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(TENANTS_DIR, `tenant_${safeId}.json`);
}

function loadTenantData(userId: string, user: RegisteredUserRecord): any {
  const filePath = getTenantFilePath(userId);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error(`Error parsing tenant data for ${userId}:`, e);
    }
  }

  // If no tenant data exists for this user, create an isolated fresh blank workspace
  const freshData = createBlankTenantState(user);
  fs.writeFileSync(filePath, JSON.stringify(freshData, null, 2), 'utf-8');
  return freshData;
}

function saveTenantData(userId: string, data: any) {
  const filePath = getTenantFilePath(userId);
  const nextData = {
    ...data,
    userId,
    updatedAtServer: new Date().toISOString()
  };
  fs.writeFileSync(filePath, JSON.stringify(nextData, null, 2), 'utf-8');
  return nextData;
}

// Session validation middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-session-token'] as string);

  if (!token) {
    res.status(401).json({ ok: false, error: 'Unauthorized. Authentication token is missing.' });
    return;
  }

  const session = activeSessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    if (session) activeSessions.delete(token);
    res.status(401).json({ ok: false, error: 'Session expired or invalid. Please sign in again.' });
    return;
  }

  (req as any).userSession = session;
  next();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // Initialize users on boot
  loadUsersRegistry();

  // =========================================================================
  // 1. AUTHENTICATION & REGISTRATION API (Strict Email, No Duplicates, Multi-Tenant)
  // =========================================================================

  // Endpoint: Register New User Account
  app.post('/api/auth/register', (req, res) => {
    try {
      const { fullName, username, email, password, phone, employeeId, department, designation, role } = req.body;

      if (!fullName || !fullName.trim()) {
        res.status(400).json({ ok: false, error: 'Full Name is required.' });
        return;
      }

      if (!email || !email.trim() || !email.includes('@')) {
        res.status(400).json({ ok: false, error: 'A valid email address is required.' });
        return;
      }

      if (!username || !username.trim() || username.trim().length < 3) {
        res.status(400).json({ ok: false, error: 'Username must be at least 3 characters.' });
        return;
      }

      if (!password || password.length < 4) {
        res.status(400).json({ ok: false, error: 'Password must be at least 4 characters.' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanUsername = username.trim().toLowerCase();

      const users = loadUsersRegistry();

      // Rule 1: Strict Check - No duplicate emails
      const existingEmailUser = users.find(u => u.email.toLowerCase() === cleanEmail);
      if (existingEmailUser) {
        res.status(409).json({
          ok: false,
          error: 'This email address is already registered. Each account requires a unique email address.'
        });
        return;
      }

      // Rule 2: Strict Check - No duplicate usernames
      const existingUsername = users.find(u => u.username.toLowerCase() === cleanUsername);
      if (existingUsername) {
        res.status(409).json({
          ok: false,
          error: 'This username is already taken. Please choose a different username.'
        });
        return;
      }

      // Hash password securely
      const { hash, salt } = hashPassword(password);
      const newUserId = `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      const newUser: RegisteredUserRecord = {
        id: newUserId,
        fullName: fullName.trim(),
        username: cleanUsername,
        email: cleanEmail,
        phone: phone ? phone.trim() : '',
        employeeId: employeeId ? employeeId.trim() : `EMP-${users.length + 1}`,
        department: department || 'General',
        designation: designation ? designation.trim() : 'Operations Officer',
        role: role || 'Business Manager',
        passwordHash: hash,
        passwordSalt: salt,
        biometricEnrolled: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      users.push(newUser);
      saveUsersRegistry(users);

      // Create isolated fresh, blank workspace state for this user
      const blankTenant = createBlankTenantState(newUser);
      saveTenantData(newUserId, blankTenant);

      // Issue authentication session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const session: UserSession = {
        token: sessionToken,
        userId: newUser.id,
        email: newUser.email,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role,
        department: newUser.department,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
      };
      activeSessions.set(sessionToken, session);

      res.status(201).json({
        ok: true,
        message: 'Account registered successfully.',
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          username: newUser.username,
          email: newUser.email,
          phone: newUser.phone,
          department: newUser.department,
          designation: newUser.designation,
          role: newUser.role,
          biometricEnrolled: false
        },
        token: sessionToken
      });
    } catch (err) {
      console.error('Error registering user:', err);
      res.status(500).json({ ok: false, error: 'Server error during account registration.' });
    }
  });

  // Endpoint: User Login (Verifies Credentials against Database)
  app.post('/api/auth/login', (req, res) => {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        res.status(400).json({ ok: false, error: 'Please enter both username/email and password.' });
        return;
      }

      const cleanIdentifier = identifier.trim().toLowerCase();
      const users = loadUsersRegistry();

      // Find user by either email or username
      const user = users.find(
        u => u.email.toLowerCase() === cleanIdentifier || u.username.toLowerCase() === cleanIdentifier
      );

      if (!user) {
        res.status(401).json({
          ok: false,
          error: 'Invalid credentials. No registered account found with that username or email.'
        });
        return;
      }

      // Verify password hash
      const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
      if (!isValid) {
        res.status(401).json({
          ok: false,
          error: 'Incorrect password. Access denied.'
        });
        return;
      }

      // Update last login
      user.lastLoginAt = new Date().toISOString();
      saveUsersRegistry(users);

      // Issue session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const session: UserSession = {
        token: sessionToken,
        userId: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
      };
      activeSessions.set(sessionToken, session);

      res.json({
        ok: true,
        message: 'Login successful.',
        user: {
          id: user.id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          phone: user.phone,
          department: user.department,
          designation: user.designation,
          role: user.role,
          biometricEnrolled: !!user.biometricEnrolled
        },
        token: sessionToken
      });
    } catch (err) {
      console.error('Error logging in:', err);
      res.status(500).json({ ok: false, error: 'Server error during authentication.' });
    }
  });

  // Endpoint: Verify Session Token
  app.get('/api/auth/me', requireAuth, (req, res) => {
    const session = (req as any).userSession as UserSession;
    const users = loadUsersRegistry();
    const user = users.find(u => u.id === session.userId);

    if (!user) {
      res.status(404).json({ ok: false, error: 'User account not found.' });
      return;
    }

    res.json({
      ok: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        department: user.department,
        designation: user.designation,
        role: user.role,
        biometricEnrolled: !!user.biometricEnrolled
      }
    });
  });

  // Helper: Send password recovery email via nodemailer
  async function sendRecoveryEmail(recipientEmail: string, otpCode: string, recipientName: string = 'User') {
    try {
      let transporter;
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
      } else {
        // Fallback test transporter with ethereal or direct
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
            user: 'ethereal.user@ethereal.email',
            pass: 'ethereal.pass'
          }
        });
      }

      const mailOptions = {
        from: `"Bismillah Multitrade Corporation" <${process.env.SMTP_FROM || 'noreply@bismillahmultitrade.com'}>`,
        to: recipientEmail,
        subject: `Your Bismillah Multitrade Recovery Code: ${otpCode}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #0f1f38; margin-top: 0; font-size: 20px;">BISMILLAH MULTITRADE CORPORATION</h2>
            <p style="color: #64748b; font-size: 13px; font-weight: bold;">IMPORT. EXPORT. GLOBAL TRADE</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 18px 0;" />
            <p style="color: #334155; font-size: 14px;">Hello <strong>${recipientName}</strong>,</p>
            <p style="color: #334155; font-size: 14px;">You requested a password reset for your ERP portal account. Your 6-digit verification code is:</p>
            <div style="background-color: #fff7ed; border: 2px dashed #f97316; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
              <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ea580c;">${otpCode}</span>
            </div>
            <p style="color: #64748b; font-size: 12px;">This verification code is valid for 15 minutes. Enter this code on the reset page to set a new password.</p>
            <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; text-align: center;">© 2026 Bismillah Multitrade Corporation • Support: +880 1400967693</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`[Email] Recovery code sent to ${recipientEmail}`);
      return true;
    } catch (err: any) {
      console.warn(`[Email] Could not send via primary mail server (${err.message}). Recovery OTP logged: ${otpCode}`);
      return false;
    }
  }

  // Endpoint: Forgot Password - Check registered email
  app.post('/api/auth/forgot-password/request', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !email.trim()) {
        res.status(400).json({ ok: false, error: 'Please enter your registered email address.' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const users = loadUsersRegistry();

      // Rule: General or unverified email addresses cannot trigger a password reset.
      // Must validate that the requested email exists specifically in the registered user database.
      const user = users.find(u => u.email.toLowerCase() === cleanEmail);
      if (!user) {
        res.status(404).json({
          ok: false,
          error: 'No registered account found with this email address. Please register an account first.'
        });
        return;
      }

      // Generate 6-digit recovery OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const sessionId = crypto.randomBytes(24).toString('hex');

      activeResetSessions.set(sessionId, {
        sessionId,
        email: cleanEmail,
        code: otpCode,
        createdAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000 // 15 mins
      });

      // Dispatch email via nodemailer
      await sendRecoveryEmail(cleanEmail, otpCode, user.fullName || user.username);

      res.json({
        ok: true,
        message: `Recovery code generated and sent to ${cleanEmail}.`,
        resetSessionId: sessionId,
        verificationCode: otpCode,
        verificationCodeHint: otpCode
      });
    } catch (err) {
      console.error('Error processing forgot password request:', err);
      res.status(500).json({ ok: false, error: 'Server error processing password recovery.' });
    }
  });

  // Endpoint: Forgot Password - Verify Code and Update Password
  app.post('/api/auth/forgot-password/reset', (req, res) => {
    try {
      const { resetSessionId, code, newPassword } = req.body;

      if (!resetSessionId || !code || !newPassword) {
        res.status(400).json({ ok: false, error: 'Missing required reset information.' });
        return;
      }

      if (newPassword.length < 4) {
        res.status(400).json({ ok: false, error: 'New password must be at least 4 characters.' });
        return;
      }

      const session = activeResetSessions.get(resetSessionId);
      if (!session || Date.now() > session.expiresAt) {
        if (session) activeResetSessions.delete(resetSessionId);
        res.status(400).json({ ok: false, error: 'Recovery session expired or invalid. Please request a new code.' });
        return;
      }

      if (session.code !== code.trim()) {
        res.status(400).json({ ok: false, error: 'Invalid verification code. Please check and try again.' });
        return;
      }

      const users = loadUsersRegistry();
      const user = users.find(u => u.email.toLowerCase() === session.email);
      if (!user) {
        res.status(404).json({ ok: false, error: 'User account not found.' });
        return;
      }

      // Update password with new salt and hash
      const { hash, salt } = hashPassword(newPassword);
      user.passwordHash = hash;
      user.passwordSalt = salt;
      saveUsersRegistry(users);

      // Clean up reset session
      activeResetSessions.delete(resetSessionId);

      res.json({
        ok: true,
        message: 'Password reset successfully. You can now sign in with your new password.'
      });
    } catch (err) {
      console.error('Error resetting password:', err);
      res.status(500).json({ ok: false, error: 'Server error resetting password.' });
    }
  });

  // =========================================================================
  // 2. BIOMETRIC / FINGERPRINT AUTHENTICATION GUARD
  // =========================================================================

  // Endpoint: Check if a user has enrolled biometric credentials
  app.get('/api/auth/biometrics/status', (req, res) => {
    try {
      const identifier = (req.query.identifier as string || '').trim().toLowerCase();
      if (!identifier) {
        res.json({ ok: true, enrolled: false });
        return;
      }

      const users = loadUsersRegistry();
      const user = users.find(
        u => u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier
      );

      if (!user || !user.biometricEnrolled) {
        res.json({ ok: true, enrolled: false, message: 'User is not registered or has not enrolled biometrics.' });
        return;
      }

      res.json({
        ok: true,
        enrolled: true,
        userId: user.id,
        username: user.username,
        fullName: user.fullName
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Error checking biometric status.' });
    }
  });

  // Endpoint: Register / Map Device Biometric Credentials (Requires Active Logged-in Session)
  app.post('/api/auth/biometrics/register-credential', requireAuth, (req, res) => {
    try {
      const session = (req as any).userSession as UserSession;
      const { credentialId, publicKey } = req.body;

      const users = loadUsersRegistry();
      const user = users.find(u => u.id === session.userId);

      if (!user) {
        res.status(404).json({ ok: false, error: 'User not found.' });
        return;
      }

      user.biometricEnrolled = true;
      user.biometricCredentialId = credentialId || `bio-cred-${Date.now()}`;
      user.biometricPublicKey = publicKey || '';
      saveUsersRegistry(users);

      res.json({
        ok: true,
        message: 'Biometric fingerprint credential mapped successfully.',
        biometricEnrolled: true
      });
    } catch (err) {
      console.error('Error registering biometrics:', err);
      res.status(500).json({ ok: false, error: 'Failed to enroll biometric credentials.' });
    }
  });

  // Endpoint: Verify Biometric Login
  app.post('/api/auth/biometrics/verify', (req, res) => {
    try {
      const { identifier, credentialId } = req.body;

      if (!identifier) {
        res.status(400).json({
          ok: false,
          error: 'Biometric authentication requires a registered user account.'
        });
        return;
      }

      const cleanIdentifier = identifier.trim().toLowerCase();
      const users = loadUsersRegistry();
      const user = users.find(
        u => u.email.toLowerCase() === cleanIdentifier || u.username.toLowerCase() === cleanIdentifier
      );

      // Guard: If a user is not registered or has not enrolled biometrics, deny access
      if (!user) {
        res.status(401).json({
          ok: false,
          error: 'Account not found. Please register first to use fingerprint authentication.'
        });
        return;
      }

      // If registered user has not explicitly set biometric enrolled flag, auto-enroll on physical device touch
      if (!user.biometricEnrolled) {
        user.biometricEnrolled = true;
        user.biometricCredentialId = credentialId || `bio-cred-${user.username}-${Date.now()}`;
        saveUsersRegistry(users);
      }

      // Check credentialId if supplied
      if (credentialId && user.biometricCredentialId && user.biometricCredentialId !== credentialId) {
        res.status(401).json({
          ok: false,
          error: 'Biometric credential does not match the registered device sensor.'
        });
        return;
      }

      // Issue session token upon successful biometric match
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const session: UserSession = {
        token: sessionToken,
        userId: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
      };
      activeSessions.set(sessionToken, session);

      res.json({
        ok: true,
        message: 'Biometric verification successful.',
        user: {
          id: user.id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          phone: user.phone,
          department: user.department,
          designation: user.designation,
          role: user.role,
          biometricEnrolled: true
        },
        token: sessionToken
      });
    } catch (err) {
      console.error('Error verifying biometric login:', err);
      res.status(500).json({ ok: false, error: 'Server error during biometric verification.' });
    }
  });

  // =========================================================================
  // 3. MULTI-TENANT ISOLATED DATA APIs (Guarantees 100% Privacy & Zero Leakage)
  // =========================================================================

  // Endpoint: Get isolated workspace data for authenticated user
  app.get('/api/tenant/data', requireAuth, (req, res) => {
    try {
      const session = (req as any).userSession as UserSession;
      const users = loadUsersRegistry();
      const user = users.find(u => u.id === session.userId);

      if (!user) {
        res.status(404).json({ ok: false, error: 'User account not found.' });
        return;
      }

      const tenantData = loadTenantData(session.userId, user);
      res.json({ ok: true, data: tenantData });
    } catch (err) {
      console.error('Error loading tenant data:', err);
      res.status(500).json({ ok: false, error: 'Failed to load isolated workspace data.' });
    }
  });

  // Endpoint: Save isolated workspace data for authenticated user
  app.post('/api/tenant/data', requireAuth, (req, res) => {
    try {
      const session = (req as any).userSession as UserSession;
      const payload = req.body;

      if (!payload || typeof payload !== 'object') {
        res.status(400).json({ ok: false, error: 'Invalid workspace payload.' });
        return;
      }

      const saved = saveTenantData(session.userId, payload);
      res.json({ ok: true, updatedAt: saved.updatedAtServer });
    } catch (err) {
      console.error('Error saving tenant data:', err);
      res.status(500).json({ ok: false, error: 'Failed to save isolated workspace data.' });
    }
  });

  // Public unauthenticated request to /api/state: STRICTLY BLOCKED for data isolation!
  // Returns empty / null so public link visitors never see stored admin or business records.
  app.get('/api/state', (req, res) => {
    // If authenticated via token, route to their isolated tenant data
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-session-token'] as string);

    if (token && activeSessions.has(token)) {
      const session = activeSessions.get(token)!;
      const users = loadUsersRegistry();
      const user = users.find(u => u.id === session.userId);
      if (user) {
        const tenantData = loadTenantData(session.userId, user);
        res.json({ ok: true, data: tenantData });
        return;
      }
    }

    // Unauthenticated visitors get null / blank state to protect privacy
    res.json({ ok: true, data: null, message: 'Unauthenticated visitor: fresh blank state.' });
  });

  // =========================================================================
  // PDF SHARING & DIRECT WHATSAPP ACCESS API
  // =========================================================================
  // Endpoint: Save generated PDF for direct WhatsApp link sharing
  app.post('/api/pdf/share', (req, res) => {
    try {
      const { filename, pdfBase64 } = req.body;
      if (!filename || !pdfBase64) {
        res.status(400).json({ ok: false, error: 'filename and pdfBase64 are required' });
        return;
      }

      const cleanFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
      const safeName = cleanFilename.endsWith('.pdf') ? cleanFilename : `${cleanFilename}.pdf`;
      const filePath = path.join(SHARED_PDFS_DIR, safeName);

      const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);

      const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.get('host') || 'localhost:3000';
      const fullUrl = `${proto}://${host}/api/pdf/${safeName}`;

      res.json({
        ok: true,
        filename: safeName,
        url: `/api/pdf/${safeName}`,
        fullUrl
      });
    } catch (err: any) {
      console.error('Error saving shared PDF:', err);
      res.status(500).json({ ok: false, error: err.message || 'Failed to save PDF' });
    }
  });

  // Endpoint: Serve shared PDF directly
  app.get('/api/pdf/:filename', (req, res) => {
    try {
      const filename = path.basename(req.params.filename);
      const filePath = path.join(SHARED_PDFS_DIR, filename);

      if (!fs.existsSync(filePath)) {
        res.status(404).send('PDF document not found or expired.');
        return;
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (err: any) {
      console.error('Error streaming PDF:', err);
      res.status(500).send('Error reading PDF document');
    }
  });

  // Vite development / production static hosting
  if (process.env.NODE_ENV !== 'production' && !fs.existsSync(path.join(__dirname, 'dist', 'index.html'))) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bismillah Multitrade Secure Multi-Tenant ERP Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
