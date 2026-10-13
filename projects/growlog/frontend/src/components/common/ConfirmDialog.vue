<script setup lang="ts">
import BaseButton from './BaseButton.vue'
import BaseModal from './BaseModal.vue'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    confirmVariant?: 'primary' | 'secondary'
    busy?: boolean
  }>(),
  {
    confirmLabel: '삭제',
    cancelLabel: '취소',
    confirmVariant: 'primary',
    busy: false,
  },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <BaseModal :open="open" :title="title" @close="emit('cancel')">
    <p class="confirm-dialog__message">{{ message }}</p>
    <div class="confirm-dialog__actions">
      <BaseButton variant="secondary" :disabled="busy" @click="emit('cancel')">
        {{ cancelLabel }}
      </BaseButton>
      <BaseButton :variant="confirmVariant" :disabled="busy" @click="emit('confirm')">
        {{ busy ? '처리 중...' : confirmLabel }}
      </BaseButton>
    </div>
  </BaseModal>
</template>

<style scoped>
.confirm-dialog__message {
  margin: 0 0 var(--space-6);
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
}

.confirm-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}
</style>
