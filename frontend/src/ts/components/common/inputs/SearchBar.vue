
<template>
    <div class="input_container">
        <input type="text" class='input_text' v-model="model" />
        <span class="hint" v-if="!model && props.hint">{{ props.hint }}</span>
        <Transition>
            <div class="clear_icon" v-if="model">
                <IconCross color="#394d6d" @click="clear" />
            </div>
        </Transition>
    </div>
</template>
  
<script setup lang="ts">

import IconCross from '@/ts/components/common/icons/IconCross.vue'

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
}

.input_container {
    border: 1px solid #92b1d2;
    display: flex;
    align-items: center;
    position: relative;
    padding: 7px 12px;
    background-color: white;
    border-radius: 4px;
    box-shadow: inset 0px 4px 8px 0px rgba(45, 47, 52, 0.15), inset 0px 2px 0px 0px rgba(45, 47, 52, 0.05);
}

.input_text {
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
    transform: translateY(calc(-50% + 2px));
    pointer-events: none;
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
