import fs from 'fs';
import path from 'path';

// Pure JSON Mock DB to bypass Render GLIBC / SQLite C++ compilation errors
const dbPath = path.join(process.cwd(), 'enoch-db.json');

type Database = {
  Users: any[];
  Devices: any[];
  Locations: any[];
  Messages: any[];
};

function readDB(): Database {
  if (!fs.existsSync(dbPath)) {
    const init = { Users: [], Devices: [], Locations: [], Messages: [] };
    fs.writeFileSync(dbPath, JSON.stringify(init, null, 2));
    return init;
  }
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function writeDB(data: Database) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Generate IDs
function generateId(table: any[]) {
  return table.length > 0 ? Math.max(...table.map(t => t.Id)) + 1 : 1;
}

export const dbGet = async (sql: string, params: any[] = []): Promise<any> => {
  const db = readDB();
  
  if (sql.includes('SELECT * FROM Users WHERE Email = ?')) {
    return db.Users.find(u => u.Email === params[0]) || null;
  }
  if (sql.includes('SELECT Id, FullName, Email, CreatedAt FROM Users WHERE Id = ?')) {
    return db.Users.find(u => u.Id === params[0]) || null;
  }
  if (sql.includes('SELECT * FROM Devices WHERE Id = ? AND UserId = ?')) {
    return db.Devices.find(d => d.Id == params[0] && d.UserId == params[1]) || null;
  }
  
  return null;
};

export const dbAll = async (sql: string, params: any[] = []): Promise<any[]> => {
  const db = readDB();

  if (sql.includes('SELECT * FROM Devices WHERE UserId = ?')) {
    return db.Devices.filter(d => d.UserId == params[0]);
  }
  if (sql.includes('SELECT * FROM Messages WHERE UserId = ?')) {
    return db.Messages.filter(m => m.UserId == params[0]).sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());
  }

  return [];
};

export const dbRun = async (sql: string, params: any[] = []): Promise<{ lastID: number }> => {
  const db = readDB();

  if (sql.includes('INSERT INTO Users')) {
    const id = generateId(db.Users);
    db.Users.push({
      Id: id,
      FullName: params[0],
      Email: params[1],
      PasswordHash: params[2],
      CreatedAt: new Date().toISOString()
    });
    writeDB(db);
    return { lastID: id };
  }

  if (sql.includes('INSERT INTO Devices')) {
    const id = generateId(db.Devices);
    db.Devices.push({
      Id: id,
      Name: params[0],
      MacAddress: params[1],
      UserId: params[2],
      BatteryLevel: params[3],
      Location: params[4],
      Status: params[5]
    });
    writeDB(db);
    return { lastID: id };
  }

  if (sql.includes('UPDATE Devices SET Status')) {
    const device = db.Devices.find(d => d.Id == params[1]);
    if (device) {
      device.Status = params[0];
      writeDB(db);
    }
    return { lastID: 0 };
  }

  if (sql.includes('INSERT INTO Locations')) {
    const id = generateId(db.Locations);
    db.Locations.push({
      Id: id,
      DeviceId: params[0],
      Latitude: params[1],
      Longitude: params[2],
      Timestamp: new Date().toISOString()
    });
    writeDB(db);
    return { lastID: id };
  }

  if (sql.includes('INSERT INTO Messages')) {
    const id = generateId(db.Messages);
    db.Messages.push({
      Id: id,
      UserId: params[0],
      Role: params[1],
      Content: params[2],
      Timestamp: new Date().toISOString()
    });
    writeDB(db);
    return { lastID: id };
  }

  return { lastID: 0 };
};
