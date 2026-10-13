<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    type?: string
    required?: boolean
    errorMessage?: string
    autocomplete?: string
  }>(),
  {
    type: 'text',
    required: false,
    errorMessage: '',
    autocomplete: undefined,
  },
)

const model = defineModel<string>({ required: true })
</script>

<template>
  <label class="base-input">
    <span class="base-input__label">{{ label }}</span>
    <input
      v-model="model"
      :type="type"
      :required="required"
      :autocomplete="autocomplete"
      class="base-input__field"
      :class="{ 'has-error': !!errorMessage }"
    />
    <span v-if="errorMessage" class="base-input__error">{{ errorMessage }}</span>
  </label>
</template>

<style scoped>
.base-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.base-input__field {
  padding: var(--space-3);
  font-size: var(--font-size-base);
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition: border-color 0.15s;
}

.base-input__field:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-bg);
}

.base-input__field:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.base-input__field.has-error {
  border-color: var(--color-error);
}

.base-input__error {
  color: var(--color-error);
  font-size: var(--font-size-sm);
}
</style>
