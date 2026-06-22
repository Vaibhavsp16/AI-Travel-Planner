const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '.data');

// Helper to ensure data directory and files exist
function ensureDirAndFile(collection) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
  return filePath;
}

// Read data
function readData(collection) {
  const filePath = ensureDirAndFile(collection);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading database file for collection ${collection}:`, err);
    return [];
  }
}

// Write data
function writeData(collection, data) {
  const filePath = ensureDirAndFile(collection);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing database file for collection ${collection}:`, err);
  }
}

const jsonDb = {
  find: (collection, query = {}) => {
    const data = readData(collection);
    return data.filter(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },

  findOne: (collection, query = {}) => {
    const data = readData(collection);
    return data.find(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  },

  findById: (collection, id) => {
    const data = readData(collection);
    return data.find(item => item._id === id || item.id === id) || null;
  },

  create: (collection, obj) => {
    const data = readData(collection);
    const newRecord = {
      _id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...obj
    };
    data.push(newRecord);
    writeData(collection, data);
    return newRecord;
  },

  findByIdAndUpdate: (collection, id, updateObj) => {
    const data = readData(collection);
    const index = data.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;

    // Handle Mongoose-like update operators ($push, etc.) or standard updates
    let updatedItem = { ...data[index], updatedAt: new Date().toISOString() };

    if (updateObj.$push) {
      for (let field in updateObj.$push) {
        if (!updatedItem[field]) updatedItem[field] = [];
        updatedItem[field].push(updateObj.$push[field]);
      }
    }
    
    if (updateObj.$pull) {
      for (let field in updateObj.$pull) {
        if (Array.isArray(updatedItem[field])) {
          const filter = updateObj.$pull[field];
          if (filter && typeof filter === 'object' && filter.id) {
            updatedItem[field] = updatedItem[field].filter(el => el.id !== filter.id && el._id !== filter.id);
          } else {
            updatedItem[field] = updatedItem[field].filter(el => el !== filter);
          }
        }
      }
    }

    // Standard field updates (excluding Mongoose operators)
    for (let key in updateObj) {
      if (!key.startsWith('$')) {
        updatedItem[key] = updateObj[key];
      }
    }

    data[index] = updatedItem;
    writeData(collection, data);
    return updatedItem;
  },

  findByIdAndDelete: (collection, id) => {
    const data = readData(collection);
    const index = data.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return false;
    data.splice(index, 1);
    writeData(collection, data);
    return true;
  }
};

module.exports = jsonDb;
