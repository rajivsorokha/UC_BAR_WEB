// One-time content updates for databases that already exist (a fresh install gets everything from seed.json).
// Each patch runs once, only ADDS missing content (never overwrites what you edited) and is then recorded.
const fs = require('fs'), path = require('path');
const seed = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'seed.json'), 'utf8'));

module.exports = [
  {
    id: '2026-10-label-machinery',
    async run(store) {
      const s = seed();
      // settings: only keys that are missing/empty
      const cur = (await store.get('settings', 'main')) || { id: 'main' };
      let changed = false;
      for (const k of ['machineTitle', 'machineCaption', 'machineSpecs', 'serviceTitle', 'serviceText', 'heroStyle']) if (!cur[k]) { cur[k] = s.settings[k]; changed = true; }
      if (changed) (await store.get('settings', 'main')) ? await store.update('settings', 'main', cur) : await store.insert('settings', cur);
      // category / product / FAQ if absent
      for (const [col, ids] of Object.entries({ categories: ['label-printing-machinery'], products: ['p-machine'], faqs: ['f-print'] })) {
        const have = new Set((await store.list(col)).map(x => x.id));
        for (const item of s[col].filter(x => ids.includes(x.id))) if (!have.has(item.id)) await store.insert(col, item);
      }
      // typo in the existing asset description ("Conver Belt")
      for (const e of await store.list('events')) if (e.description?.includes('Conver Belt')) await store.update('events', e.id, { ...e, description: e.description.replace('Conver Belt', 'Conveyor Belt') });
    },
  },
  {
    id: '2026-10-banner-slides',
    async run(store) {
      const seedData = seed();
      const cur = await store.get('settings', 'main');
      if (cur && (!cur.heroStyle || cur.heroStyle === 'machine')) await store.update('settings', 'main', { ...cur, heroStyle: 'slider' }); // old value from the single-machine banner
      if (!(await store.count('slides'))) for (const sl of seedData.slides) await store.insert('slides', sl);
    },
  },
];
