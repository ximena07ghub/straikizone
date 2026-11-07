
window.StrikeZonePhotos = (() => {
  const DB = 'strikezone-media';
  const STORE = 'photos';
  const VERSION = 3;

  const USERS = 'strikezoneUsers';
  const SESSION = 'strikezoneSession';

  const emailOf = value =>
    String(value || '').trim().toLowerCase();

  // Identificador compatible con SZ-03.
  const userId = user =>
    typeof user.id === 'string' && user.id.trim()
      ? user.id
      : `legacy-${encodeURIComponent(emailOf(user.email))}`;

  // Validar cuenta y sesión activa.
  function currentSession() {
    try {
      const users = JSON.parse(
        localStorage.getItem(USERS) || '[]'
      );

      const saved = JSON.parse(
        localStorage.getItem(SESSION) || 'null'
      );

      if (
        !Array.isArray(users) ||
        !saved ||
        typeof saved !== 'object'
      ) {
        return null;
      }

      const email = emailOf(saved.email);

      const matching = users.filter(
        user => emailOf(user?.email) === email
      );

      if (matching.length !== 1) return null;

      const user = matching[0];
      const id = userId(user);

      if (
        !user.name ||
        !user.passwordHash ||
        (
          saved.id !== undefined &&
          saved.id !== id
        ) ||
        (
          saved.id === undefined &&
          saved.name !== user.name
        )
      ) {
        return null;
      }

      return {
        id,
        name: user.name,
        email
      };

    } catch (error) {
      console.error('Error al verificar sesión:', error);
      return null;
    }
  }

  function requireOwner() {
    const session = currentSession();

    if (!session?.id) {
      throw new Error(
        'Debes iniciar sesión para acceder a Mis Medios.'
      );
    }

    return session.id;
  }

  // Abrir IndexedDB sin borrar información existente.
  function open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB, VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        const transaction = request.transaction;

        const store = database.objectStoreNames.contains(STORE)
          ? transaction.objectStore(STORE)
          : database.createObjectStore(STORE, {
              keyPath: 'id',
              autoIncrement: true
            });

        // Índice nuevo sin modificar registros anteriores.
        if (!store.indexNames.contains('ownerId')) {
          store.createIndex('ownerId', 'ownerId', {
            unique: false
          });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(
          request.error ||
          new Error('No se pudo abrir IndexedDB.')
        );
      };

      request.onblocked = () => {
        reject(
          new Error(
            'Otra pestaña está bloqueando la actualización de Mis Medios.'
          )
        );
      };
    });
  }

  // Ejecutar una transacción completa.
  async function transaction(mode, work) {
    const database = await open();

    return new Promise((resolve, reject) => {
      let result;

      const tx = database.transaction(STORE, mode);
      const store = tx.objectStore(STORE);

      try {
        const request = work(store);

        if (request) {
          request.onsuccess = () => {
            result = request.result;
          };
        }
      } catch (error) {
        tx.abort();
        reject(error);
        return;
      }

      tx.oncomplete = () => {
        database.close();
        resolve(result);
      };

      tx.onerror = () => {
        database.close();
        reject(
          tx.error ||
          new Error('Error de almacenamiento.')
        );
      };

      tx.onabort = () => {
        database.close();
        reject(
          tx.error ||
          new Error('Operación cancelada.')
        );
      };
    });
  }

  // Guardar un medio con propietario.
  async function add(blob, filter = 'Original', meta = {}) {
    const ownerId = requireOwner();

    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new Error('El archivo multimedia está vacío.');
    }

    if (meta.ownerId && meta.ownerId !== ownerId) {
      throw new Error(
        'No puedes guardar medios para otra cuenta.'
      );
    }

    const item = {
      blob,
      ownerId,
      filter,
      createdAt: Number.isFinite(meta.createdAt)
        ? meta.createdAt
        : Date.now(),
      type:
        meta.type ||
        blob.type?.split('/')[0] ||
        'image',
      title: meta.title || 'StrikeZone',
      source: meta.source || 'editor'
    };

    if (
      typeof meta.cardId === 'string' &&
      meta.cardId
    ) {
      item.cardId = meta.cardId;
    }

    if (
      typeof meta.modelKey === 'string' &&
      meta.modelKey
    ) {
      item.modelKey = meta.modelKey;
    }

    const id = await transaction(
      'readwrite',
      store => store.add(item)
    );

    if (id == null) {
      throw new Error('No se confirmó el guardado.');
    }

    return id;
  }

  // Consultar solo medios de la cuenta activa.
  async function all() {
    const ownerId = requireOwner();

    const items = await transaction(
      'readonly',
      store => store.index('ownerId').getAll(ownerId)
    );

    return (items || []).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  // Eliminar exclusivamente un medio propio.
  async function remove(id) {
    const ownerId = requireOwner();

    if (!Number.isInteger(Number(id))) {
      throw new Error('Identificador de medio inválido.');
    }

    const numericId = Number(id);
    const database = await open();

    return new Promise((resolve, reject) => {
      const tx = database.transaction(
        STORE,
        'readwrite'
      );

      const store = tx.objectStore(STORE);
      const request = store.get(numericId);

      let allowed = false;

      request.onsuccess = () => {
        const item = request.result;

        if (!item || item.ownerId !== ownerId) {
          tx.abort();
          return;
        }

        allowed = true;
        store.delete(numericId);
      };

      tx.oncomplete = () => {
        database.close();
        resolve(allowed);
      };

      tx.onerror = () => {
        database.close();
        reject(
          tx.error ||
          new Error('No se pudo eliminar el medio.')
        );
      };

      tx.onabort = () => {
        database.close();
        reject(
          new Error(
            'El medio no existe o pertenece a otra cuenta.'
          )
        );
      };
    });
  }

  // Detectar medios anteriores sin dueño.
  async function legacyCount() {
    requireOwner();

    const items = await transaction(
      'readonly',
      store => store.getAll()
    );

    return (items || []).filter(
      item => !item.ownerId
    ).length;
  }

  return {
    add,
    all,
    remove,
    legacyCount
  };
})();
