import {defineStore} from 'pinia';
import type {Drill, DrillCategory} from '@/types/drill';
import {Preferences} from '@capacitor/preferences';


const STORAGE_KEY = 'golftrainer.drills.v1';


export const useDrillStore = defineStore('drills', {
    state: () => ({
        drills: [] as Drill[],
        loaded: false,
    }),
    getters: {
        byCategory: (state) => (category?: DrillCategory) =>
            category ? state.drills.filter(d => d.category === category) : state.drills,
    },
    actions: {
        async load() {
            if (this.loaded) return;
            const {value} = await Preferences.get({key: STORAGE_KEY});
            if (value) {
                this.drills = JSON.parse(value) as Drill[];
            } else {
// Seed-Daten
                this.drills = [
                    {
                        id: crypto.randomUUID(),
                        title: 'Chippen: Landing Zone 3x3',
                        category: 'chipping',
                        difficulty: 2,
                        durationMin: 10,
                        description: '9 Felder um das Loch, je 5 Bälle. Punktewertung nach Nähe.',
                        updatedAt: new Date().toISOString()
                    },
                    {
                        id: crypto.randomUUID(),
                        title: 'Putting: Leiter',
                        category: 'putting',
                        difficulty: 2,
                        durationMin: 15,
                        description: 'Putte 1–5 m, jeweils 2 Putts hintereinander. Misslyck = zurück.',
                        updatedAt: new Date().toISOString()
                    },
                    {
                        id: crypto.randomUUID(),
                        title: 'Bunker: Zielkreise',
                        category: 'bunker',
                        difficulty: 3,
                        durationMin: 10,
                        description: '3 Zielkreise, je 10 Bälle, Punktewertung.',
                        updatedAt: new Date().toISOString()
                    },
                ];
                await this.persist();
            }
            this.loaded = true;
        },
        async persist() {
            await Preferences.set({key: STORAGE_KEY, value: JSON.stringify(this.drills)});
        },
        async add(drill: Omit<Drill, 'id' | 'updatedAt'>) {
            const newDrill: Drill = {...drill, id: crypto.randomUUID(), updatedAt: new Date().toISOString()};
            this.drills.push(newDrill);
            await this.persist();
            return newDrill;
        },
        async update(drill: Drill) {
            const idx = this.drills.findIndex(d => d.id === drill.id);
            if (idx !== -1) {
                this.drills[idx] = {...drill, updatedAt: new Date().toISOString()};
                await this.persist();
            }
        },
        async remove(id: string) {
            this.drills = this.drills.filter(d => d.id !== id);
            await this.persist();
        },
        random(options?: { category?: DrillCategory; maxDifficulty?: number; tag?: string }) {
            let pool = [...this.drills];
            if (options?.category) pool = pool.filter(d => d.category === options.category);
            if (options?.maxDifficulty) pool = pool.filter(d => (d.difficulty ?? 3) <= options.maxDifficulty!);
            if (options?.tag) pool = pool.filter(d => (d.tags ?? []).includes(options.tag!));
            if (pool.length === 0) return undefined;
            const i = Math.floor(Math.random() * pool.length);
            return pool[i];
        }
    }
});