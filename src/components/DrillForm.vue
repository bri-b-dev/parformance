<template>
  <form class="card" @submit.prevent="save">
    <div class="field"><label class="label">Titel</label><input class="input" v-model="model.title" required /></div>
    <div class="row">
      <div class="field" style="min-width:180px; flex:1"><label class="label">Kategorie</label>
        <select class="input" v-model="model.category" required>
          <option value="chipping">Chipping</option>
          <option value="putting">Putting</option>
          <option value="driving">Driving</option>
          <option value="irons">Irons</option>
          <option value="bunker">Bunker</option>
        </select>
      </div>
      <div class="field" style="min-width:160px"><label class="label">Schwierigkeit (1–5)</label>
        <input class="input" type="number" min="1" max="5" v-model.number="model.difficulty" />
      </div>
      <div class="field" style="min-width:160px"><label class="label">Dauer (Min)</label>
        <input class="input" type="number" min="1" v-model.number="model.durationMin" />
      </div>
    </div>


    <div class="field"><label class="label">Beschreibung</label><textarea class="input" v-model="model.description" rows="4" /></div>
    <div class="field"><label class="label">Tags (Komma-getrennt)</label><input class="input" v-model="tagsInput" placeholder="kurzspiel, draußen" /></div>


    <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:8px;">
      <button class="btn" type="button" @click="$router.back()">Abbrechen</button>
      <button class="btn btn-primary" type="submit">Speichern</button>
    </div>
  </form>
</template>