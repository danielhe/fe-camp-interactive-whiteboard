<template>
  <div id="app">
    <Room/>
  </div>
</template>

<script>
import Room from './pages/Room.vue';

export default {
  name: 'app',
  components: {
    Room
  }
};
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
</style>
