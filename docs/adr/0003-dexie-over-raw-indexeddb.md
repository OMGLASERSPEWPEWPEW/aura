# ADR-0003: Dexie over Raw IndexedDB

## Status
Accepted

## Date
2025-01-01

## Context
Our local-first architecture (ADR-0001) requires client-side storage. IndexedDB is the only browser API suitable for storing structured data at scale. However, the raw IndexedDB API is notoriously difficult to use:

```javascript
// Raw IndexedDB - verbose and callback-based
const request = indexedDB.open('mydb', 1);
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const store = db.createObjectStore('profiles', { keyPath: 'id' });
  store.createIndex('name', 'name', { unique: false });
};
request.onsuccess = (event) => {
  const db = event.target.result;
  const tx = db.transaction('profiles', 'readwrite');
  const store = tx.objectStore('profiles');
  store.add({ id: 1, name: 'John' });
};
```

We evaluated several IndexedDB wrappers:
1. **Dexie.js** - Promise-based, excellent TypeScript support
2. **localForage** - Simple key-value API, less powerful
3. **idb** - Thin wrapper, still verbose
4. **PouchDB** - Sync-focused, heavyweight

## Decision
We chose **Dexie.js** as our IndexedDB wrapper:

```typescript
// Dexie - clean and typed
class AuraDB extends Dexie {
  profiles!: Table<Profile>;
  userIdentity!: Table<UserIdentity>;

  constructor() {
    super('AuraDB');
    this.version(1).stores({
      profiles: '++id, name, createdAt',
      userIdentity: 'id',
    });
  }
}
```

Key features used:
- Declarative schema with automatic migrations
- Full TypeScript support with generics
- Promise-based API
- Compound indexes and advanced queries

## Consequences

### Positive
- **Developer experience**: Clean, intuitive API
- **Type safety**: Full TypeScript integration
- **Migration support**: `db.version(n).stores()` handles schema changes
- **Query power**: Complex queries without raw IndexedDB complexity
- **Small bundle**: ~25KB minified

### Negative
- **Abstraction layer**: One more dependency to maintain
- **Learning curve**: Dexie-specific patterns vs. raw IndexedDB
- **Version lock-in**: Difficult to switch wrappers later
- **Debug complexity**: Errors sometimes obscured by wrapper

## Related
- Git commit: `3d88ce8` (Initial commit)
- `src/lib/db.ts` - Database schema and types
- ADR-0001: Local-First Architecture
