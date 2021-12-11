<script setup></script>

<template>
  <div class='header-content'>
    <router-link to="/">
      <div class='header-content__logo'>LOLOL</div>
    </router-link>
    <input type="text" class='header-content__search' />
    <div class='header-content__name'>Mfecane</div>
    <div class='header-content__face'></div>
  </div>
</template>

<style scoped lang="scss">
.header-content {
  height: 80px;
  display: flex;
  align-items: center;
  gap: 20px;
  justify-content: stretch;
}

.header-content__logo {
  flex: 0 0 30px;
  height: 30px;
  border-radius: 20px;
  background: var(--accent-color);
}

.header-content__search {
  flex: 1 0 300px;
  max-width: 500px;
  margin-right: auto;
  background: var(--accent-color-light);
  height: 30px;
  border-radius: 3px;
  padding: 2px 4px;
  color: #14475f;
  font-weight: 500;
  letter-spacing: 1px;
  border: 1px solid rgb(193, 200, 201);
}

.header-content__name {
  color: var(--accent-color);
  font-weight: bold;
  font-size: 16px;
}

.header-content__face {
  flex: 0 0 30px;
  height: 30px;
  border-radius: 20px;
  background: var(--accent-color);
}

.header__login {
  display: flex;
  gap: 12px;
  margin: 40px 0;
}
</style>