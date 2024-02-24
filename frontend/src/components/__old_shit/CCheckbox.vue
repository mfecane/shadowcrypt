<template>
  <div class='check-wrapper'>
    <input type="checkbox" class='styled-checkbox' :id="id" />
    <label :for="id">{{ props.label }}</label>
  </div>
</template>

<script setup lang="ts">
import _uniqueId from 'lodash/uniqueId'

const props = defineProps<{ label: string }>()
const id = _uniqueId('prefix-')
</script>

<style scoped lang="scss">
.check-wrapper {}

.styled-checkbox {
  position: absolute; // take it out of document flow
  opacity: 0; // hide it
}

.styled-checkbox+label {
  display: flex;
  flex-direction: column;
  font-size: 16px;
  font-weight: 600;
  align-items: center;
  position: relative;
  cursor: pointer;
  padding: 0;
  margin: 4px;
  gap: 8px;
}

.styled-checkbox+label:before {
  content: '';
  margin-right: 10px;
  display: inline-block;
  vertical-align: text-top;
  width: 120px;
  height: 120px;
  border-radius: 4px;
  background: white;
}

.styled-checkbox:checked+label:before {
  background: var(--accent-color);
}

.styled-checkbox:hover+label:before {
  background: var(--accent-color);
}

.styled-checkbox:focus+label:before {
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.12);
}

.styled-checkbox:disabled+label {
  color: #b8b8b8;
  cursor: auto;
}

.styled-checkbox:disabled+label:before {
  box-shadow: none;
  background: #ddd;
}

.styled-checkbox:checked+label:after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  background: white;
  width: 16px;
  height: 16px;
  box-shadow: 8px 0 0 white, 16px 0 0 white, 16px -8px 0 white,
    16px -16px 0 white, 16px -24px 0 white, 16px -32px 0 white;
  transform: translate(calc(-50% - 16px), calc(-50% - 8px)) rotate(45deg);
}
</style>