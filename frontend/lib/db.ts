import sqlite3 from 'sqlite3';
import path from 'path';

// Store DB inside the frontend folder, or at root of repository
// Next.js sets process.cwd() to the frontend directory usually
const dbPath = path.join(process.cwd(), 'enoch-local.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Initialize Tables
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS Users (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        FullName TEXT,
        Email TEXT UNIQUE,
        PasswordHash TEXT,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS Devices (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT,
        MacAddress TEXT,
        UserId INTEGER,
        BatteryLevel INTEGER,
        Location TEXT,
        Status TEXT,
        FOREIGN KEY(UserId) REFERENCES Users(Id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS Locations (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        DeviceId INTEGER,
        Latitude REAL,
        Longitude REAL,
        Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(DeviceId) REFERENCES Devices(Id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS Messages (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        UserId INTEGER,
        Role TEXT,
        Content TEXT,
        Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(UserId) REFERENCES Users(Id)
      )`);
    });
  }
});

// Promise wrappers for async/await usage in API routes
export const dbGet = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

export const dbAll = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const dbRun = (sql: string, params: any[] = []): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};
