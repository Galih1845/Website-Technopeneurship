require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
if(!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Optional SQLite DB for metadata and reviews
let db = null;
try{
  const sqlite3 = require('sqlite3').verbose();
  const DB_FILE = path.join(DATA_DIR, 'database.sqlite');
  db = new sqlite3.Database(DB_FILE);
  db.serialize(()=>{
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      passwordHash TEXT,
      birthdate TEXT,
      address TEXT,
      jobStatus TEXT,
      ktpNumber TEXT,
      bankAccount TEXT,
      bankName TEXT,
      income TEXT,
      riskProfile TEXT,
      uploads JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      message TEXT,
      rating INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });
  console.log('SQLite DB initialized at', DB_FILE);
}catch(e){ console.warn('SQLite not available, falling back to JSON storage for metadata.'); db = null; }

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.random().toString(36).slice(2,8) + ext;
    cb(null, name);
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 1024 } }); // up to 1GB per file by default

// JSON fallback storage (if sqlite not available)
const USERS_FILE = path.join(DATA_DIR, 'users.json');
if(!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
function readUsers(){
  try{ return JSON.parse(fs.readFileSync(USERS_FILE,'utf8')||'[]'); }catch(e){ return []; }
}
function writeUsers(list){ fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2)); }

// AWS S3 client (optional)
let s3 = null;
const S3_BUCKET = process.env.S3_BUCKET;
if(process.env.AWS_ACCESS_KEY_ID && S3_BUCKET){
  const AWS = require('aws-sdk');
  s3 = new AWS.S3({ region: process.env.AWS_REGION || 'us-east-1' });
  console.log('S3 enabled for bucket', S3_BUCKET);
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Register (accepts multipart/form-data with possible files)
app.post('/api/register', upload.fields([{ name: 'ktpFile' }, { name: 'selfieKtp' }]), (req, res) => {
  try{
    const body = req.body || {};
    // basic duplicate check
    if(db){
      db.get('SELECT id FROM users WHERE email = ?', [body.email], (err,row)=>{
        if(err) return res.status(500).json({ message: 'DB error' });
        if(row) return res.status(400).json({ message: 'Email sudah terdaftar' });
        createUserRecord(body, req, res);
      });
    }else{
      const users = readUsers();
      if(users.find(u => u.email === body.email)) return res.status(400).json({ message: 'Email sudah terdaftar' });
      createUserRecord(body, req, res);
    }
  }catch(err){ console.error('register error', err); return res.status(500).json({ message: 'Server error' }); }
});

function createUserRecord(body, req, res){
  const hash = bcrypt.hashSync(body.password || '');
  const id = Date.now().toString(36);
  const user = {
    id,
    name: body.fullName || body.firstName || '',
    email: body.email || '',
    phone: body.phone || '',
    passwordHash: hash,
    birthdate: body.birthdate || null,
    address: body.address || null,
    jobStatus: body.jobStatus || null,
    ktpNumber: body.ktpNumber || null,
    bankAccount: body.bankAccount || null,
    bankName: body.bankName || null,
    income: body.income || null,
    riskProfile: body.riskProfile || null,
    uploads: {}
  };
  // if files uploaded locally
  if(req.files){
    if(req.files['ktpFile'] && req.files['ktpFile'][0]) user.uploads.ktpFile = '/uploads/' + req.files['ktpFile'][0].filename;
    if(req.files['selfieKtp'] && req.files['selfieKtp'][0]) user.uploads.selfieKtp = '/uploads/' + req.files['selfieKtp'][0].filename;
  }
  // if keys provided (uploaded to S3 by client)
  if(body.ktpKey) {
    user.uploads.ktpFile = s3UrlForKey(body.ktpKey);
  }
  if(body.selfieKey) {
    user.uploads.selfieKtp = s3UrlForKey(body.selfieKey);
  }

  if(db){
    const uploadsStr = JSON.stringify(user.uploads || {});
    const stmt = db.prepare(`INSERT INTO users (id,name,email,phone,passwordHash,birthdate,address,jobStatus,ktpNumber,bankAccount,bankName,income,riskProfile,uploads) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    stmt.run(user.id,user.name,user.email,user.phone,user.passwordHash,user.birthdate,user.address,user.jobStatus,user.ktpNumber,user.bankAccount,user.bankName,user.income,user.riskProfile,uploadsStr, function(err){
      if(err){ console.error('db insert err', err); return res.status(500).json({ message: 'DB error' }); }
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({ token, name: user.name });
    });
  }else{
    const users = readUsers();
    users.push(user);
    writeUsers(users);
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ token, name: user.name });
  }
}

function s3UrlForKey(key){
  if(!s3 || !S3_BUCKET) return key;
  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;
}

// Login (JSON body)
app.post('/api/login', (req, res) => {
  try{
    const { identifier, password } = req.body || {};
    const users = readUsers();
    const u = users.find(x => x.email === identifier || x.phone === identifier || x.id === identifier);
    if(!u) return res.status(401).json({ message: 'User tidak ditemukan' });
    if(!bcrypt.compareSync(password || '', u.passwordHash || '')) return res.status(401).json({ message: 'Kredensial salah' });
    const token = jwt.sign({ id: u.id, email: u.email }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ token, name: u.name });
  }catch(err){ console.error('login error', err); return res.status(500).json({ message: 'Server error' }); }
});

// Simple endpoint to list users (for debug) - remove or protect in production
app.get('/api/_debug/users', (req, res) => { res.json(readUsers()); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server listening on http://localhost:${PORT}`));

// Notes printed when running
console.log('Uploads directory:', UPLOAD_DIR);
console.log('Data directory:', DATA_DIR);
