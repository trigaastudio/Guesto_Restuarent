import { getIO } from '../socket.js';

export default function socketPlugin(schema, options) {
  const emitDbChange = (operation, doc, modelNameFallback) => {
    try {
      const io = getIO();
      if (io) {
        const collectionName = doc?.constructor?.modelName || modelNameFallback || 'Unknown';
        io.emit('db_change', {
          collection: collectionName,
          operation: operation,
          docId: doc ? doc._id : null
        });
      }
    } catch (error) {
      
    }
  };

  schema.post('save', function (doc) {
    emitDbChange('SAVE', doc);
  });

  schema.post('findOneAndDelete', function (doc) {
    if (doc) emitDbChange('DELETE', doc);
  });

  schema.post('findOneAndRemove', function (doc) {
    if (doc) emitDbChange('DELETE', doc);
  });

  schema.post('deleteOne', { document: true, query: false }, function (doc) {
    emitDbChange('DELETE', doc);
  });

  schema.post('findOneAndUpdate', function (doc) {
    if (doc) emitDbChange('UPDATE', doc);
  });

  schema.post('updateOne', function () {
    try {
      const io = getIO();
      if (io) {
        const collectionName = this.model ? this.model.modelName : 'Unknown';
        io.emit('db_change', {
          collection: collectionName,
          operation: 'UPDATE'
        });
      }
    } catch (e) {}
  });

  schema.post('updateMany', function () {
    try {
      const io = getIO();
      if (io) {
        const collectionName = this.model ? this.model.modelName : 'Unknown';
        io.emit('db_change', {
          collection: collectionName,
          operation: 'UPDATE_MANY'
        });
      }
    } catch (e) {}
  });
  
  schema.post('deleteMany', function () {
    try {
      const io = getIO();
      if (io) {
        const collectionName = this.model ? this.model.modelName : 'Unknown';
        io.emit('db_change', {
          collection: collectionName,
          operation: 'DELETE_MANY'
        });
      }
    } catch (e) {}
  });
}
