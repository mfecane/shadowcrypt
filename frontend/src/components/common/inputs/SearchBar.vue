<template>
    <div class="input_container">
        <input type="text" class='input_text2' v-model="model" />
        <Transition>
            <span class="hint" v-if="!model && props.hint">
                <Icon :type="IconType.search" :size="1.25" />
                {{ props.hint }}
            </span>
        </Transition>
        <Transition>
            <div class="clear_icon" v-if="model" @click="clear">
                <Icon :type="IconType.cross" :size="1" />
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">

import Icon from '@/components/common/icons/Icon.vue'

import { IconType } from '../icons/IconType';

const props = withDefaults(defineProps<{ hint: string }>(), {
    hint: ''
})

const model = defineModel<string>({ default: '' })

function clear() {
    model.value = ''
}

</script>

<style scoped lang="scss">
.clear_icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    cursor: pointer;

    & :deep(path) {
        fill: var(--accent-color);
    }

    &:hover :deep(path) {
        fill: var(--accent-color-dark);
    }
}

.input_container {
    margin: 0 16px;
    border: 1px solid var(--accent-color);
    display: flex;
    align-items: center;
    position: relative;
    padding: 8px 22px;
    min-height: 42px;
    background-color: white;
    border-radius: 999px;
    box-shadow: inset 0px 4px 8px 0px rgba(45, 47, 52, 0.15), inset 0px 2px 0px 0px rgba(45, 47, 52, 0.05);
}

.input_text2 {
    width: 100%;
    background-color: transparent;
    font-size: 18px;
    font-weight: 500;
    color: #394d6d;
}

input:focus~.hint {
    opacity: 0;
}

.hint {
    color: #a5aeb7;
    position: absolute;
    top: 50%;
    transform: translate(-2px, calc(-50% + 1px));
    pointer-events: none;
    display: flex;
    align-items: center;
}

.hint :deep(.icon) {
    margin-right: 6px;
}

.hint :deep(.icon path) {
    fill: #a5aeb7;
}

.v-enter-active,
.v-leave-active {
    transition: opacity 0.2s ease;
}

.v-enter-from,
.v-leave-to {
    opacity: 0;
}
</style>
