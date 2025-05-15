<script setup lang="ts">
import { ref } from 'vue'
import { useDragAndDrop } from '@formkit/drag-and-drop/vue'

/* Feld-Array speichert Koordinaten */
const pitch = ref<{ id:number; name:string; x:number; y:number }[]>([])

/* FormKit DnD – gleiche Gruppe */
const [pitchRef, players] = useDragAndDrop(pitch, { group: 'players' , handleDragend(data, state) {
  console.log('Drag-and-Drop abgeschlossen:', data, state)
}})



/* Maus­position bei DragOver merken */
let lastPos = { x: 0, y: 0 }
function remember (e: DragEvent) {
  lastPos = { x: e.clientX, y: e.clientY }
  e.preventDefault()                   // Feld als Drop-Zone aktivieren
}

/* Beim Drop Koordinaten in Objekt schreiben/überschreiben */
function place (e: DragEvent) {
  e.preventDefault()
  const id = Number(e.dataTransfer!.getData('text/plain'))
  const player = players.value.find(p => p.id === id)
  if (!player || !pitchRef.value) return

  const r = pitchRef.value.getBoundingClientRect()
  player.x = lastPos.x - r.left - 32   // 32 = Kreis-Radius
  player.y = lastPos.y - r.top  - 32
}

/* Ghost auch beim Rückweg in die Bank */
function ghost (e: DragEvent, initial:string) {
  const g=document.createElement('div')
  g.textContent = initial
  Object.assign(g.style, ghostStyle)
  document.body.appendChild(g)
  e.dataTransfer!.setDragImage(g,32,32)
  requestAnimationFrame(()=>g.remove())
  e.dataTransfer!.setData('text/plain', String((e.currentTarget as HTMLElement).dataset.id))
}
const ghostStyle={
  width:'64px',height:'64px',borderRadius:'50%',background:'#3b82f6',
  color:'#fff',display:'flex',justifyContent:'center',alignItems:'center',
  fontWeight:'600',fontSize:'20px',
}
</script>

<template>
  <div
    ref="pitchRef"
    class="bg-green-200 p-4 rounded relative min-h-[300px] select-none"
    @dragover="remember"
    @drop="place"
  >


    <div
      v-for="p in players"
      :key="p.id"
      :data-id="p.id"
      class="absolute w-16 h-16 rounded-full bg-blue-500 text-white
             flex items-center justify-center shadow cursor-move"
      :style="{ left:p.x+'px', top:p.y+'px' }"
      draggable="true"
      @dragstart="e => ghost(e, p.name[0])"
    >
      {{ p.name[0] }}
    </div>
  </div>
</template>
