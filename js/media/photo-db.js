window.StrikeZonePhotos=(()=>{
  const DB='strikezone-media',STORE='photos',VERSION=2;
  function open(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB,VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id',autoIncrement:true})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
  async function add(blob,filter='Original',meta={}){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');const item={blob,filter,createdAt:Date.now(),type:meta.type||blob.type?.split('/')[0]||'image',title:meta.title||'StrikeZone',source:meta.source||'editor'};const req=tx.objectStore(STORE).add(item);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
  async function all(){const db=await open();return new Promise((resolve,reject)=>{const req=db.transaction(STORE).objectStore(STORE).getAll();req.onsuccess=()=>resolve(req.result.sort((a,b)=>b.createdAt-a.createdAt));req.onerror=()=>reject(req.error)})}
  async function remove(id){const db=await open();return new Promise((resolve,reject)=>{const req=db.transaction(STORE,'readwrite').objectStore(STORE).delete(id);req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error)})}
  return {add,all,remove};
})();
