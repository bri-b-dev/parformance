<template>
  <section class="row">
    <div class="card" style="flex:1 1 260px;">
      <h2 style="margin:0 0 8px 0;">Zufallsgenerator</h2>
      <div class="row">
        <div class="field" style="min-width:180px; flex:1">
          <label class="label">Kategorie</label>
          <select class="input" v-model="category">
            <option value="">Alle</option>
            <option value="chipping">Chipping</option>
            <option value="putting">Putting</option>
            <option value="driving">Driving</option>
            <option value="irons">Irons</option>
            <option value="bunker">Bunker</option>
          </select>
        </div>
        <div class="field" style="min-width:160px;">
          <label class="label">Max. Schwierigkeit</label>
          <input class="input" type="number" min="1" max="5" v-model.number="maxDifficulty" />
        </div>
        <div class="field" style="align-self:flex-end;">
          <button class="btn btn-primary" @click="roll">Ziehen</button>
        </div>
      </div>
    </div>


    <article v-if="result" class="card" style="flex:2 1 320px;">
      <h3 style="margin:0;">{{ result.title }}</h3>
      <p class="chip" style="display:inline-block; margin-top:6px;">★ {{ result.difficulty ?? 3 }}</p>
      <p style="color:var(--muted); margin:.5rem 0 0"><strong>Kategorie:</strong> {{ result.category }} · <strong>Dauer:</strong> {{ result.durationMin ?? '—' }} Min</p>
      <p style="margin:.5rem 0 0">{{ result.description }}</p>
      <div v-if="result.tags?.length" class="chips" style="margin-top:8px;">
        <span class="chip" v-for="t in result.tags" :key="t">{{ t }}</span>
      </div>
    </article>
  </section>
</template>