@echo off
CHCP 65001 >nul 2>&1
SETLOCAL EnableDelayedExpansion
TITLE Website Manager + Admin CLI
mode con: cols=65 lines=35
COLOR 0B

SET "PORT=3000"
SET "PKG=pnpm"

:: ═══════════════════════════════════════════════
:: Package Manager Check
:: ═══════════════════════════════════════════════
where pnpm >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    where npm >nul 2>&1
    IF %ERRORLEVEL% NEQ 0 GOTO :NO_NODE
    SET "PKG=npm"
)

:: ═══════════════════════════════════════════════
:: System Check
:: ═══════════════════════════════════════════════
:CHECK
CLS
COLOR 0A
ECHO.
ECHO    ╔══════════════════════════════════════════╗
ECHO    ║       CHECKING SYSTEM...                 ║
ECHO    ╚══════════════════════════════════════════╝
ECHO.

node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 GOTO :NO_NODE
FOR /F "tokens=*" %%i IN ('node -v') DO SET "NVER=%%i"
ECHO    [OK] Node.js: %NVER%
ECHO    [OK] Package Manager: %PKG%

IF NOT EXIST "node_modules" (
    ECHO.
    ECHO    [..] Installing dependencies...
    CALL %PKG% install
    IF %ERRORLEVEL% NEQ 0 (
        COLOR 0C
        ECHO    [FAIL] Installation failed!
        PAUSE
        EXIT
    )
)
ECHO    [OK] Dependencies ready

IF NOT EXIST ".next" (
    ECHO.
    ECHO    [..] Building project...
    CALL %PKG% run build
    IF %ERRORLEVEL% NEQ 0 (
        COLOR 0C
        ECHO    [FAIL] Build failed!
        PAUSE
        GOTO :MENU
    )
)
ECHO    [OK] Build ready
ECHO.
ECHO    All checks passed!
TIMEOUT /T 2 >nul

:: ═══════════════════════════════════════════════
:: Main Menu
:: ═══════════════════════════════════════════════
:MENU
CLS
COLOR 0B
ECHO.
ECHO    ╔══════════════════════════════════════════════╗
ECHO    ║                                              ║
ECHO    ║   ██╗    ██╗███████╗██████╗                  ║
ECHO    ║   ██║    ██║██╔════╝██╔══██╗                 ║
ECHO    ║   ██║ █╗ ██║█████╗  ██████╔╝                 ║
ECHO    ║   ██║███╗██║██╔══╝  ██╔══██╗                 ║
ECHO    ║   ╚███╔███╔╝███████╗██████╔╝                 ║
ECHO    ║    ╚══╝╚══╝ ╚══════╝╚═════╝                  ║
ECHO    ║                                              ║
ECHO    ║   Website Manager v2.0  [%PKG%]              ║
ECHO    ║                                              ║
ECHO    ╠══════════════════════════════════════════════╣
ECHO    ║                                              ║
ECHO    ║   [1] Admin CLI (Manage Admins)              ║
ECHO    ║   [2] Start Server + Open Browser            ║
ECHO    ║   [3] Rebuild Project                        ║
ECHO    ║   [4] Clean Build + Rebuild                  ║
ECHO    ║   [5] Server (Background) + Admin CLI        ║
ECHO    ║   [0] Exit                                   ║
ECHO    ║                                              ║
ECHO    ╚══════════════════════════════════════════════╝
ECHO.
SET /P "CH=    Enter choice (0-5): "

IF "%CH%"=="1" GOTO :CLI
IF "%CH%"=="2" GOTO :SRVB
IF "%CH%"=="3" GOTO :BLD
IF "%CH%"=="4" GOTO :CBLD
IF "%CH%"=="5" GOTO :BOTH
IF "%CH%"=="0" GOTO :BYE
IF /I "%CH%"=="q" GOTO :BYE
ECHO    Invalid! Enter 0-5
TIMEOUT /T 1 >nul
GOTO :MENU

:: ═══════════════════════════════════════════════
:: [1] Admin CLI
:: ═══════════════════════════════════════════════
:CLI
CLS
COLOR 0E
ECHO.
ECHO    ╔══════════════════════════════════════════╗
ECHO    ║      LAUNCHING ADMIN CLI...              ║
ECHO    ╚══════════════════════════════════════════╝
ECHO.
cd /d "%~dp0"
node -e "const fs=require('fs');const lines=fs.readFileSync(process.argv[1],'utf8').split(/\r?\n/);let s=false;const o=[];for(const l of lines){if(s){o.push(l)}else if(l.trim()==='::JSSTART'){s=true}}fs.writeFileSync('_acli.js',o.join('\n'))" "%~f0"
IF NOT EXIST "_acli.js" (
    COLOR 0C
    ECHO    [ERROR] Failed to extract admin CLI!
    PAUSE
    GOTO :MENU
)
node "_acli.js"
IF EXIST "_acli.js" del "_acli.js" 2>nul
ECHO.
PAUSE
GOTO :MENU

:: ═══════════════════════════════════════════════
:: [2] Server + Browser
:: ═══════════════════════════════════════════════
:SRVB
CLS
COLOR 0A
ECHO.
ECHO    ╔══════════════════════════════════════════╗
ECHO    ║    SERVER + BROWSER OPENING...           ║
ECHO    ╚══════════════════════════════════════════╝
ECHO.
ECHO    Opening http://localhost:%PORT% in 3 sec...
ECHO    Press Ctrl+C to stop server
ECHO.
START /B CMD /C "TIMEOUT /T 3 >nul && START http://localhost:%PORT%"
CALL %PKG% start
PAUSE
GOTO :MENU

:: ═══════════════════════════════════════════════
:: [3] Rebuild
:: ═══════════════════════════════════════════════
:BLD
CLS
COLOR 0E
ECHO.
ECHO    Rebuilding project...
ECHO.
CALL %PKG% run build
IF %ERRORLEVEL% EQU 0 (
    COLOR 0A
    ECHO.
    ECHO    [OK] Build successful!
) ELSE (
    COLOR 0C
    ECHO.
    ECHO    [FAIL] Build failed!
)
PAUSE
GOTO :MENU

:: ═══════════════════════════════════════════════
:: [4] Clean + Rebuild
:: ═══════════════════════════════════════════════
:CBLD
CLS
COLOR 0E
ECHO.
ECHO    Cleaning and rebuilding...
ECHO.
IF EXIST ".next" (
    RMDIR /S /Q ".next"
    ECHO    [OK] .next removed
)
CALL %PKG% run build
IF %ERRORLEVEL% EQU 0 (
    COLOR 0A
    ECHO    [OK] Clean rebuild done!
) ELSE (
    COLOR 0C
    ECHO    [FAIL] Build failed!
)
PAUSE
GOTO :MENU

:: ═══════════════════════════════════════════════
:: [5] Server Background + Admin CLI
:: ═══════════════════════════════════════════════
:BOTH
CLS
COLOR 0B
ECHO.
ECHO    ╔══════════════════════════════════════════╗
ECHO    ║   SERVER (Background) + ADMIN CLI        ║
ECHO    ╚══════════════════════════════════════════╝
ECHO.
ECHO    [..] Starting server in background...
START /MIN "WebServer-%PORT%" CMD /C "%PKG% start"
ECHO    [OK] Server starting on port %PORT%
ECHO.
ECHO    [..] Waiting for server...
TIMEOUT /T 4 >nul
ECHO    [OK] Launching Admin CLI...
ECHO.

cd /d "%~dp0"
node -e "const fs=require('fs');const lines=fs.readFileSync(process.argv[1],'utf8').split(/\r?\n/);let s=false;const o=[];for(const l of lines){if(s){o.push(l)}else if(l.trim()==='::JSSTART'){s=true}}fs.writeFileSync('_acli.js',o.join('\n'))" "%~f0"
IF EXIST "_acli.js" (
    node "_acli.js"
    del "_acli.js" 2>nul
)

ECHO.
ECHO    ╔══════════════════════════════════════════╗
ECHO    ║   Admin CLI closed.                      ║
ECHO    ║   Server still running in background.    ║
ECHO    ╠══════════════════════════════════════════╣
ECHO    ║   [1] Keep server running                ║
ECHO    ║   [2] Stop server too                    ║
ECHO    ╚══════════════════════════════════════════╝
ECHO.
SET /P "SC=    Choice (1-2): "
IF "%SC%"=="2" (
    ECHO    [..] Stopping server...
    TASKKILL /FI "WINDOWTITLE eq WebServer-%PORT%*" /F >nul 2>&1
    FOR /F "tokens=5" %%P IN ('netstat -aon 2^>nul ^| findstr ":%PORT%" ^| findstr "LISTENING"') DO (
        TASKKILL /PID %%P /F >nul 2>&1
    )
    ECHO    [OK] Server stopped
)
PAUSE
GOTO :MENU

:: ═══════════════════════════════════════════════
:: No Node.js
:: ═══════════════════════════════════════════════
:NO_NODE
CLS
COLOR 0C
ECHO.
ECHO    ╔══════════════════════════════════════════╗
ECHO    ║      NODE.JS NOT FOUND!                  ║
ECHO    ╠══════════════════════════════════════════╣
ECHO    ║                                          ║
ECHO    ║   Download: https://nodejs.org/          ║
ECHO    ║   Install and restart this file.         ║
ECHO    ║                                          ║
ECHO    ╚══════════════════════════════════════════╝
ECHO.
SET /P "OPN=    Open download page? (y/n): "
IF /I "%OPN%"=="y" START https://nodejs.org/
PAUSE
EXIT

:: ═══════════════════════════════════════════════
:: Exit
:: ═══════════════════════════════════════════════
:BYE
CLS
COLOR 0B
ECHO.
ECHO    ╔══════════════════════════════════════════╗
ECHO    ║                                          ║
ECHO    ║      Goodbye! Stay secure.               ║
ECHO    ║                                          ║
ECHO    ╚══════════════════════════════════════════╝
ECHO.
TIMEOUT /T 2 >nul
EXIT

:: ═══════════════════════════════════════════════
:: Safety net - batch stops here
:: ═══════════════════════════════════════════════
GOTO :eof

::JSSTART
'use strict';

const readline = require('readline');
const fs = require('fs');
const path = require('path');
let mongoose, bcrypt;

try {
  mongoose = require('mongoose');
  bcrypt = require('bcryptjs');
} catch (e) {
  console.error('\n  Missing dependency: ' + e.message);
  console.error('  Run: npm install mongoose bcryptjs\n');
  process.exit(1);
}

// ═══════════════════════════════════════════════
// Colors
// ═══════════════════════════════════════════════
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
  white: '\x1b[37m', gray: '\x1b[90m',
  bgRed: '\x1b[41m', bgGreen: '\x1b[42m', bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m', bgCyan: '\x1b[46m',
};

// ═══════════════════════════════════════════════
// UI Helpers
// ═══════════════════════════════════════════════
function badge(text, bg, fg) {
  return (bg || '') + (fg || c.white) + c.bold + ' ' + text + ' ' + c.reset;
}

function statusDot(s) {
  return { active: c.green+'●'+c.reset, blocked: c.red+'●'+c.reset, suspended: c.yellow+'●'+c.reset }[s] || c.gray+'●'+c.reset;
}

function roleBadge(r) {
  return { admin: badge('ADMIN',c.bgRed), editor: badge('EDITOR',c.bgYellow,'\x1b[30m'), viewer: badge('VIEWER',c.bgBlue) }[r] || r;
}

function spinner(text, dur) {
  dur = dur || 800;
  const f = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  let i = 0, start = Date.now();
  return new Promise(function(res) {
    const iv = setInterval(function() {
      process.stdout.write('\r  '+c.cyan+f[i%f.length]+c.reset+' '+text);
      i++;
      if (Date.now()-start >= dur) { clearInterval(iv); process.stdout.write('\r  '+c.green+'✓'+c.reset+' '+text+'\n'); res(); }
    }, 80);
  });
}

function timeAgo(d) {
  const s = Math.floor((Date.now()-new Date(d).getTime())/1000);
  if (s<60) return 'just now'; if (s<3600) return Math.floor(s/60)+'m ago';
  if (s<86400) return Math.floor(s/3600)+'h ago'; if (s<2592000) return Math.floor(s/86400)+'d ago';
  return new Date(d).toLocaleDateString();
}

function fmtDate(d) {
  return new Date(d).toLocaleString('en-US',{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'});
}

function sep() { return '  '+c.dim+'─'.repeat(50)+c.reset; }

// ═══════════════════════════════════════════════
// .env Parser
// ═══════════════════════════════════════════════
function loadEnv() {
  for (const f of ['.env','.env.local','.env.production']) {
    const fp = path.resolve(process.cwd(), f);
    if (!fs.existsSync(fp)) continue;
    for (const line of fs.readFileSync(fp,'utf-8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq===-1) continue;
      const k = t.substring(0,eq).trim();
      let v = t.substring(eq+1).trim();
      if ((v[0]==='"'&&v.slice(-1)==='"')||(v[0]==="'"&&v.slice(-1)==="'")) v=v.slice(1,-1);
      process.env[k] = v;
    }
    break;
  }
}

// ═══════════════════════════════════════════════
// Readline
// ═══════════════════════════════════════════════
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(q) {
  return new Promise(function(res) { rl.question(q, function(a) { res(a.trim()); }); });
}

function askHidden(q) {
  return new Promise(function(resolve) {
    rl.pause();
    process.stdout.write(q);
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    stdin.setEncoding('utf8');
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();
    let pw = '';
    function onData(key) {
      if (key==='\n'||key==='\r'||key==='\u0004') {
        stdin.removeListener('data',onData);
        if (stdin.isTTY) stdin.setRawMode(wasRaw||false);
        stdin.pause(); process.stdout.write('\n'); rl.resume(); resolve(pw); return;
      }
      if (key==='\u0003') { process.stdout.write('\n'); process.exit(); }
      if (key==='\b'||key==='\x7f') { if (pw.length>0) { pw=pw.slice(0,-1); process.stdout.write('\b \b'); } return; }
      if (key.length===1&&key.charCodeAt(0)>=32&&key.charCodeAt(0)<=126) { pw+=key; process.stdout.write('*'); }
    }
    stdin.on('data', onData);
  });
}

// ═══════════════════════════════════════════════
// Validators
// ═══════════════════════════════════════════════
function vName(n) {
  if (!n||!n.trim()) return 'Name is required';
  const t=n.trim();
  if (t.length<2) return 'Min 2 chars'; if (t.length>50) return 'Max 50 chars';
  if (!/^[a-zA-Z\s.'-]+$/.test(t)) return 'Invalid characters';
  return null;
}
function vEmail(e) {
  if (!e||!e.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())) return 'Invalid email';
  return null;
}
function vPassword(p) {
  const e=[];
  if (p.length<6) e.push('Min 6 chars'); if (p.length>128) e.push('Max 128 chars');
  if (!/[A-Z]/.test(p)) e.push('Need 1 uppercase'); if (!/[a-z]/.test(p)) e.push('Need 1 lowercase');
  if (!/[0-9]/.test(p)) e.push('Need 1 number');
  return e;
}
function vPhone(p) {
  if (!p) return null;
  const cl=p.replace(/[\s\-()]/g,'');
  if (cl.length<10||cl.length>15) return 'Invalid phone';
  if (!/^\+?[0-9]+$/.test(cl)) return 'Invalid chars';
  return null;
}
function genId() {
  return 'ADM-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).substring(2,6).toUpperCase();
}

// ═══════════════════════════════════════════════
// Permission Presets
// ═══════════════════════════════════════════════
const presets = {
  admin:  {dashboard:'full',booking:'full',transactions:'full',customers:'full',destinations:'full',packages:'full',offers:'full',support:'full',settings:'full'},
  editor: {dashboard:'full',booking:'edit',transactions:'none',customers:'full',destinations:'edit',packages:'edit',offers:'edit',support:'full',settings:'none'},
  viewer: {dashboard:'full',booking:'view',transactions:'none',customers:'none',destinations:'view',packages:'view',offers:'view',support:'none',settings:'none'},
};

// ═══════════════════════════════════════════════
// Admin Schema
// ═══════════════════════════════════════════════
function getModel() {
  if (mongoose.models.Admin) return mongoose.models.Admin;
  const s = new mongoose.Schema({
    name:{type:String,required:true,trim:true},
    email:{type:String,required:true,unique:true,lowercase:true,trim:true},
    password:{type:String,required:true,select:false},
    phone:{type:String,default:null},
    avatar:{type:String,default:null},
    adminId:{type:String,unique:true},
    role:{type:String,enum:['admin','viewer','editor'],default:'editor'},
    status:{type:String,enum:['active','blocked','suspended'],default:'active'},
    isVerified:{type:Boolean,default:true},
    permissions:{
      dashboard:{type:String,enum:['full','none'],default:'full'},
      booking:{type:String,enum:['full','edit','view','none'],default:'view'},
      transactions:{type:String,enum:['full','none'],default:'full'},
      customers:{type:String,enum:['full','none'],default:'full'},
      destinations:{type:String,enum:['full','edit','view','none'],default:'view'},
      packages:{type:String,enum:['full','edit','view','none'],default:'view'},
      offers:{type:String,enum:['full','edit','view','none'],default:'view'},
      support:{type:String,enum:['full','none'],default:'full'},
      settings:{type:String,enum:['full','none'],default:'none'},
    },
    createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'Admin',default:null},
    failedLoginAttempts:{type:Number,default:0},
    lockUntil:{type:Date,default:null},
    resetPasswordToken:{type:String,default:null},
    resetPasswordExpire:{type:Date,default:null},
    lastLogin:{type:Date,default:Date.now},
    lastActive:{type:Date,default:Date.now},
    isOnline:{type:Boolean,default:false},
    loginHistory:[{device:String,browser:String,ip:String,location:String,time:{type:Date,default:Date.now},status:{type:String,enum:['current','completed'],default:'current'}}],
    activeSessions:[{sessionId:{type:String,required:true},device:String,browser:String,ip:String,location:String,loginTime:{type:Date,default:Date.now},lastActive:{type:Date,default:Date.now}}],
    twoFactorSecret:{type:String,default:null},
    isTwoFactorEnabled:{type:Boolean,default:false},
    blockedAt:{type:Date,default:null},
    blockedBy:{type:mongoose.Schema.Types.ObjectId,ref:'Admin',default:null},
    blockReason:{type:String,default:null},
  },{timestamps:true});
  return mongoose.model('Admin',s);
}

// ═══════════════════════════════════════════════
// [1] CREATE ADMIN
// ═══════════════════════════════════════════════
async function handleCreate(M) {
  console.log('\n'+c.cyan+c.bold+'  ┌─────────────────────────────────────┐'+c.reset);
  console.log(c.cyan+c.bold+'  │     ➕ CREATE NEW ADMIN ACCOUNT      │'+c.reset);
  console.log(c.cyan+c.bold+'  └─────────────────────────────────────┘'+c.reset+'\n');

  const count = await M.countDocuments();
  if (count >= 10) { console.log('  '+c.red+'❌ Maximum 10 admins reached!'+c.reset+'\n'); return; }
  if (count > 0) console.log('  '+c.dim+'Currently '+count+' admin(s)'+c.reset+'\n');

  // Name
  let name = '';
  while (true) {
    name = await ask('  '+c.white+'👤 Full Name: '+c.reset);
    const err = vName(name);
    if (err) { console.log('  '+c.red+'   ✗ '+err+c.reset); continue; }
    break;
  }

  // Email
  let email = '';
  while (true) {
    email = await ask('  '+c.white+'📧 Email: '+c.reset);
    const err = vEmail(email);
    if (err) { console.log('  '+c.red+'   ✗ '+err+c.reset); continue; }
    const exists = await M.findOne({email:email.trim().toLowerCase()});
    if (exists) { console.log('  '+c.red+'   ✗ Email already registered'+c.reset); continue; }
    break;
  }

  // Phone
  let phone = '';
  while (true) {
    phone = await ask('  '+c.white+'📱 Phone '+c.dim+'(optional, Enter to skip)'+c.reset+': ');
    if (!phone) break;
    const err = vPhone(phone);
    if (err) { console.log('  '+c.red+'   ✗ '+err+c.reset); continue; }
    break;
  }

  // Password
  let password = '';
  while (true) {
    password = await askHidden('  '+c.white+'🔑 Password: '+c.reset);
    const errors = vPassword(password);
    if (errors.length > 0) {
      console.log('  '+c.red+'   ✗ Password requirements:'+c.reset);
      errors.forEach(function(e) { console.log('  '+c.red+'     • '+e+c.reset); });
      continue;
    }
    const confirm = await askHidden('  '+c.white+'🔑 Confirm: '+c.reset);
    if (password !== confirm) { console.log('  '+c.red+'   ✗ Passwords don\'t match!'+c.reset); continue; }
    console.log('  '+c.green+'   ✓ Password accepted'+c.reset);
    break;
  }

  // Role
  console.log('\n  '+c.white+c.bold+'🎭 Select Role:'+c.reset);
  console.log('  '+c.green+'  [1]'+c.reset+' Admin  '+c.dim+'— Full access'+c.reset);
  console.log('  '+c.yellow+'  [2]'+c.reset+' Editor '+c.dim+'— Edit content'+c.reset);
  console.log('  '+c.blue+'  [3]'+c.reset+' Viewer '+c.dim+'— Read-only'+c.reset);
  let rc = '';
  while (!['1','2','3'].includes(rc)) { rc = await ask('\n  '+c.white+'  Choice (1-3): '+c.reset); }
  const roleMap = {'1':'admin','2':'editor','3':'viewer'};
  const role = roleMap[rc];
  const perms = presets[role];

  // Admin ID
  let adminId = genId();
  let tries = 0;
  while (await M.findOne({adminId})) { adminId = genId(); if (++tries>=10) { console.log('  '+c.red+'❌ Failed to generate unique ID'+c.reset); return; } }

  // Review
  console.log('\n'+sep());
  console.log('  '+c.cyan+c.bold+'📋 REVIEW'+c.reset);
  console.log(sep());
  console.log('  '+c.dim+'Name:'+c.reset+'      '+c.white+c.bold+name.trim()+c.reset);
  console.log('  '+c.dim+'Email:'+c.reset+'     '+email.trim().toLowerCase());
  console.log('  '+c.dim+'Phone:'+c.reset+'     '+(phone||'(not set)'));
  console.log('  '+c.dim+'Role:'+c.reset+'      '+roleBadge(role));
  console.log('  '+c.dim+'Admin ID:'+c.reset+'  '+c.cyan+adminId+c.reset);
  console.log('  '+c.dim+'Status:'+c.reset+'    '+c.green+'● Active'+c.reset);
  console.log('\n  '+c.dim+'Permissions:'+c.reset);
  const pIcons = {full:c.green+'✅ full'+c.reset, edit:c.yellow+'✏️  edit'+c.reset, view:c.blue+'👁  view'+c.reset, none:c.red+'❌ none'+c.reset};
  Object.entries(perms).forEach(function(kv) { console.log('    '+c.dim+kv[0].padEnd(16)+c.reset+(pIcons[kv[1]]||kv[1])); });
  console.log(sep());

  const conf = await ask('\n  '+c.yellow+c.bold+'⚡ Create? '+c.reset+c.dim+'(yes/no)'+c.reset+': ');
  if (!['yes','y'].includes(conf.toLowerCase())) { console.log('\n  '+c.dim+'Cancelled.'+c.reset+'\n'); return; }

  await spinner('Creating admin...');

  try {
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);
    const admin = await M.create({
      name:name.trim(), email:email.trim().toLowerCase(), password:hashed,
      phone:phone?.trim()||null, adminId, role, status:'active', isVerified:true,
      permissions:perms, isOnline:false, isTwoFactorEnabled:false,
      failedLoginAttempts:0, lockUntil:null, activeSessions:[], loginHistory:[],
      createdBy:null, blockReason:null, blockedAt:null, blockedBy:null,
    });
    console.log('\n  '+c.bgGreen+c.white+c.bold+' ✅ ADMIN CREATED '+c.reset);
    console.log('  '+c.dim+'ID:'+c.reset+'       '+c.cyan+admin._id+c.reset);
    console.log('  '+c.dim+'Admin ID:'+c.reset+' '+c.cyan+adminId+c.reset);
    console.log('  '+c.dim+'Name:'+c.reset+'     '+name.trim());
    console.log('  '+c.dim+'Email:'+c.reset+'    '+email.trim().toLowerCase());
    console.log('  '+c.dim+'Role:'+c.reset+'     '+roleBadge(role));
    console.log('\n  '+c.yellow+'⚠️  Save credentials — password won\'t show again'+c.reset);
    console.log('  '+c.yellow+'Login at: /access'+c.reset+'\n');
  } catch (err) {
    console.log('\n  '+c.bgRed+c.white+c.bold+' ❌ FAILED '+c.reset);
    if (err.code===11000) { console.log('  '+c.red+'Duplicate: '+JSON.stringify(err.keyValue)+c.reset); }
    else { console.log('  '+c.red+err.message+c.reset); }
    console.log('');
  }
}

// ═══════════════════════════════════════════════
// [2] LIST ADMINS
// ═══════════════════════════════════════════════
async function handleList(M) {
  console.log('\n'+c.cyan+c.bold+'  ┌─────────────────────────────────────┐'+c.reset);
  console.log(c.cyan+c.bold+'  │        📋 ALL ADMIN ACCOUNTS         │'+c.reset);
  console.log(c.cyan+c.bold+'  └─────────────────────────────────────┘'+c.reset+'\n');

  await spinner('Fetching admins...');
  const admins = await M.find().select('name email adminId role status isVerified phone createdAt lastLogin isOnline').sort({createdAt:-1}).lean();

  if (!admins.length) { console.log('  '+c.yellow+'⚠️  No admins found.'+c.reset+'\n'); return; }

  const st = { total:admins.length, active:admins.filter(function(a){return a.status==='active'}).length, blocked:admins.filter(function(a){return a.status==='blocked'}).length, online:admins.filter(function(a){return a.isOnline}).length };
  console.log('  '+c.dim+'Total:'+c.reset+' '+c.white+c.bold+st.total+c.reset+'  '+c.green+'Active:'+st.active+c.reset+'  '+c.red+'Blocked:'+st.blocked+c.reset+'  '+c.cyan+'Online:'+st.online+c.reset+'\n');
  console.log(sep());

  admins.forEach(function(a,i) {
    const on = a.isOnline ? c.green+'🟢'+c.reset : c.gray+'⚫'+c.reset;
    console.log('  '+c.dim+(i+1).toString().padStart(2)+'.'+c.reset+' '+on+' '+c.white+c.bold+a.name+c.reset);
    console.log('      '+c.dim+'Email:'+c.reset+'    '+a.email);
    console.log('      '+c.dim+'ID:'+c.reset+'       '+c.cyan+a.adminId+c.reset);
    console.log('      '+c.dim+'Role:'+c.reset+'     '+roleBadge(a.role)+'    '+c.dim+'Status:'+c.reset+' '+statusDot(a.status)+' '+a.status);
    console.log('      '+c.dim+'Phone:'+c.reset+'    '+(a.phone||'N/A'));
    console.log('      '+c.dim+'Created:'+c.reset+'  '+fmtDate(a.createdAt)+'  '+c.dim+'('+timeAgo(a.createdAt)+')'+c.reset);
    if (a.lastLogin) console.log('      '+c.dim+'Login:'+c.reset+'    '+fmtDate(a.lastLogin)+'  '+c.dim+'('+timeAgo(a.lastLogin)+')'+c.reset);
    console.log(sep());
  });
  console.log('');
}

// ═══════════════════════════════════════════════
// [3] SEARCH ADMIN
// ═══════════════════════════════════════════════
async function handleSearch(M) {
  console.log('\n'+c.cyan+c.bold+'  ┌─────────────────────────────────────┐'+c.reset);
  console.log(c.cyan+c.bold+'  │         🔍 SEARCH ADMIN              │'+c.reset);
  console.log(c.cyan+c.bold+'  └─────────────────────────────────────┘'+c.reset+'\n');

  const q = await ask('  '+c.white+'Search '+c.dim+'(name/email/ID)'+c.reset+': ');
  if (!q) { console.log('  '+c.red+'✗ Required'+c.reset+'\n'); return; }

  await spinner('Searching...');
  const admins = await M.find({$or:[{name:{$regex:q,$options:'i'}},{email:{$regex:q,$options:'i'}},{adminId:{$regex:q,$options:'i'}}]}).select('name email adminId role status phone createdAt lastLogin isOnline').lean();

  if (!admins.length) { console.log('  '+c.yellow+'⚠️  No results for "'+q+'"'+c.reset+'\n'); return; }
  console.log('  '+c.green+'Found '+admins.length+' result(s):'+c.reset+'\n');
  console.log(sep());

  admins.forEach(function(a,i) {
    const on = a.isOnline ? c.green+'🟢'+c.reset : c.gray+'⚫'+c.reset;
    console.log('  '+c.dim+(i+1).toString().padStart(2)+'.'+c.reset+' '+on+' '+c.white+c.bold+a.name+c.reset);
    console.log('      '+c.dim+'Email:'+c.reset+'    '+a.email);
    console.log('      '+c.dim+'ID:'+c.reset+'       '+c.cyan+a.adminId+c.reset);
    console.log('      '+c.dim+'Role:'+c.reset+'     '+roleBadge(a.role)+'    '+c.dim+'Status:'+c.reset+' '+statusDot(a.status)+' '+a.status);
    console.log('      '+c.dim+'Phone:'+c.reset+'    '+(a.phone||'N/A'));
    console.log(sep());
  });
  console.log('');
}

// ═══════════════════════════════════════════════
// [4] UPDATE ADMIN
// ═══════════════════════════════════════════════
async function handleUpdate(M) {
  console.log('\n'+c.cyan+c.bold+'  ┌─────────────────────────────────────┐'+c.reset);
  console.log(c.cyan+c.bold+'  │         ✏️  UPDATE ADMIN               │'+c.reset);
  console.log(c.cyan+c.bold+'  └─────────────────────────────────────┘'+c.reset+'\n');

  const id = await ask('  '+c.white+'Enter Admin ID or Email: '+c.reset);
  if (!id) { console.log('  '+c.red+'✗ Required'+c.reset+'\n'); return; }

  const admin = await M.findOne({$or:[{adminId:id.trim()},{email:id.trim().toLowerCase()}]}).lean();
  if (!admin) { console.log('  '+c.red+'✗ Not found'+c.reset+'\n'); return; }

  console.log('\n  '+c.dim+'Found:'+c.reset+' '+c.white+c.bold+admin.name+c.reset+' '+c.dim+'('+admin.adminId+')'+c.reset+'\n');
  console.log('  '+c.white+c.bold+'What to update?'+c.reset);
  console.log('  '+c.cyan+'[1]'+c.reset+' Name  '+c.dim+'('+admin.name+')'+c.reset);
  console.log('  '+c.cyan+'[2]'+c.reset+' Phone '+c.dim+'('+(admin.phone||'N/A')+')'+c.reset);
  console.log('  '+c.cyan+'[3]'+c.reset+' Role  '+c.dim+'('+admin.role+')'+c.reset);
  console.log('  '+c.cyan+'[4]'+c.reset+' Email '+c.dim+'('+admin.email+')'+c.reset);
  console.log('  '+c.gray+'[0]'+c.reset+' Cancel');

  const ch = await ask('\n  '+c.white+'Choice: '+c.reset);
  const updates = {};

  switch(ch) {
    case '1': {
      let n='';
      while(true) { n=await ask('  '+c.white+'New Name: '+c.reset); const e=vName(n); if(e){console.log('  '+c.red+'   ✗ '+e+c.reset);continue;} break; }
      updates.name=n.trim(); break;
    }
    case '2': {
      let p='';
      while(true) { p=await ask('  '+c.white+'New Phone '+c.dim+'(empty=clear)'+c.reset+': '); if(!p){updates.phone=null;break;} const e=vPhone(p); if(e){console.log('  '+c.red+'   ✗ '+e+c.reset);continue;} updates.phone=p.trim();break; }
      break;
    }
    case '3': {
      console.log('\n  '+c.green+'[1]'+c.reset+' Admin  '+c.cyan+'[2]'+c.reset+' Editor  '+c.blue+'[3]'+c.reset+' Viewer');
      let r=''; while(!['1','2','3'].includes(r)){r=await ask('  '+c.white+'New Role (1-3): '+c.reset);}
      const rm={'1':'admin','2':'editor','3':'viewer'}; updates.role=rm[r]; updates.permissions=presets[rm[r]]; break;
    }
    case '4': {
      let e='';
      while(true) { e=await ask('  '+c.white+'New Email: '+c.reset); const er=vEmail(e); if(er){console.log('  '+c.red+'   ✗ '+er+c.reset);continue;} const ex=await M.findOne({email:e.trim().toLowerCase(),_id:{$ne:admin._id}}); if(ex){console.log('  '+c.red+'   ✗ Already in use'+c.reset);continue;} updates.email=e.trim().toLowerCase();break; }
      break;
    }
    default: console.log('  '+c.dim+'Cancelled.'+c.reset+'\n'); return;
  }

  if (!Object.keys(updates).length) { console.log('  '+c.dim+'Nothing to update.'+c.reset+'\n'); return; }
  const conf = await ask('\n  '+c.yellow+'Confirm update? '+c.reset+c.dim+'(yes/no)'+c.reset+': ');
  if (!['yes','y'].includes(conf.toLowerCase())) { console.log('  '+c.dim+'Cancelled.'+c.reset+'\n'); return; }

  await spinner('Updating...');
  try {
    await M.updateOne({_id:admin._id},{$set:updates});
    console.log('\n  '+c.bgGreen+c.white+c.bold+' ✅ UPDATED '+c.reset+'\n');
    Object.entries(updates).forEach(function(kv) { if(kv[0]!=='permissions') console.log('  '+c.dim+kv[0]+':'+c.reset+' '+c.white+kv[1]+c.reset); });
    console.log('');
  } catch(e) { console.log('\n  '+c.red+'❌ Failed: '+e.message+c.reset+'\n'); }
}

// ═══════════════════════════════════════════════
// [5] DELETE ADMIN
// ═══════════════════════════════════════════════
async function handleDelete(M) {
  console.log('\n'+c.red+c.bold+'  ┌─────────────────────────────────────┐'+c.reset);
  console.log(c.red+c.bold+'  │      🗑️  DELETE ADMIN ACCOUNT         │'+c.reset);
  console.log(c.red+c.bold+'  └─────────────────────────────────────┘'+c.reset+'\n');

  const admins = await M.find().select('name email adminId role status createdAt').sort({createdAt:-1}).lean();
  if (!admins.length) { console.log('  '+c.yellow+'⚠️  No admins to delete.'+c.reset+'\n'); return; }

  console.log('  '+c.dim+'Available admins:'+c.reset+'\n');
  admins.forEach(function(a,i) {
    console.log('  '+c.white+(i+1).toString().padStart(2)+'.'+c.reset+' '+statusDot(a.status)+' '+c.white+a.name+c.reset+' '+c.dim+'— '+a.email+c.reset+' '+c.cyan+'['+a.adminId+']'+c.reset+' '+roleBadge(a.role));
  });

  console.log('\n  '+c.dim+'Enter number, Admin ID, or email'+c.reset);
  const input = await ask('  '+c.red+'🗑️  Select: '+c.reset);
  if (!input) { console.log('  '+c.dim+'Cancelled.'+c.reset+'\n'); return; }

  let target = null;
  const num = parseInt(input);
  if (!isNaN(num)&&num>=1&&num<=admins.length) target=admins[num-1];
  else target=admins.find(function(a){return a.adminId===input.trim()||a.email===input.trim().toLowerCase();});

  if (!target) { console.log('  '+c.red+'✗ Not found'+c.reset+'\n'); return; }

  console.log('\n  '+c.bgRed+c.white+c.bold+' ⚠️  DANGER ZONE '+c.reset);
  console.log('  '+c.dim+'Name:'+c.reset+'     '+c.white+c.bold+target.name+c.reset);
  console.log('  '+c.dim+'Email:'+c.reset+'    '+target.email);
  console.log('  '+c.dim+'ID:'+c.reset+'       '+c.cyan+target.adminId+c.reset);
  console.log('  '+c.dim+'Role:'+c.reset+'     '+roleBadge(target.role));

  console.log('\n  '+c.red+c.bold+'Type Admin ID to confirm: '+c.cyan+target.adminId+c.reset);
  const conf1 = await ask('\n  '+c.red+'Confirm ID: '+c.reset);
  if (conf1.trim()!==target.adminId) { console.log('\n  '+c.yellow+'✗ ID mismatch. Cancelled.'+c.reset+'\n'); return; }

  const conf2 = await ask('  '+c.red+c.bold+'Type "DELETE" to confirm: '+c.reset);
  if (conf2!=='DELETE') { console.log('\n  '+c.yellow+'Cancelled.'+c.reset+'\n'); return; }

  // Check last admin
  const remaining = await M.countDocuments({role:'admin',_id:{$ne:target._id}});
  if (target.role==='admin'&&remaining===0) {
    console.log('\n  '+c.bgRed+c.white+c.bold+' 🚫 CANNOT DELETE '+c.reset);
    console.log('  '+c.red+'This is the LAST admin! Create another first.'+c.reset+'\n');
    return;
  }

  await spinner('Deleting admin...');
  try {
    await M.deleteOne({_id:target._id});
    console.log('\n  '+c.bgGreen+c.white+c.bold+' ✅ DELETED '+c.reset);
    console.log('  '+c.dim+'Deleted:'+c.reset+' '+target.name+' ('+target.email+')');
    console.log('  '+c.dim+'Remaining:'+c.reset+' '+(await M.countDocuments())+'\n');
  } catch(e) { console.log('\n  '+c.red+'❌ Failed: '+e.message+c.reset+'\n'); }
}

// ═══════════════════════════════════════════════
// [6] BLOCK / UNBLOCK
// ═══════════════════════════════════════════════
async function handleBlock(M) {
  console.log('\n'+c.yellow+c.bold+'  ┌─────────────────────────────────────┐'+c.reset);
  console.log(c.yellow+c.bold+'  │     🚫 BLOCK / UNBLOCK ADMIN         │'+c.reset);
  console.log(c.yellow+c.bold+'  └─────────────────────────────────────┘'+c.reset+'\n');

  const admins = await M.find().select('name email adminId role status blockReason').sort({createdAt:-1}).lean();
  if (!admins.length) { console.log('  '+c.yellow+'⚠️  No admins.'+c.reset+'\n'); return; }

  admins.forEach(function(a,i) {
    const bi = a.status==='blocked' ? c.red+' [BLOCKED'+(a.blockReason?': '+a.blockReason:'')+']'+c.reset : '';
    console.log('  '+c.white+(i+1).toString().padStart(2)+'.'+c.reset+' '+statusDot(a.status)+' '+c.white+a.name+c.reset+' '+c.dim+'— '+a.email+c.reset+' '+roleBadge(a.role)+bi);
  });

  const input = await ask('\n  '+c.white+'Select (number/ID/email): '+c.reset);
  if (!input) return;

  let target = null;
  const num = parseInt(input);
  if (!isNaN(num)&&num>=1&&num<=admins.length) target=admins[num-1];
  else target=admins.find(function(a){return a.adminId===input.trim()||a.email===input.trim().toLowerCase();});
  if (!target) { console.log('  '+c.red+'✗ Not found'+c.reset+'\n'); return; }

  if (target.status==='blocked') {
    // UNBLOCK
    console.log('\n  '+c.white+c.bold+target.name+c.reset+' is '+c.red+c.bold+'BLOCKED'+c.reset);
    if (target.blockReason) console.log('  '+c.dim+'Reason: '+target.blockReason+c.reset);
    const conf = await ask('\n  '+c.green+'Unblock? '+c.reset+c.dim+'(yes/no)'+c.reset+': ');
    if (!['yes','y'].includes(conf.toLowerCase())) { console.log('  '+c.dim+'Cancelled.'+c.reset+'\n'); return; }
    await spinner('Unblocking...');
    await M.updateOne({_id:target._id},{$set:{status:'active',blockReason:null,blockedAt:null,blockedBy:null,failedLoginAttempts:0,lockUntil:null}});
    console.log('\n  '+c.bgGreen+c.white+c.bold+' ✅ '+target.name+' UNBLOCKED '+c.reset+'\n');
  } else {
    // BLOCK
    console.log('\n  '+c.white+c.bold+target.name+c.reset+' is '+c.green+c.bold+'ACTIVE'+c.reset);
    const reason = await ask('  '+c.red+'Block reason '+c.dim+'(optional)'+c.reset+': ');
    const conf = await ask('  '+c.red+c.bold+'Block? '+c.reset+c.dim+'(yes/no)'+c.reset+': ');
    if (!['yes','y'].includes(conf.toLowerCase())) { console.log('  '+c.dim+'Cancelled.'+c.reset+'\n'); return; }
    await spinner('Blocking...');
    await M.updateOne({_id:target._id},{$set:{status:'blocked',blockReason:reason||null,blockedAt:new Date(),isOnline:false,activeSessions:[]}});
    console.log('\n  '+c.bgRed+c.white+c.bold+' 🚫 '+target.name+' BLOCKED '+c.reset);
    if (reason) console.log('  '+c.dim+'Reason: '+reason+c.reset);
    console.log('');
  }
}

// ═══════════════════════════════════════════════
// [7] RESET PASSWORD
// ═══════════════════════════════════════════════
async function handleResetPw(M) {
  console.log('\n'+c.cyan+c.bold+'  ┌─────────────────────────────────────┐'+c.reset);
  console.log(c.cyan+c.bold+'  │       🔑 RESET ADMIN PASSWORD        │'+c.reset);
  console.log(c.cyan+c.bold+'  └─────────────────────────────────────┘'+c.reset+'\n');

  const id = await ask('  '+c.white+'Enter Admin ID or Email: '+c.reset);
  if (!id) { console.log('  '+c.red+'✗ Required'+c.reset+'\n'); return; }

  const admin = await M.findOne({$or:[{adminId:id.trim()},{email:id.trim().toLowerCase()}]}).select('name email adminId role').lean();
  if (!admin) { console.log('  '+c.red+'✗ Not found'+c.reset+'\n'); return; }

  console.log('\n  '+c.dim+'Found:'+c.reset+' '+c.white+c.bold+admin.name+c.reset+' '+c.dim+'('+admin.email+')'+c.reset+' '+roleBadge(admin.role)+'\n');

  let pw = '';
  while (true) {
    pw = await askHidden('  '+c.white+'New Password: '+c.reset);
    const errors = vPassword(pw);
    if (errors.length>0) { console.log('  '+c.red+'   ✗ Requirements:'+c.reset); errors.forEach(function(e){console.log('  '+c.red+'     • '+e+c.reset);}); continue; }
    const conf = await askHidden('  '+c.white+'Confirm: '+c.reset);
    if (pw!==conf) { console.log('  '+c.red+'   ✗ Mismatch!'+c.reset); continue; }
    break;
  }

  const conf = await ask('\n  '+c.yellow+'Reset password for '+c.white+admin.name+c.yellow+'? '+c.reset+c.dim+'(yes/no)'+c.reset+': ');
  if (!['yes','y'].includes(conf.toLowerCase())) { console.log('  '+c.dim+'Cancelled.'+c.reset+'\n'); return; }

  await spinner('Resetting password...');
  try {
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(pw, salt);
    await M.updateOne({_id:admin._id},{$set:{password:hashed,failedLoginAttempts:0,lockUntil:null,resetPasswordToken:null,resetPasswordExpire:null,activeSessions:[]}});
    console.log('\n  '+c.bgGreen+c.white+c.bold+' ✅ PASSWORD RESET '+c.reset);
    console.log('  '+c.dim+'Admin:'+c.reset+' '+admin.name+' ('+admin.email+')');
    console.log('  '+c.yellow+'All sessions cleared.'+c.reset+'\n');
  } catch(e) { console.log('\n  '+c.red+'❌ Failed: '+e.message+c.reset+'\n'); }
}

// ═══════════════════════════════════════════════
// DB Connect
// ═══════════════════════════════════════════════
async function connectDB() {
  loadEnv();
  const URI = process.env.DATABASE_URL || process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DB_URL;
  if (!URI) {
    console.log('\n  '+c.bgRed+c.white+c.bold+' ERROR '+c.reset);
    console.log('  '+c.red+'MongoDB URI not found!'+c.reset);
    console.log('  '+c.dim+'Add DATABASE_URL or MONGODB_URI to .env.local'+c.reset+'\n');
    return false;
  }
  const masked = URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  try {
    await spinner('Connecting to MongoDB...');
    await mongoose.connect(URI, {bufferCommands:false,maxPoolSize:5});
    console.log('  '+c.green+'✓'+c.reset+' '+c.dim+'Connected: '+masked+c.reset+'\n');
    return true;
  } catch(e) {
    console.log('\n  '+c.bgRed+c.white+c.bold+' CONNECTION FAILED '+c.reset);
    console.log('  '+c.red+e.message+c.reset+'\n');
    return false;
  }
}

// ═══════════════════════════════════════════════
// Banner + Menu
// ═══════════════════════════════════════════════
function showBanner() {
  console.clear();
  console.log('\n'+c.cyan+c.bold);
  console.log('    ╔══════════════════════════════════════════╗');
  console.log('    ║   🔐 Admin Management CLI — v2.0        ║');
  console.log('    ║   Direct DB • No server needed          ║');
  console.log('    ╚══════════════════════════════════════════╝');
  console.log(c.reset);
}

function showMenu() {
  console.log('\n  '+c.cyan+c.bold+'┌──────────────────────────────────────┐'+c.reset);
  console.log('  '+c.cyan+c.bold+'│'+c.reset+'       '+c.white+c.bold+'📋 ADMIN MENU'+c.reset+'                 '+c.cyan+c.bold+'│'+c.reset);
  console.log('  '+c.cyan+c.bold+'├──────────────────────────────────────┤'+c.reset);
  console.log('  '+c.cyan+c.bold+'│'+c.reset+'                                      '+c.cyan+c.bold+'│'+c.reset);
  console.log('  '+c.cyan+c.bold+'│'+c.reset+'   '+c.green+'[1]'+c.reset+' ➕ Create New Admin            '+c.cyan+c.bold+'│'+c.reset);
  console.log('  '+c.cyan+c.bold+'│'+c.reset+'   '+c.blue+'[2]'+c.reset+' 📋 List All Admins             '+c.cyan+c.bold+'│'+c.reset);
  console.log('  '+c.cyan+c.bold+'│'+c.reset+'   '+c.yellow+'[3]'+c.reset+' 🔍 Search Admin                '+c.cyan+c.bold+'│'+c.reset);
  console.log('  '+c.cyan+c.bold+'│'+c.reset+'   '+c.magenta+'[4]'+c.reset+' ✏️  Update Admin                '+c.cyan+c.bold+'│'+c.reset);
  console.log('  '+c.cyan+c.bold+'│'+c.reset+'   '+c.red+'[5]'+c.reset+' 🗑️  Delete Admin                '+c.cyan+c.bold+'│'+c.reset);
  console.log('  '+c.cyan+c.bold+'│'+c.reset+'   '+c.yellow+'[6]'+c.reset+' 🚫 Block/Unblock               '+c.cyan+c.bold+'│'+c.reset);
  console.log('  '+c.cyan+c.bold+'│'+c.reset+'   '+c.cyan+'[7]'+c.reset+' 🔑 Reset Password              '+c.cyan+c.bold+'│'+c.reset);
  console.log('  '+c.cyan+c.bold+'│'+c.reset+'   '+c.gray+'[0]'+c.reset+' 🚪 Exit                         '+c.cyan+c.bold+'│'+c.reset);
  console.log('  '+c.cyan+c.bold+'│'+c.reset+'                                      '+c.cyan+c.bold+'│'+c.reset);
  console.log('  '+c.cyan+c.bold+'└──────────────────────────────────────┘'+c.reset+'\n');
}

// ═══════════════════════════════════════════════
// Main Loop
// ═══════════════════════════════════════════════
async function main() {
  showBanner();
  const ok = await connectDB();
  if (!ok) { rl.close(); process.exit(1); }

  const M = getModel();
  let running = true;

  while (running) {
    showMenu();
    const ch = await ask('  '+c.cyan+c.bold+'❯'+c.reset+' '+c.white+'Choice: '+c.reset);
    switch(ch) {
      case '1': await handleCreate(M); break;
      case '2': await handleList(M); break;
      case '3': await handleSearch(M); break;
      case '4': await handleUpdate(M); break;
      case '5': await handleDelete(M); break;
      case '6': await handleBlock(M); break;
      case '7': await handleResetPw(M); break;
      case '0': case 'q': case 'exit': running=false; break;
      default: console.log('\n  '+c.red+'✗ Invalid. Enter 0-7'+c.reset+'\n');
    }
    if (running) {
      await ask(c.dim+'  Press Enter to continue...'+c.reset);
      console.clear();
      console.log('\n'+c.cyan+c.bold+'  🔐 Admin CLI'+c.reset+' '+c.dim+'— Connected'+c.reset);
    }
  }

  console.log('');
  await spinner('Disconnecting...');
  await mongoose.disconnect();
  console.log('\n  '+c.cyan+'👋 Goodbye!'+c.reset+'\n');
  rl.close();
  process.exit(0);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', async function() {
  console.log('\n\n  '+c.yellow+'Interrupted. Cleaning up...'+c.reset);
  try { await mongoose.disconnect(); } catch(e) {}
  rl.close();
  process.exit(0);
});

main().catch(function(e) {
  console.error('\n'+c.red+'Fatal: '+e.message+c.reset);
  rl.close();
  process.exit(1);
});