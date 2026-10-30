<template>
  <a-modal
    :open="visible"
    title="Nuevo Almacén"
    :confirm-loading="loading"
    ok-text="Guardar Almacén"
    cancel-text="Cancelar"
    width="500px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <div class="space-y-4 py-2">
      <a-form ref="formRef" :model="formState" layout="vertical">
        <a-form-item
          label="Nombre del Almacén"
          name="nombre"
          :rules="[{ required: true, message: 'Ingrese el nombre del almacén' }]"
        >
          <a-input
            v-model:value="formState.nombre"
            placeholder="Ej. Almacén Central, Nevera, Tienda..."
            allow-clear
          />
        </a-form-item>

        <!-- Localizaciones Dinámicas -->
        <div class="space-y-2 border-t border-slate-200 pt-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700">Localizaciones</span>
            <span class="text-xs text-slate-400">{{ formState.locations.length }} agregada(s)</span>
          </div>

          <!-- Input para agregar localización -->
          <div class="flex gap-2">
            <a-input
              v-model:value="newLocationName"
              placeholder="Ej. Estante 1, Nevera Bebidas, Pasillo A..."
              class="flex-1"
              @press-enter="addLocation"
            />
            <a-button
              type="primary"
              class="border-none bg-qvaflow-navy"
              :disabled="!newLocationName.trim()"
              @click="addLocation"
            >
              Agregar
            </a-button>
          </div>

          <!-- Lista de localizaciones añadidas -->
          <div
            v-if="formState.locations.length > 0"
            class="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2"
          >
            <div
              v-for="(loc, index) in formState.locations"
              :key="index"
              class="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-1.5 text-xs"
            >
              <div class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span class="font-medium text-slate-800">{{ loc.nombre }}</span>
              </div>
              <button
                type="button"
                class="cursor-pointer p-0.5 text-xs font-bold text-red-500 hover:text-red-700"
                title="Eliminar"
                @click="removeLocation(index)"
              >
                ✕
              </button>
            </div>
          </div>
          <div v-else class="text-xs italic text-slate-400">
            Agrega al menos una localización para este almacén.
          </div>
        </div>
      </a-form>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue/es/form'

interface Props {
  visible: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'submit', payload: { nombre: string; locations: { nombre: string }[] }): void
}>()

const formRef = ref<FormInstance>()
const newLocationName = ref<string>('')

const formState = reactive({
  nombre: '',
  locations: [{ nombre: 'Mostrador / General' }] as { nombre: string }[],
})

const addLocation = () => {
  const val = newLocationName.value.trim()
  if (!val) return

  if (formState.locations.some((l) => l.nombre.toLowerCase() === val.toLowerCase())) {
    message.warning('Ya existe una localización con este nombre.')
    return
  }

  formState.locations.push({ nombre: val })
  newLocationName.value = ''
}

const removeLocation = (index: number) => {
  formState.locations.splice(index, 1)
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    if (formState.locations.length === 0) {
      message.error('Debe ingresar al menos una localización física.')
      return
    }

    emit('submit', {
      nombre: formState.nombre.trim(),
      locations: [...formState.locations],
    })

    formState.nombre = ''
    formState.locations = [{ nombre: 'Mostrador / General' }]
  } catch {
    // Validación fallida
  }
}

const handleCancel = () => {
  emit('update:visible', false)
}
</script>
